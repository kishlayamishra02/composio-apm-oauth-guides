# OAuth Launch Guides

**Live:** https://oauth-launch-guides.netlify.app · **Source:** https://github.com/kishlayamishra02/composio-apm-oauth-guides

A developer building an AI agent wants their users to connect an app. Before launch they may need their own OAuth app with the provider, approved. This tool answers, for any app: **do I need my own OAuth app, how much work is it, how long will approval take, what can block me, and what can an agent do for me?**

It has two parts:

- **A verified library** of guides for apps with very different setup paths, checked against the providers' official docs with a quote for every source.
- **A live research agent.** Type any app name or website; in about a minute it investigates the app, writes a guide in the same format, checks its own citations, and gives you a shareable link.

## Try it

| App | Why it is in the library | Tier |
|---|---|---|
| [GitHub](https://oauth-launch-guides.netlify.app/guide/github) | The baseline: no review at all (but tokens now expire after 8 hours) | Instant |
| [Notion](https://oauth-launch-guides.netlify.app/guide/notion) | No review; the optional Marketplace listing is often mistaken for one | Instant |
| [HubSpot](https://oauth-launch-guides.netlify.app/guide/hubspot) | Same day for 25 installs, then a Marketplace listing review; platform rebuilt in 2025–26 | Formal review |
| [Slack](https://oauth-launch-guides.netlify.app/guide/slack) | Installs freely, but non-Marketplace apps (Composio's managed one included) are throttled | Formal review |
| [Gmail](https://oauth-launch-guides.netlify.app/guide/gmail) | Restricted scopes: verification plus a CASA security assessment, about 6 weeks | Formal review |
| [Xero](https://oauth-launch-guides.netlify.app/guide/xero) | No Composio managed app; free limit cut from 25 to 5 connections in 2026 | Formal review |
| [LinkedIn](https://oauth-launch-guides.netlify.app/guide/linkedin) | Company Page features sit behind a partner programme with two review stages | Partner gated |

**Live generation:** search for anything without a verified guide (for example Calendly, Pipedrive or `https://www.zoho.com/crm`) and watch the agent work.

## What a guide tells you

1. **Can I launch, and how long will it take?** Difficulty tier, your hands-on time and the approval wait as separate numbers, and what works today before approval.
2. **Do I even need my own OAuth app?** From Composio's managed-app catalog: 128 of 415 OAuth toolkits already have one.
3. **What do I do, and who does it?** Phases and steps, each tagged *You*, *Agent can do* or *Provider wait*, plus scopes and what they trigger, the approval process, and blockers with fixes.
4. **How sure is this?** Every step is *tested*, *sourced* or *uncertain*; every source has a verbatim quote; wait times say whether the provider published them or developers reported them.

Guides can be shared by link, copied or downloaded as Markdown, printed to PDF, and used as a checklist (progress is saved in the browser).

## Key decisions

Full reasoning in [DECISIONS.md](DECISIONS.md).

- **Start from "do you even need your own app?"** Composio's managed apps let many developers launch today. Without this, a guide can push someone into weeks of verification they did not need yet.
- **Hands-on time and approval wait are separate numbers.** "An hour or weeks?" is usually "an hour of work, then weeks of waiting", and those need different plans.
- **Tiers are about what gates distribution**, not step count: instant, light review, formal review, partner gated.
- **Each step names its owner** (you, an agent, or the provider), which answers "what can an agent do for me" step by step.
- **Evidence is graded by code, not by the model.** A live step is "sourced" only if it cites the provider's own domain, and the agent re-reads cited pages to check its quotes.
- **The agent runs as four short steps** (identify → three parallel investigations → write from findings only → verify), so the developer can watch what it searched and read, and each step fits a serverless call.

## What I verified, corrected and could not verify

Full write-up in [VERIFICATION.md](VERIFICATION.md); per-app notes with every quote and probe in [research/](research/).

- **270 of 273 quotes (98.9%)** were found word for word on the live source pages by an independent re-check. The other 3 are pages that block automated fetches or an archived snapshot.
- **Corrections that change a developer's plan:** Notion needs no review (the Marketplace listing is optional); GitHub OAuth tokens now expire after 8 hours by default; Composio's managed Slack app is not Marketplace-approved, so it gets the 1-request-a-minute history throttle; Xero's free limit dropped from 25 to 5 connections; the CASA assessment for Gmail costs from hundreds of dollars, not Google's old $15,000–$75,000 figure.
- **Composio's own setup pages had drifted** from the provider docs for Notion, HubSpot, Gmail and Slack.
- **I tested the live agent on Notion, Calendly and Pipedrive** (Pipedrive typed into the production site, 80 seconds end to end) and compared each run with the official docs. Its failures were not invented facts. It applied real quotes to the wrong question (Calendly's "scopes requested and approved" means user consent, not a Calendly review), trusted stale web consensus over the provider's current page (Notion), and graded sources wrongly (Pipedrive's readme.io docs as community, its forum as official). Four fixes followed, the main one being to check every quote before the guide is written. After them, all three headlines match the docs; one run still missed an official wait time. The table is in [VERIFICATION.md](VERIFICATION.md).
- **Not verified:** real review waits where providers publish none, anything behind a login, Composio internals, and setup steps themselves (no OAuth apps were registered).

## Run it locally

Requirements: Node 20+, the [Netlify CLI](https://docs.netlify.com/cli/get-started/) (`npm i -g netlify-cli`), and a Gemini API key with billing or free-tier quota (Google AI Studio).

```bash
npm install
cp .env.example .env          # add GEMINI_API_KEY
netlify dev                   # http://localhost:8888
```

Without a key, run the whole UI and API with canned model responses:

```bash
GEMINI_MOCK=1 GEMINI_API_KEY=mock netlify dev
```

Other commands:

```bash
npm run generate -- "Calendly"                     # run the agent from the CLI, prints the guide JSON
npm run generate -- --batch apps.txt --dir evals/batch   # batch mode for growing the library
npm run check                                      # validate every library guide against GUIDE_FORMAT.md
npm run directory                                  # refresh the Composio toolkit catalog
```

**Deploy:** `netlify deploy --prod --build`, with `GEMINI_API_KEY` set in the site's environment variables. Optional: backup keys `GEMINI_API_KEY_2` … `GEMINI_API_KEY_10` (or a comma-separated `GEMINI_API_KEYS`), tried in order when a key runs out of credits or quota (`node --env-file=.env scripts/check-keys.mjs` tests each one without printing it); `GEMINI_MODEL` (default `gemini-2.5-flash`); `RATE_LIMIT_PER_IP` (default 12 a day); `RATE_LIMIT_GLOBAL` (default 150 a day); `RATE_SALT`.

## Limitations

- **No real setup attempts yet.** I did not register OAuth apps with providers (that needs accounts on each). "Tested" currently means no-account probes, such as calling the authorize endpoint with a dummy client ID and recording the error. Registering test apps is the next step and would turn many "sourced" steps into "tested" ones.
- **Live guides are unreviewed drafts.** They are labelled as such, show their evidence score, and point to a verified guide when one exists.
- **Wait times are rarely published.** Most are developer reports, and the guide says so.
- **JavaScript-rendered docs** cannot be quote-checked automatically; those sources are marked "not machine-readable".
- **Provider rules change.** Each guide shows its check date; a scheduled re-check is not built.
- **Cost controls are basic:** per-network and global daily caps on live generation, and a 14-day cache per app.
- **Model quota.** A guide takes about 6 model calls, and the free Gemini tier allows 20 requests a day per project, about 3 guides. A billed key removes that limit; until then the demo runs on a few backup keys. When every key is out, the site says so and the library keeps working.
- **Speed.** A live guide usually takes one to three minutes, mostly the model reading pages. It runs as a background job, so a slow model cannot time it out.

## How I used agents

- **Research agents** wrote the verified guides: each worked from live official docs with a strict evidence brief (verbatim quote per claim, label community sources, never invent wait times, list what could not be confirmed, no accounts or form submissions). Their notes, including what they corrected, are in `research/`.
- **The live agent** (Gemini with Google Search grounding and URL context) is the product: discover, research in parallel, synthesize from findings only, verify.
- **A coding agent** (Claude Code) helped build the app. Every guide was then checked with the format validator and a review pass.

## Repository layout

```
public/                 static site (vanilla JS, no build step)
  data/guides/*.json    verified library guides
  data/directory.json   Composio OAuth toolkit catalog (managed vs bring-your-own)
  js/render.js          guide renderer + Markdown export (escapes all model text)
netlify/functions/      jobs.mjs (start + poll jobs), agent-background.mjs (the agent run), guides.mjs
lib/                    pipeline.mjs, prompts.mjs, gemini.mjs, sources.mjs
scripts/                generate, check-guides, recheck-sources, check-keys, build-library, build-directory
research/               per-app verification notes
GUIDE_FORMAT.md         the guide contract shared by library and live guides
DECISIONS.md            product and technical decisions
VERIFICATION.md         what was checked, corrected, and left uncertain
```
