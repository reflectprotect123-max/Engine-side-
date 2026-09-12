import { nativeAppId, nativeReturnUrl, publicOrigin } from '../_shared/auth.ts';
import { methodGuard, preflight, redirect } from '../_shared/http.ts';
import { consumePending, recordOAuthEvent, saveToken, syncRecord } from '../_shared/oauth.ts';
import { exchangeWhoopCode, whoopFetch } from '../_shared/whoop.ts';

function allowedOutcome(outcome: string) {
  return /^[a-z0-9_=&-]+$/i.test(outcome) ? outcome : 'status=error';
}

function nativeDonePage(product: 'engine' | 'strength', outcome: string): Response {
  const q = allowedOutcome(outcome);
  const appId = nativeAppId(product);
  const deep = `${nativeReturnUrl(product)}?${q}`;
  const intent = `intent://whoop?${q}#Intent;scheme=${appId};package=${appId};end`;
  const label = product === 'strength' ? 'TRACK' : 'The Engine';
  const html = `<!doctype html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${label}</title>
<meta http-equiv="refresh" content="0;url=${deep}">
</head>
<body style="font-family:system-ui,sans-serif;background:#111;color:#eee;padding:28px;line-height:1.5">
<p>WHOOP finished. Returning to ${label}…</p>
<p><a href="${deep}" style="color:#5ec4b4">Open ${label}</a></p>
<p><a href="${intent}" style="color:#5ec4b4">Open ${label} (Android)</a></p>
<p style="opacity:.7">If the app does not open, switch back and tap Sync.</p>
<script>location.replace(${JSON.stringify(deep)});</script>
</body></html>`;
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function finish(kind: string, product: 'engine' | 'strength', outcome: string) {
  if (kind === 'native') return nativeDonePage(product, outcome);
  const dest = `${publicOrigin(product)}/?integration=whoop&${allowedOutcome(outcome)}`;
  return redirect(dest, { 'cache-control': 'no-store' });
}

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  const denied = methodGuard(req, ['GET']);
  if (denied) return denied;
  let kind = 'browser';
  let product: 'engine' | 'strength' = 'engine';
  try {
    const q = new URL(req.url).searchParams;
    const state = (q.get('state') || '').trim();
    const pending = await consumePending('whoop', state);
    if (!pending) {
      await recordOAuthEvent('whoop', { stage: 'callback', ok: false, error: 'invalid_oauth_state', hasState: !!state });
      return finish('browser', 'engine', 'status=error&message=invalid_oauth_state');
    }
    kind = pending.kind;
    product = pending.product === 'strength' ? 'strength' : 'engine';
    if (q.get('error')) {
      await recordOAuthEvent('whoop', { stage: 'callback', ok: false, error: 'denied', kind, product });
      return finish(kind, product, 'status=denied');
    }
    const code = (q.get('code') || '').trim();
    if (!code) {
      await recordOAuthEvent('whoop', { stage: 'callback', ok: false, error: 'invalid_oauth_response', kind, product });
      return finish(kind, product, 'status=error&message=invalid_oauth_response');
    }
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
    await recordOAuthEvent('whoop', { stage: 'callback', ok: true, error: null, kind, product });
    return finish(kind, product, 'status=connected');
  } catch (error) {
    console.error('[whoop-callback]', (error as Error)?.message || error);
    await recordOAuthEvent('whoop', { stage: 'callback', ok: false, error: 'connection_failed', kind, product });
    return finish(kind, product, 'status=error&message=connection_failed');
  }
});
