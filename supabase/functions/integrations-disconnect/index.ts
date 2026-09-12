import { ownerFromRequest } from '../_shared/auth.ts';
import { json, methodGuard, preflight } from '../_shared/http.ts';
import { loadData, loadToken, removeToken } from '../_shared/oauth.ts';
import { isWhoopUnauthorized, revokeWhoopToken, whoopErrorResponse } from '../_shared/whoop.ts';

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  const denied = methodGuard(req, ['POST']);
  if (denied) return denied;
  const provider = new URL(req.url).searchParams.get('provider');
  if (provider !== 'whoop') return json({ error: 'invalid_provider' }, 400);
  let owner: string;
  try {
    ({ owner } = await ownerFromRequest(req));
  } catch {
    return json({ error: 'unauthorized' }, 401);
  }
  const data = await loadData('whoop', owner);
  const token = await loadToken('whoop', owner) as any;
  if (token?.access_token) {
    try {
      await revokeWhoopToken(token.access_token);
    } catch (error) {
      if (!isWhoopUnauthorized(error)) {
        const response = whoopErrorResponse(error, 'revoke_failed');
        return json(response.body, response.status);
      }
    }
  }
  await removeToken('whoop', owner, data?.providerUserId || token?.athlete?.id);
  return json({ ok: true, provider: 'whoop' });
});
