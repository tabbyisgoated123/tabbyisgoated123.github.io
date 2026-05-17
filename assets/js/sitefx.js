(function () {
  const ACH_KEY = 'tabby_achievements_v1';
  const SCORE_KEY = 'tabby_local_scores_v1';
  const SOUND_KEY = 'tabby_sound_v1';
  const OS_STYLE_KEY = 'tabby_os_style_v1';
  const root = document.documentElement;
  const body = document.body;

  const achievements = JSON.parse(localStorage.getItem(ACH_KEY) || '{}');
  const scores = JSON.parse(localStorage.getItem(SCORE_KEY) || '{}');

  function normalizeOsStyle(style) {
    const v = String(style || '').toLowerCase();
    if (v === 'kde' || v === 'system7' || v === 'win11' || v === 'win98' || v === 'macos') return v;
    return 'tabby';
  }

  function applyOsStyle(style) {
    const normalized = normalizeOsStyle(style || localStorage.getItem(OS_STYLE_KEY));
    root.dataset.osStyle = normalized;
    body.dataset.osStyle = normalized;
  }

  function activeOsStyle() {
    return normalizeOsStyle(root.dataset.osStyle || localStorage.getItem(OS_STYLE_KEY));
  }

  function saveAchievements() {
    localStorage.setItem(ACH_KEY, JSON.stringify(achievements));
  }

  function saveScores() {
    localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
  }

  function unlock(id, text) {
    if (achievements[id]) return;
    achievements[id] = { at: Date.now(), text };
    saveAchievements();
    toast('Achievement unlocked: ' + text);
  }

  function setHighScore(game, score) {
    const n = Number(score || 0);
    if (!scores[game] || n > scores[game]) {
      scores[game] = n;
      saveScores();
      unlock('highscore_' + game, game + ' new high score');
    }
  }

  function getHighScore(game) {
    return Number(scores[game] || 0);
  }

  function toast(text) {
    let wrap = document.querySelector('.fx-toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'fx-toast-wrap';
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = 'fx-achievement';
    el.textContent = text;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  function shake() {
    body.classList.remove('fx-shake');
    void body.offsetWidth;
    body.classList.add('fx-shake');
  }

  const ctxAudio = window.AudioContext ? new AudioContext() : null;
  let soundOn = localStorage.getItem(SOUND_KEY) !== 'off';
  function beep(freq = 440, duration = 0.06, type = 'square', gain = 0.02) {
    if (!ctxAudio || !soundOn) return;
    const o = ctxAudio.createOscillator();
    const g = ctxAudio.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g);
    g.connect(ctxAudio.destination);
    o.start();
    o.stop(ctxAudio.currentTime + duration);
  }

  function initStyleBackdrop() {
    if (document.body.classList.contains('tabbyos-page')) return;
    const c = document.createElement('canvas');
    c.className = 'fx-style-bg';
    document.body.appendChild(c);
    const x = c.getContext('2d');
    if (!x) return;

    const ensureSize = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = Math.max(1, Math.floor(window.innerWidth));
      const h = Math.max(1, Math.floor(window.innerHeight));
      if (c.width === Math.floor(w * dpr) && c.height === Math.floor(h * dpr)) return;
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawKde = (t, w, h) => {
      const grad = x.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(10,24,44,0.55)');
      grad.addColorStop(1, 'rgba(6,14,30,0.52)');
      x.fillStyle = grad;
      x.fillRect(0, 0, w, h);
      for (let i = 0; i < 4; i += 1) {
        const yBase = h * (0.2 + i * 0.2);
        x.beginPath();
        x.moveTo(-40, yBase);
        for (let px = 0; px <= w + 40; px += 24) {
          const py = yBase + Math.sin((px * 0.005) + t * 0.8 + i) * (18 + i * 6);
          x.lineTo(px, py);
        }
        x.strokeStyle = `rgba(${55 + i * 18}, ${160 + i * 12}, ${255 - i * 18}, ${0.08 + i * 0.02})`;
        x.lineWidth = 16 - i * 3;
        x.stroke();
      }
    };

    const drawSystem7 = (t, w, h) => {
      const grad = x.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(244,244,244,0.7)');
      grad.addColorStop(1, 'rgba(220,220,220,0.68)');
      x.fillStyle = grad;
      x.fillRect(0, 0, w, h);
      const offset = Math.floor((t * 8) % 8);
      x.fillStyle = 'rgba(0,0,0,0.05)';
      for (let y = -8; y < h + 8; y += 8) {
        x.fillRect(0, y + offset, w, 1);
      }
      x.fillStyle = 'rgba(0,0,0,0.04)';
      for (let i = 0; i < 8; i += 1) {
        x.fillRect((w / 8) * i, 0, 1, h);
      }
    };

    const drawWin11 = (t, w, h) => {
      const grad = x.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(9,22,42,0.56)');
      grad.addColorStop(1, 'rgba(7,15,28,0.58)');
      x.fillStyle = grad;
      x.fillRect(0, 0, w, h);
      const blobs = [
        { x: 0.22, y: 0.25, r: 0.22, c: 'rgba(82,190,255,0.13)' },
        { x: 0.74, y: 0.22, r: 0.2, c: 'rgba(135,138,255,0.11)' },
        { x: 0.56, y: 0.6, r: 0.26, c: 'rgba(70,136,255,0.09)' },
      ];
      blobs.forEach((b, idx) => {
        const pulse = 1 + Math.sin(t * 0.8 + idx) * 0.03;
        const rg = x.createRadialGradient(
          w * b.x, h * b.y, 6,
          w * b.x, h * b.y, Math.min(w, h) * b.r * pulse
        );
        rg.addColorStop(0, b.c);
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = rg;
        x.beginPath();
        x.arc(w * b.x, h * b.y, Math.min(w, h) * b.r * pulse, 0, Math.PI * 2);
        x.fill();
      });
    };

    const drawMacos = (t, w, h) => {
      const grad = x.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(44,53,96,0.56)');
      grad.addColorStop(0.45, 'rgba(86,72,122,0.52)');
      grad.addColorStop(1, 'rgba(20,42,74,0.58)');
      x.fillStyle = grad;
      x.fillRect(0, 0, w, h);
      const glass = x.createRadialGradient(w * 0.7, h * 0.22, 8, w * 0.7, h * 0.22, Math.min(w, h) * 0.42);
      glass.addColorStop(0, 'rgba(176,226,255,0.18)');
      glass.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = glass;
      x.beginPath();
      x.arc(w * 0.7, h * 0.22, Math.min(w, h) * 0.42, 0, Math.PI * 2);
      x.fill();
      const sweep = ((t * 24) % (w + 320)) - 320;
      const streak = x.createLinearGradient(sweep, 0, sweep + 240, 0);
      streak.addColorStop(0, 'rgba(255,255,255,0)');
      streak.addColorStop(0.45, 'rgba(255,255,255,0.08)');
      streak.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = streak;
      x.fillRect(0, 0, w, h);
    };

    const drawWin98 = (t, w, h) => {
      x.fillStyle = 'rgba(0,128,128,0.55)';
      x.fillRect(0, 0, w, h);
      const tile = 32;
      for (let y = 0; y < h; y += tile) {
        for (let x0 = 0; x0 < w; x0 += tile) {
          const alt = ((x0 / tile) + (y / tile)) % 2 === 0;
          x.fillStyle = alt ? 'rgba(0,96,96,0.09)' : 'rgba(255,255,255,0.03)';
          x.fillRect(x0, y, tile, tile);
        }
      }
      const cloudX = ((t * 34) % (w + 160)) - 160;
      x.fillStyle = 'rgba(255,255,255,0.16)';
      x.fillRect(cloudX, h * 0.2, 120, 18);
      x.fillRect(cloudX + 28, h * 0.2 - 10, 68, 14);
      x.fillRect(cloudX + 48, h * 0.2 + 12, 52, 12);
    };

    const drawTabby = (t, w, h) => {
      const grad = x.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(10,10,10,0.52)');
      grad.addColorStop(1, 'rgba(2,2,2,0.56)');
      x.fillStyle = grad;
      x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(255,80,80,0.07)';
      x.lineWidth = 1;
      const shift = Math.floor((t * 20) % 40);
      for (let i = -40; i < w + h; i += 40) {
        x.beginPath();
        x.moveTo(i + shift, 0);
        x.lineTo(i - h + shift, h);
        x.stroke();
      }
    };

    const draw = ts => {
      ensureSize();
      const w = Math.floor(window.innerWidth);
      const h = Math.floor(window.innerHeight);
      const t = (ts || 0) * 0.001;
      const style = activeOsStyle();
      x.clearRect(0, 0, w, h);
      if (style === 'kde') drawKde(t, w, h);
      else if (style === 'system7') drawSystem7(t, w, h);
      else if (style === 'win11') drawWin11(t, w, h);
      else if (style === 'macos') drawMacos(t, w, h);
      else if (style === 'win98') drawWin98(t, w, h);
      else drawTabby(t, w, h);
      requestAnimationFrame(draw);
    };

    window.addEventListener('resize', ensureSize);
    requestAnimationFrame(draw);
  }

  function initParticles() {
    const c = document.createElement('canvas');
    c.className = 'fx-particles';
    document.body.appendChild(c);
    const x = c.getContext('2d');
    const dots = Array.from({ length: 50 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
    }));
    const tintForStyle = style => {
      if (style === 'kde') return 'rgba(124,200,255,0.52)';
      if (style === 'system7') return 'rgba(80,80,80,0.28)';
      if (style === 'win11') return 'rgba(146,202,255,0.44)';
      if (style === 'macos') return 'rgba(208,229,255,0.46)';
      if (style === 'win98') return 'rgba(255,255,255,0.25)';
      return 'rgba(255,255,255,0.6)';
    };
    function draw() {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      x.clearRect(0, 0, c.width, c.height);
      x.fillStyle = tintForStyle(activeOsStyle());
      for (const p of dots) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > c.width) p.vx *= -1;
        if (p.y < 0 || p.y > c.height) p.vy *= -1;
        x.beginPath();
        x.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        x.fill();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  function initLoader() {
    const overlay = document.createElement('div');
    overlay.className = 'fx-loading';
    overlay.innerHTML = '<div class="fx-loading-text">loading</div>';
    document.body.appendChild(overlay);
    setTimeout(() => {
      overlay.classList.add('hidden');
      document.body.classList.add('fx-ready');
      setTimeout(() => overlay.remove(), 360);
    }, 650);
  }

  function initShell() {
    if (document.body.classList.contains('tabbyos-page')) return;
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = '<span>Tabby Games</span><span><button id="fx-sound-btn" type="button">Sound</button> <button id="fx-full-btn" type="button">Fullscreen</button> <a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub</a></span>';
    document.body.appendChild(footer);
    const soundBtn = document.getElementById('fx-sound-btn');
    const fullBtn = document.getElementById('fx-full-btn');
    if (soundBtn) {
      soundBtn.textContent = soundOn ? 'Sound:On' : 'Sound:Off';
      soundBtn.addEventListener('click', () => {
        soundOn = !soundOn;
        localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off');
        soundBtn.textContent = soundOn ? 'Sound:On' : 'Sound:Off';
      });
    }
    fullBtn?.addEventListener('click', () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    });

    document.querySelectorAll('a[href$=".html"]').forEach(link => {
      link.addEventListener('click', ev => {
        const href = link.getAttribute('href');
        if (!href) return;
        ev.preventDefault();
        document.body.classList.remove('fx-ready');
        setTimeout(() => { window.location.href = href; }, 180);
      });
    });
  }

  function initTypeEffect() {
    const target = document.querySelector('.home-subtitle');
    if (!target) return;
    const full = target.textContent;
    target.textContent = '';
    let i = 0;
    const t = setInterval(() => {
      target.textContent += full[i++] || '';
      if (i >= full.length) clearInterval(t);
    }, 50);
  }

  function initEasterEgg() {
    const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let idx = 0;
    window.addEventListener('keydown', e => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      idx = key === seq[idx] ? idx + 1 : 0;
      if (idx === seq.length) {
        idx = 0;
        unlock('konami', 'Konami code');
        toast('Matrix mode engaged');
        root.style.setProperty('--accent', '#4ade80');
      }
    });
  }

  function setGameplay(active) {
    document.body.dataset.gameplay = active ? 'on' : 'off';
  }

  window.TabbyFX = { unlock, setHighScore, getHighScore, toast, shake, beep, setGameplay };

  applyOsStyle();
  window.addEventListener('storage', ev => {
    if (ev.key !== OS_STYLE_KEY) return;
    applyOsStyle(ev.newValue);
  });
  window.addEventListener('message', ev => {
    const data = ev.data && typeof ev.data === 'object' ? ev.data : null;
    if (!data || data.type !== 'tabby-os-style-change') return;
    applyOsStyle(data.style);
  });
  document.addEventListener('tabby-os-style-change', ev => {
    const style = ev?.detail?.style;
    if (!style) return;
    applyOsStyle(style);
  });

  initLoader();
  initStyleBackdrop();
  initParticles();
  initShell();
  initTypeEffect();
  initEasterEgg();
})();
