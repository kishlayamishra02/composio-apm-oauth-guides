// Run the live agent from the command line, same code path as the website.
//
//   node --env-file=.env scripts/generate.mjs "Calendly"
//   node --env-file=.env scripts/generate.mjs "https://www.xero.com" --out evals/xero.live.json
//   GEMINI_MOCK=1 node scripts/generate.mjs "anything"     (no model calls)
//
// Batch mode, for building out the library:
//   node --env-file=.env scripts/generate.mjs --batch apps.txt --dir evals/batch
//   (one app per line; each guide is written to {dir}/{slug}.json for human review)

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { discover, research, synthesize, verify, matchComposio, FACET_KEYS } from '../lib/pipeline.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const directory = JSON.parse(await readFile(new URL('../public/data/directory.json', import.meta.url), 'utf8'));

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args.splice(i, 2)[1];
};
const out = flag('--out');
const batch = flag('--batch');
const dir = flag('--dir') || 'evals/batch';

async function run(query) {
  const t0 = Date.now();
  const log = (msg) => console.error(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${msg}`);
  log(`discover: ${query}`);
  const d = await discover(query);
  log(`  -> ${d.app} (${d.provider}); oauth=${d.oauth}; portal=${d.developer_portal}; domains=${d.official_domains.join(',')}`);
  const composio = matchComposio(directory, { app: d.app, website: d.website, query });
  log(`  composio: ${composio ? `${composio.toolkit} managed=${composio.managed}` : 'not in catalog'}`);
  log(`research: ${FACET_KEYS.join(', ')} (parallel)`);
  const results = await Promise.all(
    FACET_KEYS.map((f) =>
      research(f, d).catch((err) => {
        log(`  ${f}: ${err.userMessage || err.message} (${String(err.message).slice(0, 160)}); retrying with search only`);
        return research(f, d, { fast: true });
      }),
    ),
  );
  for (const r of results) log(`  ${r.facet} [${r.trace.mode}]: ${r.findings.length} findings, ${r.open_questions.length} open questions, searches: ${r.trace.queries.join(' | ')}`);
  log('synthesize');
  const guide = await synthesize(d, results, composio);
  log('verify');
  await verify(guide);
  log(`done: tier=${guide.verdict.tier} conf=${guide.verdict.confidence} stats=${JSON.stringify(guide.evidence_stats)}`);
  guide.research_trace = results.map((r) => ({ facet: r.facet, ...r.trace }));
  return guide;
}

if (batch) {
  const list = (await readFile(batch, 'utf8')).split('\n').map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
  await mkdir(dir, { recursive: true });
  for (const q of list) {
    try {
      const g = await run(q);
      await writeFile(`${dir}/${g.slug}.json`, JSON.stringify(g, null, 2));
    } catch (err) {
      console.error(`FAILED ${q}: ${err.userMessage || err.message}`);
    }
  }
} else {
  const query = args.join(' ').trim();
  if (!query) {
    console.error('Usage: node --env-file=.env scripts/generate.mjs "<app name or website>" [--out file.json]');
    process.exit(1);
  }
  try {
    const g = await run(query);
    const json = JSON.stringify(g, null, 2);
    if (out) {
      await writeFile(out, json);
      console.error(`wrote ${out}`);
    } else console.log(json);
  } catch (err) {
    console.error(`FAILED: ${err.userMessage || err.message}
  detail: ${String(err.message).slice(0, 300)}`);
    process.exit(1);
  }
}
void root;
// A slow server can hold a socket open after the work is done; do not wait for it.
process.exit(0);
