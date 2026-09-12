import type { RepRange } from './types';

export function parseRepRange(input: string | null | undefined): RepRange {
  const raw = (input ?? '').trim();
  if (!raw) return { min: 8, max: 12 };
  const m = raw.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }
  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) return { min: n, max: n };
  return { min: 8, max: 12 };
}
