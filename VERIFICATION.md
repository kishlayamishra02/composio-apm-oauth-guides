# Verification: what I checked, corrected, and could not verify

Checked on 2026-11-14. Per-app detail, with every quote and probe command, is in [research/](research/).

## How the library was checked

1. **Research against live official docs.** One research agent per two or three apps, under a strict brief: verbatim quote (40 words or fewer) for every claim, official sources preferred, community sources labelled, no invented wait times, no accounts or form submissions, and a "could not verify" list. Brief and format: [GUIDE_FORMAT.md](GUIDE_FORMAT.md).
2. **Format validation.** `npm run check` checks every guide against the format: allowed values only, every cited source exists, and a step marked *sourced* must cite an official or Composio page. 7 of 7 pass.
3. **Independent quote re-check.** `scripts/recheck-sources.mjs` fetches every cited page again and looks for each quote, word for word. Results are in [evals/source-recheck.json](evals/source-recheck.json):

   | Guide | Quotes | Found on the live page | Not machine-readable | Not found |
   |---|---|---|---|---|
   | GitHub | 25 | 25 | 0 | 0 |
   | Notion | 25 | 25 | 0 | 0 |
   | Slack | 34 | 34 | 0 | 0 |
   | LinkedIn | 37 | 37 | 0 | 0 |
   | HubSpot | 56 | 55 | 1 | 0 |
   | Gmail | 52 | 51 | 1 | 0 |
   | Xero | 44 | 43 | 0 | 1 |
   | **Total** | **273** | **270 (98.9%)** | **2** | **1** |

   The 3 that did not match: two community pages block automated fetches (a CASA lab's price list and a HubSpot community thread), and one is a Wayback Machine snapshot of Xero's 2025 limits page, which shows the old 25-connection rule.

   Getting this check right took three fixes, and each one is now in the live agent too:
   - **Google serves location-based machine translations.** From this network, `developers.google.com` returned Vietnamese. The checker now asks for English.
   - **Many docs sites ship article text as JSON or compiled components** (GitHub Docs, Notion's MDX). The checker reads that text and compares word sequences, not raw HTML.
   - **Xero's docs are rendered client-side.** The checker reads the site's own Gatsby data files, as the research agent did.
4. **Review pass.** I read every guide's verdict against its sources, kept the tiers, and shortened the top-card values so they read at a glance (full detail stays in the one-line summary and the Approval section).
5. **No-account probes (the "tested" entries).** Each provider's authorize endpoint was called with a dummy client ID, and token endpoints with dummy values, and the error was recorded. Examples: GitHub and Google reject the unknown client, LinkedIn returns `The passed in client_id is invalid`, and Xero returns `unauthorized_client Unknown client or client not enabled`. This shows the endpoints in each guide are real and live. It does not test a setup step.

## What I learned or corrected

Several of these contradict widely repeated advice or older docs, including some of Composio's own setup pages.

| App | Finding | Why it matters |
|---|---|---|
| **Notion** | No review is needed for other workspaces to connect: *"Marketplace submission or review is not required."* The optional Marketplace listing is the only review (5–10 business days). | Older third-party guides describe a "Distribution" form and a security review before going public. Our first live-agent test made the same mistake (below). |
| **Notion** | The developer portal moved to `app.notion.com/developers/connections`; integrations are now "connections"; "public" is an installation-scope setting that cannot be changed after creation. | **Composio's Notion setup page still points to the old page and the old "Integration Type: Public" option.** |
| **GitHub** | Since 2026-08-14, new OAuth apps issue access tokens that expire after 8 hours, by default. | Long-held belief: OAuth app tokens never expire. If refresh is not handled, connections break after about 8 hours. The guide makes "test refresh before launch" a step. |
| **GitHub** | Your own OAuth app does not raise GitHub's 5,000 requests/hour limit: it is per user, shared across every app acting for that user. | Composio's general "dedicated quota" reason for bringing your own app does not apply here. |
| **Slack** | Since 2025-05-29, `conversations.history` and `conversations.replies` are limited to 1 request a minute and 15 messages per call for new non-Marketplace apps. Slack's method reference pages still say "Tier 3: 50+ per minute". | **Composio's managed Slack app is itself not Marketplace-approved, so it is throttled too.** Owning the app does not lift it; only Marketplace approval does. |
| **Slack** | The Marketplace bar went 10 → 5 active workspaces (Aug 2025) → back to 10 (Jul 2026). Apps with no in-Slack features, or that are only an MCP server, are listed as unsuitable. | Agent-style apps may not qualify for the one path that removes the throttle. |
| **Gmail** | Google's 2018 figure of $15,000–$75,000 for the CASA security assessment is outdated: Google now charges nothing, and labs price it themselves (one authorized lab lists entry level from $675). | Changes the cost estimate a developer would budget by two orders of magnitude. |
| **Gmail** | Brand verification is now an automated check that takes minutes. New OAuth clients have a fixed "Use this client for an AI-powered agent" setting. Client secrets are shown once. Unused clients are deleted after 6 months. | All new in the Google Auth Platform; none appear in Composio's Google guide. |
| **Gmail** | Google's limit is 100 refresh tokens per account per OAuth client. | Composio's Gmail FAQ says "~50". |
| **HubSpot** | There are no separate developer accounts any more, and the "Create App" button was switched off in May–June 2026; new apps are built with the HubSpot CLI. Unlisted apps stop at 25 installs (since 2025-09-22), with an "I accept the risk" prompt until listed. | **Composio's HubSpot setup guide still says to create a developer account and click Create App.** |
| **Xero** | The free limit for uncertified apps dropped from 25 connections to 5. Paid tiers replaced revenue share on 2026-03-02 (Core: 50 connections, AUD 35/month). | Many vendor docs still say 25. Composio has no managed Xero app, so every developer meets this. |
| **Xero** | New apps get granular scopes; old scopes like `accounting.transactions` are rejected. The developer terms now ban training AI models on Xero API data. | Old default scopes cause login errors on new apps. |
| **LinkedIn** | Self-serve products get no refresh tokens (those are for "a limited set of partners"), so users reconnect every 60 days. | Hurts always-on agents; easy to miss until day 61. |
| **LinkedIn** | The "Community Management must be the only product on the app" rule applies to the Development-tier request, not forever. | Developers can avoid running two apps permanently. |

**A pattern worth acting on:** in four of the seven apps (Notion, HubSpot, Gmail, Slack), a Composio setup page or FAQ was out of date relative to the provider's current docs. Provider developer programmes changed a lot in 2025–2026. Re-running the source check on a schedule, and diffing provider changelogs, would catch this drift.

## The live agent: what it got wrong and what I changed

The live agent writes guides for apps outside the library, so I tested it against verified guides.

- **One grounded question is not enough.** Asked directly whether a Notion public connection needs review, Gemini with Google Search answered "Yes". The official answer is no.
- **First full run on Notion** (`evals/live/notion.live.json`): the agent found the right fact ("review is not required") but built its headline and tier around the optional Marketplace listing, and used a Reddit post's "~4.5 weeks" over Notion's official 5–10 business days. Code-side evidence grading still marked it low confidence (7 of 15 steps sourced), which is the intended safety net.
- **Fix 1 (prompt rules):** optional listing reviews are not approval; install caps, test-user caps and throttles are limits before approval; an official timeline beats a community report. Unresolved search-redirect links are no longer accepted as sources. A research step that returns nothing retries in search-only mode, and transient model overloads retry automatically.
- **Calendly, an app outside the library** (`evals/live/calendly.live.json`): the agent quoted Calendly's docs correctly ("no API access is granted until scopes are explicitly requested and approved") but read "approved" as a Calendly review, and reported approval as always required with an unknown wait. I checked Calendly's app-creation page: you **select the scopes yourself** when creating the app, and the end user approves them on the consent screen ("users can decline scopes during install"). No provider review is documented. The quote check passed, because the quote was real: **checking quotes cannot catch a misreading.**
- **Fix 2 (user consent is not approval):** the agent must count something as provider approval only if a source shows a submission, a review team, criteria or a timeline, and must write "no provider review is documented" rather than "not required". The re-run (`evals/live/calendly.live-v2.json`) reports Calendly as instant, with no approval, which matches the docs.
- **Notion, second run** (`evals/live/notion.live-v2.json`): still wrong. It said public integrations "require Notion review", which was true in the past and is still repeated across the web. The evidence grader flagged it (low confidence, 5 of 14 steps sourced, 5 quotes not found on their pages), but a wrong headline with a low-confidence label is still a wrong headline.
- **Fix 3 (check the evidence before writing):** the writing step now re-reads every cited page **before** it writes, marks each quote "verified on page", "not on page" or "unreadable", and may base the headline, tier and approval answer only on official sources with verified quotes. Quotes are limited to 25 words, because Gemini blocked one long-quote answer as recitation.
- **Notion, third run, with fix 3** (`evals/live/notion.live-v3.json`): correct. "Developers can launch a public connection today for immediate use, with an optional 5–10 business day review for Marketplace listing"; approval wait "None", sourced to Notion's own docs. It still picked "light review" where the verified guide says "instant", a defensible but less precise tier.
- **Pipedrive, run live on the production site by typing the name** (80 seconds end to end; `evals/live/pipedrive.live.json` is the saved output): wrong where it matters. It said private apps are internal only and "cannot be shared with external users". Pipedrive's docs say the opposite: private apps "enable you to share your integration with any user/company in Pipedrive via a direct, unlisted installation link" and "don't have to go through the app approval process". Only a public Marketplace listing is reviewed (up to 21 business days).
  - **Cause:** two source-grading bugs. Pipedrive's docs live on `pipedrive.readme.io`, which was graded *community* because it is not a pipedrive.com domain, while posts on Pipedrive's own forum (`devcommunity.pipedrive.com`) were graded *official*. Fix 3 then trusted the wrong pages.
- **Fix 4 (source grading):** forums and Q&A subdomains (`community.`, `devcommunity.`, `forum.`, `discuss.` and so on) are community sources even on the provider's domain; docs hosted on `<provider>.readme.io`, `.gitbook.io` and similar platforms count as official. The registration research now asks directly whether an unlisted or private app can be installed by other companies through a link. The re-run (`evals/live/pipedrive.live-v2.json`): 11 of 14 steps backed by official pages (was 3 of 11), tier "light review", and "private apps can be shared directly without approval". It still reported the Marketplace review wait as unknown instead of the official 21 business days.

| Run | Headline correct? | Steps backed by official pages | Main error |
|---|---|---|---|
| Notion v1 | No | 7 of 15 | Optional listing review treated as approval |
| Notion v2 (fix 1) | No | 5 of 14 | Stale web claim that Notion reviews public integrations |
| Notion v3 (fix 3) | **Yes** | 6 of 10 | Tier one notch too cautious |
| Calendly v1 | No | 10 of 11 | User consent read as a Calendly review |
| Calendly v2 (fix 2) | **Yes** | 7 of 9 | Wording too certain ("not required" vs "not documented") |
| Pipedrive v1 (live site) | No | 3 of 11 | Docs on readme.io graded as community; forum graded as official |
| Pipedrive v2 (fix 4) | **Mostly** | 11 of 14 | Missed the official 21-business-day listing wait |

**What these tests taught me:** the live agent's main failure is not inventing facts. It is applying a real quote to the wrong question, or trusting stale web consensus over the provider's current page. Both get worse for apps whose rules changed recently, which is where a developer most needs the guide. That is why live guides are labelled unreviewed and show their evidence score, why a verified guide always takes priority, and why the path to the library goes through a human review of the uncertain items.

## What I could not verify

- **Real review waits.** Only Slack, HubSpot (listing review), Notion (listing), Gmail (about 6 weeks, "not guaranteed") and Xero (security assessment only) publish timelines. LinkedIn's Community Management and Xero's certification waits are developer reports only, and the guides say so.
- **Anything behind a login:** the current Notion connection form fields, HubSpot's install-limit behaviour after domain verification, LinkedIn's Page-admin verification for self-serve products.
- **Composio internals:** whether Composio's GitHub integration uses the new refresh tokens, its exact default scopes for Xero, whether its managed LinkedIn app has Community Management access, and whether a Composio-based agent counts as an "AI connector" for HubSpot.
- **Disputed facts:** whether existing Slack installs lost their rate-limit exemption in March 2026 (a community post says yes; the live official FAQ says no). Each guide lists these under "What remains uncertain".
- **Setup steps themselves.** No OAuth app was registered with any provider, so no step is marked *tested*. That is the clearest next step.
