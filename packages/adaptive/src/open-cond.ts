import type { OpenCondInput, OpenCondResult } from './types';

function pick(typed: number | null | undefined, closed: number | null | undefined): number | null {
  if (typed != null && Number.isFinite(typed)) return typed;
  if (closed != null && Number.isFinite(closed)) return closed;
  return null;
}

export function openCond(input: OpenCondInput): OpenCondResult {
  if (input.dayKind !== 'conditioning') return { ok: false, reason: 'wrong_day' };
  if (input.modality === 'split') {
    return {
      ok: true,
      splitSec: pick(input.typedSplitSec, input.lastClose?.splitSec),
    };
  }
  if (input.modality === 'rpm') {
    return {
      ok: true,
      rpm: pick(input.typedRpm, input.lastClose?.rpm),
    };
  }
  return {
    ok: true,
    watts: pick(input.typedWatts, input.lastClose?.watts),
  };
}
