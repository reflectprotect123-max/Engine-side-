import { enginePublicOrigin, nativeReturnUrl } from '../_shared/auth.ts';
import { methodGuard, preflight, redirect } from '../_shared/http.ts';
import { consumePending, saveToken, syncRecord } from '../_shared/oauth.ts';
import { exchangeWhoopCode, whoopFetch } from '../_shared/whoop.ts';

function finish(kind: string, outcome: string) {
  const dest = kind === 'native'
    ? `${nativeReturnUrl()}?${outcome}`
    : `${enginePublicOrigin()}/?integration=whoop&${outcome}`;
  return redirect(dest, { 'cache-control': 'no-store' });
}

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  const denied = methodGuard(req, ['GET']);
  if (denied) return denied;
  let kind = 'browser';
  try {
    const q = new URL(req.url).searchParams;
    const state = (q.get('state') || '').trim();
    const pending = await consumePending('whoop', state);
    if (!pending) return finish('browser', 'status=error&message=invalid_oauth_state');
    kind = pending.kind;
    if (q.get('error')) return finish(kind, 'status=denied');
    const code = (q.get('code') || '').trim();
    if (!code) return finish(kind, 'status=error&message=invalid_oauth_response');
    const token = await exchangeWhoopCode(code);
    const profile = await whoopFetch('/user/profile/basic', token.access_token);
    const providerUserId = profile?.user_id ?? profile?.id;
    if (providerUserId == null || String(providerUserId).trim() === '') throw new Error('WHOOP profile did not include a user id');
    await saveToken('whoop', pending.owner, token, providerUserId);
    await syncRecord('whoop', pending.owner, {
      provider: 'whoop',
      connectedAt: new Date().toISOString(),
      providerUserId,
      profile: { firstName: profile.first_name || '', lastName: profile.last_name || '' },
    });
    return finish(kind, 'status=connected');
  } catch (error) {
    console.error('[whoop-callback]', (error as Error)?.message || error);
    return finish(kind, 'status=error&message=connection_failed');
  }
});
