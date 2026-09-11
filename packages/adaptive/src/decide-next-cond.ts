import type { CondNextInput, CondNextResult, RepRange } from './types';

function condBand(
  actual: number,
  target: RepRange,
  stopped?: boolean,
  cooked?: boolean,
): 'hold' | 'up' | 'down' | 'cut' {
  if (stopped || actual >= 10) return 'cut';
  if (cooked) return 'down';
  if (actual < target.min) return 'up';
  if (actual > target.max) return 'down';
  return 'hold';
}

function baseline(actual: number | undefined, current: number | undefined): number | undefined {
  if (actual != null && Number.isFinite(actual)) return actual;
  if (current != null && Number.isFinite(current)) return current;
  return undefined;
}

function nextWatts(w: number, band: 'hold' | 'up' | 'down' | 'cut'): CondNextResult {
  if (band === 'hold') return { ok: true, watts: w };
  if (band === 'up') return { ok: true, watts: Math.round(w * 1.03) };
  if (band === 'down') return { ok: true, watts: Math.round(w * 0.95) };
  return { ok: true, watts: Math.round(w * 0.92) };
}

function nextSplit(s: number, band: 'hold' | 'up' | 'down' | 'cut'): CondNextResult {
  if (band === 'hold') return { ok: true, splitSec: s };
  if (band === 'up') return { ok: true, splitSec: s - 1 };
  if (band === 'down') return { ok: true, splitSec: s + 1 };
  return { ok: true, splitSec: s + 3 };
}

function nextRpm(r: number, band: 'hold' | 'up' | 'down' | 'cut'): CondNextResult {
  if (band === 'hold') return { ok: true, rpm: r };
  if (band === 'up') return { ok: true, rpm: Math.round(r * 1.03) };
  if (band === 'down') return { ok: true, rpm: Math.round(r * 0.95) };
  return { ok: true, rpm: Math.round(r * 0.92) };
}

export function decideNextCond(input: CondNextInput): CondNextResult {
  if (input.dayKind !== 'conditioning') return { ok: false, reason: 'wrong_day' };

  const band = condBand(input.actualRpe, input.targetRpe, input.stopped, input.cooked);

  // Split modalities never fall back to watts — locked architecture.
  if (input.modality === 'split') {
    const split = baseline(input.actualSplitSec, input.currentSplitSec);
    if (split == null) return { ok: true, skipped: true };
    return nextSplit(split, band);
  }

  if (input.modality === 'rpm') {
    const rpm = baseline(input.actualRpm, input.currentRpm);
    if (rpm == null) return { ok: true, skipped: true };
    return nextRpm(rpm, band);
  }

  const watts = baseline(input.actualWatts, input.currentWatts);
  if (watts == null) return { ok: true, skipped: true };
  return nextWatts(watts, band);
}
