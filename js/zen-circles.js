/* ============================================================
   ZEN-CIRCLES.JS – Water ripple circles
   Like throwing a stone into still water.
   ============================================================ */

(function () {
  'use strict';

  var canvas = document.createElement('canvas');
  canvas.id = 'zen-canvas';
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  var dpr = isMobileDevice ? Math.min(window.devicePixelRatio || 1, 2) : (window.devicePixelRatio || 1);
  var W, H;
  var circles = [];
  var MAX = isMobileDevice ? 6 : 10;
  var INTERVAL = isMobileDevice ? 5000 : 4000;
  var lastSpawn = 0;
  var started = false;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function spawn() {
    /* Each "stone drop" creates 3 concentric rings with staggered delays */
    var x = Math.random() * W;
    var y = Math.random() * H;
    var maxR = 120 + Math.random() * 280;

    for (var ring = 0; ring < 3; ring++) {
      circles.push({
        x: x,
        y: y,
        r: 0,
        maxR: maxR * (0.5 + ring * 0.25), /* inner ring smaller, outer bigger */
        delay: ring * 120, /* stagger: 0, 120, 240 frames delay */
        age: 0,
        speed: 0.08 + Math.random() * 0.04, /* very slow expansion */
      });
    }
  }

  function tick(t) {
    if (!started) {
      lastSpawn = t;
      started = true;
    }

    ctx.clearRect(0, 0, W, H);

    if (t - lastSpawn > INTERVAL && circles.length < MAX * 3) {
      spawn();
      lastSpawn = t;
    }

    for (var i = circles.length - 1; i >= 0; i--) {
      var c = circles[i];
      c.age++;

      /* Wait for delay before expanding */
      if (c.age < c.delay) continue;

      /* Expand: starts fast, decelerates (like real water) */
      var progress = c.r / c.maxR;
      var decel = 1 - progress * 0.7; /* slows down as it grows */
      c.r += c.speed * decel;

      /* Opacity: brand-grey-alpha50 → transparent */
      var opacity = (1 - progress) * (1 - progress); /* quadratic fade */

      if (c.r >= c.maxR) {
        circles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      /* rgba(204,225,218, 0.5) = brand-grey-alpha50, fading to 0 */
      ctx.strokeStyle = 'rgba(204,225,218,' + (opacity * 0.5) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    requestAnimationFrame(tick);
  }

  /* Start with a few ripples already in progress */
  for (var i = 0; i < 4; i++) {
    var x = Math.random() * window.innerWidth;
    var y = Math.random() * window.innerHeight;
    var maxR = 120 + Math.random() * 280;
    var startProgress = Math.random() * 0.4;
    for (var ring = 0; ring < 3; ring++) {
      circles.push({
        x: x,
        y: y,
        r: maxR * (0.5 + ring * 0.25) * startProgress,
        maxR: maxR * (0.5 + ring * 0.25),
        delay: 0,
        age: 999,
        speed: 0.08 + Math.random() * 0.04,
      });
    }
  }

  requestAnimationFrame(tick);
})();
