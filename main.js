/* ══════════════════════════════════════════════
   NEVER MISS A LEAD — Main JS
══════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

// ── STARS ──────────────────────────────────────
function createStars() {
  const container = document.getElementById('stars');
  if (!container) return;
  for (let i = 0; i < 120; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    star.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%; top:${Math.random()*70}%;
      animation-delay:${Math.random()*3}s;
      animation-duration:${1.5+Math.random()*2}s;
    `;
    container.appendChild(star);
  }
}
createStars();

// ── GTA INTRO ──────────────────────────────────
const dialogues = [
  { who: 'left',  text: "My phone barely rings... I'm losing jobs every day!" },
  { who: 'right', text: "Same! I tried ads once — total waste of money." },
  { who: 'left',  text: "My Google page just sits there doing nothing." },
  { who: 'right', text: "There's gotta be a better way, man..." },
  { who: 'both',  text: '...' },
];

let dialogueIndex = 0;
let introComplete = false;

function typeText(element, text, onDone) {
  element.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    element.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(interval);
      if (onDone) setTimeout(onDone, 1200);
    }
  }, 38);
}

function showBubble(side, text, cb) {
  const bubble = document.getElementById(`bubble-${side}`);
  const textEl = document.getElementById(`bubble-${side}-text`);
  gsap.to(bubble, { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.7)' });
  typeText(textEl, text, () => {
    gsap.to(bubble, { opacity: 0, scale: 0.8, duration: 0.3, delay: 0.2, onComplete: cb });
  });
}

function hideBubble(side) {
  const bubble = document.getElementById(`bubble-${side}`);
  gsap.to(bubble, { opacity: 0, scale: 0.8, duration: 0.25 });
}

function runDialogue() {
  if (dialogueIndex >= dialogues.length) {
    showTitle();
    return;
  }
  const d = dialogues[dialogueIndex++];
  if (d.who === 'both') {
    setTimeout(() => runDialogue(), 800);
    return;
  }
  showBubble(d.who, d.text, runDialogue);
}

function showTitle() {
  const title = document.getElementById('intro-title');
  gsap.to(title, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });

  let progress = 0;
  const bar = document.getElementById('loading-bar');
  const interval = setInterval(() => {
    progress += 1.2;
    bar.style.width = Math.min(progress, 100) + '%';
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(launchSite, 400);
    }
  }, 30);
}

function launchSite() {
  if (introComplete) return;
  introComplete = true;

  const tl = gsap.timeline();
  tl.to('#intro-scene', {
    scale: 1.05,
    duration: 0.3,
    ease: 'power2.in'
  })
  .to('#intro-scene', {
    opacity: 0,
    scale: 1.15,
    duration: 0.5,
    ease: 'power3.out',
    onComplete: () => {
      document.getElementById('intro-scene').style.display = 'none';
      document.getElementById('main-content').style.display = 'block';
      document.body.style.overflow = '';
      initSite();
    }
  });
}

function skipIntro() {
  launchSite();
}
window.skipIntro = skipIntro;

// Run intro
function startIntro() {
  document.body.style.overflow = 'hidden';
  document.getElementById('main-content').style.display = 'none';

  // Animate location tag
  gsap.to('#location-tag', { opacity: 1, x: 0, duration: 0.6, delay: 0.5 });

  // Walk characters in
  gsap.to('#left-char-wrap', {
    left: '12%',
    duration: 1.2,
    delay: 0.8,
    ease: 'power2.out'
  });
  gsap.to('#right-char-wrap', {
    right: '12%',
    duration: 1.2,
    delay: 0.8,
    ease: 'power2.out',
    onComplete: () => {
      setTimeout(runDialogue, 400);
    }
  });

  gsap.set('#intro-title', { y: 20 });
}

startIntro();

// ── SITE INIT ──────────────────────────────────
function initSite() {
  initParticles();
  initNavbar();
  initScrollAnimations();
  initCounters();
  initCursor();
}

// ── PARTICLES ──────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h;
  const particles = [];
  const count = 80;

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = -Math.random() * 0.6 - 0.2;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.color = Math.random() > 0.5 ? '155,181,201' : '122,79,101';
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.opacity -= 0.001;
      if (this.y < -10 || this.opacity <= 0) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.opacity})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < count; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, w, h);
    // Draw connection lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(155,181,201,${0.06 * (1 - dist/120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
}

// ── NAVBAR ────────────────────────────────────
function initNavbar() {
  const nav = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    nav.classList.toggle('scrolled', scrollY > 50);
    nav.style.transform = scrollY > lastScroll && scrollY > 100
      ? 'translateY(-100%)'
      : 'translateY(0)';
    lastScroll = scrollY;
  });
  nav.style.transition = 'transform 0.3s ease, padding 0.3s, background 0.3s';
}

// ── SCROLL ANIMATIONS ─────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-anim]').forEach(el => observer.observe(el));

  // GSAP hero animations
  const heroTl = gsap.timeline();
  heroTl
    .from('.hero-badge', { opacity: 0, y: 20, duration: 0.6 })
    .from('.line1', { opacity: 0, x: -40, duration: 0.6 }, '-=0.2')
    .from('.line2', { opacity: 0, x: -40, duration: 0.6 }, '-=0.3')
    .from('.line3', { opacity: 0, x: -40, duration: 0.6 }, '-=0.3')
    .from('.hero-sub', { opacity: 0, y: 20, duration: 0.5 }, '-=0.2')
    .from('.hero-btns', { opacity: 0, y: 20, duration: 0.5 }, '-=0.2')
    .from('.hero-stats', { opacity: 0, y: 20, duration: 0.5 }, '-=0.2')
    .from('.hero-phone-mockup', { opacity: 0, x: 60, duration: 0.8, ease: 'power3.out' }, '-=0.6');
}

// ── COUNTERS ──────────────────────────────────
function initCounters() {
  const counters = document.querySelectorAll('.stat-num');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      let current = 0;
      const step = target / 60;
      const interval = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current);
        if (current >= target) clearInterval(interval);
      }, 16);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => counterObserver.observe(c));
}

// ── CUSTOM CURSOR ─────────────────────────────
function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  const follower = document.createElement('div');
  follower.className = 'cursor-follower';
  document.body.appendChild(cursor);
  document.body.appendChild(follower);

  let mx = 0, my = 0, fx = 0, fy = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    cursor.style.left = mx - 6 + 'px';
    cursor.style.top = my - 6 + 'px';
  });

  function animFollower() {
    fx += (mx - fx - 18) * 0.12;
    fy += (my - fy - 18) * 0.12;
    follower.style.left = fx + 'px';
    follower.style.top = fy + 'px';
    requestAnimationFrame(animFollower);
  }
  animFollower();

  document.querySelectorAll('a, button, .service-card, .perk').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'scale(2)';
      follower.style.width = '56px';
      follower.style.height = '56px';
      follower.style.opacity = '0.5';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'scale(1)';
      follower.style.width = '36px';
      follower.style.height = '36px';
      follower.style.opacity = '1';
    });
  });
}

// ── CONTACT FORM ─────────────────────────────
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
    gsap.from('#form-success', { opacity: 0, y: 10, duration: 0.4 });
  }, 1800);
}
window.handleSubmit = handleSubmit;

// ── SMOOTH ANCHOR SCROLL ──────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
    }
  });
});
