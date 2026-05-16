(function () {
  const osRoot = document.querySelector('.tabbyos');
  const desktop = document.getElementById('os-desktop');
  const dockLabel = document.getElementById('dock-label');
  const startBtn = document.getElementById('start-btn');
  const windowLayer = document.getElementById('window-layer');
  const taskbar = document.getElementById('taskbar');
  if (!osRoot || !desktop || !dockLabel || !windowLayer || !taskbar) return;

  const CFG_KEY = 'tabbyos_cfg_v1';
  const ICON_KEY = 'tabbyos_icons_v1';
  const appWindows = new Map();
  let zTop = 600;
  let openCount = 0;
  let currentAccent = '#ff1a1a';
  let currentLayout = 'grid';

  const appMeta = {
    settings: { title: 'Settings', icon: '⚙️' },
    'aim.html': { title: 'Aim Trainer', icon: '🎯' },
    'cps.html': { title: 'CPS Trainer', icon: '🖱️' },
    'typing.html': { title: 'TabbyTyping', icon: '⌨️' },
    'tabbycraft.html': { title: 'TabbyCraft', icon: '🧱' },
    terminal: { title: 'Terminal', icon: '🖥️' },
  };

  function loadCfg() {
    try {
      const cfg = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      if (cfg.accent) currentAccent = cfg.accent;
      if (cfg.layout) currentLayout = cfg.layout;
    } catch (_) {}
    osRoot.style.setProperty('--os-accent', currentAccent);
    osRoot.dataset.layout = currentLayout;
  }

  function saveCfg() {
    localStorage.setItem(CFG_KEY, JSON.stringify({
      accent: currentAccent,
      layout: currentLayout,
    }));
    osRoot.style.setProperty('--os-accent', currentAccent);
    osRoot.dataset.layout = currentLayout;
    applyDefaultIconLayout(false);
  }

  function loadIconPositions() {
    try {
      return JSON.parse(localStorage.getItem(ICON_KEY) || '{}');
    } catch (_) {
      return {};
    }
  }

  function saveIconPositions() {
    const positions = {};
    desktop.querySelectorAll('.app-icon').forEach(icon => {
      positions[icon.dataset.app || icon.textContent.trim()] = {
        left: parseFloat(icon.style.left || '0'),
        top: parseFloat(icon.style.top || '0'),
      };
    });
    localStorage.setItem(ICON_KEY, JSON.stringify(positions));
  }

  function clampIconPosition(icon, left, top) {
    const maxLeft = Math.max(0, desktop.clientWidth - icon.offsetWidth);
    const maxTop = Math.max(0, desktop.clientHeight - icon.offsetHeight);
    return {
      left: Math.max(0, Math.min(maxLeft, left)),
      top: Math.max(0, Math.min(maxTop, top)),
    };
  }

  function applyDefaultIconLayout(forceReset) {
    const saved = forceReset ? {} : loadIconPositions();
    const icons = [...desktop.querySelectorAll('.app-icon')];
    const layout = currentLayout || 'grid';
    const gapY = layout === 'list' ? 68 : 96;
    const gapX = layout === 'list' ? 0 : 122;
    const maxRows = Math.max(1, Math.floor((desktop.clientHeight - 8) / gapY));

    icons.forEach((icon, index) => {
      const key = icon.dataset.app || icon.textContent.trim();
      const col = layout === 'list' ? 0 : Math.floor(index / maxRows);
      const row = layout === 'list' ? index : (index % maxRows);
      const defaultLeft = col * gapX;
      const defaultTop = Math.max(0, desktop.clientHeight - ((row + 1) * gapY));
      const pos = saved[key] || { left: defaultLeft, top: defaultTop };
      const safe = clampIconPosition(icon, pos.left, pos.top);
      icon.style.left = `${safe.left}px`;
      icon.style.top = `${safe.top}px`;
    });
  }

  function ensureTaskbarButton(appName) {
    const meta = appMeta[appName];
    if (!meta) return null;
    let btn = taskbar.querySelector(`[data-app="${appName}"]`);
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'taskbar-btn active';
      btn.dataset.app = appName;
      btn.addEventListener('click', () => openOrFocusApp(appName));
      taskbar.appendChild(btn);
    }
    btn.textContent = `${meta.icon} ${meta.title}`;
    return btn;
  }

  function updateTaskbarState(appName) {
    const entry = appWindows.get(appName);
    const btn = taskbar.querySelector(`[data-app="${appName}"]`);
    if (!entry || !btn) return;
    btn.classList.toggle('active', !entry.win.classList.contains('hidden'));
  }

  function makeDesktopIconsDraggable() {
    desktop.querySelectorAll('.app-icon').forEach(icon => {
      if (icon.dataset.bound === '1') return;
      icon.dataset.bound = '1';
      let pointerId = null;
      let startX = 0;
      let startY = 0;
      let iconLeft = 0;
      let iconTop = 0;
      let moved = false;

      icon.addEventListener('pointerdown', ev => {
        pointerId = ev.pointerId;
        moved = false;
        startX = ev.clientX;
        startY = ev.clientY;
        iconLeft = parseFloat(icon.style.left || '0');
        iconTop = parseFloat(icon.style.top || '0');
        icon.setPointerCapture?.(pointerId);
      });

      icon.addEventListener('pointermove', ev => {
        if (pointerId !== ev.pointerId) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!moved && Math.hypot(dx, dy) > 5) moved = true;
        if (!moved) return;
        const next = clampIconPosition(icon, iconLeft + dx, iconTop + dy);
        icon.style.left = `${next.left}px`;
        icon.style.top = `${next.top}px`;
      });

      const finish = ev => {
        if (pointerId !== ev.pointerId) return;
        icon.releasePointerCapture?.(pointerId);
        pointerId = null;
        if (moved) {
          saveIconPositions();
          dockLabel.textContent = `${icon.textContent.trim()} moved`;
        } else {
          openOrFocusApp(icon.dataset.app);
        }
      };

      icon.addEventListener('pointerup', finish);
      icon.addEventListener('pointercancel', ev => {
        if (pointerId !== ev.pointerId) return;
        pointerId = null;
      });
    });
  }

  function bringToFront(win) {
    zTop += 1;
    win.style.zIndex = String(zTop);
  }

  function makeDraggable(win, bar) {
    let dragging = false;
    let sx = 0;
    let sy = 0;
    let sl = 0;
    let st = 0;
    bar.addEventListener('pointerdown', ev => {
      dragging = true;
      bringToFront(win);
      sx = ev.clientX;
      sy = ev.clientY;
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
    let sx = 0;
    let sy = 0;
    let sw = 0;
    let sh = 0;
    handle.addEventListener('pointerdown', ev => {
      resizing = true;
      bringToFront(win);
      sx = ev.clientX;
      sy = ev.clientY;
      sw = win.offsetWidth;
      sh = win.offsetHeight;
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

  function renderSettingsContent(win) {
    const panel = win.querySelector('.settings-window');
    if (!panel) return;
    panel.innerHTML = `
      <div class="settings-card">
        <div class="settings-title">TabbyOS Settings</div>
        <div class="settings-note">Customize the desktop look and layout.</div>
        <label>Accent
          <input type="color" id="os-accent" value="${currentAccent}">
        </label>
        <label>Layout
          <select id="os-layout">
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </select>
        </label>
        <button type="button" id="reset-icons-btn">Reset desktop icons</button>
      </div>
    `;

    const accent = panel.querySelector('#os-accent');
    const layout = panel.querySelector('#os-layout');
    const reset = panel.querySelector('#reset-icons-btn');
    if (layout) layout.value = currentLayout;
    accent?.addEventListener('input', ev => {
      currentAccent = ev.target.value;
      saveCfg();
    });
    layout?.addEventListener('change', ev => {
      currentLayout = ev.target.value;
      saveCfg();
      applyDefaultIconLayout(true);
    });
    reset?.addEventListener('click', () => {
      localStorage.removeItem(ICON_KEY);
      applyDefaultIconLayout(true);
      dockLabel.textContent = 'Desktop icons reset';
    });
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
      else if (cmd === 'ls') write('aim.html  cps.html  typing.html  tabbycraft.html  settings');
      else if (cmd === 'date') write(new Date().toString());
      else if (cmd.startsWith('echo ')) write(cmd.slice(5));
      else if (cmd === 'clear') out.innerHTML = '';
      else if (cmd.startsWith('open ')) {
        const app = cmd.slice(5).trim();
        if (appMeta[app]) {
          openOrFocusApp(app);
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

  function closeWindow(appName) {
    const entry = appWindows.get(appName);
    if (!entry) return;
    entry.win.remove();
    appWindows.delete(appName);
    entry.taskbarBtn?.remove();
    dockLabel.textContent = 'Ready';
  }

  function minimizeWindow(appName) {
    const entry = appWindows.get(appName);
    if (!entry) return;
    entry.win.classList.add('hidden');
    updateTaskbarState(appName);
    dockLabel.textContent = `${entry.meta.title} minimized`;
  }

  function restoreWindow(appName) {
    const entry = appWindows.get(appName);
    if (!entry) return;
    entry.win.classList.remove('hidden');
    bringToFront(entry.win);
    updateTaskbarState(appName);
    dockLabel.textContent = `Running ${entry.meta.title}`;
  }

  function focusWindow(appName) {
    const entry = appWindows.get(appName);
    if (!entry) return;
    bringToFront(entry.win);
    updateTaskbarState(appName);
    dockLabel.textContent = `Running ${entry.meta.title}`;
  }

  function createWindow(appName) {
    if (!appName || appWindows.has(appName)) return appWindows.get(appName)?.win;
    const meta = appMeta[appName];
    if (!meta) return null;

    const win = document.createElement('section');
    win.className = 'app-window';
    win.style.left = `${80 + (openCount % 6) * 24}px`;
    win.style.top = `${60 + (openCount % 6) * 18}px`;
    win.style.width = '900px';
    win.style.height = '600px';
    bringToFront(win);
    openCount += 1;

    const isTerminal = appName === 'terminal';
    const isSettings = appName === 'settings';
    const title = meta.title;
    const appUrl = isTerminal ? '' : new URL(`./${appName}`, window.location.href).href;
    win.innerHTML = `
      <div class="window-bar">
        <span>${title}</span>
        <div class="window-actions">
          <button type="button" data-action="min">-</button>
          <button type="button" data-action="close">x</button>
        </div>
      </div>
      ${isTerminal ? '<div class="terminal-view"></div>' : isSettings ? '<div class="settings-window"></div>' : `<iframe title="${title}" src="${appUrl}" data-app="${appName}"></iframe>`}
      <div class="win-resize"></div>
    `;
    windowLayer.appendChild(win);

    const bar = win.querySelector('.window-bar');
    const resize = win.querySelector('.win-resize');
    makeDraggable(win, bar);
    makeResizable(win, resize);
    win.addEventListener('pointerdown', () => bringToFront(win));

    const taskbarBtn = ensureTaskbarButton(appName);
    appWindows.set(appName, { win, meta, taskbarBtn });

    win.querySelector('[data-action="close"]').addEventListener('click', ev => {
      ev.stopPropagation();
      closeWindow(appName);
    });
    win.querySelector('[data-action="min"]').addEventListener('click', ev => {
      ev.stopPropagation();
      minimizeWindow(appName);
    });

    if (isTerminal) createTerminal(win);
    if (isSettings) renderSettingsContent(win);

    if (!isTerminal && !isSettings) {
      const frame = win.querySelector('iframe');
      frame?.addEventListener('load', () => {
        try {
          const loadedPath = new URL(frame.contentWindow.location.href).pathname.toLowerCase();
          const wantedPath = `/${String(appName).toLowerCase()}`;
          if (!loadedPath.endsWith(wantedPath)) {
            frame.src = appUrl;
          }
        } catch (_) {}
      });
    }

    updateTaskbarState(appName);
    dockLabel.textContent = `Running ${title}`;
    return win;
  }

  function openOrFocusApp(appName) {
    if (!appMeta[appName]) return;
    const entry = appWindows.get(appName);
    if (!entry) {
      createWindow(appName);
      return;
    }
    if (entry.win.classList.contains('hidden')) {
      restoreWindow(appName);
      return;
    }
    focusWindow(appName);
  }

  startBtn?.addEventListener('click', () => {
    dockLabel.textContent = 'Open apps from desktop icons';
  });

  loadCfg();
  applyDefaultIconLayout(false);
  makeDesktopIconsDraggable();

  window.addEventListener('resize', () => {
    applyDefaultIconLayout(false);
  });

  window.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    const wins = [...windowLayer.querySelectorAll('.app-window')];
    if (!wins.length) return;
    const top = wins.sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
    const appName = [...appWindows.entries()].find(([, entry]) => entry.win === top)?.[0];
    if (appName) closeWindow(appName);
  });
})();
