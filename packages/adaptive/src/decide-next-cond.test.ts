import { decideNextCond } from './decide-next-cond';
import { describe, expect, it } from 'vitest';

describe('decideNextCond', () => {
  const base = {
    dayKind: 'conditioning' as const,
    modality: 'watts' as const,
    targetRpe: { min: 7, max: 8 },
    currentWatts: 220,
  };

  it('at target (talk-test 7-8) holds watts', () => {
    expect(decideNextCond({ ...base, actualRpe: 7 })).toEqual({ ok: true, watts: 220 });
  });

  it('too easy (5 vs 7-8) adds 3%', () => {
    expect(decideNextCond({ ...base, actualRpe: 5 })).toEqual({ ok: true, watts: 227 });
  });

  it('too hard (9) subtracts 5%', () => {
    expect(decideNextCond({ ...base, actualRpe: 9 })).toEqual({ ok: true, watts: 209 });
  });

  it('10 or stopped subtracts 8%', () => {
    expect(decideNextCond({ ...base, actualRpe: 10 })).toEqual({ ok: true, watts: 202 });
    expect(decideNextCond({ ...base, actualRpe: 8, stopped: true })).toEqual({
      ok: true,
      watts: 202,
    });
  });

  it('still cooked at next hard cuts work, does not return restSec', () => {
    const next = decideNextCond({ ...base, actualRpe: 8, cooked: true });
    expect(next).toEqual({ ok: true, watts: 209 });
    expect(next).not.toHaveProperty('restSec');
    expect(next).not.toHaveProperty('rounds');
  });

  it('split moves by 1s easy/hard and 3s on 10', () => {
    const split = {
      dayKind: 'conditioning' as const,
      modality: 'split' as const,
      targetRpe: { min: 7, max: 8 },
      currentSplitSec: 120,
    };
    expect(decideNextCond({ ...split, actualRpe: 5 })).toEqual({ ok: true, splitSec: 119 });
    expect(decideNextCond({ ...split, actualRpe: 9 })).toEqual({ ok: true, splitSec: 121 });
    expect(decideNextCond({ ...split, actualRpe: 10 })).toEqual({ ok: true, splitSec: 123 });
  });

  it('refuses cond on a strength day', () => {
    expect(decideNextCond({ ...base, dayKind: 'strength', actualRpe: 7 })).toEqual({
      ok: false,
      reason: 'wrong_day',
    });
  });

  it('both currentWatts and currentSplitSec missing → skipped (walk/run, do not invent)', () => {
    const next = decideNextCond({
      dayKind: 'conditioning',
      modality: 'watts',
      targetRpe: { min: 3, max: 4 },
      actualRpe: 3,
    });
    expect(next).toEqual({ ok: true, skipped: true });
    expect(next).not.toHaveProperty('restSec');
    expect(next).not.toHaveProperty('rounds');
    expect(next).not.toHaveProperty('dayKind');
    expect(next).not.toHaveProperty('watts');
    expect(next).not.toHaveProperty('splitSec');
  });
});

describe('decideNextCond — split seal', () => {
  it('split modality never falls back to watts', () => {
    expect(
      decideNextCond({
        dayKind: 'conditioning',
        modality: 'split',
        targetRpe: { min: 7, max: 8 },
        actualRpe: 5,
        currentWatts: 220,
        currentSplitSec: undefined,
      }),
    ).toEqual({ ok: true, skipped: true });
  });
});

describe('decideNextCond — actual baseline', () => {
  it('split Next baselines on actualSplitSec when provided (not plan current)', () => {
    expect(
      decideNextCond({
        dayKind: 'conditioning',
        modality: 'split',
        targetRpe: { min: 7, max: 8 },
        actualRpe: 7, // hold
        currentSplitSec: 120, // plan 2:00
        actualSplitSec: 125, // logged 2:05
      }),
    ).toEqual({ ok: true, splitSec: 125 });
  });

  it('split too hard nudges from actual, not plan', () => {
    expect(
      decideNextCond({
        dayKind: 'conditioning',
        modality: 'split',
        targetRpe: { min: 7, max: 8 },
        actualRpe: 9,
        currentSplitSec: 120,
        actualSplitSec: 125,
      }),
    ).toEqual({ ok: true, splitSec: 126 }); // +1s from actual
  });

  it('watts too easy nudges from actualWatts', () => {
    expect(
      decideNextCond({
        dayKind: 'conditioning',
        modality: 'watts',
        targetRpe: { min: 7, max: 8 },
        actualRpe: 5,
        currentWatts: 220,
        actualWatts: 200,
      }),
    ).toEqual({ ok: true, watts: 206 }); // round(200 * 1.03)
  });

  it('rpm modality nudges from actualRpm (mirror watts %)', () => {
    expect(
      decideNextCond({
        dayKind: 'conditioning',
        modality: 'rpm',
        targetRpe: { min: 7, max: 8 },
        actualRpe: 5,
        currentRpm: 60,
        actualRpm: 58,
      }),
    ).toEqual({ ok: true, rpm: 60 }); // round(58 * 1.03) = 60
  });

  it('rpm never falls back to watts', () => {
    expect(
      decideNextCond({
        dayKind: 'conditioning',
        modality: 'rpm',
        targetRpe: { min: 7, max: 8 },
        actualRpe: 7,
        currentWatts: 220,
      }),
    ).toEqual({ ok: true, skipped: true });
  });
});
