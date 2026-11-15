// Minimal Gemini REST client with Google Search grounding and URL context.
// No SDK: one fetch call, so it runs the same in Netlify Functions and in Node scripts.

const API = 'https://generativelanguage.googleapis.com/v1beta/models';

export const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash';

export class ModelError extends Error {
  constructor(message, { status, code, userMessage, keyProblem, retryMs } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.userMessage = userMessage || message;
    this.keyProblem = keyProblem || null; // credits | daily-quota | rate | invalid
    this.retryMs = retryMs || 0;
  }
}

// ---------- key failover ----------
// Keys come from GEMINI_API_KEYS (comma-separated) and/or GEMINI_API_KEY, GEMINI_API_KEY_2 ... _10.
// Keys are tried in order. When a key fails for a key-specific reason (no credits, daily quota,
// per-minute limit, invalid key) it is benched for a while and the same request goes to the next key.
// Bench state lives in memory, so a fresh serverless instance re-learns it with one quick failed call.

export function listKeys() {
  const keys = [];
  const add = (k) => {
    const v = String(k || '').trim().replace(/^["']|["']$/g, '');
    if (v && !keys.includes(v)) keys.push(v);
  };
  String(process.env.GEMINI_API_KEYS || '').split(',').forEach(add);
  add(process.env.GEMINI_API_KEY);
  for (let i = 2; i <= 10; i++) add(process.env[`GEMINI_API_KEY_${i}`]);
  return keys;
}

const benched = new Map(); // key -> timestamp when it may be tried again
const BENCH_MS = { credits: 6 * 3600e3, 'daily-quota': 6 * 3600e3, rate: 60e3, invalid: 24 * 3600e3 };

function bench(key, err) {
  const ms = err.keyProblem === 'daily-quota' && err.retryMs ? Math.min(err.retryMs, 24 * 3600e3) : BENCH_MS[err.keyProblem];
  benched.set(key, Date.now() + ms);
}

async function callWithKeys(model, opts) {
  const keys = listKeys();
  if (!keys.length) throw new ModelError('No GEMINI_API_KEY configured', { userMessage: 'The agent is not configured: no model API key on the server.' });
  const now = Date.now();
  const ready = keys.filter((k) => (benched.get(k) || 0) <= now);
  // If every key is benched, try them all anyway: a quota may have reset early.
  const order = ready.length ? ready : keys;
  let last;
  for (const key of order) {
    try {
      return await call(model, opts, key);
    } catch (err) {
      if (!(err instanceof ModelError) || !err.keyProblem) throw err; // not about the key: do not burn other keys
      bench(key, err);
      last = err;
    }
  }
  if (order.length > 1) last.userMessage = `All ${order.length} model keys are out of quota or credits right now. ${last.userMessage}`;
  throw last;
}

/**
 * @param {object} opts
 * @param {string} opts.prompt
 * @param {string} [opts.system]
 * @param {boolean} [opts.search]   enable Google Search grounding
 * @param {boolean} [opts.urlContext] let the model read URLs it finds or is given
 * @param {boolean} [opts.json]     ask for application/json output (only without tools)
 * @param {number} [opts.temperature]
 * @param {number} [opts.timeoutMs]
 * @param {string} [opts.model]
 */
export async function generate(opts) {
  if (process.env.GEMINI_MOCK === '1') {
    const { mockGenerate } = await import('./mock.mjs');
    return mockGenerate(opts);
  }
  const model = opts.model || DEFAULT_MODEL;
  try {
    // Overload errors (500/503) are usually brief: retry twice with a short pause.
    for (let attempt = 0; ; attempt++) {
      try {
        return await callWithKeys(model, opts);
      } catch (err) {
        const transient = err instanceof ModelError && (err.status === 503 || err.status === 500);
        if (!transient || attempt >= 2) throw err;
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  } catch (err) {
    // A model name that does not exist or does not support a tool: retry once on the fallback.
    if (model !== FALLBACK_MODEL && err instanceof ModelError && !err.keyProblem && (err.status === 404 || err.status === 400)) {
      return callWithKeys(FALLBACK_MODEL, opts);
    }
    throw err;
  }
}

async function call(model, { prompt, system, search, urlContext, json, temperature = 0.2, timeoutMs = 50000 }, key) {
  const tools = [];
  if (search) tools.push({ google_search: {} });
  if (urlContext) tools.push({ url_context: {} });

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  if (tools.length) body.tools = tools;
  if (json && !tools.length) body.generationConfig.responseMimeType = 'application/json';

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${API}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw new ModelError('Model call timed out', { userMessage: 'The model took too long to answer. Try again.' });
    throw new ModelError(`Model request failed: ${err.message}`);
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const e = data.error || {};
    const status = e.code || res.status;
    let userMessage = `Model error ${status}: ${e.message || res.statusText}`;
    const quotaIds = (e.details || []).flatMap((d) => d.violations || []).map((v) => v.quotaId || '').join(' ');
    const retry = (e.details || []).map((d) => d.retryDelay).find(Boolean);
    const retryMs = retry ? parseFloat(retry) * 1000 : 0;
    let keyProblem = null;
    if (status === 402 || /prepayment credits/i.test(e.message || '')) {
      keyProblem = 'credits';
      userMessage = 'The agent has run out of model credits. The library guides still work; live generation is paused until credits are added.';
    } else if (status === 429 && /PerDay/i.test(quotaIds)) {
      keyProblem = 'daily-quota';
      userMessage = "The agent has used today's model quota. The library guides still work; live generation resumes when the quota resets.";
    } else if (status === 429) {
      keyProblem = 'rate';
      userMessage = 'The model is rate limited right now. Wait a minute and try again.';
    } else if (status === 403 || /API_KEY_INVALID|API key not valid|PERMISSION_DENIED/i.test(`${e.message} ${e.status} ${JSON.stringify(e.details || [])}`)) {
      keyProblem = 'invalid';
      userMessage = 'The model API key was rejected.';
    } else if (status === 503 || status === 500) {
      userMessage = 'The model provider is overloaded right now. Wait a moment and try again.';
    }
    throw new ModelError(`${e.message || `HTTP ${res.status}`}${quotaIds ? ` [${quotaIds}]` : ''}`, { status, code: e.status, userMessage, keyProblem, retryMs });
  }

  const cand = data.candidates?.[0] || {};
  const text = (cand.content?.parts || []).map((p) => p.text || '').join('');
  const gm = cand.groundingMetadata || {};
  const um = cand.urlContextMetadata || cand.url_context_metadata || {};

  return {
    model,
    text,
    finishReason: cand.finishReason,
    queries: gm.webSearchQueries || [],
    chunks: (gm.groundingChunks || []).map((c) => ({ uri: c.web?.uri, title: c.web?.title })).filter((c) => c.uri),
    supports: (gm.groundingSupports || []).map((s) => ({
      text: s.segment?.text,
      chunks: s.groundingChunkIndices || [],
    })),
    urlsRead: (um.urlMetadata || um.url_metadata || []).map((u) => ({
      url: u.retrievedUrl || u.retrieved_url,
      status: u.urlRetrievalStatus || u.url_retrieval_status,
    })),
    usage: data.usageMetadata || null,
  };
}

/** Pull the first JSON object or array out of model text (handles ```json fences and stray prose). */
export function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [];
  if (fenced) candidates.push(fenced[1]);
  candidates.push(text);
  for (const c of candidates) {
    const t = c.trim();
    try {
      return JSON.parse(t);
    } catch {}
    const start = t.search(/[[{]/);
    if (start === -1) continue;
    const open = t[start];
    const close = open === '{' ? '}' : ']';
    const end = t.lastIndexOf(close);
    if (end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch {}
    }
  }
  return null;
}
