(function (root) {
  const EFFORT = {
    easy: { min: 3, max: 4 },
    medium: { min: 5, max: 7 },
    hard: { min: 8, max: 9.5 },
  };

  const MACHINES = {
    bike: { title: 'Bike', modality: 'watts' },
    echo: { title: 'Echo', modality: 'watts' },
    row: { title: 'Row', modality: 'split' },
    ski: { title: 'Ski', modality: 'split' },
    fan: { title: 'Fan bike', modality: 'rpm' },
    walk: { title: 'Walk', modality: 'none' },
    run: { title: 'Run', modality: 'none' },
  };

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function ad(passed) {
    return passed || root.HybridAdaptive;
  }

  function machineMeta(id) {
    return MACHINES[id] || { title: id || 'Engine', modality: 'none' };
  }

  function bandFor(effort) {
    return EFFORT[effort] || EFFORT.medium;
  }

  function modalityFor(machine, piece) {
    if (piece) {
      if (piece.typedWatts != null && Number.isFinite(Number(piece.typedWatts))) return 'watts';
      if (piece.typedSplitSec != null && Number.isFinite(Number(piece.typedSplitSec))) return 'split';
      if (piece.typedRpm != null && Number.isFinite(Number(piece.typedRpm))) return 'rpm';
    }
    return machineMeta(machine).modality;
  }

  function formatSplit(sec) {
    const n = Math.round(Number(sec) || 0);
    const m = Math.floor(n / 60);
    const s = n % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function formatTarget(target, modality) {
    if (!target) return '';
    if (modality === 'watts' && target.watts != null) return `${Math.round(target.watts)} W`;
    if (modality === 'split' && target.splitSec != null) return `${formatSplit(target.splitSec)}/500m`;
    if (modality === 'rpm' && target.rpm != null) return `${Math.round(target.rpm)} rpm`;
    return '';
  }

  function emptyTarget() {
    return { watts: null, splitSec: null, rpm: null };
  }

  function targetFromOpen(opened, modality) {
    const t = emptyTarget();
    if (!opened || !opened.ok) return t;
    if (modality === 'split') t.splitSec = opened.splitSec == null ? null : opened.splitSec;
    else if (modality === 'rpm') t.rpm = opened.rpm == null ? null : opened.rpm;
    else if (modality === 'watts') t.watts = opened.watts == null ? null : opened.watts;
    return t;
  }

  function openPiece(piece, lastClose, adaptive) {
    const A = ad(adaptive);
    const modality = modalityFor(piece.machine, piece);
    if (modality === 'none' || !A) {
      return { ok: true, skipped: true, modality, target: emptyTarget() };
    }
    const opened = A.openCond({
      dayKind: 'conditioning',
      modality,
      lastClose: lastClose || null,
      typedWatts: piece.typedWatts,
      typedSplitSec: piece.typedSplitSec,
      typedRpm: piece.typedRpm,
    });
    if (!opened || !opened.ok) return { ok: false, modality, target: emptyTarget() };
    const target = targetFromOpen(opened, modality);
    const blank = (modality === 'watts' && target.watts == null)
      || (modality === 'split' && target.splitSec == null)
      || (modality === 'rpm' && target.rpm == null);
    return { ok: true, skipped: blank, modality, target };
  }

  function readyLog(piece, adaptive, lastClose) {
    const opened = openPiece(piece, lastClose || null, adaptive);
    return {
      completed: false,
      note: '',
      sets: [],
      engine: {
        machine: piece.machine,
        title: piece.title || machineMeta(piece.machine).title,
        structure: piece.structure || 'intervals',
        effort: piece.effort || 'medium',
        modality: opened.modality,
        skipped: !!opened.skipped,
        workSec: Math.max(1, Number(piece.workSec) || 60),
        restSec: Math.max(0, Number(piece.restSec) || 0),
        rounds: Math.max(1, Number(piece.rounds) || 1),
        roundIndex: 0,
        phase: 'ready',
        target: opened.target,
        bouts: [],
        workEndsAt: null,
        restEndsAt: null,
        slider: bandFor(piece.effort || 'medium').min,
      },
    };
  }

  function startWork(log, now) {
    const s = clone(log);
    const e = s.engine;
    e.phase = 'work';
    e.workEndsAt = now + e.workSec * 1000;
    e.restEndsAt = null;
    return s;
  }

  function endWork(log, now) {
    const s = clone(log);
    const e = s.engine;
    e.phase = 'rate';
    e.workEndsAt = now;
    return s;
  }

  function tick(log, now) {
    const e = log.engine;
    if (!e) return log;
    if (e.phase === 'work' && e.workEndsAt != null && now >= e.workEndsAt) return endWork(log, now);
    if (e.phase === 'rest' && e.restEndsAt != null && now >= e.restEndsAt) {
      const s = clone(log);
      s.engine.phase = 'ready';
      s.engine.restEndsAt = null;
      return s;
    }
    return log;
  }

  function nextFromResult(res, modality) {
    const t = emptyTarget();
    if (!res || !res.ok || res.skipped) return { skipped: true, target: t };
    if (modality === 'split' && res.splitSec != null) t.splitSec = res.splitSec;
    else if (modality === 'rpm' && res.rpm != null) t.rpm = res.rpm;
    else if (res.watts != null) t.watts = res.watts;
    return { skipped: false, target: t };
  }

  function rateWork(log, feel, adaptive) {
    const s = clone(log);
    const e = s.engine;
    const A = ad(adaptive);
    const actualRpe = Number(feel.actualRpe);
    const rpe = Number.isFinite(actualRpe) ? actualRpe : 0;
    const bout = {
      rpe,
      stopped: !!feel.stopped,
      cooked: !!feel.cooked,
      watts: e.target.watts,
      splitSec: e.target.splitSec,
      rpm: e.target.rpm,
    };
    e.bouts.push(bout);
    if (!e.skipped && A && typeof A.decideNextCond === 'function') {
      const res = A.decideNextCond({
        dayKind: 'conditioning',
        modality: e.modality,
        targetRpe: bandFor(e.effort),
        actualRpe: rpe,
        stopped: !!feel.stopped,
        cooked: !!feel.cooked,
        currentWatts: e.target.watts == null ? undefined : e.target.watts,
        currentSplitSec: e.target.splitSec == null ? undefined : e.target.splitSec,
        currentRpm: e.target.rpm == null ? undefined : e.target.rpm,
        actualWatts: feel.actualWatts,
        actualSplitSec: feel.actualSplitSec,
        actualRpm: feel.actualRpm,
      });
      const nxt = nextFromResult(res, e.modality);
      if (!nxt.skipped) e.target = nxt.target;
    }
    e.roundIndex += 1;
    const more = e.roundIndex < e.rounds && e.structure === 'intervals';
    if (more) {
      e.phase = 'rest';
      e.restEndsAt = (feel.now || Date.now()) + e.restSec * 1000;
      e.workEndsAt = null;
    } else {
      e.phase = 'done';
      s.completed = true;
      e.workEndsAt = null;
      e.restEndsAt = null;
    }
    return s;
  }

  function skipRest(log) {
    const s = clone(log);
    s.engine.phase = 'ready';
    s.engine.restEndsAt = null;
    return s;
  }

  function closePiece(log, adaptive) {
    const A = ad(adaptive);
    const e = log.engine;
    const last = e.bouts[e.bouts.length - 1] || {};
    const lastMade = {};
    if (e.modality === 'rpm' && (last.rpm != null || e.target.rpm != null)) lastMade.rpm = last.rpm != null ? last.rpm : e.target.rpm;
    else if (e.modality === 'watts' && (last.watts != null || e.target.watts != null)) lastMade.watts = last.watts != null ? last.watts : e.target.watts;
    else if (e.modality === 'split' && (last.splitSec != null || e.target.splitSec != null)) lastMade.splitSec = last.splitSec != null ? last.splitSec : e.target.splitSec;
    if (!A || typeof A.closeCond !== 'function' || !Object.keys(lastMade).length) {
      return { ok: true, ...lastMade };
    }
    return A.closeCond({ lastMade });
  }

  function rxText(piece) {
    const modality = modalityFor(piece.machine, piece);
    const effort = String(piece.effort || 'medium');
    const rounds = Math.max(1, Number(piece.rounds) || 1);
    const work = Math.max(1, Number(piece.workSec) || 0);
    const rest = Math.max(0, Number(piece.restSec) || 0);
    const structure = piece.structure || 'intervals';
    let clock = structure === 'intervals'
      ? `${rounds} × ${work}s / ${rest}s`
      : `${Math.round(work / 60) || work} min`;
    const t = emptyTarget();
    if (piece.typedWatts != null) t.watts = piece.typedWatts;
    if (piece.typedSplitSec != null) t.splitSec = piece.typedSplitSec;
    if (piece.typedRpm != null) t.rpm = piece.typedRpm;
    const num = formatTarget(t, modality);
    const chip = effort.charAt(0).toUpperCase() + effort.slice(1);
    return [clock, chip, num].filter(Boolean).join(' · ');
  }

  const HybridEngine = {
    MACHINES,
    bandFor,
    modalityFor,
    formatSplit,
    formatTarget,
    openPiece,
    readyLog,
    startWork,
    endWork,
    tick,
    rateWork,
    skipRest,
    closePiece,
    rxText,
    machineTitle(id) { return machineMeta(id).title; },
  };

  root.HybridEngine = HybridEngine;
  if (typeof module !== 'undefined' && module.exports) module.exports = HybridEngine;
})(typeof globalThis !== 'undefined' ? globalThis : this);
