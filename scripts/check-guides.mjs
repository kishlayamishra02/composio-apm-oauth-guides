// Validates every guide in public/data/guides against GUIDE_FORMAT.md.
// Usage: node scripts/check-guides.mjs [file ...]
// Exit code 1 if any guide has errors. Warnings do not fail.

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../public/data/guides/', import.meta.url));
const files = process.argv.slice(2).length ? process.argv.slice(2) : (await readdir(dir)).filter((f) => f.endsWith('.json')).map((f) => dir + f);

const E = {
  tier: ['instant', 'light-review', 'formal-review', 'partner-gated'],
  wait_basis: ['official', 'community-reported', 'estimate'],
  confidence: ['high', 'medium', 'low'],
  owner: ['you', 'agent', 'provider'],
  evidence: ['tested', 'sourced', 'uncertain'],
  impact: ['none', 'review', 'security-assessment', 'partner-only'],
  required: ['no', 'for-public-distribution', 'for-sensitive-scopes', 'for-production-access', 'always'],
  kind: ['official', 'composio', 'community'],
  cost: ['free', 'paid', 'varies'],
};

let failed = 0;
for (const file of files) {
  const errors = [];
  const warns = [];
  let g;
  try {
    g = JSON.parse(await readFile(file, 'utf8'));
  } catch (err) {
    console.log(`✗ ${file}: invalid JSON (${err.message})`);
    failed++;
    continue;
  }
  const need = (cond, msg) => cond || errors.push(msg);
  const warn = (cond, msg) => cond || warns.push(msg);
  const inEnum = (v, list, where) => need(list.includes(v), `${where}: "${v}" not in ${list.join('|')}`);

  for (const k of ['slug', 'app', 'provider', 'one_liner', 'verdict', 'start_today', 'composio', 'phases', 'approval', 'agent_split', 'sources', 'last_checked']) need(g[k] != null, `missing ${k}`);
  if (g.verdict) {
    inEnum(g.verdict.tier, E.tier, 'verdict.tier');
    inEnum(g.verdict.wait_basis, E.wait_basis, 'verdict.wait_basis');
    inEnum(g.verdict.confidence, E.confidence, 'verdict.confidence');
    need(Number.isInteger(g.verdict.difficulty) && g.verdict.difficulty >= 1 && g.verdict.difficulty <= 5, 'verdict.difficulty must be 1..5');
  }
  const ids = new Map((g.sources || []).map((s) => [s.id, s]));
  for (const s of g.sources || []) {
    inEnum(s.kind, E.kind, `source ${s.id}.kind`);
    need(/^https?:\/\//.test(s.url || ''), `source ${s.id} has no URL`);
    warn((s.quote || '').length > 0, `source ${s.id} has no quote`);
    warn((s.quote || '').split(/\s+/).length <= 45, `source ${s.id} quote is over 40 words`);
  }
  const refs = (list, where) => (list || []).forEach((id) => need(ids.has(id), `${where} cites unknown source ${id}`));
  (g.phases || []).forEach((p, pi) =>
    (p.steps || []).forEach((s, si) => {
      const where = `phase ${pi + 1} step ${si + 1}`;
      inEnum(s.owner, E.owner, `${where}.owner`);
      inEnum(s.evidence, E.evidence, `${where}.evidence`);
      refs(s.sources, where);
      if (s.evidence === 'sourced') need((s.sources || []).some((id) => ['official', 'composio'].includes(ids.get(id)?.kind)), `${where} is "sourced" without an official/composio source`);
    }),
  );
  (g.scopes || []).forEach((s, i) => {
    inEnum(s.review_impact, E.impact, `scope ${i + 1}`);
    refs(s.sources, `scope ${i + 1}`);
  });
  (g.prerequisites || []).forEach((p, i) => {
    inEnum(p.cost, E.cost, `prerequisite ${i + 1}.cost`);
    refs(p.sources, `prerequisite ${i + 1}`);
  });
  (g.blockers || []).forEach((b, i) => refs(b.sources, `blocker ${i + 1}`));
  if (g.approval) {
    inEnum(g.approval.required, E.required, 'approval.required');
    refs(g.approval.sources, 'approval');
  }
  const steps = (g.phases || []).flatMap((p) => p.steps || []);
  if (steps.some((s) => s.evidence === 'tested')) warn((g.tested || []).length > 0, 'steps marked tested but `tested` is empty');
  warn(g.verdict?.wait_basis === 'official' || (g.uncertain || []).length > 0, 'wait is not official but nothing listed in `uncertain`');

  const sourced = steps.filter((s) => s.evidence !== 'uncertain').length;
  const tag = errors.length ? '✗' : '✓';
  console.log(`${tag} ${g.slug || file}: ${g.verdict?.tier}, ${steps.length} steps (${sourced} sourced/tested), ${ids.size} sources${warns.length ? `, ${warns.length} warnings` : ''}`);
  errors.forEach((e) => console.log(`    error: ${e}`));
  warns.forEach((w) => console.log(`    warn:  ${w}`));
  if (errors.length) failed++;
}
process.exit(failed ? 1 : 0);
