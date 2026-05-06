// ── DOM ──
const arena = document.getElementById('arena');
const scoreEl = document.getElementById('score-display');
const timerBar = document.getElementById('timer-bar');
const timerDisp = document.getElementById('timer-display');
const missFlash = document.getElementById('miss-flash');
const accVal = document.getElementById('accuracy-val');
const endScreen = document.getElementById('end-screen');
const startScreen = document.getElementById('start-screen');
const modeLbl = document.getElementById('mode-label');
const trackingEl = document.getElementById('tracking-target');
const cpsBtn = document.getElementById('cps-button');
const cpsHud = document.getElementById('cps-hud');
const cpsDisp = document.getElementById('cps-display');

// ── Config ──
const DUR_MAP = { 1: 30, 2: 60, 3: 90, 4: 120 };
const CPS_DUR_MAP = { 1: 10, 2: 15, 3: 30, 4: 60 };
const SIZE_MAP = { 1: [18, 32], 2: [30, 54], 3: [48, 76] };
const SIZE_LBL = { 1: 'Small', 2: 'Med', 3: 'Large' };
// moveInterval = ms between jumps, cssTransition = seconds for CSS glide
const SPEED_CFG = {
  slow: { moveInterval: 2000, cssTransition: 1.6 },
  medium: { moveInterval: 1000, cssTransition: 0.8 },
  fast: { moveInterval: 500, cssTransition: 0.42 },
  chaos: { moveInterval: 220, cssTransition: 0.18 },
};

let currentMode = 'classic';
let settings = {
  classic: { maxTargets: 3, sizeKey: 2, durKey: 2 },
  tracking: { speed: 'medium', sizeKey: 2, durKey: 2 },
  cps: { durKey: 1 },
};

// ── Slider wiring ──
function wire(sliderId, labelId, mapOrFn) {
  const sl = document.getElementById(sliderId);
  const upd = () => {
    const v = +sl.value;
    const lbl = document.getElementById(labelId);
    lbl.textContent = typeof mapOrFn === 'function' ? mapOrFn(v) : mapOrFn[v];
  };
  sl.addEventListener('input', upd);
}

wire('targets-slider', 'targets-val', v => {
  settings.classic.maxTargets = v;
  return v;
});
wire('size-slider', 'size-val', v => {
  settings.classic.sizeKey = v;
  return SIZE_LBL[v];
});
wire('dur-slider', 'dur-val', v => {
  settings.classic.durKey = v;
  return DUR_MAP[v] + 's';
});
wire('track-size-slider', 'track-size-val', v => {
  settings.tracking.sizeKey = v;
  return SIZE_LBL[v];
});
wire('track-dur-slider', 'track-dur-val', v => {
  settings.tracking.durKey = v;
  return DUR_MAP[v] + 's';
});
wire('cps-dur-slider', 'cps-dur-val', v => {
  settings.cps.durKey = v;
  return CPS_DUR_MAP[v] + 's';
});

document.querySelectorAll('.speed-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.speed-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    settings.tracking.speed = btn.dataset.speed;
  });
});

['classic', 'tracking', 'cps'].forEach(m => {
  document.getElementById('btn-' + m).addEventListener('click', () => switchMode(m));
});

function switchMode(m) {
  currentMode = m;
  ['classic', 'tracking', 'cps'].forEach(n => {
    document.getElementById('btn-' + n).classList.toggle('active', n === m);
    document.getElementById(n + '-settings').classList.toggle('is-hidden', n !== m);
  });
}

// ── Game state ──
let score = 0;
let hits = 0;
let misses = 0;
let timeLeft = 0;
let gameActive = false;
let spawnInterval = null;
let countdownInterval = null;
let trackMoveInterval = null;
let targetTimeouts = new Map();
let trailRaf = null;
let trackSize = 44;
let trackCurX = 0;
let trackCurY = 0;

// CPS state
let cpsClicks = 0;
let cpsWindowClicks = [];
let cpsPeak = 0;

// ── Start ──
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('menu-btn').addEventListener('click', () => {
  endScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
});

function getDuration() {
  if (currentMode === 'cps') return CPS_DUR_MAP[settings.cps.durKey];
  if (currentMode === 'tracking') return DUR_MAP[settings.tracking.durKey];
  return DUR_MAP[settings.classic.durKey];
}

function startGame() {
  score = 0;
  hits = 0;
  misses = 0;
  cpsClicks = 0;
  cpsWindowClicks = [];
  cpsPeak = 0;
  timeLeft = getDuration();

  scoreEl.textContent = '0';
  accVal.textContent = '—';
  cpsDisp.textContent = '0.0';
  cpsHud.style.display = 'none';

  timerBar.style.transition = 'none';
  timerBar.style.width = '100%';
  requestAnimationFrame(() => {
    timerBar.style.transition = 'width 1s linear';
  });
  timerDisp.textContent = timeLeft + 's';

  arena.innerHTML = '';
  arena.onclick = null;
  trackingEl.className = '';
  trackingEl.style.display = 'none';
  trackingEl.onclick = null;
  cpsBtn.className = '';
  cpsBtn.style.display = 'none';
  cpsBtn.onclick = null;

  clearInterval(spawnInterval);
  clearInterval(countdownInterval);
  clearInterval(trackMoveInterval);
  cancelAnimationFrame(trailRaf);
  targetTimeouts.forEach(t => clearTimeout(t));
  targetTimeouts.clear();

  startScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  gameActive = true;

  const dur = getDuration();

  if (currentMode === 'classic') {
    modeLbl.textContent = '// classic mode';
    document.getElementById('accuracy-wrap').style.display = '';
    startClassic();
  } else if (currentMode === 'tracking') {
    modeLbl.textContent = '// tracking mode';
    document.getElementById('accuracy-wrap').style.display = '';
    startTracking();
  } else {
    modeLbl.textContent = '// cps mode';
    document.getElementById('accuracy-wrap').style.display = 'none';
    cpsHud.style.display = 'block';
    startCPS();
  }

  countdownInterval = setInterval(() => {
    timeLeft--;
    timerDisp.textContent = timeLeft + 's';
    timerBar.style.width = `${(timeLeft / dur) * 100}%`;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

// ──────────────────────────
// CLASSIC MODE
// ──────────────────────────
function startClassic() {
  const max = settings.classic.maxTargets;
  for (let i = 0; i < Math.min(max, 3); i++) spawnTarget();
  spawnInterval = setInterval(() => {
    if (!gameActive) return;
    const alive = arena.querySelectorAll('.target:not(.dying)').length;
    for (let i = alive; i < max; i++) spawnTarget();
  }, 550);
  arena.onclick = e => {
    if (!gameActive || e.target !== arena) return;
    misses++;
    updateAcc();
    flashMiss();
  };
}

function spawnTarget() {
  if (!gameActive) return;
  const [minS, maxS] = SIZE_MAP[settings.classic.sizeKey];
  const size = Math.floor(Math.random() * (maxS - minS)) + minS;
  const margin = size + 14;
  const x = Math.random() * (window.innerWidth - margin * 2) + margin;
  const y = Math.random() * (window.innerHeight - margin * 2 - 40) + margin;

  const btn = document.createElement('button');
  btn.className = 'target';
  btn.style.cssText = `width:${size}px;height:${size}px;left:${x - size / 2}px;top:${y - size / 2}px;`;
  arena.appendChild(btn);

  const lifetime = Math.max(750, 2000 - settings.classic.maxTargets * 110);
  const to = setTimeout(() => {
    if (btn.parentNode && !btn.classList.contains('dying')) {
      btn.classList.add('dying');
      misses++;
      updateAcc();
      flashMiss();
      btn.addEventListener('animationend', () => btn.remove(), { once: true });
      targetTimeouts.delete(btn);
    }
  }, lifetime);
  targetTimeouts.set(btn, to);

  btn.addEventListener('click', e => {
    if (!gameActive || btn.classList.contains('dying')) return;
    clearTimeout(targetTimeouts.get(btn));
    targetTimeouts.delete(btn);
    score++;
    hits++;
    updateScore();
    updateAcc();
    spawnHitEffect(e.clientX, e.clientY);
    btn.classList.add('dying');
    btn.style.pointerEvents = 'none';
    btn.addEventListener('animationend', () => btn.remove(), { once: true });
  });
}

// ──────────────────────────
// TRACKING MODE
// ──────────────────────────
function startTracking() {
  const [minS, maxS] = SIZE_MAP[settings.tracking.sizeKey];
  trackSize = Math.floor(Math.random() * (maxS - minS)) + minS;

  trackingEl.style.width = trackSize + 'px';
  trackingEl.style.height = trackSize + 'px';
  trackingEl.style.transition = 'none';

  trackCurX = window.innerWidth / 2 - trackSize / 2;
  trackCurY = window.innerHeight / 2 - trackSize / 2;
  trackingEl.style.left = trackCurX + 'px';
  trackingEl.style.top = trackCurY + 'px';
  trackingEl.style.display = 'block';
  trackingEl.className = 'active';

  const cfg = SPEED_CFG[settings.tracking.speed];

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      trackingEl.style.transition =
        `left ${cfg.cssTransition}s cubic-bezier(0.42,0,0.58,1),` +
        `top ${cfg.cssTransition}s cubic-bezier(0.42,0,0.58,1)`;
      moveTracking();
    });
  });

  trackMoveInterval = setInterval(moveTracking, cfg.moveInterval);

  trackingEl.onclick = e => {
    if (!gameActive) return;
    score++;
    hits++;
    updateScore();
    updateAcc();
    spawnHitEffect(e.clientX, e.clientY);
    trackingEl.style.boxShadow = '0 0 0 4px #ff1a1a, 0 0 50px #ff4444, 0 0 100px #ff1a1a88';
    setTimeout(() => {
      if (trackingEl) trackingEl.style.boxShadow = '';
    }, 140);
  };

  arena.onclick = e => {
    if (!gameActive || e.target !== arena) return;
    misses++;
    updateAcc();
    flashMiss();
  };

  startTrail();
}

function moveTracking() {
  if (!gameActive) return;
  const margin = trackSize + 28;
  const nx = Math.random() * (window.innerWidth - margin * 2) + margin;
  const ny = Math.random() * (window.innerHeight - margin * 2 - 40) + margin;
  trackCurX = nx - trackSize / 2;
  trackCurY = ny - trackSize / 2;
  trackingEl.style.left = trackCurX + 'px';
  trackingEl.style.top = trackCurY + 'px';
}

function startTrail() {
  let last = 0;
  function loop(ts) {
    if (!gameActive) return;
    if (ts - last > 70) {
      last = ts;
      const t = document.createElement('div');
      t.className = 'trail';
      const s = trackSize * 0.82;
      t.style.cssText = `width:${s}px;height:${s}px;left:${trackCurX + trackSize / 2 - s / 2}px;top:${trackCurY + trackSize / 2 - s / 2}px;`;
      document.body.appendChild(t);
      t.addEventListener('animationend', () => t.remove(), { once: true });
    }
    trailRaf = requestAnimationFrame(loop);
  }
  trailRaf = requestAnimationFrame(loop);
}

// ──────────────────────────
// CPS MODE
// ──────────────────────────
function startCPS() {
  cpsBtn.className = 'active';

  cpsBtn.onclick = e => {
    if (!gameActive) return;
    score++;
    cpsClicks++;
    updateScore();
    spawnHitEffect(e.clientX, e.clientY);

    const now = performance.now();
    cpsWindowClicks.push(now);
    const cutoff = now - 1000;
    while (cpsWindowClicks.length && cpsWindowClicks[0] < cutoff) cpsWindowClicks.shift();
    const liveCPS = cpsWindowClicks.length;
    if (liveCPS > cpsPeak) cpsPeak = liveCPS;
    cpsDisp.textContent = liveCPS.toFixed(1);

    const ring = document.createElement('div');
    ring.className = 'cps-ring';
    document.body.appendChild(ring);
    ring.addEventListener('animationend', () => ring.remove(), { once: true });
  };

  spawnInterval = setInterval(() => {
    if (!gameActive) return;
    const now = performance.now();
    const cutoff = now - 1000;
    while (cpsWindowClicks.length && cpsWindowClicks[0] < cutoff) cpsWindowClicks.shift();
    const liveCPS = cpsWindowClicks.length;
    cpsDisp.textContent = liveCPS.toFixed(1);
  }, 100);
}

// ──────────────────────────
// END GAME
// ──────────────────────────
function endGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(countdownInterval);
  clearInterval(trackMoveInterval);
  cancelAnimationFrame(trailRaf);

  arena.innerHTML = '';
  arena.onclick = null;
  trackingEl.className = '';
  trackingEl.style.display = 'none';
  trackingEl.onclick = null;
  cpsBtn.className = '';
  cpsBtn.style.display = 'none';
  cpsBtn.onclick = null;
  cpsHud.style.display = 'none';

  targetTimeouts.forEach(t => clearTimeout(t));
  targetTimeouts.clear();

  document.getElementById('end-mode-tag').textContent = currentMode + ' mode';
  document.getElementById('final-score').textContent = score;

  const finalStats = document.getElementById('final-stats');
  const cpsStats = document.getElementById('cps-stats');

  if (currentMode === 'cps') {
    finalStats.style.display = 'none';
    cpsStats.style.display = '';
    document.getElementById('final-score').textContent = cpsClicks;
    document.getElementById('final-clicks').textContent = cpsClicks;
    document.getElementById('final-peak').textContent = cpsPeak.toFixed(1);
    const dur = CPS_DUR_MAP[settings.cps.durKey];
    document.getElementById('final-avg').textContent = (cpsClicks / dur).toFixed(1);
  } else {
    finalStats.style.display = '';
    cpsStats.style.display = 'none';
    document.getElementById('final-hits').textContent = hits;
    document.getElementById('final-misses').textContent = misses;
    const total = hits + misses;
    document.getElementById('final-acc').textContent = total > 0 ? Math.round((hits / total) * 100) + '%' : '—';
  }

  endScreen.classList.remove('hidden');
}

// ── Helpers ──
function updateScore() {
  scoreEl.textContent = score;
  scoreEl.classList.remove('pop');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('pop');
  setTimeout(() => scoreEl.classList.remove('pop'), 120);
}

function updateAcc() {
  const total = hits + misses;
  accVal.textContent = total > 0 ? Math.round((hits / total) * 100) + '%' : '—';
}

function flashMiss() {
  missFlash.style.opacity = '1';
  setTimeout(() => (missFlash.style.opacity = '0'), 100);
}

function spawnHitEffect(cx, cy) {
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const ps = Math.random() * 6 + 3;
    const angle = (i / 8) * Math.PI * 2;
    const dist = 28 + Math.random() * 32;
    p.style.cssText = `width:${ps}px;height:${ps}px;left:${cx}px;top:${cy}px;`;
    p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
    p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
    document.body.appendChild(p);
    p.addEventListener('animationend', () => p.remove());
  }

  const h = document.createElement('div');
  h.className = 'hit-text';
  h.textContent = '+1';
  h.style.cssText = `left:${cx - 12}px;top:${cy - 20}px;`;
  document.body.appendChild(h);
  h.addEventListener('animationend', () => h.remove());
}
