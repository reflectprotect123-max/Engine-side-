import { describe, expect, it } from 'vitest';
import { estimateOneRm } from './estimate-one-rm';

describe('estimateOneRm', () => {
  it('matches HTML e1rmValue for 40x6 at RIR 2', () => {
    expect(estimateOneRm({ loadKg: 40, reps: 6, rir: 2 })).toBe(50.7);
  });

  it('blank RIR is 0 extra and is lower than RIR 2', () => {
    const blank = estimateOneRm({ loadKg: 40, reps: 6, rir: null });
    const hard = estimateOneRm({ loadKg: 40, reps: 6, rir: 0 });
    const easy = estimateOneRm({ loadKg: 40, reps: 6, rir: 2 });
    expect(blank).toBe(hard);
    expect(hard).toBeLessThan(easy);
  });
});
