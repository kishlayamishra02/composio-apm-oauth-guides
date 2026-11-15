# Notion: research notes (checked 2026-11-14)

Guide: `public/data/guides/notion.json`. Verdict: **instant**, difficulty 1, hands-on 20–45 min, approval wait **None** (official: "Marketplace submission or review is not required"). The optional Marketplace listing takes 5–10 business days (official). Confidence high.

Method: developers.notion.com serves markdown (`.md` suffix plus `llms.txt` index). Old `/docs/...` paths redirect to the new `/guides/...` tree. Pages were pulled with curl and grepped, and quotes were matched verbatim.

## Claims checked

| Claim | Source | Verbatim quote |
|---|---|---|
| Four access types; OAuth vs public differ only by workspace scope | https://developers.notion.com/guides/connections-and-tokens/overview | "OAuth integrations and public integrations use the same OAuth authorization flow. Here, **OAuth integrations** are limited to selected workspaces, while **public integrations** are available to any workspace." |
| Marketplace listing optional, reviewed | same (comparison table) | "Marketplace listing … Optional, subject to review." (table cell for Public integration: "Optional, subject to review.") |
| Create in the Developer portal; required fields | https://developers.notion.com/guides/connections-and-tokens/public-integrations/overview | "Click **Create new connection** and fill in the required fields, including:" followed by "Connection name and development workspace", "Redirect URI(s) for the OAuth flow", "Installation scope — choose **Any workspace**", "Connection capabilities" |
| Installation scope is permanent | same | "Installation scope is set once, at creation time, and can't be changed afterward." |
| "Any workspace" = eligible for Marketplace; listing optional | same | "For a public integration, choose **Any workspace** when you create it. This makes the integration eligible for Marketplace listing, subject to review. Listing is optional." |
| Security review only for Marketplace | same | "Public connections must undergo a Notion security review before being listed on the Marketplace. You can create and use a public connection without listing it." |
| Credentials location | same | "After creation, visit the **Configuration** tab to retrieve your **OAuth client ID** and **OAuth client secret**." |
| No review is needed to start OAuth | https://developers.notion.com/guides/authorization/overview | "You can start authorization as soon as you configure the integration’s client credentials and redirect URI; Marketplace submission or review is not required." |
| Each user authorizes separately | same | "After a user authorizes an OAuth integration, only that user is able to interact or share pages and databases with the connection." |
| Refresh tokens are issued | same | "Notion responds to the request with an `access_token`, `refresh_token`, and additional information." |
| redirect_uri in the token request | same | "If there are more than one redirect URIs included in your connection settings, this field is required." |
| Workspace owner needed (internal connections) | same | "You are required to be a workspace owner to create a connection." (in the internal-connection section) |
| Marketplace review timeline | https://developers.notion.com/guides/connections-and-tokens/public-integrations/marketplace-listing | "After submission, expect to hear back from our team within 5-10 business days via email." |
| Rejection reasons | same | "Connections are rejected for various reasons, from brand/trademark issues to quality concerns to situations where the baseline connection criteria isn't met." |
| Listing is optional | same | "No. Public connections work independently of Marketplace listings. Listing on the Marketplace is optional and helps your connection reach a wider audience, but your connection can be used via its OAuth flow without being listed." |
| Capabilities instead of scopes | https://developers.notion.com/reference/capabilities | "**Read content**: This capability gives a connection access to read existing content in a Notion workspace." |
| Rate limits (per connection, by plan) | https://developers.notion.com/reference/request-limits | "The Notion API enforces two rate limits: a per-connection limit and a per-workspace limit." / table: "Business and Enterprise \| 600 requests per minute (an average of 10 per second)", "All other plans \| 180 requests per minute (an average of 3 per second)" |
| Composio managed Notion exists | https://docs.composio.dev/toolkits/managed-auth.md | Row "`NOTION`" under "Composio-managed OAuth available (128)". (Separate toolkit "Notion MCP" `NOTION_MCP` is listed under bring-your-own.) |
| Branding: users see "Composio" | https://docs.composio.dev/toolkits/notion.md | "Notion attributes actions to the integration itself, not the individual user. The name and logo shown come from the integration configuration. To use a custom name or logo, create your own Notion integration." |
| Composio recommends own app in production | same | "For production Notion integrations, we strongly recommend using your own Notion app so your users' tokens are isolated to your product." |
| No scopes in the Composio auth config | same | "No. Notion controls access by granting integrations access to specific pages and databases, not through scopes. You don't need to pass scopes when creating an auth config." |
| Reconnect invalidates the older refresh token | same | "If the same user connects to the same Notion app again, whether it is Composio-managed or custom, Notion can issue a new token pair and invalidate the older `refresh_token`." |

## Surprises / corrections

1. **The developer UI and vocabulary changed.** Common belief, and Composio's own setup page (https://composio.dev/auth/notion): "Go to the Notion integrations page: https://www.notion.so/profile/integrations … Integration Type: Select Public." Now: integrations are "connections", created in the **Developer portal** at `https://app.notion.com/developers/connections` (Build > Connections > Create new connection), and "public" is chosen through **Installation scope = Any workspace**. Probe: `https://www.notion.so/my-integrations` now returns 301 to `https://www.notion.so/developers/connections`. There is also a new middle tier: **OAuth integrations** limited to selected workspaces, which can never be listed. The scope choice is permanent.
2. **"Integration Gallery" is now the "Marketplace".** Listings are managed separately (Listings > Connections in the Marketplace listing dashboard). Official review time is 5–10 business days, with a Notion security review first.
3. **Making an integration public no longer looks like a review step.** Older flow, as documented by third parties: a **Distribution** tab, a "Do you want to make this integration public?" toggle, and an Organization Information form with company name, website, privacy policy, terms of use and support email. Make's guide (https://apps.make.com/notion): "Go to **Distribution** and click the toggle to make the integration public." and the field table lists "Privacy policy", "Terms of use", "Support email". n8n (https://docs.n8n.io/integrations/builtin/credentials/notion/): "Enter your company name and website in the **Organization Information** section." n8n also says: "They require a Notion security review before publishing." **Current official docs** list only name, development workspace, redirect URIs, installation scope and capabilities, and say: "Marketplace submission or review is not required." The common belief that public Notion integrations need a security review applies only to Marketplace listing today.
4. **Notion OAuth now issues refresh tokens.** The authorization guide describes `access_token` + `refresh_token` and a refresh step. Older Notion OAuth tokens were long-lived with no refresh. Composio's FAQ warns that a second connect by the same user can invalidate the older refresh token.
5. **Rate limits are per connection and per workspace, scaled by plan** (180/min on most plans, 600/min on Business and Enterprise). We did not check older versions of this page, so we make no claim about what changed. Because limits are per connection, the "dedicated quota" benefit of your own app may matter less here.

## Could not verify

- **Whether the current Developer portal form still asks for** company name, website, privacy policy, terms of use and support email. The docs say "required fields, including:", which is not exhaustive, and the form needs sign-in. The guide lists them as recommended prep.
- **Whether you must be a workspace owner** to create a public (rather than internal) connection.
- **Typical real-world Marketplace wait.** We used the official 5–10 business days and looked for no community data, because listing is optional.
- **Whether the Notion consent screen shows privacy/terms links** for public connections today.

## Probes run (no account, 2026-11-14)

```bash
curl -s -o no-probe1.html -A "Mozilla/5.0" -D no-probe1.hdr -w "%{http_code} redirect=%{redirect_url}\n" \
  "https://api.notion.com/v1/oauth/authorize?client_id=00000000-0000-0000-0000-000000000000&response_type=code&owner=user&redirect_uri=https%3A%2F%2Fexample.com%2Fcb&state=probe123"
# -> 302 redirect=https://app.notion.com/install-integration?response_type=code&client_id=00000000-...&redirect_uri=...&state=probe123&owner=user

curl -s -A "Mozilla/5.0" -w "\nHTTP %{http_code}\n" -X POST "https://api.notion.com/v1/oauth/token" \
  -u "00000000-0000-0000-0000-000000000000:dummysecret" -H "Content-Type: application/json" \
  -d '{"grant_type":"authorization_code","code":"dummy","redirect_uri":"https://example.com/cb"}'
# -> {"error":"invalid_client","request_id":"3e5854a4-..."}  HTTP 401

curl -s -o /dev/null -A "Mozilla/5.0" -w "%{http_code} redirect=%{redirect_url}\n" "https://app.notion.com/developers/connections"
# -> 200

curl -s -o /dev/null -A "Mozilla/5.0" -w "%{http_code} redirect=%{redirect_url}\n" "https://www.notion.so/profile/connections"
# -> 307 redirect=https://app.notion.com/profile/connections?__dm_a=1

curl -s -o /dev/null -A "Mozilla/5.0" -w "%{http_code} redirect=%{redirect_url}\n" "https://www.notion.so/my-integrations"
# -> 301 redirect=https://www.notion.so/developers/connections

curl -sL "https://developers.notion.com/docs/authorization.md" -w "%{url_effective}"
# -> resolves to https://developers.notion.com/guides/authorization/overview.md (old /docs paths redirect)
```
