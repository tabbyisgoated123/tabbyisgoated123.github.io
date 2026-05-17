(function () {
  const osRoot = document.querySelector('.tabbyos');
  const desktop = document.getElementById('os-desktop');
  const windowLayer = document.getElementById('window-layer');
  const taskbar = document.getElementById('taskbar');
  if (!osRoot || !desktop || !windowLayer || !taskbar) return;

  const CFG_KEY = 'tabbyos_cfg_v1';
  const ICON_KEY = 'tabbyos_icons_v1';
  const PROFILE_COLORS = [
    '#ff1a1a', '#ff7a1a', '#ffd21a', '#4ade80',
    '#38bdf8', '#a855f7', '#f472b6', '#e5e7eb',
  ];
  const appWindows = new Map();
  let zTop = 600;
  let openCount = 0;
  let currentAccent = '#ff1a1a';
  let currentLayout = 'grid';
  let currentTaskbar = 'bottom';

  const appMeta = {
    settings: { title: 'Settings', icon: '⚙️' },
    'aim.html': { title: 'Aim Trainer', icon: '🎯' },
    'cps.html': { title: 'CPS Trainer', icon: '🖱️' },
    'typing.html': { title: 'TabbyTyping', icon: '⌨️' },
    'tabbycraft.html': { title: 'TabbyCraft', icon: '🧱' },
    'carnival.html': { title: 'Carnival', icon: '🎪' },
    terminal: { title: 'Terminal', icon: '🖥️' },
  };

  function loadCfg() {
    try {
      const cfg = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      if (cfg.accent) currentAccent = cfg.accent;
      if (cfg.layout) currentLayout = cfg.layout;
      if (cfg.taskbar) currentTaskbar = cfg.taskbar;
    } catch (_) {}
    applyRootCfg();
  }

  function saveCfg() {
    localStorage.setItem(CFG_KEY, JSON.stringify({
      accent: currentAccent,
      layout: currentLayout,
      taskbar: currentTaskbar,
    }));
    applyRootCfg();
    applyDefaultIconLayout(false);
  }

  function applyRootCfg() {
    osRoot.style.setProperty('--os-accent', currentAccent);
    osRoot.dataset.layout = currentLayout;
    osRoot.dataset.taskbar = currentTaskbar;
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
      if (key === 'settings') {
        const pos = saved[key] || {
          left: Math.max(0, desktop.clientWidth - icon.offsetWidth - 12),
          top: 12,
        };
        const safe = clampIconPosition(icon, pos.left, pos.top);
        icon.style.left = `${safe.left}px`;
        icon.style.top = `${safe.top}px`;
        return;
      }
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

  function bringToFront(win) {
    zTop += 1;
    win.style.zIndex = String(zTop);
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

  function makeDraggable(win, bar) {
    let dragging = false;
    let sx = 0;
    let sy = 0;
    let sl = 0;
    let st = 0;
    bar.addEventListener('pointerdown', ev => {
      if (ev.target && ev.target.closest && ev.target.closest('.window-actions')) return;
      dragging = true;
      bringToFront(win);
      ev.preventDefault();
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

  function applyTaskbarPositionControls(win, panel) {
    panel.innerHTML = `
      <div class="settings-card">
        <div class="settings-title">Appearance</div>
        <label>Accent
          <input type="color" id="os-accent" value="${currentAccent}">
        </label>
        <label>Desktop layout
          <select id="os-layout">
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </select>
        </label>
      </div>
      <div class="settings-card">
        <div class="settings-title">Taskbar</div>
        <label>Position
          <select id="os-taskbar">
            <option value="bottom">Bottom</option>
            <option value="top">Top</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </label>
        <button type="button" id="reset-icons-btn">Reset desktop icons</button>
      </div>
      <div class="settings-card" id="profile-settings-card">
        <div class="settings-title">Profile</div>
        <div class="settings-note">Local profile name, color, and accessibility settings.</div>
        <label>Name
          <input id="profile-name" type="text" maxlength="32">
        </label>
        <label>Color
          <div id="profile-colors" class="profile-colors"></div>
        </label>
        <label>Scanline overlay
          <input id="pref-scanline" type="checkbox">
        </label>
        <label>Vignette
          <input id="pref-vignette" type="checkbox">
        </label>
        <label>Reduce motion
          <input id="pref-reduce-motion" type="checkbox">
        </label>
        <label>Cursor
          <select id="pref-cursor">
            <option value="crosshair">Crosshair</option>
            <option value="default">Default</option>
            <option value="none">Hidden</option>
          </select>
        </label>
        <label>UI scale
          <input id="pref-font-scale" type="range" min="85" max="125" step="5" value="100">
        </label>
        <label>Panel opacity
          <input id="pref-panel-opacity" type="range" min="60" max="100" step="2" value="92">
        </label>
        <div class="settings-actions">
          <button type="button" data-action="save">Save</button>
          <button type="button" data-action="new">New</button>
          <button type="button" data-action="delete">Delete</button>
        </div>
      </div>
    `;

    const accent = panel.querySelector('#os-accent');
    const layout = panel.querySelector('#os-layout');
    const taskbarPos = panel.querySelector('#os-taskbar');
    const resetIcons = panel.querySelector('#reset-icons-btn');
    const name = panel.querySelector('#profile-name');
    const profileColors = panel.querySelector('#profile-colors');
    const scanline = panel.querySelector('#pref-scanline');
    const vignette = panel.querySelector('#pref-vignette');
    const reduceMotion = panel.querySelector('#pref-reduce-motion');
    const cursor = panel.querySelector('#pref-cursor');
    const fontScale = panel.querySelector('#pref-font-scale');
    const panelOpacity = panel.querySelector('#pref-panel-opacity');
    const saveBtn = panel.querySelector('[data-action="save"]');
    const newBtn = panel.querySelector('[data-action="new"]');
    const deleteBtn = panel.querySelector('[data-action="delete"]');
    const profileApi = window.TabbyProfiles;
    const profile = profileApi?.getActiveProfile?.();

    if (layout) layout.value = currentLayout;
    if (taskbarPos) taskbarPos.value = currentTaskbar;
    if (profile && name) name.value = profile.name;
    if (profile && scanline) scanline.checked = !!profile.prefs?.scanline;
    if (profile && vignette) vignette.checked = !!profile.prefs?.vignette;
    if (profile && reduceMotion) reduceMotion.checked = !!profile.prefs?.reduceMotion;
    if (profile && cursor) cursor.value = profile.prefs?.cursor || 'crosshair';
    if (profile && fontScale) fontScale.value = Math.round((profile.prefs?.fontScale || 1) * 100);
    if (profile && panelOpacity) panelOpacity.value = Math.round((profile.prefs?.panelOpacity || 0.92) * 100);

    if (profileColors) {
      profileColors.innerHTML = '';
      PROFILE_COLORS.forEach(color => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'profile-color-swatch';
        btn.style.background = color;
        btn.dataset.color = color;
        btn.title = color;
        btn.addEventListener('click', () => {
          profileApi?.updateActiveProfile?.({ color });
          applyTaskbarPositionControls(win, panel);
        });
        profileColors.appendChild(btn);
      });
    }

    accent?.addEventListener('input', ev => {
      currentAccent = ev.target.value;
      saveCfg();
    });
    layout?.addEventListener('change', ev => {
      currentLayout = ev.target.value;
      saveCfg();
      applyDefaultIconLayout(true);
    });
    taskbarPos?.addEventListener('change', ev => {
      currentTaskbar = ev.target.value;
      saveCfg();
    });
    resetIcons?.addEventListener('click', () => {
      localStorage.removeItem(ICON_KEY);
      applyDefaultIconLayout(true);
    });
    name?.addEventListener('input', ev => {
      profileApi?.updateActiveProfile?.({ name: ev.target.value });
    });
    scanline?.addEventListener('change', ev => profileApi?.updateActiveProfile?.({ prefs: { scanline: ev.target.checked } }));
    vignette?.addEventListener('change', ev => profileApi?.updateActiveProfile?.({ prefs: { vignette: ev.target.checked } }));
    reduceMotion?.addEventListener('change', ev => profileApi?.updateActiveProfile?.({ prefs: { reduceMotion: ev.target.checked } }));
    cursor?.addEventListener('change', ev => profileApi?.updateActiveProfile?.({ prefs: { cursor: ev.target.value } }));
    fontScale?.addEventListener('input', ev => profileApi?.updateActiveProfile?.({ prefs: { fontScale: +ev.target.value / 100 } }));
    panelOpacity?.addEventListener('input', ev => profileApi?.updateActiveProfile?.({ prefs: { panelOpacity: +ev.target.value / 100 } }));

    saveBtn?.addEventListener('click', () => profileApi?.saveCurrentProfile?.());
    newBtn?.addEventListener('click', () => profileApi?.createProfile?.());
    deleteBtn?.addEventListener('click', () => profileApi?.deleteActiveProfile?.());
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
      else if (cmd === 'ls') write('aim.html  cps.html  typing.html  tabbycraft.html  carnival.html  settings');
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
  }

  function minimizeWindow(appName) {
    const entry = appWindows.get(appName);
    if (!entry) return;
    entry.win.classList.add('hidden');
    updateTaskbarState(appName);
  }

  function restoreWindow(appName) {
    const entry = appWindows.get(appName);
    if (!entry) return;
    entry.win.classList.remove('hidden');
    bringToFront(entry.win);
    updateTaskbarState(appName);
  }

  function focusWindow(appName) {
    const entry = appWindows.get(appName);
    if (!entry) return;
    bringToFront(entry.win);
    updateTaskbarState(appName);
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
    if (isSettings) {
      applyTaskbarPositionControls(win, win.querySelector('.settings-window'));
    }
    if (!isTerminal && !isSettings) {
      const frame = win.querySelector('iframe');
      frame?.addEventListener('load', () => {
        try {
          const loadedPath = new URL(frame.contentWindow.location.href).pathname.toLowerCase();
          const wantedPath = `/${String(appName).toLowerCase()}`;
          if (!loadedPath.endsWith(wantedPath)) frame.src = appUrl;
        } catch (_) {}
      });
    }

    updateTaskbarState(appName);
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

  loadCfg();
  applyDefaultIconLayout(false);
  makeDesktopIconsDraggable();
  createWindow('settings');
  minimizeWindow('settings');

  window.addEventListener('resize', () => applyDefaultIconLayout(false));

  window.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    const wins = [...windowLayer.querySelectorAll('.app-window')];
    if (!wins.length) return;
    const top = wins.sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
    const appName = [...appWindows.entries()].find(([, entry]) => entry.win === top)?.[0];
    if (appName) closeWindow(appName);
  });
})();
