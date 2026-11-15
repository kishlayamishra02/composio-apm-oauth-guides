import { esc, safeUrl, renderGuide, wireGuide } from '/js/render.js';

// The agent runs in a background function. This page starts a job, then polls
// GET /api/jobs/:id and draws each step from the saved progress.

const $ = (s) => document.querySelector(s);
const params = new URLSearchParams(location.search);
const qInput = $('#q');
const FACETS = ['register', 'review', 'limits'];
const POLL_MS = 1500;
const GIVE_UP_MS = 10 * 60 * 1000;

$('#form').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = qInput.value.trim();
  if (v) location.href = `/generate.html?q=${encodeURIComponent(v)}`;
});

const query = (params.get('q') || '').trim();
if (query) start(query);

const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
};
const link = (u) => (safeUrl(u) ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(host(u))}</a>` : esc(host(u)));

function setState(id, state, html) {
  const li = document.getElementById(id);
  if (!li) return;
  li.classList.remove('running', 'done', 'failed');
  if (state) li.classList.add(state);
  if (html !== undefined) li.querySelector('.tb').innerHTML = html;
}
function setElapsed(id, s) {
  const el = document.querySelector(`#${id} > .th .elapsed`);
  if (el && s?.startedAt && (s.status === 'done' || s.status === 'failed')) el.textContent = `${((s.at - s.startedAt) / 1000).toFixed(1)}s`;
  else if (el && s?.startedAt && s.status === 'running') el.textContent = `${((Date.now() - s.startedAt) / 1000).toFixed(0)}s…`;
}
function notice(html, kind = '') {
  $('#notice').innerHTML = html ? `<div class="alert ${kind}">${html}</div>` : '';
}

async function api(path, opts = {}) {
  const res = await fetch(path, { ...opts, headers: { 'content-type': 'application/json', ...(opts.headers || {}) } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (HTTP ${res.status}).`);
  return data;
}

function draw(s) {
  const st = s.steps || {};
  const d = s.discovery;
  if (st.discover) {
    const c = s.composio;
    const portal = d && safeUrl(d.developer_portal);
    setState(
      't-discover',
      st.discover.status,
      d
        ? `<b>${esc(d.app)}</b> by ${esc(d.provider)} · OAuth: <b>${esc(d.oauth)}</b>${portal ? ` · portal ${link(portal)}` : ''}<br>
           Official domains: <span class="q">${esc((d.official_domains || []).join(', '))}</span><br>
           Composio: ${c ? (c.managed ? 'managed OAuth app available' : 'no managed app, bring your own') : 'not in the OAuth catalog'}${d.notes ? `<br>Note: ${esc(d.notes)}` : ''}`
        : 'Searching for the official developer documentation…',
    );
    setElapsed('t-discover', st.discover);
  }
  if (st.research) {
    setState('t-research', st.research.status);
    setElapsed('t-research', st.research);
  }
  for (const f of FACETS) {
    const r = st[f];
    if (!r) continue;
    let html = r.note ? esc(r.note) : 'Searching and reading official pages…';
    if (r.status === 'done') {
      html = `${r.findings} findings${r.mode === 'search-only' ? ' (search only)' : ''}${r.queries?.length ? ` · searched <span class="q">${r.queries.slice(0, 3).map(esc).join(' · ')}</span>` : ''}${r.sources?.length ? `<br>Read: ${r.sources.slice(0, 6).map(link).join(', ')}` : ''}${r.open_questions?.length ? `<br>Could not confirm: ${esc(r.open_questions.slice(0, 2).join('; '))}` : ''}`;
    } else if (r.status === 'failed') html = esc(r.error || 'Failed');
    setState(`t-${f}`, r.status, html);
  }
  if (st.synthesize) {
    const y = st.synthesize;
    setState('t-synthesize', y.status, y.status === 'done' ? `${y.steps} steps citing ${y.sources} sources.` : `Re-reading every cited page, then writing from ${y.findings || ''} findings. The headline may only rest on official quotes found on the page.`);
    setElapsed('t-synthesize', y);
  }
  if (st.verify) {
    const v = st.verify;
    const x = v.stats || {};
    setState('t-verify', v.status, v.status === 'done' ? `${x.sourced} of ${x.steps} steps backed by an official source · quotes: ${x.quotes_found} found on page, ${x.quotes_not_found} not found, ${x.quotes_unreadable} unreadable.` : 'Grading the evidence and probing the developer portal…');
    setElapsed('t-verify', v);
  }
}

async function poll(job) {
  const t0 = Date.now();
  for (;;) {
    if (Date.now() - t0 > GIVE_UP_MS) throw new Error('The agent is taking much longer than usual. Try again in a few minutes.');
    const s = await api(`/api/jobs/${job}`).catch((err) => ({ status: 'poll-error', error: err.message }));
    if (s.status !== 'poll-error') draw(s);
    if (['done', 'failed', 'awaiting-choice', 'not-found'].includes(s.status)) return s;
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

async function start(q, force = false) {
  qInput.value = q;
  document.title = `Researching ${q} · OAuth Launch Guides`;
  $('#title').textContent = `Researching ${q}`;
  $('#trace').classList.remove('hidden');
  notice('');
  $('#guide').innerHTML = '';
  for (const id of ['t-discover', 't-research', 't-register', 't-review', 't-limits', 't-synthesize', 't-verify']) setState(id, '', '');
  setState('t-discover', 'running', 'Searching for the official developer documentation…');

  try {
    const { job } = await api('/api/jobs', { method: 'POST', body: JSON.stringify({ query: q, force }) });
    let s = await poll(job);

    if (s.status === 'not-found') {
      notice(`The agent could not match <b>${esc(q)}</b> to a real product. Try the app's website address instead.`, 'err');
      return;
    }
    if (s.status === 'awaiting-choice') {
      const d = s.discovery;
      const e = s.existing;
      await new Promise((resolve) => {
        if (e) {
          notice(
            `${e.kind === 'verified' ? `There is a <b>verified guide</b> for ${esc(e.app)}, checked by hand against official docs.` : `The agent researched ${esc(e.app)} on ${new Date(e.created).toLocaleDateString()}.`}
            <div class="actions"><a class="btn small" href="${esc(e.url)}" style="display:inline-flex;align-items:center">Open that guide</a><button class="btn secondary small" id="go-anyway">Research it live anyway</button></div>`,
          );
        } else {
          notice(
            `${esc(d.app)} does not appear to offer OAuth${d.other_auth?.length ? ` (it uses ${esc(d.other_auth.join(', '))})` : ''}. Users usually connect with their own API keys, so there is no OAuth app to register or approve.
            <div class="actions"><button class="btn secondary small" id="go-anyway">Research it anyway</button></div>`,
          );
        }
        $('#go-anyway').onclick = resolve;
      });
      notice('');
      await api(`/api/jobs/${job}/continue`, { method: 'POST' });
      s = await poll(job);
    }
    if (s.status === 'failed') throw new Error(s.error || 'The agent failed.');

    const guide = await api(`/api/guides/${encodeURIComponent(s.guideId)}`);
    const url = `/g/${s.guideId}`;
    history.replaceState(null, '', url);
    document.title = `${guide.app} OAuth setup and approval · OAuth Launch Guides`;
    notice(`Guide saved. Share this link: <a href="${esc(url)}">${esc(location.origin + url)}</a>`);
    const root = $('#guide');
    root.innerHTML = renderGuide(guide, { id: s.guideId });
    wireGuide(root, guide, `g/${s.guideId}`);
    root.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    document.querySelectorAll('#trace li.running, #trace .sub > div.running').forEach((el) => el.classList.replace('running', 'failed'));
    notice(`${esc(err.message)} <div class="actions"><button class="btn secondary small" onclick="location.reload()">Try again</button></div>`, 'err');
  }
}
