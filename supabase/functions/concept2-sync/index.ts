import { ownerFromRequest } from '../_shared/auth.ts';
import { json, methodGuard, preflight } from '../_shared/http.ts';
import { loadData, loadToken, loadTokenRecord, saveToken, syncRecord } from '../_shared/oauth.ts';
import {
  concept2ErrorResponse,
  getConcept2Strokes,
  isConcept2Unauthorized,
  listConcept2Results,
  mergeConcept2Token,
  normalizeConcept2Result,
  refreshConcept2Token,
  tokenNeedsRefresh,
} from '../_shared/concept2.ts';

const BACKFILL_WINDOW_DAYS = 90;
const UPDATED_AFTER_OVERLAP_MS = 60 * 1000;
const RESULTS_PER_PAGE = 100;
const MAX_RESULT_PAGES = 3;
const STROKES_FETCH_LIMIT = 25;
const MAX_STORED_RESULTS = 500;

async function tokenSavedByAnotherSync(owner: string, currentToken: any) {
  try {
    const latest = await loadToken('concept2', owner) as any;
    return latest?.access_token && latest.access_token !== currentToken?.access_token ? latest : null;
  } catch {
    return null;
  }
}

async function refreshWithoutDiscardingRotation(owner: string, currentToken: any) {
  const alreadyRefreshed = await tokenSavedByAnotherSync(owner, currentToken);
  if (alreadyRefreshed && !tokenNeedsRefresh(alreadyRefreshed)) return alreadyRefreshed;
  try {
    const refreshed = await refreshConcept2Token(currentToken.refresh_token);
    const nextToken = mergeConcept2Token(currentToken, refreshed);
    await saveToken('concept2', owner, nextToken);
    return nextToken;
  } catch (error) {
    const savedByAnotherSync = await tokenSavedByAnotherSync(owner, currentToken);
    if (savedByAnotherSync) return savedByAnotherSync;
    throw error;
  }
}

function gmtStamp(ms: number) {
  return new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
}

function dateOnly(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

function startedAtMs(value: unknown) {
  const parsed = Date.parse(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

async function listResultsWindow(token: any, params: Record<string, unknown>) {
  const results: any[] = [];
  for (let page = 1; page <= MAX_RESULT_PAGES; page += 1) {
    const payload = await listConcept2Results(token, { ...params, number: RESULTS_PER_PAGE, page });
    const data = Array.isArray(payload?.data) ? payload.data : [];
    results.push(...data);
    if (data.length < RESULTS_PER_PAGE) break;
    const totalPages = Number(payload?.meta?.pagination?.total_pages);
    if (Number.isFinite(totalPages) && page >= totalPages) break;
  }
  return results;
}

async function buildSnapshot(token: any, params: Record<string, unknown>, prior: any) {
  const raw = await listResultsWindow(token, params);
  raw.sort((a, b) => startedAtMs(b?.date_utc ?? b?.date) - startedAtMs(a?.date_utc ?? a?.date));
  const priorNormalized = Array.isArray(prior?.normalized) ? prior.normalized : [];
  const priorById = new Map(priorNormalized.filter((entry: any) => entry?.externalId).map((entry: any) => [entry.externalId, entry]));
  const syncedAt = new Date().toISOString();
  const fresh = await Promise.all(raw.map(async (result, index) => {
    const fetchStrokes = index < STROKES_FETCH_LIMIT && result?.id != null;
    const strokes = fetchStrokes ? await getConcept2Strokes(String(result.id), token) : null;
    const normalized = normalizeConcept2Result(result, { strokes, syncedAt }) as any;
    if (!fetchStrokes) {
      const previous = priorById.get(normalized.externalId);
      if (typeof previous?.strokeDataAvailable === 'boolean') normalized.strokeDataAvailable = previous.strokeDataAvailable;
    }
    normalized.strokes = null;
    return normalized;
  }));
  const freshIds = new Set(fresh.map((entry) => entry.externalId));
  const carried = priorNormalized.filter((entry: any) => entry?.externalId && !freshIds.has(entry.externalId));
  const normalized = [...fresh, ...carried]
    .sort((a, b) => startedAtMs(b?.startedAt) - startedAtMs(a?.startedAt))
    .slice(0, MAX_STORED_RESULTS);
  const providerUserId = fresh.find((entry) => entry.providerUserId != null)?.providerUserId ?? prior?.providerUserId ?? null;
  return { provider: 'concept2', normalized, providerUserId, syncedAt };
}

async function fetchSnapshotForOwner(owner: string, initialToken: any, params: Record<string, unknown>, prior: any) {
  let token = initialToken;
  if (tokenNeedsRefresh(token) && token.refresh_token) token = await refreshWithoutDiscardingRotation(owner, token);
  try {
    return { token, snapshot: await buildSnapshot(token, params, prior) };
  } catch (error) {
    if (!isConcept2Unauthorized(error) || !token.refresh_token) throw error;
    token = await refreshWithoutDiscardingRotation(owner, token);
    return { token, snapshot: await buildSnapshot(token, params, prior) };
  }
}

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  const denied = methodGuard(req, ['GET']);
  if (denied) return denied;
  let owner: string;
  try {
    ({ owner } = await ownerFromRequest(req));
  } catch {
    return json({ error: 'unauthorized' }, 401);
  }
  try {
    const record = await loadTokenRecord('concept2', owner);
    const token = record?.token || null;
    if (!token) return json({ connected: false }, 401);
    const prior = await loadData('concept2', owner);
    const lastSyncedMs = Date.parse(prior?.syncedAt ?? '');
    const backfill = new URL(req.url).searchParams.get('backfill') === '1' || !Number.isFinite(lastSyncedMs);
    const params = backfill
      ? { from: dateOnly(Date.now() - BACKFILL_WINDOW_DAYS * 24 * 60 * 60 * 1000) }
      : { updated_after: gmtStamp(lastSyncedMs - UPDATED_AFTER_OVERLAP_MS) };
    const { token: finalToken, snapshot } = await fetchSnapshotForOwner(owner, token, params, prior);
    if ((record.providerUserId == null) && snapshot.providerUserId != null) {
      const freshest = (await loadTokenRecord('concept2', owner))?.token || finalToken;
      await saveToken('concept2', owner, freshest, snapshot.providerUserId);
    }
    await syncRecord('concept2', owner, snapshot);
    return json({ connected: true, provider: 'concept2', normalized: snapshot.normalized, syncedAt: snapshot.syncedAt });
  } catch (error) {
    const response = concept2ErrorResponse(error, 'sync_failed');
    return json(response.body, response.status);
  }
});
