// Shared ambient background: particle network + cursor halo.
// Looks for: <canvas id="bg-canvas">, <div id="cursor-glow">, <div id="cursor-dot">
// Optional: body classes "bg-dim" (lower particle density),
//           "bg-paused"  (pauses motion / hides during gameplay)

(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  let mouseCx = -9999, mouseCy = -9999;
  let visible = true;

  function resize () {
    W = canvas.width = Math.floor(window.innerWidth * DPR);
    H = canvas.height = Math.floor(window.innerHeight * DPR);
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  const dim = document.body.classList.contains('bg-dim');
  const baseCount = window.innerWidth < 800 ? 36 : 78;
  const PARTICLE_COUNT = dim ? Math.round(baseCount * 0.45) : baseCount;

  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28 * DPR,
      vy: (Math.random() - 0.5) * 0.28 * DPR,
      r: (Math.random() * 1.4 + 0.6) * DPR,
    });
  }

  document.addEventListener('mousemove', (e) => {
    mouseCx = e.clientX * DPR;
    mouseCy = e.clientY * DPR;
  });

  // Custom cursor (graceful no-op if elements absent)
  const dot  = document.getElementById('cursor-dot');
  const glow = document.getElementById('cursor-glow');
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let gx = mx, gy = my;
  let dx = mx, dy = my;

  document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; });

  function cursorLoop () {
    gx += (mx - gx) * 0.12;
    gy += (my - gy) * 0.12;
    dx += (mx - dx) * 0.5;
    dy += (my - dy) * 0.5;
    if (glow) glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
    if (dot)  dot.style.transform  = `translate(${dx}px, ${dy}px) translate(-50%, -50%) rotate(45deg)`;
    requestAnimationFrame(cursorLoop);
  }
  if (dot || glow) cursorLoop();

  function setHot (on) { if (dot) dot.classList.toggle('hot', on); }
  document.querySelectorAll('a, button, .card, input, select, textarea').forEach((el) => {
    el.addEventListener('mouseenter', () => setHot(true));
    el.addEventListener('mouseleave', () => setHot(false));
  });
  document.addEventListener('mouseleave', () => {
    if (dot)  dot.style.opacity  = 0;
    if (glow) glow.style.opacity = 0;
  });
  document.addEventListener('mouseenter', () => {
    if (dot)  dot.style.opacity  = 1;
    if (glow) glow.style.opacity = 1;
  });

  // Particle render loop
  function loop () {
    const paused = document.body.classList.contains('bg-paused');
    if (paused) {
      ctx.clearRect(0, 0, W, H);
      requestAnimationFrame(loop);
      return;
    }
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      const ddx = p.x - mouseCx, ddy = p.y - mouseCy;
      const reach = 160 * DPR;
      const distSq = ddx * ddx + ddy * ddy;
      if (distSq < reach * reach) {
        const d = Math.sqrt(distSq) || 1;
        const force = (reach - d) / reach * 0.55;
        p.x += (ddx / d) * force * DPR;
        p.y += (ddy / d) * force * DPR;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,40,40,0.55)';
      ctx.fill();
    }

    const linkDist = 130 * DPR;
    const linkDist2 = linkDist * linkDist;
    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i], b = particles[j];
        const ddx = a.x - b.x, ddy = a.y - b.y;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < linkDist2) {
          const alpha = 1 - Math.sqrt(d2) / linkDist;
          ctx.strokeStyle = `rgba(255,30,30,${(alpha * 0.20).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (mouseCx > 0) {
      const reach2 = 180 * DPR;
      const reach2Sq = reach2 * reach2;
      for (const p of particles) {
        const ddx = p.x - mouseCx, ddy = p.y - mouseCy;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < reach2Sq) {
          const alpha = 1 - Math.sqrt(d2) / reach2;
          ctx.strokeStyle = `rgba(255,80,80,${(alpha * 0.45).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseCx, mouseCy);
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(loop);
  }
  loop();
})();
