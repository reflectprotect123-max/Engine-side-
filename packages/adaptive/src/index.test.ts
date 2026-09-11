import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  closeCond,
  closeLift,
  decideNextCond,
  decideNextLift,
  estimateOneRm,
  openCond,
  openLift,
  parseRepRange,
  roundToPlate,
} from './index';

describe('public API', () => {
  it('exports lift and cond as separate functions', () => {
    expect(typeof parseRepRange).toBe('function');
    expect(typeof estimateOneRm).toBe('function');
    expect(typeof roundToPlate).toBe('function');
    expect(typeof openLift).toBe('function');
    expect(typeof decideNextLift).toBe('function');
    expect(typeof closeLift).toBe('function');
    expect(typeof openCond).toBe('function');
    expect(typeof decideNextCond).toBe('function');
    expect(typeof closeCond).toBe('function');
  });

  it('lift source never mentions RPE or watts', () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const lift = readFileSync(join(dir, 'decide-next-lift.ts'), 'utf8');
    expect(lift).not.toMatch(/actualRpe|watts|splitSec/);
  });

  it('cond source never mentions RIR or loadKg', () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const cond = readFileSync(join(dir, 'decide-next-cond.ts'), 'utf8');
    expect(cond).not.toMatch(/\brir\b|loadKg/);
  });
});
