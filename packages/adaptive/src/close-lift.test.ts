import { describe, expect, it } from 'vitest';
import { closeLift } from './close-lift';
import { estimateOneRm } from './estimate-one-rm';

describe('closeLift', () => {
  it('stores last logged lift set only, with that row Est. 1RM', () => {
    const last = { loadKg: 82.5, reps: 8, rir: 3 };
    expect(closeLift({ lastLogged: last })).toEqual({
      ok: true,
      loadKg: 82.5,
      reps: 8,
      e1rmKg: estimateOneRm(last),
    });
  });

  it('does not add a bonus plate', () => {
    const closed = closeLift({
      lastLogged: { loadKg: 80, reps: 12, rir: 4 },
    });
    expect(closed).toMatchObject({ ok: true, loadKg: 80, reps: 12 });
  });
});
