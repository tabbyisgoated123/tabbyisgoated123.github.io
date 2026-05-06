(function () {
  const STORAGE_KEY = 'tabby_profiles_v1';
  const ACTIVE_KEY = 'tabby_profiles_active_v1';
  const DEFAULT_PROFILE_ID = 'default';

  const defaultState = {
    activeId: DEFAULT_PROFILE_ID,
    profiles: [
      {
        id: DEFAULT_PROFILE_ID,
        name: 'Tabby',
        color: '#ff1a1a',
        avatar: {
          type: 'emoji',
          value: '😺',
          imageUrl: '',
          background: '#111111',
        },
      },
    ],
  };

  const state = loadState();
  let mounted = false;
  let rootEl = null;
  let panelEl = null;
  let chipEl = null;
  let previewAvatarEl = null;
  let previewNameEl = null;
  let previewColorEl = null;
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

  function safeProfile(raw) {
    const profile = raw && typeof raw === 'object' ? raw : {};
    const avatar = profile.avatar && typeof profile.avatar === 'object' ? profile.avatar : {};
    return {
      id: String(profile.id || `profile_${Date.now()}`),
      name: String(profile.name || 'New Profile').slice(0, 32),
      color: normalizeColor(profile.color, '#ff1a1a'),
      avatar: {
        type: avatar.type === 'image' ? 'image' : 'emoji',
        value: String(avatar.value || '🙂').slice(0, 4),
        imageUrl: String(avatar.imageUrl || ''),
        background: normalizeColor(avatar.background, '#111111'),
      },
    };
  }

  function normalizeColor(value, fallback) {
    const input = String(value || '').trim();
    if (/^#[0-9a-fA-F]{3}$/.test(input) || /^#[0-9a-fA-F]{6}$/.test(input)) return input;
    return fallback;
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

  function getActiveProfile() {
    return state.profiles.find(profile => profile.id === state.activeId) || state.profiles[0] || safeProfile(defaultState.profiles[0]);
  }

  function applyTheme(profile) {
    const accent = normalizeColor(profile.color, '#ff1a1a');
    const rgb = hexToRgbParts(accent);
    const root = document.documentElement;
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-glow', accent);
    root.style.setProperty('--accent-rgb', rgb);
    root.style.setProperty('--red', accent);
    root.style.setProperty('--red-glow', accent);
    document.body.dataset.profileId = profile.id;
  }

  function renderAvatar(profile, target) {
    const avatar = profile.avatar || {};
    target.innerHTML = '';
    target.style.background = avatar.background || '#111';
    if (avatar.type === 'image' && avatar.imageUrl) {
      const img = document.createElement('img');
      img.alt = `${profile.name} avatar`;
      img.src = avatar.imageUrl;
      target.appendChild(img);
      return;
    }
    target.textContent = avatar.value || '🙂';
  }

  function updateChip(profile) {
    if (!chipEl || !previewAvatarEl) return;
    const chipAvatar = chipEl.querySelector('.profile-chip-avatar');
    if (chipAvatar) renderAvatar(profile, chipAvatar);
    renderAvatar(profile, previewAvatarEl);
    const nameEl = chipEl.querySelector('.profile-chip-name');
    const metaEl = chipEl.querySelector('.profile-chip-meta');
    if (nameEl) nameEl.textContent = profile.name;
    if (metaEl) metaEl.textContent = profile.color;
    if (previewNameEl) previewNameEl.textContent = profile.name;
    if (previewColorEl) previewColorEl.textContent = profile.color;
    if (formEls.name) formEls.name.value = profile.name;
    if (formEls.color) formEls.color.value = profile.color;
    if (formEls.avatarType) formEls.avatarType.value = profile.avatar.type;
    if (formEls.avatarValue) formEls.avatarValue.value = profile.avatar.value || '🙂';
    if (formEls.avatarImageUrl) formEls.avatarImageUrl.value = profile.avatar.imageUrl || '';
    if (formEls.avatarBackground) formEls.avatarBackground.value = profile.avatar.background || '#111111';
  }

  function activeProfileFromForm() {
    const current = getActiveProfile();
    return safeProfile({
      id: current.id,
      name: formEls.name?.value,
      color: formEls.color?.value,
      avatar: {
        type: formEls.avatarType?.value,
        value: formEls.avatarValue?.value,
        imageUrl: formEls.avatarImageUrl?.value,
        background: formEls.avatarBackground?.value,
      },
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
    if (chipEl && previewAvatarEl) {
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
      renderAvatar(profile, avatar);

      const copy = document.createElement('div');
      copy.className = 'profile-item-copy';
      const name = document.createElement('div');
      name.className = 'profile-item-name';
      name.textContent = profile.name;
      const color = document.createElement('div');
      color.className = 'profile-item-color';
      color.textContent = profile.color;
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

  function createProfile() {
    const base = getActiveProfile();
    const created = safeProfile({
      id: `profile_${Date.now()}`,
      name: `${base.name} Copy`,
      color: base.color,
      avatar: JSON.parse(JSON.stringify(base.avatar || defaultState.profiles[0].avatar)),
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
      <div class="profile-panel hidden" id="profile-panel" aria-label="Profile manager">
        <div class="profile-panel-head">
          <div class="profile-panel-title">
            <strong>Profile</strong>
            <span>cookie-based local identity</span>
          </div>
          <button type="button" class="profile-panel-close" aria-label="Close profile panel">x</button>
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
            <div class="profile-inline">
              <div class="profile-field">
                <label for="profile-color-input">Color</label>
                <input id="profile-color-input" type="color" />
              </div>
              <div class="profile-field">
                <label for="profile-avatar-type">Avatar</label>
                <select id="profile-avatar-type">
                  <option value="emoji">Emoji</option>
                  <option value="image">Image</option>
                </select>
              </div>
            </div>
            <div class="profile-field">
              <label for="profile-avatar-value">Emoji</label>
              <input id="profile-avatar-value" type="text" maxlength="4" placeholder="😺" />
            </div>
            <div class="profile-field">
              <label for="profile-avatar-image">Image URL</label>
              <input id="profile-avatar-image" type="url" placeholder="https://..." />
            </div>
            <div class="profile-field">
              <label for="profile-avatar-bg">Avatar Background</label>
              <input id="profile-avatar-bg" type="color" />
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
    previewAvatarEl = dock.querySelector('.profile-preview-avatar');
    previewNameEl = dock.querySelector('.profile-name');
    previewColorEl = dock.querySelector('.profile-color');
    listEl = dock.querySelector('.profile-list-items');
    statusEl = dock.querySelector('.profile-status');
    formEls = {
      name: dock.querySelector('#profile-name-input'),
      color: dock.querySelector('#profile-color-input'),
      avatarType: dock.querySelector('#profile-avatar-type'),
      avatarValue: dock.querySelector('#profile-avatar-value'),
      avatarImageUrl: dock.querySelector('#profile-avatar-image'),
      avatarBackground: dock.querySelector('#profile-avatar-bg'),
    };

    chipEl.addEventListener('click', () => togglePanel());
    dock.querySelector('.profile-panel-close').addEventListener('click', () => togglePanel(false));
    dock.querySelector('[data-action="save"]').addEventListener('click', saveCurrentProfile);
    dock.querySelector('[data-action="new"]').addEventListener('click', createProfile);
    dock.querySelector('[data-action="delete"]').addEventListener('click', deleteActiveProfile);

    for (const input of Object.values(formEls)) {
      input.addEventListener('input', () => {
        applyProfile(activeProfileFromForm(), { rerenderList: true, emitChange: true });
        setStatus('Applied live');
      });
      input.addEventListener('change', () => {
        applyProfile(activeProfileFromForm(), { rerenderList: true, emitChange: true });
        setStatus('Applied live');
      });
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
      homeLinkEl.textContent = 'Home';
      dock.insertBefore(homeLinkEl, panelEl);
    }
  }

  function togglePanel(forceOpen) {
    if (!panelEl || !chipEl) return;
    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : panelEl.classList.contains('hidden');
    panelEl.classList.toggle('hidden', !shouldOpen);
    chipEl.setAttribute('aria-expanded', String(shouldOpen));
    if (shouldOpen) {
      updateChip(getActiveProfile());
      setStatus('Edit the active profile, or create another one');
    }
  }

  function init() {
    buildUI();
  }

  const api = {
    init,
    mount: init,
    getState: () => JSON.parse(JSON.stringify(state)),
    getActiveProfile,
    setActiveProfile,
    saveCurrentProfile,
    createProfile,
    deleteActiveProfile,
    applyTheme,
    togglePanel,
  };

  window.TabbyProfiles = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
