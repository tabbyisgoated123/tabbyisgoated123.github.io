const typingField = document.getElementById('typing-field');
const scoreEl = document.getElementById('score-display');
const timerBar = document.getElementById('timer-bar');
const timerDisp = document.getElementById('timer-display');
const missFlash = document.getElementById('miss-flash');
const endScreen = document.getElementById('end-screen');
const startScreen = document.getElementById('start-screen');
const inputEl = document.createElement('input');
const livesDisplay = document.getElementById('lives-display');
const bestDisplay = document.getElementById('best-display');
const comboDisplay = document.getElementById('combo-display');
const finalBest = document.getElementById('final-best');
const finalHigh = document.getElementById('final-high');
const startBest = document.getElementById('start-best');

const DUR_MAP = { 1: 30, 2: 60, 3: 90, 4: 120, 5: 180 };
const SPAWN_MAP = { 1: 2400, 2: 1800, 3: 1350, 4: 1000, 5: 760 };
const SPEED_MAP = { 1: 0.65, 2: 0.9, 3: 1.15, 4: 1.45, 5: 1.8 };
const TIER_WORDS = {
  1: ['cat', 'code', 'play', 'word', 'tap', 'drop', 'game', 'fast'],
  2: ['typing', 'planet', 'signal', 'button', 'cursor', 'streak', 'letter', 'window'],
  3: ['rhythm', 'velocity', 'capture', 'pattern', 'glimmer', 'module', 'target', 'gravity'],
  4: ['spectrum', 'cascade', 'terminal', 'lantern', 'midnight', 'preview', 'starlight', 'wildcard'],
  5: ['transcendent', 'interleaving', 'overclocked', 'synchrony', 'hyperactive', 'metronome', 'cataclysmic'],
};
const DEFAULT_BANKS = {
  classic: ['cat', 'code', 'play', 'word', 'tap', 'drop', 'game', 'fast', 'glow', 'trail', 'target', 'combo', 'score', 'pulse'],
  tech: ['kernel', 'buffer', 'syntax', 'runtime', 'module', 'packet', 'cursor', 'render', 'thread', 'socket', 'compile', 'deploy'],
  chaos: ['starlight', 'interlocked', 'hyperdrift', 'whirlwind', 'catapult', 'moonbeam', 'electric', 'turbulence', 'ghosting', 'outburst'],
};

const state = {
  durKey: 2,
  lives: 3,
  spawnKey: 2,
  speedKey: 2,
  tierKey: 1,
  maxWords: 4,
  bank: 'classic',
  customWords: [],
};

let gameActive = false;
let countdownInterval = null;
let spawnInterval = null;
let difficultyInterval = null;
let rafId = null;
let wordId = 1;
let score = 0;
let typed = 0;
let missed = 0;
let combo = 0;
let lives = 3;
let timeLeft = 0;
let activeWords = [];
let progress = 0;
let currentBank = [];
let highScore = 0;

const bankEl = document.getElementById('word-bank');
const durSlider = document.getElementById('dur-slider');
const livesSlider = document.getElementById('lives-slider');
const spawnSlider = document.getElementById('spawn-slider');
const speedSlider = document.getElementById('speed-slider');
const tierSlider = document.getElementById('tier-slider');
const maxSlider = document.getElementById('max-slider');

const fieldRectCache = { width: 0, height: 0 };

function setUiValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function applyWordBankPreset(name) {
  state.bank = name;
  document.querySelectorAll('.pill').forEach(btn => btn.classList.toggle('active', btn.dataset.bank === name));
  if (name === 'custom') {
    currentBank = parseBankText(bankEl.value);
  } else {
    currentBank = DEFAULT_BANKS[name].slice();
    bankEl.value = currentBank.join('\n');
  }
}

function parseBankText(text) {
  return String(text || '')
    .split(/[\n,]/g)
    .map(word => word.trim())
    .filter(Boolean)
    .map(word => word.toLowerCase().replace(/[^a-z0-9' -]/g, ''))
    .filter(Boolean);
}

function rebuildCurrentBank() {
  const custom = parseBankText(bankEl.value);
  state.customWords = custom;
  if (state.bank === 'custom' && custom.length) {
    currentBank = custom;
  } else if (state.bank === 'custom' && !custom.length) {
    currentBank = DEFAULT_BANKS.classic.slice();
  } else {
    currentBank = (DEFAULT_BANKS[state.bank] || DEFAULT_BANKS.classic).slice();
  }
}

function refreshProfileHighScore() {
  const profile = window.TabbyProfiles?.getActiveProfile?.();
  const gameStats = profile?.gameStats?.tabbyTyping || {};
  highScore = Number(gameStats.highScore || 0);
  bestDisplay.textContent = String(highScore);
  finalHigh.textContent = String(highScore);
  if (startBest) startBest.textContent = String(highScore);
}

function loadUi() {
  setUiValue('dur-val', DUR_MAP[state.durKey] + ' s');
  setUiValue('lives-val', String(state.lives));
  setUiValue('spawn-val', labelForSpawn(state.spawnKey));
  setUiValue('speed-val', labelForSpeed(state.speedKey));
  setUiValue('tier-val', String(state.tierKey));
  setUiValue('max-val', String(state.maxWords));
  bankEl.value = DEFAULT_BANKS.classic.join('\n');
  currentBank = DEFAULT_BANKS.classic.slice();
}

function labelForSpawn(key) {
  return { 1: 'Slow', 2: 'Medium', 3: 'Quick', 4: 'Fast', 5: 'Frenzy' }[key] || 'Medium';
}

function labelForSpeed(key) {
  return { 1: 'Easy', 2: 'Medium', 3: 'Fast', 4: 'Hard', 5: 'Insane' }[key] || 'Medium';
}

durSlider.addEventListener('input', () => {
  state.durKey = +durSlider.value;
  setUiValue('dur-val', DUR_MAP[state.durKey] + ' s');
});

livesSlider.addEventListener('input', () => {
  state.lives = +livesSlider.value;
  setUiValue('lives-val', String(state.lives));
});

spawnSlider.addEventListener('input', () => {
  state.spawnKey = +spawnSlider.value;
  setUiValue('spawn-val', labelForSpawn(state.spawnKey));
});

speedSlider.addEventListener('input', () => {
  state.speedKey = +speedSlider.value;
  setUiValue('speed-val', labelForSpeed(state.speedKey));
});

tierSlider.addEventListener('input', () => {
  state.tierKey = +tierSlider.value;
  setUiValue('tier-val', String(state.tierKey));
});

maxSlider.addEventListener('input', () => {
  state.maxWords = +maxSlider.value;
  setUiValue('max-val', String(state.maxWords));
});

bankEl.addEventListener('input', () => {
  state.bank = 'custom';
  document.querySelectorAll('.pill').forEach(btn => btn.classList.toggle('active', btn.dataset.bank === 'custom'));
  rebuildCurrentBank();
});

document.querySelectorAll('.pill').forEach(btn => {
  btn.addEventListener('click', () => {
    applyWordBankPreset(btn.dataset.bank);
  });
});

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('menu-btn').addEventListener('click', () => {
  endScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
});

document.addEventListener('tabby-profile-change', () => {
  refreshProfileHighScore();
  finalHigh.textContent = String(highScore);
  if (startBest) startBest.textContent = String(highScore);
});

inputEl.id = 'typing-input';
inputEl.type = 'text';
inputEl.autocomplete = 'off';
inputEl.spellcheck = false;
inputEl.placeholder = 'type here to submit';
inputEl.addEventListener('input', () => {
  if (!gameActive) return;
  checkTypedWord(false);
});
inputEl.addEventListener('keydown', ev => {
  if (!gameActive) return;
  if (ev.key === 'Enter') {
    ev.preventDefault();
    checkTypedWord(true);
  } else if (ev.key === 'Backspace' && inputEl.value.length > 0) {
    ev.preventDefault();
    inputEl.value = '';
  } else if (ev.key === 'Escape') {
    inputEl.value = '';
  }
});

function mountInput() {
  if (document.querySelector('.typing-input-wrap')) return;
  const wrap = document.createElement('div');
  wrap.className = 'typing-input-wrap';
  wrap.innerHTML = '<label for="typing-input">Type the falling word</label>';
  wrap.appendChild(inputEl);
  document.body.appendChild(wrap);
}

function startGame() {
  mountInput();
  refreshProfileHighScore();
  rebuildCurrentBank();

  score = 0;
  typed = 0;
  missed = 0;
  combo = 0;
  lives = state.lives;
  timeLeft = DUR_MAP[state.durKey];
  progress = 0;
  wordId = 1;

  activeWords = [];
  typingField.innerHTML = '';
  inputEl.value = '';
  inputEl.disabled = false;
  inputEl.focus();

  document.getElementById('typing-stats').style.display = 'grid';
  document.getElementById('lives-display').textContent = String(lives);
  document.getElementById('combo-display').textContent = '0';
  scoreEl.textContent = '0';
  bestDisplay.textContent = String(highScore);
  finalHigh.textContent = String(highScore);

  timerBar.style.transition = 'none';
  timerBar.style.width = '100%';
  requestAnimationFrame(() => {
    timerBar.style.transition = 'width 1s linear';
  });
  timerDisp.textContent = timeLeft + ' s';

  clearInterval(countdownInterval);
  clearInterval(spawnInterval);
  clearInterval(difficultyInterval);
  cancelAnimationFrame(rafId);

  startScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  gameActive = true;

  spawnInitialWords();
  spawnInterval = setInterval(() => {
    if (!gameActive) return;
    spawnWord();
  }, SPAWN_MAP[state.spawnKey]);

  difficultyInterval = setInterval(() => {
    if (!gameActive) return;
    progress++;
    if (progress % 3 === 0) {
      state.tierKey = Math.min(5, state.tierKey + 1);
      tierSlider.value = state.tierKey;
      setUiValue('tier-val', String(state.tierKey));
    }
    if (progress % 4 === 0) {
      state.spawnKey = Math.min(5, state.spawnKey + 1);
      spawnSlider.value = state.spawnKey;
      setUiValue('spawn-val', labelForSpawn(state.spawnKey));
      clearInterval(spawnInterval);
      spawnInterval = setInterval(() => {
        if (!gameActive) return;
        spawnWord();
      }, SPAWN_MAP[state.spawnKey]);
    }
    if (progress % 5 === 0) {
      state.speedKey = Math.min(5, state.speedKey + 1);
      speedSlider.value = state.speedKey;
      setUiValue('speed-val', labelForSpeed(state.speedKey));
    }
  }, 8000);

  countdownInterval = setInterval(() => {
    timeLeft--;
    timerDisp.textContent = timeLeft + ' s';
    timerBar.style.width = `${(timeLeft / DUR_MAP[state.durKey]) * 100}%`;
    if (timeLeft <= 0) endGame();
  }, 1000);

  rafId = requestAnimationFrame(gameLoop);
}

function spawnInitialWords() {
  const count = Math.min(state.maxWords, 3);
  for (let i = 0; i < count; i++) spawnWord();
}

function pickWord() {
  const tier = Math.min(5, Math.max(1, state.tierKey + Math.floor(score / 5)));
  const pool = (state.bank === 'custom' && currentBank.length ? currentBank : (DEFAULT_BANKS[state.bank] || DEFAULT_BANKS.classic)).slice();
  const tierWords = TIER_WORDS[tier] || TIER_WORDS[1];
  const mix = pool.concat(tierWords);
  return mix[Math.floor(Math.random() * mix.length)];
}

function spawnWord() {
  if (!gameActive) return;
  const alive = activeWords.filter(word => !word.dead).length;
  if (alive >= state.maxWords) return;

  const text = pickWord();
  const word = {
    id: wordId++,
    text,
    x: Math.random() * Math.max(100, window.innerWidth - 200),
    y: -80,
    baseSpeed: SPEED_MAP[state.speedKey],
    speed: SPEED_MAP[state.speedKey] + Math.min(1.8, score * 0.018),
    drift: (Math.random() - 0.5) * 0.2,
    dead: false,
    matched: false,
  };
  activeWords.push(word);

  const el = document.createElement('div');
  el.className = 'typing-word';
  el.dataset.wordId = String(word.id);
  el.innerHTML = `<span class="typing-word-text">${word.text}</span>`;
  typingField.appendChild(el);
  word.el = el;
  positionWord(word);
}

function positionWord(word) {
  if (!word.el) return;
  word.el.style.transform = `translate(${word.x}px, ${word.y}px)`;
}

function gameLoop() {
  if (!gameActive) return;
  for (const word of activeWords) {
    if (word.dead) continue;
    word.speed = word.baseSpeed + Math.min(2.6, score * 0.02 + progress * 0.06);
    word.y += word.speed;
    word.x += word.drift * word.speed;
    if (word.x < 10) {
      word.x = 10;
      word.drift *= -1;
    }
    const maxX = Math.max(10, window.innerWidth - 160);
    if (word.x > maxX) {
      word.x = maxX;
      word.drift *= -1;
    }
    positionWord(word);
    if (word.y > window.innerHeight - 180) {
      handleMiss(word);
    }
  }
  rafId = requestAnimationFrame(gameLoop);
}

function checkTypedWord(forceSubmit) {
  if (!gameActive) return;
  const typedText = inputEl.value.trim().toLowerCase();
  if (!typedText) return;

  const matches = activeWords.filter(item => !item.dead && item.text.toLowerCase() === typedText);
  if (matches.length) {
    const comboStart = combo;
    inputEl.value = '';
    matches.forEach((word, index) => resolveWord(word, comboStart + index));
    combo += matches.length;
    updateLivesAndStats();
    maybeUpdateHighScore();
    return;
  }

  if (forceSubmit) {
    missPenalty(true);
    inputEl.value = '';
  }
}

function resolveWord(word, comboSnapshot = combo) {
  if (word.dead) return;
  word.dead = true;
  typed++;
  const points = 10 + Math.floor(comboSnapshot / 3);
  score += points;
  updateScore();
  spawnSuccessEffect(word, points);
  word.el?.remove();
  activeWords = activeWords.filter(item => item.id !== word.id);
  burstAt(word.x, word.y);
}

function handleMiss(word) {
  if (word.dead) return;
  word.dead = true;
  word.el?.remove();
  activeWords = activeWords.filter(item => item.id !== word.id);
  missed++;
  combo = 0;
  missPenalty(false);
  updateLivesAndStats();
  flashMiss();
  if (lives <= 0) endGame();
}

function missPenalty(isWrongSubmit) {
  score = Math.max(0, score - (isWrongSubmit ? 3 : 2));
  lives = Math.max(0, lives - 1);
  updateScore();
  combo = 0;
  document.getElementById('combo-display').textContent = '0';
}

function updateScore() {
  scoreEl.textContent = String(score);
  scoreEl.classList.remove('pop');
  void scoreEl.offsetWidth;
  scoreEl.classList.add('pop');
  setTimeout(() => scoreEl.classList.remove('pop'), 120);
}

function updateLivesAndStats() {
  livesDisplay.textContent = String(lives);
  comboDisplay.textContent = String(combo);
}

function maybeUpdateHighScore() {
  if (!window.TabbyProfiles?.setProfileGameStat) return;
  if (score > highScore) {
    highScore = score;
    finalHigh.textContent = String(highScore);
    bestDisplay.textContent = String(highScore);
    window.TabbyProfiles.setProfileGameStat('tabbyTyping', { highScore });
  }
}

function spawnSuccessEffect(word, points) {
  const el = document.createElement('div');
  el.className = 'typing-fly';
  el.textContent = `+${points}`;
  el.style.left = `${word.x}px`;
  el.style.top = `${word.y}px`;
  document.body.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });

  const tiny = document.createElement('div');
  tiny.className = 'typing-float';
  tiny.textContent = 'GOOD';
  tiny.style.left = `${word.x + 10}px`;
  tiny.style.top = `${word.y + 12}px`;
  document.body.appendChild(tiny);
  tiny.addEventListener('animationend', () => tiny.remove(), { once: true });
}

function burstAt(x, y) {
  const burst = document.createElement('div');
  burst.className = 'typing-burst';
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;
  burst.style.width = '70px';
  burst.style.height = '70px';
  document.body.appendChild(burst);
  burst.addEventListener('animationend', () => burst.remove(), { once: true });
}

function flashMiss() {
  missFlash.style.opacity = '1';
  setTimeout(() => (missFlash.style.opacity = '0'), 90);
}

function endGame() {
  gameActive = false;
  clearInterval(countdownInterval);
  clearInterval(spawnInterval);
  clearInterval(difficultyInterval);
  cancelAnimationFrame(rafId);
  inputEl.disabled = true;
  typingField.innerHTML = '';
  activeWords = [];

  if (score > highScore) {
    highScore = score;
    window.TabbyProfiles?.setProfileGameStat?.('tabbyTyping', { highScore });
  }

  document.getElementById('end-mode-tag').textContent = 'typing mode';
  document.getElementById('final-score').textContent = String(score);
  document.getElementById('final-typed').textContent = String(typed);
  document.getElementById('final-missed').textContent = String(missed);
  const total = typed + missed;
  document.getElementById('final-acc').textContent = total > 0 ? Math.round((typed / total) * 100) + '%' : '—';
  finalBest.textContent = String(highScore);
  finalHigh.textContent = String(highScore);
  endScreen.classList.remove('hidden');
}

window.addEventListener('resize', () => {
  fieldRectCache.width = window.innerWidth;
  fieldRectCache.height = window.innerHeight;
  for (const word of activeWords) positionWord(word);
});

loadUi();
refreshProfileHighScore();
