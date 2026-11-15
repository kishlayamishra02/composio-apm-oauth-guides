// Builds public/data/directory.json from Composio's managed OAuth app catalog.
// Usage: node scripts/build-directory.mjs
//
// Source: https://docs.composio.dev/toolkits/managed-auth.md
// The page lists every OAuth toolkit in two tables: toolkits where Composio
// provides the OAuth app, and toolkits where you bring your own.

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const SOURCE = 'https://docs.composio.dev/toolkits/managed-auth.md';
const OUT = fileURLToPath(new URL('../public/data/directory.json', import.meta.url));

const res = await fetch(SOURCE);
if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${SOURCE}`);
const md = await res.text();

let section = null;
const apps = [];
for (const line of md.split('\n')) {
  if (/^##\s+Composio-managed/i.test(line)) section = 'managed';
  else if (/^##\s+Bring your own/i.test(line)) section = 'byo';
  else if (/^##\s/.test(line)) section = null;

  const m = line.match(/^\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*`([^`]+)`\s*\|/);
  if (m && section) {
    const [, name, path, toolkit] = m;
    apps.push({
      name,
      slug: toolkit.toLowerCase().replace(/_/g, '-'),
      toolkit,
      managed: section === 'managed',
      composio_url: new URL(path.replace(/\.md$/, ''), 'https://docs.composio.dev').href,
    });
  }
}

const managed = apps.filter((a) => a.managed).length;
const out = {
  source: SOURCE,
  fetched: new Date().toISOString().slice(0, 10),
  counts: { total: apps.length, managed, byo: apps.length - managed },
  apps: apps.sort((a, b) => a.name.localeCompare(b.name)),
};

await writeFile(OUT, JSON.stringify(out, null, 1));
console.log(`Wrote ${apps.length} toolkits (${managed} managed, ${apps.length - managed} bring-your-own) to ${OUT}`);
