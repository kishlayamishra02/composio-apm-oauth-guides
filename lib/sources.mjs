// Source handling: resolve Google grounding redirect links, classify sources,
// probe URLs, and check that quoted text really appears on the cited page.

const UA = 'oauth-launch-guides/1.0 (+take-home prototype)';

function withTimeout(ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(timer) };
}

/** Grounding chunks point at vertexaisearch redirect URLs. Follow one hop to get the real page. */
export async function resolveRedirect(uri, ms = 6000) {
  if (!uri || !/vertexaisearch\.cloud\.google\.com/.test(uri)) return uri;
  const t = withTimeout(ms);
  try {
    const res = await fetch(uri, { method: 'GET', redirect: 'manual', signal: t.signal, headers: { 'user-agent': UA } });
    res.body?.cancel().catch(() => {}); // headers are all we need; release the connection
    return res.headers.get('location') || uri;
  } catch {
    return uri;
  } finally {
    t.done();
  }
}

export function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

// Forums and Q&A sites stay "community" even on the provider's own domain
// (devcommunity.pipedrive.com, community.hubspot.com): they hold developer reports, not policy.
const FORUM_HOST = /^(community|devcommunity|developer-community|forum|forums|discuss|discussions|answers|ideas|support-community)\./;
// Hosted documentation platforms: <provider>.readme.io, <provider>.gitbook.io and the like are the
// provider's own docs even though the domain is not theirs (pipedrive.readme.io).
const DOCS_HOSTS = ['readme.io', 'gitbook.io', 'mintlify.app', 'redoc.ly', 'stoplight.io', 'postman.com'];

const squash = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** official = provider's own pages; composio = composio.dev; everything else = community. */
export function classify(url, officialDomains = [], names = []) {
  const host = hostOf(url);
  if (!host) return 'community';
  if (host === 'composio.dev' || host.endsWith('.composio.dev')) return 'composio';
  if (FORUM_HOST.test(host)) return 'community';
  const doms = officialDomains.map((d) => d.toLowerCase().replace(/^www\./, '').replace(/^\*\./, ''));
  if (doms.some((d) => host === d || host.endsWith('.' + d))) return 'official';
  const docsHost = DOCS_HOSTS.find((d) => host.endsWith('.' + d));
  if (docsHost) {
    const sub = squash(host.slice(0, -(docsHost.length + 1)).split('.').pop());
    if (sub && names.map(squash).some((n) => n && (sub === n || sub.startsWith(n) || n.startsWith(sub)))) return 'official';
  }
  return 'community';
}

/** Light HTTP probe. Records what happened; never sends credentials. */
export async function probe(url, ms = 6000) {
  const t = withTimeout(ms);
  const started = Date.now();
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: t.signal, headers: { 'user-agent': UA } });
    res.body?.cancel().catch(() => {}); // status is all we need; release the connection
    return { url, ok: res.ok, status: res.status, finalUrl: res.url, ms: Date.now() - started };
  } catch (err) {
    return { url, ok: false, status: 0, error: err.name === 'AbortError' ? 'timeout' : err.message, ms: Date.now() - started };
  } finally {
    t.done();
  }
}

const NAMED = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', ndash: '-', mdash: '-', hellip: '...' };

// Turn HTML, markdown or JSON-embedded page text into comparable plain text.
// Script contents are kept: many docs sites ship their article text as JSON
// inside a script tag (GitHub Docs does), and that text is still the page's content.
function normalize(s, html = true) {
  return (s || '')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\"/g, '"')
    .replace(/\\n/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, (m) => (html ? ' ' : m))
    .replace(/<[^>]+>/g, (m) => (html ? ' ' : m))
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? m)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // markdown links -> text
    .replace(/\*\*|__|`/g, '') // markdown emphasis and code
    .replace(/\\([_*[\]()#.-])/g, '$1') // markdown escapes
    .replace(/[​-‍﻿]/g, '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

// Compare word sequences only. Docs sites put markup, JSX or table pipes between
// words; the words themselves, in order, are what a quote has to match.
// Pages are HTML; quotes are plain text and may contain things like <bot_scope>.
const words = (s, html = true) => normalize(s, html).match(/[a-z0-9]+/g) || [];

function contains(pageWords, quote) {
  const page = ` ${pageWords.join(' ')} `;
  const q = words(quote, false);
  if (!q.length) return false;
  if (page.includes(` ${q.join(' ')} `)) return true;
  // Allow small differences: 75% of the quote's 8-word windows must appear.
  if (q.length >= 8) {
    let hits = 0;
    let windows = 0;
    for (let i = 0; i + 8 <= q.length; i += 4) {
      windows++;
      if (page.includes(` ${q.slice(i, i + 8).join(' ')} `)) hits++;
    }
    return windows > 0 && hits / windows >= 0.75;
  }
  return false;
}

async function getText(url, signal) {
  // Google serves machine-translated docs based on the caller's location; ask for English.
  const u = new URL(url);
  if (/(^|.)google.com$|(^|.)google.dev$/.test(u.hostname) && !u.searchParams.has('hl')) u.searchParams.set('hl', 'en');
  const res = await fetch(u, {
    redirect: 'follow',
    signal,
    headers: { 'user-agent': UA, accept: 'text/html,text/plain,application/json,*/*', 'accept-language': 'en-US,en;q=0.9' },
  });
  if (!res.ok) {
    res.body?.cancel().catch(() => {});
    return null;
  }
  return res.text();
}

/**
 * Fetch the page and look for the quote.
 * Returns 'found', 'not-found' (page read, quote absent: likely paraphrased or changed),
 * or 'unreadable' (fetch failed, or the page is built by JavaScript and has no readable text).
 */
export async function checkQuote(url, quote, ms = 7000) {
  if (!url || !quote) return 'unreadable';
  const t = withTimeout(ms);
  try {
    const html = await getText(url, t.signal);
    if (html == null) return 'unreadable';
    let page = words(html);
    if (contains(page, quote)) return 'found';
    // Gatsby sites (developer.xero.com) render the article from a page-data JSON file.
    if (/\/page-data\/|gatsby/i.test(html)) {
      const u = new URL(url);
      const path = u.pathname.endsWith('/') ? u.pathname : `${u.pathname}/`;
      for (const prefix of ['/__gatsby/page-data', '/page-data']) {
        const data = await getText(`${u.origin}${prefix}${path}page-data.json`, t.signal).catch(() => null);
        if (!data) continue;
        const extra = words(data);
        if (contains(extra, quote)) return 'found';
        page = page.concat(extra);
        break;
      }
    }
    return page.length < 40 ? 'unreadable' : 'not-found';
  } catch {
    return 'unreadable';
  } finally {
    t.done();
  }
}
