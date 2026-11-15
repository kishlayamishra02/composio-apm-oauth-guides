// GET /api/guides       -> recent guides written by the live agent
// GET /api/guides/:id   -> one saved guide

import { getStore } from '@netlify/blobs';
import { json } from '../../lib/stream.mjs';

export default async (req, context) => {
  const store = getStore({ name: 'guides', consistency: 'strong' });
  const { id } = context.params || {};

  if (id) {
    if (!/^[a-z0-9-]{3,80}$/.test(id)) return json({ error: 'Bad guide id.' }, 400);
    const guide = await store.get(id, { type: 'json' });
    return guide ? json(guide) : json({ error: 'Guide not found.' }, 404);
  }

  const { blobs } = await store.list();
  const ids = blobs.map((b) => b.key).filter((k) => !k.startsWith('latest/'));
  const items = await Promise.all(
    ids.slice(-200).map(async (key) => {
      const m = await store.getMetadata(key);
      return m ? { id: key, ...m.metadata } : null;
    }),
  );
  const latest = items.filter(Boolean).sort((a, b) => (b.created || 0) - (a.created || 0)).slice(0, 30);
  return json({ guides: latest });
};

export const config = { path: ['/api/guides', '/api/guides/:id'] };
