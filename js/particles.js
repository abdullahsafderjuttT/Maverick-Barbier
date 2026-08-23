// ============================================================
// Maverick Barbier — ambient dust particle animation
// Attaches to every <canvas class="dust-canvas"> on the page.
// Small glowing motes drift upward and sway slightly, like dust
// caught in a shaft of light. Respects prefers-reduced-motion.
// ============================================================

(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const palette = ['#9CEFC4', '#24B36B', '#1B8A54', '#F6F8F5'];

  function initField(canvas) {
    const ctx = canvas.getContext('2d');
    const count = parseInt(canvas.dataset.count || '60', 10);
    let particles = [];
    let width, height, dpr;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeParticle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.8 + 0.5,
        speed: Math.random() * 0.35 + 0.08,
        drift: Math.random() * 0.6 - 0.3,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.015 + 0.005,
        alpha: Math.random() * 0.6 + 0.25,
        twinkle: Math.random() * 0.02 + 0.005,
        color: palette[Math.floor(Math.random() * palette.length)],
      };
    }

    function seed() {
      particles = Array.from({ length: count }, makeParticle);
    }

    function drawStatic() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.sway += p.swaySpeed;
        p.x += Math.sin(p.sway) * 0.15 + p.drift * 0.02;
        p.alpha += (Math.random() - 0.5) * p.twinkle;
        p.alpha = Math.max(0.15, Math.min(0.85, p.alpha));

        if (p.y < -4) {
          p.y = height + 4;
          p.x = Math.random() * width;
        }
        if (p.x < -4) p.x = width + 4;
        if (p.x > width + 4) p.x = -4;

        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    }

    resize();
    seed();

    if (prefersReducedMotion) {
      drawStatic();
    } else {
      requestAnimationFrame(tick);
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        seed();
        if (prefersReducedMotion) drawStatic();
      }, 200);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('canvas.dust-canvas').forEach(initField);
  });
})();
