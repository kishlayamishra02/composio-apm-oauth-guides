# Slack: research notes (checked 2026-11-14)

Guide: `public/data/guides/slack.json`. Verdict: **formal-review**, difficulty 4. Hands-on is 1–2 h to ship unlisted, plus 2–4 days of Marketplace prep (our estimate). Approval wait is **up to 10 business days + up to 10 weeks** (official). Total to production is 3–6 months including reaching 10 active workspaces (estimate). Confidence medium.

Method: docs.slack.dev pages were pulled with curl (HTML and `.md` variants), turned into text, and grepped. The changelog index (`https://docs.slack.dev/changelog/`) was scanned for every Marketplace and rate-limit entry. Quotes were matched verbatim against the downloaded text.

## Claims checked

| Claim | Source | Verbatim quote |
|---|---|---|
| A new app lives in one workspace and can be distributed listed or unlisted | https://docs.slack.dev/app-management/distribution/ | "When you create a Slack app, it resides in one workspace. You can also distribute Slack apps in either listed or unlisted fashion." |
| Unlisted distribution is for pilots; commercial apps should go to the Marketplace | same | "Distributing your unlisted app is perfect for when you want to test out your app by running a pilot for early customers; however, apps intended for commercial distribution should be submitted and approved for listing in the Slack Marketplace." |
| Public distribution steps (no review) | same | "Scroll to Share Your App with Other Workspaces within the Manage Distribution section. Ensure all items in the supplied checklist are completed. Click Activate Public Distribution." |
| SSL is required for distributed apps | same | "Slack apps open to installation by other workspaces have additional security requirements. Your app must support SSL for all of the following URLs:" |
| Some workspaces only allow Marketplace apps or need admin approval | same | "Some workspaces will restrict app installation so that only workspace administrators can provide authorization. Other workspaces may only allow the installation of apps officially listed in the Slack Marketplace." |
| Bot vs user scopes | https://docs.slack.dev/authentication/installing-with-oauth/ | "Bot scopes should be added as scope=<bot_scope>, and user scopes should be added as user_scope=<user_scope>." |
| Redirect rules | same | "The redirect_uri must use HTTPS." / "Your redirect_uri must match or be a subdirectory of a Redirect URL configured under App Management. A Redirect URL can not contain an anchor (#)." |
| **2025 rate-limit change: methods and limits** | https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps | "The new rate limits will be updated to allow 1 request per minute and will return a maximum of 15 objects per request." |
| Which methods, which apps | same | "The rate limits for both the conversations.history and conversations.replies API methods are changing from Tier 3 to Tier 1 for commercially distributed apps that are not approved for the Slack Marketplace" |
| Effective date: new apps and new installs | same | "New non-Marketplace applications and new installations of existing non-Marketplace applications will be subject to the updated rate limits immediately, as of May 29, 2025." |
| Existing installs exempt (live page, today) | same | "The new rate limits will not be applied to existing installations of unlisted, distributed applications published outside the Marketplace." |
| Internal / custom apps exempt | same | "Internal customer-built applications are not impacted by these changes. For Custom apps, the conversations.history and conversations.replies API methods are limited to 50+ requests per minute." |
| API terms dates | same | "The updated terms are effective immediately for applications created on or after May 29, 2025. They will go into effect on June 30, 2025 for apps created before May 29, 2025." |
| Terms: the Marketplace is the only channel for commercial distribution, including templated custom apps | same | "the Slack Marketplace is the only appropriate channel for commercially distributing apps built with Slack APIs, whether those apps are "unlisted" (published outside of the Marketplace) or provide a customer instructions for a templated custom app that connects to your product." |
| Clarification (June 3, 2025) | https://docs.slack.dev/changelog/2025/06/03/rate-limits-clarity | "Any internal customer-built apps will maintain their existing rate limits and will not be subject to the new posted limits." |
| Review timeline (official) | https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide/ | "Currently, the preliminary part of the review takes up to 10 business days to receive feedback, while the functional review takes up to 10 weeks for new submissions and 6 weeks for published apps resubmitting changes." |
| 10+ active workspaces before submitting | same | "Your app has been installed on 10 or more active workspaces and the service has been tested on those workspaces in accordance with the above bullet. An active workspace is a workspace that has been used in the past 28 days." |
| Demo video required | same | "A short video demo is required for new submissions and for updates that add functionality or scopes." |
| Test account required | same | "We request that your submitted app be in a production-ready state and that you provide us with test account credentials needed to access your service" |
| Live config is locked after publishing | same | "Once your app is published in the Slack Marketplace, the live version of your app is locked." |
| Install threshold back to 10 (Sept 2026) | https://docs.slack.dev/changelog/2026/09/01/slack-marketplace-install-requirement | "As of July 2026, we require that apps submitting to the Slack Marketplace have at least 10 installations on active workspaces, up from the temporary lower threshold." |
| Low-usage submissions not reviewed; 30-day lockout (Nov 2026) | https://docs.slack.dev/changelog/2026/11/02/slack-marketplace-submission-criteria | "Slack Marketplace submissions that meet the low-usage criteria will not be reviewed." / "Apps that don’t meet these thresholds will be unable to resubmit for 30 days" |
| Unsuitable: no in-Slack functionality; MCP-only | https://docs.slack.dev/slack-marketplace/slack-marketplace-app-guidelines-and-requirements/ | "do not include functionality in Slack." / "provide only an MCP server without meaningful in-Slack functionality." |
| Enhanced review for broad-data scopes | same | "your submission will be subject to an enhanced review, to reduce the risk of unexpected behavior. These scopes include: search:read.*, *:history, files:read, and canvases:read" |
| Privacy policy required | same | "All Slack Marketplace apps must include a clear privacy policy that details how third-party data is handled and this page should be accessible on your app’s landing page." |
| AI disclosures | same | "DO add a disclaimer to your landing page and long description to let users know of the app's potential to generate inaccurate responses, summaries or other outputs if it uses a LLM." |
| Composio managed Slack app is NOT Marketplace-approved yet | https://docs.composio.dev/toolkits/slack.md | "Composio is working on Marketplace review for the managed Slack app. Until that review is complete, use the workspace's own Slack OAuth app or ask a workspace admin to approve the app if the warning blocks users." |
| Composio sees the 15-message cap | same (SLACK_FETCH_CONVERSATION_HISTORY tool, `limit` param) | "Slack may return fewer than requested, especially for non-Marketplace apps where Slack can cap each page at 15 messages." |
| Composio recommends the workspace's own app | same | "Use the workspace's own OAuth app, which is recommended and safest." |
| Composio managed Slack exists | https://docs.composio.dev/toolkits/managed-auth.md | Row "`SLACK`" under "Composio-managed OAuth available (128)" |

## Surprises / corrections

1. **Marketplace entry bar was raised twice in 2026.** On July 8, 2025, Slack lowered the requirement from 10 to 5 active workspaces from August 11, 2025 ("starting August 11th we will be reducing this requirement from 10 to 5 active workspaces!", https://docs.slack.dev/changelog/2025/07/08/slack-marketplace). It went **back to 10 in July 2026** (changelog dated 2026-09-01), and the app must "stay at 10 or more installed workspaces throughout the entire duration of the review." On **November 2, 2026**, Slack added: low-usage submissions are not reviewed at all, and you are locked out for 30 days. Blog posts from late 2025 that say "5 workspaces" are out of date.
2. **Composio's own managed Slack app is non-Marketplace,** so it is subject to the same 1 req/min, 15-message limits on conversations.history/replies for new installs. Composio's toolkit docs say so indirectly. A developer who expects the managed app to avoid the throttle will be disappointed. Owning the app does not fix it either; only Marketplace approval does.
3. **Slack's method reference pages do not show the throttle.** On 2026-11-14, `conversations.history` and `conversations.replies` show only "Tier 3: 50+ per minute", and the general Rate limits page has no non-Marketplace note. The limit appears only in the May 29, 2025 changelog/FAQ. Anyone sizing load from the method pages will be off by 50x.
4. **The "each customer creates their own Slack app" workaround has a terms problem.** Internal customer-built apps keep 50+ req/min and 1,000 objects, and Composio calls the workspace's own app "recommended and safest". But Slack's updated API terms name "a templated custom app that connects to your product" as not an appropriate channel for commercial distribution.
5. **Existing-install status is disputed.** The live official FAQ (checked today) still says existing installs are exempt. A community post (dev.to, 2026-03-09, https://dev.to/helen_mireille_47b02db70c/slack-just-throttled-your-openclaw-agent-you-probably-havent-noticed-yet-d4) says: "That grace period ended March 3, 2026." A web-search summary also claimed that an older revision of the FAQ named September 2, 2025 and then March 3, 2026 as cutover dates. We could not load an archived copy (Wayback returned HTTP 429), and the changelog index has no entry announcing it. We treat this as unverified. It does not affect a new app, which is throttled from day one.
6. **Agent-style apps may not qualify for the Marketplace at all.** The guidelines list "do not include functionality in Slack" and "provide only an MCP server without meaningful in-Slack functionality" as unsuitable. An AI agent that only reads and writes Slack from outside through Composio tools needs real in-Slack features to have a chance, and *:history scopes add an enhanced review.

## Could not verify

- **The March 3, 2026 cutover for existing installs**: community-only (see above).
- **Real-world review durations.** Official: up to 10 business days + up to 10 weeks. Community: Viktor (vendor blog, published 2026-02-24, updated 2026-11-12, https://viktor.com/blog/slack-marketplace-ai-agent) says "The typical review process takes 2-3 months. Viktor was approved in two weeks after its viral launch". A levelup.gitconnected.com write-up surfaced by search (said to report about 4 months) returned HTTP 403, so we did not cite it.
- **The exact 10-workspace rule.** The review guide and the Sept 2026 changelog say 10+ active workspaces are required; the Nov 2026 low-usage rule says fewer than 10 workspaces **and** fewer than 20 MAU. It is unclear whether an app with under 10 workspaces but 20+ MAU can submit. The guide tells developers to plan for 10.
- **Bot vs user token.** Whether the throttle differs by token type (Composio's Slack toolkit acts as a user). The changelog speaks only of apps.
- **Hands-on estimate** for Marketplace prep (2–4 days) is ours.
- **The Manage Distribution checklist items** themselves. Docs say only "Ensure all items in the supplied checklist are completed"; we did not sign in to see them.

## Probes run (no account, 2026-11-14)

```bash
curl -s -o sl-probe1.html -A "Mozilla/5.0" -w "%{http_code} redirect=%{redirect_url}\n" \
  "https://slack.com/oauth/v2/authorize?client_id=0000000000.0000000000&scope=chat:write&redirect_uri=https%3A%2F%2Fexample.com%2Fcb&state=probe123"
# -> 200, 4,087-byte JS app shell; no server-side error text for the fake client_id

curl -s -A "Mozilla/5.0" -w "\nHTTP %{http_code}\n" -X POST "https://slack.com/api/oauth.v2.access" \
  -d "client_id=0000000000.0000000000&client_secret=dummy&code=dummy"
# -> {"ok":false,"error":"invalid_code"}  HTTP 200

curl -s -o /dev/null -A "Mozilla/5.0" -w "%{http_code} redirect=%{redirect_url}\n" "https://api.slack.com/apps"
# -> 200

curl -sL "https://api.slack.com/changelog/2025-05-terms-rate-limit-update-and-faq" -w "%{url_effective}"
# -> redirects to https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps/ (byte-identical to the direct fetch)

curl -sL "https://docs.slack.dev/apis/web-api/rate-limits.md" | grep -i "marketplace\|unlisted"
# -> no matches (the general rate-limit page does not mention the non-Marketplace limits)
```
