# HubSpot — research notes

Checked 2026-11-14. HubSpot serves every docs page as markdown (`<url>.md`); quotes below are copied from that raw markdown with link and bold markup removed. Community quotes come from the forum's raw JSON.

## Claims checked

| # | Claim | Source | Verbatim quote |
|---|-------|--------|----------------|
| 1 | Install caps by app type | https://developers.hubspot.com/docs/apps/developer-platform/build-apps/manage-apps-in-hubspot | "Static token apps: can only be installed in 1 standard HubSpot account at a time…"; "Privately distributed OAuth apps: can be installed in up to 10 allowlisted accounts (not including developer test accounts)."; "Marketplace OAuth app prior to listing: can be installed in up to 25 accounts (not including developer test accounts)."; "Marketplace OAuth app after being listed: can be installed in unlimited accounts." |
| 2 | Cap start date and Solutions Partner exception | https://developers.hubspot.com/changelog/new-marketplace-distribution-app-install-limits (Sep 22, 2025) | "Starting on September 22nd, 2025, apps that are created or migrated to version 2025.2 are capped at 25 installs until they are listed on the HubSpot Marketplace." / "…or up to 100 customer portals when the app is created in a Solutions Partner portal" |
| 3 | AUP must be signed before customer installs | manage-apps-in-hubspot | "Review and sign the Acceptable Use Policy (AUP). Until the AUP is signed, you won't be able to install your app in accounts other than developer test accounts." |
| 4 | Unverified warning and typed confirmation | manage-apps-in-hubspot | "If your app has not yet been verified by the HubSpot Ecosystem Quality team, a warning banner will appear…" / "Then type I accept the risk, and click Connect to authorize the app." |
| 5 | Verified domain via DNS TXT; timing; one per account | manage-apps-in-hubspot | "The verification process usually completes within an hour, but you may need to wait up to 48 hours for the new DNS information to propagate." / "You can only have one verified domain per developer account." |
| 6 | Verified-domain app still shows a "not reviewed" banner until listed | manage-apps-in-hubspot | "When an app does have a verified domain but isn't officially listed on the HubSpot Marketplace, HubSpot will display the verified domain, along with a banner to indicate that the app hasn't been reviewed or explicitly approved by HubSpot." |
| 7 | App config: distribution and auth | https://developers.hubspot.com/docs/apps/developer-platform/build-apps/app-configuration | "marketplace: used if you want the app to be eligible for listing in the HubSpot Marketplace." / "private: used if you only want to install your app in a specific set of allowlisted accounts, or a single account at a time." |
| 8 | Redirect URLs must be HTTPS | app-configuration | "Each app must have at least one auth redirect URL, and it must use HTTPS. The only exception is that http://localhost is allowed for testing." |
| 9 | Scope types | https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/scopes | "Required scopes: scopes that must be authorized by the user and must be present in the scope query parameter…" / "Optional scopes: scopes that are not required to successfully install your app." |
| 10 | `oauth` scope added by default | scopes | "Basic scope required for OAuth. This scope is added by default to all apps." |
| 11 | Token endpoint is /oauth/v3/token | https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/oauth/working-with-oauth | "You'll then make an API request to /oauth/v3/token with a request body that includes the code, the redirect_uri, your app's client_id and client_secret" |
| 12 | Apps are built with the CLI | https://developers.hubspot.com/docs/apps/developer-platform/build-apps/create-an-app | "To create an app on the latest version of the developer platform, you'll need to install the HubSpot CLI and authenticate it with your account using the `hs account auth` command." |
| 13 | No new legacy apps | https://developers.hubspot.com/docs/apps/developer-platform/overview | "New legacy apps cannot be created." |
| 14 | Legacy public app creation dates | https://developers.hubspot.com/changelog/legacy-public-app-creation-sunset (announced Apr 23, 2026) | "New accounts (created on or after May 26, 2026): Legacy public app creation is disabled as of May 26, 2026." / "Existing accounts (created before May 26, 2026): Legacy public app creation is disabled as of June 23, 2026." |
| 15 | Developer accounts folded into standard accounts | https://developers.hubspot.com/docs/getting-started/account-types | "As of August 28, 2025, all standard HubSpot accounts now have access to the same functionality in the development overview…" / "as of March 9, 2026, all legacy developer accounts were migrated to standard HubSpot accounts." |
| 16 | Standard account can be free | account-types | "It can be free or paid, and is used as your production environment." |
| 17 | 10 developer test accounts | account-types | "You can create up to 10 test accounts to test apps and integrations without affecting any real HubSpot data." |
| 18 | Listing: 3 active installs | https://developers.hubspot.com/docs/apps/developer-platform/list-apps/listing-your-app/app-marketplace-listing-requirements | "Installs: your app must have at least three active, unique installs." / "Active installs are the number of unique HubSpot production accounts, unaffiliated with your organization, showing successful app activity within the past 30 days." |
| 19 | Listing: OAuth only | listing requirements | "OAuth: your app must use OAuth as its sole authorization method." |
| 20 | Listing: AI connectors | listing requirements | "if your app is an AI connector - an app that primarily connects HubSpot to external generative AI tools - it must require user-level permissions by setting access to user-level or be built with HubSpot's MCP Server." |
| 21 | Listing review timing | listing requirements | "Once you submit your listing, the HubSpot Ecosystem Quality team will complete an initial review within 10 business days." / "The entire app review and feedback process should take no more than 60 days from the time feedback is shared." |
| 22 | One submission at a time | listing requirements | "you can only submit one app at a time for approval. Any additional apps submitted while the initial app is being processed will automatically be rejected." |
| 23 | Listing content rules | listing requirements | "All URLs in your HubSpot Marketplace listing must lead to live, publicly available, and functional pages." / "All objects selected in your OAuth scopes should be documented in the Shared data table." |
| 24 | Partner agreement | listing requirements | "Terms: you must review and agree to the terms in HubSpot's Technology Partner Program Agreement." |
| 25 | Sensitive Data scopes need HubSpot approval for marketplace apps | https://developers.hubspot.com/docs/api-reference/latest/crm/properties/sensitive-data | "you’ll need to request access to specific sensitive scopes from HubSpot’s Ecosystem Quality team." |
| 26 | Certification eligibility | https://developers.hubspot.com/docs/apps/developer-platform/list-apps/apply-for-certification/applying-for-app-certification | "You will not be able to apply unless your app has been listed for at least 6 months and has at least 60 active installs and the needed amount of API traffic." |
| 27 | Certification validity | .../certification-requirements | "App certifications are valid on a rolling basis for two years, and must be renewed." |
| 28 | User-level apps: setup and limits | https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/user-level-apps | "make sure you're on the latest version of the HubSpot CLI (`8.15.0`), and that the `platformVersion` field is set to `2026.09`…" / "existing apps using account-level access cannot currently be migrated to user-level access." / table row "Webhooks (v3, v4) \| Yes \| No" |
| 29 | Composio managed HubSpot app exists but is unverified | https://docs.composio.dev/toolkits/hubspot | "Composio-managed OAuth available? Yes" / "HubSpot shows this warning because the default Composio-managed HubSpot OAuth app is still awaiting HubSpot approval." |
| 30 | Composio scope categories must match HubSpot | https://docs.composio.dev/toolkits/hubspot | "Scopes in Composio `scopes` must be configured in HubSpot as Required or Conditionally required." / "For custom auth, we usually recommend keeping the required list minimal:" |
| 31 | Composio HubSpot triggers need a public app | https://docs.composio.dev/toolkits/hubspot | "HubSpot webhooks require a public app with an App ID and Developer API Key. Private or internal apps cannot receive webhooks." |
| 32 | Composio redirect URI | https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app; /white-labeling-authentication | "For OAuth toolkits, the dashboard shows the redirect URI to add in the provider's developer portal." / "Register `https://backend.composio.dev/api/v3/toolkits/auth/callback` as the provider's authorized redirect URI." |
| 33 | No manual exceptions to caps (staff) | https://community.hubspot.com/t/new-marketplace-distribution-app-install-limits/139886 (chighsmith, 2026-04-30) | "we don’t grant manual exceptions or temporary increases to the documented install limits for marketplace or private distribution apps." |

## Surprises / corrections

1. **There is no separate developer account any more, and the "Create App" button is gone.** Since Aug 28, 2025 every standard HubSpot account has the Development section; legacy developer accounts were converted to standard accounts on Mar 9, 2026. Legacy public app creation was switched off on May 26, 2026 (new accounts) and June 23, 2026 (existing accounts). New apps are CLI projects (`hs project create`, `hs project upload`) configured in `app-hsmeta.json`. Composio's own guide at https://composio.dev/auth/hubspot still says "Visit the HubSpot developer portal and create a new developer account" and "Navigate to Apps … click Create App", which no longer works for new apps.
2. **Unlisted public apps now have a 25-install cap.** Since Sep 22, 2025, apps created on or migrated to platform 2025.2+ stop at 25 installs until listed; private OAuth distribution stops at 10 (100 for Solutions Partners). Legacy public apps created earlier never had this cap, and older guides don't mention it. A HubSpot staff member said in Apr/May 2026 that no exceptions are granted.
3. **Your own app also shows an unverified-app warning until it is listed.** Users must type "I accept the risk". Moving off Composio's managed app (which Composio says is itself unverified) does not remove the warning on day one; a verified domain softens it, and only Marketplace review removes it.
4. **AI connector rule has changed twice.** Nov 2025 changelog: to list an AI connector, "developers must rebuild their app using the official HubSpot MCP server (BETA)… Only CRM read operations are currently available." Current listing requirements: user-level access **or** the MCP server. User-level apps went GA in platform 2026.09 (Fall 2026 spotlight). Account-level apps cannot be converted, and user-level apps don't support webhooks, custom workflow actions, app events or serverless functions, and only part of the REST API.
5. **Token endpoint is now documented as `/oauth/v3/token`.** Our probe showed `/oauth/v1/token` still answers the same way, so existing integrations keep working.
6. **Listing needs real customers first:** 3 active installs from unaffiliated production accounts with API activity in the last 30 days. You can't list a brand-new app with zero users.
7. **Composio's recommended optional scopes include legacy HubSpot scopes** (`tickets`, `timeline`), which HubSpot's scope list marks "Legacy" and recommends migrating to granular scopes (e.g. `crm.objects.tickets.read`, `timeline.read`).
8. **Platform versions move fast:** 2025.1 and older are sunset; 2025.2 is supported through March 2027; current is 2026.03 / 2026.09. HubSpot says apps on an unsupported version cannot be listed.

## Could not verify

- **Real listing wait times.** Only HubSpot's targets are official (initial review within 10 business days; whole cycle no more than 60 days from feedback). One community data point: "Its been more than 2 weeks since we submitted the app for review." (mnuser, 2026-05-11). The staff reply in that thread says resubmissions after feedback are prioritized; that is not in the docs.
- **Whether a Composio-backed agent counts as an "AI connector".** HubSpot defines it as an app that "primarily connects HubSpot to external generative AI tools" (listing requirements) or "directly to general-purpose generative AI assistants or agents" (Nov 2025 changelog). A vertical agent may fall outside it; HubSpot decides at review.
- **Whether Composio's HubSpot toolkit works with a user-level app**, or which token endpoint (v1 or v3) Composio calls. Not documented by Composio.
- **Whether the typed "I accept the risk" dialog still appears for a verified-domain, unlisted app.** The docs describe the banner for verified domains but tie the dialog to apps "not yet verified by the HubSpot Ecosystem Quality team".
- **Hands-on time and total time to unlimited installs** are our estimates.

## Probes run

All without accounts or credentials, 2026-11-14.

```
curl -s -o hs-auth-probe.html -w "HTTP %{http_code} redirect=%{redirect_url}\n" \
 "https://app.hubspot.com/oauth/authorize?client_id=00000000-0000-0000-0000-000000000000&scope=oauth%20crm.objects.contacts.read&redirect_uri=https%3A%2F%2Fbackend.composio.dev%2Fapi%2Fv3%2Ftoolkits%2Fauth%2Fcallback"
```
Result: `HTTP 200`, no redirect. Body is the JavaScript app shell (`window.__hsipltan = "oauth-ui"`). The bad client ID is not rejected server-side, so this probe can't show the error a user would see.

```
curl -s -X POST https://api.hubapi.com/oauth/v3/token -H "Content-Type: application/x-www-form-urlencoded" \
 -d "grant_type=authorization_code&client_id=00000000-0000-0000-0000-000000000000&client_secret=dummy&redirect_uri=https://backend.composio.dev/api/v3/toolkits/auth/callback&code=dummy"
```
Result: `HTTP 400` `{"status":"BAD_AUTH_CODE","message":"missing or unknown auth code","correlationId":"…","error":"invalid_request","error_description":"missing or unknown auth code"}`

```
curl -s -X POST https://api.hubapi.com/oauth/v1/token  (same body)
```
Result: `HTTP 400`, same `BAD_AUTH_CODE` body. Both endpoints are live; the code is checked before the client.

```
for u in https://developers.hubspot.com/ https://app.hubspot.com/developer-overview https://app.hubspot.com/signup-hubspot/crm https://ecosystem.hubspot.com/marketplace/apps https://legal.hubspot.com/technology-program-agreement https://developers.hubspot.com/changelog/legacy-public-app-creation-sunset; do curl -s -o /dev/null -A "Mozilla/5.0" -w "$u -> %{http_code}\n" "$u"; done
```
Result: all 200 except `app.hubspot.com/developer-overview` → 404 (the development overview lives inside an account, not at a public URL).

Community pages: `curl` to community.hubspot.com thread URLs returned 403, but `https://community.hubspot.com/t/139886.json` returned 200 JSON, which is where the staff and developer quotes come from.
