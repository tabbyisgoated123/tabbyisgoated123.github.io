(function () {
  const STORAGE_KEY = 'tabby_profiles_v1';
  const ACTIVE_KEY = 'tabby_profiles_active_v1';
  const DEFAULT_PROFILE_ID = 'default';
  const PROFILE_COLORS = [
    { value: '#ff1a1a', label: 'Red' },
    { value: '#ff7a1a', label: 'Orange' },
    { value: '#ffd21a', label: 'Gold' },
    { value: '#4ade80', label: 'Green' },
    { value: '#38bdf8', label: 'Cyan' },
    { value: '#a855f7', label: 'Purple' },
    { value: '#f472b6', label: 'Pink' },
    { value: '#e5e7eb', label: 'White' },
  ];

  const DEFAULT_PREFS = {
    scanline: true,
    vignette: true,
    reduceMotion: false,
    cursor: 'crosshair',
    fontScale: 1,
    panelOpacity: 0.92,
  };

  const defaultState = {
    activeId: DEFAULT_PROFILE_ID,
    profiles: [
      {
        id: DEFAULT_PROFILE_ID,
        name: 'Tabby',
        color: '#ff1a1a',
        prefs: Object.assign({}, DEFAULT_PREFS),
        gameStats: {},
      },
    ],
  };

  const state = loadState();
  let mounted = false;
  let rootEl = null;
  let panelEl = null;
  let chipEl = null;
  let chipMarkEl = null;
  let previewMarkEl = null;
  let previewNameEl = null;
  let previewColorEl = null;
  let colorSwatchesEl = null;
  let listEl = null;
  let statusEl = null;
  let formEls = {};
  let homeLinkEl = null;

  function hexToRgbParts(hex) {
    const normalized = String(hex || '').trim().replace('#', '');
    if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
      const r = parseInt(normalized[0] + normalized[0], 16);
      const g = parseInt(normalized[1] + normalized[1], 16);
      const b = parseInt(normalized[2] + normalized[2], 16);
      return `${r} ${g} ${b}`;
    }
    if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
      const r = parseInt(normalized.slice(0, 2), 16);
      const g = parseInt(normalized.slice(2, 4), 16);
      const b = parseInt(normalized.slice(4, 6), 16);
      return `${r} ${g} ${b}`;
    }
    return '255 26 26';
  }

  function safePrefs(raw) {
    const prefs = raw && typeof raw === 'object' ? raw : {};
    return {
      scanline: prefs.scanline !== false,
      vignette: prefs.vignette !== false,
      reduceMotion: !!prefs.reduceMotion,
      cursor: ['crosshair', 'default', 'none'].includes(prefs.cursor) ? prefs.cursor : DEFAULT_PREFS.cursor,
      fontScale: clampNum(prefs.fontScale, 0.85, 1.25, DEFAULT_PREFS.fontScale),
      panelOpacity: clampNum(prefs.panelOpacity, 0.6, 1, DEFAULT_PREFS.panelOpacity),
    };
  }

  function clampNum(value, min, max, fallback) {
    const n = Number(value);
    if (!isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function safeProfile(raw) {
    const profile = raw && typeof raw === 'object' ? raw : {};
    const gameStats = profile.gameStats && typeof profile.gameStats === 'object' ? profile.gameStats : {};
    return {
      id: String(profile.id || `profile_${Date.now()}`),
      name: String(profile.name || 'New Profile').slice(0, 32),
      color: pickPaletteColor(profile.color, PROFILE_COLORS[0].value),
      prefs: safePrefs(profile.prefs),
      gameStats,
    };
  }

  function normalizeColor(value, fallback) {
    const input = String(value || '').trim();
    if (/^#[0-9a-fA-F]{3}$/.test(input) || /^#[0-9a-fA-F]{6}$/.test(input)) return input;
    return fallback;
  }

  function pickPaletteColor(value, fallback = PROFILE_COLORS[0].value) {
    const normalized = normalizeColor(value, fallback).toLowerCase();
    const found = PROFILE_COLORS.find(item => item.value.toLowerCase() === normalized);
    return found ? found.value : fallback;
  }

  function colorLabel(value) {
    const found = PROFILE_COLORS.find(item => item.value.toLowerCase() === String(value || '').toLowerCase());
    return found ? found.label : 'Custom';
  }

  function renderMark(profile, target) {
    if (!target) return;
    target.textContent = String(profile.name || 'T').trim().charAt(0).toUpperCase() || 'T';
    target.style.background = pickPaletteColor(profile.color, PROFILE_COLORS[0].value);
  }

  function loadState() {
    const cookieValue = readCookie(STORAGE_KEY);
    if (cookieValue) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookieValue));
        const profiles = Array.isArray(parsed.profiles) ? parsed.profiles.map(safeProfile) : [];
        const activeId = parsed.activeId || readCookie(ACTIVE_KEY) || DEFAULT_PROFILE_ID;
        if (profiles.length) {
          return {
            activeId,
            profiles,
          };
        }
      } catch (err) {
        // Fall through to default state.
      }
    }
    return JSON.parse(JSON.stringify(defaultState));
  }

  function readCookie(name) {
    const target = `${name}=`;
    const parts = document.cookie ? document.cookie.split('; ') : [];
    for (const part of parts) {
      if (part.indexOf(target) === 0) {
        return part.slice(target.length);
      }
    }
    return '';
  }

  function writeCookie(name, value) {
    document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365 * 5}; samesite=lax`;
  }

  function persistState() {
    const encoded = encodeURIComponent(JSON.stringify(state));
    writeCookie(STORAGE_KEY, encoded);
    writeCookie(ACTIVE_KEY, encodeURIComponent(state.activeId));
  }

  function getProfileGameStats(gameId) {
    const profile = getActiveProfile();
    const gameStats = profile.gameStats && typeof profile.gameStats === 'object' ? profile.gameStats : {};
    return gameStats[gameId] && typeof gameStats[gameId] === 'object' ? gameStats[gameId] : {};
  }

  function setProfileGameStat(gameId, values) {
    const profile = getActiveProfile();
    const next = safeProfile(profile);
    next.gameStats = JSON.parse(JSON.stringify(profile.gameStats || {}));
    next.gameStats[gameId] = Object.assign({}, next.gameStats[gameId] || {}, values);
    applyProfile(next, { rerenderList: true, emitChange: true });
    setStatus(`Updated ${gameId} stats`);
  }

  function getActiveProfile() {
    return state.profiles.find(profile => profile.id === state.activeId) || state.profiles[0] || safeProfile(defaultState.profiles[0]);
  }

  function applyTheme(profile) {
    const accent = pickPaletteColor(profile.color, PROFILE_COLORS[0].value);
    const rgb = hexToRgbParts(accent);
    const root = document.documentElement;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-glow', accent);
    root.style.setProperty('--accent-rgb', rgb);
    root.style.setProperty('--red', accent);
    root.style.setProperty('--red-glow', accent);
    document.body.dataset.profileId = profile.id;
    applyPrefs(profile.prefs || DEFAULT_PREFS);
  }

  function applyPrefs(prefs) {
    const safe = safePrefs(prefs);
    const root = document.documentElement;
    const body = document.body;
    body.dataset.scanline = safe.scanline ? 'on' : 'off';
    body.dataset.vignette = safe.vignette ? 'on' : 'off';
    body.dataset.reduceMotion = safe.reduceMotion ? 'on' : 'off';
    body.dataset.cursor = safe.cursor;
    root.style.setProperty('--ui-font-scale', String(safe.fontScale));
    root.style.setProperty('--ui-panel-opacity', String(safe.panelOpacity));
  }

  function updateChip(profile) {
    if (!chipEl || !chipMarkEl || !previewMarkEl) return;
    renderMark(profile, chipMarkEl);
    renderMark(profile, previewMarkEl);
    const nameEl = chipEl.querySelector('.profile-chip-name');
    const metaEl = chipEl.querySelector('.profile-chip-meta');
    if (nameEl) nameEl.textContent = profile.name;
    if (metaEl) metaEl.textContent = colorLabel(profile.color);
    if (previewNameEl) previewNameEl.textContent = profile.name;
    if (previewColorEl) previewColorEl.textContent = `${colorLabel(profile.color)} ${profile.color}`;
    if (formEls.name) formEls.name.value = profile.name;
    if (colorSwatchesEl) {
      colorSwatchesEl.querySelectorAll('.profile-color-swatch').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color?.toLowerCase() === profile.color.toLowerCase());
      });
    }
    const prefs = profile.prefs || DEFAULT_PREFS;
    if (formEls.scanline) formEls.scanline.checked = prefs.scanline;
    if (formEls.vignette) formEls.vignette.checked = prefs.vignette;
    if (formEls.reduceMotion) formEls.reduceMotion.checked = prefs.reduceMotion;
    if (formEls.cursor) formEls.cursor.value = prefs.cursor;
    if (formEls.fontScale) formEls.fontScale.value = Math.round(prefs.fontScale * 100);
    if (formEls.fontScaleVal) formEls.fontScaleVal.textContent = (prefs.fontScale).toFixed(2) + 'x';
    if (formEls.panelOpacity) formEls.panelOpacity.value = Math.round(prefs.panelOpacity * 100);
    if (formEls.panelOpacityVal) formEls.panelOpacityVal.textContent = Math.round(prefs.panelOpacity * 100) + '%';
  }

  function activeProfileFromForm() {
    const current = getActiveProfile();
    return safeProfile({
      id: current.id,
      name: formEls.name?.value,
      color: current.color,
      prefs: current.prefs,
      gameStats: current.gameStats,
    });
  }

  function applyProfile(profile, options = {}) {
    const { rerenderList = true, emitChange = true } = options;
    const index = state.profiles.findIndex(item => item.id === profile.id);
    if (index >= 0) {
      state.profiles[index] = profile;
    } else {
      state.profiles.push(profile);
    }
    state.activeId = profile.id;
    if (chipEl && chipMarkEl && previewMarkEl) {
      updateChip(profile);
    }
    applyTheme(profile);
    if (rerenderList) renderList();
    persistState();
    if (emitChange) {
      document.dispatchEvent(new CustomEvent('tabby-profile-change', { detail: { profile } }));
    }
  }

  function renderList() {
    if (!listEl) return;
    listEl.innerHTML = '';
    for (const profile of state.profiles) {
      const item = document.createElement('div');
      item.className = `profile-item${profile.id === state.activeId ? ' active' : ''}`;
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.dataset.id = profile.id;

      const avatar = document.createElement('div');
      avatar.className = 'profile-avatar';
      renderMark(profile, avatar);

      const copy = document.createElement('div');
      copy.className = 'profile-item-copy';
      const name = document.createElement('div');
      name.className = 'profile-item-name';
      name.textContent = profile.name;
      const color = document.createElement('div');
      color.className = 'profile-item-color';
      color.textContent = colorLabel(profile.color);
      copy.appendChild(name);
      copy.appendChild(color);

      const action = document.createElement('button');
      action.className = 'profile-item-action';
      action.type = 'button';
      action.textContent = profile.id === state.activeId ? 'Active' : 'Use';
      action.disabled = profile.id === state.activeId;
      action.addEventListener('click', ev => {
        ev.stopPropagation();
        setActiveProfile(profile.id);
      });

      item.appendChild(avatar);
      item.appendChild(copy);
      item.appendChild(action);

      item.addEventListener('click', () => setActiveProfile(profile.id));
      item.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          setActiveProfile(profile.id);
        }
      });

      listEl.appendChild(item);
    }
  }

  function setStatus(message) {
    if (statusEl) statusEl.textContent = message || '';
  }

  function syncFormToActive() {
    const profile = getActiveProfile();
    updateChip(profile);
    renderList();
    applyTheme(profile);
    persistState();
    document.dispatchEvent(new CustomEvent('tabby-profile-change', { detail: { profile } }));
  }

  function setActiveProfile(id) {
    const found = state.profiles.find(profile => profile.id === id);
    if (!found) return;
    state.activeId = id;
    syncFormToActive();
    setStatus(`Selected ${found.name}`);
  }

  function saveCurrentProfile() {
    applyProfile(activeProfileFromForm(), { rerenderList: true, emitChange: true });
    setStatus('Profile saved');
  }

  function updateActiveProfile(patch = {}) {
    const current = getActiveProfile();
    const next = safeProfile({
      id: current.id,
      name: patch.name ?? current.name,
      color: patch.color ?? current.color,
      prefs: Object.assign({}, current.prefs || DEFAULT_PREFS, patch.prefs || {}),
      gameStats: current.gameStats,
    });
    applyProfile(next, { rerenderList: true, emitChange: true });
    return next;
  }

  function createProfile() {
    const base = getActiveProfile();
    const created = safeProfile({
      id: `profile_${Date.now()}`,
      name: `${base.name} Copy`,
      color: base.color,
    });
    state.profiles.push(created);
    state.activeId = created.id;
    syncFormToActive();
    setStatus('New profile created');
  }

  function deleteActiveProfile() {
    if (state.profiles.length <= 1) {
      setStatus('At least one profile must remain');
      return;
    }
    const active = getActiveProfile();
    state.profiles = state.profiles.filter(profile => profile.id !== active.id);
    state.activeId = state.profiles[0].id;
    syncFormToActive();
    setStatus(`Deleted ${active.name}`);
  }

  function buildUI() {
    if (mounted) return;
    mounted = true;
    const profile = getActiveProfile();

    const dock = document.createElement('div');
    dock.className = 'profile-dock';
    dock.innerHTML = `
      <button type="button" class="profile-chip" aria-expanded="false" aria-controls="profile-panel">
        <div class="profile-avatar profile-chip-avatar"></div>
        <div class="profile-chip-copy">
          <div class="profile-chip-name"></div>
          <div class="profile-chip-meta"></div>
        </div>
      </button>
      <div class="profile-panel hidden" id="profile-panel" aria-label="Settings menu">
        <div class="profile-panel-head">
          <div class="profile-panel-title">
            <strong>Settings</strong>
            <span>cookie-based local profiles</span>
          </div>
          <button type="button" class="profile-panel-close" aria-label="Close settings panel">x</button>
        </div>
        <div class="profile-panel-body">
          <div class="profile-preview">
            <div class="profile-preview-avatar"></div>
            <div class="profile-preview-copy">
              <div class="profile-name"></div>
              <div class="profile-color"></div>
            </div>
          </div>
          <div class="profile-list">
            <div class="profile-list-label">Saved Profiles</div>
            <div class="profile-list-items"></div>
          </div>
          <div class="profile-form">
            <div class="profile-field">
              <label for="profile-name-input">Name</label>
              <input id="profile-name-input" type="text" maxlength="32" />
            </div>
            <div class="profile-field">
              <label>Color</label>
              <div class="profile-color-grid"></div>
              <div class="profile-color-note">Choose the accent that drives the site theme.</div>
            </div>
            <div class="profile-field profile-prefs-block">
              <label>Site preferences</label>
              <label class="profile-pref-toggle">
                <input id="pref-scanline" type="checkbox">
                <span>Scanline overlay</span>
              </label>
              <label class="profile-pref-toggle">
                <input id="pref-vignette" type="checkbox">
                <span>Vignette</span>
              </label>
              <label class="profile-pref-toggle">
                <input id="pref-reduce-motion" type="checkbox">
                <span>Reduce motion</span>
              </label>
              <div class="profile-pref-row">
                <span>Cursor</span>
                <select id="pref-cursor">
                  <option value="crosshair">Crosshair</option>
                  <option value="default">Default</option>
                  <option value="none">Hidden</option>
                </select>
              </div>
              <div class="profile-pref-row">
                <span>UI scale <em id="pref-font-scale-val">1.00x</em></span>
                <input id="pref-font-scale" type="range" min="85" max="125" step="5" value="100">
              </div>
              <div class="profile-pref-row">
                <span>Panel opacity <em id="pref-panel-opacity-val">92%</em></span>
                <input id="pref-panel-opacity" type="range" min="60" max="100" step="2" value="92">
              </div>
            </div>
            <div class="profile-actions">
              <button type="button" class="profile-btn primary" data-action="save">Save</button>
              <button type="button" class="profile-btn" data-action="new">New</button>
              <button type="button" class="profile-btn danger" data-action="delete">Delete</button>
            </div>
            <div class="profile-status" aria-live="polite"></div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(dock);
    document.body.classList.add('has-profile-dock');

    rootEl = dock;
    chipEl = dock.querySelector('.profile-chip');
    panelEl = dock.querySelector('.profile-panel');
    chipMarkEl = dock.querySelector('.profile-chip-avatar');
    previewMarkEl = dock.querySelector('.profile-preview-avatar');
    previewNameEl = dock.querySelector('.profile-name');
    previewColorEl = dock.querySelector('.profile-color');
    colorSwatchesEl = dock.querySelector('.profile-color-grid');
    listEl = dock.querySelector('.profile-list-items');
    statusEl = dock.querySelector('.profile-status');
    formEls = {
      name: dock.querySelector('#profile-name-input'),
      scanline: dock.querySelector('#pref-scanline'),
      vignette: dock.querySelector('#pref-vignette'),
      reduceMotion: dock.querySelector('#pref-reduce-motion'),
      cursor: dock.querySelector('#pref-cursor'),
      fontScale: dock.querySelector('#pref-font-scale'),
      fontScaleVal: dock.querySelector('#pref-font-scale-val'),
      panelOpacity: dock.querySelector('#pref-panel-opacity'),
      panelOpacityVal: dock.querySelector('#pref-panel-opacity-val'),
    };

    chipEl.addEventListener('click', () => togglePanel());
    dock.querySelector('.profile-panel-close').addEventListener('click', () => togglePanel(false));
    dock.querySelector('[data-action="save"]').addEventListener('click', saveCurrentProfile);
    dock.querySelector('[data-action="new"]').addEventListener('click', createProfile);
    dock.querySelector('[data-action="delete"]').addEventListener('click', deleteActiveProfile);

    if (formEls.name) {
      formEls.name.addEventListener('input', () => {
        applyProfile(activeProfileFromForm(), { rerenderList: true, emitChange: true });
        setStatus('Applied live');
      });
      formEls.name.addEventListener('change', () => {
        applyProfile(activeProfileFromForm(), { rerenderList: true, emitChange: true });
        setStatus('Applied live');
      });
    }

    bindPrefControl(formEls.scanline, 'change', el => ({ scanline: el.checked }));
    bindPrefControl(formEls.vignette, 'change', el => ({ vignette: el.checked }));
    bindPrefControl(formEls.reduceMotion, 'change', el => ({ reduceMotion: el.checked }));
    bindPrefControl(formEls.cursor, 'change', el => ({ cursor: el.value }));
    bindPrefControl(formEls.fontScale, 'input', el => {
      const v = +el.value / 100;
      if (formEls.fontScaleVal) formEls.fontScaleVal.textContent = v.toFixed(2) + 'x';
      return { fontScale: v };
    });
    bindPrefControl(formEls.panelOpacity, 'input', el => {
      const v = +el.value / 100;
      if (formEls.panelOpacityVal) formEls.panelOpacityVal.textContent = Math.round(v * 100) + '%';
      return { panelOpacity: v };
    });

    if (colorSwatchesEl) {
      colorSwatchesEl.innerHTML = '';
      for (const item of PROFILE_COLORS) {
        const swatch = document.createElement('button');
        swatch.type = 'button';
        swatch.className = 'profile-color-swatch';
        swatch.dataset.color = item.value;
        swatch.innerHTML = `
          <span class="profile-color-chip" style="background:${item.value}"></span>
          <span class="profile-color-name">${item.label}</span>
        `;
        swatch.addEventListener('click', () => {
          const current = getActiveProfile();
          applyProfile(safeProfile({
            id: current.id,
            name: current.name,
            color: item.value,
            gameStats: current.gameStats,
          }), { rerenderList: true, emitChange: true });
          setStatus(`Color set to ${item.label}`);
        });
        colorSwatchesEl.appendChild(swatch);
      }
    }

    const current = profile;
    updateChip(current);
    renderList();
    applyTheme(current);
    persistState();

    const isIndexPage = /(^|\/)index\.html?$/.test(window.location.pathname) || window.location.pathname === '/' || window.location.pathname === '';
    if (!isIndexPage) {
      homeLinkEl = document.createElement('a');
      homeLinkEl.className = 'profile-home-link';
      homeLinkEl.href = 'index.html';
      homeLinkEl.textContent = 'HOME';
      homeLinkEl.title = 'Home';
      homeLinkEl.setAttribute('aria-label', 'Go to home page');
      dock.insertBefore(homeLinkEl, panelEl);
    }
  }

  function bindPrefControl(el, evt, getPatch) {
    if (!el) return;
    el.addEventListener(evt, () => {
      const current = getActiveProfile();
      const patch = getPatch(el) || {};
      const merged = Object.assign({}, current.prefs || DEFAULT_PREFS, patch);
      const next = safeProfile({
        id: current.id,
        name: current.name,
        color: current.color,
        prefs: merged,
        gameStats: current.gameStats,
      });
      applyProfile(next, { rerenderList: false, emitChange: true });
      setStatus('Preference saved');
    });
  }

  function togglePanel(forceOpen) {
    if (!panelEl || !chipEl) return;
    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : panelEl.classList.contains('hidden');
    panelEl.classList.toggle('hidden', !shouldOpen);
    chipEl.setAttribute('aria-expanded', String(shouldOpen));
    if (shouldOpen) {
      updateChip(getActiveProfile());
      setStatus('Edit the active settings, or create another one');
    }
  }

  function init() {
    // TabbyOS now owns settings UI, so keep profile state/theme synced without mounting the old dock.
    applyTheme(getActiveProfile());
    persistState();
  }

  const api = {
    init,
    mount: init,
    getState: () => JSON.parse(JSON.stringify(state)),
    getActiveProfile,
    getProfileGameStats,
    setActiveProfile,
    saveCurrentProfile,
    createProfile,
    deleteActiveProfile,
    applyTheme,
    setProfileGameStat,
    updateActiveProfile,
    togglePanel,
  };

  window.TabbyProfiles = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
