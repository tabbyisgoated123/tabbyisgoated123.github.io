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

durSlider.addEventListener('input', () => {
  durKey = +durSlider.value;
  durVal.textContent = DUR_MAP[durKey] + ' s';
});

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('menu-btn').addEventListener('click', () => {
  endScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
});

function startGame() {
  cpsClicks = 0;
  cpsWindowClicks = [];
  cpsPeak = 0;
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
    cpsWindowClicks.push(now);
    const cutoff = now - 1000;
    while (cpsWindowClicks.length && cpsWindowClicks[0] < cutoff) cpsWindowClicks.shift();
    const liveCPS = cpsWindowClicks.length;
    if (liveCPS > cpsPeak) cpsPeak = liveCPS;
    cpsDisp.textContent = liveCPS.toFixed(1);

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

  endScreen.classList.remove('hidden');
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
