(function () {
  'use strict';

  // ─── BOOT SEQUENCE ─────────────────────────
  const bootScreen = document.getElementById('boot-screen');
  const bootLog = document.getElementById('boot-log');
  const bootBar = document.querySelector('.boot-bar-fill');
  const home = document.getElementById('home');

  const bootLines = [
    { t: '> initializing tabby/os         ', s: '[ OK ]', d: 200 },
    { t: '> validating modules            ', s: '[ 4/4 ]', d: 280 },
    { t: '> warming reflex bus            ', s: '[ OK ]', d: 200 },
    { t: '> loading profile cache         ', s: '[ OK ]', d: 220 },
    { t: '> calibrating crosshair         ', s: '[ OK ]', d: 200 },
    { t: '> reading word banks            ', s: '[ OK ]', d: 200 },
    { t: '> arming reactor                ', s: '[ READY ]', d: 320 },
  ];

  let bootIdx = 0;
  function nextBootLine () {
    if (!bootLog) return;
    if (bootIdx >= bootLines.length) {
      bootBar.style.width = '100%';
      setTimeout(finishBoot, 320);
      return;
    }
    const l = bootLines[bootIdx];
    bootLog.innerHTML += `<span class="dim">${l.t}</span> <span class="ok">${l.s}</span>\n`;
    bootIdx += 1;
    bootBar.style.width = `${Math.min(100, (bootIdx / bootLines.length) * 100)}%`;
    setTimeout(nextBootLine, l.d);
  }

  function finishBoot () {
    if (!bootScreen) return;
    bootScreen.classList.add('gone');
    home.setAttribute('aria-hidden', 'false');
    home.classList.add('show');
    setTimeout(() => bootScreen && bootScreen.remove(), 700);
    startTypewriter();
  }

  function skipBoot () {
    if (bootIdx >= bootLines.length) return;
    bootIdx = bootLines.length;
    bootBar.style.width = '100%';
    finishBoot();
  }
  if (bootScreen) bootScreen.addEventListener('click', skipBoot);
  window.addEventListener('keydown', (e) => {
    if (bootScreen && !bootScreen.classList.contains('gone') &&
        (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) skipBoot();
  });

  setTimeout(nextBootLine, 400);

  // ─── TYPEWRITER SUBTITLE ROTATION ─────────────────────────
  const subPhrases = [
    'choose your challenge',
    'sharpen the reflex',
    'no pressure · just glory',
    'click → conquer → repeat',
    'the leaderboard knows',
  ];
  let subI = 0;

  function startTypewriter () {
    const el = document.getElementById('typewriter');
    if (!el) return;
    let phrase = subPhrases[subI];
    let i = 0;
    let deleting = false;

    function tick () {
      if (!deleting) {
        i += 1;
        el.textContent = phrase.slice(0, i);
        if (i === phrase.length) {
          deleting = true;
          setTimeout(tick, 2400);
          return;
        }
        setTimeout(tick, 70);
      } else {
        i -= 1;
        el.textContent = phrase.slice(0, i);
        if (i === 0) {
          deleting = false;
          subI = (subI + 1) % subPhrases.length;
          phrase = subPhrases[subI];
          setTimeout(tick, 220);
          return;
        }
        setTimeout(tick, 28);
      }
    }
    tick();
  }

  // ─── CLOCK ─────────────────────────
  function pad (n) { return String(n).padStart(2, '0'); }
  function tickClock () {
    const d = new Date();
    const t = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    const c = document.getElementById('clock-tag');
    if (c) c.textContent = t;
  }
  setInterval(tickClock, 1000);
  tickClock();

  // ─── SESSION STREAK + STATS ─────────────────────────
  const SESS_KEY = 'tabby_home_sessions_v1';
  const LAST_VISIT_KEY = 'tabby_home_last_visit_v1';
  const STREAK_KEY = 'tabby_home_streak_v1';

  const sessions = parseInt(localStorage.getItem(SESS_KEY) || '0', 10) + 1;
  localStorage.setItem(SESS_KEY, String(sessions));

  // streak: increments if last visit was yesterday, resets if older, stays if today
  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().slice(0, 10);
  const last = localStorage.getItem(LAST_VISIT_KEY);
  let streak = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
  if (last !== todayStr) {
    if (last) {
      const lastDate = new Date(last); lastDate.setHours(0,0,0,0);
      const diffDays = Math.round((today - lastDate) / 86400000);
      if (diffDays === 1) streak += 1;
      else streak = 1;
    } else {
      streak = 1;
    }
    localStorage.setItem(STREAK_KEY, String(streak));
    localStorage.setItem(LAST_VISIT_KEY, todayStr);
  }
  if (streak === 0) streak = 1;

  function animateNum (el, target, dur = 900) {
    const start = performance.now();
    function frame (t) {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Pull peak score across all profiles + games (real data only)
  function readPeakScore () {
    let peak = 0;
    try {
      const raw = localStorage.getItem('tabby_profiles_v1');
      if (raw) {
        const p = JSON.parse(raw);
        for (const prof of (p.profiles || [])) {
          const gs = prof.gameStats || {};
          for (const k of Object.keys(gs)) {
            const v = gs[k];
            if (!v) continue;
            ['high', 'highScore', 'best', 'bestScore', 'score', 'peak', 'topScore', 'highscore']
              .forEach((field) => {
                const n = Number(v[field]);
                if (Number.isFinite(n)) peak = Math.max(peak, n);
              });
            if (typeof v === 'object') {
              for (const sub of Object.values(v)) {
                if (sub && typeof sub === 'object') {
                  ['high', 'best', 'score', 'peak'].forEach((f) => {
                    const n = Number(sub[f]);
                    if (Number.isFinite(n)) peak = Math.max(peak, n);
                  });
                }
              }
            }
          }
        }
      }
    } catch (e) { /* ignore */ }
    return peak;
  }

  function readActiveProfileName () {
    try {
      const raw = localStorage.getItem('tabby_profiles_v1');
      if (!raw) return null;
      const p = JSON.parse(raw);
      const id = p.activeId;
      const prof = (p.profiles || []).find((x) => x.id === id);
      return prof ? prof.name : null;
    } catch (e) { return null; }
  }

  function rankFor (sessionsCount, peak) {
    const ranks = [
      { name: 'CADET',  s: 0,   p: 0    },
      { name: 'SCOUT',  s: 4,   p: 0    },
      { name: 'AGENT',  s: 10,  p: 25   },
      { name: 'GHOST',  s: 25,  p: 80   },
      { name: 'APEX',   s: 60,  p: 200  },
    ];
    let rank = ranks[0];
    for (const r of ranks) {
      if (sessionsCount >= r.s && peak >= r.p) rank = r;
    }
    return rank.name;
  }

  function refreshStats () {
    const peak = readPeakScore();
    const name = readActiveProfileName();
    const rank = rankFor(sessions, peak);

    const sEl = document.getElementById('stat-sessions');
    if (sEl) animateNum(sEl, sessions);

    const bEl = document.getElementById('stat-best');
    if (bEl) animateNum(bEl, peak);

    const rEl = document.getElementById('stat-rank');
    if (rEl) rEl.textContent = rank;

    const stEl = document.getElementById('stat-streak');
    if (stEl) animateNum(stEl, streak);

    const ptag = document.getElementById('profile-tag');
    if (ptag) ptag.textContent = `profile · ${name || 'guest'}`;

    const rtag = document.getElementById('rank-tag');
    if (rtag) rtag.textContent = `rank · ${rank}`;
  }
  refreshStats();
  document.addEventListener('tabby-profile-change', refreshStats);

  // ─── MARQUEE TICKER ─────────────────────────
  const tracks = [
    'tip · hover the title for a glitch',
    'tip · ↑↑↓↓←→←→ba flips the palette',
    'note · tracking mode added',
    'status · all reactors green',
    'tip · esc to skip the boot screen',
    'tip · hit the palette button to recolor everything',
  ];
  const marquee = document.getElementById('marquee-track');
  if (marquee) {
    const html = tracks.map((s) => `<span>${s}</span>`).join('');
    marquee.innerHTML = html + html;
  }

  // ─── CARD 3D TILT ─────────────────────────
  document.querySelectorAll('.card').forEach((card) => {
    const frame = card.querySelector('.card-frame');
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - 0.5;
      const dy = (e.clientY - r.top) / r.height - 0.5;
      frame.style.setProperty('--rx', `${(-dy * 8).toFixed(2)}deg`);
      frame.style.setProperty('--ry', `${(dx * 10).toFixed(2)}deg`);
    });
    card.addEventListener('mouseleave', () => {
      frame.style.setProperty('--rx', '0deg');
      frame.style.setProperty('--ry', '0deg');
    });
  });

  // ─── PALETTE SHIFT (persisted) ─────────────────────────
  const PALETTES = [
    { rgb: '255 26 26',   accent: '#ff1a1a', glow: '#ff4444' },
    { rgb: '26 240 200',  accent: '#1af0c8', glow: '#5cffe1' },
    { rgb: '255 180 30',  accent: '#ffb41e', glow: '#ffd96a' },
    { rgb: '180 100 255', accent: '#b464ff', glow: '#d39bff' },
    { rgb: '240 240 240', accent: '#f0f0f0', glow: '#ffffff' },
  ];
  const PAL_KEY = 'tabby_palette_v1';
  let paletteI = parseInt(localStorage.getItem(PAL_KEY) || '0', 10);
  function applyPalette (i) {
    const p = PALETTES[i % PALETTES.length];
    const root = document.documentElement.style;
    root.setProperty('--accent-rgb', p.rgb);
    root.setProperty('--accent', p.accent);
    root.setProperty('--accent-glow', p.glow);
  }
  applyPalette(paletteI);

  const paletteBtn = document.getElementById('theme-shift');
  if (paletteBtn) {
    paletteBtn.addEventListener('click', () => {
      paletteI = (paletteI + 1) % PALETTES.length;
      localStorage.setItem(PAL_KEY, String(paletteI));
      applyPalette(paletteI);
    });
  }

  // ─── AUDIO TOGGLE ─────────────────────────
  const audioBtn = document.getElementById('audio-toggle');
  let audioOn = false;
  let audioCtx = null;
  let humOsc = null;
  let humGain = null;

  function ensureCtx () {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { audioCtx = null; }
    }
    return audioCtx;
  }

  function startHum () {
    const c = ensureCtx(); if (!c) return;
    humOsc = c.createOscillator();
    humGain = c.createGain();
    humOsc.type = 'sawtooth';
    humOsc.frequency.value = 55;
    humGain.gain.value = 0;
    humOsc.connect(humGain).connect(c.destination);
    humOsc.start();
    humGain.gain.linearRampToValueAtTime(0.012, c.currentTime + 1.0);
  }
  function stopHum () {
    if (!audioCtx || !humOsc) return;
    const t = audioCtx.currentTime;
    humGain.gain.linearRampToValueAtTime(0, t + 0.3);
    humOsc.stop(t + 0.4);
    humOsc = null;
  }

  function blip (freq = 880, dur = 0.06) {
    if (!audioOn) return;
    const c = ensureCtx(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.value = freq;
    g.gain.value = 0.0;
    o.connect(g).connect(c.destination);
    o.start();
    g.gain.linearRampToValueAtTime(0.06, c.currentTime + 0.005);
    g.gain.linearRampToValueAtTime(0, c.currentTime + dur);
    o.stop(c.currentTime + dur + 0.02);
  }

  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      audioOn = !audioOn;
      audioBtn.textContent = audioOn ? 'audio · on' : 'audio · off';
      if (audioOn) { startHum(); blip(660, 0.08); }
      else stopHum();
    });
  }

  document.querySelectorAll('.card:not(.card-locked)').forEach((card) => {
    card.addEventListener('mouseenter', () => blip(720 + Math.random() * 200, 0.05));
  });

  // ─── KONAMI EASTER EGG ─────────────────────────
  const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let kI = 0;
  window.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === konami[kI]) {
      kI += 1;
      if (kI === konami.length) {
        document.body.classList.add('konami');
        document.documentElement.style.setProperty('--accent-rgb', '255 220 60');
        document.documentElement.style.setProperty('--accent', '#ffdc3c');
        document.documentElement.style.setProperty('--accent-glow', '#ffeb7a');
        kI = 0;
      }
    } else { kI = 0; }
  });
})();
