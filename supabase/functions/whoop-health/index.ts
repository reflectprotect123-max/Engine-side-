import { deleteKey, getJson, setJson } from '../_shared/store.ts';

Deno.serve(async () => {
  const callback = (Deno.env.get('WHOOP_CALLBACK_URL') || '').trim();
  const native = (Deno.env.get('NATIVE_RETURN_URL') || '').trim();
  const origin = (Deno.env.get('ENGINE_PUBLIC_ORIGIN') || '').trim();
  const id = (Deno.env.get('WHOOP_CLIENT_ID') || '').trim();
  const secret = (Deno.env.get('WHOOP_CLIENT_SECRET') || '').trim();
  const encrypt = (Deno.env.get('INTEGRATION_ENCRYPT_KEY') || '').trim();
  const expectedCb = 'https://orysjncrksmdfabpuftd.supabase.co/functions/v1/whoop-callback';
  let storeOk = false;
  try {
    const key = 'health:store-probe';
    const marker = `ok:${Date.now()}`;
    await setJson(key, { marker });
    const row = await getJson(key);
    await deleteKey(key);
    storeOk = row?.marker === marker;
  } catch {
    storeOk = false;
  }
  const body = {
    callback_ok: callback === expectedCb,
    native_ok: native === 'com.hybrid.engine://whoop',
    origin_ok: origin.includes('functions/v1/www'),
    client_id_ok: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
    secret_ok: secret.length >= 32,
    encrypt_ok: encrypt.length >= 16,
    store_ok: storeOk,
    callback_len: callback.length,
    native_len: native.length,
  };
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'cache-control': 'no-store',
    },
  });
});
