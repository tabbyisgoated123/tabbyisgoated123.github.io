// ── DOM ──
const arena = document.getElementById('arena');
const scoreEl = document.getElementById('score-display');
const timerBar = document.getElementById('timer-bar');
const timerDisp = document.getElementById('timer-display');
const missFlash = document.getElementById('miss-flash');
const accVal = document.getElementById('accuracy-val');
const accuracyWrap = document.getElementById('accuracy-wrap');
const accuracyLabel = accuracyWrap?.querySelector('.accuracy-label');
const endScreen = document.getElementById('end-screen');
const startScreen = document.getElementById('start-screen');
const modeLbl = document.getElementById('mode-label');
const trackingLegacy = document.getElementById('tracking-target');

if (trackingLegacy) trackingLegacy.remove();

// ── Config ──
const DUR_MAP = { 1: 15, 2: 30, 3: 60, 4: 90, 5: 120 };
const SIZE_MAP = { 1: [18, 32], 2: [30, 54], 3: [48, 76] };
const SIZE_LBL = { 1: 'Small', 2: 'Med', 3: 'Large' };
const SHAPES = ['circle', 'square', 'diamond'];
const THREE_SPEED = { 1: 90, 2: 150, 3: 220, 4: 310, 5: 420 };
const THREE_DEPTH = { 1: 0.55, 2: 0.75, 3: 1.0, 4: 1.25, 5: 1.55 };
// Pixel-per-second baselines so it feels deliberate.
const SPEED_PRESETS = {
  crawl:  { speed: 80,  amp: 80 },
  slow:   { speed: 140, amp: 110 },
  medium: { speed: 230, amp: 150 },
  fast:   { speed: 360, amp: 190 },
  chaos:  { speed: 520, amp: 240 },
};

let currentMode = 'classic';
let settings = {
  classic: { maxTargets: 3, sizeKey: 2, durKey: 2 },
  tracking: {
    speed: 'slow',
    multiplier: 1.0,
    count: 2,
    pattern: 'linear',
    sizeKey: 2,
    durKey: 2,
  },
  threeD: {
    count: 3,
    angleDeg: 45,
    speedKey: 3,
    sizeKey: 2,
    durKey: 2,
  },
  shape: 'circle',
};

function wire(sliderId, labelId, mapOrFn) {
  const sl = document.getElementById(sliderId);
  if (!sl) return;
  const upd = () => {
    const v = +sl.value;
    const lbl = document.getElementById(labelId);
    if (lbl) lbl.textContent = typeof mapOrFn === 'function' ? mapOrFn(v) : mapOrFn[v];
  };
  sl.addEventListener('input', upd);
  upd();
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
  return DUR_MAP[v] + ' s';
});
wire('track-size-slider', 'track-size-val', v => {
  settings.tracking.sizeKey = v;
  return SIZE_LBL[v];
});
wire('track-dur-slider', 'track-dur-val', v => {
  settings.tracking.durKey = v;
  return DUR_MAP[v] + ' s';
});
wire('track-mult-slider', 'track-mult-val', v => {
  settings.tracking.multiplier = v / 10;
  return settings.tracking.multiplier.toFixed(1) + 'x';
});
wire('track-count-slider', 'track-count-val', v => {
  settings.tracking.count = v;
  return v;
});
wire('three-count-slider', 'three-count-val', v => {
  settings.threeD.count = v;
  return v;
});
wire('three-angle-slider', 'three-angle-val', v => {
  settings.threeD.angleDeg = v;
  return v + '°';
});
wire('three-speed-slider', 'three-speed-val', v => {
  settings.threeD.speedKey = v;
  return { 1: 'Crawl', 2: 'Slow', 3: 'Med', 4: 'Fast', 5: 'Chaos' }[v] || 'Med';
});
wire('three-size-slider', 'three-size-val', v => {
  settings.threeD.sizeKey = v;
  return SIZE_LBL[v];
});
wire('three-dur-slider', 'three-dur-val', v => {
  settings.threeD.durKey = v;
  return DUR_MAP[v] + ' s';
});

document.querySelectorAll('.shape-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.shape-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    settings.shape = SHAPES.includes(btn.dataset.shape) ? btn.dataset.shape : 'circle';
  });
});

document.querySelectorAll('.speed-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.speed-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    settings.tracking.speed = btn.dataset.speed;
  });
});

document.querySelectorAll('.pattern-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pattern-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    settings.tracking.pattern = btn.dataset.pattern;
  });
});

['classic', 'tracking'].forEach(m => {
  document.getElementById('btn-' + m).addEventListener('click', () => switchMode(m));
});

document.getElementById('btn-threeD').addEventListener('click', () => switchMode('threeD'));

function switchMode(m) {
  currentMode = m;
  ['classic', 'tracking', 'threeD'].forEach(n => {
    document.getElementById('btn-' + n).classList.toggle('active', n === m);
    document.getElementById(n + '-settings').classList.toggle('is-hidden', n !== m);
  });
  const shapeSettings = document.getElementById('shape-settings');
  if (shapeSettings) shapeSettings.classList.toggle('is-hidden', m === 'threeD');
}

let score = 0;
let hits = 0;
let misses = 0;
let timeLeft = 0;
let gameActive = false;
let spawnInterval = null;
let countdownInterval = null;
let targetTimeouts = new Map();

// Tracking state.
let trackTargets = [];
let trackPointer = { x: -9999, y: -9999 };
let trackElapsed = 0;
let trackOnTime = 0;
let trackStreak = 0;
let trackBestStreak = 0;
let trackRaf = null;
let trackLastTs = 0;

let threeTargets = [];
let threeRaf = null;
let threeLastTs = 0;
let threeElapsed = 0;

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('menu-btn').addEventListener('click', () => {
  endScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
});

function getDuration() {
  return DUR_MAP[settings[currentMode].durKey];
}

function startGame() {
  score = 0;
  hits = 0;
  misses = 0;
  timeLeft = getDuration();

  scoreEl.textContent = '0';
  accVal.textContent = '—';

  timerBar.style.transition = 'none';
  timerBar.style.width = '100%';
  requestAnimationFrame(() => {
    timerBar.style.transition = 'width 1s linear';
  });
  timerDisp.textContent = timeLeft + ' s';

  arena.innerHTML = '';
  arena.onclick = null;
  arena.classList.toggle('mode-threeD', currentMode === 'threeD');

  clearInterval(spawnInterval);
  clearInterval(countdownInterval);
  cancelAnimationFrame(trackRaf);
  cancelAnimationFrame(threeRaf);
  targetTimeouts.forEach(t => clearTimeout(t));
  targetTimeouts.clear();
  trackTargets.forEach(t => t.el.remove());
  trackTargets = [];
  threeTargets.forEach(t => t.el.remove());
  threeTargets = [];
  trackElapsed = 0;
  trackOnTime = 0;
  trackStreak = 0;
  trackBestStreak = 0;
  threeElapsed = 0;

  startScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  gameActive = true;

  const dur = getDuration();
  if (currentMode === 'classic') {
    modeLbl.textContent = '// classic mode';
    accuracyWrap.style.display = '';
    if (accuracyLabel) accuracyLabel.textContent = 'accuracy';
    startClassic();
  } else {
    accuracyWrap.style.display = '';
    if (currentMode === 'tracking') {
      modeLbl.textContent = '// tracking mode — hover the targets';
      if (accuracyLabel) accuracyLabel.textContent = 'on-target';
      startTracking();
    } else {
      modeLbl.textContent = '// 3d mode — capsule targets';
      if (accuracyLabel) accuracyLabel.textContent = 'accuracy';
      startThreeD();
    }
  }

  countdownInterval = setInterval(() => {
    timeLeft--;
    timerDisp.textContent = timeLeft + ' s';
    timerBar.style.width = `${(timeLeft / dur) * 100}%`;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

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
  btn.className = `target shape-${settings.shape}`;
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

function startTracking() {
  const [minS, maxS] = SIZE_MAP[settings.tracking.sizeKey];
  const count = settings.tracking.count;
  for (let i = 0; i < count; i++) {
    const size = Math.floor(Math.random() * (maxS - minS)) + minS;
    const el = document.createElement('div');
    el.className = `slide-target shape-${settings.shape}`;
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    arena.appendChild(el);
    trackTargets.push({
      el,
      size,
      // Each target staggered along its own path with its own phase.
      phase: (i / count) * Math.PI * 2,
      // Offset the y-band so multiple targets don't stack.
      laneFrac: count === 1 ? 0.5 : 0.2 + (i / Math.max(1, count - 1)) * 0.6,
      // Per-target multiplier so the cluster has variety.
      speedJitter: 0.8 + Math.random() * 0.4,
      hovered: false,
      x: 0,
      y: 0,
    });
  }

  arena.addEventListener('mousemove', onTrackMove);
  arena.addEventListener('mouseleave', onTrackLeave);
  // Click is harmless in tracking — just absorb.
  arena.onclick = null;

  trackLastTs = 0;
  trackRaf = requestAnimationFrame(trackLoop);
}

function startThreeD() {
  const count = settings.threeD.count;
  const angleRad = (settings.threeD.angleDeg % 360) * Math.PI / 180;
  const speed = THREE_SPEED[settings.threeD.speedKey] || THREE_SPEED[3];
  const baseDir = { x: Math.cos(angleRad), y: Math.sin(angleRad) };

  for (let i = 0; i < count; i++) {
    spawnThreeDTarget(i, baseDir, speed);
  }

  arena.onclick = null;
  threeLastTs = 0;
  threeRaf = requestAnimationFrame(threeLoop);
}

function spawnThreeDTarget(index, dir, speed) {
  const [minS, maxS] = SIZE_MAP[settings.threeD.sizeKey];
  const baseSize = Math.floor(Math.random() * (maxS - minS)) + minS;
  const capsuleW = Math.round(baseSize * 0.72);
  const capsuleH = Math.round(baseSize * 1.72);
  const marginX = capsuleW + 24;
  const marginY = capsuleH + 24;
  const xRange = Math.max(0, window.innerWidth - marginX * 2);
  const yRange = Math.max(0, window.innerHeight - marginY * 2 - 40);
  const x = marginX + Math.random() * xRange;
  const y = marginY + Math.random() * yRange;
  const depthPhase = Math.random() * Math.PI * 2;
  const lifeLeft = 1600 + Math.random() * 900;

  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'target three-target shape-capsule';
  el.style.width = capsuleW + 'px';
  el.style.height = capsuleH + 'px';
  arena.appendChild(el);

  const target = {
    el,
    x,
    y,
    z: 0.5 + Math.random() * 0.5,
    depthPhase,
    lifeLeft,
    speed,
    vx: dir.x * speed,
    vy: dir.y * speed,
    baseW: capsuleW,
    baseH: capsuleH,
    scale: 1,
  };

  el.addEventListener('click', e => {
    if (!gameActive || target.dead) return;
    score++;
    hits++;
    updateScore();
    updateAcc();
    spawnHitEffect(e.clientX, e.clientY);
    respawnThreeDTarget(target, true);
  });

  threeTargets.push(target);
  updateThreeDTarget(target, index);
}

function respawnThreeDTarget(target, keepDirection = false) {
  const [minS, maxS] = SIZE_MAP[settings.threeD.sizeKey];
  const baseSize = Math.floor(Math.random() * (maxS - minS)) + minS;
  const capsuleW = Math.round(baseSize * 0.72);
  const capsuleH = Math.round(baseSize * 1.72);
  const marginX = capsuleW + 24;
  const marginY = capsuleH + 24;
  const xRange = Math.max(0, window.innerWidth - marginX * 2);
  const yRange = Math.max(0, window.innerHeight - marginY * 2 - 40);
  const x = marginX + Math.random() * xRange;
  const y = marginY + Math.random() * yRange;

  target.x = x;
  target.y = y;
  target.z = 0.35 + Math.random() * 0.65;
  target.depthPhase = Math.random() * Math.PI * 2;
  target.lifeLeft = 1600 + Math.random() * 900;
  target.baseW = capsuleW;
  target.baseH = capsuleH;
  target.el.style.width = capsuleW + 'px';
  target.el.style.height = capsuleH + 'px';
  if (!keepDirection) {
    const angleRad = (settings.threeD.angleDeg % 360) * Math.PI / 180;
    const speed = THREE_SPEED[settings.threeD.speedKey] || THREE_SPEED[3];
    target.speed = speed;
    target.vx = Math.cos(angleRad) * speed;
    target.vy = Math.sin(angleRad) * speed;
  }
  updateThreeDTarget(target);
}

function updateThreeDTarget(target, index = 0) {
  const depthScale = 0.66 + target.z * 0.72;
  target.scale = depthScale;
  const x = target.x - (target.baseW * depthScale) / 2;
  const y = target.y - (target.baseH * depthScale) / 2;
  target.el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${depthScale})`;
  target.el.style.opacity = String(0.55 + target.z * 0.45);
  target.el.style.filter = `brightness(${0.88 + target.z * 0.3})`;
  target.el.style.zIndex = String(50 + Math.round(target.z * 20) + index);
}

function threeLoop(ts) {
  if (!gameActive) return;
  if (!threeLastTs) threeLastTs = ts;
  const dt = Math.min(0.05, (ts - threeLastTs) / 1000);
  threeLastTs = ts;
  threeElapsed += dt;

  const w = window.innerWidth;
  const h = window.innerHeight - 60;
  const depthRate = THREE_DEPTH[settings.threeD.speedKey] || THREE_DEPTH[3];

  for (let i = 0; i < threeTargets.length; i++) {
    const t = threeTargets[i];
    t.lifeLeft -= dt * 1000;

    t.x += t.vx * dt;
    t.y += t.vy * dt;
    t.z = 0.5 + Math.sin(threeElapsed * depthRate + t.depthPhase) * 0.34;

    const xMin = t.baseW * 0.6;
    const xMax = w - t.baseW * 0.6;
    const yMin = t.baseH * 0.6;
    const yMax = h - t.baseH * 0.6;

    if (t.x < xMin) {
      t.x = xMin;
      t.vx *= -1;
    } else if (t.x > xMax) {
      t.x = xMax;
      t.vx *= -1;
    }

    if (t.y < yMin) {
      t.y = yMin;
      t.vy *= -1;
    } else if (t.y > yMax) {
      t.y = yMax;
      t.vy *= -1;
    }

    if (t.lifeLeft <= 0) {
      misses++;
      updateAcc();
      flashMiss();
      respawnThreeDTarget(t, true);
      continue;
    }

    updateThreeDTarget(t, i);
  }

  scoreEl.textContent = String(Math.floor(score));
  const total = hits + misses;
  accVal.textContent = total > 0 ? Math.round((hits / total) * 100) + '%' : '—';

  threeRaf = requestAnimationFrame(threeLoop);
}

function onTrackMove(e) {
  trackPointer.x = e.clientX;
  trackPointer.y = e.clientY;
}
function onTrackLeave() {
  trackPointer.x = -9999;
  trackPointer.y = -9999;
}

function trackLoop(ts) {
  if (!gameActive) return;
  if (!trackLastTs) trackLastTs = ts;
  const dt = Math.min(0.05, (ts - trackLastTs) / 1000);
  trackLastTs = ts;
  trackElapsed += dt;

  const cfg = SPEED_PRESETS[settings.tracking.speed] || SPEED_PRESETS.slow;
  const mult = settings.tracking.multiplier;
  const w = window.innerWidth;
  const h = window.innerHeight - 60;
  let anyHover = false;

  for (const t of trackTargets) {
    const speed = cfg.speed * mult * t.speedJitter;
    const amp = cfg.amp * mult;
    let cx = w * 0.5;
    let cy = h * t.laneFrac + 20;

    if (settings.tracking.pattern === 'linear') {
      // Bounce horizontally across the screen.
      const period = (w - t.size - 80) / Math.max(20, speed);
      const phase = (trackElapsed / period + t.phase / (Math.PI * 2)) % 2;
      const tri = phase < 1 ? phase : 2 - phase;
      cx = 40 + t.size / 2 + tri * (w - 80 - t.size);
      cy = h * t.laneFrac + 20 + Math.sin(trackElapsed * 1.2 + t.phase) * 10;
    } else if (settings.tracking.pattern === 'sine') {
      const period = (w - t.size - 80) / Math.max(20, speed);
      const phase = (trackElapsed / period + t.phase / (Math.PI * 2)) % 2;
      const tri = phase < 1 ? phase : 2 - phase;
      cx = 40 + t.size / 2 + tri * (w - 80 - t.size);
      cy = h * t.laneFrac + 20 + Math.sin(trackElapsed * speed * 0.012 + t.phase) * amp;
    } else if (settings.tracking.pattern === 'figure8') {
      const a = trackElapsed * speed * 0.008 + t.phase;
      cx = w * 0.5 + Math.sin(a) * (w * 0.36);
      cy = h * 0.5 + Math.sin(a * 2) * (h * 0.32);
    } else if (settings.tracking.pattern === 'orbit') {
      const a = trackElapsed * speed * 0.008 + t.phase;
      cx = w * 0.5 + Math.cos(a) * (w * 0.34);
      cy = h * 0.5 + Math.sin(a) * (h * 0.34);
    }

    cx = Math.max(t.size / 2 + 6, Math.min(w - t.size / 2 - 6, cx));
    cy = Math.max(t.size / 2 + 6, Math.min(h - t.size / 2 + 20, cy));

    t.x = cx;
    t.y = cy;
    t.el.style.left = (cx - t.size / 2) + 'px';
    t.el.style.top = (cy - t.size / 2) + 'px';

    const dx = trackPointer.x - cx;
    const dy = trackPointer.y - cy;
    const inside = Math.hypot(dx, dy) <= t.size / 2;
    t.el.classList.toggle('hovered', inside);
    if (inside) anyHover = true;
  }

  if (anyHover) {
    trackOnTime += dt;
    trackStreak += dt;
    if (trackStreak > trackBestStreak) trackBestStreak = trackStreak;
    // 30 points/sec while on target.
    score += dt * 30;
    scoreEl.textContent = String(Math.floor(score));
  } else {
    if (trackStreak > 0) flashMiss();
    trackStreak = 0;
  }

  const pct = trackElapsed > 0 ? Math.round((trackOnTime / trackElapsed) * 100) : 0;
  accVal.textContent = pct + '%';

  trackRaf = requestAnimationFrame(trackLoop);
}

function endGame() {
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(countdownInterval);
  cancelAnimationFrame(trackRaf);
  cancelAnimationFrame(threeRaf);

  arena.innerHTML = '';
  arena.onclick = null;
  arena.classList.remove('mode-threeD');
  arena.removeEventListener('mousemove', onTrackMove);
  arena.removeEventListener('mouseleave', onTrackLeave);

  trackTargets = [];
  threeTargets = [];

  targetTimeouts.forEach(t => clearTimeout(t));
  targetTimeouts.clear();

  document.getElementById('end-mode-tag').textContent = currentMode === 'threeD' ? '3d mode' : currentMode + ' mode';
  document.getElementById('final-score').textContent = Math.floor(score);

  const classicStats = document.getElementById('final-stats');
  const trackStatsRow = document.getElementById('track-stats');

  if (currentMode === 'tracking') {
    classicStats.style.display = 'none';
    if (trackStatsRow) trackStatsRow.style.display = '';
    document.getElementById('final-track-time').textContent = trackOnTime.toFixed(1) + 's';
    const pct = trackElapsed > 0 ? Math.round((trackOnTime / trackElapsed) * 100) : 0;
    document.getElementById('final-track-pct').textContent = pct + '%';
    document.getElementById('final-track-streak').textContent = trackBestStreak.toFixed(1) + 's';
  } else {
    classicStats.style.display = '';
    if (trackStatsRow) trackStatsRow.style.display = 'none';
    document.getElementById('final-hits').textContent = hits;
    document.getElementById('final-misses').textContent = misses;
    const total = hits + misses;
    document.getElementById('final-acc').textContent = total > 0 ? Math.round((hits / total) * 100) + '%' : '—';
  }

  endScreen.classList.remove('hidden');
}

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
  // Aim trainer misses no longer use a full-screen color flash.
  if (missFlash) missFlash.style.opacity = '0';
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
