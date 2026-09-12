async function keyBytes(): Promise<Uint8Array> {
  const secret = Deno.env.get('INTEGRATION_ENCRYPT_KEY') || Deno.env.get('APP_SESSION_SECRET') || '';
  if (!secret) throw new Error('INTEGRATION_ENCRYPT_KEY missing');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return new Uint8Array(digest);
}

function b64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unb64url(value: string): Uint8Array {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4));
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptJson(value: unknown): Promise<string> {
  const keyRaw = await keyBytes();
  const key = await crypto.subtle.importKey('raw', keyRaw, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  const buf = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded));
  const tag = buf.slice(buf.length - 16);
  const data = buf.slice(0, buf.length - 16);
  return `${b64url(iv)}.${b64url(tag)}.${b64url(data)}`;
}

export async function decryptJson(value: string | null): Promise<unknown | null> {
  if (!value) return null;
  const parts = String(value).split('.');
  if (parts.length !== 3 || parts.some((p) => !p)) return null;
  try {
    const [iv, tag, data] = parts.map(unb64url);
    const keyRaw = await keyBytes();
    const key = await crypto.subtle.importKey('raw', keyRaw, 'AES-GCM', false, ['decrypt']);
    const packed = new Uint8Array(data.length + tag.length);
    packed.set(data, 0);
    packed.set(tag, data.length);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, packed);
    return JSON.parse(new TextDecoder().decode(plain));
  } catch {
    return null;
  }
}
