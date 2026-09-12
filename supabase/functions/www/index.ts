import { corsHeaders } from '../_shared/http.ts';

const ROOT = (Deno.env.get('SUPABASE_URL') || '') + '/storage/v1/object/public/engine-web/';
const BASE = (Deno.env.get('SUPABASE_URL') || '') + '/functions/v1/www/';

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
};

function mime(path: string) {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return TYPES[ext] || 'application/octet-stream';
}

function objectPath(pathname: string) {
  let path = pathname;
  for (const prefix of ['/functions/v1/www', '/www']) {
    if (path === prefix || path.startsWith(prefix + '/')) {
      path = path.slice(prefix.length);
      break;
    }
  }
  path = path.replace(/^\/+/, '');
  if (!path || path.endsWith('/')) path += 'index.html';
  return path;
}

Deno.serve(async (req) => {
  if (req.method.toUpperCase() === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...corsHeaders(), 'access-control-max-age': '86400' } });
  }
  if (req.method.toUpperCase() !== 'GET' && req.method.toUpperCase() !== 'HEAD') {
    return new Response('method_not_allowed', { status: 405, headers: corsHeaders() });
  }
  const url = new URL(req.url);
  const pathname = url.pathname;
  if (pathname === '/www') {
    return new Response(null, { status: 302, headers: { location: BASE, ...corsHeaders() } });
  }
  const path = objectPath(pathname);
  const upstream = await fetch(ROOT + path);
  if (!upstream.ok) {
    return new Response('not found', { status: 404, headers: corsHeaders() });
  }
  const buf = await upstream.arrayBuffer();
  const headers = { ...corsHeaders(), 'content-type': mime(path), 'cache-control': path.endsWith('.html') ? 'no-cache' : 'public, max-age=120' };
  if (path.endsWith('.html')) {
    let html = new TextDecoder().decode(buf);
    if (!html.includes('<base ')) {
      html = html.replace('<head>', `<head>\n  <base href="${BASE}">`);
    }
    return new Response(html, { headers });
  }
  return new Response(buf, { headers });
});
