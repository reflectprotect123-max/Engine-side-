import { encryptJson, decryptJson } from './crypto.ts';
import { deleteKey, getJson, setJson } from './store.ts';

const PENDING_TTL_MS = 10 * 60 * 1000;
const MAX_OWNERS_PER_PROVIDER_USER = 8;

export function newState(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '').slice(0, length);
}

export async function recordOAuthEvent(provider: string, event: Record<string, unknown>) {
  try {
    await setJson(`oauth:last:${provider}`, { ...event, at: new Date().toISOString() });
  } catch (error) {
    console.error('[oauth-event]', (error as Error)?.message || error);
  }
}

export async function savePending(provider: string, state: string, identity: { owner: string; kind?: string; sid?: string | null }) {
  if (!identity?.owner) throw new Error('Pending OAuth record needs an owner');
  const kind = identity.kind === 'user' || identity.kind === 'native' ? 'native' : 'browser';
  await setJson(`oauth:pending:${provider}:${state}`, {
    owner: identity.owner,
    kind,
    sid: identity.sid ?? null,
    createdAt: Date.now(),
  });
}

export function pendingIsUsable(pending: any, expectedSid: string | undefined, now = Date.now()) {
  const owner = typeof pending?.owner === 'string' && pending.owner ? pending.owner : (typeof pending?.sid === 'string' ? pending.sid : '');
  if (!owner) return null;
  const kind = pending?.kind === 'native' ? 'native' : 'browser';
  const createdAt = Number(pending?.createdAt);
  const age = now - createdAt;
  if (!Number.isFinite(createdAt) || age < 0 || age > PENDING_TTL_MS) return null;
  if (kind === 'browser') {
    if (typeof pending?.sid !== 'string' || !pending.sid) return null;
    if (expectedSid !== undefined && pending.sid !== expectedSid) return null;
  }
  return { owner, kind, sid: pending?.sid ?? null, createdAt };
}

export async function consumePending(provider: string, state: string, expectedSid?: string) {
  if (!state) return null;
  const key = `oauth:pending:${provider}:${state}`;
  const pending = await getJson(key);
  await deleteKey(key);
  return pendingIsUsable(pending, expectedSid);
}

export async function ownersForProvider(provider: string, id: string) {
  const row = await getJson(`provider:${provider}:${id}`);
  if (Array.isArray(row?.owners)) return row.owners.filter((owner: unknown) => typeof owner === 'string' && owner);
  return typeof row?.sid === 'string' && row.sid ? [row.sid] : [];
}

async function indexProvider(provider: string, id: string, owner: string) {
  const owners = (await ownersForProvider(provider, id)).filter((existing: string) => existing !== owner);
  owners.push(owner);
  await setJson(`provider:${provider}:${id}`, { owners: owners.slice(-MAX_OWNERS_PER_PROVIDER_USER), updatedAt: new Date().toISOString() });
}

async function unindexProvider(provider: string, id: string, owner: string) {
  const owners = (await ownersForProvider(provider, id)).filter((existing: string) => existing !== owner);
  if (owners.length) await setJson(`provider:${provider}:${id}`, { owners, updatedAt: new Date().toISOString() });
  else await deleteKey(`provider:${provider}:${id}`);
}

export async function saveToken(provider: string, owner: string, token: unknown, providerUserId?: string | number | null) {
  const key = `token:${provider}:${owner}`;
  const previous = await getJson(key);
  const resolved = providerUserId ?? previous?.providerUserId ?? null;
  if (previous?.providerUserId != null && String(previous.providerUserId) !== String(resolved)) {
    await unindexProvider(provider, previous.providerUserId, owner);
  }
  await setJson(key, { encrypted: await encryptJson(token), providerUserId: resolved, updatedAt: new Date().toISOString() });
  if (resolved != null) await indexProvider(provider, String(resolved), owner);
}

export async function loadToken(provider: string, owner: string) {
  const record = await getJson(`token:${provider}:${owner}`);
  if (!record?.encrypted) return null;
  return await decryptJson(record.encrypted);
}

export async function loadTokenRecord(provider: string, owner: string) {
  const record = await getJson(`token:${provider}:${owner}`);
  if (!record?.encrypted) return null;
  return { token: await decryptJson(record.encrypted), providerUserId: record.providerUserId ?? null };
}

export async function removeToken(provider: string, owner: string, providerUserId?: string | number | null) {
  const record = await getJson(`token:${provider}:${owner}`);
  const resolved = providerUserId ?? record?.providerUserId ?? null;
  await deleteKey(`token:${provider}:${owner}`);
  if (resolved != null) await unindexProvider(provider, String(resolved), owner);
  await deleteKey(`data:${provider}:${owner}`);
}

export async function syncRecord(provider: string, owner: string, data: Record<string, unknown>) {
  const previous = await getJson(`data:${provider}:${owner}`);
  const next = data && typeof data === 'object' ? data : {};
  const merged = previous && typeof previous === 'object' ? { ...previous, ...next } : next;
  await setJson(`data:${provider}:${owner}`, merged);
  return merged;
}

export async function loadData(provider: string, owner: string) {
  return getJson(`data:${provider}:${owner}`);
}
