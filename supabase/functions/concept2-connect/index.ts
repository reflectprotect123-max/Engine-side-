import { nativeReturnUrl, ownerFromRequest, productFromRequest, publicOrigin } from '../_shared/auth.ts';
import { json, methodGuard, preflight, redirect } from '../_shared/http.ts';
import { newState, savePending } from '../_shared/oauth.ts';
import { CONCEPT2_STATE_LENGTH, Concept2Error, createConcept2AuthUrl } from '../_shared/concept2.ts';

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  const denied = methodGuard(req, ['GET']);
  if (denied) return denied;
  const url = new URL(req.url);
  const native = url.searchParams.get('client') === 'native';
  const product = productFromRequest(req);
  try {
    const identity = await ownerFromRequest(req);
    const state = newState(CONCEPT2_STATE_LENGTH);
    const location = createConcept2AuthUrl(state);
    await savePending('concept2', state, {
      owner: identity.owner,
      kind: native ? 'native' : 'browser',
      sid: native ? null : 'web',
      product: identity.product,
    });
    if (native) {
      return json({ authorizeUrl: location, returnUrl: nativeReturnUrl(identity.product) }, 200, { 'cache-control': 'no-store' });
    }
    return redirect(location, { 'cache-control': 'no-store' });
  } catch (error) {
    console.error('[concept2-connect]', (error as Error)?.message || error);
    const status = (error as Concept2Error)?.code === 'configuration_error' ? 500 : ((error as { status?: number }).status || 500);
    if (native) return json({ error: status === 401 ? 'unauthorized' : 'connection_unavailable' }, status, { 'cache-control': 'no-store' });
    return redirect(`${publicOrigin(product)}/?integration=concept2&status=error&message=connection_unavailable`, { 'cache-control': 'no-store' });
  }
});
