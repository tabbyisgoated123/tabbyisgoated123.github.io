const timerBar = document.getElementById('timer-bar');
const timerDisp = document.getElementById('timer-display');
const endScreen = document.getElementById('end-screen');
const startScreen = document.getElementById('start-screen');
const cpsDisp = document.getElementById('cps-display');

const DUR_MAP = { 1: 5, 2: 10, 3: 15, 4: 30, 5: 60 };

const durSlider = document.getElementById('dur-slider');
const durVal = document.getElementById('dur-val');

let durKey = 1;
let timeLeft = 0;
let gameActive = false;
let countdownInterval = null;
let cpsSurfaceHandler = null;
let cpsClicks = 0;
let cpsWindowClicks = [];
let cpsPeak = 0;
let liveInterval = null;
let clickCombo = 0;
let lastClickAt = 0;
let cpsTimeline = [];

durSlider.addEventListener('input', () => {
  durKey = +durSlider.value;
  durVal.textContent = DUR_MAP[durKey] + ' s';
});

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('menu-btn').addEventListener('click', () => {
  endScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  window.TabbyFX?.setGameplay?.(false);
});

function startGame() {
  window.TabbyFX?.setGameplay?.(true);
  cpsClicks = 0;
  cpsWindowClicks = [];
  cpsPeak = 0;
  clickCombo = 0;
  lastClickAt = 0;
  cpsTimeline = [];
  timeLeft = DUR_MAP[durKey];

  cpsDisp.textContent = '0.0';
  timerBar.style.transition = 'none';
  timerBar.style.width = '100%';
  requestAnimationFrame(() => {
    timerBar.style.transition = 'width 1s linear';
  });
  timerDisp.textContent = timeLeft + ' s';

  clearInterval(countdownInterval);
  clearInterval(liveInterval);
  if (cpsSurfaceHandler) {
    document.removeEventListener('pointerdown', cpsSurfaceHandler, true);
    cpsSurfaceHandler = null;
  }

  startScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  gameActive = true;

  document.getElementById('cps-hud').style.display = 'block';
  startCPS();

  countdownInterval = setInterval(() => {
    timeLeft--;
    timerDisp.textContent = timeLeft + ' s';
    timerBar.style.width = `${(timeLeft / DUR_MAP[durKey]) * 100}%`;
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function startCPS() {
  cpsSurfaceHandler = e => {
    if (!gameActive) return;
    if (e.target && e.target.closest && e.target.closest('.profile-dock')) return;
    if (e.target && e.target.closest && e.target.closest('.profile-home-link')) return;
    if (e.button !== undefined && e.button !== 0) return;

    cpsClicks++;

    const now = performance.now();
    clickCombo = now - lastClickAt < 220 ? clickCombo + 1 : 1;
    lastClickAt = now;
    cpsWindowClicks.push(now);
    const cutoff = now - 1000;
    while (cpsWindowClicks.length && cpsWindowClicks[0] < cutoff) cpsWindowClicks.shift();
    const liveCPS = cpsWindowClicks.length;
    if (liveCPS > cpsPeak) cpsPeak = liveCPS;
    cpsDisp.textContent = liveCPS.toFixed(1);
    cpsTimeline.push({ t: now, cps: liveCPS });
    if (window.TabbyFX) {
      window.TabbyFX.beep(440 + Math.min(500, clickCombo * 10), 0.02, 'triangle', 0.012);
      if (clickCombo > 0 && clickCombo % 15 === 0) window.TabbyFX.unlock('cps_combo_' + clickCombo, 'Click combo x' + clickCombo);
    }

    const ring = document.createElement('div');
    ring.className = 'cps-ring';
    ring.style.left = `${e.clientX}px`;
    ring.style.top = `${e.clientY}px`;
    document.body.appendChild(ring);
    ring.addEventListener('animationend', () => ring.remove(), { once: true });

    spawnHitEffect(e.clientX, e.clientY);
  };

  document.addEventListener('pointerdown', cpsSurfaceHandler, true);

  liveInterval = setInterval(() => {
    if (!gameActive) return;
    const now = performance.now();
    const cutoff = now - 1000;
    while (cpsWindowClicks.length && cpsWindowClicks[0] < cutoff) cpsWindowClicks.shift();
    cpsDisp.textContent = cpsWindowClicks.length.toFixed(1);
  }, 100);
}

function endGame() {
  window.TabbyFX?.setGameplay?.(false);
  gameActive = false;
  clearInterval(countdownInterval);
  clearInterval(liveInterval);
  if (cpsSurfaceHandler) {
    document.removeEventListener('pointerdown', cpsSurfaceHandler, true);
    cpsSurfaceHandler = null;
  }
  document.getElementById('cps-hud').style.display = 'none';

  document.getElementById('end-mode-tag').textContent = 'cps mode';
  document.getElementById('final-score').textContent = cpsClicks;
  document.getElementById('final-clicks').textContent = cpsClicks;
  document.getElementById('final-peak').textContent = cpsPeak.toFixed(1);
  document.getElementById('final-avg').textContent = (cpsClicks / DUR_MAP[durKey]).toFixed(1);
  drawCpsGraph();
  if (window.TabbyFX) {
    window.TabbyFX.setHighScore('cps', cpsClicks);
    if (cpsPeak >= 12) window.TabbyFX.unlock('cps_peak_12', '12 CPS peak');
  }

  endScreen.classList.remove('hidden');
}

function drawCpsGraph() {
  let canvas = document.getElementById('cps-graph');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'cps-graph';
    canvas.width = 360;
    canvas.height = 120;
    canvas.style.marginTop = '14px';
    canvas.style.border = '1px solid rgba(255,255,255,0.2)';
    document.getElementById('end-screen').appendChild(canvas);
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!cpsTimeline.length) return;
  const minT = cpsTimeline[0].t;
  const maxT = cpsTimeline[cpsTimeline.length - 1].t || minT + 1;
  const peak = Math.max(1, ...cpsTimeline.map(p => p.cps));
  ctx.strokeStyle = 'rgba(255,70,70,0.95)';
  ctx.beginPath();
  cpsTimeline.forEach((p, i) => {
    const x = ((p.t - minT) / (maxT - minT)) * (canvas.width - 8) + 4;
    const y = canvas.height - ((p.cps / peak) * (canvas.height - 12) + 6);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
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
