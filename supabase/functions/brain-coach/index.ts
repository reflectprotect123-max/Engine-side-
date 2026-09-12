import { json, methodGuard, preflight } from '../_shared/http.ts';
import { ownerFromRequest } from '../_shared/auth.ts';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openrouter/free';

function systemPrompt(packet: unknown) {
  return [
    'You are a personal training coach inside The Engine.',
    'Use ONLY metrics in the context JSON. Do not invent numbers.',
    'Keep answers concise (2-5 sentences unless asked for detail). Not a doctor.',
    'Context:',
    JSON.stringify(packet ?? {}),
  ].join('\n');
}

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  const denied = methodGuard(req, ['POST']);
  if (denied) return denied;
  try {
    await ownerFromRequest(req);
  } catch {
    return json({ error: 'Sign in required' }, 401);
  }
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) return json({ error: 'Coach unavailable (OPENROUTER_API_KEY not set)' }, 503);
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const message = String(body.message || '').trim();
  const history = Array.isArray(body.history) ? body.history : [];
  const packet = body.packet && typeof body.packet === 'object' ? body.packet : {};
  if (!message) return json({ error: 'message required' }, 400);
  const messages = [
    { role: 'system', content: systemPrompt(packet) },
    ...history
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
      .slice(-8)
      .map((m: any) => ({ role: m.role, content: String(m.content) })),
    { role: 'user', content: message },
  ];
  const origin = Deno.env.get('ENGINE_PUBLIC_ORIGIN') || 'https://orysjncrksmdfabpuftd.supabase.co/functions/v1/www/';
  const upstream = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      'HTTP-Referer': origin,
      'X-Title': 'The Engine Coach',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENROUTER_MODEL') || DEFAULT_MODEL,
      messages,
      max_tokens: 512,
    }),
  });
  const text = await upstream.text();
  if (!upstream.ok) {
    return new Response(text || JSON.stringify({ error: 'OpenRouter error' }), {
      status: upstream.status,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    });
  }
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return json({ error: 'Bad upstream JSON' }, 502);
  }
  const reply = parsed?.choices?.[0]?.message?.content ?? '';
  return json({ reply, model: parsed?.model || DEFAULT_MODEL }, 200, { 'cache-control': 'no-store' });
});
