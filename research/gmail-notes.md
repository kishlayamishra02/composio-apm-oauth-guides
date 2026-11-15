# Gmail (Google) — research notes

Checked 2026-11-14. Raw pages were fetched with curl and converted to text locally, so the quotes below are copied from page text, not from a summarizer. Exceptions are marked.

## Claims checked

| # | Claim | Source | Verbatim quote |
|---|-------|--------|----------------|
| 1 | Gmail scope categories: gmail.labels non-sensitive; gmail.send sensitive; readonly, compose, insert, modify, metadata, settings.basic, settings.sharing and mail.google.com restricted | https://developers.google.com/workspace/gmail/api/auth/scopes (last updated 2026-09-10) and https://support.google.com/cloud/answer/13464325 | "The following scopes are categorized as "restricted"" (then the Gmail list) |
| 2 | Storing or sending restricted data through servers triggers the security assessment | https://developers.google.com/workspace/gmail/api/auth/scopes | "If you store restricted scope data on servers (or transmit), then you must go through a security assessment." |
| 3 | Testing mode: 7-day refresh tokens | https://developers.google.com/identity/protocols/oauth2 (last updated 2026-10-29) | "A Google Cloud Platform project with an OAuth consent screen configured for an external user type and a publishing status of "Testing" is issued a refresh token expiring in 7 days" |
| 4 | Testing mode: 100 test users | https://support.google.com/cloud/answer/15549945 | "Projects configured with a publishing status of Testing are limited to up to 100 test users listed in the OAuth consent screen." |
| 5 | Unverified app cap: 100 new users | https://support.google.com/cloud/answer/7454865 | "100 new users in total, after the app presents the unverified app screen" |
| 6 | Cap is lifetime and can't be reset | https://support.google.com/cloud/answer/13463817 | "Please note the user cap applies over the entire lifetime of the project, and it cannot be reset or changed." |
| 7 | Google's published review times | https://support.google.com/cloud/answer/13463817 (table) | Brand "2-3 Business days"; Sensitive "10 Business days"; Restricted "…deleting user data upon user request. 6 weeks"; footnote "these estimates are not guaranteed and will vary based on developer responsiveness" |
| 8 | Restricted review "several weeks" | https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification (last updated 2026-11-10) | "the restricted scopes verification process can potentially take several weeks to complete." |
| 9 | Sensitive review up to 10 days | https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification | "The sensitive scope verification process can take up to 10 days to complete." |
| 10 | Brand verification is now an automated check | https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification | "The automated brand verification process typically takes a few minutes after you click the Verify Branding button." Manual fallback "usually takes 2-3 business days." |
| 11 | Branding must be published before data-access verification; passing result valid 7 days | https://support.google.com/cloud/answer/15549049 | "Note: You must have a published branding status before you can request verification for data access (scopes)." / "Note : Compliant verification results are valid for 7 days." |
| 12 | Without brand verification only the domain shows | https://support.google.com/cloud/answer/15549049 | "Without verification, only your application domain will be visible to users." |
| 13 | Every project domain must be an authorized domain | https://support.google.com/cloud/answer/15549049 | "All domains used in your project, whether in the branding page or client configuration pages must be pre-registered here." |
| 14 | Must own every authorized domain (Search Console) | https://support.google.com/cloud/answer/13464321 | "You must verify that you own all domains listed in your Authorized domains section of the OAuth consent screen editor." |
| 15 | Demo video requirements | https://support.google.com/cloud/answer/13464321 | "Must show the end-to-end flow of your app including the OAuth grant process" |
| 16 | Extra video rule for automation platforms | restricted-scope-verification page | "If your app is a task automation platform, your demonstration video must showcase how multiple API workflows are created and automated, and in which directions user data flows." |
| 17 | Video on YouTube, unlisted | restricted-scope-verification page | "Upload the video to YouTube Studio and set Visibility as Unlisted." |
| 18 | Scope justification | https://support.google.com/cloud/answer/13464321 | "An explanation why narrower scopes would not work, including specifics on what functionality would not work as intended." |
| 19 | Only production apps are verified | https://support.google.com/cloud/answer/13461325 | "Once your app is ready for verification, publish your app from “testing” to “production” by clicking on the “Publish App” button." |
| 20 | Separate dev and prod projects | https://support.google.com/cloud/answer/13461325 | "It is a recommended best practice to have separate cloud projects for development/testing and production/publishing." |
| 21 | Review runs over email | https://support.google.com/cloud/answer/13461325 | "All communications with the OAuth review team will occur over email to the project owners and project editors configured when setting up your project." |
| 22 | Annual security assessment; CASA AL1/AL2 | https://support.google.com/cloud/answer/13465431 | "To maintain the security of Google users' data, applications requesting access to restricted scopes must undergo an annual security assessment." / "Applications are assigned to either the AL1 or AL2 assurance level." |
| 23 | Google, not the developer, sets the level | https://appdefensealliance.dev/casa/casa-tiering (last updated 2026-06-27) | "The framework users (Google..etc) and not the application developer calculate and determine which assurance level is required." |
| 24 | T&S tells you when to start CASA | https://support.google.com/cloud/answer/13465431 | "If your application requires access to restricted scopes, the Google Trust and Safety team will contact you when it is time to initiate the security assessment process." |
| 25 | Google charges nothing; price is with the lab | https://support.google.com/cloud/answer/13463817 | "Google does not charge the developer any fees for security assessment." |
| 26 | Recertify every 12 months | https://support.google.com/cloud/answer/13463816 | "Apps that access restricted scopes are required to complete a security assessment every 12 months." |
| 27 | Limited Use | https://developers.google.com/terms/api-services-user-data-policy | "Limit your use of data to providing or improving user-facing features that are prominent in the requesting application's user interface;" |
| 28 | Limited Use disclosure wording | https://support.google.com/cloud/answer/13463817 | "“{App’s} use of information received from Google APIs will adhere to Google API Services User Data Policy, including the Limited Use requirements.”" |
| 29 | Gmail approved use cases include generative AI summaries | https://developers.google.com/workspace/workspace-api-user-data-developer-policy (last updated 2026-09-03) | "Applications that enhance the email experience for productivity purposes (such as applications for customer relationship management, delayed sending of email or mail merge, or providing generative AI summaries)" |
| 30 | No training of general AI models on Gmail data | same | "Transferring, selling, or using user data to create, train, or improve a machine learning or artificial intelligence model beyond that specific user’s personalized model for the appropriate use case or user-facing feature." |
| 31 | mail.google.com just for SMTP send violates minimum scope | https://support.google.com/cloud/answer/13463817 | "using the broad access https://mail.google.com/ scope just for sending emails with the SMTP protocol violates the minimum scope policy." |
| 32 | Internal apps skip verification | https://support.google.com/cloud/answer/13464323 | "Internal Use apps: The app is only used by people in your Google Workspace or Cloud Identity organization." |
| 33 | Branding changes force re-verification | https://support.google.com/cloud/answer/13464018 | "If you make any modifications to your app's name, logo/icon, redirect URI, homepage link, or privacy policy link displayed on your OAuth consent screen, your app will be required to complete brand verification again" |
| 34 | New scopes before approval → unverified screen and cap | https://support.google.com/cloud/answer/13464018 | "If your app starts to use the new sensitive or restricted scopes before your app is verified and approved to use them, your app’s users will experience the unverified app screen" |
| 35 | Client secret shown once | https://support.google.com/cloud/answer/15549257 | "Your application's client secret will only be shown after you create the client." |
| 36 | AI-agent client flag | https://support.google.com/cloud/answer/15549257 | "you can designate the client for use by artificial intelligence (AI) agents by selecting the Use this client for an AI-powered agent checkbox." and "Tagging an OAuth client does not grant additional scopes or privileges to access user data." |
| 37 | Unused clients deleted | https://support.google.com/cloud/answer/15549257 | "OAuth 2.0 clients that have been inactive for six months are automatically deleted." |
| 38 | Users can untick scopes (granular consent) | https://developers.google.com/identity/protocols/oauth2/resources/granular-permissions | "Users can select which permissions they want to approve to share with the application." |
| 39 | Console structure: Branding, Audience, Data Access, Clients | https://developers.google.com/workspace/guides/configure-oauth-consent | "If you have already configured the Google Auth platform, you can configure the following OAuth Consent Screen settings in Branding, Audience, and Data Access." |
| 40 | Composio managed Gmail app exists | https://docs.composio.dev/toolkits/gmail and /toolkits/managed-auth | Toolkit page: "Composio-managed OAuth available? Yes"; list includes "[Gmail](/toolkits/gmail.md) / `GMAIL`" |
| 41 | Composio redirect URI shown in dashboard; docs name the v3 callback | https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app and /white-labeling-authentication | "For OAuth toolkits, the dashboard shows the redirect URI to add in the provider's developer portal." / "Register `https://backend.composio.dev/api/v3/toolkits/auth/callback` as the provider's authorized redirect URI." |
| 42 | Composio supports your own callback forwarder domain | https://docs.composio.dev/docs/authentication/white-labeling-authentication#routing-the-callback-through-your-domain | "If the toolkit and provider support a custom redirect URI, you can register an HTTPS endpoint you control…" |
| 43 | Composio stores and refreshes tokens in both modes (so data passes through a third-party server) | https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app | "Both options use Composio to store and refresh connected-account credentials." |
| 44 | Own-app Gmail triggers need Pub/Sub | https://docs.composio.dev/toolkits/gmail | "Gmail delivers mailbox changes through Google Cloud Pub/Sub. Set it up once per OAuth app, in the Google Cloud project that owns your OAuth client:" |

## Surprises / corrections

1. **CASA levels renamed, and Google's own pages disagree.** Google's Security Assessment page (support.google.com/cloud/answer/13465431) and the App Defense Alliance site now describe two levels, AL1 and AL2, both "Lab Tested - Lab Verified". Older guides, and the same Google FAQ (answer/13463817), still talk about "Tier 2" (including "the free tier 2 assessment" where you scan your own app) and "Tier 3". We could not confirm the self-scan route still exists.
2. **CASA cost is far lower than the old number.** Google's 2018 announcement (https://workspace.google.com/blog/product-announcements/elevating-user-trust-in-our-api-ecosystems) said: "The assessment fee is paid by the developer and may range from $15,000 to $75,000 (or more)". Today Google says "Google does not charge the developer any fees for security assessment" and the price is set with the lab. One authorized lab (TAC Security) lists AL1 from $675 ("ESOF AppSec ADA CASA – Basic $675") and AL2 at $5,400. Nango's guide (prices "as of August 2025") lists $540–$720 for TAC, ~$700 for Netsentries, $3,000+ for Prescient. The $15k–$75k figure is still widely repeated.
3. **Brand verification is now mostly automated.** Click "Verify Branding" and the check "typically takes a few minutes"; manual review only when the check can't decide (2–3 business days). You then must click "Publish branding" within 7 days or re-run it. The FAQ table still lists brand verification as "2-3 Business days".
4. **New Google Auth Platform layout.** "OAuth consent screen" is now split into Branding, Audience, Data Access, Clients and a Verification Center. Branding must be published before you can request data-access (scope) verification.
5. **New "Use this client for an AI-powered agent" checkbox** on OAuth clients. It can't be changed after creation, grants nothing extra, and Google says apps with both agent and standard features "must create and maintain separate OAuth 2.0 client IDs". Relevant to every Composio agent builder; not mentioned in Composio's Google guide.
6. **Client secret is shown once.** Google: "it will not be visible or accessible again." Older tutorials (and Composio's googleapps guide, which says you can find credentials later on the Clients page and "create a Client Secret") read as if you can come back for it.
7. **Inactive OAuth clients are deleted after 6 months**, with a 30-day warning email.
8. **Refresh-token limit:** Composio's Gmail toolkit FAQ says "Google's refresh token limit (~50 per account)". Google's current doc says "There is currently a limit of 100 refresh tokens per Google Account per OAuth 2.0 client ID."
9. **Composio callback URL inconsistency:** Composio's docs say register `https://backend.composio.dev/api/v3/toolkits/auth/callback` and set it as `oauth_redirect_uri`; the composio.dev/auth/googleapps guide shows `https://backend.composio.dev/api/v1/auth-apps/add` ("supported legacy callback"). The guide tells developers to copy whatever their dashboard shows.
10. **Callback domain vs. verification (inference plus community evidence).** Google requires every domain used in the project, client config included, to be an authorized domain, and requires you to own every authorized domain. Using Composio's default callback puts composio.dev in that list. A 2026 Google forum post shows an automated branding rejection when the unverified consent screen showed the third-party redirect host (supabase.co) instead of the app name. Composio documents a 302 "callback forwarder" on your own domain, which avoids this. Nango gives the same advice: "verify the domain of your callback URL in your Google Cloud project. Domain verification is one of the first checks reviewers run."
11. **Agents count as "task automation platforms" for the demo video**, which must show how workflows are created and which way data flows.
12. **Generative AI summaries are an approved Gmail use case**, but training or improving anything beyond a per-user model on Gmail data is banned.
13. **Publishing to production removes the 7-day token expiry** (it applies only to Testing status) but turns on the lifetime 100-new-user cap and the unverified screen until verification completes.

## Could not verify

- **Real-world wait times.** Only Google's estimates are official. Community data: Nango says "5-20 days" for prepared teams and that Trust & Safety often answers within 24–48 hours; Google developer forum threads from 2026 report stalls of over a month (Gmail restricted scopes, thread 340945), 5+ weeks (387534) and 6+ weeks (376936, sensitive scopes), often with no Trust & Safety email ever received.
- **CASA price and lab turnaround** are vendor/community numbers (TAC lists "Assessment to LoV in 2-3 Weeks" for AL1, 2–4 weeks for AL2).
- **Whether the free self-scan (old "Tier 2") still exists**, given the AL1/AL2 change.
- **Whether a CASA assessment must cover Composio's infrastructure**, since Composio holds the tokens and makes the Gmail calls. Neither Google nor Composio says.
- **Whether Google actually rejects a project whose redirect URI is on composio.dev.** The rules point that way; Google doesn't name third-party callback hosts, and community reports include approvals after explaining the third-party domain.
- **CASA prep details** (SAQ of ~50 questions, SAST/DAST choice) come only from Nango.
- **Effect of the AI-agent client flag on verification** for an agent product is not documented.
- **Hands-on time** (1–3 days) is our estimate.

## Probes run

All without accounts or credentials, 2026-11-14.

```
curl -s -o g-auth-probe.html -w "HTTP %{http_code} redirect=%{redirect_url}\n" \
 "https://accounts.google.com/o/oauth2/v2/auth?client_id=dummy-client-id.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fbackend.composio.dev%2Fapi%2Fv3%2Ftoolkits%2Fauth%2Fcallback&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly&access_type=offline&prompt=consent"
```
Result: `HTTP 302 redirect=https://accounts.google.com/signin/oauth/error?authError=Cg5pbnZhbGlkX2NsaWVudBIfVGhlIE9BdXRoIGNsaWVudCB3YXMgbm90IGZvdW5kLiCRAw&...` (base64 decodes to `invalid_client` / `The OAuth client was not found.`). Following redirects (`curl -sL`) gave HTTP 200 with page text "Access blocked: Authorization Error", "Error 401: invalid_client", "The OAuth client was not found."

```
curl -s -X POST https://oauth2.googleapis.com/token -d "client_id=dummy-client-id.apps.googleusercontent.com&client_secret=dummy&code=dummy&grant_type=authorization_code&redirect_uri=https://backend.composio.dev/api/v3/toolkits/auth/callback"
```
Result: HTTP 401 `{"error": "invalid_client", "error_description": "The OAuth client was not found."}`

```
curl -s https://accounts.google.com/.well-known/openid-configuration
```
Result: `authorization_endpoint` https://accounts.google.com/o/oauth2/v2/auth, `token_endpoint` https://oauth2.googleapis.com/token

```
curl -s -o /dev/null -w "%{http_code} %{redirect_url}" https://console.cloud.google.com/auth/overview
curl -s -o /dev/null -w "%{http_code} %{redirect_url}" https://console.cloud.google.com/auth/branding
curl -s -o /dev/null -w "%{http_code} %{redirect_url}" https://search.google.com/search-console
```
Result: console pages 302 to accounts.google.com ServiceLogin (they exist and need sign-in); Search Console 302 to /search-console/about.

What these show: the endpoints Composio will call exist, and Google rejects an unknown client ID before it looks at scopes or the redirect URI. They do not exercise consent, verification or token refresh.
