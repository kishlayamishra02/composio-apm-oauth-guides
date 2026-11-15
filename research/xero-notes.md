# Xero research notes

Checked 2026-11-14. Guide: `public/data/guides/xero.json`. Composio managed app: no.

Note on method: developer.xero.com documentation pages are client-rendered (WebFetch returned only the title). Doc text was read from the site's own Gatsby data files, e.g. `https://developer.xero.com/__gatsby/page-data/documentation/guides/oauth2/limits/page-data.json`. The `/pricing` and `/faq/*` pages are server-rendered and were read directly with curl.

## Claims checked

| Claim | Source | Verbatim quote |
|---|---|---|
| No Composio managed app | https://docs.composio.dev/toolkits/xero.md | "Composio-managed OAuth available? No" |
| Xero listed as bring-your-own | https://docs.composio.dev/toolkits/managed-auth.md | Under "Bring your own OAuth app (287)": "Xero ... `XERO`" |
| Redirect URI from Composio dashboard | https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app.md | "For OAuth toolkits, register an app in the provider's developer portal and add the redirect URI from the dashboard." |
| Composio guide: Web app, paste exact URI | https://composio.dev/auth/xero | "For the Redirect URI, paste the exact value you copied from Composio before starting." |
| Web app, not Mobile/Desktop | https://docs.composio.dev/kb/guide/toolkits-xero.md | "verify the Xero developer app is configured as a `Web app`, not `Mobile or Desktop`." |
| Remove deprecated scopes | same | "Remove the deprecated/invalid Xero scopes `accounting.journals.read`, `accounting.reports.read`, `accounting.transactions`, and `accounting.transactions.read` from the auth config." |
| 10-minute consent window | same | "restart the auth flow and complete the Xero consent step within the 10-minute window." |
| Five tiers and caps | https://developer.xero.com/pricing | "Starter Core Plus Advanced Enterprise Connections (maximum) 5 50 1000 10,000 No Limit" |
| Tier fees and egress | https://developer.xero.com/faq/pricing-and-policy-updates | "Monthly Tier Fee No charge $35 AUD $245 AUD $1445 AUD Price on Application"; "the overage fee for Xero API usage egress is $2.40 AUD per GB" |
| Prerequisites per tier | https://developer.xero.com/pricing (raw table cells) | Prerequisites row: Starter empty, Core empty, Plus/Advanced/Enterprise "App Certification"; next row: Advanced/Enterprise "Security Assessment (initial and annual)"; Payment Method: Starter "Not Applicable", others "Required" |
| Effective date | pricing FAQ #01 | "Changes to app tiers and pricing model changes will take effect on 2 March, 2026." |
| 6th connection needs payment | pricing FAQ #24 | "The Starter tier has unlimited data access to enable early innovation but is capped at 5 connections. In order to add a 6th connection, you will need to first add your payment details." |
| Caps until tier requirements met | pricing FAQ #14 | "Your connections are capped at the tier maximums until you meet that tier's requirements." |
| AI/ML training ban | pricing FAQ #04 | "The primary update prohibits the use of data obtained through Xero’s APIs to train or contribute to the creation of any AI or machine learning model." |
| No bots simulating users | pricing FAQ #05 | "Clarifying that apps must not use bots or browser extensions to undermine our security controls or simulate user actions." |
| Premium features | pricing FAQ #20 | "The Journals endpoint, Xero Practice Manager API, and Bulk Connections require a security assessment (initial and annual) and use case approval, and they are only available starting at the Advanced tier." |
| Current uncertified limit | limits doc (page-data) | "New apps default to the starter tier with 5 connections. Moving up to Core will give you up to 50 connections." |
| Five uncertified apps per org | same | "Additionally, each organisation or practice is limited to connecting a maximum of five uncertified apps." |
| Rate limits | same | "Daily Limit: 1,000 calls per day for starter, 5,000 calls per day for higher tiers"; "App Minute Limit: 10,000 calls per minute" |
| Old limit was 25 | Wayback 2025-07-09 of limits page-data | "Uncertified apps will be limited to 25 connections." |
| Flows and 5-tenant limit | OAuth overview (page-data) | "Apps using the code or PKCE flow can connect to a maximum of 5 tenants." |
| HTTPS redirect | auth-flow (page-data) | "This must be an https address, however for testing you can use http://localhost/" |
| Token lifetimes | same | "id_token: 5 minutes - access_token: 30 minutes - refresh_token: 60 days" |
| Granular scopes for new apps | scopes doc (page-data) | "Since March 2026, all new and existing Web and PKCE apps have been assigned granular scopes." |
| Granular scopes FAQ | https://developer.xero.com/faq/granular-scopes | "Apps created on or after 2 March 2026 will use the new granular scopes" |
| offline_access needed for refresh | scopes doc | "To get a refresh token, you must request the offline_access scope." |
| Certification checkpoints | certification-checkpoints (page-data) | "To become certified, your integration with Xero needs to meet our minimum requirements." |
| offline_access required for certification | same | "Using the offline_access scope is a requirement for certification." |
| App name rule | same | "The application name must reflect the go-to-market name of your app or product and cannot include the word Xero." |
| Scope justification | same | "Unexplained or ambiguous use of scopes will not be allowed." |
| How to apply | building-and-growing-your-app (page-data) | "Once you’re on the Core Plan, you can then upgrade to the Plus Plan and get certified as part of the upgrade." |
| Review prerequisites | same | "Checking your app meets prerequisites e.g. you’ve built Sign Up with Xero and have ten active customer connections." |
| Security assessment timing | https://developer.xero.com/faq/xero-ecosystem-security-requirements-update | "Typically the assessment takes around 5 working days to complete, followed by 5-10 working days for us to assess your answers." |
| Refresh token expiry | https://developer.xero.com/faq/oauth2 | "Unused refresh tokens expire after 60 days." |
| Redirect URI count | same | "You can use up to 50 redirect URIs for your app." |
| Custom Connections closing | https://developer.xero.com/faq/custom-integration | "From 1 December 2026, we are making changes to Custom Connections. From that date, you won't be able to: Create a new Custom Connection app Buy a new Custom Connection subscription" |
| Partner timeline (community) | https://docs.codat.io/integrations/accounting/xero/xero-app-partner-program | "It can take several months to become a Xero App Partner" |

## Surprises / corrections

1. **The free uncertified limit dropped from 25 to 5.** Old rule (Xero limits page archived 2025-07-09): "Uncertified apps will be limited to 25 connections." Current rule (limits page and pricing, effective 2 March 2026): Starter 5 connections free; Core 50 connections for $35 AUD/month with a card on file and no certification. Many vendor docs (CData, Railz) still say 25.
2. **Revenue share replaced by paid tiers.** Pricing FAQ #02: "Xero will no longer be pricing based on a revenue-share model". Five tiers (Starter free / Core $35 / Plus $245 / Advanced $1,445 AUD per month / Enterprise on application), plus API egress metering (10 / 50 / 250 GB included, then $2.40 AUD/GB). Announced 4 December 2025, effective 2 March 2026; existing apps migrated from mid-March 2026. Xero App Store Subscriptions (XASS) billing must be removed by 1 July 2026.
3. **Starter daily rate limit is 1,000, not 5,000.** Limits page: "1,000 calls per day for starter, 5,000 calls per day for higher tiers". The `/faq/limits` page still says "Daily Limit: 5000 calls per day" (stale). The July 2025 archive said 5,000 for everyone.
4. **Uncertified apps per organisation rose from two to five.** Archive 2025-07-09: "a maximum of two uncertified apps". Current limits page: "a maximum of five uncertified apps". The Custom Integration FAQ still says "an org can have 2 uncertified apps" (stale).
5. **Granular scopes for every app created on or after 2 March 2026.** `accounting.transactions`, `accounting.transactions.read` and `accounting.reports.read` are deprecated; old apps can keep them until September 2027. Composio's own knowledge base tells users to remove these (plus `accounting.journals.read`) from the Xero auth config. A developer creating a new Xero app today who keeps old default scopes will hit login/invalid-scope errors.
6. **Custom Connections close to new customers on 1 December 2026** (two weeks after this check). Existing ones keep working; unused subscriptions must be connected or cancelled by 15 February 2027.
7. **Developer Terms now ban AI/ML training on Xero API data** and bots or browser extensions that simulate user actions (applies immediately to developers who registered on or after 4 December 2025). Directly relevant to AI-agent builders.
8. **Certification now happens through a paid tier upgrade.** You reach Plus by clicking Manage Plan from Core; certification is part of that upgrade. App Store listing needs Plus or above.

## Could not verify

- **Certification review time.** Xero publishes none. Only Codat (integration vendor): "It can take several months to become a Xero App Partner". Searches for first-hand developer reports (Reddit, Stack Overflow, dev.to) found nothing usable. The guide uses `wait_basis: community-reported` and says Xero publishes no timeline.
- **Whether Core needs certification.** Pricing table and FAQ #24 say only a payment method; pricing FAQ #22 asks about "the 'App certification' requirement for the Core, Plus, Advanced, and Enterprise tiers". Treated the table and #24 as authoritative but flagged it.
- **Whether Sign Up with Xero is required.** Growth guide lists it as a prerequisite; certification checkpoints say "Although not a requirement, we encourage Apps to implement Sign Up with Xero"; OAuth overview says it "is optional".
- **Who needs a security assessment.** Pricing table: Advanced and Enterprise only. Older security FAQ (2020 text, still live): "All app partners will need to undertake a security assessment" and "App partners will not be certified or listed ... without passing these assessments."
- **Whether the Demo Company counts toward the 5-connection Starter cap.** Not stated in current docs (older third-party docs said the demo company was excluded from the old 25 cap).
- **Composio's exact default Xero scopes.** Not visible on the doc pages read (toolkit page truncated; no scope list on composio.dev/auth/xero, which says "Keep the default scopes, or adjust them"). A search snippet claimed defaults include `accounting.transactions`, but I did not see that on a page, so it is not used as a claim.

## Probes run

All from Git Bash with curl, no account, no credentials, user agent `Mozilla/5.0 (probe)`.

1. `curl -s -D x_auth_h.txt -w "HTTP %{http_code} | redirect: %{redirect_url}" "https://login.xero.com/identity/connect/authorize?response_type=code&client_id=DUMMYCLIENTID0000000000000000000&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback&scope=openid%20profile%20email%20offline_access&state=probe123"`
   Result: HTTP 302 to `https://login.xero.com/identity/error?errorId=...`. Following it (`curl -L`): HTTP 200 page with text "Error: unauthorized_client Unknown client or client not enabled Error code: 500".
2. `curl -s https://identity.xero.com/.well-known/openid-configuration`
   Result: HTTP 200; `"issuer":"https://identity.xero.com"`, `"authorization_endpoint":"https://login.xero.com/identity/connect/authorize"`, `"token_endpoint":"https://identity.xero.com/connect/token"`, `"grant_types_supported":["authorization_code","client_credentials","refresh_token"]`, `"code_challenge_methods_supported":["S256"]`.
3. `curl -s -X POST https://identity.xero.com/connect/token -u "DUMMYCLIENTID0000000000000000000:dummysecret" -H "Content-Type: application/x-www-form-urlencoded" --data "grant_type=authorization_code&code=dummy&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback"`
   Result: HTTP 400 `{"error":"invalid_client"}`.
4. `curl -s -o /dev/null -w "HTTP %{http_code}" https://developer.xero.com/app/manage` and `https://developer.xero.com/pricing`
   Result: both HTTP 200; pricing page HTML contains the five-tier table.
5. Doc reads (not probes of the OAuth flow): `https://developer.xero.com/__gatsby/page-data/documentation/<path>/page-data.json` for limits, scopes, overview, auth-flow, pkce-flow, custom-connections, getting-started-guide, development-accounts, certification-checkpoints, app-partner-guides/faqs, pathways-to-grow, building-and-growing-your-app (all HTTP 200). Archive: `http://web.archive.org/web/20250709064509id_/https://developer.xero.com/page-data/documentation/guides/oauth2/limits/page-data.json` (HTTP 200, gzip).
