import { enginePublicOrigin, nativeReturnUrl, ownerFromRequest } from '../_shared/auth.ts';
import { json, methodGuard, preflight, redirect } from '../_shared/http.ts';
import { newState, recordOAuthEvent, savePending } from '../_shared/oauth.ts';
import { createWhoopAuthUrl, WHOOP_STATE_LENGTH, WhoopError } from '../_shared/whoop.ts';

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  const denied = methodGuard(req, ['GET']);
  if (denied) return denied;
  const url = new URL(req.url);
  const native = url.searchParams.get('client') === 'native';
  try {
    const identity = await ownerFromRequest(req);
    const state = newState(WHOOP_STATE_LENGTH);
    const location = createWhoopAuthUrl(state);
    await savePending('whoop', state, {
      owner: identity.owner,
      kind: native ? 'native' : 'browser',
      sid: native ? null : 'web',
    });
    await recordOAuthEvent('whoop', { stage: 'connect', ok: true, native, error: null });
    if (native) {
      return json({ authorizeUrl: location, returnUrl: nativeReturnUrl() }, 200, { 'cache-control': 'no-store' });
    }
    return redirect(location, { 'cache-control': 'no-store' });
  } catch (error) {
    console.error('[whoop-connect]', (error as Error)?.message || error);
    const status = (error as WhoopError)?.code === 'configuration_error' ? 500 : ((error as { status?: number }).status || 500);
    if (native) return json({ error: status === 401 ? 'unauthorized' : 'connection_unavailable' }, status, { 'cache-control': 'no-store' });
    return redirect(`${enginePublicOrigin()}/?integration=whoop&status=error&message=connection_unavailable`, { 'cache-control': 'no-store' });
  }
});
