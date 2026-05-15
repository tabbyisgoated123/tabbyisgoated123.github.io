(function () {
  const ACH_KEY = 'tabby_achievements_v1';
  const SCORE_KEY = 'tabby_local_scores_v1';
  const THEME_KEY = 'tabby_theme_v1';
  const SOUND_KEY = 'tabby_sound_v1';
  const root = document.documentElement;
  const body = document.body;

  const achievements = JSON.parse(localStorage.getItem(ACH_KEY) || '{}');
  const scores = JSON.parse(localStorage.getItem(SCORE_KEY) || '{}');

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
    function draw() {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      x.clearRect(0, 0, c.width, c.height);
      x.fillStyle = 'rgba(255,255,255,0.6)';
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

  function initTheme() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fx-theme-toggle';
    document.body.appendChild(btn);

    const hour = new Date().getHours();
    const autoTheme = hour >= 7 && hour <= 18 ? 'light' : 'dark';
    body.dataset.theme = localStorage.getItem(THEME_KEY) || autoTheme;
    btn.textContent = body.dataset.theme === 'light' ? 'Night' : 'Day';
    btn.addEventListener('click', () => {
      body.dataset.theme = body.dataset.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_KEY, body.dataset.theme);
      btn.textContent = body.dataset.theme === 'light' ? 'Night' : 'Day';
      beep(520, 0.04, 'triangle', 0.015);
    });
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
    const pages = [
      ['index.html', 'Home'],
      ['aim.html', 'Aim'],
      ['cps.html', 'CPS'],
      ['typing.html', 'Typing'],
      ['tabbycraft.html', 'TabbyCraft'],
    ];
    const nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.innerHTML = pages.map(([href, label]) => `<a href="${href}">${label}</a>`).join('');
    document.body.appendChild(nav);

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

  initLoader();
  initParticles();
  initTheme();
  initShell();
  initTypeEffect();
  initEasterEgg();
})();
