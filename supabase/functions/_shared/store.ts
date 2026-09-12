const SCHEMA = 'engine';

function restHeaders(prefer: string) {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    'accept-profile': SCHEMA,
    'content-profile': SCHEMA,
    'content-type': 'application/json',
    prefer: prefer,
  };
}

function restUrl(path: string) {
  const base = (Deno.env.get('SUPABASE_URL') || '').replace(/\/$/, '');
  return `${base}/rest/v1/${path}`;
}

export async function getJson(key: string): Promise<any> {
  const url = restUrl(`integration_kv?select=value&key=eq.${encodeURIComponent(key)}`);
  const res = await fetch(url, { headers: restHeaders('return=representation') });
  if (!res.ok) throw new Error(`store get ${res.status}`);
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0].value : null;
}

export async function setJson(key: string, value: unknown): Promise<void> {
  const res = await fetch(restUrl('integration_kv'), {
    method: 'POST',
    headers: restHeaders('return=minimal,resolution=merge-duplicates'),
    body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`store set ${res.status} ${await res.text()}`);
}

export async function deleteKey(key: string): Promise<void> {
  const res = await fetch(restUrl(`integration_kv?key=eq.${encodeURIComponent(key)}`), {
    method: 'DELETE',
    headers: restHeaders('return=minimal'),
  });
  if (!res.ok) throw new Error(`store delete ${res.status}`);
}
