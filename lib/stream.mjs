// Stream newline-delimited JSON events back to the browser.
// Netlify streaming functions get a 60 second budget, and the browser sees
// progress as it happens instead of a spinner.

export function ndjson(run) {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      let open = true;
      const send = (obj) => {
        if (open) controller.enqueue(enc.encode(JSON.stringify(obj) + '\n'));
      };
      const ping = setInterval(() => send({ type: 'ping' }), 7000);
      try {
        await run(send);
      } catch (err) {
        console.error(err);
        send({ type: 'error', message: err.userMessage || err.message || 'Unexpected error' });
      } finally {
        clearInterval(ping);
        open = false;
        controller.close();
      }
    },
  });
  return new Response(body, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
