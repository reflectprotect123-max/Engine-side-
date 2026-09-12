const CORS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization,content-type,apikey,accept,x-client-info',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
};

export function corsHeaders(): Record<string, string> {
  return { ...CORS };
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS, ...extra },
  });
}

export function redirect(location: string, extra: Record<string, string> = {}): Response {
  return new Response(null, { status: 302, headers: { location, ...CORS, ...extra } });
}

export function preflight(req: Request): Response | null {
  if (req.method.toUpperCase() === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...CORS, 'access-control-max-age': '86400' } });
  }
  return null;
}

export function methodGuard(req: Request, allowed: string[]): Response | null {
  if (!allowed.includes(req.method.toUpperCase())) {
    return json({ error: 'method_not_allowed' }, 405, { allow: allowed.join(', ') });
  }
  return null;
}
