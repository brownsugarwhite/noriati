/* ============================================================
   MAIN.JS – Nav, Lottie, Particles, Burger, Animations
   ============================================================ */

(function () {
  'use strict';

  /* ---- Smooth scroll with custom duration ---- */
  function smoothScrollTo(targetY, duration) {
    var startY = window.scrollY;
    var diff = targetY - startY;
    var startTime = null;

    function step(time) {
      if (!startTime) startTime = time;
      var progress = Math.min((time - startTime) / duration, 1);
      /* ease-in-out cubic */
      var ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      window.scrollTo(0, startY + diff * ease);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* Intercept all anchor links for slower smooth scroll */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var hash = link.getAttribute('href');
      if (hash === '#') return;
      var target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      var offset = window.innerWidth <= 700 ? 80 : 100;
      var targetY = target.getBoundingClientRect().top + window.scrollY - offset;
      smoothScrollTo(targetY, 1200); /* 1.2s duration */
      history.pushState(null, '', hash);
    });
  });

  /* ---- DOM References ---- */
  const nav        = document.getElementById('main-nav');
  const overlay    = document.getElementById('nav-overlay');
  const burgerBtn  = document.querySelector('.burger-btn');
  const lottieEl   = document.querySelector('.lottie-wrapper');
  const canvas     = document.getElementById('particle-canvas');
  const heroEl     = document.getElementById('hero');

  /* ============================================================
     1. PAGE LOAD ANIMATION – staggered fade-in
     ============================================================ */
  const animTargets = [
    document.querySelector('.nav-links'),
    document.querySelector('.hero-heading'),
    document.querySelector('.hero-buttons'),
    document.querySelector('#willkommen'),
  ];

  animTargets.forEach((el) => {
    if (el) el.classList.add('anim-fade-in');
  });

  window.addEventListener('load', () => {
    animTargets.forEach((el, i) => {
      if (!el) return;
      setTimeout(() => {
        el.classList.add('is-visible');
      }, i * 150);
    });
  });

  /* ============================================================
     2. LOTTIE INITIALIZATION
     ============================================================ */
  let particlesStarted = false;

  const lottieContainer = document.getElementById('lottie-container');

  if (typeof lottie === 'undefined') {
    console.error('[Lottie] Library not loaded – check CDN or network.');
  }

  if (lottieEl && lottieContainer && typeof lottie !== 'undefined') {
    const anim = lottie.loadAnimation({
      container: lottieContainer,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      path: 'assets/lottie/mainMohn.json',
    });

    // Target duration: 3.5s  →  speed = totalFrames / (fps * 3.5)
    anim.addEventListener('DOMLoaded', () => {
      const fps = anim.frameRate || 30;
      const totalFrames = anim.totalFrames || 105;
      const speed = totalFrames / (fps * 3.5);
      anim.setSpeed(speed);
    });

    anim.addEventListener('data_failed', () => {
      console.error('[Lottie] Failed to load mainMohn.json – likely a file:// CORS block or wrong path.');
    });

    /* Start particles 1s before lottie ends, fade in */
    anim.addEventListener('DOMLoaded', () => {
      const duration = ((anim.totalFrames || 105) / (anim.frameRate || 30)) * 1000;
      const earlyStart = Math.max(0, duration - 1000);
      setTimeout(() => {
        if (!particlesStarted) {
          particlesStarted = true;
          canvas.style.opacity = '0';
          canvas.style.transition = 'opacity 0.5s ease-in';
          startParticles();
          requestAnimationFrame(() => { canvas.style.opacity = '1'; });
        }
      }, earlyStart);
    });

    anim.addEventListener('complete', () => {
      if (!particlesStarted) {
        particlesStarted = true;
        canvas.style.opacity = '0';
        canvas.style.transition = 'opacity 0.5s ease-in';
        startParticles();
        requestAnimationFrame(() => { canvas.style.opacity = '1'; });
      }
    });
  }

  /* ============================================================
     3. PARTICLE SYSTEM
     ============================================================ */
  function startParticles() {
    if (!canvas || !lottieEl) return;

    const ctx = canvas.getContext('2d');
    const particles = [];
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const dprCap = isMobileDevice ? Math.min(window.devicePixelRatio || 1, 2) : (window.devicePixelRatio || 1);

    function initCanvas() {
      const rect = canvas.getBoundingClientRect();
      canvas.width  = rect.width  * dprCap;
      canvas.height = rect.height * dprCap;
      ctx.setTransform(dprCap, 0, 0, dprCap, 0, 0);
    }
    initCanvas();

    const W = canvas.getBoundingClientRect().width;
    const H = canvas.getBoundingClientRect().height;
    const COLOR = '#20726d';
    const MAX = isMobileDevice ? 40 : 70;

    function createParticle() {
      /* Spawn near center, drift upward with slight horizontal spread */
      const angle = Math.random() * Math.PI * 2;
      const startDist = Math.random() * 15;
      const speed = 0.08 + Math.random() * 0.15;
      /* Bias direction upward: angle between -120° and -60° (upper half) */
      const dirAngle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 0.7;
      return {
        x:  W * 0.5 + Math.cos(angle) * startDist,
        y:  H * 0.5 + Math.sin(angle) * startDist,
        vx: Math.cos(dirAngle) * speed * 0.6, /* less horizontal */
        vy: Math.sin(dirAngle) * speed,        /* strong upward */
        r:  0.5 + Math.random() * 0.5, /* 1–2px diameter */
        life: 0,
        maxLife: 600 + Math.floor(Math.random() * 400),
      };
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);

      while (particles.length < MAX) {
        particles.push(createParticle());
      }

      ctx.fillStyle = COLOR;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        const fadeStart = p.maxLife * 0.75;
        const alpha = p.life < fadeStart ? 1 : 1 - (p.life - fadeStart) / (p.maxLife - fadeStart);

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(Math.round(p.x), Math.round(p.y), p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  /* ============================================================
     4. NAV SCROLL – immediate trigger on first scroll pixel
     ============================================================ */
  if (nav) {
    const updateNavScrolled = () => {
      nav.classList.toggle('main-nav--scrolled', window.scrollY > 0);
    };
    window.addEventListener('scroll', updateNavScrolled, { passive: true });
    updateNavScrolled(); // apply on load (in case page was already scrolled)
  }

  /* ============================================================
     4b. SCROLL SPY – highlight active nav button
     ============================================================ */
  const navBtns = document.querySelectorAll('.nav-links .nav-btn');
  const spySections = [
    { id: 'behandlung', btn: null },
    { id: 'ablauf',     btn: null },
    { id: 'ueber-mich', btn: null },
    { id: 'kosten',     btn: null },
    { id: 'kontakt',    btn: null },
  ];

  /* Map each section id to its nav button */
  spySections.forEach(function (s) {
    navBtns.forEach(function (btn) {
      if (btn.getAttribute('href') === '#' + s.id) s.btn = btn;
    });
  });

  function updateScrollSpy() {
    var scrollY = window.scrollY + 150; /* offset for fixed nav */
    var activeId = null;

    spySections.forEach(function (s) {
      var el = document.getElementById(s.id);
      if (!el) return;
      var top = el.offsetTop;
      var bottom = top + el.offsetHeight;
      if (scrollY >= top && scrollY < bottom) {
        activeId = s.id;
      }
    });

    spySections.forEach(function (s) {
      if (s.btn) {
        s.btn.classList.toggle('is-current', s.id === activeId);
      }
    });
  }

  window.addEventListener('scroll', updateScrollSpy, { passive: true });
  updateScrollSpy();

  /* ============================================================
     5 + 7. BURGER MENU TOGGLE + OVERLAY ANIMATIONS
     ============================================================ */
  function openNavOverlay() {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    burgerBtn.setAttribute('aria-expanded', 'true');
    burgerBtn.setAttribute('aria-label', 'Menü schließen');

    const items = overlay.querySelectorAll('.burger-nav-btn');
    items.forEach((item, i) => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(50px)';
      item.style.transition = 'none';

      // Force reflow
      item.offsetHeight; // eslint-disable-line no-unused-expressions

      item.style.transition = `opacity 0.3s ease-out ${i * 60}ms, transform 0.3s ease-out ${i * 60}ms`;

      requestAnimationFrame(() => {
        item.style.opacity = '1';
        item.style.transform = 'translateX(0)';
      });
    });
  }

  function closeNavOverlay() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    burgerBtn.setAttribute('aria-expanded', 'false');
    burgerBtn.setAttribute('aria-label', 'Menü öffnen');

    // Reset menu items for next open (after fade-out)
    setTimeout(() => {
      const items = overlay.querySelectorAll('.burger-nav-btn');
      items.forEach((item) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(50px)';
        item.style.transition = 'none';
      });
    }, 300);
  }

  if (burgerBtn && overlay) {
    burgerBtn.addEventListener('click', () => {
      const isOpen = burgerBtn.classList.toggle('burger--active');
      if (isOpen) {
        burgerBtn.classList.add('was-active');
        openNavOverlay();
      } else {
        closeNavOverlay();
      }
    });

    // Close overlay when a nav link is clicked
    overlay.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        burgerBtn.classList.remove('burger--active');
        closeNavOverlay();
      });
    });
  }

  /* ============================================================
     8. RESIZE HANDLER – close burger at ≥900px
     ============================================================ */
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1100) {
      if (burgerBtn && burgerBtn.classList.contains('burger--active')) {
        burgerBtn.classList.remove('burger--active');
        // Immediately hide overlay without animation
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        burgerBtn.setAttribute('aria-expanded', 'false');
        burgerBtn.setAttribute('aria-label', 'Menü öffnen');
      }
    }
  });

})();
