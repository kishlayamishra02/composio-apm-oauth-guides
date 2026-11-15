# LinkedIn research notes

Checked 2026-11-14. Guide: `public/data/guides/linkedin.json`. Composio managed app: yes for LinkedIn; LinkedIn Ads is listed under "Bring your own OAuth app".

## Claims checked

| Claim | Source | Verbatim quote |
|---|---|---|
| Composio has a managed LinkedIn app | https://docs.composio.dev/toolkits/linkedin.md | "Composio-managed OAuth available? Yes" |
| Managed app is shared and rate-limited | https://docs.composio.dev/toolkits/linkedin.md | "The default OAuth app is shared across users and has strict rate limits. Use your own OAuth app for production to avoid shared quotas." |
| Scope conflict noted by Composio | https://docs.composio.dev/toolkits/linkedin.md | "LinkedIn restricts certain scope combinations. For example, `w_member_social` and `r_organization_admin` cannot be used together." |
| LinkedIn Ads needs own app | https://docs.composio.dev/toolkits/managed-auth.md | Listed under "Bring your own OAuth app (287)": "Linkedin Ads ... `LINKEDIN_ADS`" |
| Redirect URI comes from the Composio dashboard | https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app.md | "For OAuth toolkits, the dashboard shows the redirect URI to add in the provider's developer portal." |
| Only open permissions are self-serve | https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access (updated 2026-06-03) | "Open Permissions are the only permissions that are available to all developers without special approval." |
| Open permissions = profile, email (OIDC), w_member_social (Share) | same | Table rows "Sign in with LinkedIn using OpenID Connect / profile", "... / email", "Share on LinkedIn / w_member_social" |
| App needs a default Page | https://www.linkedin.com/help/linkedin/answer/a548360 | "API Products available to individual developers must have a default page associated with them." |
| Page super admin approves within 30 days | same | "Your page super admin has 30 days to approve the request." |
| App is permanently tied to its Page | same | "permanently associated with a specific LinkedIn Page" |
| CM must be the only product on the app | https://learn.microsoft.com/en-us/linkedin/shared/linkedin-api-partner-support-guide (updated 2026-06-03) | "The Community Management API requires that it be the only product associated with a developer application due to legal and security constraints." |
| Verification app can be discarded; Standard can move to main app | same | "The newly created developer application is used for verification purposes only and can be discarded after approval." |
| 21-day vetting survey | same | "You must complete this survey within 21 days from the date it is triggered." |
| Ads Standard tier review time (official) | same | "The review process can take up to 30 business days due to the high volume of requests." |
| CM only for registered orgs | https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review (updated 2026-02-11) | "At this time, our Community Management APIs are only available to registered legal organizations for commercial use cases only." |
| Personal email fails | same | "Personal email addresses won't pass the vetting process." |
| Page admin must verify app | same | "Ensure a super admin of the LinkedIn Page associated with your organization has verified your application." |
| No LinkedIn names in app name | same | "Ensure that your application doesn't include any portion of the LinkedIn or Microsoft names or logos (e.g. Linked or In)." |
| Rejection means new app | same | "You won't be able to re-apply for Development tier access with your existing app." |
| Standard tier needs screencast | same | "To get access to Standard tier, you'll be required to complete this access request form and submit a screen recording of your app." |
| Tiers and Dev tier limits | https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access (updated 2026-10-19) | "500 API calls for an app for 24 hrs" / "100 API calls per member of an App for 24 hrs" |
| 12-month Dev tier window | same | "You must complete your integration and testing within twelve months of receiving the API access." |
| Approval is discretionary | same | "LinkedIn reserves the right to review applications and select partners at its discretion and a partner might not be upgraded even if they meet these minimum requirements." |
| r_member_social closed | https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview | "`r_member_social` is a **closed** permission. We're not accepting access requests at this time due to resource constraints." |
| 60-day access tokens | https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow (updated 2026-05-15) | "Currently, all access tokens are issued with a 60-day lifespan." |
| Refresh tokens partners only | same | "Programmatic refresh tokens are available for a limited set of partners." |
| Scope change invalidates tokens | same | "If you request a different scope than the previously granted scope, all the previous access tokens are invalidated." |
| Refresh tokens for MDP partners | https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens | "LinkedIn supports programmatic refresh tokens for all approved Marketing Developer Platform (MDP) partners." |
| Data storage limits | https://learn.microsoft.com/en-us/linkedin/marketing/restricted-use-cases | "member social activity data can only be stored for 48 hours, and most member profile data can only be stored for 24 hours." |
| Share rate limits | https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin | Rate Limits table: "Member 150 Requests", "Application 100,000 Requests" (daily, UTC) |
| Rejection reasons | https://www.linkedin.com/help/linkedin/answer/a1449586/ | "Incomplete Access Request Form", "Unapproved Use Case", "Fail Email Verification", "Invalid Screencast", "Invalid App Name", ... |

## Surprises / corrections

1. **The single-product rule applies to the request, not forever.** Common belief: "Community Management must be the only product on your app, so you need two apps forever." Current docs: the CM *Development tier request* must come from an app with no other products, but after Standard approval you can request CM Standard on your existing app by entering the verification app's client ID, and the verification app "can be discarded after approval" (partner support guide FAQ, updated 2026-06-03; CM overview FAQ #1 and #5: "Can the Community Management API product be added to an existing app? Yes, follow the steps in FAQ #1.").
2. **Development tier limits were raised.** Older guidance: 100 calls per app and 10 per member per day. Current CM overview FAQ #3: "Per App: Increased from 100 to 500 requests. Per Member: Increased from 10 to 100 requests." Increasing Access (updated 2026-10-19) also states 500 / 100. Some blogs still quote the old numbers.
3. **No refresh tokens for self-serve apps.** Many guides assume OAuth refresh works everywhere. LinkedIn issues programmatic refresh tokens only to approved MDP partners ("available for a limited set of partners"). An own app with only Sign In + Share means every user reconnects at 60 days. This matters a lot for an always-on agent.
4. **OIDC issuer differs from the docs.** The OIDC doc page shows `"issuer": "https://www.linkedin.com"`; the live discovery document returned `"issuer" : "https://www.linkedin.com/oauth"` (probe below). Validate ID tokens against live discovery.
5. **Composio's LinkedIn credential guide shows a fixed callback URL.** https://composio.dev/auth/linkedin tells you to add `https://backend.composio.dev/api/v3/toolkits/auth/callback`, while Composio's main docs say the dashboard shows the redirect URI. The guide uses the dashboard value.
6. **r_organization_admin is not a Community Management scope.** It belongs to Advertising API and Lead Sync (Increasing Access permissions table). People often expect it with CM. CM gives `rw_organization_admin` instead.
7. **Marketing version deprecation banner.** Every Marketing doc page carries: "The Marketing Version 202511 (Marketing November 2025) will be sunset on November 16, 2026." Two days after this check. Not a setup step, but relevant if code pins `LinkedIn-Version: 202511`.

## Could not verify

- **Community Management review times.** LinkedIn publishes none ("Restricted APIs are evaluated on a case-by-case basis with no fixed timeline" refers to restricted APIs; nothing for CM). Only vendor/developer write-ups: PostProxy (2026-03-04) "Wait 1–2 weeks for review"; Outstand (modified 2026-11-05) "Expect weeks, not days, and expect that it can be declined."; Phyllo (2026-06/08) "Plan for three to four months. The four-week outcome is real and it is the exception." (partner programs generally). No first-hand Reddit or Stack Overflow reports were found in two searches. Hence `wait_basis: community-reported`, confidence medium.
- **Whether Sign In / Share need the Page super-admin verification.** Docs require a default Page at creation and verification for CM review; nothing says the self-serve products are blocked without it.
- **Why Composio says w_member_social + r_organization_admin conflict.** Both appear under the Advertising API, so the conflict probably comes from the CM single-product rule. Not stated by LinkedIn.
- **What Composio's managed LinkedIn app has** (CM access, refresh tokens): not documented.
- **Issuer in a real ID token**: no account, so not checked.

## Probes run

All from Git Bash with curl, no account, no credentials, user agent `Mozilla/5.0 (probe)`.

1. `curl -s -o li_auth.html -w "HTTP %{http_code}" "https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=dummyclientid123&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback&state=probe123&scope=openid%20profile%20email"`
   Result: HTTP 200, page title "Authorize | LinkedIn", body text: `The passed in client_id is invalid "dummyclientid123"`. Same with `scope=w_member_social`.
2. `curl -s https://www.linkedin.com/oauth/.well-known/openid-configuration`
   Result: HTTP 200; `"issuer" : "https://www.linkedin.com/oauth"`, `"authorization_endpoint" : "https://www.linkedin.com/oauth/v2/authorization"`, `"token_endpoint" : "https://www.linkedin.com/oauth/v2/accessToken"`, `"scopes_supported" : [ "openid", "profile", "email" ]`.
3. `curl -s -X POST https://www.linkedin.com/oauth/v2/accessToken -H "Content-Type: application/x-www-form-urlencoded" --data "grant_type=authorization_code&code=dummy&client_id=dummyclientid123&client_secret=dummy&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback"`
   Result: HTTP 401 `{"error":"invalid_request","error_description":"Unable to retrieve access token: authorization code not found"}`.
4. `curl -s -o /dev/null -w "HTTP %{http_code}" https://www.linkedin.com/developers/apps/new` and `https://developer.linkedin.com/`
   Result: both HTTP 200; title "Developers | LinkedIn".
