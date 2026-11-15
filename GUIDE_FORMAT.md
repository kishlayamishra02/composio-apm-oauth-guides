# Guide format

Every guide is one JSON file. Verified library guides live in `public/data/guides/{slug}.json`. Guides the live agent writes are stored in Netlify Blobs and use the same shape, with `origin: "live-agent"`.

The format answers four questions in this order, because that is the order a developer asks them:

1. **Can I launch, and how long will it take?** (`one_liner`, `verdict`, `start_today`)
2. **Do I even need my own OAuth app?** (`composio`)
3. **What exactly do I do, and who does each part?** (`prerequisites`, `phases`, `scopes`, `approval`, `blockers`, `agent_split`)
4. **How sure are we?** (`sources`, `tested`, `uncertain`, plus `evidence` on every step)

```jsonc
{
  "slug": "gmail",                      // lowercase, a-z0-9 and dashes
  "app": "Gmail",
  "provider": "Google",                 // company that runs the developer program
  "website": "https://mail.google.com",
  "developer_portal": "https://console.cloud.google.com/",
  "category": "Email",
  "origin": "verified-seed",            // verified-seed | live-agent
  "last_checked": "2026-11-14",

  "one_liner": "Plain answer in 25 words or fewer.",

  "verdict": {
    "tier": "formal-review",            // instant | light-review | formal-review | partner-gated
    "difficulty": 4,                    // 1 (trivial) .. 5 (gated, may never be granted)
    "hands_on": "2–4 hours",            // the developer's own working time
    "approval_wait": "4–8 weeks",       // calendar time waiting on the provider; "None" if no review
    "total_to_production": "5–10 weeks",
    "wait_basis": "community-reported", // official | community-reported | estimate
    "confidence": "medium"              // high | medium | low
  },

  "start_today": {
    "summary": "What works before any approval.",
    "limits_before_approval": ["Up to 100 test users", "Refresh tokens expire after 7 days in Testing mode"]
  },

  "composio": {
    "managed_app": true,                // from https://docs.composio.dev/toolkits/managed-auth
    "note": "When you can use Composio's managed app, and when you need your own."
  },

  "prerequisites": [
    { "item": "Google Cloud project", "detail": "...", "cost": "free", "sources": ["s1"] }   // cost: free | paid | varies
  ],

  "phases": [
    {
      "name": "Create the OAuth client",
      "duration": "15 min",
      "steps": [
        { "text": "...", "owner": "you", "evidence": "sourced", "sources": ["s1"] }
        // owner:    you | agent | provider
        //   you      = needs the developer's identity, account, payment, legal attestation or final click
        //   agent    = an AI agent can do it end to end (draft text, prepare config, check URIs, run a test flow once credentials exist)
        //   provider = waiting on the provider
        // evidence: tested | sourced | uncertain
        //   tested    = we ran it (probe or setup attempt) and saw the result; describe it in `tested`
        //   sourced   = an official source in `sources` says so (quote recorded)
        //   uncertain = not confirmed by an official source; say why in `uncertain`
      ]
    }
  ],

  "scopes": [
    { "scope": "https://www.googleapis.com/auth/gmail.readonly", "purpose": "...", "review_impact": "security-assessment", "sources": ["s2"] }
    // review_impact: none | review | security-assessment | partner-only
  ],

  "approval": {
    "required": "for-sensitive-scopes",  // no | for-public-distribution | for-sensitive-scopes | for-production-access | always
    "trigger": "What triggers review.",
    "reviewers_check": ["..."],
    "typical_wait": "...",
    "common_rejections": ["..."],
    "sources": ["s3"]
  },

  "blockers": [
    { "blocker": "...", "fix": "...", "sources": ["s4"] }
  ],

  "agent_split": {
    "agent_can": ["..."],
    "you_must": ["..."],
    "provider_controls": ["..."]
  },

  "sources": [
    {
      "id": "s1",
      "title": "...",
      "url": "https://...",
      "kind": "official",                // official | composio | community
      "quote": "Verbatim text from the page, 40 words or fewer.",
      "accessed": "2026-11-14"
    }
  ],

  "tested": [
    { "what": "GET the authorize endpoint with a dummy client_id", "result": "HTTP 400 invalid_client", "date": "2026-11-14" }
  ],

  "uncertain": ["Claims we could not confirm, and why."]
}
```

## Rules

- A step is `sourced` only when an `official` or `composio` source in `sources` supports it, with a verbatim quote.
- Wait times are the hardest thing to source. Say where a number comes from in `wait_basis`, and never present a community report as official.
- `tested` means something actually ran. A docs read is `sourced`, not `tested`.
- If a claim cannot be confirmed, keep it out of the steps or mark it `uncertain` and explain it in `uncertain`.
