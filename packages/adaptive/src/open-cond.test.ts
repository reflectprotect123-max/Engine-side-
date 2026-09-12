import { describe, expect, it } from 'vitest';
import { openCond } from './open-cond';

describe('openCond', () => {
  it('typed watts win over last Close', () => {
    expect(
      openCond({
        dayKind: 'conditioning',
        modality: 'watts',
        typedWatts: 200,
        lastClose: { watts: 220 },
      }),
    ).toEqual({ ok: true, watts: 200 });
  });

  it('uses last Close watts when typed is blank', () => {
    expect(
      openCond({
        dayKind: 'conditioning',
        modality: 'watts',
        typedWatts: null,
        lastClose: { watts: 220 },
      }),
    ).toEqual({ ok: true, watts: 220 });
  });

  it('first-ever watts is null (do not invent)', () => {
    expect(
      openCond({
        dayKind: 'conditioning',
        modality: 'watts',
        lastClose: null,
      }),
    ).toEqual({ ok: true, watts: null });
  });

  it('typed split wins; else last Close split; else null', () => {
    expect(
      openCond({
        dayKind: 'conditioning',
        modality: 'split',
        typedSplitSec: 118,
        lastClose: { splitSec: 120 },
      }),
    ).toEqual({ ok: true, splitSec: 118 });
    expect(
      openCond({
        dayKind: 'conditioning',
        modality: 'split',
        lastClose: { splitSec: 120 },
      }),
    ).toEqual({ ok: true, splitSec: 120 });
    expect(
      openCond({
        dayKind: 'conditioning',
        modality: 'split',
        lastClose: null,
      }),
    ).toEqual({ ok: true, splitSec: null });
  });

  it('refuses recovery and strength days', () => {
    expect(
      openCond({ dayKind: 'recovery', modality: 'watts', lastClose: null }),
    ).toEqual({ ok: false, reason: 'wrong_day' });
    expect(
      openCond({ dayKind: 'strength', modality: 'watts', lastClose: null }),
    ).toEqual({ ok: false, reason: 'wrong_day' });
  });

  it('does not return restSec, rounds, or dayKind', () => {
    const opened = openCond({
      dayKind: 'conditioning',
      modality: 'watts',
      lastClose: { watts: 220 },
    });
    expect(opened).not.toHaveProperty('restSec');
    expect(opened).not.toHaveProperty('rounds');
    expect(opened).not.toHaveProperty('dayKind');
  });

  it('typed rpm wins over last Close rpm', () => {
    expect(
      openCond({
        dayKind: 'conditioning',
        modality: 'rpm',
        typedRpm: 75,
        lastClose: { rpm: 80 },
      }),
    ).toEqual({ ok: true, rpm: 75 });
  });

  it('uses last Close rpm when typed is blank', () => {
    expect(
      openCond({
        dayKind: 'conditioning',
        modality: 'rpm',
        typedRpm: null,
        lastClose: { rpm: 80 },
      }),
    ).toEqual({ ok: true, rpm: 80 });
  });

  it('first-ever rpm is null (do not invent; do not fall back to watts)', () => {
    expect(
      openCond({
        dayKind: 'conditioning',
        modality: 'rpm',
        lastClose: { watts: 220 },
      }),
    ).toEqual({ ok: true, rpm: null });
  });
});
