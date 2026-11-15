// Builds public/data/library.json: a summary of every verified guide.
// Runs on every Netlify build (see netlify.toml), so the index never drifts from the guides.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../public/data/guides/', import.meta.url));
const out = fileURLToPath(new URL('../public/data/library.json', import.meta.url));

const TIER_ORDER = { instant: 1, 'light-review': 2, 'formal-review': 3, 'partner-gated': 4 };
const guides = [];
for (const file of (await readdir(dir)).filter((f) => f.endsWith('.json'))) {
  const g = JSON.parse(await readFile(dir + file, 'utf8'));
  const steps = (g.phases || []).flatMap((p) => p.steps || []);
  guides.push({
    slug: g.slug,
    app: g.app,
    provider: g.provider,
    category: g.category,
    one_liner: g.one_liner,
    tier: g.verdict?.tier,
    difficulty: g.verdict?.difficulty,
    hands_on: g.verdict?.hands_on,
    approval_wait: g.verdict?.approval_wait,
    total_to_production: g.verdict?.total_to_production,
    confidence: g.verdict?.confidence,
    managed_app: g.composio?.managed_app,
    last_checked: g.last_checked,
    steps: steps.length,
    sourced: steps.filter((s) => s.evidence === 'sourced' || s.evidence === 'tested').length,
  });
}
guides.sort((a, b) => (TIER_ORDER[a.tier] || 9) - (TIER_ORDER[b.tier] || 9) || a.app.localeCompare(b.app));
await writeFile(out, JSON.stringify({ built: new Date().toISOString(), guides }, null, 1));
console.log(`library.json: ${guides.length} guides`);
