// ============================================================
// Maverick Barbier — "dust becomes solid" image reveal
// Photos marked class="dust-target" start as scattered, colored
// dust motes that drift inward and coalesce into the full image
// as it scrolls into view. Falls back to a plain image if
// JavaScript is off, and to a plain fade if reduced-motion is on.
// ============================================================

document.documentElement.classList.add('js-dust'); // enables the CSS opacity:0 starting state, only when JS can actually run it

(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function revealPlain(img) {
    img.style.opacity = '1';
  }

  function setup(img) {
    if (img.dataset.dustSetup) return;
    img.dataset.dustSetup = 'true';

    if (prefersReducedMotion) {
      revealPlain(img);
      return;
    }

    const parent = img.parentNode;
    const nextSibling = img.nextSibling;

    function run() {
      const rect = img.getBoundingClientRect();
      const w = Math.max(Math.round(rect.width), 20);
      const h = Math.max(Math.round(rect.height), 20);

      // temporary "stage" wrapper: fixed px box matching the image's current
      // rendered size, so the canvas can sit exactly on top of it. Removed
      // again once the animation finishes, so responsive layout is untouched.
      const wrap = document.createElement('div');
      wrap.className = 'dust-wrap';
      wrap.style.width = w + 'px';
      wrap.style.height = h + 'px';
      parent.insertBefore(wrap, img);
      wrap.appendChild(img);

      const prevWidth = img.style.width, prevHeight = img.style.height, prevObjectFit = img.style.objectFit;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';

      const canvas = document.createElement('canvas');
      canvas.className = 'dust-wrap__canvas';
      wrap.appendChild(canvas);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // sample the image at low resolution so each dust mote can carry its patch's color
      const cols = 28;
      const rows = Math.max(6, Math.round(cols * (h / w)));
      const sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = cols;
      sampleCanvas.height = rows;
      const sctx = sampleCanvas.getContext('2d');
      let data = null;
      try {
        sctx.drawImage(img, 0, 0, cols, rows);
        data = sctx.getImageData(0, 0, cols, rows).data;
      } catch (e) {
        data = null; // cross-origin or load hiccup — particles fall back to a mint tone below
      }

      const cellW = w / cols, cellH = h / rows;
      const particles = [];
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          let color = 'rgba(156,239,196,0.9)';
          if (data) {
            const idx = (gy * cols + gx) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3] / 255;
            if (a < 0.05) continue; // skip transparent patches
            color = `rgba(${r},${g},${b},${a})`;
          }
          const tx = gx * cellW + cellW / 2;
          const ty = gy * cellH + cellH / 2;
          const angle = Math.random() * Math.PI * 2;
          const dist = (0.5 + Math.random() * 0.9) * Math.max(w, h) * 0.6;
          particles.push({
            sx: tx + Math.cos(angle) * dist,
            sy: ty + Math.sin(angle) * dist,
            tx, ty, color,
            delay: Math.random() * 0.45,
            size: Math.max(cellW, cellH) * (0.6 + Math.random() * 0.5),
          });
        }
      }

      const duration = 1500;
      const start = performance.now();
      let finished = false;

      function finish() {
        if (finished) return;
        finished = true;
        img.style.opacity = '1';
        canvas.style.opacity = '0';
        setTimeout(() => {
          // unwrap: put the image back exactly where it was, drop the stage
          img.style.width = prevWidth;
          img.style.height = prevHeight;
          img.style.objectFit = prevObjectFit;
          parent.insertBefore(img, nextSibling);
          wrap.remove();
        }, 550);
      }

      function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        ctx.clearRect(0, 0, w, h);
        let allDone = true;
        particles.forEach((p) => {
          const lt = Math.max(0, Math.min(1, (t - p.delay) / (1 - p.delay)));
          if (lt < 1) allDone = false;
          const e = easeOutCubic(lt);
          const x = p.sx + (p.tx - p.sx) * e;
          const y = p.sy + (p.ty - p.sy) * e;
          const size = p.size * (0.3 + 0.7 * e);
          ctx.globalAlpha = 0.15 + 0.85 * e;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(x, y, Math.max(size / 2, 0.4), 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;

        if (t < 1 || !allDone) {
          requestAnimationFrame(frame);
        } else {
          finish();
        }
      }

      // crossfade the crisp real image in slightly before the dust finishes settling
      setTimeout(() => { img.style.opacity = '1'; }, duration * 0.55);
      requestAnimationFrame(frame);
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run();
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
      io.observe(img);
    } else {
      run();
    }
  }

  function init() {
    document.querySelectorAll('img.dust-target').forEach((img) => {
      if (img.complete && img.naturalWidth) {
        setup(img);
      } else {
        img.addEventListener('load', () => setup(img), { once: true });
        img.addEventListener('error', () => revealPlain(img), { once: true });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
