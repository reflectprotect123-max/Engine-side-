import { parseRepRange } from './range';
import type { OpenLiftInput, OpenLiftResult } from './types';

export function openLift(input: OpenLiftInput): OpenLiftResult {
  if (input.dayKind !== 'strength') return { ok: false, reason: 'wrong_day' };
  const range = parseRepRange(input.rangeText);
  const reps = input.lastClose?.reps ?? range.min;
  const loadKg = input.lastClose?.loadKg ?? null;
  return { ok: true, loadKg, reps };
}
