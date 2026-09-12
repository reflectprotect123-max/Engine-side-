import { ownerFromRequest } from '../_shared/auth.ts';
import { json, methodGuard, preflight } from '../_shared/http.ts';
import { loadData, loadToken } from '../_shared/oauth.ts';

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
  const [whoopToken, whoop] = await Promise.all([
    loadToken('whoop', owner),
    loadData('whoop', owner),
  ]);
  const normalized = whoop?.normalized && typeof whoop.normalized === 'object'
    ? {
      source: 'whoop',
      date: String(whoop.normalized.date || '').slice(0, 10),
      recoveryScore: Number.isFinite(Number(whoop.normalized.recoveryScore)) ? Number(whoop.normalized.recoveryScore) : null,
      sleepPerformance: Number.isFinite(Number(whoop.normalized.sleepPerformance)) ? Number(whoop.normalized.sleepPerformance) : null,
      hrvMs: Number.isFinite(Number(whoop.normalized.hrvMs)) ? Number(whoop.normalized.hrvMs) : null,
      restingHr: Number.isFinite(Number(whoop.normalized.restingHr)) ? Number(whoop.normalized.restingHr) : null,
      strain: Number.isFinite(Number(whoop.normalized.strain)) ? Number(whoop.normalized.strain) : null,
      capturedAt: whoop.normalized.capturedAt || null,
    }
    : null;
  return json({
    whoop: { connected: Boolean(whoopToken), lastSyncAt: whoop?.syncedAt || null, sampleDate: normalized?.date || null, normalized },
    concept2: { connected: false, lastSyncAt: null, resultCount: 0, latest: null },
  });
});
