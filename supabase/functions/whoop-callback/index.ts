import { enginePublicOrigin, nativeReturnUrl } from '../_shared/auth.ts';
import { methodGuard, preflight, redirect } from '../_shared/http.ts';
import { consumePending, saveToken, syncRecord } from '../_shared/oauth.ts';
import { exchangeWhoopCode, whoopFetch } from '../_shared/whoop.ts';

function allowedOutcome(outcome: string) {
  return /^[a-z0-9_=&-]+$/i.test(outcome) ? outcome : 'status=error';
}

function nativeDonePage(outcome: string): Response {
  const q = allowedOutcome(outcome);
  const deep = `${nativeReturnUrl()}?${q}`;
  const intent = `intent://whoop?${q}#Intent;scheme=com.hybrid.engine;package=com.hybrid.engine;end`;
  const html = `<!doctype html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Engine</title>
<meta http-equiv="refresh" content="0;url=${deep}">
</head>
<body style="font-family:system-ui,sans-serif;background:#111;color:#eee;padding:28px;line-height:1.5">
<p>WHOOP finished. Returning to The Engine…</p>
<p><a href="${deep}" style="color:#5ec4b4">Open The Engine</a></p>
<p><a href="${intent}" style="color:#5ec4b4">Open The Engine (Android)</a></p>
<p style="opacity:.7">If the app does not open, switch back to The Engine and tap Sync.</p>
<script>location.replace(${JSON.stringify(deep)});</script>
</body></html>`;
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function finish(kind: string, outcome: string) {
  if (kind === 'native') return nativeDonePage(outcome);
  const dest = `${enginePublicOrigin()}/?integration=whoop&${allowedOutcome(outcome)}`;
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
