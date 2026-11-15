// Re-fetch every cited page in the library and look for each quoted passage.
// This is the same check the live agent runs on its own guides, applied to the verified library.
//
//   node scripts/recheck-sources.mjs            report only
//   node scripts/recheck-sources.mjs --write    also store quote_check on each source
//
// Results: found | not-found (page read, quote absent) | unreadable (fetch failed or page built by JavaScript)

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { checkQuote } from '../lib/sources.mjs';

const dir = fileURLToPath(new URL('../public/data/guides/', import.meta.url));
const outDir = fileURLToPath(new URL('../evals/', import.meta.url));
const write = process.argv.includes('--write');

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

const report = { date: new Date().toISOString().slice(0, 10), guides: {} };
for (const file of (await readdir(dir)).filter((f) => f.endsWith('.json'))) {
  const g = JSON.parse(await readFile(dir + file, 'utf8'));
  const srcs = (g.sources || []).filter((s) => s.quote && s.url);
  const results = await pool(srcs, 6, async (s) => ({ id: s.id, kind: s.kind, url: s.url, result: await checkQuote(s.url, s.quote, 12000) }));
  const count = (r) => results.filter((x) => x.result === r).length;
  report.guides[g.slug] = {
    sources: srcs.length,
    found: count('found'),
    not_found: count('not-found'),
    unreadable: count('unreadable'),
    issues: results.filter((r) => r.result !== 'found'),
  };
  console.log(`${g.slug.padEnd(10)} ${srcs.length} quotes: ${count('found')} found, ${count('not-found')} not found, ${count('unreadable')} unreadable`);
  for (const r of results.filter((x) => x.result === 'not-found')) console.log(`   not found: ${r.id} ${r.url}`);
  if (write) {
    const by = Object.fromEntries(results.map((r) => [r.id, r.result]));
    for (const s of g.sources) if (by[s.id]) s.quote_check = by[s.id];
    await writeFile(dir + file, JSON.stringify(g, null, 2) + '\n');
  }
}
await mkdir(outDir, { recursive: true });
await writeFile(outDir + 'source-recheck.json', JSON.stringify(report, null, 2));
console.log(`\nWrote evals/source-recheck.json`);
