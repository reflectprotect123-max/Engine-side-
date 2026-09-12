/** Band split offsets vs race /500m (seconds). */
export const BAND_SPLIT_OFFSET_STEADY = 22.5;
export const BAND_SPLIT_OFFSET_TEMPO = 13.5;
export const BAND_SPLIT_OFFSET_THRESHOLD = 8.5;
export const BAND_SPLIT_OFFSET_INTERVALS = 2.5;

/** Easy band watts as fraction of 2k race watts (bike anchor handled in HTML). */
export const BAND_WATTS_RATIO_EASY = 0.6;

/** Concept2 rower/ski erg display formula: watts = factor / (splitSec/500)^3 */
export const CONCEPT2_WATTS_FACTOR = 2.8;

export type CondBand = 'easy' | 'steady' | 'tempo' | 'threshold' | 'intervals';

const SPLIT_OFFSET: Record<Exclude<CondBand, 'easy'>, number> = {
  steady: BAND_SPLIT_OFFSET_STEADY,
  tempo: BAND_SPLIT_OFFSET_TEMPO,
  threshold: BAND_SPLIT_OFFSET_THRESHOLD,
  intervals: BAND_SPLIT_OFFSET_INTERVALS,
};

/** Total 2k seconds → race pace seconds per 500m. */
export function splitSecFrom2k(totalSec: number): number {
  return totalSec / 4;
}

/** Concept2-style watts for rower/ski display; splitSec is seconds per 500m. */
export function wattsFromSplitSec(splitSec: number): number {
  const pace = splitSec / 500;
  return Math.round(CONCEPT2_WATTS_FACTOR / (pace * pace * pace));
}

export function mapBandFrom2k(totalSec: number, band: CondBand): { splitSec: number; watts: number } {
  const raceSplit = splitSecFrom2k(totalSec);
  const raceWatts = wattsFromSplitSec(raceSplit);

  if (band === 'easy') {
    return {
      splitSec: Math.round(raceSplit),
      watts: Math.round(raceWatts * BAND_WATTS_RATIO_EASY),
    };
  }

  const splitSec = Math.round(raceSplit + SPLIT_OFFSET[band]);
  return {
    splitSec,
    watts: wattsFromSplitSec(splitSec),
  };
}

/** Soften today's Open only. recovery null/0 → no change. */
export function softenOpen(
  value: number,
  modality: 'split' | 'watts' | 'rpm',
  recovery: number | null,
): number {
  if (recovery == null || recovery === 0) return Math.round(value);
  if (recovery >= 67) return Math.round(value);

  const mid = recovery >= 34;
  if (modality === 'split') {
    const factor = mid ? 1.02 : 1.04;
    return Math.round(value * factor);
  }

  const factor = mid ? 0.97 : 0.94;
  return Math.round(value * factor);
}
