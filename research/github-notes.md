# GitHub: research notes (checked 2026-11-14)

Guide: `public/data/guides/github.json`. Verdict: **instant**, difficulty 2, hands-on 20–40 min, approval wait **None** (official: GitHub documents no review for registering or using an OAuth app), confidence high.

Method: GitHub Docs pages were pulled as markdown through `https://docs.github.com/api/article/body?pathname=/en/...` and grepped for exact text. The changelog post and the Composio pages were pulled with curl. Every quote below was matched verbatim against the downloaded page text.

## Claims checked

| Claim | Source | Verbatim quote |
|---|---|---|
| You can register an OAuth app under a personal account or an org you administer | https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app | "You can create and register an OAuth app under your personal account or under any organization you have administrative access to." |
| OAuth apps now accept up to 10 callback URLs | same | "You can enter up to 10 callback URLs. To add additional callback URLs, click **Add callback URL**." |
| Expiring user tokens are ON by default for new OAuth apps | same | "**Expire user access tokens** is enabled by default. If your app's authentication code hasn't been updated to support short-lived tokens, uncheck the box until support is added." |
| Each owner can have up to 100 OAuth apps | same | "A user or organization can own up to 100 OAuth apps." |
| Token lifetimes when expiring tokens are on | https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps | "The access token expires after eight hours, and the refresh token expires after six months without use." |
| Redirect URL must match exactly unless wildcard matching is on | same | "When wildcard matching is disabled, the redirect URL must exactly match the callback URL. You can enable or disable wildcard matching for each callback URL in your app's settings." |
| Older single-callback apps have wildcard matching on | same | "Apps that had a single callback URL enabled prior to August 3, 2026 have wildcard matching enabled for that callback URL." |
| 10 tokens per user/app/scope; older tokens revoked | same | "There is a limit of ten tokens that are issued per user/application/scope combination, and a rate limit of ten tokens created per hour." |
| Change date and default for new apps | https://github.blog/changelog/2026-08-14-multiple-redirect-uris-and-token-refresh-for-oauth-apps | "Short-lived tokens are enabled by default for all new applications. If your authentication SDK doesn’t support the refresh token flow, you can disable this while updating the SDK." |
| GitHub recommends GitHub Apps over OAuth apps | https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps | "In general, GitHub Apps are preferred over OAuth apps. GitHub Apps use fine-grained permissions, give the user more control over which repositories the app can access, and use short-lived tokens." |
| OAuth app rate limits do not scale | same | "The rate limit for GitHub Apps using an installation access token scales with the number of repositories and number of organization users. Conversely, OAuth apps have lower rate limits and do not scale." |
| Org OAuth restrictions are on by default for new orgs | https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions | "When you create a new organization, OAuth app access restrictions are enabled by default." |
| Members must request owner approval | same | "When OAuth app access restrictions are enabled, organization members and outside collaborators cannot authorize OAuth app access to organization resources. Users can request owner approval for OAuth apps they'd like to use" |
| Per-user REST limit is 5,000/hour | https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api | "All of these requests count towards your personal rate limit of 5,000 requests per hour." |
| That limit is shared across all apps acting for the user | same | "This rate limit is combined with any requests that another GitHub App or OAuth app makes on that user's behalf and any requests that the user makes with a personal access token." |
| Marketplace is optional; anyone can list for free | https://docs.github.com/en/apps/github-marketplace/github-marketplace-overview/about-github-marketplace-for-apps | "Anyone can share their apps with other users for free on GitHub Marketplace but only apps owned by organizations can sell their app." |
| Marketplace review = onboarding expert, no timeline | https://docs.github.com/en/apps/github-marketplace/listing-an-app-on-github-marketplace/submitting-your-listing-for-publication | "To finish your app listing submission, you can request a review by an onboarding expert." / "An onboarding expert will reach out to you with additional information." |
| Marketplace listing requirements | https://docs.github.com/en/apps/github-marketplace/creating-apps-for-github-marketplace/requirements-for-listing-an-app | "Listings must have a valid link to a privacy policy." / "Apps must provide value to customers and integrate with the platform in some way beyond authentication." |
| Scope definitions (repo, public_repo, read:user) | https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps | repo: "Grants full access to public and private repositories including read and write access to code, commit statuses, repository invitations, collaborators, deployment statuses, and repository webhooks." |
| Composio managed GitHub app exists | https://docs.composio.dev/toolkits/managed-auth.md and https://docs.composio.dev/toolkits/github.md | Table row "`GITHUB`" under "Composio-managed OAuth available (128)"; toolkit page: "**Composio-managed OAuth available?** Yes" |
| Composio accepts your own GitHub App, but the user installs it separately | https://docs.composio.dev/toolkits/github.md | "Composio does not currently provide the GitHub App installation link automatically during this flow. Provide your GitHub App installation link to the user, have them install the app, then complete the connection." |
| Redirect URI comes from the Composio dashboard | https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app.md | "For OAuth toolkits, register an app in the provider's developer portal and add the redirect URI from the dashboard. Then copy the **Client ID** and **Client Secret** back into Composio." |
| Client secret is shown once | https://composio.dev/auth/github | "Security note: GitHub shows the client secret only once. Store it in a secure server-side secret manager or encrypted environment variable." |

## Surprises / corrections

1. **OAuth app tokens now expire by default (new since August 14, 2026).** Common belief, and GitHub's own docs before August 2026: OAuth app tokens never expire, and only GitHub Apps get 8-hour tokens with refresh tokens. Now: "Short-lived tokens are enabled by default for all new applications" (GitHub changelog, 2026-08-14), and the creation page says "Expire user access tokens is enabled by default." Access tokens last 8 hours, refresh tokens 6 months. **Composio impact:** the Composio GitHub setup guide (https://composio.dev/auth/github) never mentions this checkbox, and no Composio page says that GitHub refresh tokens are handled. A developer following that guide today gets 8-hour tokens without knowing it. If Composio does not refresh them, connections fail after about 8 hours. We flagged this as a test-before-launch step.
2. **OAuth apps now accept up to 10 callback URLs (was 1).** The old rule was "one callback URL; redirect_uri must be a subdirectory of it." Since the same changelog, there are up to 10 callback URLs, with wildcard matching configurable per URL. Apps that had one callback URL before August 3, 2026 keep wildcard (subdomain/subpath) matching on. New entries match exactly unless you turn wildcard on. So the old "subdirectory of the callback URL works" advice no longer holds for new apps.
3. **"Your own app gets a dedicated quota" (Composio's general argument) does not lift GitHub's per-user limit.** GitHub's 5,000 requests/hour for user tokens is per user and shared across every OAuth app, GitHub App user token and PAT acting for that user. Your own OAuth app gives you your own app identity, but not a larger per-user budget. (Composio's managed app may still differ in practice, for example the 2-minute polling minimum.)
4. **Composio supports BYO GitHub Apps, not only OAuth Apps.** Its toolkit FAQ says yes, but the user must install the GitHub App separately, and Composio does not send the install link. Composio's own setup guide still uses an OAuth App.
5. **Org access restrictions are the real "approval" for B2B.** They are not a GitHub review, but new orgs have OAuth app access restrictions on by default, so private org repos stay blocked until an org owner approves your app.

## Could not verify

- **Whether Composio uses GitHub refresh tokens.** Composio says generally that it stores and refreshes connected-account credentials ("Both options use Composio to store and refresh connected-account credentials"), but nothing GitHub-specific. Needs a live test, which needs accounts.
- **GitHub Marketplace review time.** GitHub publishes no number ("An onboarding expert will reach out"), and we found no reliable recent community report. The guide marks this as unknown, and it applies only to the optional listing.
- **GitHub Enterprise Server support in Composio's GitHub toolkit** (custom base URL). Not documented on the toolkit page.
- **Composio managed-app default scopes.** The Composio guide shows an example scope set (repo, user, gist, notifications, project, workflow, codespace). That is an example, not a documented default.
- **Whether GitHub validates the client_id before login.** The probe could not show this, because GitHub redirects to sign-in first.

## Probes run (no account, 2026-11-14)

```bash
curl -s -o gh-probe1.html -A "Mozilla/5.0" -w "%{http_code} redirect=%{redirect_url}\n" \
  "https://github.com/login/oauth/authorize?client_id=Iv1.0000000000000000&redirect_uri=https%3A%2F%2Fexample.com%2Fcb&scope=repo&state=probe123"
# -> 302 redirect=https://github.com/login?client_id=Iv1.0000000000000000&return_to=%2Flogin%2Foauth%2Fauthorize%3F...

curl -s -X POST -H "Accept: application/json" -A "Mozilla/5.0" -w "\nHTTP %{http_code}\n" \
  "https://github.com/login/oauth/access_token" -d "client_id=Ov23liDUMMY000000000&client_secret=dummysecret&code=dummycode"
# -> {"error":"Not Found"}  HTTP 404

curl -s -o /dev/null -A "Mozilla/5.0" -w "%{http_code} redirect=%{redirect_url}\n" "https://github.com/settings/applications/new"
# -> 302 redirect=https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Fsettings%2Fapplications%2Fnew

curl -s -A "Mozilla/5.0" -D - -o /dev/null "https://api.github.com/rate_limit" | grep -i "^HTTP\|x-ratelimit-limit"
# -> HTTP/1.1 200 OK ; X-RateLimit-Limit: 60   (unauthenticated)
```

Docs fetch pattern used (read-only):
```bash
curl -sL "https://docs.github.com/api/article/body?pathname=/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app"   # 200
```
