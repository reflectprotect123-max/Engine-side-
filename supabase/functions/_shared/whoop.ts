import { whoopCallbackUrl } from './auth.ts';

const API = 'https://api.prod.whoop.com/developer/v2';
const AUTH = 'https://api.prod.whoop.com/oauth/oauth2';
const MAX_PAGE_SIZE = 25;
const MAX_WORKOUTS = 30;

export const WHOOP_STATE_LENGTH = 8;
export const WHOOP_SCOPES = ['offline', 'read:recovery', 'read:cycles', 'read:sleep', 'read:workout', 'read:profile', 'read:body_measurement'];

export class WhoopError extends Error {
  status: number;
  code: string;
  kind: string;
  retryAfter: string | null;
  constructor(message: string, { code = 'whoop_error', kind = 'whoop', status = 0, retryAfter = null }: { code?: string; kind?: string; status?: number; retryAfter?: string | null } = {}) {
    super(message);
    this.name = 'WhoopError';
    this.code = code;
    this.kind = kind;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function clientId() { return (Deno.env.get('WHOOP_CLIENT_ID') || '').trim(); }
function clientSecret() { return (Deno.env.get('WHOOP_CLIENT_SECRET') || '').trim(); }

function requireWhoop() {
  if (!clientId() || !clientSecret()) {
    throw new WhoopError('WHOOP configuration unavailable', { code: 'configuration_error', kind: 'configuration', status: 500 });
  }
}

function finiteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return null;
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : null;
  return Number.isFinite(number) ? number : null;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const number = finiteNumber(value);
    if (number !== null) return number;
  }
  return null;
}

function dateOnly(value: unknown) {
  if (value === null || value === undefined || value === '') return '';
  const text = String(value).trim();
  const direct = /^(\d{4}-\d{2}-\d{2})/.exec(text)?.[1];
  if (direct && Number.isFinite(Date.parse(`${direct}T00:00:00.000Z`))) return direct;
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : '';
}

function capturedAt(value: unknown) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : new Date().toISOString();
}

function recordsOf(input: any) {
  if (Array.isArray(input)) return input.filter((record) => record && typeof record === 'object');
  if (Array.isArray(input?.records)) return input.records.filter((record: unknown) => record && typeof record === 'object');
  if (input && typeof input === 'object' && ('score' in input || 'start' in input || 'created_at' in input || 'updated_at' in input)) return [input];
  return [];
}

function selectRecord(records: any[], hasValue: (r: any) => boolean) {
  return records.find(hasValue) || records[0] || {};
}

function apiUrl(path: string) {
  const relative = String(path || '').replace(/^\/+/, '');
  const root = new URL(`${API}/`);
  const url = new URL(relative, root);
  return url.toString();
}

function normalizeTokenResponse(payload: any) {
  if (!payload || typeof payload !== 'object' || typeof payload.access_token !== 'string' || !payload.access_token.trim()) {
    throw new WhoopError('WHOOP token response was invalid', { code: 'invalid_token_response', kind: 'oauth', status: 502 });
  }
  const token = { ...payload, access_token: payload.access_token.trim() };
  const expiresIn = finiteNumber(payload.expires_in);
  if (expiresIn !== null && expiresIn > 0) token.expires_at = Date.now() + expiresIn * 1000;
  return token;
}

async function tokenRequest(body: Record<string, string>) {
  requireWhoop();
  const response = await fetch(`${AUTH}/token`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId(), client_secret: clientSecret(), ...body }),
  });
  if (!response.ok) {
    await response.text().catch(() => '');
    throw new WhoopError('WHOOP token request failed', { code: 'token_request_failed', kind: 'oauth', status: response.status });
  }
  return normalizeTokenResponse(await response.json());
}

export function createWhoopAuthUrl(state: string) {
  requireWhoop();
  if (!state || state.length !== WHOOP_STATE_LENGTH) throw new WhoopError('Invalid WHOOP OAuth state', { code: 'invalid_state', kind: 'input', status: 400 });
  const url = new URL(`${AUTH}/auth`);
  url.search = new URLSearchParams({
    client_id: clientId(),
    response_type: 'code',
    redirect_uri: whoopCallbackUrl(),
    scope: WHOOP_SCOPES.join(' '),
    state,
  }).toString();
  return url.toString();
}

export const exchangeWhoopCode = (code: string) =>
  tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: whoopCallbackUrl() });
export const refreshWhoopToken = (refreshToken: string) =>
  tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken, scope: 'offline' });

export function mergeWhoopToken(previous: any = {}, refreshed: any = {}) {
  const token = { ...previous, ...refreshed };
  if (!refreshed.refresh_token && previous.refresh_token) token.refresh_token = previous.refresh_token;
  if (!refreshed.expires_at && previous.expires_at) token.expires_at = previous.expires_at;
  return token;
}

export function tokenNeedsRefresh(token: any, skewMs = 60 * 1000) {
  if (!token?.access_token) return true;
  const expiresAt = finiteNumber(token.expires_at);
  return expiresAt !== null && Date.now() >= expiresAt - skewMs;
}

export async function whoopFetch(path: string, token: any) {
  const accessToken = typeof token === 'string' ? token : token?.access_token;
  if (!accessToken) throw new WhoopError('WHOOP access token missing', { code: 'missing_access_token', kind: 'oauth', status: 401 });
  const response = await fetch(apiUrl(path), { headers: { accept: 'application/json', authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    await response.text().catch(() => '');
    throw new WhoopError('WHOOP API request failed', { code: 'api_request_failed', kind: 'api', status: response.status });
  }
  if (response.status === 204) return null;
  return await response.json();
}

export async function revokeWhoopToken(token: any) {
  const accessToken = typeof token === 'string' ? token : token?.access_token;
  if (!accessToken) throw new WhoopError('WHOOP access token missing', { code: 'missing_access_token', kind: 'oauth', status: 401 });
  const response = await fetch(apiUrl('/user/access'), { method: 'DELETE', headers: { authorization: `Bearer ${accessToken}` } });
  if (!response.ok) {
    await response.text().catch(() => '');
    throw new WhoopError('WHOOP revoke request failed', { code: 'revoke_failed', kind: 'oauth', status: response.status });
  }
  return true;
}

async function fetchCollection(path: string, token: any, maxRecords: number) {
  const records: any[] = [];
  const seenTokens = new Set<string>();
  let nextToken = '';
  let pages = 0;
  while (records.length < maxRecords && pages < 10) {
    const params = new URLSearchParams({ limit: String(Math.min(MAX_PAGE_SIZE, maxRecords - records.length)) });
    if (nextToken) params.set('nextToken', nextToken);
    const separator = path.includes('?') ? '&' : '?';
    const page = await whoopFetch(`${path}${separator}${params.toString()}`, token);
    if (Array.isArray(page?.records)) records.push(...page.records);
    const pageToken = typeof page?.next_token === 'string' ? page.next_token : '';
    if (!pageToken || seenTokens.has(pageToken)) break;
    seenTokens.add(pageToken);
    nextToken = pageToken;
    pages += 1;
  }
  return { records: records.slice(0, maxRecords) };
}

export function normalizeWhoopPayload({ recovery = {}, cycle = {}, sleep = {}, workout = {} }: any = {}) {
  const recoveryRecords = recordsOf(recovery);
  const cycleRecords = recordsOf(cycle);
  const sleepRecords = recordsOf(sleep);
  const workoutRecords = recordsOf(workout);
  const recoveryRecord = selectRecord(recoveryRecords, (record) => firstNumber(record.score?.recovery_score, record.recovery_score) !== null);
  const cycleRecord = selectRecord(cycleRecords, (record) => firstNumber(record.score?.strain, record.strain) !== null);
  const nonNapSleeps = sleepRecords.filter((record: any) => record.nap !== true);
  const sleepRecord = selectRecord(nonNapSleeps.length ? nonNapSleeps : sleepRecords, (record) => firstNumber(record.score?.sleep_performance_percentage, record.sleep_performance_percentage) !== null);
  const workoutRecord = selectRecord(workoutRecords, (record) => firstNumber(record.score?.strain, record.strain) !== null);
  const date = recoveryRecord.date || sleepRecord.start || cycleRecord.start || workoutRecord.start || recoveryRecord.created_at;
  return {
    source: 'whoop',
    date: dateOnly(date),
    recoveryScore: firstNumber(recoveryRecord.score?.recovery_score, recoveryRecord.recovery_score),
    sleepPerformance: firstNumber(sleepRecord.score?.sleep_performance_percentage, sleepRecord.sleep_performance_percentage),
    hrvMs: firstNumber(recoveryRecord.score?.hrv_rmssd_milli, recoveryRecord.hrv_rmssd_milli),
    restingHr: firstNumber(recoveryRecord.score?.resting_heart_rate, recoveryRecord.resting_heart_rate),
    strain: firstNumber(cycleRecord.score?.strain, cycleRecord.strain, workoutRecord.score?.strain, workoutRecord.strain),
    capturedAt: capturedAt(undefined),
  };
}

function extractDailyStrain(cycleRecords: any[]) {
  const byDate = new Map<string, number>();
  for (const record of cycleRecords) {
    const date = dateOnly(record.start || record.created_at);
    const strain = firstNumber(record.score?.strain, record.strain);
    if (!date || strain === null) continue;
    const existing = byDate.get(date);
    if (existing === undefined || strain > existing) byDate.set(date, strain);
  }
  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, strain]) => ({ date, strain }));
}

function extractDailyRecovery(recoveryRecords: any[]) {
  const byDate = new Map<string, number>();
  for (const record of recoveryRecords) {
    const date = dateOnly(record.date || record.created_at || record.updated_at);
    const recoveryScore = firstNumber(record.score?.recovery_score, record.recovery_score);
    if (!date || recoveryScore === null) continue;
    if (!byDate.has(date)) byDate.set(date, recoveryScore);
  }
  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, recoveryScore]) => ({ date, recoveryScore }));
}

export async function fetchWhoopSnapshot(token: string, { historyDays = 10 } = {}) {
  const days = Math.max(7, Math.min(120, Math.round(finiteNumber(historyDays) ?? 10)));
  const [recovery, cycle, sleep, workout] = await Promise.all([
    fetchCollection('/recovery', token, days),
    fetchCollection('/cycle', token, days),
    fetchCollection('/activity/sleep', token, 7),
    fetchCollection('/activity/workout', token, MAX_WORKOUTS),
  ]);
  return {
    recovery, cycle, sleep, workout,
    normalized: normalizeWhoopPayload({ recovery, cycle, sleep, workout }),
    dailyStrain: extractDailyStrain(recordsOf(cycle)),
    dailyRecovery: extractDailyRecovery(recordsOf(recovery)),
    syncedAt: new Date().toISOString(),
  };
}

export function isWhoopUnauthorized(error: any) {
  return error?.status === 401;
}

export function whoopErrorResponse(error: any, fallback = 'whoop_failed') {
  if (error?.code === 'configuration_error') return { status: 500, body: { error: 'configuration_error' } };
  if (error?.status === 401 || (error?.kind === 'oauth' && error?.status >= 400 && error?.status < 500)) {
    return { status: 401, body: { error: 'reauthorization_required' } };
  }
  if (error?.status === 429) return { status: 429, body: { error: 'rate_limited' } };
  return { status: 502, body: { error: fallback } };
}
