// The live agent, as four short steps. Each step fits inside one serverless
// call (under 60 seconds), so the browser can show progress between them.
//
//   discover   -> identify the app, its official domains and developer portal
//   research   -> three grounded investigations run in parallel (register, review, limits)
//   synthesize -> write the guide from the findings only, citing source ids
//   verify     -> re-fetch cited pages to check quotes, probe the portal, grade the evidence

import { generate, extractJson } from './gemini.mjs';
import { discoverPrompt, researchPrompt, synthesizePrompt, FACET_KEYS } from './prompts.mjs';
import { resolveRedirect, classify, probe, checkQuote, hostOf } from './sources.mjs';

export { FACET_KEYS };

const today = () => new Date().toISOString().slice(0, 10);

export function slugify(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

const squash = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Match an app against Composio's OAuth toolkit catalog. Exact name, slug or website host. */
export function matchComposio(directory, { app, website, query } = {}) {
  const apps = directory?.apps || [];
  const keys = [app, query].filter(Boolean).map(squash);
  const host = hostOf(website || '');
  const hostKey = host ? squash(host.split('.').slice(-2, -1)[0]) : '';
  for (const k of keys) {
    const hit = apps.find((a) => squash(a.name) === k || squash(a.toolkit) === k);
    if (hit) return hit;
  }
  if (hostKey) {
    const hit = apps.find((a) => squash(a.name) === hostKey || squash(a.toolkit) === hostKey);
    if (hit) return hit;
  }
  return null;
}

// ---------- step 1: discover ----------
export async function discover(query) {
  const r = await generate({ prompt: discoverPrompt(query), search: true, urlContext: true, timeoutMs: 60000 });
  const d = extractJson(r.text);
  if (!d || typeof d !== 'object') throw new Error('Could not identify the app from the model response');
  const domains = new Set((d.official_domains || []).map((x) => hostOf(x.includes('://') ? x : `https://${x}`)).filter(Boolean));
  for (const u of [d.website, d.developer_portal, d.oauth_docs_url]) if (u) domains.add(hostOf(u));
  return {
    query,
    app: d.app || query,
    provider: d.provider || d.app || query,
    website: d.website || null,
    category: d.category || 'Other',
    official_domains: [...domains].filter(Boolean),
    developer_portal: d.developer_portal || null,
    oauth: ['yes', 'no', 'unclear'].includes(d.oauth) ? d.oauth : 'unclear',
    oauth_docs_url: d.oauth_docs_url || null,
    other_auth: Array.isArray(d.other_auth) ? d.other_auth : [],
    is_real_app: d.is_real_app !== false,
    notes: d.notes || '',
    trace: { queries: r.queries, model: r.model },
  };
}

// ---------- step 2: research (one facet) ----------
// Normal mode searches and then reads the official pages (better quotes, slower).
// Fast mode searches only; callers use it as a retry when a normal run times out.
export async function research(facet, discovery, { fast = false } = {}) {
  const r = await generate({ prompt: researchPrompt(facet, discovery), search: true, urlContext: !fast, timeoutMs: fast ? 60000 : 90000 });
  const parsed = extractJson(r.text) || {};
  const findings = Array.isArray(parsed.findings) ? parsed.findings : [];
  if (!findings.length) {
    // Usually prose instead of JSON, or a cut-off answer. Callers retry in fast mode.
    const err = new Error(`No findings returned for ${facet} (${(r.text || '').length} chars, finish ${r.finishReason})`);
    err.userMessage = 'The research step returned no usable findings';
    throw err;
  }
  const resolved = await Promise.all(
    findings
      .filter((f) => f && f.claim && f.url)
      .slice(0, 14)
      .map(async (f) => ({
        claim: String(f.claim).slice(0, 400),
        url: await resolveRedirect(String(f.url)),
        quote: String(f.quote || '').slice(0, 400),
      })),
  );
  // Grounding chunks are the pages search actually returned. Keep them as a trace.
  const grounded = await Promise.all(r.chunks.slice(0, 10).map(async (c) => ({ title: c.title, url: await resolveRedirect(c.uri) })));
  return {
    facet,
    findings: resolved,
    open_questions: Array.isArray(parsed.open_questions) ? parsed.open_questions.slice(0, 8).map(String) : [],
    trace: { queries: r.queries, grounded, urlsRead: r.urlsRead, model: r.model, mode: fast ? 'search-only' : 'search+read' },
  };
}

// ---------- step 3: synthesize ----------
function buildSources(discovery, researchResults) {
  const byUrl = new Map();
  for (const res of researchResults) {
    for (const f of res.findings || []) {
      // An unresolved search redirect is not a citable page.
      if (/vertexaisearch\.cloud\.google\.com/.test(f.url)) continue;
      const key = f.url.replace(/#.*$/, '');
      if (!byUrl.has(key)) byUrl.set(key, { url: key, claims: [], quotes: [] });
      const s = byUrl.get(key);
      s.claims.push(f.claim);
      if (f.quote) s.quotes.push(f.quote);
    }
  }
  let i = 0;
  return [...byUrl.values()].slice(0, 30).map((s) => ({
    id: `s${++i}`,
    url: s.url,
    kind: classify(s.url, discovery.official_domains, [discovery.app, discovery.provider, discovery.query]),
    claims: s.claims.slice(0, 4),
    quote: s.quotes[0] || '',
    title: hostOf(s.url),
  }));
}

const ENUMS = {
  tier: ['instant', 'light-review', 'formal-review', 'partner-gated'],
  basis: ['official', 'community-reported', 'estimate'],
  conf: ['high', 'medium', 'low'],
  owner: ['you', 'agent', 'provider'],
  impact: ['none', 'review', 'security-assessment', 'partner-only'],
  required: ['no', 'for-public-distribution', 'for-sensitive-scopes', 'for-production-access', 'always'],
  cost: ['free', 'paid', 'varies'],
};
const pick = (v, list, dflt) => (list.includes(v) ? v : dflt);
const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v, d = '') => (typeof v === 'string' ? v : v == null ? d : String(v));

export async function synthesize(discovery, researchResults, composio) {
  const sources = buildSources(discovery, researchResults);
  const openQuestions = researchResults.flatMap((r) => r.open_questions || []);
  // Check the evidence BEFORE writing: re-read each cited page and look for its quote,
  // so the writer knows which claims are really on the page. Outdated third-party
  // claims then cannot drive the verdict. Bounded to keep the step under 60 seconds.
  await Promise.all(sources.map(async (s) => (s.quote_check = s.quote ? await checkQuote(s.url, s.quote, 6000) : 'unreadable')));
  const r = await generate({ prompt: synthesizePrompt({ discovery, composio, sources, openQuestions }), json: true, temperature: 0.2, timeoutMs: 120000 });
  const raw = extractJson(r.text);
  if (!raw) throw new Error('The model did not return a readable guide');
  return normalizeGuide(raw, { discovery, composio, sources, openQuestions, model: r.model });
}

export function normalizeGuide(raw, { discovery, composio, sources, openQuestions = [], model }) {
  const ids = new Set(sources.map((s) => s.id));
  const kindOf = Object.fromEntries(sources.map((s) => [s.id, s.kind]));
  const cite = (v) => arr(v).map(String).filter((id) => ids.has(id));
  const strong = (list) => list.some((id) => kindOf[id] === 'official' || kindOf[id] === 'composio');

  const v = raw.verdict || {};
  const phases = arr(raw.phases)
    .slice(0, 6)
    .map((p) => ({
      name: str(p.name, 'Step'),
      duration: str(p.duration),
      steps: arr(p.steps)
        .slice(0, 8)
        .map((s) => {
          const src = cite(s.sources);
          // Evidence is graded here, not by the model: "sourced" needs an official or Composio citation.
          const evidence = s.evidence === 'uncertain' || !strong(src) ? 'uncertain' : 'sourced';
          return { text: str(s.text), owner: pick(s.owner, ENUMS.owner, 'you'), evidence, sources: src };
        })
        .filter((s) => s.text),
    }))
    .filter((p) => p.steps.length);

  const appSlug = slugify(discovery.app);
  return {
    slug: appSlug,
    app: str(discovery.app),
    provider: str(discovery.provider),
    website: discovery.website,
    developer_portal: discovery.developer_portal,
    category: str(discovery.category, 'Other'),
    origin: 'live-agent',
    last_checked: today(),
    one_liner: str(raw.one_liner),
    verdict: {
      tier: pick(v.tier, ENUMS.tier, 'light-review'),
      difficulty: Math.min(5, Math.max(1, Math.round(Number(v.difficulty) || 3))),
      hands_on: str(v.hands_on, 'Unknown'),
      approval_wait: str(v.approval_wait, 'Unknown'),
      total_to_production: str(v.total_to_production, 'Unknown'),
      wait_basis: pick(v.wait_basis, ENUMS.basis, 'estimate'),
      confidence: pick(v.confidence, ENUMS.conf, 'low'),
    },
    start_today: {
      summary: str(raw.start_today?.summary),
      limits_before_approval: arr(raw.start_today?.limits_before_approval).map(String),
    },
    composio: {
      managed_app: composio ? !!composio.managed : null,
      toolkit: composio?.toolkit || null,
      note: str(raw.composio_note),
      catalog_url: 'https://docs.composio.dev/toolkits/managed-auth',
    },
    prerequisites: arr(raw.prerequisites).map((p) => ({ item: str(p.item), detail: str(p.detail), cost: pick(p.cost, ENUMS.cost, 'varies'), sources: cite(p.sources) })).filter((p) => p.item),
    phases,
    scopes: arr(raw.scopes).slice(0, 15).map((s) => ({ scope: str(s.scope), purpose: str(s.purpose), review_impact: pick(s.review_impact, ENUMS.impact, 'review'), sources: cite(s.sources) })).filter((s) => s.scope),
    approval: {
      required: pick(raw.approval?.required, ENUMS.required, 'for-public-distribution'),
      trigger: str(raw.approval?.trigger),
      reviewers_check: arr(raw.approval?.reviewers_check).map(String),
      typical_wait: str(raw.approval?.typical_wait, 'Unknown'),
      common_rejections: arr(raw.approval?.common_rejections).map(String),
      sources: cite(raw.approval?.sources),
    },
    blockers: arr(raw.blockers).map((b) => ({ blocker: str(b.blocker), fix: str(b.fix), sources: cite(b.sources) })).filter((b) => b.blocker),
    agent_split: {
      agent_can: arr(raw.agent_split?.agent_can).map(String),
      you_must: arr(raw.agent_split?.you_must).map(String),
      provider_controls: arr(raw.agent_split?.provider_controls).map(String),
    },
    sources: sources.map(({ id, url, kind, quote, title, quote_check }) => ({ id, title, url, kind, quote, quote_check, accessed: today() })),
    tested: [],
    uncertain: [...new Set([...arr(raw.uncertain).map(String), ...openQuestions])].slice(0, 12),
    agent: { model, discovery_notes: discovery.notes, oauth: discovery.oauth, oauth_docs_url: discovery.oauth_docs_url },
  };
}

// ---------- step 4: verify ----------
export async function verify(guide) {
  const cited = new Set();
  const walk = (list) => list.forEach((id) => cited.add(id));
  guide.phases.forEach((p) => p.steps.forEach((s) => walk(s.sources)));
  [guide.prerequisites, guide.scopes, guide.blockers].forEach((l) => l.forEach((x) => walk(x.sources)));
  walk(guide.approval.sources);

  // 1. Quote checks. Synthesis already checked every source; re-check only what it could not.
  const toCheck = guide.sources.filter((s) => s.quote && cited.has(s.id) && !['found', 'not-found'].includes(s.quote_check)).slice(0, 10);
  await Promise.all(toCheck.map(async (s) => (s.quote_check = await checkQuote(s.url, s.quote))));
  for (const s of guide.sources) s.quote_check = s.quote_check || 'not-checked';
  const results = guide.sources.filter((s) => cited.has(s.id)).map((s) => [s.id, s.quote_check]);

  // A step whose only supporting quotes were not found on the page drops to uncertain.
  const failed = new Set(results.filter(([, r]) => r === 'not-found').map(([id]) => id));
  for (const p of guide.phases) {
    for (const s of p.steps) {
      if (s.evidence === 'sourced' && s.sources.length && s.sources.every((id) => failed.has(id))) {
        s.evidence = 'uncertain';
        s.note = 'Quoted text was not found on the cited page.';
      }
    }
  }

  // 2. Probe the developer portal and OAuth docs: no account, no credentials.
  const targets = [
    ['Developer portal responds', guide.developer_portal],
    ['OAuth documentation responds', guide.agent?.oauth_docs_url],
  ].filter(([, u]) => u);
  const probes = await Promise.all(targets.map(async ([what, url]) => ({ what, ...(await probe(url)) })));
  guide.tested = probes.map((p) => ({
    what: `${p.what}: GET ${p.url}`,
    result: p.status ? `HTTP ${p.status}${p.finalUrl && p.finalUrl !== p.url ? ` (redirected to ${p.finalUrl})` : ''}` : `No response (${p.error})`,
    date: today(),
  }));

  // 3. Grade the evidence so the reader sees it up front.
  const steps = guide.phases.flatMap((p) => p.steps);
  const sourced = steps.filter((s) => s.evidence === 'sourced').length;
  const stats = {
    steps: steps.length,
    sourced,
    uncertain: steps.length - sourced,
    official_sources: guide.sources.filter((s) => s.kind === 'official').length,
    community_sources: guide.sources.filter((s) => s.kind === 'community').length,
    quotes_found: results.filter(([, r]) => r === 'found').length,
    quotes_not_found: failed.size,
    quotes_unreadable: results.filter(([, r]) => r === 'unreadable').length,
  };
  guide.evidence_stats = stats;
  if (steps.length && sourced / steps.length < 0.5) guide.verdict.confidence = 'low';
  if (failed.size) guide.uncertain.push(`${failed.size} quoted passage(s) were not found on the cited page when re-checked; those claims may be paraphrased or out of date.`);
  if (guide.verdict.wait_basis !== 'official') guide.uncertain.push(`The approval wait (${guide.verdict.approval_wait}) is ${guide.verdict.wait_basis === 'estimate' ? 'an estimate' : 'reported by developers, not published by the provider'}.`);
  guide.uncertain = [...new Set(guide.uncertain)];
  return guide;
}
