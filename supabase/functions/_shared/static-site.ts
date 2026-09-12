import { corsHeaders } from './http.ts';

const TYPES: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  txt: 'text/plain; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
  webp: 'image/webp',
};

function mime(path: string) {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return TYPES[ext] || 'application/octet-stream';
}

export function servePublicBucket(opts: { bucket: string; functionName: string }) {
  const root = () => `${(Deno.env.get('SUPABASE_URL') || '').replace(/\/$/, '')}/storage/v1/object/public/${opts.bucket}/`;
  const base = () => `${(Deno.env.get('SUPABASE_URL') || '').replace(/\/$/, '')}/functions/v1/${opts.functionName}/`;

  function objectPath(pathname: string) {
    let path = pathname;
    const prefixes = [`/functions/v1/${opts.functionName}`, `/${opts.functionName}`];
    for (const prefix of prefixes) {
      if (path === prefix || path.startsWith(prefix + '/')) {
        path = path.slice(prefix.length);
        break;
      }
    }
    path = path.replace(/^\/+/, '');
    if (!path || path.endsWith('/')) path += 'index.html';
    return path;
  }

  return async (req: Request) => {
    if (req.method.toUpperCase() === 'OPTIONS') {
      return new Response(null, { status: 204, headers: { ...corsHeaders(), 'access-control-max-age': '86400' } });
    }
    if (req.method.toUpperCase() !== 'GET' && req.method.toUpperCase() !== 'HEAD') {
      return new Response('method_not_allowed', { status: 405, headers: corsHeaders() });
    }
    const url = new URL(req.url);
    const pathname = url.pathname;
    if (pathname === `/${opts.functionName}` || pathname === `/functions/v1/${opts.functionName}`) {
      return new Response(null, { status: 302, headers: { location: base(), ...corsHeaders() } });
    }
    const path = objectPath(pathname);
    const upstream = await fetch(root() + path);
    if (!upstream.ok) {
      return new Response('not found', { status: 404, headers: corsHeaders() });
    }
    const buf = await upstream.arrayBuffer();
    const headers = {
      ...corsHeaders(),
      'content-type': mime(path),
      'cache-control': path.endsWith('.html') ? 'no-cache' : 'public, max-age=120',
    };
    if (path.endsWith('.html')) {
      let html = new TextDecoder().decode(buf);
      if (!html.includes('<base ')) {
        html = html.replace('<head>', `<head>\n  <base href="${base()}">`);
      }
      return new Response(html, { headers });
    }
    return new Response(buf, { headers });
  };
}
