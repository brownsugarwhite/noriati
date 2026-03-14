/* ============================================================
   SLIDER.JS – Behandlungsangebot Slider
   ============================================================ */

(function () {
  'use strict';

  /* ---- Data ---- */
  const CARDS = [
    { lottie: 'assets/lottie/01_depressionen.json',    titleHtml: 'Depression &amp;<br>depressive Verstimmung' },
    { lottie: 'assets/lottie/02_angststörung.json',    titleHtml: 'Angstst&ouml;rungen' },
    { lottie: 'assets/lottie/03_stress.json',           titleHtml: 'Stress &amp; &Uuml;berbelastung' },
    { lottie: 'assets/lottie/04_lebenskrise.json',      titleHtml: 'Lebenskrisen &amp; belastenden<br>Lebenssituationen' },
    { lottie: 'assets/lottie/05_selbstbild.json',       titleHtml: 'Selbstwertproblemen<br>&amp; inneren Konflikten' },
    { lottie: 'assets/lottie/06_beruflicherStress.json',titleHtml: 'Berufliche Belastung' },
    { lottie: 'assets/lottie/07_psychsomatic.json',     titleHtml: 'Psychosomatische<br>Beschwerden' },
  ];

  const SPARK_SVG = '<svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 0L4.7 3.3L8 4L4.7 4.7L4 8L3.3 4.7L0 4L3.3 3.3L4 0Z" fill="#20726d"/></svg>';

  /* Grass strokes – generated per card: 4–7 mostly-straight lines
     with slight random rotation, spread across full card width */
  function makeGrasSvg(count, cardW, padLeft, padRight) {
    padLeft  = padLeft  || 6;
    padRight = padRight || 6;
    var h = 21; /* 1px extra so strokes overlap the gras line below */
    var usableW = cardW - padLeft - padRight;
    var paths = '';
    for (var j = 0; j < count; j++) {
      var x   = Math.round(padLeft + Math.random() * usableW);
      var len = 8 + Math.round(Math.random() * 14);            /* 8–22px */
      var rot = Math.round((Math.random() - 0.5) * 30);        /* –15° to +15° */
      var sw  = (0.5 + Math.random() * 0.3).toFixed(1);        /* 0.5–0.8 */
      paths += '<line x1="'+x+'" y1="'+h+'" x2="'+x+'" y2="'+(h-len)+'"'
            +  ' stroke="#20726d" stroke-width="'+sw+'" stroke-linecap="round"'
            +  ' transform="rotate('+rot+' '+x+' '+h+')"/>';
    }
    return '<svg viewBox="0 0 '+cardW+' '+h+'" fill="none" xmlns="http://www.w3.org/2000/svg">' + paths + '</svg>';
  }

  /* ---- DOM ---- */
  const frame        = document.getElementById('behandlung-slider-frame');
  const track        = document.getElementById('slider-track');
  const prevBtn      = document.getElementById('slider-prev');
  const nextBtn      = document.getElementById('slider-next');
  const dotsEl       = document.getElementById('slider-dots');
  const section      = document.getElementById('behandlung');

  if (!frame || !track) return;

  /* ---- State ---- */
  let currentIndex      = 0;
  let currentTranslate  = 0;
  let animations        = [];
  let hasPlayed         = new Array(CARDS.length).fill(false);
  let autoSlideTimer    = null;
  let slideStartTime    = 0;
  let elapsedOnPause    = 0;
  let isHovered         = false;
  let sectionEntered    = false;

  /* ============================================================
     1. BUILD CARDS
     ============================================================ */
  CARDS.forEach((data, i) => {
    const card = document.createElement('div');
    card.className = 'slider-card';
    card.dataset.index = i;

    const lottieWrapper = document.createElement('div');
    lottieWrapper.className = 'slider-card__lottie-wrapper';

    const lottieEl = document.createElement('div');
    lottieEl.className = 'slider-card__lottie';
    lottieEl.id = 'slider-lottie-' + i;

    /* Grass strokes at the bottom of each lottie container.
       First and last cards get extra padding to avoid the dashed gras-line edges. */
    var cardW = window.innerWidth <= 700 ? 164 : 250;
    var grasCount = 4 + Math.floor(Math.random() * 4); /* 4–7 strokes */
    var pL = (i === 0) ? 50 : 6;                       /* keep clear of left dashes */
    var pR = (i === CARDS.length - 1) ? 50 : 6;        /* keep clear of right dashes */
    const gras = document.createElement('div');
    gras.className = 'slider-card__gras';
    gras.setAttribute('aria-hidden', 'true');
    gras.innerHTML = makeGrasSvg(grasCount, cardW, pL, pR);

    lottieWrapper.appendChild(lottieEl);
    lottieWrapper.appendChild(gras);
    card.appendChild(lottieWrapper);

    const textWrapper = document.createElement('div');
    textWrapper.className = 'slider-card__text';

    const title = document.createElement('p');
    title.className = 'slider-card__title';
    title.innerHTML = data.titleHtml;
    textWrapper.appendChild(title);
    card.appendChild(textWrapper);

    track.appendChild(card);

    /* Spark between cards (not after last) */
    if (i < CARDS.length - 1) {
      const sw = document.createElement('div');
      sw.className = 'slider-spark-wrapper';
      sw.setAttribute('aria-hidden', 'true');
      sw.innerHTML = '<span class="spark">' + SPARK_SVG + '</span>';
      track.appendChild(sw);
    }

    /* Load lottie (no autoplay) */
    if (typeof lottie !== 'undefined') {
      const anim = lottie.loadAnimation({
        container: lottieEl,
        renderer:  'svg',
        loop:      false,
        autoplay:  false,
        path:      data.lottie,
      });
      animations[i] = anim;
    }
  });

  /* Gras line – tapered dash pattern: small-medium-big-full-big-medium-small */
  var grasLine = document.createElement('div');
  grasLine.className = 'slider-gras-line';
  grasLine.setAttribute('aria-hidden', 'true');
  ['small','medium','big','full','big','medium','small'].forEach(function(size) {
    var seg = document.createElement('div');
    seg.className = 'slider-gras-line__segment slider-gras-line__segment--' + size;
    grasLine.appendChild(seg);
  });
  track.appendChild(grasLine); /* inside track so it moves with the slider */

  /* Size gras line: start at first card, end at last card */
  function sizeGrasLine() {
    var cards = track.querySelectorAll('.slider-card');
    var firstCard = cards[0];
    var lastCard  = cards[CARDS.length - 1];
    if (firstCard && lastCard) {
      grasLine.style.left  = firstCard.offsetLeft + 'px';
      grasLine.style.width = (lastCard.offsetLeft + lastCard.offsetWidth - firstCard.offsetLeft) + 'px';
    }
  }
  sizeGrasLine();

  /* ============================================================
     2. BUILD DOTS
     ============================================================ */
  if (dotsEl) {
    CARDS.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'slider-dot';
      dot.setAttribute('aria-label', 'Folie ' + (i + 1));
      dot.dataset.dotIndex = i;
      dot.addEventListener('click', () => {
        goToIndex(i);
        resetAutoSlide();
      });
      dotsEl.appendChild(dot);
    });
  }

  /* ============================================================
     3. STEP SIZE + MOBILE CENTERING
     Desktop: partial steps so card 0 aligns left, card 6 aligns right.
     Mobile:  full slot width (card moves 100% to previous position).
              First card is centered; padding-left set dynamically.
     ============================================================ */
  var isMobile = function() { return window.innerWidth <= 700; };

  function setupTrackPadding() {
    if (isMobile()) {
      var cardW = track.querySelector('.slider-card') ? track.querySelector('.slider-card').offsetWidth : 164;
      track.style.paddingLeft = Math.round((window.innerWidth - cardW) / 2) + 'px';
    } else {
      track.style.paddingLeft = '';
    }
  }

  function calcStepSize() {
    var cards = track.querySelectorAll('.slider-card');
    if (cards.length < 2) return 143;
    var actualSlotWidth = cards[1].offsetLeft - cards[0].offsetLeft;

    if (isMobile()) {
      /* Mobile: move exactly one full slot per step */
      return actualSlotWidth;
    }

    /* Desktop: distribute steps so first card left-aligns, last card right-aligns */
    var frameW  = frame.offsetWidth;
    var pad     = 23;
    var cardW   = cards[0].offsetWidth;
    var card0L  = cards[0].offsetLeft;
    var n       = CARDS.length - 1;
    var rightTarget = frameW - pad - cardW;
    var totalRange  = card0L + n * actualSlotWidth - rightTarget;
    return totalRange / n;
  }

  /* ============================================================
     4. TRANSLATE
     ============================================================ */
  function applyTranslate(x, animated) {
    if (!animated) {
      /* Suppress transition for instant repositioning */
      track.style.transition = 'none';
      track.offsetHeight; /* force reflow */
    } else {
      track.style.transition = '';
    }
    track.style.transform = 'translateX(' + x + 'px)';
    currentTranslate = x;
  }

  /* ============================================================
     5. LOTTIE PLAYBACK
     ============================================================ */
  function playLottie(i) {
    if (hasPlayed[i]) return; /* play only once */
    const anim = animations[i];
    if (!anim) return;
    hasPlayed[i] = true;
    const fps         = anim.frameRate   || 30;
    const total       = anim.totalFrames || 90;
    const speed       = total / (fps * 4); /* 4-second duration */
    anim.setSpeed(speed);
    anim.goToAndPlay(0, true);
  }

  /* Card indices FULLY visible in the actual browser viewport */
  function getFullyVisibleIndices() {
    var vpW   = window.innerWidth;
    var cards = track.querySelectorAll('.slider-card');
    var visible = [];
    cards.forEach(function(card, i) {
      var rect = card.getBoundingClientRect();
      if (rect.left >= -1 && rect.right <= vpW + 1) visible.push(i);
    });
    return visible;
  }

  /* Check and play any fully-visible cards that haven't played yet */
  function checkAndPlayVisible() {
    var visible = getFullyVisibleIndices();
    visible.forEach(function(i) { playLottie(i); });
  }

  /* ============================================================
     6. PAGINATION
     ============================================================ */
  var lineLeft  = document.getElementById('slider-line-left');
  var lineRight = document.getElementById('slider-line-right');

  function updatePagination(index) {
    if (dotsEl) {
      const dots = dotsEl.querySelectorAll('.slider-dot');
      dots.forEach((dot, i) => {
        dot.classList.remove('slider-dot--active', 'is-paused');
        if (i === index) {
          void dot.offsetWidth;
          dot.classList.add('slider-dot--active');
        }
      });
    }
    if (prevBtn) prevBtn.disabled = (index === 0);
    if (nextBtn) nextBtn.disabled = (index === CARDS.length - 1);

    /* Grey out line adjacent to disabled arrow */
    if (lineLeft)  lineLeft.classList.toggle('slider-pagination__line--disabled', index === 0);
    if (lineRight) lineRight.classList.toggle('slider-pagination__line--disabled', index === CARDS.length - 1);
  }

  function getActiveDot() {
    return dotsEl ? dotsEl.querySelector('.slider-dot--active') : null;
  }

  /* ============================================================
     7. GO TO INDEX
     ============================================================ */
  function goToIndex(index, animated) {
    if (animated === undefined) animated = true;

    currentIndex = Math.max(0, Math.min(index, CARDS.length - 1));
    const step   = calcStepSize();
    const target = -currentIndex * step;

    applyTranslate(target, animated);
    updatePagination(currentIndex);

    /* After transition settles, check for fully-visible cards */
    var delay = animated ? 550 : 0;
    setTimeout(checkAndPlayVisible, delay);
  }

  /* ============================================================
     8. AUTO SLIDE
     ============================================================ */
  function startAutoSlide(remaining) {
    if (remaining === undefined) remaining = 5000;
    if (autoSlideTimer) clearTimeout(autoSlideTimer);
    slideStartTime = Date.now();
    autoSlideTimer = setTimeout(() => {
      if (!isHovered && currentIndex < CARDS.length - 1) {
        goToIndex(currentIndex + 1);
      }
      /* Only continue auto-slide if not at the last card */
      if (currentIndex < CARDS.length - 1) {
        startAutoSlide(5000);
      }
    }, remaining);
  }

  function stopAutoSlide() {
    elapsedOnPause = Date.now() - slideStartTime;
    if (autoSlideTimer) clearTimeout(autoSlideTimer);
    autoSlideTimer = null;
  }

  function resetAutoSlide() {
    startAutoSlide(5000);
  }

  /* ============================================================
     9. HOVER PAUSE
     ============================================================ */
  frame.addEventListener('mouseenter', () => {
    isHovered = true;
    stopAutoSlide();
    const dot = getActiveDot();
    if (dot) dot.classList.add('is-paused');
  });

  frame.addEventListener('mouseleave', () => {
    isHovered = false;
    const dot = getActiveDot();
    if (dot) dot.classList.remove('is-paused');
    /* Resume timer with remaining time */
    const remaining = Math.max(0, 5000 - elapsedOnPause);
    startAutoSlide(remaining);
  });

  /* ============================================================
     10. PREV / NEXT BUTTONS
     ============================================================ */
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      goToIndex(currentIndex - 1);
      resetAutoSlide();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goToIndex(currentIndex + 1);
      resetAutoSlide();
    });
  }

  /* ============================================================
     11. TOUCH / MOUSE DRAG (momentum + snap)
     ============================================================ */
  let isDragging       = false;
  let dragStartX       = 0;
  let dragStartTranslate = 0;
  let dragLastX        = 0;
  let dragLastTime     = 0;
  let dragVelocity     = 0;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function getMinTranslate() {
    return -(CARDS.length - 1) * calcStepSize();
  }

  function onDragStart(clientX) {
    isDragging = true;
    dragStartX = clientX;
    dragStartTranslate = currentTranslate;
    dragLastX = clientX;
    dragLastTime = Date.now();
    dragVelocity = 0;
    track.style.transition = 'none';
    stopAutoSlide();
  }

  function onDragMove(clientX) {
    if (!isDragging) return;
    const dx  = clientX - dragStartX;
    const now = Date.now();
    const dt  = now - dragLastTime;
    if (dt > 0) dragVelocity = (clientX - dragLastX) / dt;
    dragLastX = clientX;
    dragLastTime = now;

    var rawX = dragStartTranslate + dx;
    var minT = getMinTranslate();
    var newX;

    /* Rubber-band resistance at edges (Apple-style overscroll) */
    if (rawX > 0) {
      newX = rawX * 0.3; /* resist past start */
    } else if (rawX < minT) {
      newX = minT + (rawX - minT) * 0.3; /* resist past end */
    } else {
      newX = rawX;
    }

    track.style.transform = 'translateX(' + newX + 'px)';
    currentTranslate = newX;

    /* Play lotties that become fully visible while dragging */
    checkAndPlayVisible();
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;

    /* Apple-like momentum: coast with deceleration, then snap */
    var velocity  = dragVelocity * 1000; /* px/s */
    var absV      = Math.abs(velocity);
    var step      = calcStepSize();

    if (absV > 200) {
      /* Strong flick: animate momentum with cubic-bezier deceleration */
      var momentum   = velocity * 0.35;  /* distance to coast */
      var coastTarget = clamp(currentTranslate + momentum, getMinTranslate(), 0);
      var coastIndex  = Math.round(-coastTarget / step);
      coastIndex      = clamp(coastIndex, 0, CARDS.length - 1);
      var finalX      = -coastIndex * step;

      /* Use a custom deceleration curve */
      track.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      track.style.transform  = 'translateX(' + finalX + 'px)';
      currentTranslate = finalX;
      currentIndex = coastIndex;
      updatePagination(coastIndex);
      setTimeout(checkAndPlayVisible, 650);
    } else {
      /* Gentle release: snap to nearest card with standard ease */
      track.style.transition = '';
      var nearestIndex = Math.round(-currentTranslate / step);
      goToIndex(clamp(nearestIndex, 0, CARDS.length - 1));
    }

    startAutoSlide(5000);
  }

  /* Touch */
  track.addEventListener('touchstart', (e) => {
    onDragStart(e.touches[0].clientX);
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    onDragMove(e.touches[0].clientX);
  }, { passive: true });

  document.addEventListener('touchend', onDragEnd);

  /* Mouse */
  track.addEventListener('mousedown', (e) => {
    e.preventDefault();
    onDragStart(e.clientX);
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    onDragMove(e.clientX);
  });

  document.addEventListener('mouseup', onDragEnd);

  /* ============================================================
     12. INTERSECTION OBSERVER – section enters from below
     ============================================================ */
  if ('IntersectionObserver' in window && section) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!sectionEntered) {
            sectionEntered = true;
            checkAndPlayVisible();
          }
          /* Resume auto-slide when in viewport */
          startAutoSlide(5000);
        } else {
          /* Pause auto-slide when out of viewport */
          stopAutoSlide();
        }
      });
    }, { threshold: 0.05 });

    observer.observe(section);
  } else {
    startAutoSlide(5000);
  }

  /* ============================================================
     13. RESIZE – recalculate translate
     ============================================================ */
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      setupTrackPadding();
      applyTranslate(-currentIndex * calcStepSize(), false);
      positionFades();
      sizeGrasLine();
    }, 100);
  });

  /* ============================================================
     14. POSITION FADES – at viewport edges, aligned to card text area
     ============================================================ */
  const fadeLeft  = section ? section.querySelector('.slider-fade--left')  : null;
  const fadeRight = section ? section.querySelector('.slider-fade--right') : null;

  function positionFades() {
    if (!fadeLeft || !fadeRight || !section) return;
    var firstText = track.querySelector('.slider-card__text');
    if (!firstText) return;
    var sectionRect = section.getBoundingClientRect();
    var textRect    = firstText.getBoundingClientRect();
    var top    = textRect.top - sectionRect.top;
    var height = textRect.height;
    fadeLeft.style.top    = top + 'px';
    fadeLeft.style.height = height + 'px';
    fadeRight.style.top    = top + 'px';
    fadeRight.style.height = height + 'px';
  }

  /* ============================================================
     15. INIT
     ============================================================ */
  setupTrackPadding();
  updatePagination(0);
  applyTranslate(0, false);
  positionFades();
  sizeGrasLine();

})();
