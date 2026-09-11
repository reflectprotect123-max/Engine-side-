import { describe, expect, it } from 'vitest';
import { parseRepRange } from './range';

describe('parseRepRange', () => {
  it('blank becomes 8-12', () => {
    expect(parseRepRange(null)).toEqual({ min: 8, max: 12 });
    expect(parseRepRange(undefined)).toEqual({ min: 8, max: 12 });
    expect(parseRepRange('')).toEqual({ min: 8, max: 12 });
    expect(parseRepRange('   ')).toEqual({ min: 8, max: 12 });
  });

  it('plain number is min=max (single number, no push-reps band)', () => {
    expect(parseRepRange('5')).toEqual({ min: 5, max: 5 });
    expect(parseRepRange('1')).toEqual({ min: 1, max: 1 });
    expect(parseRepRange('8')).toEqual({ min: 8, max: 8 });
  });

  it('min-max uses both ends', () => {
    expect(parseRepRange('5-7')).toEqual({ min: 5, max: 7 });
    expect(parseRepRange('20-30')).toEqual({ min: 20, max: 30 });
  });
});
