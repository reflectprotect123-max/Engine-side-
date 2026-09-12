import { serviceClient } from './auth.ts';

export async function getJson(key: string): Promise<any> {
  const sb = serviceClient();
  const { data, error } = await sb.schema('engine').from('integration_kv').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

export async function setJson(key: string, value: unknown): Promise<void> {
  const sb = serviceClient();
  const { error } = await sb.schema('engine').from('integration_kv').upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function deleteKey(key: string): Promise<void> {
  const sb = serviceClient();
  const { error } = await sb.schema('engine').from('integration_kv').delete().eq('key', key);
  if (error) throw error;
}
