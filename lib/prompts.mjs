// Prompts for the live agent. The investigation checklists come from what we
// learned verifying the library guides: approval is rarely about the OAuth app
// itself. It is triggered by distribution, by sensitive scopes, or by a partner
// programme, and the real limits sit in test mode, install caps and rate limits.

const TODAY = () => new Date().toISOString().slice(0, 10);

const CONTEXT = `Context: a developer is building an AI agent (for example on Composio, an integration platform). Their users will connect the app below through OAuth. The developer may need to register their OWN OAuth app with the provider and get it approved before other people's accounts can connect. We are writing a practical guide to that process.`;

export function discoverPrompt(query) {
  return `STEP: discover
${CONTEXT}
Today is ${TODAY()}.

The developer typed: "${query}" (an app name or website).

Identify the app and its developer programme. Use Google Search and read the official pages.
Return ONLY a JSON object, no prose:
{
  "app": "official product name",
  "provider": "company that runs the developer programme",
  "website": "https://...",
  "category": "2-3 word category, e.g. CRM, Email, Project management",
  "official_domains": ["every domain the provider uses for its product and developer docs, including hosted docs such as <name>.readme.io or <name>.gitbook.io, e.g. slack.com, api.slack.com, slack.dev"],
  "developer_portal": "URL where developers register apps / OAuth clients, or null",
  "oauth": "yes | no | unclear",
  "oauth_docs_url": "official OAuth documentation URL, or null",
  "other_auth": ["api-key", "basic", "jwt", "..."],
  "is_real_app": true,
  "notes": "One sentence on anything surprising (OAuth only for partners, API needs a paid plan, app was renamed, input was ambiguous)."
}
If the input does not match a real product, set "is_real_app": false and explain in notes.`;
}

const FACETS = {
  register: {
    title: 'Registering the OAuth app and what works before approval',
    checklist: [
      'Where developers register an OAuth app or client, and what account is needed (free developer account, sandbox, paid plan, partner signup).',
      'The kinds of app the provider offers (public vs private/internal/unlisted, OAuth app vs installable app) and which one lets OTHER customers\' accounts connect. In particular: can an unlisted or private app be installed by OTHER companies through a direct link, without review? Many providers allow this; "private" often does not mean "internal only".',
      'Required fields: app name, logo, homepage, privacy policy, terms, support email, redirect URIs (HTTPS only? localhost allowed? exact match?).',
      'Credentials you receive (client ID, client secret, PKCE), token lifetime, refresh tokens, token expiry.',
      'What works immediately, before any review: your own account or workspace only? a test-user cap? an install or connection cap? shorter token expiry in test mode?',
      'Prerequisites that block people: company page, verified domain, business verification, minimum plan.',
    ],
  },
  review: {
    title: 'Approval before other people\'s accounts can connect',
    checklist: [
      'Is any review, verification or approval BY THE PROVIDER required before other people\'s accounts can authorise the app? Is it required for all apps, or only for some? Careful: docs often say scopes must be "requested and approved" when they mean the END USER approves them on the consent screen. Only call it a provider review if the docs describe a submission, a review team, review criteria or a timeline.',
      'What triggers it: public distribution, sensitive or restricted scopes, marketplace listing, production access, passing a user or install count.',
      'Is a marketplace or directory listing review separate from OAuth access? Can an app be used by other accounts without being listed?',
      'What reviewers check and what you must submit: privacy policy, terms, demo video or screencast, test account, security questionnaire, third-party security assessment, business verification.',
      'Published timelines or SLAs from the provider, and real waits that developers report (forums, GitHub issues, community posts). Keep the two apart.',
      'Common rejection reasons, recertification (annual reviews), and what happens to existing users while under review.',
    ],
  },
  limits: {
    title: 'Scopes, plans, rate limits and recent changes',
    checklist: [
      'The scopes or permissions an AI agent typically needs (read and write) and which are sensitive, restricted or partner-only.',
      'Paid plans or tiers needed to use the API, for the developer or for the end customer.',
      'Rate limits, especially lower limits for new, unreviewed or unlisted apps.',
      'Changes in the last 18 months: new review rules, deprecations, new limits, pricing changes. Give dates.',
      'Data-use rules that affect AI agents (for example restrictions on using API data to train models).',
      'Self-hosted, regional or sandbox instances that need a separate app.',
    ],
  },
};

export const FACET_KEYS = Object.keys(FACETS);

export function researchPrompt(facet, d) {
  const f = FACETS[facet];
  if (!f) throw new Error(`Unknown facet ${facet}`);
  return `STEP: research:${facet}
${CONTEXT}
Today is ${TODAY()}.

App: ${d.app} (provider: ${d.provider}; website: ${d.website})
Official domains: ${(d.official_domains || []).join(', ') || 'unknown'}
Developer portal: ${d.developer_portal || 'unknown'}
OAuth docs: ${d.oauth_docs_url || 'unknown'}

Research topic: ${f.title}
Find out:
${f.checklist.map((c, i) => `${i + 1}. ${c}`).join('\n')}

How to research:
- Use Google Search, then READ the official pages (developer docs, policies, help centre). Do not rely on search snippets.
- Prefer official sources. Community sources (forums, Reddit, blogs, GitHub issues) are allowed for real-world wait times and gotchas, and must be labelled community.
- Every finding must cite one specific page URL and include a short verbatim quote copied from that page (25 words or fewer: one sentence is best). Never paraphrase inside "quote".
- If the docs are silent or you are unsure, put it in open_questions instead of guessing.
- Note the date of any change you report.

Return ONLY a JSON object, no prose:
{
  "findings": [
    { "claim": "one plain-English fact", "url": "https://...", "quote": "verbatim text from that page", "kind_hint": "official | community" }
  ],
  "open_questions": ["things you could not confirm"]
}
Aim for 6 to 12 findings.`;
}

const CHECK = { found: 'quote verified on page', 'not-found': 'quote NOT on page', unreadable: 'page unreadable' };

export function synthesizePrompt({ discovery, composio, sources, openQuestions }) {
  const srcList = sources
    .map((s) => `[${s.id}] (${s.kind}; ${CHECK[s.quote_check] || 'quote not checked'}) ${s.url}\n  claims: ${s.claims.join(' | ')}\n  quote: "${s.quote}"`)
    .join('\n');
  return `STEP: synthesize
You write OAuth setup guides for developers building AI agents. Today is ${TODAY()}.
Write the guide for ${discovery.app} (provider ${discovery.provider}) from the research below ONLY. Do not add facts from memory. If the research does not cover something, leave it out or list it in "uncertain".

Composio fact (authoritative, do not change): ${composio
    ? `Composio ${composio.managed ? 'DOES provide a managed OAuth app' : 'does NOT provide a managed OAuth app'} for the ${composio.name} toolkit (${composio.managed ? 'developers can launch on it today and only need their own app for their own branding on the consent screen, extra scopes, dedicated rate limits, faster trigger polling or self-hosted instances' : 'developers must register their own OAuth app'}).`
    : 'This app is not in Composio\'s OAuth toolkit catalog.'}

Research sources (cite them by id). Before you saw them, each cited page was fetched again and searched for its quote:
- "quote verified on page": the quote is really on that page. Strongest evidence.
- "quote NOT on page": the page was read and the quote is not there; the claim may be paraphrased, outdated or invented. Weak.
- "page unreadable": the page could not be read automatically. Neutral.
Base the one_liner, verdict, tier, start_today and approval on OFFICIAL sources with verified quotes whenever they exist. When a verified official source and any other source disagree, the verified official source wins, and the disagreement goes in "uncertain". Claims backed only by community sources or by quotes not on the page may appear in steps marked "uncertain", never in the verdict.
${srcList || '(none)'}

Open questions from research: ${openQuestions.join(' | ') || 'none'}

Tier definitions (pick one):
- instant: anyone can register and other accounts can connect the same day, no review (GitHub OAuth apps are the reference).
- light-review: works for your own account at once, and public distribution needs a short or optional review, a listing, or carries limits until reviewed (Slack, Notion, HubSpot style).
- formal-review: other accounts are blocked or capped until a formal verification, often with a demo video or security assessment, taking weeks (Google restricted scopes are the reference).
- partner-gated: the useful API needs an application to a partner programme that can be refused or take months (LinkedIn Community Management API is the reference).

Owners for each step:
- "you": needs the developer's identity, account, payment, legal attestation, DNS change or the final submit click.
- "agent": an AI agent can do it end to end: draft the privacy policy or app description, pick minimal scopes, prepare review answers, write a demo-video script, check redirect URI settings, run a test OAuth flow once credentials exist.
- "provider": waiting on the provider.

Return ONLY a JSON object with exactly these keys:
{
  "one_liner": "honest answer in 25 words or fewer: can they launch and how long will it take",
  "verdict": { "tier": "instant|light-review|formal-review|partner-gated", "difficulty": 1-5, "hands_on": "e.g. 30–60 min", "approval_wait": "e.g. None, 1–2 weeks, Unknown", "total_to_production": "e.g. Same day", "wait_basis": "official|community-reported|estimate", "confidence": "high|medium|low" },
  "start_today": { "summary": "what works before any approval", "limits_before_approval": ["..."] },
  "composio_note": "one or two sentences applying the Composio fact to this app",
  "prerequisites": [ { "item": "...", "detail": "...", "cost": "free|paid|varies", "sources": ["s1"] } ],
  "phases": [ { "name": "...", "duration": "...", "steps": [ { "text": "...", "owner": "you|agent|provider", "evidence": "sourced|uncertain", "sources": ["s1"] } ] } ],
  "scopes": [ { "scope": "...", "purpose": "...", "review_impact": "none|review|security-assessment|partner-only", "sources": ["s2"] } ],
  "approval": { "required": "no|for-public-distribution|for-sensitive-scopes|for-production-access|always", "trigger": "...", "reviewers_check": ["..."], "typical_wait": "...", "common_rejections": ["..."], "sources": ["s3"] },
  "blockers": [ { "blocker": "...", "fix": "...", "sources": ["s4"] } ],
  "agent_split": { "agent_can": ["..."], "you_must": ["..."], "provider_controls": ["..."] },
  "uncertain": ["..."]
}
Rules:
- "Approval" means approval needed before OTHER people's accounts can connect through OAuth. An OPTIONAL marketplace, gallery or directory listing review is NOT approval: if other accounts can connect without it, set approval.required to "no" (or the real trigger), keep the tier at "instant" or "light-review", set approval_wait to "None", and mention the optional listing and its timeline in "trigger" or a blocker. Do not put an optional listing wait in the one_liner or verdict.
- The END USER consenting to scopes on the authorization screen is NOT approval either. Wording like "scopes must be requested and approved" usually means user consent. Count it as provider approval only if a source describes a submission, a review team, review criteria or a timeline. If the sources do not show a provider review, write "no provider review is documented" (not "no review is required"), set approval.required to "no", keep confidence at most "medium", and list the question in "uncertain".
- Install caps, test-user caps, unverified-app warnings and throttled rate limits for unreviewed apps DO count: they mean other accounts are limited until review, so describe them in start_today.limits_before_approval and pick the tier accordingly.
- When an official source gives a timeline, use it and set wait_basis "official". A community report that disagrees goes in "uncertain", not in the verdict.
- 3 to 5 phases, 2 to 6 steps each, in the order a developer does them. Steps are concrete actions, starting with a verb.
- A step is "sourced" only if it cites an official or composio source that supports it. Otherwise "uncertain".
- Never invent a wait time. Use the provider's published timeline ("official"), a cited community report ("community-reported"), or say it is an "estimate" and explain it in "uncertain".
- "confidence" is low if most steps are uncertain or the review process is not documented.
- Plain, direct language. No marketing words.`;
}
