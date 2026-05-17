(function () {
  const osRoot = document.querySelector('.tabbyos');
  const desktop = document.getElementById('os-desktop');
  const windowLayer = document.getElementById('window-layer');
  const taskbar = document.getElementById('taskbar');
  const plusLauncher = document.getElementById('plus-launcher');
  if (!osRoot || !desktop || !windowLayer || !taskbar) return;

  const CFG_KEY = 'tabbyos_cfg_v2';
  const ICON_KEY = 'tabbyos_icons_v1';
  const FS_KEY = 'tabbyos_vfs_v1';
  const OS_STYLE_KEY = 'tabby_os_style_v1';
  const PLUS_KEY = 'tabby_plus_tier_v1';
  const PLUS_GAME_KEY = 'tabbyplus';
  const TIER_LEVEL = { free: 0, plus: 1, premium: 2 };
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
  let currentWallpaper = 'tabby';
  let currentWallpaperUrl = '';
  let currentOsStyle = 'tabby';
  let currentTier = 'free';

  const appMeta = {
    settings: { title: 'Settings', icon: '⚙️' },
    explorer: { title: 'File Explorer', icon: '🗂️' },
    terminal: { title: 'Terminal', icon: '🖥️' },
    'aim.html': { title: 'Aim Trainer', icon: '🎯' },
    'cps.html': { title: 'CPS Trainer', icon: '🖱️' },
    'typing.html': { title: 'TabbyTyping', icon: '⌨️' },
    'tabbycraft.html': { title: 'TabbyCraft', icon: '🧱' },
    'carnival.html': { title: 'Carnival', icon: '🎪' },
  };

  function defaultFs() {
    const now = Date.now();
    return {
      type: 'dir',
      mtime: now,
      children: {
        home: {
          type: 'dir',
          mtime: now,
          children: {
            tabby: {
              type: 'dir',
              mtime: now,
              children: {
                Desktop: { type: 'dir', mtime: now, children: {} },
                Documents: {
                  type: 'dir',
                  mtime: now,
                  children: {
                    'welcome.txt': {
                      type: 'file',
                      mtime: now,
                      content: 'Welcome to TabbyOS.\nUse Terminal and Explorer to manage files.\n',
                    },
                  },
                },
                Downloads: { type: 'dir', mtime: now, children: {} },
                Projects: {
                  type: 'dir',
                  mtime: now,
                  children: {
                    'todo.md': {
                      type: 'file',
                      mtime: now,
                      content: '# TabbyOS\n- Tune the shell\n- Add more apps\n',
                    },
                  },
                },
                Games: { type: 'dir', mtime: now, children: {} },
              },
            },
          },
        },
        etc: {
          type: 'dir',
          mtime: now,
          children: {
            hostname: { type: 'file', mtime: now, content: 'tabbyos\n' },
            issue: { type: 'file', mtime: now, content: 'TabbyOS 1.0\n' },
          },
        },
        var: {
          type: 'dir',
          mtime: now,
          children: {
            log: {
              type: 'dir',
              mtime: now,
              children: {
                'system.log': {
                  type: 'file',
                  mtime: now,
                  content: '[boot] TabbyOS initialized.\n',
                },
              },
            },
          },
        },
      },
    };
  }

  let fsRoot = loadFs();

  function loadFs() {
    try {
      const parsed = JSON.parse(localStorage.getItem(FS_KEY) || '');
      if (parsed && parsed.type === 'dir') return parsed;
    } catch (_) {}
    return defaultFs();
  }

  function saveFs() {
    localStorage.setItem(FS_KEY, JSON.stringify(fsRoot));
  }

  function pathSegments(path) {
    return String(path || '/').split('/').filter(Boolean);
  }

  function normalizeAbs(path) {
    const src = String(path || '/');
    const parts = [];
    src.split('/').forEach(part => {
      if (!part || part === '.') return;
      if (part === '..') {
        parts.pop();
        return;
      }
      parts.push(part);
    });
    return '/' + parts.join('/');
  }

  function resolvePath(cwd, input) {
    const raw = String(input || '').trim();
    if (!raw || raw === '~') return '/home/tabby';
    if (raw.startsWith('~/')) return normalizeAbs('/home/tabby/' + raw.slice(2));
    if (raw.startsWith('/')) return normalizeAbs(raw);
    return normalizeAbs((cwd || '/home/tabby') + '/' + raw);
  }

  function toPromptPath(path) {
    if (path === '/home/tabby') return '~';
    if (path.startsWith('/home/tabby/')) return '~/' + path.slice('/home/tabby/'.length);
    return path;
  }

  function basename(path) {
    const segs = pathSegments(path);
    return segs.length ? segs[segs.length - 1] : '/';
  }

  function dirname(path) {
    const segs = pathSegments(path);
    if (!segs.length) return '/';
    segs.pop();
    return '/' + segs.join('/');
  }

  function getNode(absPath) {
    const norm = normalizeAbs(absPath);
    if (norm === '/') return fsRoot;
    const segs = pathSegments(norm);
    let node = fsRoot;
    for (const seg of segs) {
      if (!node || node.type !== 'dir' || !node.children[seg]) return null;
      node = node.children[seg];
    }
    return node;
  }

  function ensureDir(absPath) {
    const norm = normalizeAbs(absPath);
    if (norm === '/') return fsRoot;
    const segs = pathSegments(norm);
    let node = fsRoot;
    for (const seg of segs) {
      if (node.type !== 'dir') return null;
      if (!node.children[seg]) {
        node.children[seg] = { type: 'dir', mtime: Date.now(), children: {} };
      }
      node = node.children[seg];
      if (node.type !== 'dir') return null;
    }
    return node;
  }

  function listDir(absPath) {
    const node = getNode(absPath);
    if (!node || node.type !== 'dir') return null;
    return Object.entries(node.children)
      .map(([name, child]) => ({ name, type: child.type, mtime: child.mtime || 0 }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }

  function mkdirp(absPath) {
    const target = normalizeAbs(absPath);
    if (target === '/') return { ok: true };
    const parent = getNode(dirname(target));
    if (!parent || parent.type !== 'dir') return { ok: false, error: 'No such parent directory' };
    const name = basename(target);
    if (parent.children[name]) {
      if (parent.children[name].type === 'dir') return { ok: true };
      return { ok: false, error: 'A file with that name already exists' };
    }
    parent.children[name] = { type: 'dir', mtime: Date.now(), children: {} };
    parent.mtime = Date.now();
    saveFs();
    return { ok: true };
  }

  function touch(absPath) {
    const target = normalizeAbs(absPath);
    const parent = getNode(dirname(target));
    if (!parent || parent.type !== 'dir') return { ok: false, error: 'No such parent directory' };
    const name = basename(target);
    const now = Date.now();
    if (!parent.children[name]) {
      parent.children[name] = { type: 'file', mtime: now, content: '' };
    } else if (parent.children[name].type === 'dir') {
      return { ok: false, error: 'Is a directory' };
    } else {
      parent.children[name].mtime = now;
    }
    parent.mtime = now;
    saveFs();
    return { ok: true };
  }

  function writeFile(absPath, content, append) {
    const target = normalizeAbs(absPath);
    const parent = getNode(dirname(target));
    if (!parent || parent.type !== 'dir') return { ok: false, error: 'No such parent directory' };
    const name = basename(target);
    const now = Date.now();
    if (!parent.children[name]) parent.children[name] = { type: 'file', mtime: now, content: '' };
    const node = parent.children[name];
    if (node.type !== 'file') return { ok: false, error: 'Is a directory' };
    node.content = append ? String(node.content || '') + String(content) : String(content);
    node.mtime = now;
    parent.mtime = now;
    saveFs();
    return { ok: true };
  }

  function removePath(absPath, recursive) {
    const target = normalizeAbs(absPath);
    if (target === '/') return { ok: false, error: 'Refusing to remove root' };
    const parent = getNode(dirname(target));
    if (!parent || parent.type !== 'dir') return { ok: false, error: 'No such file or directory' };
    const name = basename(target);
    const node = parent.children[name];
    if (!node) return { ok: false, error: 'No such file or directory' };
    if (node.type === 'dir' && Object.keys(node.children).length && !recursive) {
      return { ok: false, error: 'Directory not empty (use rm -r)' };
    }
    delete parent.children[name];
    parent.mtime = Date.now();
    saveFs();
    return { ok: true };
  }

  function normalizeOsStyle(style) {
    const v = String(style || '').toLowerCase();
    if (v === 'kde' || v === 'system7' || v === 'win11' || v === 'win98') return v;
    return 'tabby';
  }

  function loadCfg() {
    try {
      const cfg = JSON.parse(localStorage.getItem(CFG_KEY) || '{}');
      if (cfg.accent) currentAccent = cfg.accent;
      if (cfg.layout) currentLayout = cfg.layout;
      if (cfg.taskbar) currentTaskbar = cfg.taskbar;
      if (cfg.wallpaper) currentWallpaper = cfg.wallpaper;
      if (cfg.wallpaperUrl) currentWallpaperUrl = cfg.wallpaperUrl;
      currentOsStyle = normalizeOsStyle(cfg.osStyle || localStorage.getItem(OS_STYLE_KEY));
    } catch (_) {}
    if (!currentOsStyle) currentOsStyle = normalizeOsStyle(localStorage.getItem(OS_STYLE_KEY));
    applyRootCfg();
  }

  function saveCfg() {
    localStorage.setItem(CFG_KEY, JSON.stringify({
      accent: currentAccent,
      layout: currentLayout,
      taskbar: currentTaskbar,
      wallpaper: currentWallpaper,
      wallpaperUrl: currentWallpaperUrl,
      osStyle: currentOsStyle,
    }));
    applyRootCfg();
    applyDefaultIconLayout(false);
  }

  function normalizeTier(tier) {
    const t = String(tier || '').toLowerCase();
    if (t === 'premium' || t === 'plus') return t;
    return 'free';
  }

  function tierRank(tier) {
    return TIER_LEVEL[normalizeTier(tier)] || 0;
  }

  function tierLabel(tier) {
    const t = normalizeTier(tier);
    if (t === 'premium') return 'Premium';
    if (t === 'plus') return 'Plus';
    return 'Free';
  }

  function hasPremiumAccess() {
    return tierRank(currentTier) >= TIER_LEVEL.premium;
  }

  function readTierFromProfile() {
    const profileApi = window.TabbyProfiles;
    const stats = profileApi?.getProfileGameStats?.(PLUS_GAME_KEY) || {};
    return normalizeTier(stats.tier);
  }

  function loadTier() {
    const localTier = normalizeTier(localStorage.getItem(PLUS_KEY));
    const profileTier = readTierFromProfile();
    currentTier = tierRank(profileTier) >= tierRank(localTier) ? profileTier : localTier;
    if (currentTier === 'free') currentTier = localTier || profileTier || 'free';
    localStorage.setItem(PLUS_KEY, currentTier);
  }

  function updatePlusLauncher() {
    if (!plusLauncher) return;
    const active = normalizeTier(currentTier);
    plusLauncher.dataset.tier = active;
    if (active === 'premium') plusLauncher.textContent = '👑 Premium';
    else if (active === 'plus') plusLauncher.textContent = '👑 Plus';
    else plusLauncher.textContent = '👑 Get Plus';
  }

  function saveTier(tier) {
    currentTier = normalizeTier(tier);
    localStorage.setItem(PLUS_KEY, currentTier);
    window.TabbyProfiles?.setProfileGameStat?.(PLUS_GAME_KEY, {
      tier: currentTier,
      updatedAt: Date.now(),
    });
    updatePlusLauncher();
    document.dispatchEvent(new CustomEvent('tabby-plus-change', { detail: { tier: currentTier } }));
    const settingsWin = appWindows.get('settings');
    if (settingsWin) {
      const panel = settingsWin.win.querySelector('.settings-window');
      if (panel) applySettingsUI(settingsWin.win, panel);
    }
  }

  function safeWallpaperUrl(url) {
    const v = String(url || '').trim().replace(/["'<>]/g, '');
    if (!v) return '';
    if (v.startsWith('https://') || v.startsWith('http://') || v.startsWith('data:image/')) return v;
    if (v.startsWith('./') || v.startsWith('/')) return v;
    return '';
  }

  function applyRootCfg() {
    osRoot.style.setProperty('--os-accent', currentAccent);
    osRoot.dataset.layout = currentLayout;
    osRoot.dataset.taskbar = currentTaskbar;
    osRoot.dataset.wallpaper = currentWallpaper;
    osRoot.dataset.osStyle = normalizeOsStyle(currentOsStyle);
    const safe = safeWallpaperUrl(currentWallpaperUrl);
    osRoot.style.setProperty('--os-wallpaper-url', safe ? `url("${safe}")` : 'none');
    localStorage.setItem(OS_STYLE_KEY, normalizeOsStyle(currentOsStyle));
    broadcastOsStyle();
    refreshClippy();
  }

  function broadcastOsStyle() {
    const style = normalizeOsStyle(currentOsStyle);
    appWindows.forEach(entry => {
      const frame = entry.win?.querySelector?.('.window-frame');
      try {
        frame?.contentWindow?.postMessage({ type: 'tabby-os-style-change', style }, '*');
      } catch (_) {}
    });
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
        if (moved) saveIconPositions();
        else openOrFocusApp(icon.dataset.app);
      };

      icon.addEventListener('pointerup', finish);
      icon.addEventListener('pointercancel', ev => {
        if (pointerId !== ev.pointerId) return;
        pointerId = null;
      });
    });
  }

  function makeDraggable(win, handle) {
    let dragging = false;
    let sx = 0;
    let sy = 0;
    let sl = 0;
    let st = 0;
    handle.addEventListener('pointerdown', ev => {
      dragging = true;
      bringToFront(win);
      ev.preventDefault();
      sx = ev.clientX;
      sy = ev.clientY;
      sl = parseFloat(win.style.left || '100');
      st = parseFloat(win.style.top || '70');
      handle.setPointerCapture?.(ev.pointerId);
    });
    handle.addEventListener('pointermove', ev => {
      if (!dragging) return;
      const nx = sl + (ev.clientX - sx);
      const ny = st + (ev.clientY - sy);
      win.style.left = `${Math.max(0, Math.min(window.innerWidth - 220, nx))}px`;
      win.style.top = `${Math.max(0, Math.min(window.innerHeight - 140, ny))}px`;
    });
    const end = () => { dragging = false; };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
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

  function ensureClippy() {
    let wrap = osRoot.querySelector('.clippy-assistant');
    if (wrap) return wrap;
    wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.className = 'clippy-assistant hidden';
    wrap.setAttribute('aria-label', 'Clippy assistant');
    wrap.innerHTML = `
      <span class="clippy-bubble">It looks like you're trying to train your aim. Need help?</span>
      <span class="clippy-face" aria-hidden="true">📎</span>
    `;
    wrap.addEventListener('click', () => {
      const bubble = wrap.querySelector('.clippy-bubble');
      if (!bubble) return;
      const tips = [
        'Tip: Drag app icons to organize your desktop.',
        'Tip: Right now this style is inspired by Windows 98.',
        'Tip: Open Settings to try another Premium OS style.',
        'Tip: Use the taskbar icon to restore minimized apps.',
      ];
      bubble.textContent = tips[Math.floor(Math.random() * tips.length)];
    });
    osRoot.appendChild(wrap);
    return wrap;
  }

  function refreshClippy() {
    const clippy = ensureClippy();
    clippy.classList.toggle('hidden', normalizeOsStyle(currentOsStyle) !== 'win98');
  }

  function ensurePlusModal() {
    let modal = document.getElementById('plus-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'plus-modal';
    modal.className = 'plus-modal hidden';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="plus-panel">
        <div class="plus-head">
          <div>
            <div class="plus-kicker">Tabby Plus</div>
            <h3>Choose your tier</h3>
          </div>
          <button type="button" class="icon-btn" data-action="close" aria-label="Close Tabby Plus">x</button>
        </div>
        <div class="plus-tiers">
          <article class="plus-tier" data-tier-card="free">
            <div class="plus-tier-name">Free</div>
            <p>Core apps and standard gameplay.</p>
            <button type="button" data-tier="free">Use Free</button>
          </article>
          <article class="plus-tier" data-tier-card="plus">
            <div class="plus-tier-name">Plus</div>
            <p>Unlocks Blackjack and all Poker games in Carnival.</p>
            <button type="button" data-tier="plus">Activate Plus</button>
          </article>
          <article class="plus-tier" data-tier-card="premium">
            <div class="plus-tier-name">Premium</div>
            <p>All Plus perks plus OS styles, color themes, and wallpaper controls.</p>
            <button type="button" data-tier="premium">Activate Premium</button>
          </article>
        </div>
      </div>
    `;
    osRoot.appendChild(modal);

    const close = () => {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    };
    modal.querySelector('[data-action="close"]')?.addEventListener('click', close);
    modal.addEventListener('click', ev => {
      if (ev.target === modal) close();
    });
    modal.querySelectorAll('[data-tier]').forEach(btn => {
      btn.addEventListener('click', () => {
        saveTier(btn.dataset.tier);
        close();
      });
    });
    return modal;
  }

  function openPlusModal() {
    const modal = ensurePlusModal();
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    const activeTier = normalizeTier(currentTier);
    modal.querySelectorAll('[data-tier-card]').forEach(card => {
      card.classList.toggle('active', card.dataset.tierCard === activeTier);
    });
  }

  function applyPremiumLock(panel, locked) {
    panel.querySelectorAll('[data-premium-only="1"]').forEach(el => {
      if ('disabled' in el) el.disabled = !!locked;
      el.classList.toggle('locked-control', !!locked);
    });
    panel.querySelectorAll('[data-premium-button]').forEach(el => {
      if ('disabled' in el) el.disabled = !!locked;
    });
    const gate = panel.querySelector('#premium-gate-note');
    if (gate) gate.classList.toggle('hidden', !locked);
  }

  function applySettingsUI(win, panel) {
    panel.classList.add('window-scrollable');
    panel.innerHTML = `
      <div class="settings-card">
        <div class="settings-title">Appearance</div>
        <label>Accent
          <input type="color" id="os-accent" data-premium-only="1" value="${currentAccent}">
        </label>
        <label>Desktop layout
          <select id="os-layout">
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </select>
        </label>
        <label>Wallpaper preset
          <select id="os-wallpaper" data-premium-only="1">
            <option value="tabby">TabbyOS Default</option>
            <option value="aurora">Aurora</option>
            <option value="mesh">Mesh</option>
            <option value="night">Night Sky</option>
            <option value="custom">Custom URL</option>
          </select>
        </label>
        <label>OS style
          <select id="os-style" data-premium-only="1">
            <option value="tabby">TabbyOS Modern</option>
            <option value="kde">KDE Plasma (Arch)</option>
            <option value="system7">Apple System 7</option>
            <option value="win11">Windows 11</option>
            <option value="win98">Windows 98 + Clippy</option>
          </select>
        </label>
        <label id="wallpaper-url-wrap">Custom wallpaper URL
          <input type="text" id="os-wallpaper-url" data-premium-only="1" placeholder="https://... or /assets/...">
        </label>
        <div id="premium-gate-note" class="settings-note hidden">
          Premium is required for appearance customization.
          <button type="button" id="open-plus-from-settings">Get Plus</button>
        </div>
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
    const wallpaper = panel.querySelector('#os-wallpaper');
    const osStyle = panel.querySelector('#os-style');
    const wallpaperUrlWrap = panel.querySelector('#wallpaper-url-wrap');
    const wallpaperUrl = panel.querySelector('#os-wallpaper-url');
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
    const openPlusFromSettings = panel.querySelector('#open-plus-from-settings');
    const saveBtn = panel.querySelector('[data-action="save"]');
    const newBtn = panel.querySelector('[data-action="new"]');
    const deleteBtn = panel.querySelector('[data-action="delete"]');

    const profileApi = window.TabbyProfiles;
    const profile = profileApi?.getActiveProfile?.();

    if (layout) layout.value = currentLayout;
    if (taskbarPos) taskbarPos.value = currentTaskbar;
    if (wallpaper) wallpaper.value = currentWallpaper;
    if (osStyle) osStyle.value = normalizeOsStyle(currentOsStyle);
    if (wallpaperUrl) wallpaperUrl.value = currentWallpaperUrl;
    if (wallpaperUrlWrap) wallpaperUrlWrap.classList.toggle('hidden', currentWallpaper !== 'custom');

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
        btn.dataset.premiumButton = '1';
        btn.style.background = color;
        btn.dataset.color = color;
        btn.title = color;
        btn.addEventListener('click', () => {
          if (!hasPremiumAccess()) {
            openPlusModal();
            return;
          }
          profileApi?.updateActiveProfile?.({ color });
          applySettingsUI(win, panel);
        });
        profileColors.appendChild(btn);
      });
    }

    applyPremiumLock(panel, !hasPremiumAccess());
    openPlusFromSettings?.addEventListener('click', openPlusModal);

    accent?.addEventListener('input', ev => {
      if (!hasPremiumAccess()) {
        ev.target.value = currentAccent;
        openPlusModal();
        return;
      }
      currentAccent = ev.target.value;
      saveCfg();
    });
    layout?.addEventListener('change', ev => { currentLayout = ev.target.value; saveCfg(); applyDefaultIconLayout(true); });
    wallpaper?.addEventListener('change', ev => {
      if (!hasPremiumAccess()) {
        ev.target.value = currentWallpaper;
        openPlusModal();
        return;
      }
      currentWallpaper = ev.target.value;
      if (wallpaperUrlWrap) wallpaperUrlWrap.classList.toggle('hidden', currentWallpaper !== 'custom');
      saveCfg();
    });
    osStyle?.addEventListener('change', ev => {
      if (!hasPremiumAccess()) {
        ev.target.value = normalizeOsStyle(currentOsStyle);
        openPlusModal();
        return;
      }
      currentOsStyle = normalizeOsStyle(ev.target.value);
      saveCfg();
    });
    wallpaperUrl?.addEventListener('change', ev => {
      if (!hasPremiumAccess()) {
        ev.target.value = currentWallpaperUrl;
        openPlusModal();
        return;
      }
      currentWallpaperUrl = safeWallpaperUrl(ev.target.value);
      if (currentWallpaper === 'custom') saveCfg();
    });
    taskbarPos?.addEventListener('change', ev => { currentTaskbar = ev.target.value; saveCfg(); });
    resetIcons?.addEventListener('click', () => { localStorage.removeItem(ICON_KEY); applyDefaultIconLayout(true); });
    name?.addEventListener('input', ev => profileApi?.updateActiveProfile?.({ name: ev.target.value }));
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
    out.classList.add('window-scrollable');
    const state = { cwd: '/home/tabby', history: [], historyIndex: 0 };

    const writeLine = (text, cls) => {
      const line = document.createElement('div');
      line.className = `term-line${cls ? ` ${cls}` : ''}`;
      line.textContent = text;
      out.appendChild(line);
      out.scrollTop = out.scrollHeight;
    };

    const tokenize = command => {
      const tokens = [];
      const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
      let m;
      while ((m = re.exec(command))) tokens.push(m[1] ?? m[2] ?? m[3]);
      return tokens;
    };

    const printList = (items, longMode) => {
      if (!items || !items.length) return writeLine('');
      if (!longMode) return writeLine(items.map(i => (i.type === 'dir' ? `${i.name}/` : i.name)).join('  '));
      items.forEach(i => writeLine(`${i.type === 'dir' ? 'd' : '-'}rw-r--r-- tabby tabby ${new Date(i.mtime || Date.now()).toLocaleString()} ${i.type === 'dir' ? `${i.name}/` : i.name}`));
    };

    const runCommand = command => {
      const cmd = String(command || '');
      if (cmd) {
        state.history.push(cmd);
        if (state.history.length > 200) state.history.shift();
      }
      state.historyIndex = state.history.length;
      const parts = tokenize(cmd);
      const name = parts[0] || '';
      const args = parts.slice(1);
      if (!name) return;

      if (name === 'help') return writeLine('Built-ins: pwd ls cd cat mkdir touch rm echo clear date whoami uname history tree open neofetch');
      if (name === 'neofetch') {
        writeLine('  /\\_/\\    tabby@tabbyos');
        writeLine(' ( o.o )   OS: TabbyOS 1.0');
        writeLine('  > ^ <    Shell: tabsh');
        writeLine('           FS: virtualfs');
        return;
      }
      if (name === 'pwd') return writeLine(state.cwd);
      if (name === 'whoami') return writeLine('tabby');
      if (name === 'uname') return writeLine(args[0] === '-a' ? 'Linux tabbyos 6.8-tabby #1 SMP PREEMPT x86_64 GNU/Tabby' : 'Linux');
      if (name === 'date') return writeLine(new Date().toString());
      if (name === 'history') return state.history.forEach((h, i) => writeLine(`${i + 1}  ${h}`));
      if (name === 'clear') {
        out.innerHTML = '';
        return;
      }
      if (name === 'cd') {
        const target = resolvePath(state.cwd, args[0] || '~');
        const node = getNode(target);
        if (!node) return writeLine(`cd: no such file or directory: ${args[0] || ''}`, 'term-error');
        if (node.type !== 'dir') return writeLine(`cd: not a directory: ${args[0] || ''}`, 'term-error');
        state.cwd = target;
        return;
      }
      if (name === 'ls') {
        const longMode = args.includes('-l');
        const targetArg = args.find(a => !a.startsWith('-')) || '.';
        const target = resolvePath(state.cwd, targetArg);
        const items = listDir(target);
        if (!items) return writeLine(`ls: cannot access '${targetArg}': No such directory`, 'term-error');
        return printList(items, longMode);
      }
      if (name === 'tree') {
        const target = resolvePath(state.cwd, args[0] || '.');
        const node = getNode(target);
        if (!node) return writeLine(`tree: ${args[0] || '.'}: No such file or directory`, 'term-error');
        const walk = (n, prefix, label) => {
          writeLine(prefix + label + (n.type === 'dir' ? '/' : ''));
          if (n.type !== 'dir') return;
          const keys = Object.keys(n.children).sort((a, b) => a.localeCompare(b));
          keys.forEach((key, idx) => {
            const child = n.children[key];
            const branch = idx === keys.length - 1 ? '`-- ' : '|-- ';
            const nextPrefix = prefix + (idx === keys.length - 1 ? '    ' : '|   ');
            walk(child, nextPrefix, branch + key);
          });
        };
        walk(node, '', basename(target));
        return;
      }
      if (name === 'cat') {
        if (!args[0]) return writeLine('cat: missing operand', 'term-error');
        const node = getNode(resolvePath(state.cwd, args[0]));
        if (!node) return writeLine(`cat: ${args[0]}: No such file`, 'term-error');
        if (node.type !== 'file') return writeLine(`cat: ${args[0]}: Is a directory`, 'term-error');
        return writeLine(String(node.content || ''));
      }
      if (name === 'mkdir') {
        if (!args[0]) return writeLine('mkdir: missing operand', 'term-error');
        const res = mkdirp(resolvePath(state.cwd, args[0]));
        if (!res.ok) writeLine(`mkdir: ${res.error}`, 'term-error');
        return;
      }
      if (name === 'touch') {
        if (!args[0]) return writeLine('touch: missing operand', 'term-error');
        const res = touch(resolvePath(state.cwd, args[0]));
        if (!res.ok) writeLine(`touch: ${res.error}`, 'term-error');
        return;
      }
      if (name === 'rm') {
        const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
        const targetArg = args.find(a => !a.startsWith('-'));
        if (!targetArg) return writeLine('rm: missing operand', 'term-error');
        const res = removePath(resolvePath(state.cwd, targetArg), recursive);
        if (!res.ok) writeLine(`rm: ${res.error}`, 'term-error');
        return;
      }
      if (name === 'echo') {
        const redirect = cmd.match(/^echo\s+([\s\S]*?)\s*(>>|>)\s*(\S+)\s*$/);
        if (redirect) {
          const res = writeFile(resolvePath(state.cwd, redirect[3]), redirect[1] + '\n', redirect[2] === '>>');
          if (!res.ok) writeLine(`echo: ${res.error}`, 'term-error');
          return;
        }
        return writeLine(args.join(' '));
      }
      if (name === 'open') {
        const target = args[0] || '';
        if (!target) return writeLine('open: specify app name or path', 'term-error');
        if (appMeta[target]) {
          openOrFocusApp(target);
          return writeLine(`launched ${target}`);
        }
        const abs = resolvePath(state.cwd, target);
        const node = getNode(abs);
        if (!node) return writeLine(`open: ${target}: not found`, 'term-error');
        if (node.type === 'dir') {
          openOrFocusApp('explorer', { path: abs });
          return writeLine(`opened explorer at ${abs}`);
        }
        return writeLine(String(node.content || ''));
      }
      writeLine(`${name}: command not found`, 'term-error');
    };

    const renderPrompt = () => {
      const row = document.createElement('div');
      row.className = 'term-row';
      const label = document.createElement('span');
      label.className = 'term-prompt';
      label.textContent = `tabby@tabbyos:${toPromptPath(state.cwd)}$`;
      const input = document.createElement('input');
      input.className = 'term-input';
      input.type = 'text';
      input.autocomplete = 'off';
      row.appendChild(label);
      row.appendChild(input);
      out.appendChild(row);
      input.focus();

      input.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') {
          const cmd = input.value.trim();
          row.classList.add('term-locked');
          input.disabled = true;
          runCommand(cmd);
          renderPrompt();
          return;
        }
        if (ev.key === 'ArrowUp') {
          ev.preventDefault();
          if (!state.history.length) return;
          state.historyIndex = Math.max(0, state.historyIndex - 1);
          input.value = state.history[state.historyIndex] || '';
          return;
        }
        if (ev.key === 'ArrowDown') {
          ev.preventDefault();
          if (!state.history.length) return;
          state.historyIndex = Math.min(state.history.length, state.historyIndex + 1);
          input.value = state.history[state.historyIndex] || '';
        }
      });
      out.scrollTop = out.scrollHeight;
    };

    writeLine('TabbyOS Unix Shell (tabsh)');
    writeLine('Type help for commands.');
    renderPrompt();
  }

  function createExplorer(win, payload) {
    const view = win.querySelector('.explorer-view');
    view.classList.add('window-scrollable');
    let currentPath = normalizeAbs(payload?.path || '/home/tabby');
    let selectedFile = '';

    view.innerHTML = `
      <div class="explorer-toolbar">
        <button type="button" data-act="up">Up</button>
        <button type="button" data-act="new-file">New File</button>
        <button type="button" data-act="new-folder">New Folder</button>
        <button type="button" data-act="refresh">Refresh</button>
        <input type="text" class="explorer-path" aria-label="Current path">
      </div>
      <div class="explorer-layout">
        <aside class="explorer-sidebar"></aside>
        <section class="explorer-main">
          <div class="explorer-list"></div>
          <div class="explorer-preview">
            <div class="explorer-preview-title">Preview</div>
            <textarea class="explorer-editor" spellcheck="false"></textarea>
            <div class="explorer-actions">
              <button type="button" data-act="save-file">Save File</button>
              <button type="button" data-act="delete-item">Delete Item</button>
            </div>
          </div>
        </section>
      </div>
    `;

    const pathInput = view.querySelector('.explorer-path');
    const sidebar = view.querySelector('.explorer-sidebar');
    const list = view.querySelector('.explorer-list');
    const editor = view.querySelector('.explorer-editor');
    const quickPaths = ['/home/tabby', '/home/tabby/Desktop', '/home/tabby/Documents', '/home/tabby/Downloads', '/home/tabby/Projects', '/var/log'];

    const setPreview = (path, node) => {
      selectedFile = path;
      if (!node || node.type !== 'file') {
        editor.value = '';
        editor.disabled = true;
        return;
      }
      editor.disabled = false;
      editor.value = String(node.content || '');
    };

    const renderSidebar = () => {
      sidebar.innerHTML = '';
      quickPaths.forEach(path => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'explorer-nav';
        btn.textContent = path.replace('/home/tabby', '~');
        btn.classList.toggle('active', currentPath === path);
        btn.addEventListener('click', () => navigate(path));
        sidebar.appendChild(btn);
      });
    };

    const renderList = () => {
      pathInput.value = currentPath;
      const items = listDir(currentPath);
      list.innerHTML = '';
      if (!items) {
        const row = document.createElement('div');
        row.className = 'explorer-item';
        row.textContent = 'Directory unavailable';
        list.appendChild(row);
        return;
      }
      items.forEach(item => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'explorer-item';
        const icon = item.type === 'dir' ? '📁' : '📄';
        row.innerHTML = `<span>${icon}</span><span>${item.name}</span><span class="explorer-meta">${new Date(item.mtime || Date.now()).toLocaleString()}</span>`;
        row.addEventListener('click', () => {
          const abs = normalizeAbs(`${currentPath}/${item.name}`);
          const node = getNode(abs);
          if (!node) return;
          if (node.type === 'dir') return navigate(abs);
          setPreview(abs, node);
        });
        row.addEventListener('dblclick', () => {
          const abs = normalizeAbs(`${currentPath}/${item.name}`);
          const node = getNode(abs);
          if (node?.type === 'dir') navigate(abs);
        });
        list.appendChild(row);
      });
    };

    const navigate = path => {
      const abs = normalizeAbs(path);
      const node = getNode(abs);
      if (!node || node.type !== 'dir') return;
      currentPath = abs;
      setPreview('', null);
      renderSidebar();
      renderList();
    };

    view.querySelector('[data-act="up"]').addEventListener('click', () => navigate(dirname(currentPath)));
    view.querySelector('[data-act="refresh"]').addEventListener('click', () => renderList());
    view.querySelector('[data-act="new-file"]').addEventListener('click', () => {
      const name = window.prompt('New file name:');
      if (!name) return;
      const res = touch(normalizeAbs(`${currentPath}/${name}`));
      if (!res.ok) return window.alert(res.error);
      renderList();
    });
    view.querySelector('[data-act="new-folder"]').addEventListener('click', () => {
      const name = window.prompt('New folder name:');
      if (!name) return;
      const res = mkdirp(normalizeAbs(`${currentPath}/${name}`));
      if (!res.ok) return window.alert(res.error);
      renderList();
    });
    view.querySelector('[data-act="save-file"]').addEventListener('click', () => {
      if (!selectedFile) return;
      const res = writeFile(selectedFile, editor.value, false);
      if (!res.ok) return window.alert(res.error);
      renderList();
    });
    view.querySelector('[data-act="delete-item"]').addEventListener('click', () => {
      if (!selectedFile) return;
      if (!window.confirm(`Delete ${basename(selectedFile)}?`)) return;
      const res = removePath(selectedFile, true);
      if (!res.ok) return window.alert(res.error);
      setPreview('', null);
      renderList();
    });
    pathInput.addEventListener('keydown', ev => {
      if (ev.key !== 'Enter') return;
      navigate(resolvePath(currentPath, pathInput.value));
    });

    navigate(currentPath);
    return { open(path) { if (path) navigate(path); } };
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

  function toggleWindowFullscreen(appName) {
    const entry = appWindows.get(appName);
    if (!entry) return;
    const win = entry.win;
    const doc = document;
    if (doc.fullscreenElement === win) {
      doc.exitFullscreen?.().catch(() => {
        win.classList.remove('window-maximized');
      });
      return;
    }
    if (!doc.fullscreenElement) {
      win.requestFullscreen?.().catch(() => {
        win.classList.toggle('window-maximized');
      });
      return;
    }
    doc.exitFullscreen?.().then(() => {
      win.requestFullscreen?.().catch(() => {
        win.classList.toggle('window-maximized');
      });
    }).catch(() => {
      win.classList.toggle('window-maximized');
    });
  }

  function createWindow(appName, payload) {
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
    const isExplorer = appName === 'explorer';
    const appUrl = (!isTerminal && !isSettings && !isExplorer)
      ? new URL(`./${appName}?v=${Date.now()}`, window.location.href).href
      : '';

    let bodyContent = '';
    if (isTerminal) bodyContent = '<div class="terminal-view"></div>';
    else if (isSettings) bodyContent = '<div class="settings-window"></div>';
    else if (isExplorer) bodyContent = '<div class="explorer-view"></div>';
    else bodyContent = `<iframe class="window-frame" title="${meta.title}" src="${appUrl}" data-app="${appName}"></iframe>`;

    win.innerHTML = `
      <div class="window-body">
        ${bodyContent}
        <div class="window-drag-handle" title="Drag window"></div>
        <div class="window-floating-controls">
          <button type="button" data-action="full">[]</button>
          <button type="button" data-action="min">-</button>
          <button type="button" data-action="close">x</button>
        </div>
      </div>
      <div class="win-resize"></div>
    `;
    windowLayer.appendChild(win);

    makeDraggable(win, win.querySelector('.window-drag-handle'));
    makeResizable(win, win.querySelector('.win-resize'));
    win.addEventListener('pointerdown', () => bringToFront(win));

    const taskbarBtn = ensureTaskbarButton(appName);
    const entry = { win, meta, taskbarBtn, api: null };
    appWindows.set(appName, entry);

    win.querySelector('[data-action="close"]').addEventListener('click', ev => {
      ev.stopPropagation();
      closeWindow(appName);
    });
    win.querySelector('[data-action="min"]').addEventListener('click', ev => {
      ev.stopPropagation();
      minimizeWindow(appName);
    });
    win.querySelector('[data-action="full"]').addEventListener('click', ev => {
      ev.stopPropagation();
      toggleWindowFullscreen(appName);
    });

    if (isTerminal) createTerminal(win);
    if (isSettings) applySettingsUI(win, win.querySelector('.settings-window'));
    if (isExplorer) entry.api = createExplorer(win, payload);

    if (!isTerminal && !isSettings && !isExplorer) {
      const frame = win.querySelector('iframe');
      frame?.addEventListener('load', () => {
        try {
          frame.contentWindow?.postMessage({ type: 'tabby-os-style-change', style: normalizeOsStyle(currentOsStyle) }, '*');
        } catch (_) {}
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

  function openOrFocusApp(appName, payload) {
    if (!appMeta[appName]) return;
    const entry = appWindows.get(appName);
    if (!entry) return createWindow(appName, payload);
    if (entry.win.classList.contains('hidden')) restoreWindow(appName);
    else focusWindow(appName);
    if (payload?.path && entry.api?.open) entry.api.open(payload.path);
  }

  loadCfg();
  loadTier();
  updatePlusLauncher();
  ensureDir('/home/tabby');
  saveFs();
  applyDefaultIconLayout(false);
  makeDesktopIconsDraggable();
  createWindow('settings');
  minimizeWindow('settings');
  plusLauncher?.addEventListener('click', openPlusModal);

  window.addEventListener('resize', () => applyDefaultIconLayout(false));
  window.addEventListener('storage', ev => {
    if (ev.key === PLUS_KEY) {
      loadTier();
      updatePlusLauncher();
      return;
    }
    if (ev.key === OS_STYLE_KEY) {
      currentOsStyle = normalizeOsStyle(ev.newValue || localStorage.getItem(OS_STYLE_KEY));
      osRoot.dataset.osStyle = currentOsStyle;
      broadcastOsStyle();
      refreshClippy();
    }
  });
  document.addEventListener('tabby-profile-change', () => {
    loadTier();
    updatePlusLauncher();
  });
  window.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    if (document.fullscreenElement) return;
    const wins = [...windowLayer.querySelectorAll('.app-window')];
    if (!wins.length) return;
    const top = wins.sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0];
    const appName = [...appWindows.entries()].find(([, item]) => item.win === top)?.[0];
    if (appName) closeWindow(appName);
  });
})();
