// Shared secret between jobs.mjs and the background agent function, so only our own
// API can start an agent run.
export const runSecret = () => process.env.RUN_SECRET || process.env.RATE_SALT || 'local-dev';
