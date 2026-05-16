(function () {
  const osRoot = document.querySelector('.tabbyos');
  const desktop = document.getElementById('os-desktop');
  const dockLabel = document.getElementById('dock-label');
  const startBtn = document.getElementById('start-btn');
  const windowLayer = document.getElementById('window-layer');
  const accentEl = document.getElementById('os-accent');
  const layoutEl = document.getElementById('os-layout');
  if (!osRoot || !desktop || !dockLabel || !windowLayer) return;

  let zTop = 600;
  let openCount = 0;
  const CFG_KEY = 'tabbyos_cfg_v1';

  function loadCfg() {
    try {
      const cfg = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      if (cfg.accent && accentEl) accentEl.value = cfg.accent;
      if (cfg.layout && layoutEl) layoutEl.value = cfg.layout;
      if (cfg.accent) osRoot.style.setProperty('--os-accent', cfg.accent);
      if (cfg.layout) osRoot.dataset.layout = cfg.layout;
    } catch (_) {}
  }

  function saveCfg() {
    const cfg = {
      accent: accentEl?.value || '#ff1a1a',
      layout: layoutEl?.value || 'grid',
    };
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg));
    osRoot.style.setProperty('--os-accent', cfg.accent);
    osRoot.dataset.layout = cfg.layout;
  }

  function bringToFront(win) {
    zTop += 1;
    win.style.zIndex = String(zTop);
  }

  function makeDraggable(win, bar) {
    let dragging = false;
    let sx = 0, sy = 0, sl = 0, st = 0;
    bar.addEventListener('pointerdown', ev => {
      dragging = true;
      bringToFront(win);
      sx = ev.clientX; sy = ev.clientY;
      sl = parseFloat(win.style.left || '100');
      st = parseFloat(win.style.top || '70');
      bar.setPointerCapture?.(ev.pointerId);
    });
    bar.addEventListener('pointermove', ev => {
      if (!dragging) return;
      const nx = sl + (ev.clientX - sx);
      const ny = st + (ev.clientY - sy);
      win.style.left = `${Math.max(0, Math.min(window.innerWidth - 220, nx))}px`;
      win.style.top = `${Math.max(0, Math.min(window.innerHeight - 140, ny))}px`;
    });
    const end = () => { dragging = false; };
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
  }

  function makeResizable(win, handle) {
    let resizing = false;
    let sx = 0, sy = 0, sw = 0, sh = 0;
    handle.addEventListener('pointerdown', ev => {
      resizing = true;
      bringToFront(win);
      sx = ev.clientX; sy = ev.clientY;
      sw = win.offsetWidth; sh = win.offsetHeight;
      handle.setPointerCapture?.(ev.pointerId);
    });
    handle.addEventListener('pointermove', ev => {
      if (!resizing) return;
      const nw = sw + (ev.clientX - sx);
      const nh = sh + (ev.clientY - sy);
      win.style.width = `${Math.max(360, Math.min(window.innerWidth - 10, nw))}px`;
      win.style.height = `${Math.max(260, Math.min(window.innerHeight - 10, nh))}px`;
    });
    const end = () => { resizing = false; };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  function createTerminal(win) {
    const out = win.querySelector('.terminal-view');
    const write = txt => {
      const line = document.createElement('span');
      line.className = 'term-line';
      line.textContent = txt;
      out.appendChild(line);
      out.scrollTop = out.scrollHeight;
    };
    const prompt = () => {
      const wrap = document.createElement('div');
      wrap.className = 'term-line';
      const label = document.createElement('span');
      label.textContent = 'tabby@tabbyos:~$ ';
      const input = document.createElement('input');
      input.className = 'term-input';
      input.type = 'text';
      wrap.appendChild(label);
      wrap.appendChild(input);
      out.appendChild(wrap);
      input.focus();
      input.addEventListener('keydown', ev => {
        if (ev.key !== 'Enter') return;
        const cmd = input.value.trim();
        input.disabled = true;
        run(cmd);
        prompt();
      });
      out.scrollTop = out.scrollHeight;
    };
    const run = cmd => {
      if (!cmd) return;
      if (cmd === 'help') write('commands: help, ls, date, clear, echo <text>, open <app>');
      else if (cmd === 'ls') write('aim.html  cps.html  typing.html  tabbycraft.html');
      else if (cmd === 'date') write(new Date().toString());
      else if (cmd.startsWith('echo ')) write(cmd.slice(5));
      else if (cmd === 'clear') out.innerHTML = '';
      else if (cmd.startsWith('open ')) {
        const app = cmd.slice(5).trim();
        if (['aim.html', 'cps.html', 'typing.html', 'tabbycraft.html'].includes(app)) {
          createWindow(app);
          write(`launched ${app}`);
        } else {
          write(`not found: ${app}`);
        }
      } else write(`command not found: ${cmd}`);
    };
    write('TabbyOS Terminal');
    write('Type "help" for commands.');
    prompt();
  }

  function createWindow(appName) {
    if (!appName) return;
    const win = document.createElement('section');
    win.className = 'app-window';
    win.style.left = `${80 + (openCount % 6) * 24}px`;
    win.style.top = `${60 + (openCount % 6) * 18}px`;
    win.style.width = '900px';
    win.style.height = '600px';
    bringToFront(win);
    openCount += 1;

    const isTerminal = appName === 'terminal';
    const title = isTerminal ? 'Terminal' : appName.replace('.html', '');
    const appUrl = isTerminal ? '' : new URL(appName, window.location.href).href;
    win.innerHTML = `
      <div class="window-bar">
        <span>${title}</span>
        <div class="window-actions">
          <button type="button" data-action="min">_</button>
          <button type="button" data-action="close">x</button>
        </div>
      </div>
      ${isTerminal ? '<div class="terminal-view"></div>' : `<iframe title="${title}" src="${appUrl}"></iframe>`}
      <div class="win-resize"></div>
    `;
    windowLayer.appendChild(win);

    const bar = win.querySelector('.window-bar');
    const resize = win.querySelector('.win-resize');
    makeDraggable(win, bar);
    makeResizable(win, resize);
    win.addEventListener('pointerdown', () => bringToFront(win));
    win.querySelector('[data-action="close"]').addEventListener('click', () => {
      win.remove();
      dockLabel.textContent = 'Ready';
    });
    win.querySelector('[data-action="min"]').addEventListener('click', () => {
      win.classList.add('hidden');
      dockLabel.textContent = `${title} minimized`;
    });
    if (isTerminal) createTerminal(win);
    dockLabel.textContent = `Running ${title}`;
  }

  desktop.addEventListener('click', ev => {
    const btn = ev.target.closest('.app-icon');
    if (!btn) return;
    createWindow(btn.dataset.app);
  });

  startBtn?.addEventListener('click', () => {
    dockLabel.textContent = 'Open apps from desktop icons';
  });

  accentEl?.addEventListener('input', saveCfg);
  layoutEl?.addEventListener('change', saveCfg);
  loadCfg();

  window.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    const wins = [...windowLayer.querySelectorAll('.app-window')];
    if (!wins.length) return;
    wins.sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0].remove();
    dockLabel.textContent = 'Closed top window';
  });
})();
