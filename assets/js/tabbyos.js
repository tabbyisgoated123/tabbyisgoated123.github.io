(function () {
  const clockEl = document.getElementById('os-clock');
  const desktop = document.getElementById('os-desktop');
  const dockLabel = document.getElementById('dock-label');
  const startBtn = document.getElementById('start-btn');
  const windowLayer = document.getElementById('window-layer');
  if (!clockEl || !desktop || !dockLabel || !windowLayer) return;

  let zTop = 600;
  let openCount = 0;

  function tickClock() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}`;
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
      win.style.left = `${Math.max(0, Math.min(window.innerWidth - 180, nx))}px`;
      win.style.top = `${Math.max(40, Math.min(window.innerHeight - 120, ny))}px`;
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
      win.style.height = `${Math.max(240, Math.min(window.innerHeight - 54, nh))}px`;
    });
    const end = () => { resizing = false; };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  }

  function createWindow(appName) {
    const win = document.createElement('section');
    win.className = 'app-window';
    win.style.left = `${90 + (openCount % 6) * 22}px`;
    win.style.top = `${70 + (openCount % 6) * 16}px`;
    win.style.width = '860px';
    win.style.height = '560px';
    bringToFront(win);
    openCount += 1;

    const isTerminal = appName === 'terminal';
    const title = isTerminal ? 'TabbyOS Terminal' : appName.replace('.html', '');
    win.innerHTML = `
      <div class="window-bar">
        <span>${title}</span>
        <div class="window-actions">
          <button type="button" data-action="min">_</button>
          <button type="button" data-action="close">x</button>
        </div>
      </div>
      ${isTerminal ? '<div class="terminal-view"></div>' : `<iframe title="${title}" src="${appName}"></iframe>`}
      <div class="win-resize"></div>
    `;
    windowLayer.appendChild(win);

    if (isTerminal) {
      const tv = win.querySelector('.terminal-view');
      tv.textContent =
`[tabby@os ~]$ neofetch
OS: TabbyOS (fake arch shell)
Kernel: github-pages-1.0
Packages: aim-trainer cps-trainer tabbytyping tabbycraft
WM: Tabby Desktop
`;
    }

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
    dockLabel.textContent = `Running ${title}`;
  }

  desktop.addEventListener('click', ev => {
    const btn = ev.target.closest('.app-icon');
    if (!btn) return;
    createWindow(btn.dataset.app);
  });

  startBtn?.addEventListener('click', () => {
    dockLabel.textContent = 'TabbyOS menu: click any app icon';
  });

  window.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    const wins = [...windowLayer.querySelectorAll('.app-window')];
    if (!wins.length) return;
    wins.sort((a, b) => (+b.style.zIndex || 0) - (+a.style.zIndex || 0))[0].remove();
    dockLabel.textContent = 'Closed top window';
  });

  tickClock();
  setInterval(tickClock, 1000);
})();
