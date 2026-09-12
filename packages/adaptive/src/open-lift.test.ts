import { describe, expect, it } from 'vitest';
import { openLift } from './open-lift';

describe('openLift', () => {
  it('first-ever blank range: reps 8, kg blank', () => {
    expect(
      openLift({
        dayKind: 'strength',
        rangeText: null,
        lastClose: null,
      }),
    ).toEqual({ ok: true, loadKg: null, reps: 8 });
  });

  it('Open writes last Close even if a leftover typed kg exists (HTML overwrites the box)', () => {
    expect(
      openLift({
        dayKind: 'strength',
        rangeText: '8-12',
        lastClose: { loadKg: 80, reps: 10, e1rmKg: 100 },
      }),
    ).toEqual({ ok: true, loadKg: 80, reps: 10 });
  });

  it('uses last Close when logger boxes are blank', () => {
    expect(
      openLift({
        dayKind: 'strength',
        rangeText: '8-12',
        lastClose: { loadKg: 82.5, reps: 8, e1rmKg: 110 },
      }),
    ).toEqual({ ok: true, loadKg: 82.5, reps: 8 });
  });

  it('refuses a conditioning day', () => {
    expect(openLift({ dayKind: 'conditioning', rangeText: '8-12', lastClose: null })).toEqual({ ok: false, reason: 'wrong_day' });
  });
});
