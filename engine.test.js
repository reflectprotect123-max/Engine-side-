import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const dir = dirname(fileURLToPath(import.meta.url));

require(join(dir, 'adaptive-bundle.js'));
require(join(dir, 'engine.js'));
const Eng = globalThis.HybridEngine;
const Ad = globalThis.HybridAdaptive;

test('effort chips map to talk-test bands, not a typed 7-8 box', () => {
  assert.deepEqual(Eng.bandFor('easy'), { min: 3, max: 4 });
  assert.deepEqual(Eng.bandFor('medium'), { min: 5, max: 7 });
  assert.deepEqual(Eng.bandFor('hard'), { min: 8, max: 9.5 });
});

test('machine picks modality: bike watts, row split, fan rpm, walk none', () => {
  assert.equal(Eng.modalityFor('bike'), 'watts');
  assert.equal(Eng.modalityFor('echo'), 'watts');
  assert.equal(Eng.modalityFor('row'), 'split');
  assert.equal(Eng.modalityFor('ski'), 'split');
  assert.equal(Eng.modalityFor('fan'), 'rpm');
  assert.equal(Eng.modalityFor('walk'), 'none');
  assert.equal(Eng.modalityFor('run'), 'none');
});

test('open bike uses typed watts; walk invents no pace', () => {
  const bike = Eng.openPiece({
    machine: 'bike',
    effort: 'hard',
    typedWatts: 220,
  }, null, Ad);
  assert.equal(bike.ok, true);
  assert.equal(bike.target.watts, 220);
  assert.equal(bike.modality, 'watts');

  const walk = Eng.openPiece({ machine: 'walk', effort: 'easy' }, null, Ad);
  assert.equal(walk.ok, true);
  assert.equal(walk.skipped, true);
  assert.equal(walk.target.watts, null);
});

test('open writes last Close even if a leftover typed number exists', () => {
  const opened = Eng.openPiece({
    machine: 'bike',
    effort: 'medium',
    typedWatts: 180,
  }, { watts: 210 }, Ad);
  assert.equal(opened.target.watts, 180);
  const fromClose = Eng.openPiece({
    machine: 'bike',
    effort: 'medium',
  }, { watts: 210 }, Ad);
  assert.equal(fromClose.target.watts, 210);
});

test('after work, easy vs hard chip adds 3% watts; rest seconds stay on the card', () => {
  let log = Eng.readyLog({
    machine: 'bike',
    structure: 'intervals',
    effort: 'hard',
    workSec: 15,
    restSec: 45,
    rounds: 8,
    typedWatts: 220,
  }, Ad);
  assert.equal(log.engine.target.watts, 220);
  assert.equal(log.engine.restSec, 45);
  log = Eng.startWork(log, 1_000);
  assert.equal(log.engine.phase, 'work');
  log = Eng.endWork(log, 16_000);
  assert.equal(log.engine.phase, 'rate');
  log = Eng.rateWork(log, { actualRpe: 5 }, Ad);
  assert.equal(log.engine.target.watts, 227);
  assert.equal(log.engine.restSec, 45);
  assert.equal(log.engine.phase, 'rest');
  assert.equal(log.engine.roundIndex, 1);
  assert.equal(log.engine.rounds, 8);
});

test('too hard and stop cut watts; Next never returns a new rest duration', () => {
  let hard = Eng.readyLog({
    machine: 'bike',
    structure: 'intervals',
    effort: 'medium',
    workSec: 15,
    restSec: 45,
    rounds: 4,
    typedWatts: 220,
  }, Ad);
  hard = Eng.startWork(hard, 0);
  hard = Eng.endWork(hard, 15_000);
  hard = Eng.rateWork(hard, { actualRpe: 9 }, Ad);
  assert.equal(hard.engine.target.watts, 209);
  assert.equal(hard.engine.restSec, 45);

  let stop = Eng.readyLog({
    machine: 'bike',
    structure: 'intervals',
    effort: 'hard',
    workSec: 15,
    restSec: 45,
    rounds: 4,
    typedWatts: 220,
  }, Ad);
  stop = Eng.startWork(stop, 0);
  stop = Eng.endWork(stop, 10_000);
  stop = Eng.rateWork(stop, { actualRpe: 10, stopped: true }, Ad);
  assert.equal(stop.engine.target.watts, 202);
  assert.equal(stop.engine.restSec, 45);
});

test('row split Next is seconds not watts; rest clock unchanged', () => {
  let log = Eng.readyLog({
    machine: 'row',
    structure: 'intervals',
    effort: 'hard',
    workSec: 15,
    restSec: 45,
    rounds: 3,
    typedSplitSec: 120,
  }, Ad);
  log = Eng.startWork(log, 0);
  log = Eng.endWork(log, 15_000);
  log = Eng.rateWork(log, { actualRpe: 5 }, Ad);
  assert.equal(log.engine.target.splitSec, 119);
  assert.equal(log.engine.target.watts, null);
  assert.equal(log.engine.restSec, 45);
});

test('still cooked on the next hard cuts work, never lengthens rest', () => {
  let log = Eng.readyLog({
    machine: 'bike',
    structure: 'intervals',
    effort: 'hard',
    workSec: 15,
    restSec: 45,
    rounds: 4,
    typedWatts: 220,
  }, Ad);
  log = Eng.startWork(log, 0);
  log = Eng.endWork(log, 15_000);
  log = Eng.rateWork(log, { actualRpe: 8 }, Ad);
  assert.equal(log.engine.target.watts, 220);
  log = Eng.skipRest(log);
  log = Eng.startWork(log, 60_000);
  log = Eng.endWork(log, 75_000);
  log = Eng.rateWork(log, { actualRpe: 8, cooked: true }, Ad);
  assert.equal(log.engine.target.watts, 209);
  assert.equal(log.engine.restSec, 45);
});

test('tempo and steady rate once then close; Close is last made work', () => {
  let log = Eng.readyLog({
    machine: 'bike',
    structure: 'steady',
    effort: 'medium',
    workSec: 480,
    restSec: 0,
    rounds: 1,
    typedWatts: 180,
  }, Ad);
  log = Eng.startWork(log, 0);
  log = Eng.endWork(log, 480_000);
  log = Eng.rateWork(log, { actualRpe: 6 }, Ad);
  assert.equal(log.engine.phase, 'done');
  const closed = Eng.closePiece(log, Ad);
  assert.equal(closed.ok, true);
  assert.equal(closed.watts, 180);
});

test('prescription copy is splits/watts/rpm, never a strength set grid', () => {
  assert.match(Eng.rxText({
    machine: 'row',
    structure: 'intervals',
    workSec: 15,
    restSec: 45,
    rounds: 8,
    effort: 'hard',
    typedSplitSec: 136,
  }), /8/);
  assert.match(Eng.rxText({
    machine: 'row',
    structure: 'intervals',
    workSec: 15,
    restSec: 45,
    rounds: 8,
    effort: 'hard',
    typedSplitSec: 136,
  }), /2:16/);
  assert.doesNotMatch(Eng.rxText({
    machine: 'bike',
    structure: 'intervals',
    workSec: 15,
    restSec: 45,
    rounds: 8,
    effort: 'hard',
    typedWatts: 220,
  }), /\bkg\b/i);
});
