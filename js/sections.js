/* ============================================================
   SECTIONS.JS – About Lottie + Particles
   ============================================================ */

(function () {
  'use strict';

  var isMobile = function () { return window.innerWidth <= 700; };

  /* ============================================================
     ABLAUF CARDS – stagger slide-in from bottom
     ============================================================ */
  var ablaufCards = document.querySelectorAll('.ablauf-card');
  if (ablaufCards.length && 'IntersectionObserver' in window) {
    if (isMobile()) {
      /* Mobile: each card animates individually when it enters viewport */
      var cardObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            cardObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });

      ablaufCards.forEach(function (card) { cardObserver.observe(card); });
    } else {
      /* Desktop: stagger all 3 cards together */
      var ablaufObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var cards = entry.target.querySelectorAll('.ablauf-card');
            cards.forEach(function (card, i) {
              setTimeout(function () {
                card.classList.add('is-visible');
              }, i * 200);
            });
            ablaufObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });

      var ablaufSection = document.getElementById('ablauf');
      if (ablaufSection) ablaufObserver.observe(ablaufSection);
    }
  }

  /* ============================================================
     ABOUT LOTTIE
     ============================================================ */
  var lottieEl = document.getElementById('about-lottie');
  var particleCanvas = document.getElementById('about-particles');

  if (!lottieEl || typeof lottie === 'undefined') return;

  var currentMobile = isMobile();
  var anim = lottie.loadAnimation({
    container: lottieEl,
    renderer: 'svg',
    loop: true,
    autoplay: false,
    path: currentMobile
      ? 'assets/lottie/flower_about_mobile.json'
      : 'assets/lottie/flower_about_desktop.json',
  });

  /* Swap lottie when crossing the mobile/desktop breakpoint */
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var nowMobile = isMobile();
      if (nowMobile !== currentMobile) {
        currentMobile = nowMobile;
        anim.destroy();
        anim = lottie.loadAnimation({
          container: lottieEl,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: currentMobile
            ? 'assets/lottie/flower_about_mobile.json'
            : 'assets/lottie/flower_about_desktop.json',
        });
      }
    }, 0);
  });

  /* Play when section enters viewport */
  var aboutSection = document.getElementById('ueber-mich');
  var hasStarted = false;

  if ('IntersectionObserver' in window && aboutSection) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !hasStarted) {
          hasStarted = true;
          anim.play();
          startAboutParticles();
        }
      });
    }, { threshold: 0.15 });
    observer.observe(aboutSection);
  } else {
    anim.play();
    startAboutParticles();
  }

  /* ============================================================
     PARTICLE SYSTEM (same as hero, spawns from lottie edge)
     Desktop: right border, vertical center
     Mobile: bottom border, horizontal center
     ============================================================ */
  function startAboutParticles() {
    if (!particleCanvas) return;

    var wrapper = particleCanvas.parentElement;
    var ctx = particleCanvas.getContext('2d');
    var particles = [];
    var COLOR = '#20726d';
    var isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    var MAX = isMobileDevice ? 40 : 90;

    var dprCap = isMobileDevice ? Math.min(window.devicePixelRatio || 1, 2) : (window.devicePixelRatio || 1);
    var rect = particleCanvas.getBoundingClientRect();
    var W = rect.width;
    var H = rect.height;
    particleCanvas.width  = W * dprCap;
    particleCanvas.height = H * dprCap;
    ctx.setTransform(dprCap, 0, 0, dprCap, 0, 0);

    function createParticle() {
      var angle = Math.random() * Math.PI * 2;
      var startDist = Math.random() * 15;
      var speed = 0.08 + Math.random() * 0.15;
      return {
        x: W * 0.5 + Math.cos(angle) * startDist,
        y: H * 0.5 + Math.sin(angle) * startDist,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 0.5 + Math.random() * 0.5,
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
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        var fadeStart = p.maxLife * 0.8;
        var alpha = p.life < fadeStart ? 1 : 1 - (p.life - fadeStart) / (p.maxLife - fadeStart);

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
     KONTAKT FORM SPAM PROTECTION
     ============================================================ */
  var kontaktForm = document.getElementById('kontakt-form');
  var formLoadTime = Date.now();

  if (kontaktForm) {
    kontaktForm.addEventListener('submit', function (e) {
      /* Honeypot check: if filled, it's a bot */
      var honeypot = kontaktForm.querySelector('input[name="website"]');
      if (honeypot && honeypot.value !== '') {
        e.preventDefault();
        return;
      }

      /* Time check: reject if submitted in under 3 seconds */
      if (Date.now() - formLoadTime < 3000) {
        e.preventDefault();
        return;
      }
    });
  }

  /* ============================================================
     KONTAKT SELECT BUTTONS
     ============================================================ */
  var selectBtns = document.querySelectorAll('.select-btn');
  selectBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectBtns.forEach(function (b) { b.classList.remove('is-selected'); });
      btn.classList.add('is-selected');
    });
  });

  /* ============================================================
     KONTAKT TEXTFIELD FILLED STATE
     ============================================================ */
  var fields = document.querySelectorAll('.kontakt__input, .kontakt__textarea');
  fields.forEach(function (field) {
    function check() {
      var filled = field.value.trim() !== '';
      field.classList.toggle('is-filled', filled);
      var parent = field.closest('.kontakt__field');
      if (parent) parent.classList.toggle('is-filled', filled);
    }
    /* Only apply filled state when leaving the field */
    field.addEventListener('blur', check);
  });

})();
