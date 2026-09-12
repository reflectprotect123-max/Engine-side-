import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export type HybridProduct = 'engine' | 'strength';

const USER_PREFIX = 'u:';
const STRENGTH_PREFIX = 's:';

export function productFromRequest(req: Request): HybridProduct {
  const url = new URL(req.url);
  const raw = (req.headers.get('x-hybrid-product') || url.searchParams.get('product') || '').trim().toLowerCase();
  if (raw === 'strength' || raw === 'athlete' || raw === 'track') return 'strength';
  return 'engine';
}

export function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !key) throw new Error('supabase_unconfigured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function ownerFromRequest(req: Request): Promise<{ owner: string; userId: string; product: HybridProduct }> {
  const auth = req.headers.get('authorization') || '';
  const jwt = auth.replace(/^Bearer\s+/i, '').trim();
  if (!jwt) {
    const err = new Error('unauthorized');
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  // Pass the JWT into getUser. A header-only client leaves session empty on Edge,
  // and this project issues ES256 user tokens (JWKS), not HS256 anon-key tokens.
  const { data, error } = await serviceClient().auth.getUser(jwt);
  if (error || !data.user?.id) {
    const err = new Error('unauthorized');
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  const product = productFromRequest(req);
  const prefix = product === 'strength' ? STRENGTH_PREFIX : USER_PREFIX;
  return { owner: `${prefix}${data.user.id}`, userId: data.user.id, product };
}

export function enginePublicOrigin(): string {
  return (Deno.env.get('ENGINE_PUBLIC_ORIGIN') || 'https://orysjncrksmdfabpuftd.supabase.co/functions/v1/www').replace(/\/$/, '');
}

export function strengthPublicOrigin(): string {
  return (Deno.env.get('STRENGTH_PUBLIC_ORIGIN') || 'https://orysjncrksmdfabpuftd.supabase.co/functions/v1/strength').replace(/\/$/, '');
}

export function publicOrigin(product: HybridProduct): string {
  return product === 'strength' ? strengthPublicOrigin() : enginePublicOrigin();
}

export function concept2CallbackUrl(): string {
  const explicit = (Deno.env.get('CONCEPT2_CALLBACK_URL') || '').trim();
  if (explicit) return explicit;
  const base = (Deno.env.get('SUPABASE_URL') || '').replace(/\/$/, '');
  return `${base}/functions/v1/concept2-callback`;
}

export function nativeReturnUrl(product: HybridProduct = 'engine'): string {
  if (product === 'strength') {
    return Deno.env.get('STRENGTH_NATIVE_RETURN_URL') || 'com.hybrid.athlete://whoop';
  }
  return Deno.env.get('NATIVE_RETURN_URL') || 'com.hybrid.engine://whoop';
}

export function nativeAppId(product: HybridProduct = 'engine'): string {
  return product === 'strength' ? 'com.hybrid.athlete' : 'com.hybrid.engine';
}
