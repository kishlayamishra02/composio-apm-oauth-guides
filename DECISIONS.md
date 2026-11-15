# Key decisions

## 1. Start from "do you even need your own OAuth app?"

A Composio developer's users connect through an OAuth app. Composio runs a managed OAuth app for 128 of the 415 OAuth toolkits in its catalog ([managed-auth](https://docs.composio.dev/toolkits/managed-auth)). For those, the developer can launch today; their own app is an upgrade for consent-screen branding, extra scopes, dedicated rate limits, faster trigger polling, or self-hosted instances ([custom vs managed](https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app.md)). For the other 287, registering an app with the provider is on the launch path.

So every guide opens with that answer, and the directory on the home page marks every toolkit as managed or bring-your-own. **Without this, a guide can scare a developer into weeks of Google verification they did not need for launch.**

## 2. Split hands-on time from approval wait

The brief's core question is "an hour or weeks of waiting?". The honest answer is usually both: an hour of work, then weeks of waiting on the provider. The two need different plans (do the work now; start the review early, build on test mode meanwhile), so the guide shows them as separate numbers, plus a "Can you start today?" box that lists what works before approval and its limits (test-user caps, install caps, token expiry in test mode).

## 3. Classify by what gates distribution, not by step count

Four tiers: **instant**, **light review**, **formal review**, **partner gated**. Registering an app is minutes almost everywhere. What separates GitHub from Gmail from LinkedIn is what stands between "works for me" and "works for my users": nothing, a short or optional review, a formal verification with a security assessment, or a partner application that can be refused. The tier answers "how hard is this" in one word, and it maps directly to a plan.

## 4. Every step says who does it: you, an agent, or the provider

The brief asks what an agent can do and where the developer takes over. The answer differs by step, so each step carries an owner:

- **Agent can do:** draft the privacy policy and app description, pick minimal scopes, prepare reviewer answers and the demo-video script, check redirect URIs, run a test OAuth flow once credentials exist.
- **You:** account creation, identity and business verification, legal attestations, payments, DNS changes, the final submit click.
- **Provider wait:** review queues.

The phase timeline colours its bars by owner, so a developer sees at a glance how much is their time versus waiting.

## 5. Evidence on every step, graded by code, not by the model

Each step is **tested**, **sourced** or **uncertain**, and each source keeps a verbatim quote. Wait times carry their basis (official / community-reported / estimate), because providers rarely publish them and a developer planning a launch needs to know whether "2–4 weeks" is a promise or a forum anecdote.

For live guides, the model proposes; code decides. A step is "sourced" only if it cites a page on the provider's official domains; the verify step re-fetches cited pages to look for each quote and downgrades steps whose quotes are missing. The model never gets to label its own work "tested".

## 6. The live agent: four steps, research in parallel, evidence checked before writing

```
discover  ──►  research × 3 (parallel)  ──►  check quotes ─► synthesize  ──►  verify
 identify       register / review / limits    re-read every    from verified     grade evidence,
 app + portal   grounded search + page reads  cited page       official quotes   probe portal
```

- **It runs as a background job.** The first version ran each step as its own serverless call to fit Netlify's 60-second limit. On a slow model day one research call took 87 seconds, so the agent now runs in a background function (15-minute limit) that saves progress after every step, and the page polls it. The developer still sees each step as it happens: searches run, pages read, what could not be confirmed.
- **Why the trace is shown:** it makes the agent's reasoning inspectable, which matters for a tool whose output people act on.
- **Evidence is checked before the guide is written, not only after.** Testing showed the agent's main failure is not inventing facts but trusting stale web consensus, or applying a real quote to the wrong question. So every cited page is re-read first, each quote is marked verified or not, and the headline, tier and approval answer may rest only on official quotes found on the page. Forum subdomains count as community even on the provider's domain; docs hosted on `<provider>.readme.io` count as official.
- **Why three research facets:** the checklists come from what verifying the library taught: approval is rarely about the OAuth app itself; it is triggered by distribution, sensitive scopes, or a partner programme, and the real launch limits sit in test mode, install caps and rate limits. One broad search misses these; three focused ones find them.
- **Why the synthesis step gets no web access:** it may only use the findings, each with a source id, so every claim in the guide traces back to a page.
- **Job state stays on the server** (Netlify Blobs). The browser only passes a job id, so nobody can inject content into a saved, shareable guide.
- **Existing guides first:** if the app already has a verified guide, or the agent researched it in the last 14 days, the developer is pointed there before more research is spent.
- **Model:** Gemini with Google Search grounding and URL context: search is built into the model API, so there is no separate search provider. The model is an environment variable. Several keys can be configured; when one runs out of credits or quota, requests fail over to the next.

## 7. Library and live guides share one format

`GUIDE_FORMAT.md` is the contract. Verified guides are files in the repo; live guides are stored in Blobs and are rendered by the same page, with a banner that says which kind it is. That keeps the path from "agent draft" to "verified guide" short: generate, run `scripts/check-guides.mjs`, have a person review the uncertain items, commit.

## 8. How this scales to 100 guides

`scripts/generate.mjs --batch apps.txt` runs the same pipeline over a list. The order matters more than the count:

1. **Bring-your-own toolkits first**, ranked by demand. Developers have no choice there, so a guide removes a real blocker.
2. **Managed toolkits with known "outgrow" triggers next**, such as Google's restricted scopes or Slack's non-Marketplace rate limits, where developers hit the wall after launch.
3. Every batch guide goes through the checker and a human pass on its uncertain items before it joins the verified library.

## 9. Scope I chose not to build

- **Real setup attempts with developer accounts.** The brief allows it, and it is the most valuable next step: it turns "sourced" into "tested" and finds what docs leave out. It needs accounts on each provider, so this version is limited to no-account probes and says so.
- **User accounts, editing, comments.** Shareable links and Markdown export cover "use and share" without them.
- **Scheduled re-checks.** Each guide shows its check date; a weekly re-run of the verify step would catch rotted sources.
