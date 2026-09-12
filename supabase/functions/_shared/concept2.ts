import { concept2CallbackUrl } from './auth.ts';
import { tokenNeedsRefresh } from './whoop.ts';

const BASE = 'https://log.concept2.com';
const API = `${BASE}/api`;
const AUTH = `${BASE}/oauth`;
const ACCEPT = 'application/vnd.c2logbook.v1+json';

export const CONCEPT2_STATE_LENGTH = 32;
export const CONCEPT2_SCOPES = ['user:read', 'results:read'];
export { tokenNeedsRefresh };

export class Concept2Error extends Error {
  status: number;
  code: string;
  kind: string;
  retryAfter: string | null;
  constructor(message: string, { code = 'concept2_error', kind = 'concept2', status = 0, retryAfter = null }: { code?: string; kind?: string; status?: number; retryAfter?: string | null } = {}) {
    super(message);
    this.name = 'Concept2Error';
    this.code = code;
    this.kind = kind;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function clientId() { return (Deno.env.get('CONCEPT2_CLIENT_ID') || '').trim(); }
function clientSecret() { return (Deno.env.get('CONCEPT2_CLIENT_SECRET') || '').trim(); }

function requireConcept2() {
  if (!clientId() || !clientSecret()) {
    throw new Concept2Error('Concept2 configuration unavailable', { code: 'configuration_error', kind: 'configuration', status: 500 });
  }
}

function finiteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : null;
  return Number.isFinite(number) ? number : null;
}

function stringOrNull(value: unknown) {
  return typeof value === 'string' && value !== '' ? value : null;
}

function syncedAtOf(value: unknown) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : new Date().toISOString();
}

function normalizeTokenResponse(payload: any) {
  if (!payload || typeof payload !== 'object' || typeof payload.access_token !== 'string' || !payload.access_token.trim()) {
    throw new Concept2Error('Concept2 token response was invalid', { code: 'invalid_token_response', kind: 'oauth', status: 502 });
  }
  const token = { ...payload, access_token: payload.access_token.trim() };
  const expiresIn = finiteNumber(payload.expires_in);
  if (expiresIn !== null && expiresIn > 0) token.expires_at = Date.now() + expiresIn * 1000;
  return token;
}

async function tokenRequest(body: Record<string, string>) {
  requireConcept2();
  const response = await fetch(`${AUTH}/access_token`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId(), client_secret: clientSecret(), ...body }),
  });
  if (!response.ok) {
    await response.text().catch(() => '');
    throw new Concept2Error('Concept2 token request failed', { code: 'token_request_failed', kind: 'oauth', status: response.status });
  }
  return normalizeTokenResponse(await response.json());
}

export function createConcept2AuthUrl(state: string) {
  requireConcept2();
  if (!state || state.length !== CONCEPT2_STATE_LENGTH) {
    throw new Concept2Error('Invalid Concept2 OAuth state', { code: 'invalid_state', kind: 'input', status: 400 });
  }
  const url = new URL(`${AUTH}/authorize`);
  url.search = new URLSearchParams({
    client_id: clientId(),
    response_type: 'code',
    redirect_uri: concept2CallbackUrl(),
    scope: CONCEPT2_SCOPES.join(','),
    state,
  }).toString();
  return url.toString();
}

export const exchangeConcept2Code = (code: string) =>
  tokenRequest({ grant_type: 'authorization_code', redirect_uri: concept2CallbackUrl(), code, scope: CONCEPT2_SCOPES.join(',') });
export const refreshConcept2Token = (refreshToken: string) =>
  tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken, scope: CONCEPT2_SCOPES.join(',') });

export function mergeConcept2Token(previous: any = {}, refreshed: any = {}) {
  const token = { ...previous, ...refreshed };
  if (!refreshed.refresh_token && previous.refresh_token) token.refresh_token = previous.refresh_token;
  if (!refreshed.expires_at && previous.expires_at) token.expires_at = previous.expires_at;
  return token;
}

function apiUrl(path: string) {
  const relative = String(path || '').replace(/^\/+/, '');
  const root = new URL(`${API}/`);
  return new URL(relative, root).toString();
}

export async function concept2Fetch(path: string, token: any, params: Record<string, unknown> | null = null) {
  const accessToken = typeof token === 'string' ? token : token?.access_token;
  if (!accessToken) throw new Concept2Error('Concept2 access token missing', { code: 'missing_access_token', kind: 'oauth', status: 401 });
  const url = new URL(apiUrl(path));
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  const response = await fetch(url.toString(), { headers: { accept: ACCEPT, authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    await response.text().catch(() => '');
    throw new Concept2Error('Concept2 API request failed', { code: 'api_request_failed', kind: 'api', status: response.status });
  }
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

export const listConcept2Results = (token: any, params: Record<string, unknown> = {}) =>
  concept2Fetch('/users/me/results', token, params);

export async function getConcept2Strokes(resultId: string, token: any) {
  try {
    return await concept2Fetch(`/users/me/results/${encodeURIComponent(resultId)}/strokes`, token);
  } catch (error) {
    if (error instanceof Concept2Error && error.status === 404) return null;
    throw error;
  }
}

export function normalizeConcept2Result(result: any, { strokes = null, syncedAt }: { strokes?: unknown; syncedAt?: string } = {}) {
  const wrapped = result && typeof result === 'object' ? result : {};
  const source = wrapped.data && typeof wrapped.data === 'object' && !Array.isArray(wrapped.data) ? wrapped.data : wrapped;
  return {
    provider: 'concept2_logbook',
    externalId: source.id == null ? null : String(source.id),
    providerUserId: source.user_id == null ? null : String(source.user_id),
    modality: stringOrNull(source.type),
    startedAt: stringOrNull(source.date_utc) ?? stringOrNull(source.date),
    durationRaw: finiteNumber(source.time),
    distanceRaw: finiteNumber(source.distance),
    durationDisplay: stringOrNull(source.time_formatted),
    workoutType: stringOrNull(source.workout_type) ?? 'unknown',
    source: stringOrNull(source.source),
    verified: source.verified ?? null,
    ranked: source.ranked ?? null,
    privacy: stringOrNull(source.privacy),
    workout: source.workout ?? null,
    metadata: source.metadata ?? null,
    strokes,
    strokeDataAvailable: strokes !== null,
    syncedAt: syncedAtOf(syncedAt),
  };
}

export function isConcept2Unauthorized(error: any) {
  return error?.status === 401;
}

export function concept2ErrorResponse(error: any, fallback = 'concept2_failed') {
  if (error?.code === 'configuration_error') return { status: 500, body: { error: 'configuration_error' } };
  if (error?.status === 401 || (error?.kind === 'oauth' && error?.status >= 400 && error?.status < 500)) {
    return { status: 401, body: { error: 'reauthorization_required' } };
  }
  if (error?.status === 429) return { status: 429, body: { error: 'rate_limited' } };
  return { status: 502, body: { error: fallback } };
}
