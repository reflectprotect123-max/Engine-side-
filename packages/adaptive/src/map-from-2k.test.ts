import { describe, expect, it } from 'vitest';
import {
  mapBandFrom2k,
  softenOpen,
  splitSecFrom2k,
  wattsFromSplitSec,
  CONCEPT2_WATTS_FACTOR,
} from './map-from-2k';

describe('splitSecFrom2k', () => {
  it('7:20 2k → race split 110s', () => {
    expect(splitSecFrom2k(7 * 60 + 20)).toBe(110);
  });
});

describe('wattsFromSplitSec', () => {
  it('locks Concept2 constant (2:00/500 → 203W)', () => {
    expect(CONCEPT2_WATTS_FACTOR).toBe(2.8);
    expect(wattsFromSplitSec(120)).toBe(203);
  });
});

describe('mapBandFrom2k', () => {
  it('threshold from 7:20 maps near race+8.5s', () => {
    const m = mapBandFrom2k(7 * 60 + 20, 'threshold');
    expect(m.splitSec).toBe(119); // 110 + 8.5 → round 119
    expect(m.watts).toBe(wattsFromSplitSec(119));
  });

  it('intervals is closest to race pace', () => {
    const m = mapBandFrom2k(7 * 60 + 20, 'intervals');
    expect(m.splitSec).toBe(113); // 110 + 2.5 → round 113
  });

  it('easy uses race split with ~60% watts', () => {
    const raceSplit = splitSecFrom2k(7 * 60 + 20);
    const m = mapBandFrom2k(7 * 60 + 20, 'easy');
    expect(m.splitSec).toBe(raceSplit);
    expect(m.watts).toBe(Math.round(wattsFromSplitSec(raceSplit) * 0.6));
  });
});

describe('softenOpen', () => {
  it('null or zero recovery leaves value unchanged', () => {
    expect(softenOpen(110, 'split', null)).toBe(110);
    expect(softenOpen(200, 'watts', 0)).toBe(200);
    expect(softenOpen(90, 'rpm', null)).toBe(90);
  });

  it('high recovery is identity', () => {
    expect(softenOpen(110, 'split', 67)).toBe(110);
    expect(softenOpen(200, 'watts', 100)).toBe(200);
  });

  it('softenOpen mid recovery slows split', () => {
    expect(softenOpen(110, 'split', 50)).toBeGreaterThan(110);
  });

  it('softenOpen mid recovery lowers watts', () => {
    expect(softenOpen(200, 'watts', 50)).toBeLessThan(200);
  });

  it('softenOpen mid recovery lowers rpm', () => {
    expect(softenOpen(90, 'rpm', 50)).toBeLessThan(90);
  });

  it('low recovery softens more than mid', () => {
    const midSplit = softenOpen(110, 'split', 50);
    const lowSplit = softenOpen(110, 'split', 20);
    expect(lowSplit).toBeGreaterThan(midSplit);

    const midWatts = softenOpen(200, 'watts', 50);
    const lowWatts = softenOpen(200, 'watts', 20);
    expect(lowWatts).toBeLessThan(midWatts);
  });
});
