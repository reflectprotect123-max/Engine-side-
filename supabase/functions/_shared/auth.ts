import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const USER_PREFIX = 'u:';

export function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !key) throw new Error('supabase_unconfigured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function ownerFromRequest(req: Request): Promise<{ owner: string; userId: string }> {
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
  return { owner: `${USER_PREFIX}${data.user.id}`, userId: data.user.id };
}

export function enginePublicOrigin(): string {
  return (Deno.env.get('ENGINE_PUBLIC_ORIGIN') || 'https://reflectprotect123-max.github.io/Engine-side-/').replace(/\/$/, '');
}

export function whoopCallbackUrl(): string {
  const explicit = (Deno.env.get('WHOOP_CALLBACK_URL') || '').trim();
  if (explicit) return explicit;
  const base = (Deno.env.get('SUPABASE_URL') || '').replace(/\/$/, '');
  return `${base}/functions/v1/whoop-callback`;
}

export function nativeReturnUrl(): string {
  return Deno.env.get('NATIVE_RETURN_URL') || 'com.hybrid.engine://whoop';
}
