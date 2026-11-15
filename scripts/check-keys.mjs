// Test every configured Gemini key with one small grounded request.
// Keys are reported by position (#1, #2, ...) and never printed.
//
//   node --env-file=.env scripts/check-keys.mjs [model]

import { listKeys } from '../lib/gemini.mjs';

const model = process.argv[2] || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const keys = listKeys();
if (!keys.length) {
  console.log('No keys found. Set GEMINI_API_KEY, GEMINI_API_KEY_2 ... or GEMINI_API_KEYS (comma-separated).');
  process.exit(1);
}

console.log(`${keys.length} key(s), model ${model}, with Google Search grounding`);
for (const [i, key] of keys.entries()) {
  const t = Date.now();
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ contents: [{ parts: [{ text: 'Which company makes Notion? One word.' }] }], tools: [{ google_search: {} }] }),
  });
  const data = await res.json().catch(() => ({}));
  const ms = Date.now() - t;
  if (data.error) {
    const quota = (data.error.details || []).flatMap((d) => d.violations || []).map((v) => `${v.quotaId}=${v.quotaValue}`).join(', ');
    console.log(`#${i + 1}  ${key.slice(0, 4)}…  FAIL ${data.error.code} ${data.error.status || ''} ${(quota || data.error.message || '').slice(0, 110)}  (${ms} ms)`);
  } else {
    const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks?.length || 0;
    console.log(`#${i + 1}  ${key.slice(0, 4)}…  OK   search results: ${chunks}  (${ms} ms)`);
  }
}
