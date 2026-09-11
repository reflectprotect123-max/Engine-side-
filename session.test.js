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
