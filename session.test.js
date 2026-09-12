import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const dir = dirname(fileURLToPath(import.meta.url));
require(join(dir, 'adaptive-bundle.js'));
require(join(dir, 'engine.js'));
require(join(dir, 'session.js'));
const HybridSession = globalThis.HybridSession;

test('engine piece is a cond logger page, not a strength set grid', () => {
  const plan = {
    title: 'Row 15/45',
    blocks: [
      {
        kind: 'engine',
        letter: 'A',
        title: 'Row',
        machine: 'row',
        structure: 'intervals',
        effort: 'hard',
        workSec: 15,
        restSec: 45,
        rounds: 8,
        typedSplitSec: 136,
        prescription: '8 × 15s / 45s · Hard · 2:16/500m',
        section: 'The Engine',
      },
    ],
  };
  const s = HybridSession.startSession({ date: '2026-09-11', plan, letter: 'A' });
  const page = s.pages[s.blockIndex];
  assert.equal(page.logMode, 'engine');
  assert.equal(page.machine, 'row');
  assert.equal(page.setCount, 0);
  assert.equal(s.logs.A.engine.phase, 'ready');
  assert.equal(s.logs.A.engine.target.splitSec, 136);
  assert.equal(s.logs.A.sets.length, 0);
});

test('startSession never opens a kg TRACK page from a leftover lift block', () => {
  const plan = {
    title: 'Mixed',
    blocks: [
      {
        kind: 'lift',
        letter: 'A',
        title: 'Bench Press',
        prescription: '3 x 8',
        columns: ['reps', 'weight_kg'],
        setCount: 3,
        section: 'Strength/Power',
      },
      {
        kind: 'engine',
        letter: 'B',
        title: 'Bike',
        machine: 'bike',
        structure: 'intervals',
        effort: 'medium',
        workSec: 15,
        restSec: 45,
        rounds: 4,
        typedWatts: 180,
        prescription: '4 × 15s / 45s · Medium · 180 W',
        section: 'The Engine',
      },
    ],
  };
  const s = HybridSession.startSession({ date: '2026-09-12', plan, letter: 'B' });
  assert.equal(s.pages.some((p) => p.logMode === 'kg' || p.kind === 'lift'), false);
  const work = s.pages.filter((p) => p.logMode !== 'doneHub');
  assert.equal(work.length, 1);
  assert.equal(work[0].logMode, 'engine');
  assert.equal(work[0].machine, 'bike');
});
