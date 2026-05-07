const canvas = document.getElementById('craft-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

const startScreen = document.getElementById('craft-start-screen');
const pauseScreen = document.getElementById('craft-pause-screen');
const craftPanel = document.getElementById('craft-craft-panel');
const craftMessage = document.getElementById('craft-message');
const hotbarEl = document.getElementById('craft-hotbar');
const mobileControls = document.getElementById('craft-mobile-controls');
const moveStick = document.getElementById('move-stick');
const moveKnob = moveStick?.querySelector('.craft-stick-knob');
const lookPad = document.getElementById('look-pad');

const statBlocks = document.getElementById('stat-blocks');
const statDay = document.getElementById('stat-day');
const statMode = document.getElementById('stat-mode');
const statBots = document.getElementById('stat-bots');
const pauseBlocks = document.getElementById('pause-blocks');
const pauseDay = document.getElementById('pause-day');
const pauseBots = document.getElementById('pause-bots');

const seedInput = document.getElementById('seed-input');
const presetSelect = document.getElementById('preset-select');
const worldSizeSlider = document.getElementById('world-size-slider');
const renderSlider = document.getElementById('render-slider');
const modeSelect = document.getElementById('mode-select');
const difficultySelect = document.getElementById('difficulty-select');
const dayLengthSlider = document.getElementById('day-length-slider');
const mobileToggle = document.getElementById('mobile-toggle');
const sensitivitySlider = document.getElementById('sensitivity-slider');
const fovSlider = document.getElementById('fov-slider');
const walkSpeedSlider = document.getElementById('walk-speed-slider');
const jumpSlider = document.getElementById('jump-slider');
const gravitySlider = document.getElementById('gravity-slider');
const brightnessSlider = document.getElementById('brightness-slider');
const sprintToggle = document.getElementById('sprint-toggle');
const autoJumpToggle = document.getElementById('auto-jump-toggle');
const bobbingToggle = document.getElementById('bobbing-toggle');
const invertToggle = document.getElementById('invert-toggle');
const particleSelect = document.getElementById('particle-select');
const crosshairSelect = document.getElementById('crosshair-select');
const weatherSelect = document.getElementById('weather-select');
const textureToggle = document.getElementById('texture-toggle');
const smoothLightToggle = document.getElementById('smooth-light-toggle');
const skyToggle = document.getElementById('sky-toggle');
const handToggle = document.getElementById('hand-toggle');
const fpsToggle = document.getElementById('fps-toggle');
const masterVolSlider = document.getElementById('master-vol-slider');
const sfxVolSlider = document.getElementById('sfx-vol-slider');
const musicVolSlider = document.getElementById('music-vol-slider');
const ambientToggle = document.getElementById('ambient-toggle');
const entityCullingToggle = document.getElementById('entity-culling-toggle');
const fogToggle = document.getElementById('fog-toggle');
const cloudToggle = document.getElementById('cloud-toggle');
const shadowToggle = document.getElementById('shadow-toggle');
const lowPolyToggle = document.getElementById('lowpoly-toggle');
const luckyToggle = document.getElementById('lucky-toggle');
const crazyTntToggle = document.getElementById('crazy-tnt-toggle');
const botsToggle = document.getElementById('bots-toggle');
const botCountSlider = document.getElementById('bot-count-slider');
const seedValue = document.getElementById('seed-value');
const presetValue = document.getElementById('preset-value');
const worldSizeValue = document.getElementById('world-size-value');
const renderValue = document.getElementById('render-value');
const modeValue = document.getElementById('mode-value');
const difficultyValue = document.getElementById('difficulty-value');
const dayLengthValue = document.getElementById('day-length-value');
const sensitivityValue = document.getElementById('sensitivity-value');
const fovValue = document.getElementById('fov-value');
const walkSpeedValue = document.getElementById('walk-speed-value');
const jumpValue = document.getElementById('jump-value');
const gravityValue = document.getElementById('gravity-value');
const brightnessValue = document.getElementById('brightness-value');
const particleValue = document.getElementById('particle-value');
const crosshairValue = document.getElementById('crosshair-value');
const weatherValue = document.getElementById('weather-value');
const masterVolValue = document.getElementById('master-vol-value');
const sfxVolValue = document.getElementById('sfx-vol-value');
const musicVolValue = document.getElementById('music-vol-value');
const botCountValue = document.getElementById('bot-count-value');

const randomSeedBtn = document.getElementById('random-seed-btn');
const regenerateBtn = document.getElementById('regenerate-btn');
const playBtn = document.getElementById('play-btn');
const menuBtn = document.getElementById('craft-menu-btn');
const resumeBtn = document.getElementById('resume-btn');
const newWorldBtn = document.getElementById('new-world-btn');
const backHomeBtn = document.getElementById('back-home-btn');
const inventoryBtn = document.getElementById('mobile-inventory');
const mobileJumpBtn = document.getElementById('mobile-jump');
const mobileBreakBtn = document.getElementById('mobile-break');
const mobilePlaceBtn = document.getElementById('mobile-place');

const STORAGE_PREFIX = 'tabbycraft_settings_v1';
const PLACEABLE_BLOCKS = ['grass', 'dirt', 'stone', 'wood', 'planks', 'sand', 'water', 'tnt', 'lucky'];
const RECIPES = [
  { id: 'planks', name: 'Planks x4', inputs: [{ type: 'wood', count: 1 }], output: { type: 'planks', count: 4 } },
  { id: 'workbench', name: 'Workbench', inputs: [{ type: 'planks', count: 4 }], output: { type: 'workbench', count: 1 } },
  { id: 'stonebrick', name: 'Stone Bricks x4', inputs: [{ type: 'stone', count: 4 }], output: { type: 'stonebrick', count: 4 } },
  { id: 'tnt', name: 'TNT', inputs: [{ type: 'sand', count: 4 }, { type: 'coal', count: 1 }], output: { type: 'tnt', count: 1 } },
  { id: 'lucky', name: 'Lucky Block', inputs: [{ type: 'gold', count: 2 }, { type: 'diamond', count: 1 }], output: { type: 'lucky', count: 1 } },
];
const BOT_NAMES = ['Nova', 'Pixel', 'Moss', 'Luna', 'Stone', 'Twig', 'Echo', 'Spark'];
const PRESET_COLORS = {
  plains: { grass: '#79c05a', dirt: '#8b5a2b', stone: '#828282', sand: '#dbd3a0', water: '#3f76e4' },
  forest: { grass: '#59ae3d', dirt: '#79553a', stone: '#7c8087', sand: '#d4c98c', water: '#3f76e4' },
  desert: { grass: '#dbcf8e', dirt: '#c5a76a', stone: '#a39c84', sand: '#dbd3a0', water: '#3f76e4' },
  islands: { grass: '#7ac35a', dirt: '#7f5530', stone: '#828282', sand: '#dbd3a0', water: '#3f76e4' },
};
// Palette is closer to vanilla MC textures; faces define top/side/bottom.
const BLOCKS = {
  air: { name: 'Air', solid: false, transparent: true, placeable: false, color: '#000000' },
  grass: { name: 'Grass', solid: true, transparent: false, placeable: true, faces: { top: '#79c05a', side: '#79c05a', sideLower: '#8b5a2b', bottom: '#8b5a2b' }, texture: 'grass', drop: 'dirt' },
  dirt: { name: 'Dirt', solid: true, transparent: false, placeable: true, color: '#8b5a2b', texture: 'dirt', drop: 'dirt' },
  stone: { name: 'Stone', solid: true, transparent: false, placeable: true, color: '#828282', texture: 'stone', drop: 'stone' },
  wood: { name: 'Wood', solid: true, transparent: false, placeable: true, faces: { top: '#a07842', side: '#6b4f2a', bottom: '#a07842' }, texture: 'log', drop: 'wood' },
  planks: { name: 'Planks', solid: true, transparent: false, placeable: true, color: '#b07e44', texture: 'planks', drop: 'planks' },
  sand: { name: 'Sand', solid: true, transparent: false, placeable: true, color: '#dbd3a0', texture: 'sand', drop: 'sand' },
  water: { name: 'Water', solid: false, transparent: true, placeable: true, color: '#3f76e4', alpha: 0.7, texture: 'water', drop: 'water' },
  leaves: { name: 'Leaves', solid: false, transparent: true, placeable: false, color: '#48761d', alpha: 0.85, texture: 'leaves', drop: 'leaves' },
  tnt: { name: 'TNT', solid: true, transparent: false, placeable: true, faces: { top: '#bd2c2c', side: '#cf3838', bottom: '#7e1c1c' }, texture: 'tnt', drop: 'tnt' },
  lucky: { name: 'Lucky Block', solid: true, transparent: false, placeable: true, faces: { top: '#ffd94c', side: '#efbf1f', bottom: '#b98b00' }, texture: 'lucky', drop: 'lucky' },
  stonebrick: { name: 'Stone Bricks', solid: true, transparent: false, placeable: true, color: '#7c7c7c', texture: 'brick', drop: 'stonebrick' },
  workbench: { name: 'Workbench', solid: true, transparent: false, placeable: true, faces: { top: '#a76b35', side: '#7a4d22', bottom: '#5e3915' }, texture: 'workbench', drop: 'workbench' },
  coal_ore: { name: 'Coal Ore', solid: true, transparent: false, placeable: false, color: '#828282', texture: 'coal_ore', drop: 'coal' },
  iron_ore: { name: 'Iron Ore', solid: true, transparent: false, placeable: false, color: '#828282', texture: 'iron_ore', drop: 'iron' },
  gold_ore: { name: 'Gold Ore', solid: true, transparent: false, placeable: false, color: '#828282', texture: 'gold_ore', drop: 'gold' },
  diamond_ore: { name: 'Diamond Ore', solid: true, transparent: false, placeable: false, color: '#828282', texture: 'diamond_ore', drop: 'diamond' },
  cactus: { name: 'Cactus', solid: true, transparent: false, placeable: false, faces: { top: '#5c8b3a', side: '#3e7530', bottom: '#3a5d28' }, texture: 'cactus', drop: 'cactus' },
};
const FACE_DEFS = [
  { name: 'north', offset: [0, 0, 1], verts: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], shade: 0.94 },
  { name: 'south', offset: [0, 0, -1], verts: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], shade: 0.82 },
  { name: 'east', offset: [1, 0, 0], verts: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], shade: 0.88 },
  { name: 'west', offset: [-1, 0, 0], verts: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], shade: 0.88 },
  { name: 'top', offset: [0, 1, 0], verts: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], shade: 1.0 },
  { name: 'bottom', offset: [0, -1, 0], verts: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], shade: 0.68 },
];
const DEFAULT_SETTINGS = {
  seed: 'tabby',
  preset: 'plains',
  worldSize: 48,
  renderDistance: 8,
  mode: 'survival',
  difficulty: 'normal',
  dayLength: 3,
  mobileControls: false,
  sensitivity: 1,
  fov: 75,
  walkSpeed: 1.0,
  jumpStrength: 1.0,
  gravity: 1.0,
  brightness: 1.0,
  sprintToggle: true,
  autoJump: false,
  bobbing: true,
  invertY: false,
  particleLevel: 'medium',
  crosshair: 'cross',
  weather: 'clear',
  textures: true,
  smoothLight: true,
  sky: true,
  hand: true,
  showFps: false,
  masterVolume: 0.6,
  sfxVolume: 0.7,
  musicVolume: 0.4,
  ambient: true,
  entityCulling: true,
  fogRemover: false,
  cloudRemover: false,
  shadow: true,
  lowPoly: false,
  luckyBlocks: true,
  crazyTnt: true,
  bots: true,
  botCount: 3,
};

let settings = loadSettings();
let world = new Map();
let cloudLayer = [];
let bots = [];
let particles = [];
let hotbarButtons = [];
let currentTarget = null;
let currentPlace = null;
let gameActive = false;
let paused = true;
let inventoryOpen = false;
let selectedSlot = 0;
let blocksMined = 0;
let blocksPlaced = 0;
let dayCount = 1;
let dayPhase = 0;
let timeClock = 0;
let requestFrame = 0;
let lastTs = 0;
let worldSeed = 0;
let targetMessageTimer = 0;
let settingsDirty = false;
let pointerLocked = false;
let mouseDownLook = false;
let lookTouchId = null;
let moveTouchId = null;
let moveTouchStart = { x: 0, y: 0 };
let moveTouchVector = { x: 0, y: 0 };
let lookTouchStart = { x: 0, y: 0 };
let lookTouchVector = { x: 0, y: 0 };
let moveInput = { x: 0, y: 0 };
let keys = new Set();

const player = {
  x: 24,
  y: 12,
  z: 24,
  vx: 0,
  vy: 0,
  vz: 0,
  yaw: 0,
  pitch: 0,
  onGround: false,
  fly: false,
  health: 20,
};

let inventory = {};

function settingsKey() {
  const profileId = window.TabbyProfiles?.getActiveProfile?.()?.id || 'global';
  return `${STORAGE_PREFIX}:${profileId}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand(seed) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function rand3(x, y, z, salt = 0) {
  return rand(hashString(`${x}|${y}|${z}|${salt}|${worldSeed}`));
}

function rand2(x, z, salt = 0) {
  return rand(hashString(`${x}|${z}|${salt}|${worldSeed}`));
}

function hexToRgb(hex) {
  const clean = String(hex || '').replace('#', '');
  if (/^[0-9a-fA-F]{3}$/.test(clean)) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  if (/^[0-9a-fA-F]{6}$/.test(clean)) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ];
  }
  return [255, 255, 255];
}

function rgba(hex, alpha, factor = 1) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)}, ${alpha})`;
}

function normalizeSettings(raw) {
  const merged = Object.assign({}, DEFAULT_SETTINGS, raw || {});
  merged.seed = String(merged.seed || DEFAULT_SETTINGS.seed).slice(0, 32);
  merged.preset = ['plains', 'forest', 'desert', 'islands'].includes(merged.preset) ? merged.preset : DEFAULT_SETTINGS.preset;
  merged.worldSize = clamp(Number(merged.worldSize || DEFAULT_SETTINGS.worldSize), 24, 72);
  merged.renderDistance = clamp(Number(merged.renderDistance || DEFAULT_SETTINGS.renderDistance), 4, 12);
  merged.mode = merged.mode === 'creative' ? 'creative' : 'survival';
  merged.difficulty = ['easy', 'normal', 'hard'].includes(merged.difficulty) ? merged.difficulty : DEFAULT_SETTINGS.difficulty;
  merged.dayLength = clamp(Number(merged.dayLength || DEFAULT_SETTINGS.dayLength), 1, 6);
  merged.mobileControls = !!merged.mobileControls;
  merged.sensitivity = clamp(Number(merged.sensitivity || DEFAULT_SETTINGS.sensitivity), 0.5, 2);
  merged.fov = clamp(Number(merged.fov || DEFAULT_SETTINGS.fov), 50, 110);
  merged.walkSpeed = clamp(Number(merged.walkSpeed || DEFAULT_SETTINGS.walkSpeed), 0.5, 2);
  merged.jumpStrength = clamp(Number(merged.jumpStrength || DEFAULT_SETTINGS.jumpStrength), 0.5, 2);
  merged.gravity = clamp(Number(merged.gravity || DEFAULT_SETTINGS.gravity), 0.5, 2);
  merged.brightness = clamp(Number(merged.brightness || DEFAULT_SETTINGS.brightness), 0.5, 2);
  merged.sprintToggle = merged.sprintToggle !== false;
  merged.autoJump = !!merged.autoJump;
  merged.bobbing = merged.bobbing !== false;
  merged.invertY = !!merged.invertY;
  merged.particleLevel = ['none', 'low', 'medium', 'high'].includes(merged.particleLevel) ? merged.particleLevel : DEFAULT_SETTINGS.particleLevel;
  merged.crosshair = ['cross', 'dot', 'circle', 'hidden'].includes(merged.crosshair) ? merged.crosshair : DEFAULT_SETTINGS.crosshair;
  merged.weather = ['clear', 'rain', 'snow', 'storm'].includes(merged.weather) ? merged.weather : DEFAULT_SETTINGS.weather;
  merged.textures = merged.textures !== false;
  merged.smoothLight = merged.smoothLight !== false;
  merged.sky = merged.sky !== false;
  merged.hand = merged.hand !== false;
  merged.showFps = !!merged.showFps;
  merged.masterVolume = clamp(Number(merged.masterVolume ?? DEFAULT_SETTINGS.masterVolume), 0, 1);
  merged.sfxVolume = clamp(Number(merged.sfxVolume ?? DEFAULT_SETTINGS.sfxVolume), 0, 1);
  merged.musicVolume = clamp(Number(merged.musicVolume ?? DEFAULT_SETTINGS.musicVolume), 0, 1);
  merged.ambient = merged.ambient !== false;
  merged.entityCulling = merged.entityCulling !== false;
  merged.fogRemover = !!merged.fogRemover;
  merged.cloudRemover = !!merged.cloudRemover;
  merged.shadow = merged.shadow !== false;
  merged.lowPoly = !!merged.lowPoly;
  merged.luckyBlocks = merged.luckyBlocks !== false;
  merged.crazyTnt = merged.crazyTnt !== false;
  merged.bots = merged.bots !== false;
  merged.botCount = clamp(Number(merged.botCount || DEFAULT_SETTINGS.botCount), 0, 8);
  return merged;
}

function loadSettings() {
  try {
    const stored = localStorage.getItem(settingsKey());
    return normalizeSettings(stored ? JSON.parse(stored) : DEFAULT_SETTINGS);
  } catch (err) {
    return normalizeSettings(DEFAULT_SETTINGS);
  }
}

function saveSettings() {
  try {
    localStorage.setItem(settingsKey(), JSON.stringify(settings));
    settingsDirty = false;
  } catch (err) {
    // Ignore storage issues.
  }
}

function applySettingsToUi() {
  seedInput.value = settings.seed;
  presetSelect.value = settings.preset;
  worldSizeSlider.value = settings.worldSize;
  renderSlider.value = settings.renderDistance;
  modeSelect.value = settings.mode;
  difficultySelect.value = settings.difficulty;
  dayLengthSlider.value = settings.dayLength;
  mobileToggle.checked = settings.mobileControls;
  sensitivitySlider.value = Math.round(settings.sensitivity * 10);
  if (fovSlider) fovSlider.value = settings.fov;
  if (walkSpeedSlider) walkSpeedSlider.value = Math.round(settings.walkSpeed * 10);
  if (jumpSlider) jumpSlider.value = Math.round(settings.jumpStrength * 10);
  if (gravitySlider) gravitySlider.value = Math.round(settings.gravity * 10);
  if (brightnessSlider) brightnessSlider.value = Math.round(settings.brightness * 10);
  sprintToggle.checked = settings.sprintToggle;
  autoJumpToggle.checked = settings.autoJump;
  if (bobbingToggle) bobbingToggle.checked = settings.bobbing;
  if (invertToggle) invertToggle.checked = settings.invertY;
  if (particleSelect) particleSelect.value = settings.particleLevel;
  if (crosshairSelect) crosshairSelect.value = settings.crosshair;
  if (weatherSelect) weatherSelect.value = settings.weather;
  if (textureToggle) textureToggle.checked = settings.textures;
  if (smoothLightToggle) smoothLightToggle.checked = settings.smoothLight;
  if (skyToggle) skyToggle.checked = settings.sky;
  if (handToggle) handToggle.checked = settings.hand;
  if (fpsToggle) fpsToggle.checked = settings.showFps;
  if (masterVolSlider) masterVolSlider.value = Math.round(settings.masterVolume * 100);
  if (sfxVolSlider) sfxVolSlider.value = Math.round(settings.sfxVolume * 100);
  if (musicVolSlider) musicVolSlider.value = Math.round(settings.musicVolume * 100);
  if (ambientToggle) ambientToggle.checked = settings.ambient;
  entityCullingToggle.checked = settings.entityCulling;
  fogToggle.checked = settings.fogRemover;
  cloudToggle.checked = settings.cloudRemover;
  shadowToggle.checked = settings.shadow;
  lowPolyToggle.checked = settings.lowPoly;
  luckyToggle.checked = settings.luckyBlocks;
  crazyTntToggle.checked = settings.crazyTnt;
  botsToggle.checked = settings.bots;
  botCountSlider.value = settings.botCount;

  seedValue.textContent = settings.seed;
  presetValue.textContent = capitalize(settings.preset);
  worldSizeValue.textContent = String(settings.worldSize);
  renderValue.textContent = String(settings.renderDistance);
  modeValue.textContent = settings.mode;
  difficultyValue.textContent = settings.difficulty;
  dayLengthValue.textContent = String(settings.dayLength);
  sensitivityValue.textContent = (settings.sensitivity).toFixed(1);
  if (fovValue) fovValue.textContent = String(settings.fov);
  if (walkSpeedValue) walkSpeedValue.textContent = settings.walkSpeed.toFixed(1) + 'x';
  if (jumpValue) jumpValue.textContent = settings.jumpStrength.toFixed(1) + 'x';
  if (gravityValue) gravityValue.textContent = settings.gravity.toFixed(1) + 'x';
  if (brightnessValue) brightnessValue.textContent = settings.brightness.toFixed(1) + 'x';
  if (particleValue) particleValue.textContent = capitalize(settings.particleLevel);
  if (crosshairValue) crosshairValue.textContent = capitalize(settings.crosshair);
  if (weatherValue) weatherValue.textContent = capitalize(settings.weather);
  if (masterVolValue) masterVolValue.textContent = Math.round(settings.masterVolume * 100) + '%';
  if (sfxVolValue) sfxVolValue.textContent = Math.round(settings.sfxVolume * 100) + '%';
  if (musicVolValue) musicVolValue.textContent = Math.round(settings.musicVolume * 100) + '%';
  botCountValue.textContent = String(settings.botCount);
  mobileControls.classList.toggle('hidden', !settings.mobileControls);
  applyCrosshairStyle();
  renderHotbar();
  updateCraftPanel();
  updateHud();
}

function applyCrosshairStyle() {
  const ch = document.getElementById('craft-crosshair');
  if (!ch) return;
  ch.dataset.style = settings.crosshair;
  ch.style.display = settings.crosshair === 'hidden' ? 'none' : '';
}

function capitalize(text) {
  return String(text || '').charAt(0).toUpperCase() + String(text || '').slice(1);
}

function bindSetting(el, handler, evt = 'input') {
  el.addEventListener(evt, () => {
    handler();
    settingsDirty = true;
    saveSettings();
    applySettingsToUi();
  });
}

function bindUi() {
  bindSetting(seedInput, () => { settings.seed = seedInput.value.trim() || DEFAULT_SETTINGS.seed; });
  bindSetting(presetSelect, () => { settings.preset = presetSelect.value; }, 'change');
  bindSetting(worldSizeSlider, () => { settings.worldSize = +worldSizeSlider.value; });
  bindSetting(renderSlider, () => { settings.renderDistance = +renderSlider.value; });
  bindSetting(modeSelect, () => { settings.mode = modeSelect.value; }, 'change');
  bindSetting(difficultySelect, () => { settings.difficulty = difficultySelect.value; }, 'change');
  bindSetting(dayLengthSlider, () => { settings.dayLength = +dayLengthSlider.value; });
  bindSetting(mobileToggle, () => { settings.mobileControls = mobileToggle.checked; }, 'change');
  bindSetting(sensitivitySlider, () => { settings.sensitivity = +sensitivitySlider.value / 10; });
  if (fovSlider) bindSetting(fovSlider, () => { settings.fov = +fovSlider.value; });
  if (walkSpeedSlider) bindSetting(walkSpeedSlider, () => { settings.walkSpeed = +walkSpeedSlider.value / 10; });
  if (jumpSlider) bindSetting(jumpSlider, () => { settings.jumpStrength = +jumpSlider.value / 10; });
  if (gravitySlider) bindSetting(gravitySlider, () => { settings.gravity = +gravitySlider.value / 10; });
  if (brightnessSlider) bindSetting(brightnessSlider, () => { settings.brightness = +brightnessSlider.value / 10; });
  bindSetting(sprintToggle, () => { settings.sprintToggle = sprintToggle.checked; }, 'change');
  bindSetting(autoJumpToggle, () => { settings.autoJump = autoJumpToggle.checked; }, 'change');
  if (bobbingToggle) bindSetting(bobbingToggle, () => { settings.bobbing = bobbingToggle.checked; }, 'change');
  if (invertToggle) bindSetting(invertToggle, () => { settings.invertY = invertToggle.checked; }, 'change');
  if (particleSelect) bindSetting(particleSelect, () => { settings.particleLevel = particleSelect.value; }, 'change');
  if (crosshairSelect) bindSetting(crosshairSelect, () => { settings.crosshair = crosshairSelect.value; }, 'change');
  if (weatherSelect) bindSetting(weatherSelect, () => { settings.weather = weatherSelect.value; }, 'change');
  if (textureToggle) bindSetting(textureToggle, () => { settings.textures = textureToggle.checked; }, 'change');
  if (smoothLightToggle) bindSetting(smoothLightToggle, () => { settings.smoothLight = smoothLightToggle.checked; }, 'change');
  if (skyToggle) bindSetting(skyToggle, () => { settings.sky = skyToggle.checked; }, 'change');
  if (handToggle) bindSetting(handToggle, () => { settings.hand = handToggle.checked; }, 'change');
  if (fpsToggle) bindSetting(fpsToggle, () => { settings.showFps = fpsToggle.checked; }, 'change');
  if (masterVolSlider) bindSetting(masterVolSlider, () => { settings.masterVolume = +masterVolSlider.value / 100; });
  if (sfxVolSlider) bindSetting(sfxVolSlider, () => { settings.sfxVolume = +sfxVolSlider.value / 100; });
  if (musicVolSlider) bindSetting(musicVolSlider, () => { settings.musicVolume = +musicVolSlider.value / 100; });
  if (ambientToggle) bindSetting(ambientToggle, () => { settings.ambient = ambientToggle.checked; }, 'change');
  bindSetting(entityCullingToggle, () => { settings.entityCulling = entityCullingToggle.checked; }, 'change');
  bindSetting(fogToggle, () => { settings.fogRemover = fogToggle.checked; }, 'change');
  bindSetting(cloudToggle, () => { settings.cloudRemover = cloudToggle.checked; }, 'change');
  bindSetting(shadowToggle, () => { settings.shadow = shadowToggle.checked; }, 'change');
  bindSetting(lowPolyToggle, () => { settings.lowPoly = lowPolyToggle.checked; }, 'change');
  bindSetting(luckyToggle, () => { settings.luckyBlocks = luckyToggle.checked; }, 'change');
  bindSetting(crazyTntToggle, () => { settings.crazyTnt = crazyTntToggle.checked; }, 'change');
  bindSetting(botsToggle, () => { settings.bots = botsToggle.checked; }, 'change');
  bindSetting(botCountSlider, () => { settings.botCount = +botCountSlider.value; });

  randomSeedBtn.addEventListener('click', () => {
    settings.seed = makeRandomSeed();
    seedInput.value = settings.seed;
    saveSettings();
    applySettingsToUi();
  });

  regenerateBtn.addEventListener('click', () => {
    regenerateWorld(false);
    showMessage('new world generated');
  });

  playBtn.addEventListener('click', () => {
    startGame();
  });

  menuBtn.addEventListener('click', () => {
    if (gameActive) {
      pauseGame();
    } else {
      showStartScreen();
    }
  });

  resumeBtn.addEventListener('click', () => resumeGame());
  newWorldBtn.addEventListener('click', () => {
    regenerateWorld(false);
    resumeGame();
  });
  backHomeBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  inventoryBtn?.addEventListener('click', () => toggleCraftPanel());
  mobileJumpBtn?.addEventListener('click', () => {
    if (!gameActive) return;
    if (settings.mode === 'creative' || player.onGround) {
      const jumpV = settings.mode === 'creative' ? 5.6 : 8.4;
      player.vy = jumpV * settings.jumpStrength;
    }
  });
  mobileBreakBtn?.addEventListener('click', () => breakTarget());
  mobilePlaceBtn?.addEventListener('click', () => placeTarget());

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === canvas;
  });
  canvas.addEventListener('mousedown', ev => {
    if (!gameActive) return;
    if (!pointerLocked && ev.button === 0) {
      mouseDownLook = true;
    }
    if (ev.button === 0) breakTarget();
    if (ev.button === 2) placeTarget();
  });
  window.addEventListener('mouseup', () => { mouseDownLook = false; });
  canvas.addEventListener('mousemove', ev => {
    if (!gameActive) return;
    if (pointerLocked || mouseDownLook) {
      rotateCamera(ev.movementX || 0, ev.movementY || 0);
    }
  });
  canvas.addEventListener('click', () => {
    if (gameActive && !pointerLocked && !settings.mobileControls) {
      canvas.requestPointerLock?.();
    }
  });
  canvas.addEventListener('contextmenu', ev => ev.preventDefault());

  if (moveStick) bindMobileStick();
  if (lookPad) bindLookPad();
}

function bindMobileStick() {
  const applyKnob = () => {
    const x = moveInput.x * 28;
    const y = moveInput.y * 28;
    moveKnob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  };

  const endMove = id => {
    if (moveTouchId === id) {
      moveTouchId = null;
      moveTouchVector = { x: 0, y: 0 };
      moveInput = { x: 0, y: 0 };
      applyKnob();
    }
  };

  moveStick.addEventListener('pointerdown', ev => {
    moveTouchId = ev.pointerId;
    moveTouchStart = { x: ev.clientX, y: ev.clientY };
    moveStick.setPointerCapture?.(ev.pointerId);
  });
  moveStick.addEventListener('pointermove', ev => {
    if (moveTouchId !== ev.pointerId) return;
    const dx = ev.clientX - moveTouchStart.x;
    const dy = ev.clientY - moveTouchStart.y;
    const len = Math.hypot(dx, dy) || 1;
    const max = 42;
    const scale = Math.min(1, len / max);
    moveTouchVector = { x: (dx / len) * scale, y: (dy / len) * scale };
    moveInput = { x: moveTouchVector.x, y: moveTouchVector.y };
    applyKnob();
  });
  moveStick.addEventListener('pointerup', ev => endMove(ev.pointerId));
  moveStick.addEventListener('pointercancel', ev => endMove(ev.pointerId));
  moveStick.addEventListener('lostpointercapture', () => {
    moveTouchId = null;
    moveTouchVector = { x: 0, y: 0 };
    moveInput = { x: 0, y: 0 };
    applyKnob();
  });
}

function bindLookPad() {
  lookPad.addEventListener('pointerdown', ev => {
    lookTouchId = ev.pointerId;
    lookTouchStart = { x: ev.clientX, y: ev.clientY };
    lookTouchVector = { x: 0, y: 0 };
    lookPad.setPointerCapture?.(ev.pointerId);
  });
  lookPad.addEventListener('pointermove', ev => {
    if (lookTouchId !== ev.pointerId) return;
    const dx = ev.clientX - lookTouchStart.x;
    const dy = ev.clientY - lookTouchStart.y;
    rotateCamera(dx * 0.05 * settings.sensitivity, dy * 0.05 * settings.sensitivity);
    lookTouchStart = { x: ev.clientX, y: ev.clientY };
  });
  lookPad.addEventListener('pointerup', ev => {
    if (lookTouchId === ev.pointerId) lookTouchId = null;
  });
  lookPad.addEventListener('pointercancel', ev => {
    if (lookTouchId === ev.pointerId) lookTouchId = null;
  });
}

function makeRandomSeed() {
  return Math.random().toString(36).slice(2, 8);
}

function updateHud() {
  statBlocks.textContent = String(blocksMined);
  statDay.textContent = String(dayCount);
  statMode.textContent = settings.mode;
  statBots.textContent = String(settings.bots ? bots.length : 0);
  pauseBlocks.textContent = String(blocksMined);
  pauseDay.textContent = String(dayCount);
  pauseBots.textContent = String(settings.bots ? bots.length : 0);
}

function showMessage(text, duration = 1800) {
  craftMessage.textContent = text;
  clearTimeout(targetMessageTimer);
  targetMessageTimer = setTimeout(() => {
    if (craftMessage.textContent === text) craftMessage.textContent = '';
  }, duration);
}

function showStartScreen() {
  paused = true;
  inventoryOpen = false;
  startScreen.classList.remove('hidden');
  pauseScreen.classList.add('hidden');
  craftPanel.classList.add('hidden');
  mobileControls.classList.add('hidden');
  if (document.pointerLockElement === canvas) document.exitPointerLock?.();
}

function pauseGame() {
  if (!gameActive) return;
  paused = true;
  inventoryOpen = false;
  pauseScreen.classList.remove('hidden');
  startScreen.classList.add('hidden');
  craftPanel.classList.add('hidden');
  mobileControls.classList.add('hidden');
  if (document.pointerLockElement === canvas) document.exitPointerLock?.();
  updateHud();
}

function resumeGame() {
  if (!gameActive) return;
  paused = false;
  pauseScreen.classList.add('hidden');
  startScreen.classList.add('hidden');
  mobileControls.classList.toggle('hidden', !settings.mobileControls);
  if (!settings.mobileControls) {
    canvas.requestPointerLock?.();
  }
}

function startGame() {
  regenerateWorld(true);
  startScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  craftPanel.classList.add('hidden');
  mobileControls.classList.toggle('hidden', !settings.mobileControls);
  paused = false;
  gameActive = true;
  if (!settings.mobileControls) {
    canvas.requestPointerLock?.();
  }
  if (settings.mobileControls) {
    mobileControls.classList.remove('hidden');
  }
  showMessage(`${capitalize(settings.mode)} world loaded`);
}

function regenerateWorld(resetPlayer = true) {
  settings = normalizeSettings(settings);
  saveSettings();
  worldSeed = hashString(`${settings.seed}:${settings.preset}:${settings.worldSize}`);
  world = new Map();
  cloudLayer = [];
  bots = [];
  particles = [];
  blocksMined = 0;
  blocksPlaced = 0;
  dayCount = 1;
  dayPhase = 0;
  timeClock = 0;
  selectedSlot = 0;
  currentTarget = null;
  currentPlace = null;
  inventory = {};

  const size = settings.worldSize;
  const seaLevel = settings.preset === 'desert' ? 4 : settings.preset === 'islands' ? 7 : 6;
  const baseHeight = settings.preset === 'islands' ? 2 : settings.preset === 'desert' ? 3 : 5;
  const amplitude = settings.preset === 'forest' ? 6 : settings.preset === 'islands' ? 5 : 4;
  const palette = PRESET_COLORS[settings.preset] || PRESET_COLORS.plains;
  const center = size / 2;

  for (let x = 0; x < size; x++) {
    for (let z = 0; z < size; z++) {
      const distanceFalloff = settings.preset === 'islands' ? Math.max(0, 1 - Math.hypot(x - center, z - center) / (size * 0.58)) : 1;
      const noise = noise2d(x, z);
      const terrain = baseHeight + Math.floor(noise * amplitude * distanceFalloff);
      const surface = clamp(terrain, 1, 15);

      for (let y = 0; y <= surface; y++) {
        let type = 'stone';
        if (y === surface) {
          type = settings.preset === 'desert' || settings.preset === 'islands' ? 'sand' : 'grass';
        } else if (y >= surface - 2) {
          type = settings.preset === 'desert' || settings.preset === 'islands' ? 'sand' : 'dirt';
        }

        if (y < surface - 2 && y < 12) {
          const oreRoll = rand3(x, y, z, 9);
          if (oreRoll > 0.995) type = 'diamond_ore';
          else if (oreRoll > 0.985) type = 'gold_ore';
          else if (oreRoll > 0.965) type = 'iron_ore';
          else if (oreRoll > 0.935) type = 'coal_ore';
        }

        setBlock(x, y, z, type);
      }

      if (surface < seaLevel) {
        for (let y = surface + 1; y <= seaLevel; y++) {
          setBlock(x, y, z, 'water');
        }
      }

      if (settings.preset !== 'desert' && surface >= seaLevel - 1 && rand2(x, z, 3) > (settings.preset === 'forest' ? 0.91 : 0.96)) {
        placeTree(x, surface + 1, z, settings.preset === 'forest' ? 5 : 4);
      }

      if (settings.preset === 'desert' && surface >= seaLevel - 1 && rand2(x, z, 17) > 0.97) {
        placeCactus(x, surface + 1, z, 3 + Math.floor(rand2(x, z, 20) * 2));
      }

      if (settings.luckyBlocks && rand2(x, z, 41) > 0.995) {
        setBlock(x, surface + 1, z, 'lucky');
      }

      if (settings.crazyTnt && rand2(x, z, 57) > 0.997) {
        setBlock(x, Math.max(1, surface), z, 'tnt');
      }
    }
  }

  for (let i = 0; i < 12; i++) {
    cloudLayer.push({
      x: rand2(i, i, 73) * size * 0.9,
      z: rand2(i, i, 91) * size * 0.9,
      y: seaLevel + 12 + rand2(i, i, 99) * 4,
      s: 5 + rand2(i, i, 101) * 7,
    });
  }

  inventory = {
    grass: settings.mode === 'creative' ? 64 : 12,
    dirt: settings.mode === 'creative' ? 64 : 16,
    stone: settings.mode === 'creative' ? 64 : 12,
    wood: settings.mode === 'creative' ? 64 : 10,
    planks: settings.mode === 'creative' ? 64 : 12,
    sand: settings.mode === 'creative' ? 64 : 12,
    water: settings.mode === 'creative' ? 64 : 4,
    tnt: settings.mode === 'creative' ? 32 : settings.crazyTnt ? 2 : 0,
    lucky: settings.mode === 'creative' ? 16 : settings.luckyBlocks ? 1 : 0,
    workbench: settings.mode === 'creative' ? 8 : 1,
    stonebrick: settings.mode === 'creative' ? 32 : 0,
    coal: 0,
    iron: 0,
    gold: 0,
    diamond: 0,
    leaves: 0,
    cactus: 0,
  };

  if (resetPlayer) {
    player.x = center + 0.5;
    player.z = center + 0.5;
    player.y = getSurfaceHeight(player.x, player.z) + 3;
    player.vx = 0;
    player.vy = 0;
    player.vz = 0;
    player.yaw = Math.PI * 0.35;
    player.pitch = -0.12;
    player.fly = settings.mode === 'creative';
    player.health = 20;
  }

  spawnBots();
  renderHotbar();
  updateCraftPanel();
  updateHud();
}

function noise2d(x, z) {
  const s = worldSeed || 1;
  const a = Math.sin((x + s) * 0.19) + Math.cos((z - s) * 0.23);
  const b = Math.sin((x + z + s) * 0.07) * 0.7;
  const c = Math.cos((x - z + s) * 0.11) * 0.35;
  return (a + b + c + 2.35) / 4.7;
}

function placeTree(x, y, z, trunkHeight) {
  // Trunk.
  for (let i = 0; i < trunkHeight; i++) {
    setBlock(x, y + i, z, 'wood');
  }
  // Oak canopy: 5x5 lower (3 high), 3x3 cap, with corner gaps for that vanilla shape.
  const top = y + trunkHeight - 1;
  for (let oy = 0; oy < 2; oy++) {
    for (let ox = -2; ox <= 2; ox++) {
      for (let oz = -2; oz <= 2; oz++) {
        if (Math.abs(ox) === 2 && Math.abs(oz) === 2 && rand2(x + ox, z + oz, oy + 17) > 0.5) continue;
        if (ox === 0 && oz === 0) continue; // trunk slot
        const ty = top + oy;
        if (getBlock(x + ox, ty, z + oz) === 'air') setBlock(x + ox, ty, z + oz, 'leaves');
      }
    }
  }
  for (let oy = 2; oy <= 3; oy++) {
    const r = oy === 2 ? 1 : 1;
    for (let ox = -r; ox <= r; ox++) {
      for (let oz = -r; oz <= r; oz++) {
        if (Math.abs(ox) === r && Math.abs(oz) === r && rand2(x + ox, z + oz, oy + 41) > 0.4) continue;
        const ty = top + oy;
        if (ox === 0 && oz === 0 && oy === 2) {
          setBlock(x, ty, z, 'leaves');
          continue;
        }
        if (getBlock(x + ox, ty, z + oz) === 'air') setBlock(x + ox, ty, z + oz, 'leaves');
      }
    }
  }
}

function placeCactus(x, y, z, height) {
  for (let i = 0; i < height; i++) {
    setBlock(x, y + i, z, 'cactus');
  }
}

function setBlock(x, y, z, type) {
  if (!inBounds(x, y, z)) return;
  const key = blockKey(x, y, z);
  if (type === 'air') {
    world.delete(key);
  } else {
    world.set(key, type);
  }
}

function getBlock(x, y, z) {
  if (!inBounds(x, y, z)) return 'air';
  return world.get(blockKey(x, y, z)) || 'air';
}

function blockKey(x, y, z) {
  return `${x}|${y}|${z}`;
}

function inBounds(x, y, z) {
  return x >= 0 && z >= 0 && y >= 0 && x < settings.worldSize && z < settings.worldSize && y < 24;
}

function getSurfaceHeight(x, z) {
  let highest = 0;
  const ix = clamp(Math.floor(x), 0, settings.worldSize - 1);
  const iz = clamp(Math.floor(z), 0, settings.worldSize - 1);
  for (let y = 23; y >= 0; y--) {
    const type = getBlock(ix, y, iz);
    if (type !== 'air' && type !== 'water' && type !== 'leaves') {
      highest = y + 1;
      break;
    }
  }
  return highest;
}

function spawnBots() {
  bots = [];
  if (!settings.bots || settings.botCount <= 0) return;
  for (let i = 0; i < settings.botCount; i++) {
    const x = clamp(Math.floor(player.x + rand2(i, 11, 5) * 18 - 9), 2, settings.worldSize - 3) + 0.5;
    const z = clamp(Math.floor(player.z + rand2(i, 17, 7) * 18 - 9), 2, settings.worldSize - 3) + 0.5;
    const bot = {
      name: BOT_NAMES[i % BOT_NAMES.length],
      color: ['#ff7a1a', '#38bdf8', '#a855f7', '#4ade80', '#f472b6', '#e5e7eb'][i % 6],
      x,
      y: getSurfaceHeight(x, z) + 1,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: rand2(i, 23, 11) * Math.PI * 2,
      moveTimer: 0,
      actionTimer: 1 + rand2(i, 29, 13) * 2,
      mode: 'roam',
      onGround: false,
      message: '',
      messageTimer: 0,
    };
    bots.push(bot);
  }
}

function renderHotbar() {
  hotbarEl.innerHTML = '';
  hotbarButtons = [];
  PLACEABLE_BLOCKS.forEach((type, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'craft-slot';
    btn.dataset.block = type;
    btn.innerHTML = `
      <span class="num">${index + 1}</span>
      <div class="swatch"></div>
      <span class="count">0</span>
      <span class="name">${BLOCKS[type].name}</span>
    `;
    btn.addEventListener('click', () => selectSlot(index));
    hotbarEl.appendChild(btn);
    hotbarButtons.push(btn);
  });
  updateHotbarUi();
}

function updateHotbarUi() {
  hotbarButtons.forEach((btn, index) => {
    const type = PLACEABLE_BLOCKS[index];
    const countEl = btn.querySelector('.count');
    const swatch = btn.querySelector('.swatch');
    const active = index === selectedSlot;
    btn.classList.toggle('active', active);
    const def = BLOCKS[type];
    const faceColor = def.faces?.top || def.color || '#fff';
    swatch.style.background = faceColor;
    countEl.textContent = settings.mode === 'creative' ? '∞' : String(inventory[type] || 0);
  });
}

function selectSlot(index) {
  selectedSlot = clamp(index, 0, PLACEABLE_BLOCKS.length - 1);
  updateHotbarUi();
  showMessage(BLOCKS[PLACEABLE_BLOCKS[selectedSlot]].name);
}

function updateCraftPanel() {
  const invList = document.getElementById('craft-inventory-list');
  const recipesEl = document.getElementById('craft-recipes');
  if (!invList || !recipesEl) return;

  invList.innerHTML = '';
  const items = Object.keys(inventory).sort();
  for (const item of items) {
    const row = document.createElement('div');
    row.className = 'craft-item';
    row.textContent = `${item} x${inventory[item]}`;
    invList.appendChild(row);
  }

  recipesEl.innerHTML = '';
  for (const recipe of RECIPES) {
    const div = document.createElement('div');
    div.className = 'craft-recipe';
    const canCraft = recipe.inputs.every(input => (inventory[input.type] || 0) >= input.count || settings.mode === 'creative');
    div.innerHTML = `
      <div>${recipe.name}</div>
      <div>${recipe.inputs.map(input => `${input.type} x${input.count}`).join(' + ')} -> ${recipe.output.type} x${recipe.output.count}</div>
    `;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = canCraft ? 'craft' : 'missing items';
    btn.disabled = !canCraft;
    btn.addEventListener('click', () => craftRecipe(recipe.id));
    div.appendChild(btn);
    recipesEl.appendChild(div);
  }
}

function craftRecipe(id) {
  const recipe = RECIPES.find(item => item.id === id);
  if (!recipe) return;
  const canCraft = recipe.inputs.every(input => (inventory[input.type] || 0) >= input.count || settings.mode === 'creative');
  if (!canCraft) {
    showMessage('missing crafting items');
    return;
  }
  if (settings.mode !== 'creative') {
    for (const input of recipe.inputs) {
      inventory[input.type] = Math.max(0, (inventory[input.type] || 0) - input.count);
    }
  }
  inventory[recipe.output.type] = (inventory[recipe.output.type] || 0) + recipe.output.count;
  updateCraftPanel();
  updateHotbarUi();
  showMessage(`crafted ${recipe.output.type}`);
}

function toggleCraftPanel(force) {
  const open = typeof force === 'boolean' ? force : craftPanel.classList.contains('hidden');
  craftPanel.classList.toggle('hidden', !open);
  inventoryOpen = open;
  if (open) updateCraftPanel();
}

function handleKeyDown(ev) {
  keys.add(ev.key.toLowerCase());
  if (ev.key === 'Escape') {
    ev.preventDefault();
    if (inventoryOpen) {
      toggleCraftPanel(false);
      return;
    }
    if (!gameActive) {
      showStartScreen();
      return;
    }
    if (paused) {
      resumeGame();
    } else {
      pauseGame();
    }
  }
  if (!gameActive || paused) return;
  if (ev.key === 'e' || ev.key === 'E') {
    ev.preventDefault();
    toggleCraftPanel();
  }
  if (ev.key >= '1' && ev.key <= '9') {
    selectSlot(+ev.key - 1);
  }
  if (ev.key === ' ') {
    if (settings.mode === 'creative' || player.onGround || settings.autoJump) {
      // Vanilla jump initial velocity ≈ sqrt(2 * g * h) where h ≈ 1.252 blocks.
      const jumpV = settings.mode === 'creative' ? 5.6 : 8.4;
      player.vy = jumpV * settings.jumpStrength;
      player.onGround = false;
    }
  }
  if (ev.key === 'f' && settings.mode === 'creative') {
    player.fly = !player.fly;
    showMessage(player.fly ? 'flight enabled' : 'flight disabled');
  }
}

function handleKeyUp(ev) {
  keys.delete(ev.key.toLowerCase());
}

function rotateCamera(dx, dy) {
  player.yaw += dx * 0.0028 * settings.sensitivity;
  const invert = settings.invertY ? -1 : 1;
  player.pitch = clamp(player.pitch - dy * 0.0026 * settings.sensitivity * invert, -1.45, 1.45);
}

function update(dt) {
  if (!gameActive || paused) return;
  timeClock += dt;
  const dayLengthSeconds = settings.dayLength * 90;
  dayPhase = (timeClock / dayLengthSeconds) % 1;
  if (timeClock >= dayLengthSeconds) {
    timeClock = 0;
    dayCount++;
    showMessage(dayPhase < 0.5 ? 'sunrise' : 'nightfall');
  }

  updatePlayer(dt);
  updateBots(dt);
  updateParticles(dt);
  updateTarget();
  updateHud();
}

function updatePlayer(dt) {
  if (settings.mode === 'creative' && keys.has('shift')) {
    player.vy = -5.5;
  }

  const forwardX = Math.sin(player.yaw);
  const forwardZ = Math.cos(player.yaw);
  const rightX = Math.cos(player.yaw);
  const rightZ = -Math.sin(player.yaw);

  let wishX = moveInput.x;
  let wishZ = -moveInput.y;
  if (keys.has('w')) { wishX += forwardX; wishZ += forwardZ; }
  if (keys.has('s')) { wishX -= forwardX; wishZ -= forwardZ; }
  if (keys.has('d')) { wishX += rightX; wishZ += rightZ; }
  if (keys.has('a')) { wishX -= rightX; wishZ -= rightZ; }

  const len = Math.hypot(wishX, wishZ) || 1;
  wishX /= len;
  wishZ /= len;

  // Vanilla MC walking ≈ 4.317 m/s, sprinting ≈ 5.612 m/s.
  const baseWalk = 4.317;
  const baseSprint = 5.612;
  const baseFly = 10.92;
  const sprinting = settings.sprintToggle && keys.has('shift');
  const groundSpeed = (settings.mode === 'creative' ? baseFly : sprinting ? baseSprint : baseWalk) *
    settings.walkSpeed *
    (settings.difficulty === 'hard' ? 1.12 : settings.difficulty === 'easy' ? 0.9 : 1);
  const accel = settings.mode === 'creative' ? 16 : 12;
  player.vx = lerp(player.vx, wishX * groundSpeed, clamp(accel * dt, 0, 1));
  player.vz = lerp(player.vz, wishZ * groundSpeed, clamp(accel * dt, 0, 1));

  // Walking distance for view bob.
  const moving = Math.hypot(player.vx, player.vz) > 0.5 && (player.onGround || settings.mode === 'creative');
  if (moving && settings.bobbing) {
    player.bobPhase = (player.bobPhase || 0) + dt * (sprinting ? 14 : 10);
  } else {
    player.bobPhase = lerp(player.bobPhase || 0, 0, clamp(8 * dt, 0, 1));
  }

  if (settings.mode === 'creative' && (keys.has(' ') || mobileJumpBtn.matches(':active'))) {
    player.vy = 6 * settings.jumpStrength;
  } else if (!player.fly) {
    // Default gravity ~18 — multiplier scales it.
    player.vy -= 18 * settings.gravity * dt;
  }

  const speedCap = settings.mode === 'creative' ? 0.6 : 0.35;
  if (Math.abs(player.vx) < speedCap) player.vx *= 0.8;
  if (Math.abs(player.vz) < speedCap) player.vz *= 0.8;

  movePlayerAxis('x', player.vx * dt);
  movePlayerAxis('y', player.vy * dt);
  movePlayerAxis('z', player.vz * dt);

  if (player.y < 1.5) {
    player.y = 1.5;
    player.vy = 0;
    player.onGround = true;
  }
  if (player.y > 22) {
    player.y = 22;
    player.vy = 0;
  }
}

function movePlayerAxis(axis, amount) {
  if (amount === 0) return;
  const next = { x: player.x, y: player.y, z: player.z };
  next[axis] += amount;
  if (!collides(next.x, next.y, next.z)) {
    player[axis] = next[axis];
    if (axis === 'y') player.onGround = false;
    return;
  }
  if (axis === 'y') {
    player.vy = 0;
    if (amount < 0) player.onGround = true;
    return;
  }
  player[axis] -= amount * 0.25;
}

function collides(x, y, z) {
  const half = 0.32;
  const minX = Math.floor(x - half);
  const maxX = Math.floor(x + half);
  const minY = Math.floor(y);
  const maxY = Math.floor(y + 1.8);
  const minZ = Math.floor(z - half);
  const maxZ = Math.floor(z + half);
  for (let bx = minX; bx <= maxX; bx++) {
    for (let by = minY; by <= maxY; by++) {
      for (let bz = minZ; bz <= maxZ; bz++) {
        const type = getBlock(bx, by, bz);
        if (type !== 'air' && BLOCKS[type] && BLOCKS[type].solid && !BLOCKS[type].transparent) {
          return true;
        }
      }
    }
  }
  return false;
}

function updateBots(dt) {
  if (!settings.bots) return;
  const renderCull = settings.entityCulling ? settings.renderDistance + 8 : 9999;
  for (const bot of bots) {
    const dist = Math.hypot(bot.x - player.x, bot.z - player.z);
    if (dist > renderCull) {
      bot.messageTimer = Math.max(0, bot.messageTimer - dt);
      continue;
    }
    bot.actionTimer -= dt;
    if (bot.actionTimer <= 0) {
      bot.actionTimer = 1.2 + rand2(Math.floor(bot.x), Math.floor(bot.z), Math.floor(timeClock * 10)) * 3;
      const roll = rand2(Math.floor(bot.x + bot.z), Math.floor(timeClock * 10), bot.name.length);
      if (roll < 0.34) bot.mode = 'roam';
      else if (roll < 0.62) bot.mode = 'mine';
      else bot.mode = 'build';
      bot.yaw += (rand2(bot.x, bot.z, 99) - 0.5) * 2;
      bot.message = bot.mode === 'roam' ? 'wandering' : bot.mode === 'mine' ? 'mining' : 'building';
      bot.messageTimer = 1.8;
    }
    if (bot.messageTimer > 0) bot.messageTimer -= dt;
    bot.moveTimer = (bot.moveTimer || 0) + dt * (Math.hypot(bot.vx, bot.vz) > 0.3 ? 1.2 : 0.2);

    const targetSpeed = settings.difficulty === 'hard' ? 2.2 : 1.8;
    let wishX = Math.sin(bot.yaw);
    let wishZ = Math.cos(bot.yaw);
    if (bot.mode === 'build') {
      wishX += Math.sin(bot.yaw + Math.PI * 0.5) * 0.25;
      wishZ += Math.cos(bot.yaw + Math.PI * 0.5) * 0.25;
    }
    const len = Math.hypot(wishX, wishZ) || 1;
    wishX /= len;
    wishZ /= len;
    bot.vx = lerp(bot.vx, wishX * targetSpeed, 0.08);
    bot.vz = lerp(bot.vz, wishZ * targetSpeed, 0.08);
    bot.vy -= 18 * dt;

    const before = { x: bot.x, y: bot.y, z: bot.z };
    moveEntityAxis(bot, 'x', bot.vx * dt);
    moveEntityAxis(bot, 'y', bot.vy * dt);
    moveEntityAxis(bot, 'z', bot.vz * dt);

    if (bot.onGround && rand2(Math.floor(bot.x), Math.floor(bot.z), 7) > 0.985) {
      bot.vy = 5.2;
      bot.onGround = false;
    }

    if (bot.mode === 'mine' && rand2(Math.floor(bot.x), Math.floor(bot.y), Math.floor(timeClock * 20)) > 0.985) {
      const target = raycastFrom(bot.x, bot.y + 1.2, bot.z, bot.yaw, 0, 4.5);
      if (target) breakBlockAt(target.hit.x, target.hit.y, target.hit.z, true);
    }

    if (bot.mode === 'build' && rand2(before.x, before.z, Math.floor(timeClock * 10)) > 0.988) {
      const target = raycastFrom(bot.x, bot.y + 1.2, bot.z, bot.yaw, 0, 4.5);
      if (target && getBlock(target.place.x, target.place.y, target.place.z) === 'air') {
        setBlock(target.place.x, target.place.y, target.place.z, 'stonebrick');
      }
    }
  }
}

function moveEntityAxis(ent, axis, amount) {
  if (amount === 0) return;
  const next = { x: ent.x, y: ent.y, z: ent.z };
  next[axis] += amount;
  if (!collides(next.x, next.y, next.z)) {
    ent[axis] = next[axis];
    if (axis === 'y') ent.onGround = false;
    return;
  }
  if (axis === 'y') {
    ent.vy = 0;
    if (amount < 0) ent.onGround = true;
    return;
  }
  ent[axis] -= amount * 0.25;
  ent.yaw += (rand2(ent.x, ent.z, 1) - 0.5) * 0.4;
}

function updateParticles(dt) {
  particles = particles.filter(p => {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.z += p.vz * dt;
    p.vy -= 6 * dt;
    return p.life > 0;
  });
}

function updateTarget() {
  const origin = { x: player.x, y: player.y + 1.62, z: player.z };
  const dir = getLookDirection();
  const hit = raycastFrom(origin.x, origin.y, origin.z, player.yaw, player.pitch, 5.5);
  currentTarget = hit ? hit.hit : null;
  currentPlace = hit ? hit.place : null;
}

function getLookDirection() {
  const cy = Math.cos(player.yaw);
  const sy = Math.sin(player.yaw);
  const cp = Math.cos(player.pitch);
  const sp = Math.sin(player.pitch);
  return { x: sy * cp, y: sp, z: cy * cp };
}

function raycastFrom(x, y, z, yaw, pitch, maxDist = 6) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const dir = { x: sy * cp, y: sp, z: cy * cp };
  let prev = { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) };
  for (let t = 0; t <= maxDist; t += 0.08) {
    const px = x + dir.x * t;
    const py = y + dir.y * t;
    const pz = z + dir.z * t;
    const bx = Math.floor(px);
    const by = Math.floor(py);
    const bz = Math.floor(pz);
    const type = getBlock(bx, by, bz);
    if (type !== 'air' && (!BLOCKS[type] || BLOCKS[type].solid || type === 'water' || type === 'leaves')) {
      return {
        hit: { x: bx, y: by, z: bz, type },
        place: { x: prev.x, y: prev.y, z: prev.z },
        distance: t,
      };
    }
    prev = { x: bx, y: by, z: bz };
  }
  return null;
}

function breakTarget() {
  if (!gameActive || paused || !currentTarget) return;
  breakBlockAt(currentTarget.x, currentTarget.y, currentTarget.z, false);
}

function placeTarget() {
  if (!gameActive || paused || !currentPlace) return;
  const type = PLACEABLE_BLOCKS[selectedSlot];
  if (!type) return;
  if (settings.mode !== 'creative' && (inventory[type] || 0) <= 0) {
    showMessage('not enough blocks');
    return;
  }
  if (getBlock(currentPlace.x, currentPlace.y, currentPlace.z) !== 'air') return;
  setBlock(currentPlace.x, currentPlace.y, currentPlace.z, type);
  if (settings.mode !== 'creative') {
    inventory[type] = Math.max(0, (inventory[type] || 0) - 1);
  }
  blocksPlaced++;
  spawnBurst(currentPlace.x + 0.5, currentPlace.y + 0.5, currentPlace.z + 0.5, BLOCKS[type].faces?.top || BLOCKS[type].color || '#ffffff', 12);
  updateHotbarUi();
  updateCraftPanel();
  showMessage(`placed ${BLOCKS[type].name.toLowerCase()}`);
}

function breakBlockAt(x, y, z, byBot) {
  const type = getBlock(x, y, z);
  if (type === 'air') return false;
  if (type === 'water' || type === 'leaves') {
    setBlock(x, y, z, 'air');
    return true;
  }
  if (type === 'tnt') {
    setBlock(x, y, z, 'air');
    igniteTnt(x, y, z, byBot);
    return true;
  }
  if (type === 'lucky' && settings.luckyBlocks) {
    setBlock(x, y, z, 'air');
    triggerLuckyBlock(x, y, z);
    blocksMined++;
    updateHud();
    return true;
  }

  setBlock(x, y, z, 'air');
  const drop = BLOCKS[type]?.drop || type;
  if (settings.mode !== 'creative') {
    inventory[drop] = (inventory[drop] || 0) + 1;
  }
  blocksMined++;
  blocksPlaced = Math.max(0, blocksPlaced - 0);
  spawnBurst(x + 0.5, y + 0.5, z + 0.5, BLOCKS[type]?.faces?.top || BLOCKS[type]?.color || '#fff', 10);
  spawnParticles(x + 0.5, y + 0.5, z + 0.5, BLOCKS[type]?.faces?.top || BLOCKS[type]?.color || '#fff', 10);
  updateHotbarUi();
  updateCraftPanel();
  updateHud();
  if (!byBot) showMessage(`${BLOCKS[type]?.name || type} broken`);
  return true;
}

function igniteTnt(x, y, z, silent = false) {
  showMessage(silent ? '' : 'tnt ignited');
  const power = settings.crazyTnt ? 5.2 : 3.2;
  setTimeout(() => explodeAt(x + 0.5, y + 0.5, z + 0.5, power), 500);
}

function explodeAt(x, y, z, power) {
  const radius = Math.ceil(power);
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const dist = Math.hypot(dx, dy, dz);
        if (dist > power) continue;
        const bx = Math.floor(x + dx);
        const by = Math.floor(y + dy);
        const bz = Math.floor(z + dz);
        const type = getBlock(bx, by, bz);
        if (type !== 'air' && type !== 'water') {
          setBlock(bx, by, bz, 'air');
          if (type === 'tnt' && settings.crazyTnt) {
            setTimeout(() => explodeAt(bx + 0.5, by + 0.5, bz + 0.5, power * 0.85), 120);
          }
          if (!BLOCKS[type]?.transparent) {
            spawnParticles(bx + 0.5, by + 0.5, bz + 0.5, BLOCKS[type]?.faces?.top || BLOCKS[type]?.color || '#fff', 12);
          }
        }
      }
    }
  }
  for (const bot of bots) {
    const dist = Math.hypot(bot.x - x, bot.y - y, bot.z - z);
    if (dist < power + 2) {
      bot.vx += (bot.x - x) * 2;
      bot.vz += (bot.z - z) * 2;
    }
  }
  if (Math.hypot(player.x - x, player.y - y, player.z - z) < power + 2) {
    player.vx += (player.x - x) * 2;
    player.vz += (player.z - z) * 2;
  }
  spawnParticles(x, y, z, '#ffcf5a', 32);
  showMessage('boom');
}

function triggerLuckyBlock(x, y, z) {
  const roll = Math.floor(rand3(x, y, z, 21) * 6);
  if (roll === 0) {
    inventory.diamond = (inventory.diamond || 0) + 4;
    inventory.gold = (inventory.gold || 0) + 6;
    showMessage('lucky loot');
    spawnParticles(x + 0.5, y + 0.5, z + 0.5, '#ffd94c', 24);
  } else if (roll === 1) {
    explodeAt(x + 0.5, y + 0.5, z + 0.5, settings.crazyTnt ? 4.5 : 3);
  } else if (roll === 2) {
    settings.bots = true;
    settings.botCount = Math.min(8, settings.botCount + 1);
    saveSettings();
    applySettingsToUi();
    spawnBots();
    showMessage('a new bot joins');
  } else if (roll === 3) {
    for (let i = 0; i < 10; i++) {
      setBlock(clamp(Math.floor(x + rand3(i, y, z, 4) * 5 - 2), 0, settings.worldSize - 1), clamp(Math.floor(y + rand3(i, y, z, 5) * 4), 0, 23), clamp(Math.floor(z + rand3(i, y, z, 6) * 5 - 2), 0, settings.worldSize - 1), 'stonebrick');
    }
    showMessage('structure spawned');
  } else if (roll === 4) {
    player.health = 20;
    showMessage('full energy');
  } else {
    for (const bot of bots) {
      bot.mode = 'build';
      bot.message = 'inspired';
      bot.messageTimer = 2.5;
    }
    showMessage('bots go wild');
  }
}

function spawnParticles(x, y, z, color, count) {
  const factor = { none: 0, low: 0.4, medium: 1, high: 1.8 }[settings.particleLevel] ?? 1;
  if (factor === 0) return;
  const adjusted = Math.max(1, Math.round(count * factor));
  for (let i = 0; i < adjusted; i++) {
    particles.push({
      x, y, z,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 6,
      vz: (Math.random() - 0.5) * 6,
      life: 0.6 + Math.random() * 0.5,
      color,
    });
  }
}

function spawnBurst(x, y, z, color, count) {
  spawnParticles(x, y, z, color, count);
}

function render() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const day = 0.5 + 0.5 * Math.sin(dayPhase * Math.PI * 2);
  const skyTop = mixColor('#0b1020', '#7dd3ff', day);
  const skyMid = mixColor('#1b3d68', '#bcecff', day);
  const ground = mixColor('#122013', '#5aa74a', day);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, skyTop);
  grad.addColorStop(0.35, skyMid);
  grad.addColorStop(0.58, ground);
  grad.addColorStop(1, '#1e2f18');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  drawSkyOrbs(day);

  const camera = buildCamera();
  const faces = [];
  const range = settings.renderDistance;
  const minX = clamp(Math.floor(player.x) - range, 0, settings.worldSize - 1);
  const maxX = clamp(Math.floor(player.x) + range, 0, settings.worldSize - 1);
  const minZ = clamp(Math.floor(player.z) - range, 0, settings.worldSize - 1);
  const maxZ = clamp(Math.floor(player.z) + range, 0, settings.worldSize - 1);
  const minY = 0;
  const maxY = 23;

  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      for (let y = minY; y <= maxY; y++) {
        const type = getBlock(x, y, z);
        if (type === 'air') continue;
        const def = BLOCKS[type];
        if (!def) continue;
        const dist = Math.hypot(x + 0.5 - player.x, z + 0.5 - player.z, y + 0.5 - (player.y + 1.62));
        if (dist > range * 3.5) continue;
        for (const face of FACE_DEFS) {
          const nx = x + face.offset[0];
          const ny = y + face.offset[1];
          const nz = z + face.offset[2];
          const neighbor = getBlock(nx, ny, nz);
          if (isFaceHidden(type, neighbor)) continue;
          const points = face.verts.map(v => projectPoint(x + v[0], y + v[1], z + v[2], camera));
          if (points.some(p => !p)) continue;
          const depth = points.reduce((sum, p) => sum + p.depth, 0) / points.length;
          const base = getFaceColor(type, face.name);
          const lightFactor = face.shade * (day * 0.55 + 0.5);
          const lit = applyLighting(base, lightFactor, type);
          faces.push({
            points,
            depth,
            color: lit,
            stroke: settings.lowPoly ? 'transparent' : 'rgba(0,0,0,0.22)',
            type,
            faceName: face.name,
            blockX: x,
            blockY: y,
            blockZ: z,
            lightFactor,
          });
        }
      }
    }
  }

  if (!settings.cloudRemover) {
    for (const cloud of cloudLayer) {
      const cx = cloud.x;
      const cz = cloud.z;
      const cy = cloud.y;
      const half = cloud.s * 0.5;
      const p1 = projectPoint(cx - half, cy, cz - half, camera);
      const p2 = projectPoint(cx + half, cy, cz + half, camera);
      if (!p1 || !p2) continue;
      const left = Math.min(p1.x, p2.x);
      const right = Math.max(p1.x, p2.x);
      const top = Math.min(p1.y, p2.y);
      const bottom = Math.max(p1.y, p2.y);
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillRect(left, top, right - left, Math.max(2, (bottom - top) * 0.45));
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  faces.sort((a, b) => b.depth - a.depth);
  for (const face of faces) drawFace(face);

  drawEntities(camera);
  drawParticles(camera);
  drawSelection(camera);
  drawHand(camera);
  drawWeather();

  if (!settings.fogRemover) {
    ctx.fillStyle = `rgba(10, 12, 20, ${0.08 + (1 - day) * 0.13})`;
    ctx.fillRect(0, 0, w, h);
  }

  if (settings.showFps) drawFps();
}

let _fpsLast = 0;
let _fpsAcc = 0;
let _fpsFrames = 0;
let _fpsValue = 0;
function drawFps() {
  const now = performance.now();
  if (_fpsLast) {
    _fpsAcc += now - _fpsLast;
    _fpsFrames++;
    if (_fpsAcc > 500) {
      _fpsValue = Math.round((_fpsFrames * 1000) / _fpsAcc);
      _fpsAcc = 0;
      _fpsFrames = 0;
    }
  }
  _fpsLast = now;
  ctx.save();
  ctx.font = '12px Share Tech Mono, monospace';
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillText(`FPS ${_fpsValue}`, 12, 56);
  ctx.fillStyle = '#9bff9b';
  ctx.fillText(`FPS ${_fpsValue}`, 11, 55);
  ctx.restore();
}

function drawSkyOrbs(day) {
  if (!settings.sky) return;
  const w = window.innerWidth;
  const h = window.innerHeight;

  // Sun and moon orbit opposite each other: angle = dayPhase * 2π.
  const angle = dayPhase * Math.PI * 2 - Math.PI * 0.5;
  const orbitR = Math.min(w, h) * 0.42;
  const cx = w * 0.5;
  const horizonY = h * 0.55;
  const sunX = cx + Math.cos(angle) * orbitR;
  const sunY = horizonY - Math.sin(angle) * orbitR;
  const moonX = cx - Math.cos(angle) * orbitR;
  const moonY = horizonY + Math.sin(angle) * orbitR;

  ctx.save();

  // Stars at night.
  if (day < 0.35) {
    const starAlpha = clamp((0.35 - day) * 3, 0, 1);
    ctx.fillStyle = `rgba(255,255,255,${starAlpha})`;
    for (let i = 0; i < 70; i++) {
      const sx = (Math.sin(i * 92.7 + worldSeed) * 0.5 + 0.5) * w;
      const sy = (Math.cos(i * 41.3 + worldSeed) * 0.5 + 0.5) * h * 0.55;
      const sz = (Math.sin(i * 13.4) * 0.5 + 0.5) * 1.6 + 0.4;
      ctx.fillRect(sx, sy, sz, sz);
    }
  }

  if (sunY < horizonY + 80) {
    // Square Minecraft sun.
    const sz = 26;
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = 'rgba(255, 220, 120, 1)';
    ctx.fillRect(sunX - 70, sunY - 70, 140, 140);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff5b6';
    ctx.fillRect(sunX - sz, sunY - sz, sz * 2, sz * 2);
    ctx.fillStyle = '#ffe07a';
    ctx.fillRect(sunX - sz + 4, sunY - sz + 4, sz * 2 - 8, sz * 2 - 8);
  }

  if (moonY < horizonY + 80) {
    const mz = 22;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#e7eaf3';
    ctx.fillRect(moonX - mz, moonY - mz, mz * 2, mz * 2);
    ctx.fillStyle = '#cdd2dc';
    ctx.fillRect(moonX - mz + 6, moonY - mz + 4, 8, 8);
    ctx.fillRect(moonX - mz + 18, moonY - mz + 14, 6, 6);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

let weatherDrops = [];
function drawWeather() {
  if (settings.weather === 'clear') return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const target = settings.weather === 'storm' ? 220 : 130;
  while (weatherDrops.length < target) {
    weatherDrops.push({
      x: Math.random() * w,
      y: Math.random() * h,
      v: 0.5 + Math.random() * 1.0,
      l: 6 + Math.random() * 8,
    });
  }
  if (weatherDrops.length > target) weatherDrops.length = target;

  ctx.save();
  if (settings.weather === 'snow') {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const d of weatherDrops) {
      d.y += d.v * 1.6;
      d.x += Math.sin((d.y + d.v) * 0.02) * 0.3;
      if (d.y > h) { d.y = -10; d.x = Math.random() * w; }
      ctx.fillRect(d.x, d.y, 2, 2);
    }
  } else {
    ctx.strokeStyle = settings.weather === 'storm' ? 'rgba(180,200,255,0.55)' : 'rgba(150,180,230,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of weatherDrops) {
      d.y += d.v * (settings.weather === 'storm' ? 14 : 10);
      d.x += d.v * 1.2;
      if (d.y > h) { d.y = -10; d.x = Math.random() * w; }
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 1, d.y - d.l);
    }
    ctx.stroke();
    if (settings.weather === 'storm' && Math.random() < 0.012) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(0, 0, w, h);
    }
  }
  ctx.restore();
}

function drawHand(camera) {
  if (!settings.hand) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const phase = player.bobPhase || 0;
  const swing = Math.sin(phase) * 18;
  const drop = Math.abs(Math.sin(phase)) * 8;
  // Floating block held in hand showing selected slot.
  const type = PLACEABLE_BLOCKS[selectedSlot];
  const def = type ? BLOCKS[type] : null;
  const baseColor = def?.faces?.side || def?.color || '#c58a52';
  const hx = w * 0.78 + swing;
  const hy = h - 110 + drop;
  const sz = 96;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(-0.14);
  // Side face shadow.
  ctx.fillStyle = mixColor(baseColor, '#000000', 0.35);
  ctx.fillRect(-sz * 0.35, -sz * 0.25, sz * 0.7, sz * 0.7);
  // Top.
  ctx.fillStyle = mixColor(baseColor, '#ffffff', 0.18);
  ctx.beginPath();
  ctx.moveTo(-sz * 0.35, -sz * 0.25);
  ctx.lineTo(0, -sz * 0.5);
  ctx.lineTo(sz * 0.55, -sz * 0.4);
  ctx.lineTo(sz * 0.35, -sz * 0.25);
  ctx.closePath();
  ctx.fill();
  // Right.
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(sz * 0.35, -sz * 0.25);
  ctx.lineTo(sz * 0.55, -sz * 0.4);
  ctx.lineTo(sz * 0.55, sz * 0.3);
  ctx.lineTo(sz * 0.35, sz * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function buildCamera() {
  const cy = Math.cos(player.yaw);
  const sy = Math.sin(player.yaw);
  const cp = Math.cos(player.pitch);
  const sp = Math.sin(player.pitch);
  const forward = { x: sy * cp, y: sp, z: cy * cp };
  const right = { x: cy, y: 0, z: -sy };
  // up = forward × right, so the basis stays orthonormal as pitch changes;
  // the previous z sign was flipped, which warped the view when looking up/down.
  const up = {
    x: -sy * sp,
    y: cp,
    z: -cy * sp,
  };
  const phase = player.bobPhase || 0;
  const bobAmp = settings.bobbing ? 0.06 : 0;
  const bobY = Math.abs(Math.sin(phase)) * bobAmp;
  const bobX = Math.sin(phase * 0.5) * bobAmp * 0.4;
  // FOV → focal length mapping; vanilla default 70-75 deg.
  const fovRad = (settings.fov || 75) * Math.PI / 180;
  const focal = (Math.min(window.innerWidth, window.innerHeight) * 0.5) / Math.tan(fovRad / 2);
  return {
    pos: {
      x: player.x + bobX * right.x,
      y: player.y + 1.62 - bobY,
      z: player.z + bobX * right.z,
    },
    forward,
    right,
    up,
    focal,
  };
}

function projectPoint(x, y, z, camera) {
  const relX = x - camera.pos.x;
  const relY = y - camera.pos.y;
  const relZ = z - camera.pos.z;
  const cx = relX * camera.right.x + relY * camera.right.y + relZ * camera.right.z;
  const cy = relX * camera.up.x + relY * camera.up.y + relZ * camera.up.z;
  const cz = relX * camera.forward.x + relY * camera.forward.y + relZ * camera.forward.z;
  if (cz <= 0.08) return null;
  return {
    x: window.innerWidth * 0.5 + (cx * camera.focal) / cz,
    y: window.innerHeight * 0.5 - (cy * camera.focal) / cz,
    depth: cz,
  };
}

function getFaceColor(type, face) {
  const def = BLOCKS[type];
  if (!def) return '#fff';
  if (def.faces) {
    if (def.faces[face]) return def.faces[face];
    // Cardinal side faces fall back to a generic 'side' color.
    if ((face === 'north' || face === 'south' || face === 'east' || face === 'west') && def.faces.side) {
      return def.faces.side;
    }
  }
  return def.color || '#ffffff';
}

function applyLighting(color, factor, type) {
  const alpha = BLOCKS[type]?.alpha ?? 1;
  const hex = color.startsWith('#') ? color : '#ffffff';
  const [r, g, b] = hexToRgb(hex);
  const shadowBoost = settings.shadow ? 1 : 1.1;
  const brightness = settings.brightness ?? 1;
  const light = clamp(factor * shadowBoost * brightness, 0.32, 1.4);
  return `rgba(${Math.round(clamp(r * light, 0, 255))}, ${Math.round(clamp(g * light, 0, 255))}, ${Math.round(clamp(b * light, 0, 255))}, ${alpha})`;
}

function isFaceHidden(type, neighbor) {
  if (neighbor === 'air') return false;
  if (type === 'water' && neighbor !== 'water') return false;
  if (BLOCKS[neighbor]?.transparent) return false;
  return true;
}

function drawFace(face) {
  const pts = face.points;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fillStyle = face.color;
  ctx.fill();

  if (settings.textures && !settings.lowPoly && face.type) {
    drawFaceTexture(face);
  }

  if (!settings.lowPoly) {
    ctx.strokeStyle = face.stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// Per-block, per-face deterministic texture overlay. Drives a pixelated
// Minecraft-ish look on top of the base fill without true UV mapping.
function drawFaceTexture(face) {
  const def = BLOCKS[face.type];
  if (!def || !def.texture) return;
  const pts = face.points;

  // Bounding box on screen.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const w = maxX - minX;
  const h = maxY - minY;
  if (w < 4 || h < 4 || w > 1400 || h > 1400) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.clip();

  const tex = TEXTURE_PATTERNS[def.texture] || TEXTURE_PATTERNS.default;
  const cells = 6; // Coarse 6x6 noise grid per face — fast, reads as pixels.
  const cellW = w / cells;
  const cellH = h / cells;
  const seed = (face.blockX * 73856093) ^ (face.blockY * 19349663) ^ (face.blockZ * 83492791) ^ hashFace(face.faceName);
  for (let cy = 0; cy < cells; cy++) {
    for (let cx = 0; cx < cells; cx++) {
      const noise = rand(seed + cx * 17 + cy * 31);
      const sample = tex(cx, cy, noise, face.faceName);
      if (!sample) continue;
      const lit = applyLighting(sample.color, face.lightFactor * (sample.shade ?? 1), face.type);
      ctx.fillStyle = lit;
      ctx.globalAlpha = sample.alpha ?? 1;
      ctx.fillRect(minX + cx * cellW - 0.5, minY + cy * cellH - 0.5, cellW + 1, cellH + 1);
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function hashFace(name) {
  switch (name) {
    case 'top': return 1;
    case 'bottom': return 2;
    case 'north': return 3;
    case 'south': return 4;
    case 'east': return 5;
    default: return 6;
  }
}

// Texture sampling functions return { color, shade?, alpha? } per cell or null
// to skip drawing. They produce deterministic pixel patterns.
const TEXTURE_PATTERNS = {
  grass: (cx, cy, n, face) => {
    if (face === 'top') {
      const variants = ['#79c05a', '#82c95a', '#6db14e', '#7fbd55'];
      return { color: variants[Math.floor(n * variants.length)] };
    }
    if (face === 'bottom') return { color: ['#8b5a2b', '#7d4f24'][Math.floor(n * 2)] };
    // Side: top row grass overhang, rest dirt.
    if (cy === 0) return { color: ['#79c05a', '#6db14e'][Math.floor(n * 2)] };
    if (cy === 1 && n > 0.5) return { color: '#6db14e' };
    return { color: ['#8b5a2b', '#7d4f24', '#956336'][Math.floor(n * 3)] };
  },
  dirt: (cx, cy, n) => ({ color: ['#8b5a2b', '#7d4f24', '#956336', '#724729'][Math.floor(n * 4)] }),
  stone: (cx, cy, n) => ({ color: ['#828282', '#787878', '#8a8a8a', '#727272'][Math.floor(n * 4)] }),
  log: (cx, cy, n, face) => {
    if (face === 'top' || face === 'bottom') {
      const r = Math.hypot(cx - 2.5, cy - 2.5);
      if (r < 1.2) return { color: '#a07842' };
      if (r < 2.2) return { color: '#8a6332' };
      return { color: '#6b4f2a' };
    }
    // Vertical stripes for bark.
    return { color: cx % 2 === 0 ? '#6b4f2a' : '#7d5e36' };
  },
  planks: (cx, cy, n) => {
    // Horizontal plank rows.
    const row = cy % 2;
    return { color: row === 0 ? '#b07e44' : '#9c6e3a' };
  },
  sand: (cx, cy, n) => ({ color: ['#dbd3a0', '#d3ca94', '#e0d8a8', '#cdc28b'][Math.floor(n * 4)] }),
  water: (cx, cy, n) => ({
    color: ['#3f76e4', '#4880ee', '#3a6ed5'][Math.floor(n * 3)],
    alpha: 0.78,
  }),
  leaves: (cx, cy, n) => {
    if (n < 0.18) return null; // sparkle gaps
    return { color: ['#48761d', '#5b8b29', '#3d6418', '#52821f'][Math.floor(n * 4)], alpha: 0.95 };
  },
  tnt: (cx, cy, n, face) => {
    if (face === 'top' || face === 'bottom') return { color: ['#bd2c2c', '#a02525'][Math.floor(n * 2)] };
    // T-N-T stripes: middle band lighter (white "TNT" lettering simulated).
    if (cy === 2 || cy === 3) return { color: cx % 2 === 0 ? '#e6e6e6' : '#cf3838' };
    return { color: ['#cf3838', '#bd2c2c'][Math.floor(n * 2)] };
  },
  lucky: (cx, cy, n) => {
    if ((cx === 2 || cx === 3) && (cy === 2 || cy === 3)) return { color: '#fff48a' };
    return { color: ['#ffd94c', '#efbf1f'][Math.floor(n * 2)] };
  },
  brick: (cx, cy, n) => {
    // Stone brick pattern: alternating rows offset.
    const row = Math.floor(cy / 2);
    const offset = (row % 2) * 1.5;
    const col = Math.floor(cx + offset);
    if ((col + cy) % 3 === 0) return { color: '#6c6c6c' };
    return { color: ['#7c7c7c', '#888888', '#717171'][Math.floor(n * 3)] };
  },
  workbench: (cx, cy, n, face) => {
    if (face === 'top') {
      // Crafting grid look.
      if ((cx + 1) % 2 === 0 && (cy + 1) % 2 === 0) return { color: '#5e3a14' };
      return { color: '#a76b35' };
    }
    return { color: cx % 2 === 0 ? '#7a4d22' : '#8a5827' };
  },
  coal_ore: (cx, cy, n) => {
    if (n > 0.78) return { color: '#1c1c1c' };
    return { color: ['#828282', '#787878', '#8a8a8a'][Math.floor(n * 3)] };
  },
  iron_ore: (cx, cy, n) => {
    if (n > 0.78) return { color: '#cba07e' };
    return { color: ['#828282', '#787878', '#8a8a8a'][Math.floor(n * 3)] };
  },
  gold_ore: (cx, cy, n) => {
    if (n > 0.78) return { color: '#fce06a' };
    return { color: ['#828282', '#787878', '#8a8a8a'][Math.floor(n * 3)] };
  },
  diamond_ore: (cx, cy, n) => {
    if (n > 0.78) return { color: '#5be1ff' };
    return { color: ['#828282', '#787878', '#8a8a8a'][Math.floor(n * 3)] };
  },
  cactus: (cx, cy, n, face) => {
    if (face === 'top' || face === 'bottom') return { color: ['#5c8b3a', '#4d7430'][Math.floor(n * 2)] };
    if (cx === 0 || cx === 5) return { color: '#3a5d28' };
    return { color: ['#3e7530', '#4d8a36'][Math.floor(n * 2)] };
  },
  default: (cx, cy, n) => ({ color: '#888' }),
};

function drawEntities(camera) {
  for (const bot of bots) {
    const dist = Math.hypot(bot.x - player.x, bot.z - player.z);
    if (settings.entityCulling && dist > settings.renderDistance + 7) continue;
    const bodyColor = bot.color;
    const skin = '#f0bfa1';
    const pants = mixColor(bodyColor, '#000000', 0.55);
    // Steve-like proportions: head 0.5, body 0.5w x 0.75h x 0.25d, arms 0.25 wide, legs 0.25 wide.
    // Legs.
    renderBox(bot.x - 0.25, bot.y, bot.z - 0.125, 0.25, 0.75, 0.25, pants, camera);
    renderBox(bot.x, bot.y, bot.z - 0.125, 0.25, 0.75, 0.25, pants, camera);
    // Body torso.
    renderBox(bot.x - 0.25, bot.y + 0.75, bot.z - 0.125, 0.5, 0.75, 0.25, bodyColor, camera);
    // Arms — sway slightly with movement.
    const sway = Math.sin((bot.moveTimer || 0) * 6) * 0.08;
    renderBox(bot.x - 0.5, bot.y + 0.78 + sway, bot.z - 0.125, 0.25, 0.7, 0.25, bodyColor, camera);
    renderBox(bot.x + 0.25, bot.y + 0.78 - sway, bot.z - 0.125, 0.25, 0.7, 0.25, bodyColor, camera);
    // Head.
    renderBox(bot.x - 0.25, bot.y + 1.5, bot.z - 0.25, 0.5, 0.5, 0.5, skin, camera);
    const tag = projectPoint(bot.x, bot.y + 2.0, bot.z, camera);
    if (tag) {
      ctx.save();
      ctx.font = '10px Share Tech Mono';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillText(bot.name, tag.x + 1, tag.y - 10);
      ctx.fillStyle = '#fff';
      ctx.fillText(bot.name, tag.x, tag.y - 11);
      if (bot.messageTimer > 0 && bot.message) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillText(bot.message, tag.x + 1, tag.y - 24);
        ctx.fillStyle = accentRgba(0.9);
        ctx.fillText(bot.message, tag.x, tag.y - 25);
      }
      ctx.restore();
    }
  }
}

function renderBox(x, y, z, width, height, depth, color, camera) {
  const faces = [];
  for (const face of FACE_DEFS) {
    const verts = face.verts.map(v => projectPoint(x + v[0] * width, y + v[1] * height, z + v[2] * depth, camera));
    if (verts.some(p => !p)) continue;
    faces.push({
      points: verts,
      depth: verts.reduce((sum, p) => sum + p.depth, 0) / verts.length,
      color: applyLighting(color, face.shade, 'stone'),
      stroke: settings.lowPoly ? 'transparent' : 'rgba(0,0,0,0.22)',
    });
  }
  faces.sort((a, b) => b.depth - a.depth);
  for (const face of faces) drawFace(face);
}

function drawParticles(camera) {
  for (const p of particles) {
    const pt = projectPoint(p.x, p.y, p.z, camera);
    if (!pt) continue;
    const size = clamp((p.life * 6) * 6, 2, 8);
    ctx.fillStyle = rgba(p.color, clamp(p.life, 0.1, 1), 1);
    ctx.fillRect(pt.x - size * 0.5, pt.y - size * 0.5, size, size);
  }
}

function drawSelection(camera) {
  if (!currentTarget) return;
  const x = currentTarget.x;
  const y = currentTarget.y;
  const z = currentTarget.z;
  const edges = [
    [0, 0, 0, 1, 0, 0],
    [1, 0, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 1],
    [0, 0, 1, 0, 0, 0],
    [0, 1, 0, 1, 1, 0],
    [1, 1, 0, 1, 1, 1],
    [1, 1, 1, 0, 1, 1],
    [0, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 1, 0],
    [1, 0, 0, 1, 1, 0],
    [1, 0, 1, 1, 1, 1],
    [0, 0, 1, 0, 1, 1],
  ];
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 2;
  for (const e of edges) {
    const p1 = projectPoint(x + e[0], y + e[1], z + e[2], camera);
    const p2 = projectPoint(x + e[3], y + e[4], z + e[5], camera);
    if (!p1 || !p2) continue;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  ctx.restore();
}

function mixColor(a, b, t) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const mix = clamp(t, 0, 1);
  return `rgb(${Math.round(lerp(r1, r2, mix))} ${Math.round(lerp(g1, g2, mix))} ${Math.round(lerp(b1, b2, mix))})`;
}

function accentRgba(alpha) {
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '255 26 26';
  return `rgba(${accent.replace(/\s+/g, ', ')}, ${alpha})`;
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function loop(ts) {
  if (!lastTs) lastTs = ts;
  const dt = clamp((ts - lastTs) / 1000, 0, 0.033);
  lastTs = ts;
  if (gameActive && !paused) update(dt);
  render();
  requestFrame = requestAnimationFrame(loop);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('blur', () => {
  if (gameActive && !paused) pauseGame();
});

document.addEventListener('tabby-profile-change', () => {
  settings = loadSettings();
  applySettingsToUi();
});

bindUi();
settings = loadSettings();
applySettingsToUi();
resizeCanvas();
regenerateWorld(true);
showStartScreen();
requestFrame = requestAnimationFrame(loop);
