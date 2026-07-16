/* ══════════════════════════════════════════════
   NEVER MISS A LEAD — Main JS
══════════════════════════════════════════════ */

if (window.gsap) gsap.registerPlugin(ScrollTrigger);

// ── CURSOR SPOTLIGHT REVEAL ────────────────────
const SPOTLIGHT_R = 260;
(function initSpotlight() {
  const canvas = document.getElementById('maskCanvas');
  const revealImg = document.getElementById('revealImg');
  if (!canvas || !revealImg) return;

  const ctx = canvas.getContext('2d');
  const mouse = { x: -999, y: -999 };
  const smooth = { x: -999, y: -999 };
  let raf;

  function sizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (t) { mouse.x = t.clientX; mouse.y = t.clientY; }
  }, { passive: true });

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const g = ctx.createRadialGradient(smooth.x, smooth.y, 0, smooth.x, smooth.y, SPOTLIGHT_R);
    g.addColorStop(0,    'rgba(255,255,255,1)');
    g.addColorStop(0.4,  'rgba(255,255,255,1)');
    g.addColorStop(0.6,  'rgba(255,255,255,0.75)');
    g.addColorStop(0.75, 'rgba(255,255,255,0.4)');
    g.addColorStop(0.88, 'rgba(255,255,255,0.12)');
    g.addColorStop(1,    'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(smooth.x, smooth.y, SPOTLIGHT_R, 0, Math.PI * 2);
    ctx.fill();

    const url = canvas.toDataURL();
    revealImg.style.webkitMaskImage = 'url(' + url + ')';
    revealImg.style.maskImage = 'url(' + url + ')';
    revealImg.style.webkitMaskSize = '100% 100%';
    revealImg.style.maskSize = '100% 100%';
    revealImg.style.webkitMaskRepeat = 'no-repeat';
    revealImg.style.maskRepeat = 'no-repeat';
  }

  function loop() {
    smooth.x += (mouse.x - smooth.x) * 0.1;
    smooth.y += (mouse.y - smooth.y) * 0.1;
    draw();
    raf = requestAnimationFrame(loop);
  }
  loop();

  window.addEventListener('beforeunload', () => cancelAnimationFrame(raf));
})();

// ── NAV SCROLLED STATE ─────────────────────────
(function initNav() {
  const nav = document.getElementById('topnav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
})();

// ── SCROLL REVEAL ANIMATIONS ───────────────────
(function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('[data-anim]').forEach((el) => observer.observe(el));
})();

// ── STAT COUNTERS (if present) ─────────────────
(function initCounters() {
  const counters = document.querySelectorAll('.stat-num, .tm-num');
  if (!counters.length) return;

  function fmt(n) {
    return n >= 1000 ? n.toLocaleString('en-US') : String(n);
  }

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10) || 0;
      let current = 0;
      const step = target / 60;
      const iv = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = fmt(Math.floor(current));
        if (current >= target) clearInterval(iv);
      }, 16);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach((c) => obs.observe(c));
})();

// ── CONTACT FORM ───────────────────────────────
function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.btn-submit');
  const text = btn.querySelector('.btn-submit-text');
  const loading = btn.querySelector('.btn-submit-loading');
  text.style.display = 'none';
  loading.style.display = 'inline';
  btn.disabled = true;
  setTimeout(() => {
    text.style.display = 'inline';
    loading.style.display = 'none';
    btn.disabled = false;
    document.getElementById('form-success').style.display = 'block';
    e.target.reset();
    if (window.gsap) gsap.from('#form-success', { opacity: 0, y: 10, duration: 0.4 });
  }, 1800);
}
window.handleSubmit = handleSubmit;

// ── SMOOTH ANCHOR SCROLL ───────────────────────
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 70, behavior: 'smooth' });
    }
  });
});
