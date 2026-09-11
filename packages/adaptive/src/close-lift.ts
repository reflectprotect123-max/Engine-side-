import { estimateOneRm } from './estimate-one-rm';

export type CloseLiftInput = {
  lastLogged: { loadKg: number; reps: number; rir?: number | null };
};

export type CloseLiftResult = { ok: true; loadKg: number; reps: number; e1rmKg: number };

export function closeLift(input: CloseLiftInput): CloseLiftResult {
  const { loadKg, reps, rir } = input.lastLogged;
  return {
    ok: true,
    loadKg,
    reps,
    e1rmKg: estimateOneRm({ loadKg, reps, rir }),
  };
}
