import { describe, expect, it } from 'vitest';
import { roundToPlate } from './plates';

describe('roundToPlate', () => {
  it('rounds to 2.5 kg', () => {
    expect(roundToPlate(81)).toBe(80);
    expect(roundToPlate(81.25)).toBe(82.5);
  });
});

  it('clamps negatives to 0', () => {
    expect(roundToPlate(-2.5)).toBe(0);
    expect(roundToPlate(-1)).toBe(0);
  });
