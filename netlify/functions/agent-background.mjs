// Background function (up to 15 minutes): runs the research agent for one job and
// saves its progress to Netlify Blobs after every step. The browser polls
// GET /api/jobs/:id to show the trace. Model calls can be slow, so nothing here is
// bound by the 60-second limit of normal functions.
//
// Triggered only by jobs.mjs, with a shared secret. A job runs once per phase:
// the status check below makes duplicate triggers and Netlify's automatic retries no-ops.

import { getStore } from '@netlify/blobs';
import { discover, research, synthesize, verify, matchComposio, slugify, FACET_KEYS } from '../../lib/pipeline.mjs';

const CACHE_DAYS = 14;
import { runSecret } from '../../lib/secret.mjs';

async function staticJson(req, path) {
  try {
    const res = await fetch(new URL(path, req.url));
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export default async (req) => {
  if (req.headers.get('x-run-secret') !== runSecret()) return;
  const { id, phase } = await req.json().catch(() => ({}));
  if (!id) return;

  const jobs = getStore({ name: 'jobs', consistency: 'strong' });
  const guides = getStore({ name: 'guides', consistency: 'strong' });
  const state = await jobs.get(`${id}/state`, { type: 'json' });
  if (!state) return;
  const expected = phase === 'rest' ? 'queued-rest' : 'queued';
  if (state.status !== expected) return; // already running, finished, or a retry

  // Serialise writes: parallel research facets update one shared state object.
  let chain = Promise.resolve();
  const save = () => (chain = chain.then(() => jobs.setJSON(`${id}/state`, state)).catch((e) => console.error('save failed', e)));
  const step = (name, patch) => {
    const prev = state.steps[name] || {};
    state.steps[name] = { ...prev, ...patch, startedAt: prev.startedAt || Date.now(), at: Date.now() };
    return save();
  };

  state.status = 'running';
  await save();

  try {
    if (phase !== 'rest') {
      await step('discover', { status: 'running' });
      const d = await discover(state.query);
      const directory = await staticJson(req, '/data/directory.json');
      state.discovery = d;
      state.composio = matchComposio(directory, { app: d.app, website: d.website, query: state.query });
      state.slug = slugify(d.app);
      await step('discover', { status: 'done' });

      // Stop and ask before spending more research when a guide exists or the app looks wrong.
      let existing = null;
      if (!state.force) {
        const library = await staticJson(req, '/data/library.json');
        const seed = library?.guides?.find((g) => g.slug === state.slug);
        if (seed) existing = { kind: 'verified', url: `/guide/${seed.slug}`, app: seed.app };
        else {
          const latest = await guides.get(`latest/${state.slug}`, { type: 'json' });
          if (latest && Date.now() - latest.created < CACHE_DAYS * 864e5) existing = { kind: 'cached', url: `/g/${latest.id}`, app: latest.app, created: latest.created };
        }
      }
      if (existing || d.oauth === 'no' || !d.is_real_app) {
        state.existing = existing;
        state.status = d.is_real_app ? 'awaiting-choice' : 'not-found';
        await save();
        await chain;
        return;
      }
    }

    await step('research', { status: 'running' });
    const results = await Promise.all(
      FACET_KEYS.map(async (f) => {
        await step(f, { status: 'running' });
        let r = null;
        try {
          r = await research(f, state.discovery);
        } catch (first) {
          if (first.keyProblem) throw first;
          await step(f, { status: 'running', note: `${first.userMessage || first.message}. Retrying with search only.` });
          try {
            r = await research(f, state.discovery, { fast: true });
          } catch (err) {
            if (err.keyProblem) throw err;
            await step(f, { status: 'failed', error: err.userMessage || err.message });
            return null;
          }
        }
        await step(f, {
          status: 'done',
          mode: r.trace.mode,
          findings: r.findings.length,
          queries: r.trace.queries.slice(0, 4),
          sources: [...new Set([...r.findings.map((x) => x.url), ...r.trace.grounded.map((g) => g.url)])].filter((u) => !/vertexaisearch/.test(u)).slice(0, 8),
          open_questions: r.open_questions.slice(0, 3),
        });
        return r;
      }),
    );
    const ok = results.filter(Boolean);
    if (!ok.length) throw new Error('All three research steps failed.');
    await step('research', { status: 'done' });

    await step('synthesize', { status: 'running', findings: ok.reduce((n, r) => n + r.findings.length, 0) });
    const draft = await synthesize(state.discovery, ok, state.composio);
    draft.research_trace = ok.map((r) => ({ facet: r.facet, ...r.trace }));
    await step('synthesize', { status: 'done', steps: draft.phases.reduce((n, p) => n + p.steps.length, 0), sources: draft.sources.length });

    await step('verify', { status: 'running' });
    const guide = await verify(draft);
    const guideId = `${state.slug}-${id.slice(0, 6)}`;
    guide.id = guideId;
    guide.query = state.query;
    const created = Date.now();
    await guides.setJSON(guideId, guide, { metadata: { app: guide.app, tier: guide.verdict.tier, created } });
    await guides.setJSON(`latest/${state.slug}`, { id: guideId, app: guide.app, created });
    state.guideId = guideId;
    state.status = 'done';
    await step('verify', { status: 'done', stats: guide.evidence_stats });
  } catch (err) {
    console.error(err);
    state.status = 'failed';
    state.error = err.userMessage || err.message || 'Unexpected error';
    for (const s of Object.values(state.steps)) if (s.status === 'running') s.status = 'failed';
    await save();
  }
  await chain;
};

export const config = { path: '/api/agent-run', background: true };
