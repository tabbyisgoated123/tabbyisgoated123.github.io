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
const THREE_SPEED = { 1: 1.4, 2: 2.2, 3: 3.1, 4: 4.2, 5: 5.8 };
const THREE_TARGET_SIZE = { 1: 0.24, 2: 0.34, 3: 0.48 };
const THREE_WORLD_LIMIT = 18;
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
  reaction: { durKey: 2 },
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
wire('reaction-dur-slider', 'reaction-dur-val', v => {
  settings.reaction.durKey = v;
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
document.getElementById('btn-reaction').addEventListener('click', () => switchMode('reaction'));

document.querySelectorAll('.cross-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.cross-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.body.dataset.aimCross = btn.dataset.cross || 'ring';
  });
});

function switchMode(m) {
  currentMode = m;
  ['classic', 'tracking', 'threeD', 'reaction'].forEach(n => {
    document.getElementById('btn-' + n).classList.toggle('active', n === m);
    document.getElementById(n + '-settings').classList.toggle('is-hidden', n !== m);
  });
  const shapeSettings = document.getElementById('shape-settings');
  if (shapeSettings) shapeSettings.classList.toggle('is-hidden', m === 'threeD' || m === 'reaction');
}

let score = 0;
let hits = 0;
let misses = 0;
let timeLeft = 0;
let gameActive = false;
let combo = 0;
let bestCombo = 0;
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
let threeState = null;
let reactionPending = false;
let reactionSpawnAt = 0;
let reactionTimes = [];
let reactionTimerId = null;

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

  destroyThreeDScene();
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
  threeTargets.forEach(t => t.el?.remove?.());
  threeTargets = [];
  trackElapsed = 0;
  trackOnTime = 0;
  trackStreak = 0;
  trackBestStreak = 0;
  threeElapsed = 0;
  reactionPending = false;
  reactionSpawnAt = 0;
  reactionTimes = [];
  clearTimeout(reactionTimerId);
  combo = 0;
  bestCombo = 0;

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
    } else if (currentMode === 'threeD') {
      modeLbl.textContent = '// 3d mode — capsule targets';
      if (accuracyLabel) accuracyLabel.textContent = 'accuracy';
      startThreeD();
    } else {
      modeLbl.textContent = '// reaction mode — click instantly';
      if (accuracyLabel) accuracyLabel.textContent = 'avg ms';
      startReaction();
    }
  }

  if (!gameActive) return;
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
  const drift = { x: (Math.random() - 0.5) * 0.9, y: (Math.random() - 0.5) * 0.9 };
  let driftId = requestAnimationFrame(function move() {
    if (!gameActive || !btn.parentNode) return;
    const left = parseFloat(btn.style.left || '0') + drift.x;
    const top = parseFloat(btn.style.top || '0') + drift.y;
    btn.style.left = Math.max(6, Math.min(window.innerWidth - size - 6, left)) + 'px';
    btn.style.top = Math.max(6, Math.min(window.innerHeight - size - 6, top)) + 'px';
    driftId = requestAnimationFrame(move);
  });

  const lifetime = Math.max(750, 2000 - settings.classic.maxTargets * 110);
  const to = setTimeout(() => {
    if (btn.parentNode && !btn.classList.contains('dying')) {
      btn.classList.add('dying');
      misses++;
      combo = 0;
      updateAcc();
      flashMiss();
      btn.addEventListener('animationend', () => btn.remove(), { once: true });
      targetTimeouts.delete(btn);
      cancelAnimationFrame(driftId);
    }
  }, lifetime);
  targetTimeouts.set(btn, to);

  btn.addEventListener('click', e => {
    if (!gameActive || btn.classList.contains('dying')) return;
    clearTimeout(targetTimeouts.get(btn));
    targetTimeouts.delete(btn);
    score++;
    hits++;
    combo++;
    if (combo > bestCombo) bestCombo = combo;
    score += Math.floor(combo / 5);
    updateScore();
    updateAcc();
    spawnHitEffect(e.clientX, e.clientY);
    if (window.TabbyFX) {
      window.TabbyFX.beep(880 + Math.min(300, combo * 12), 0.03, 'square', 0.018);
      if (combo > 0 && combo % 8 === 0) window.TabbyFX.unlock('aim_combo_' + combo, 'Aim combo x' + combo);
    }
    btn.classList.add('dying');
    btn.style.pointerEvents = 'none';
    btn.addEventListener('animationend', () => btn.remove(), { once: true });
    cancelAnimationFrame(driftId);
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
  if (!window.THREE) {
    modeLbl.textContent = '// 3d engine unavailable';
    const errBtn = document.createElement('button');
    errBtn.type = 'button';
    errBtn.className = 'three-error';
    errBtn.textContent = '3D engine failed to load';
    errBtn.addEventListener('click', () => {
      arena.innerHTML = '';
      arena.classList.remove('mode-threeD');
      startScreen.classList.remove('hidden');
    }, { once: true });
    arena.appendChild(errBtn);
    gameActive = false;
    clearInterval(countdownInterval);
    return;
  }

  setupThreeDScene();
  for (let i = 0; i < settings.threeD.count; i++) spawnThreeDTarget(i);
  threeLastTs = 0;
  threeRaf = requestAnimationFrame(threeLoop);
}

function startReaction() {
  arena.onclick = e => {
    if (!gameActive || e.target !== arena) return;
    if (reactionPending) {
      misses++;
      updateAcc();
      flashMiss();
    }
  };
  scheduleReactionTarget();
}

function scheduleReactionTarget() {
  reactionPending = true;
  clearTimeout(reactionTimerId);
  reactionTimerId = setTimeout(() => {
    if (!gameActive || currentMode !== 'reaction') return;
    reactionPending = false;
    spawnReactionTarget();
  }, 600 + Math.random() * 1500);
}

function spawnReactionTarget() {
  const size = 44;
  const x = Math.random() * (window.innerWidth - 100) + 50;
  const y = Math.random() * (window.innerHeight - 140) + 70;
  const btn = document.createElement('button');
  btn.className = 'target shape-circle';
  btn.style.cssText = `width:${size}px;height:${size}px;left:${x - size / 2}px;top:${y - size / 2}px;`;
  arena.appendChild(btn);
  reactionSpawnAt = performance.now();
  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (!gameActive) return;
    const rt = performance.now() - reactionSpawnAt;
    reactionTimes.push(rt);
    hits++;
    score += Math.max(1, Math.round(300 / Math.max(80, rt)));
    updateScore();
    const avg = reactionTimes.length ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0;
    accVal.textContent = avg ? `${avg} ms` : '—';
    if (window.TabbyFX) window.TabbyFX.beep(980, 0.03, 'square', 0.02);
    btn.remove();
    scheduleReactionTarget();
  }, { once: true });
}

function setupThreeDScene() {
  destroyThreeDScene();

  const THREE = window.THREE;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff1a1a';
  const accentColor = new THREE.Color(accent);
  const dimAccent = accentColor.clone().multiplyScalar(0.22);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  scene.fog = new THREE.FogExp2(0x050505, 0.035);

  const camera = new THREE.PerspectiveCamera(76, window.innerWidth / window.innerHeight, 0.05, 95);
  camera.position.set(0, 1.7, 9);
  camera.rotation.order = 'YXZ';

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = 'three-aim-canvas';
  arena.appendChild(renderer.domElement);

  const raycaster = new THREE.Raycaster();
  const keys = new Set();
  threeState = {
    scene,
    camera,
    renderer,
    raycaster,
    keys,
    yaw: 0,
    pitch: 0,
    accentColor,
    targetMaterial: null,
    targetWireMaterial: null,
    onResize: null,
    onMouseMove: null,
    onPointerDown: null,
    onKeyDown: null,
    onKeyUp: null,
  };

  buildThreeDArena(dimAccent, accentColor);

  threeState.onResize = () => {
    if (!threeState) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  threeState.onMouseMove = e => {
    if (!gameActive || currentMode !== 'threeD' || document.pointerLockElement !== arena) return;
    threeState.yaw -= e.movementX * 0.0024;
    threeState.pitch -= e.movementY * 0.0024;
    threeState.pitch = Math.max(-1.38, Math.min(1.38, threeState.pitch));
    camera.rotation.set(threeState.pitch, threeState.yaw, 0);
  };
  threeState.onPointerDown = e => {
    if (!gameActive || currentMode !== 'threeD') return;
    if (e.target && e.target.closest && e.target.closest('.profile-dock')) return;
    if (document.pointerLockElement !== arena) {
      arena.requestPointerLock?.();
      return;
    }
    shootThreeD(e.clientX, e.clientY);
  };
  threeState.onKeyDown = e => {
    if (!gameActive || currentMode !== 'threeD') return;
    keys.add(e.code);
  };
  threeState.onKeyUp = e => keys.delete(e.code);

  window.addEventListener('resize', threeState.onResize);
  document.addEventListener('mousemove', threeState.onMouseMove);
  document.addEventListener('keydown', threeState.onKeyDown);
  document.addEventListener('keyup', threeState.onKeyUp);
  arena.addEventListener('pointerdown', threeState.onPointerDown);
}

function buildThreeDArena(dimAccent, accentColor) {
  const THREE = window.THREE;
  const { scene } = threeState;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x080000, 1.45));

  const key = new THREE.PointLight(accentColor, 7, 34);
  key.position.set(-6, 8, 8);
  scene.add(key);
  const back = new THREE.PointLight(0xffffff, 1.2, 26);
  back.position.set(7, 4, -10);
  scene.add(back);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 44),
    new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.68,
      metalness: 0.18,
      emissive: 0x110000,
      emissiveIntensity: 0.28,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const grid = new THREE.GridHelper(44, 44, accentColor, dimAccent);
  grid.material.transparent = true;
  grid.material.opacity = 0.78;
  scene.add(grid);

  const wallMaterial = new THREE.LineBasicMaterial({ color: dimAccent, transparent: true, opacity: 0.32 });
  for (const z of [-22, 22]) {
    const wall = new THREE.GridHelper(44, 22, dimAccent, dimAccent);
    wall.material = wallMaterial.clone();
    wall.rotation.x = Math.PI / 2;
    wall.position.z = z;
    wall.position.y = 11;
    scene.add(wall);
  }
  for (const x of [-22, 22]) {
    const wall = new THREE.GridHelper(44, 22, dimAccent, dimAccent);
    wall.material = wallMaterial.clone();
    wall.rotation.z = Math.PI / 2;
    wall.position.x = x;
    wall.position.y = 11;
    scene.add(wall);
  }

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(7.5, 0.025, 10, 96),
    new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.28 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.04;
  scene.add(ring);

  threeState.targetMaterial = new THREE.MeshStandardMaterial({
    color: accentColor,
    roughness: 0.36,
    metalness: 0.24,
    emissive: accentColor,
    emissiveIntensity: 0.42,
  });
  threeState.targetWireMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.22,
  });
}

function spawnThreeDTarget(index, target = null) {
  if (!threeState) return;
  const THREE = window.THREE;
  const radius = THREE_TARGET_SIZE[settings.threeD.sizeKey] || THREE_TARGET_SIZE[2];
  const bodyHeight = radius * 2.5;
  const angle = ((settings.threeD.angleDeg % 360) + (index % 2 ? 180 : 0)) * Math.PI / 180;
  const speed = (THREE_SPEED[settings.threeD.speedKey] || THREE_SPEED[3]) * (0.82 + Math.random() * 0.34);
  const distance = 7 + Math.random() * 13;
  const theta = Math.random() * Math.PI * 2;
  const position = new THREE.Vector3(
    Math.cos(theta) * distance,
    1.4 + Math.random() * 3.8,
    Math.sin(theta) * distance
  );

  if (!target) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(radius, bodyHeight, 8, 18),
      threeState.targetMaterial.clone()
    );
    body.userData.targetIndex = index;
    const wire = new THREE.Mesh(
      new THREE.CapsuleGeometry(radius * 1.05, bodyHeight * 1.02, 6, 12),
      threeState.targetWireMaterial
    );
    group.add(body, wire);
    threeState.scene.add(group);
    target = { group, body, wire, velocity: new THREE.Vector3(), phase: 0, lifeLeft: 0, radius };
    threeTargets.push(target);
  }

  target.group.position.copy(position);
  target.group.rotation.set(Math.random() * 0.35, Math.random() * Math.PI, Math.random() * 0.25);
  target.velocity.set(Math.sin(angle) * speed, 0, Math.cos(angle) * speed);
  target.phase = Math.random() * Math.PI * 2;
  target.lifeLeft = 2.2 + Math.random() * 1.25;
  target.radius = radius;
  target.body.scale.setScalar(1);
  target.wire.scale.setScalar(1);
  target.body.userData.target = target;
}

function shootThreeD(cx, cy) {
  if (!threeState) return;
  threeState.raycaster.setFromCamera({ x: 0, y: 0 }, threeState.camera);
  const hits3d = threeState.raycaster.intersectObjects(threeTargets.map(t => t.body), false);
  if (hits3d.length) {
    const target = hits3d[0].object.userData.target;
    score++;
    hits++;
    updateScore();
    updateAcc();
    spawnHitEffect(cx, cy);
    spawnThreeDTarget(threeTargets.indexOf(target), target);
  } else {
    misses++;
    updateAcc();
  }
}

function updateThreeDMovement(dt) {
  if (!threeState) return;
  const THREE = window.THREE;
  const { camera, keys, yaw } = threeState;
  const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const move = new THREE.Vector3();
  if (keys.has('KeyW')) move.add(forward);
  if (keys.has('KeyS')) move.sub(forward);
  if (keys.has('KeyD')) move.add(right);
  if (keys.has('KeyA')) move.sub(right);
  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(7.5 * dt);
    camera.position.add(move);
  }
  camera.position.x = Math.max(-THREE_WORLD_LIMIT, Math.min(THREE_WORLD_LIMIT, camera.position.x));
  camera.position.z = Math.max(-THREE_WORLD_LIMIT, Math.min(THREE_WORLD_LIMIT, camera.position.z));
}

function updateThreeDTargets(dt) {
  const limit = THREE_WORLD_LIMIT + 1;
  for (let i = 0; i < threeTargets.length; i++) {
    const t = threeTargets[i];
    t.lifeLeft -= dt;
    t.group.position.addScaledVector(t.velocity, dt);
    t.group.position.y += Math.sin(threeElapsed * 2.2 + t.phase) * dt * 0.8;
    t.group.position.y = Math.max(1.0, Math.min(5.8, t.group.position.y));
    t.group.rotation.y += dt * 1.4;
    t.group.rotation.z = Math.sin(threeElapsed * 1.9 + t.phase) * 0.16;

    if (Math.abs(t.group.position.x) > limit) {
      t.group.position.x = Math.sign(t.group.position.x) * limit;
      t.velocity.x *= -1;
    }
    if (Math.abs(t.group.position.z) > limit) {
      t.group.position.z = Math.sign(t.group.position.z) * limit;
      t.velocity.z *= -1;
    }
    if (t.lifeLeft <= 0) {
      misses++;
      updateAcc();
      spawnThreeDTarget(i, t);
    }
  }
}

function threeLoop(ts) {
  if (!gameActive || !threeState) return;
  if (!threeLastTs) threeLastTs = ts;
  const dt = Math.min(0.033, (ts - threeLastTs) / 1000);
  threeLastTs = ts;
  threeElapsed += dt;

  updateThreeDMovement(dt);
  updateThreeDTargets(dt);
  scoreEl.textContent = String(Math.floor(score));
  threeState.renderer.render(threeState.scene, threeState.camera);

  threeRaf = requestAnimationFrame(threeLoop);
}

function destroyThreeDScene() {
  if (!threeState) return;
  window.removeEventListener('resize', threeState.onResize);
  document.removeEventListener('mousemove', threeState.onMouseMove);
  document.removeEventListener('keydown', threeState.onKeyDown);
  document.removeEventListener('keyup', threeState.onKeyUp);
  arena.removeEventListener('pointerdown', threeState.onPointerDown);
  if (document.pointerLockElement === arena) document.exitPointerLock?.();
  if (threeState.renderer?.domElement?.parentNode) threeState.renderer.domElement.remove();
  threeTargets = [];
  threeState = null;
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
  clearTimeout(reactionTimerId);
  cancelAnimationFrame(trackRaf);
  cancelAnimationFrame(threeRaf);

  destroyThreeDScene();
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
  if (window.TabbyFX) {
    window.TabbyFX.setHighScore('aim', Math.floor(score));
    if (bestCombo >= 20) window.TabbyFX.unlock('aim_combo20', 'Combo machine');
  }

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
  if (window.TabbyFX) {
    window.TabbyFX.shake();
    window.TabbyFX.beep(180, 0.04, 'sawtooth', 0.02);
  }
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
