// Shared guide renderer. Everything from a guide is escaped before it reaches the DOM:
// live guides are written by a model from web pages, so they are untrusted text.

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const safeUrl = (u) => {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
};

export const TIERS = {
  instant: { label: 'Instant', short: 'Self-serve, no review', blurb: 'Register and other accounts can connect the same day.' },
  'light-review': { label: 'Light review', short: 'Works today, review to go public', blurb: 'Works for your own account at once. Going public needs a short review, a listing, or carries limits.' },
  'formal-review': { label: 'Formal review', short: 'Verification before launch', blurb: 'Other accounts are blocked or capped until a formal verification, often with a demo video or security assessment.' },
  'partner-gated': { label: 'Partner gated', short: 'Apply to a partner programme', blurb: 'The useful API sits behind a partner application that can take months or be refused.' },
};
export const OWNERS = { you: 'You', agent: 'Agent can do', provider: 'Provider wait' };
const EVIDENCE = { tested: 'Tested', sourced: 'Sourced', uncertain: 'Uncertain' };
const IMPACT = { none: 'No review', review: 'Needs review', 'security-assessment': 'Security assessment', 'partner-only': 'Partner only' };
const IMPACT_CLASS = { none: 'tier-instant', review: 'tier-light-review', 'security-assessment': 'tier-formal-review', 'partner-only': 'tier-partner-gated' };
const BASIS = { official: 'published by the provider', 'community-reported': 'reported by developers', estimate: 'our estimate' };
const REQUIRED = {
  no: 'No review needed',
  'for-public-distribution': 'Only to distribute publicly',
  'for-sensitive-scopes': 'Only for sensitive or restricted scopes',
  'for-production-access': 'For production access',
  always: 'Always',
};

export const tierChip = (t) => `<span class="chip tier-${esc(t)}">${esc(TIERS[t]?.label || t)}</span>`;
export const dots = (n, t) => `<span class="dots tier-${esc(t)}" style="background:none" aria-label="Difficulty ${n} of 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
export const managedChip = (m) =>
  m === true ? '<span class="chip managed">Composio managed app</span>' : m === false ? '<span class="chip byo">Bring your own app</span>' : '';

const ownerChip = (o) => `<span class="chip own-${esc(o)}">${esc(OWNERS[o] || o)}</span>`;
const evChip = (e) => `<span class="chip ev-${esc(e)}" title="${esc(evTitle(e))}">${esc(EVIDENCE[e] || e)}</span>`;
const evTitle = (e) =>
  e === 'tested' ? 'We ran this and saw the result' : e === 'sourced' ? 'An official source says so; quote recorded below' : 'Not confirmed by an official source';
const cites = (ids) => (ids || []).map((id) => `<a class="cite" href="#src-${esc(id)}">${esc(id)}</a>`).join(' ');
const long = (s) => (String(s || '').length > 22 ? ' long' : '');
const list = (items) => (items?.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '<p class="muted">Nothing recorded.</p>');

function evidenceStats(g) {
  const steps = (g.phases || []).flatMap((p) => p.steps || []);
  const c = { tested: 0, sourced: 0, uncertain: 0 };
  steps.forEach((s) => (c[s.evidence] = (c[s.evidence] || 0) + 1));
  return { total: steps.length, ...c };
}

function evidenceBar(g) {
  const s = evidenceStats(g);
  if (!s.total) return '';
  const pct = (n) => ((n / s.total) * 100).toFixed(1);
  return `<div class="evbar" aria-hidden="true"><i class="tested" style="width:${pct(s.tested)}%"></i><i class="sourced" style="width:${pct(s.sourced)}%"></i><i class="uncertain" style="width:${pct(s.uncertain)}%"></i></div>
  <div class="legend"><span>${s.tested} tested</span><span>${s.sourced} sourced</span><span>${s.uncertain} uncertain</span><span>of ${s.total} steps</span></div>`;
}

export function renderGuide(g, { id } = {}) {
  const v = g.verdict || {};
  const isLive = g.origin === 'live-agent';
  const stats = evidenceStats(g);
  const es = g.evidence_stats;
  const portal = safeUrl(g.developer_portal);
  const site = safeUrl(g.website);

  const banner = isLive
    ? `<div class="banner agent"><div>🤖</div><div><b>Written live by the research agent on ${esc(g.last_checked)}. Not reviewed by a person yet.</b><br>
       ${stats.sourced} of ${stats.total} steps are backed by an official source.${es ? ` We re-read ${es.quotes_found + es.quotes_not_found + es.quotes_unreadable} cited pages: ${es.quotes_found} quotes found, ${es.quotes_not_found} not found, ${es.quotes_unreadable} unreadable.` : ''} Treat <b>uncertain</b> steps as leads to check, not facts.</div></div>`
    : `<div class="banner verified"><div>✓</div><div><b>Verified guide, checked against official docs on ${esc(g.last_checked)}.</b> ${stats.sourced + stats.tested} of ${stats.total} steps are backed by an official source or a test. Exact quotes for every source are at the bottom.</div></div>`;

  const phases = g.phases || [];
  const timeline = phases
    .map((p, i) => {
      const owners = (p.steps || []).map((s) => s.owner);
      return `<div class="ph"><div class="n">Phase ${i + 1}</div><div class="t">${esc(p.name)}</div><div class="d">${esc(p.duration || '')}</div>
      <div class="bar">${owners.map((o) => `<i class="${esc(o)}"></i>`).join('')}</div></div>`;
    })
    .join('');

  let stepNo = 0;
  const stepsHtml = phases
    .map(
      (p, pi) => `<div class="phase"><div class="phase-h"><h3>${pi + 1}. ${esc(p.name)}</h3><span>${esc(p.duration || '')}</span></div>
      <ol class="steps">${(p.steps || [])
        .map((s) => {
          const n = stepNo++;
          return `<li data-step="${n}"><input type="checkbox" aria-label="Mark step done" data-step="${n}"><div><div class="txt">${esc(s.text)}</div>
          <div class="meta">${ownerChip(s.owner)}${evChip(s.evidence)}${cites(s.sources)}${s.note ? `<span class="note">${esc(s.note)}</span>` : ''}</div></div></li>`;
        })
        .join('')}</ol></div>`,
    )
    .join('');

  const prereq = (g.prerequisites || []).length
    ? `<div class="tscroll"><table class="t"><thead><tr><th>What you need</th><th>Details</th><th>Cost</th></tr></thead><tbody>${g.prerequisites
        .map((p) => `<tr><td><b>${esc(p.item)}</b></td><td>${esc(p.detail)} ${cites(p.sources)}</td><td>${esc(p.cost)}</td></tr>`)
        .join('')}</tbody></table></div>`
    : '<p class="muted">Nothing recorded.</p>';

  const scopes = (g.scopes || []).length
    ? `<div class="tscroll"><table class="t"><thead><tr><th>Scope</th><th>What it allows</th><th>Review impact</th></tr></thead><tbody>${g.scopes
        .map((s) => `<tr><td><code>${esc(s.scope)}</code></td><td>${esc(s.purpose)} ${cites(s.sources)}</td><td><span class="chip ${IMPACT_CLASS[s.review_impact] || 'plain'}">${esc(IMPACT[s.review_impact] || s.review_impact)}</span></td></tr>`)
        .join('')}</tbody></table></div>`
    : '<p class="muted">No scope details recorded.</p>';

  const a = g.approval || {};
  const approval = `<div class="card"><dl class="kv">
    <dt>Is review required?</dt><dd><b>${esc(REQUIRED[a.required] || a.required)}</b> ${cites(a.sources)}</dd>
    <dt>What triggers it</dt><dd>${esc(a.trigger || '—')}</dd>
    <dt>Typical wait</dt><dd>${esc(a.typical_wait || '—')}</dd>
    <dt>Reviewers check</dt><dd>${list(a.reviewers_check)}</dd>
    <dt>Common rejections</dt><dd>${list(a.common_rejections)}</dd></dl></div>`;

  const blockers = (g.blockers || []).length
    ? `<div class="tscroll"><table class="t"><thead><tr><th>If you hit this</th><th>Do this</th></tr></thead><tbody>${g.blockers
        .map((b) => `<tr><td><b>${esc(b.blocker)}</b></td><td>${esc(b.fix)} ${cites(b.sources)}</td></tr>`)
        .join('')}</tbody></table></div>`
    : '<p class="muted">No blockers recorded.</p>';

  const sp = g.agent_split || {};
  const split = `<div class="split">
    <div class="card"><h3>${ownerChip('agent')}</h3>${list(sp.agent_can)}</div>
    <div class="card"><h3>${ownerChip('you')}</h3>${list(sp.you_must)}</div>
    <div class="card"><h3>${ownerChip('provider')}</h3>${list(sp.provider_controls)}</div></div>`;

  const qc = { found: ['ev-tested', 'Quote re-checked on page'], 'not-found': ['ev-uncertain', 'Quote not found on page'], unreadable: ['plain', 'Page not machine-readable'] };
  const sources = (g.sources || [])
    .map((s) => {
      const u = safeUrl(s.url);
      const check = s.quote_check && qc[s.quote_check] ? `<span class="chip ${qc[s.quote_check][0]}">${qc[s.quote_check][1]}</span>` : '';
      return `<li id="src-${esc(s.id)}"><div class="sh"><span class="cite">${esc(s.id)}</span><span class="chip plain">${esc(s.kind)}</span>${check}
      ${u ? `<a class="url" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(s.title || u)}</a>` : esc(s.title || s.url)}</div>
      ${u && s.title ? `<div class="url muted" style="font-size:12px;margin-top:2px">${esc(u)}</div>` : ''}
      ${s.quote ? `<blockquote>“${esc(s.quote)}”</blockquote>` : ''}</li>`;
    })
    .join('');

  const tested = (g.tested || []).length
    ? `<ul>${g.tested.map((t) => `<li><b>${esc(t.what)}</b> → ${esc(t.result)} <span class="muted">(${esc(t.date || '')})</span></li>`).join('')}</ul>`
    : '<p class="muted">Nothing tested yet.</p>';

  const st = g.start_today || {};
  const comp = g.composio || {};
  const compText =
    comp.managed_app === true
      ? `<b>Composio already provides a managed OAuth app for ${esc(g.app)}.</b> Your users can connect today without any of the steps below. You need your own app only for your brand on the consent screen, extra scopes, dedicated rate limits, faster trigger polling or a self-hosted instance.`
      : comp.managed_app === false
        ? `<b>Composio has no managed OAuth app for ${esc(g.app)}.</b> You must register your own app before your users can connect.`
        : `<b>${esc(g.app)} is not in Composio's OAuth toolkit catalog.</b>`;

  return `
  <div class="crumbs no-print"><a href="/">Library</a> / ${esc(g.app)}</div>
  <header class="ghead">
    <h1>${esc(g.app)}: OAuth app setup and approval</h1>
    <div class="sub">${esc(g.provider || '')}${g.category ? ` · ${esc(g.category)}` : ''}${portal ? ` · <a href="${esc(portal)}" target="_blank" rel="noopener noreferrer">Developer portal</a>` : ''}${site ? ` · <a href="${esc(site)}" target="_blank" rel="noopener noreferrer">Website</a>` : ''}</div>
    <p class="oneliner">${esc(g.one_liner)}</p>
    ${banner}
  </header>

  <div class="verdict">
    <div class="card"><div class="k">Difficulty</div><div class="v">${tierChip(v.tier)}</div><div class="s">${dots(v.difficulty, v.tier)} ${esc(TIERS[v.tier]?.short || '')}</div></div>
    <div class="card"><div class="k">Your hands-on time</div><div class="v${long(v.hands_on)}">${esc(v.hands_on)}</div><div class="s">Time you spend working</div></div>
    <div class="card"><div class="k">Approval wait</div><div class="v${long(v.approval_wait)}">${esc(v.approval_wait)}</div><div class="s">Wait is ${esc(BASIS[v.wait_basis] || v.wait_basis)}</div></div>
    <div class="card"><div class="k">Total to production</div><div class="v${long(v.total_to_production)}">${esc(v.total_to_production)}</div><div class="s">Confidence: <b>${esc(v.confidence)}</b></div></div>
  </div>

  <div class="two">
    <div class="card callout"><h3>Can you start today?</h3><p>${esc(st.summary)}</p>${st.limits_before_approval?.length ? `<ul>${st.limits_before_approval.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}</div>
    <div class="card callout"><h3>Do you need your own OAuth app?</h3><p>${compText}</p>${comp.note ? `<p style="margin-top:8px">${esc(comp.note)}</p>` : ''}</div>
  </div>

  ${phases.length ? `<div class="timeline">${timeline}</div><div class="legend" style="margin-top:8px"><span>Bar colours show who does each step:</span>${ownerChip('you')}${ownerChip('agent')}${ownerChip('provider')}</div>` : ''}
  <div class="share-mobile no-print"><button class="btn secondary small" data-act="copy-link">Copy link</button><button class="btn secondary small" data-act="copy-md">Copy as Markdown</button><button class="btn secondary small" data-act="download-md">Download .md</button></div>

  <div class="layout">
    <nav class="toc no-print" aria-label="Guide sections">
      <a href="#before">Before you start</a><a href="#steps">Step by step</a><a href="#scopes">Scopes</a><a href="#approval">Approval</a>
      <a href="#blockers">Blockers</a><a href="#split">Agent vs you</a><a href="#evidence">Evidence</a>
      <div class="share"><button class="btn secondary small" data-act="copy-link">Copy link</button><button class="btn secondary small" data-act="copy-md">Copy as Markdown</button><button class="btn secondary small" data-act="download-md">Download .md</button><button class="btn secondary small" data-act="print">Print / PDF</button></div>
    </nav>
    <div>
      <section class="gsec" id="before"><h2>Before you start</h2>${prereq}</section>
      <section class="gsec" id="steps"><h2>Step by step</h2><p class="intro">Tick steps off as you go; progress is saved in this browser.</p>${stepsHtml || '<p class="muted">No steps recorded.</p>'}</section>
      <section class="gsec" id="scopes"><h2>Scopes and what they trigger</h2>${scopes}</section>
      <section class="gsec" id="approval"><h2>Approval</h2>${approval}</section>
      <section class="gsec" id="blockers"><h2>Blockers and how to get past them</h2>${blockers}</section>
      <section class="gsec" id="split"><h2>What an agent can do, and where you take over</h2>${split}</section>
      <section class="gsec" id="evidence"><h2>Evidence</h2>
        <div class="card" style="margin-bottom:12px"><h3>How sure is this guide?</h3>${evidenceBar(g)}</div>
        <h3 style="margin:16px 0 8px">What we tested</h3>${tested}
        <h3 style="margin:16px 0 8px">What remains uncertain</h3>${list(g.uncertain)}
        <h3 style="margin:16px 0 8px">Sources</h3><ol class="sources">${sources}</ol>
      </section>
    </div>
  </div>`;
}

export function guideToMarkdown(g, link) {
  const v = g.verdict || {};
  const L = [];
  L.push(`# ${g.app}: OAuth app setup and approval`, '');
  L.push(`> ${g.one_liner}`, '');
  if (link) L.push(`Guide: ${link}  `);
  L.push(`Last checked: ${g.last_checked} · ${g.origin === 'live-agent' ? 'Written by the research agent, not reviewed by a person' : 'Verified against official docs'}`, '');
  L.push('| Difficulty | Hands-on | Approval wait | Total to production | Confidence |', '|---|---|---|---|---|');
  L.push(`| ${TIERS[v.tier]?.label || v.tier} (${v.difficulty}/5) | ${v.hands_on} | ${v.approval_wait} (${BASIS[v.wait_basis] || v.wait_basis}) | ${v.total_to_production} | ${v.confidence} |`, '');
  L.push('## Can you start today?', '', g.start_today?.summary || '', ...(g.start_today?.limits_before_approval || []).map((l) => `- ${l}`), '');
  L.push('## Do you need your own OAuth app?', '', g.composio?.managed_app === true ? 'Composio provides a managed OAuth app for this toolkit.' : g.composio?.managed_app === false ? 'Composio has no managed OAuth app for this toolkit: register your own.' : 'Not in Composio\'s OAuth catalog.', g.composio?.note || '', '');
  if (g.prerequisites?.length) L.push('## Before you start', '', ...g.prerequisites.map((p) => `- **${p.item}** (${p.cost}): ${p.detail}`), '');
  L.push('## Step by step', '');
  (g.phases || []).forEach((p, i) => {
    L.push(`### ${i + 1}. ${p.name}${p.duration ? ` (${p.duration})` : ''}`, '');
    (p.steps || []).forEach((s) => L.push(`- [ ] ${s.text} — *${OWNERS[s.owner] || s.owner}; ${EVIDENCE[s.evidence] || s.evidence}*${s.sources?.length ? ` [${s.sources.join(', ')}]` : ''}`));
    L.push('');
  });
  if (g.scopes?.length) L.push('## Scopes', '', '| Scope | Purpose | Review impact |', '|---|---|---|', ...g.scopes.map((s) => `| \`${s.scope}\` | ${s.purpose} | ${IMPACT[s.review_impact] || s.review_impact} |`), '');
  const a = g.approval || {};
  L.push('## Approval', '', `- **Required:** ${REQUIRED[a.required] || a.required}`, `- **Trigger:** ${a.trigger || '—'}`, `- **Typical wait:** ${a.typical_wait || '—'}`);
  if (a.reviewers_check?.length) L.push(`- **Reviewers check:** ${a.reviewers_check.join('; ')}`);
  if (a.common_rejections?.length) L.push(`- **Common rejections:** ${a.common_rejections.join('; ')}`);
  L.push('');
  if (g.blockers?.length) L.push('## Blockers', '', ...g.blockers.map((b) => `- **${b.blocker}** → ${b.fix}`), '');
  const sp = g.agent_split || {};
  L.push('## Agent vs you', '', '**An agent can:**', ...(sp.agent_can || []).map((x) => `- ${x}`), '', '**You must:**', ...(sp.you_must || []).map((x) => `- ${x}`), '', '**The provider controls:**', ...(sp.provider_controls || []).map((x) => `- ${x}`), '');
  if (g.tested?.length) L.push('## Tested', '', ...g.tested.map((t) => `- ${t.what} → ${t.result} (${t.date})`), '');
  if (g.uncertain?.length) L.push('## Uncertain', '', ...g.uncertain.map((u) => `- ${u}`), '');
  L.push('## Sources', '', ...(g.sources || []).map((s) => `- [${s.id}] ${s.title ? `${s.title}: ` : ''}${s.url} (${s.kind})${s.quote ? `\n  > ${s.quote}` : ''}`));
  return L.join('\n');
}

export function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

/** Wire up share buttons and the step checklist for a rendered guide. */
export function wireGuide(root, g, key) {
  const storeKey = `oauth-guide-progress:${key}`;
  let done = {};
  try {
    done = JSON.parse(localStorage.getItem(storeKey) || '{}');
  } catch {}
  root.querySelectorAll('.steps input[type=checkbox]').forEach((cb) => {
    const n = cb.dataset.step;
    const li = cb.closest('li');
    if (done[n]) {
      cb.checked = true;
      li.classList.add('done');
    }
    cb.addEventListener('change', () => {
      li.classList.toggle('done', cb.checked);
      done[n] = cb.checked;
      try {
        localStorage.setItem(storeKey, JSON.stringify(done));
      } catch {}
    });
  });

  root.querySelectorAll('[data-act]').forEach((b) =>
    b.addEventListener('click', async () => {
      const act = b.dataset.act;
      const link = location.href.split('#')[0];
      if (act === 'print') return window.print();
      const md = guideToMarkdown(g, link);
      if (act === 'download-md') {
        const blob = new Blob([md], { type: 'text/markdown' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${g.slug || 'guide'}-oauth-guide.md`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        return;
      }
      try {
        await navigator.clipboard.writeText(act === 'copy-link' ? link : md);
        toast(act === 'copy-link' ? 'Link copied' : 'Markdown copied');
      } catch {
        toast('Copy failed: select and copy manually');
      }
    }),
  );
}
