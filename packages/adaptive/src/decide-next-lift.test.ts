import { describe, expect, it } from 'vitest';
import { decideNextLift } from './decide-next-lift';

const r812 = { min: 8, max: 12 };

function lift(
  reps: number,
  rir: number | null,
  range = r812,
  loadKg = 80,
) {
  return decideNextLift({
    dayKind: 'strength',
    range,
    logged: { loadKg, reps, rir },
  });
}

describe('decideNextLift — hit the top of a range', () => {
  it('easy 12 on 8-12 adds 2.5 and returns to min', () => {
    expect(lift(12, 4)).toEqual({ ok: true, loadKg: 82.5, reps: 8 });
  });

  it('medium 12 on 8-12 adds 2.5 and min+2', () => {
    expect(lift(12, 2)).toEqual({ ok: true, loadKg: 82.5, reps: 10 });
  });

  it('grind 12 on 8-12 keeps kg and tries the top again', () => {
    expect(lift(12, 0)).toEqual({ ok: true, loadKg: 80, reps: 12 });
  });

  it('medium 7 on 5-7 adds 2.5 and min+1', () => {
    expect(lift(7, 2, { min: 5, max: 7 })).toEqual({
      ok: true,
      loadKg: 82.5,
      reps: 6,
    });
  });
});

describe('decideNextLift — single number never pushes reps', () => {
  const five = { min: 5, max: 5 };

  it('easy 5 adds 2.5 and stays at 5', () => {
    expect(lift(5, 4, five)).toEqual({ ok: true, loadKg: 82.5, reps: 5 });
  });

  it('medium 5 adds 2.5 and stays at 5 not 6', () => {
    expect(lift(5, 2, five)).toEqual({ ok: true, loadKg: 82.5, reps: 5 });
  });

  it('logged 6 on painted 5 still Next 5', () => {
    expect(lift(6, 3, five)).toEqual({ ok: true, loadKg: 82.5, reps: 5 });
  });

  it('under 4 on painted 5 drops 2.5 and stays at 5', () => {
    expect(lift(4, 2, five)).toEqual({ ok: true, loadKg: 77.5, reps: 5 });
  });
});

describe('decideNextLift — middle and under on a range', () => {
  it('middle + easy keeps kg and same reps (no jump)', () => {
    expect(lift(10, 3)).toEqual({ ok: true, loadKg: 80, reps: 10 });
  });

  it('middle + grind keeps kg and returns to min', () => {
    expect(lift(10, 0)).toEqual({ ok: true, loadKg: 80, reps: 8 });
  });

  it('under min drops 2.5 and returns to min', () => {
    expect(lift(6, 2)).toEqual({ ok: true, loadKg: 77.5, reps: 8 });
  });

  it('refuses 0 and 80 reps', () => {
    expect(lift(0, 2)).toEqual({ ok: false, reason: 'reps_out_of_sanity' });
    expect(lift(80, 2)).toEqual({ ok: false, reason: 'reps_out_of_sanity' });
  });

  it('does not return setCount or dayKind', () => {
    const next = lift(12, 4);
    expect(next).not.toHaveProperty('setCount');
    expect(next).not.toHaveProperty('dayKind');
  });
});

describe('decideNextLift — load floor', () => {
  it('bodyweight under-min clamps at 0 instead of -2.5', () => {
    expect(lift(6, 2, r812, 0)).toEqual({ ok: true, loadKg: 0, reps: 8 });
  });
});
