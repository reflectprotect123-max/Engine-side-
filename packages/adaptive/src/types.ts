export type RepRange = { min: number; max: number };

export type DayKind = 'strength' | 'conditioning' | 'recovery';

export type LiftLogged = { loadKg: number; reps: number; rir?: number | null };

export type LiftNextInput = {
  dayKind: DayKind;
  range: RepRange;
  logged: LiftLogged;
};

export type LiftNextResult =
  | { ok: true; loadKg: number; reps: number }
  | { ok: false; reason: 'reps_out_of_sanity' | 'wrong_day' };

export type CloseLiftAnchor = { loadKg: number; reps: number; e1rmKg: number };

export type OpenLiftInput = {
  dayKind: DayKind;
  rangeText: string | null;
  lastClose: CloseLiftAnchor | null;
};

export type OpenLiftResult =
  | { ok: true; loadKg: number | null; reps: number }
  | { ok: false; reason: 'wrong_day' };

export type CondNextInput = {
  dayKind: DayKind;
  modality: 'watts' | 'split' | 'rpm';
  targetRpe: RepRange;
  actualRpe: number;
  stopped?: boolean;
  cooked?: boolean;
  currentWatts?: number;
  currentSplitSec?: number;
  currentRpm?: number;
  actualWatts?: number;
  actualSplitSec?: number;
  actualRpm?: number;
};

export type CondNextResult =
  | { ok: true; watts: number }
  | { ok: true; splitSec: number }
  | { ok: true; rpm: number }
  | { ok: true; skipped: true }
  | { ok: false; reason: 'wrong_day' };

export type CloseCondAnchor = { watts?: number | null; splitSec?: number | null; rpm?: number | null };

export type OpenCondInput = {
  dayKind: DayKind;
  modality: 'watts' | 'split' | 'rpm';
  lastClose: CloseCondAnchor | null;
  typedWatts?: number | null;
  typedSplitSec?: number | null;
  typedRpm?: number | null;
};

export type OpenCondResult =
  | { ok: true; watts: number | null }
  | { ok: true; splitSec: number | null }
  | { ok: true; rpm: number | null }
  | { ok: false; reason: 'wrong_day' };

export type CloseCondInput = {
  lastMade: { watts?: number; splitSec?: number; rpm?: number };
};

export type CloseCondResult =
  | { ok: true; watts: number }
  | { ok: true; splitSec: number }
  | { ok: true; rpm: number };
