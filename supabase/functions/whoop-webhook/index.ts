import { json, methodGuard, preflight } from '../_shared/http.ts';

/** WHOOP event sink. OAuth codes must NOT be posted here — that is whoop-callback. */
Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  const denied = methodGuard(req, ['POST']);
  if (denied) return denied;
  return json({ ok: true }, 200);
});
