import { nativeAppId, nativeReturnUrl, publicOrigin } from '../_shared/auth.ts';
import { methodGuard, preflight, redirect } from '../_shared/http.ts';
import { consumePending, saveToken, syncRecord } from '../_shared/oauth.ts';
import { exchangeConcept2Code, listConcept2Results } from '../_shared/concept2.ts';

function allowedOutcome(outcome: string) {
  return /^[a-z0-9_=&-]+$/i.test(outcome) ? outcome : 'status=error';
}

function nativeDonePage(product: 'engine' | 'strength', outcome: string): Response {
  const q = allowedOutcome(outcome);
  const appId = nativeAppId(product);
  const deep = `${nativeReturnUrl(product)}?integration=concept2&${q}`;
  const intent = `intent://whoop?integration=concept2&${q}#Intent;scheme=${appId};package=${appId};end`;
  const label = product === 'strength' ? 'TRACK' : 'The Engine';
  const html = `<!doctype html>
<html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${label}</title>
<meta http-equiv="refresh" content="0;url=${deep}">
</head>
<body style="font-family:system-ui,sans-serif;background:#111;color:#eee;padding:28px;line-height:1.5">
<p>Concept2 finished. Returning to ${label}…</p>
<p><a href="${deep}" style="color:#5ec4b4">Open ${label}</a></p>
<p><a href="${intent}" style="color:#5ec4b4">Open ${label} (Android)</a></p>
<script>location.replace(${JSON.stringify(deep)});</script>
</body></html>`;
  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function finish(kind: string, product: 'engine' | 'strength', outcome: string) {
  if (kind === 'native') return nativeDonePage(product, outcome);
  return redirect(`${publicOrigin(product)}/?integration=concept2&${allowedOutcome(outcome)}`, { 'cache-control': 'no-store' });
}

async function resolveProviderUserId(token: unknown) {
  try {
    const page = await listConcept2Results(token, { number: 1 });
    const first = Array.isArray(page?.data) ? page.data[0] : null;
    const id = first?.user_id;
    return id == null || String(id).trim() === '' ? null : String(id);
  } catch {
    return null;
  }
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
    const pending = await consumePending('concept2', state);
    if (!pending) return finish('browser', 'engine', 'status=error&message=invalid_oauth_state');
    kind = pending.kind;
    product = pending.product === 'strength' ? 'strength' : 'engine';
    if (q.get('error')) return finish(kind, product, 'status=denied');
    const code = (q.get('code') || '').trim();
    if (!code) return finish(kind, product, 'status=error&message=invalid_oauth_response');
    const token = await exchangeConcept2Code(code);
    const providerUserId = await resolveProviderUserId(token);
    await saveToken('concept2', pending.owner, token, providerUserId);
    await syncRecord('concept2', pending.owner, { provider: 'concept2', connectedAt: new Date().toISOString(), providerUserId });
    return finish(kind, product, 'status=connected');
  } catch (error) {
    console.error('[concept2-callback]', (error as Error)?.message || error);
    return finish(kind, product, 'status=error&message=connection_failed');
  }
});
