// Canned model responses for testing the pipeline and UI without spending model credits.
// Enabled only with GEMINI_MOCK=1. Never used in production.

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export async function mockGenerate({ prompt }) {
  const step = (prompt.match(/^STEP: (\S+)/m) || [])[1] || '';
  await delay(600);
  const base = { model: 'mock', finishReason: 'STOP', queries: ['mock query'], chunks: [], supports: [], urlsRead: [], usage: null };

  if (step === 'discover') {
    return {
      ...base,
      text: JSON.stringify({
        app: 'Mockapp',
        provider: 'Mock Inc',
        website: 'https://example.com',
        category: 'Testing',
        official_domains: ['example.com'],
        developer_portal: 'https://example.com/',
        oauth: 'yes',
        oauth_docs_url: 'https://example.com/',
        other_auth: ['api-key'],
        is_real_app: true,
        notes: 'Mock response for local testing.',
      }),
    };
  }
  if (step.startsWith('research')) {
    return {
      ...base,
      text: '```json\n' + JSON.stringify({
        findings: [
          { claim: 'Example Domain is for use in documentation examples.', url: 'https://example.com/', quote: 'This domain is for use in documentation examples without needing permission.', kind_hint: 'official' },
          { claim: 'A community post says review takes a week.', url: 'https://www.iana.org/help/example-domains', quote: 'made up quote that will not be found on the page', kind_hint: 'community' },
        ],
        open_questions: [`No published review timeline found (${step}).`],
      }) + '\n```',
    };
  }
  if (step === 'synthesize') {
    return {
      ...base,
      text: JSON.stringify({
        one_liner: 'Mock guide: register an app, test with your own account today, request review before going public.',
        verdict: { tier: 'light-review', difficulty: 2, hands_on: '30–60 min', approval_wait: '1–2 weeks', total_to_production: '1–2 weeks', wait_basis: 'community-reported', confidence: 'medium' },
        start_today: { summary: 'Works for your own account immediately.', limits_before_approval: ['Only your own account can connect'] },
        composio_note: 'Mock note about Composio.',
        prerequisites: [{ item: 'Developer account', detail: 'Free.', cost: 'free', sources: ['s1'] }],
        phases: [
          { name: 'Create the app', duration: '15 min', steps: [
            { text: 'Register the app in the developer portal.', owner: 'you', evidence: 'sourced', sources: ['s1'] },
            { text: 'Draft the app description and privacy policy.', owner: 'agent', evidence: 'sourced', sources: ['s2'] },
          ] },
          { name: 'Get approved', duration: '1–2 weeks', steps: [{ text: 'Wait for review.', owner: 'provider', evidence: 'uncertain', sources: ['s2'] }] },
        ],
        scopes: [{ scope: 'read', purpose: 'Read data', review_impact: 'none', sources: ['s1'] }],
        approval: { required: 'for-public-distribution', trigger: 'Making the app public', reviewers_check: ['Privacy policy'], typical_wait: '1–2 weeks', common_rejections: ['Missing privacy policy'], sources: ['s2'] },
        blockers: [{ blocker: 'Redirect URI mismatch', fix: 'Copy the exact URI from the Composio dashboard.', sources: ['s1'] }],
        agent_split: { agent_can: ['Draft the privacy policy'], you_must: ['Create the account'], provider_controls: ['Review'] },
        uncertain: ['Mock uncertainty'],
      }),
    };
  }
  return { ...base, text: '{}' };
}
