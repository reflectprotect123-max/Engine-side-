import { roundToPlate } from './plates';
import type { LiftNextInput, LiftNextResult, RepRange } from './types';

function rirValue(rir: number | null | undefined): number {
  if (rir == null || Number.isNaN(Number(rir))) return 0;
  return Number(rir);
}

function mediumBump(range: RepRange): number {
  if (range.min >= range.max) return range.min;
  const extra = range.max - range.min >= 4 ? 2 : 1;
  return Math.min(range.max, range.min + extra);
}

export function decideNextLift(input: LiftNextInput): LiftNextResult {
  if (input.dayKind !== 'strength') return { ok: false, reason: 'wrong_day' };
  const reps = input.logged.reps;
  if (reps < 1 || reps >= 80) return { ok: false, reason: 'reps_out_of_sanity' };
  const rir = rirValue(input.logged.rir);
  const kg = input.logged.loadKg;
  const { min, max } = input.range;
  const single = min === max;
  const nextRepsSingle = min;

  if (reps < min) {
    return { ok: true, loadKg: roundToPlate(Math.max(0, kg - 2.5)), reps: single ? nextRepsSingle : min };
  }

  if (reps >= max) {
    if (rir >= 3) {
      return { ok: true, loadKg: roundToPlate(kg + 2.5), reps: single ? nextRepsSingle : min };
    }
    if (rir === 2) {
      return {
        ok: true,
        loadKg: roundToPlate(kg + 2.5),
        reps: single ? nextRepsSingle : mediumBump(input.range),
      };
    }
    return { ok: true, loadKg: kg, reps: single ? nextRepsSingle : max };
  }

  if (rir >= 2) {
    return { ok: true, loadKg: kg, reps };
  }
  return { ok: true, loadKg: kg, reps: min };
}
