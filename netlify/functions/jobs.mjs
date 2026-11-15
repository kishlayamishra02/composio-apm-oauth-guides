// POST /api/jobs               { query, force? } -> create a job and start the agent in the background
// POST /api/jobs/:id/continue                    -> carry on after "a guide already exists" / "no OAuth"
// GET  /api/jobs/:id                             -> job progress (the browser polls this)
//
// The agent itself runs in agent-background.mjs (up to 15 minutes), so slow model
// answers never hit the 60-second limit of normal functions. Job state lives in
// Netlify Blobs: the browser only holds a job id and cannot inject research into a guide.

import { getStore } from '@netlify/blobs';
import { createHash, randomUUID } from 'node:crypto';
import { json } from '../../lib/stream.mjs';
import { FACET_KEYS } from '../../lib/prompts.mjs';
import { runSecret } from '../../lib/secret.mjs';

const PER_IP_DAILY = Number(process.env.RATE_LIMIT_PER_IP || 12);
const GLOBAL_DAILY = Number(process.env.RATE_LIMIT_GLOBAL || 150);

const jobs = () => getStore({ name: 'jobs', consistency: 'strong' });
const meta = () => getStore({ name: 'meta', consistency: 'strong' });

async function rateLimit(ip) {
  const day = new Date().toISOString().slice(0, 10);
  const who = createHash('sha256').update(`${ip}|${process.env.RATE_SALT || 'oauth-guides'}`).digest('hex').slice(0, 16);
  const store = meta();
  const ipKey = `rl/${day}/${who}`;
  const allKey = `rl/${day}/all`;
  const [mine, all] = await Promise.all([store.get(ipKey, { type: 'json' }), store.get(allKey, { type: 'json' })]);
  if ((mine?.n || 0) >= PER_IP_DAILY) return `Daily limit reached for your network (${PER_IP_DAILY} guides). The library guides are still available.`;
  if ((all?.n || 0) >= GLOBAL_DAILY) return 'The demo has reached its daily generation limit. The library guides are still available.';
  await Promise.all([store.setJSON(ipKey, { n: (mine?.n || 0) + 1 }), store.setJSON(allKey, { n: (all?.n || 0) + 1 })]);
  return null;
}

async function trigger(req, id, phase) {
  const res = await fetch(new URL('/api/agent-run', req.url), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-run-secret': runSecret() },
    body: JSON.stringify({ id, phase }),
  });
  if (res.status >= 400) throw new Error(`Could not start the agent (HTTP ${res.status}).`);
}

export default async (req, context) => {
  const { id, step } = context.params || {};

  if (req.method === 'GET' && id) {
    const state = await jobs().get(`${id}/state`, { type: 'json' });
    if (!state) return json({ error: 'Job not found or expired.' }, 404);
    return json({ ...state, facets: FACET_KEYS });
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  if (id && step === 'continue') {
    const state = await jobs().get(`${id}/state`, { type: 'json' });
    if (!state) return json({ error: 'Job not found or expired.' }, 404);
    if (state.status !== 'awaiting-choice') return json({ error: 'This job is not waiting for a choice.' }, 409);
    state.status = 'queued-rest';
    await jobs().setJSON(`${id}/state`, state);
    await trigger(req, id, 'rest');
    return json({ job: id });
  }

  if (id) return json({ error: 'Unknown step.' }, 404);

  const body = await req.json().catch(() => ({}));
  const query = String(body.query || '').trim().slice(0, 120);
  if (query.length < 2) return json({ error: 'Type an app name or website.' }, 400);
  const limited = await rateLimit(context.ip || 'unknown');
  if (limited) return json({ error: limited }, 429);

  const jobId = randomUUID();
  await jobs().setJSON(`${jobId}/state`, { id: jobId, query, force: !!body.force, status: 'queued', created: Date.now(), steps: {} });
  await trigger(req, jobId, 'start');
  return json({ job: jobId });
};

export const config = { path: ['/api/jobs', '/api/jobs/:id', '/api/jobs/:id/:step'] };
