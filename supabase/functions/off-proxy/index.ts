import { json, methodGuard, preflight } from '../_shared/http.ts';

const OFF_ORIGINS = [
  'https://world.openfoodfacts.org',
  'https://world.openfoodfacts.net',
];
const UA = 'TheEngine/1.0 (supabase off-proxy)';

function allowedPath(path: string) {
  if (!path.startsWith('/')) return false;
  if (path.startsWith('/cgi/search.pl')) return true;
  if (path.startsWith('/api/v2/product/')) return true;
  if (path.startsWith('/api/v0/product/')) return true;
  return false;
}

async function fetchOff(path: string) {
  let lastErr: Error | null = null;
  for (const origin of OFF_ORIGINS) {
    try {
      const res = await fetch(origin + path, { headers: { accept: 'application/json', 'user-agent': UA } });
      const ct = String(res.headers.get('content-type') || '');
      if (!res.ok) {
        lastErr = new Error('OFF HTTP ' + res.status);
        continue;
      }
      if (ct.includes('text/html')) {
        lastErr = new Error('OFF unavailable');
        continue;
      }
      return await res.json();
    } catch (e) {
      lastErr = e as Error;
    }
  }
  throw lastErr || new Error('OFF failed');
}

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  const denied = methodGuard(req, ['GET']);
  if (denied) return denied;
  let path = '';
  try {
    path = decodeURIComponent(new URL(req.url).searchParams.get('path') || '');
  } catch {
    path = '';
  }
  if (!allowedPath(path)) return json({ error: 'path_not_allowed' }, 400, { 'cache-control': 'no-store' });
  try {
    const data = await fetchOff(path);
    return json(data, 200, { 'cache-control': 'public, max-age=300' });
  } catch (e) {
    return json({ error: 'off_unavailable', message: String((e as Error)?.message || e) }, 502, { 'cache-control': 'no-store' });
  }
});
