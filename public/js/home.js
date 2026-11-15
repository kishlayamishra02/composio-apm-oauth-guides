import { esc, TIERS, tierChip, dots, managedChip } from '/js/render.js';

const [library, directory] = await Promise.all([
  fetch('/data/library.json').then((r) => r.json()).catch(() => ({ guides: [] })),
  fetch('/data/directory.json').then((r) => r.json()).catch(() => ({ apps: [], counts: {} })),
]);
const guides = library.guides || [];
const bySlug = new Map(guides.map((g) => [g.slug, g]));
const squash = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// counts
if (directory.counts?.managed) document.getElementById('n-managed').textContent = directory.counts.managed;
if (directory.counts?.byo) document.getElementById('n-byo').textContent = directory.counts.byo;
document.getElementById('dir-sub').textContent = `All ${directory.counts?.total || ''} OAuth toolkits in Composio's catalog (fetched ${directory.fetched || ''}). Open a guide, or have the agent write one.`;

// tier scale
document.getElementById('scale').innerHTML = Object.entries(TIERS)
  .map(([k, t]) => `<div>${tierChip(k)}<p>${esc(t.blurb)}</p></div>`)
  .join('');

// library cards
document.getElementById('lib').innerHTML = guides
  .map(
    (g) => `<a class="card gcard" href="/guide/${esc(g.slug)}">
    <div class="row"><span class="name">${esc(g.app)}</span>${tierChip(g.tier)}</div>
    <p class="one">${esc(g.one_liner)}</p>
    <div class="facts"><div><span>Hands-on</span>${esc(g.hands_on)}</div><div><span>Approval wait</span>${esc(g.approval_wait)}</div></div>
    <div class="row"><span class="muted" style="font-size:12px">${dots(g.difficulty, g.tier)} &nbsp;${g.sourced}/${g.steps} steps sourced</span>${managedChip(g.managed_app)}</div>
  </a>`,
  )
  .join('') || '<p class="muted">No guides yet.</p>';

// recent live guides
fetch('/api/guides')
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => {
    const items = d?.guides || [];
    if (!items.length) return;
    document.getElementById('recent-wrap').classList.remove('hidden');
    document.getElementById('recent').innerHTML = items
      .slice(0, 12)
      .map((g) => `<a class="card gcard" href="/g/${esc(g.id)}"><div class="row"><span class="name">${esc(g.app)}</span>${tierChip(g.tier)}</div><span class="muted" style="font-size:12px">${new Date(g.created).toLocaleDateString()}</span></a>`)
      .join('');
  })
  .catch(() => {});

// search + suggestions
const q = document.getElementById('q');
const sug = document.getElementById('suggest');
const form = document.getElementById('search-form');
let active = -1;
let current = [];

function findGuide(text) {
  const k = squash(text.replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[./]/)[0]);
  return guides.find((g) => squash(g.app) === k || g.slug === k || squash(g.slug) === k);
}
function go(text) {
  const t = text.trim();
  if (!t) return;
  const g = findGuide(t);
  location.href = g ? `/guide/${g.slug}` : `/generate.html?q=${encodeURIComponent(t)}`;
}
function suggestions(text) {
  const k = squash(text);
  if (!k) return [];
  const lib = guides.filter((g) => squash(g.app).includes(k)).map((g) => ({ name: g.app, guide: g.slug, tag: 'Verified guide' }));
  const dir = (directory.apps || [])
    .filter((a) => squash(a.name).includes(k) && !bySlug.has(a.slug))
    .sort((a, b) => squash(a.name).indexOf(k) - squash(b.name).indexOf(k))
    .slice(0, 6)
    .map((a) => ({ name: a.name, tag: a.managed ? 'Managed · agent guide' : 'Bring your own · agent guide' }));
  return [...lib, ...dir].slice(0, 8);
}
function renderSug() {
  current = suggestions(q.value);
  active = -1;
  if (!current.length) {
    sug.classList.add('hidden');
    q.setAttribute('aria-expanded', 'false');
    return;
  }
  sug.innerHTML = current.map((s, i) => `<li role="option"><button type="button" data-i="${i}"><span>${esc(s.name)}</span><span class="chip plain">${esc(s.tag)}</span></button></li>`).join('');
  sug.classList.remove('hidden');
  q.setAttribute('aria-expanded', 'true');
}
q.addEventListener('input', renderSug);
q.addEventListener('keydown', (e) => {
  if (sug.classList.contains('hidden')) return;
  const btns = [...sug.querySelectorAll('button')];
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    active = (active + (e.key === 'ArrowDown' ? 1 : -1) + btns.length) % btns.length;
    btns.forEach((b, i) => b.classList.toggle('active', i === active));
  } else if (e.key === 'Escape') sug.classList.add('hidden');
  else if (e.key === 'Enter' && active >= 0) {
    e.preventDefault();
    pick(current[active]);
  }
});
sug.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) pick(current[+b.dataset.i]);
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search')) sug.classList.add('hidden');
});
function pick(s) {
  if (!s) return;
  location.href = s.guide ? `/guide/${s.guide}` : `/generate.html?q=${encodeURIComponent(s.name)}`;
}
form.addEventListener('submit', (e) => {
  e.preventDefault();
  go(q.value);
});
document.querySelectorAll('[data-try]').forEach((b) => b.addEventListener('click', () => go(b.dataset.try)));

// directory
const dirEl = document.getElementById('dir');
const dirQ = document.getElementById('dir-q');
const more = document.getElementById('dir-more');
let filter = 'all';
let shown = 60;
function renderDir() {
  const k = squash(dirQ.value);
  const items = (directory.apps || []).filter((a) => (filter === 'all' || (filter === 'managed') === a.managed) && (!k || squash(a.name).includes(k)));
  dirEl.innerHTML = items
    .slice(0, shown)
    .map((a) => {
      const g = bySlug.get(a.slug);
      const action = g ? `<a href="/guide/${esc(g.slug)}">Verified guide →</a>` : `<a href="/generate.html?q=${encodeURIComponent(a.name)}">Generate →</a>`;
      return `<div class="dir-item"><span class="nm" title="${esc(a.name)}">${esc(a.name)}</span><span style="display:flex;gap:8px;align-items:center">${a.managed ? '<span class="chip managed" title="Composio provides a managed OAuth app">M</span>' : ''}${action}</span></div>`;
    })
    .join('') || '<p class="muted">No apps match. Type it in the search box above and the agent will research it.</p>';
  more.classList.toggle('hidden', items.length <= shown);
}
dirQ.addEventListener('input', () => {
  shown = 60;
  renderDir();
});
document.querySelectorAll('.seg button').forEach((b) =>
  b.addEventListener('click', () => {
    document.querySelectorAll('.seg button').forEach((x) => x.classList.toggle('on', x === b));
    filter = b.dataset.f;
    shown = 60;
    renderDir();
  }),
);
more.addEventListener('click', () => {
  shown += 120;
  renderDir();
});
renderDir();
