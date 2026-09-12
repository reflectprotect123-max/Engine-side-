import { describe, expect, it } from 'vitest';
import { closeCond } from './close-cond';

describe('closeCond', () => {
  it('stores last made watts with no bump', () => {
    expect(closeCond({ lastMade: { watts: 220 } })).toEqual({ ok: true, watts: 220 });
  });

  it('stores last made split with no bump', () => {
    expect(closeCond({ lastMade: { splitSec: 120 } })).toEqual({ ok: true, splitSec: 120 });
  });

  it('stores last made rpm with no bump', () => {
    expect(closeCond({ lastMade: { rpm: 82 } })).toEqual({ ok: true, rpm: 82 });
  });

  it('rpm Close does not fall back to watts', () => {
    expect(closeCond({ lastMade: { rpm: 82, watts: 220 } })).toEqual({ ok: true, rpm: 82 });
  });

  it('does not return restSec, rounds, or dayKind', () => {
    const closed = closeCond({ lastMade: { watts: 202 } });
    expect(closed).not.toHaveProperty('restSec');
    expect(closed).not.toHaveProperty('rounds');
    expect(closed).not.toHaveProperty('dayKind');
  });
});
