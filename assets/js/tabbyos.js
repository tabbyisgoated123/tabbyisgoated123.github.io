(function () {
  const clockEl = document.getElementById('os-clock');
  const desktop = document.getElementById('os-desktop');
  const appWindow = document.getElementById('app-window');
  const appFrame = document.getElementById('app-frame');
  const terminalView = document.getElementById('terminal-view');
  const winTitle = document.getElementById('window-title');
  const dockLabel = document.getElementById('dock-label');
  const winClose = document.getElementById('win-close');
  const winMin = document.getElementById('win-min');
  const startBtn = document.getElementById('start-btn');

  function tickClock() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hh}:${mm}`;
  }

  function openApp(appName) {
    appWindow.classList.remove('hidden');
    if (appName === 'terminal') {
      appFrame.style.display = 'none';
      terminalView.classList.remove('hidden');
      winTitle.textContent = 'TabbyOS Terminal';
      terminalView.textContent =
`[tabby@os ~]$ neofetch
OS: TabbyOS (fake arch shell)
Kernel: github-pages-1.0
Packages: aim-trainer cps-trainer tabbytyping tabbycraft
WM: Tabby Desktop

[tabby@os ~]$ help
Open any app icon to launch a game window.
Use close/minimize in the title bar.
`;
      dockLabel.textContent = 'Terminal active';
      return;
    }

    terminalView.classList.add('hidden');
    appFrame.style.display = 'block';
    appFrame.src = appName;
    winTitle.textContent = appName.replace('.html', '');
    dockLabel.textContent = `Running ${winTitle.textContent}`;
  }

  desktop?.addEventListener('click', ev => {
    const btn = ev.target.closest('.app-icon');
    if (!btn) return;
    openApp(btn.dataset.app);
  });

  winClose?.addEventListener('click', () => {
    appWindow.classList.add('hidden');
    appFrame.src = '';
    dockLabel.textContent = 'Ready';
  });

  winMin?.addEventListener('click', () => {
    appWindow.classList.add('hidden');
    dockLabel.textContent = 'Window minimized';
  });

  startBtn?.addEventListener('click', () => {
    dockLabel.textContent = 'TabbyOS menu: click an app icon';
  });

  tickClock();
  setInterval(tickClock, 1000);
})();
