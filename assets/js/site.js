/* Manasa Sama — portfolio interactions.
   Progressive enhancement: the page is complete without this file. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var isHome = document.body.classList.contains('page-home');
  var vh = window.innerHeight;
  var vw = window.innerWidth;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  if (!reduce) root.classList.add('motion');

  /* ---------- Curtain: reveal on load, cover on leave ---------- */
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('loaded'); }); });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { root.classList.remove('leaving'); root.classList.add('loaded'); }
  });

  /* ---------- Smooth scroll (optional; native scroll if Lenis is unavailable) ---------- */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  }
  function scrollToTarget(el) {
    if (lenis) lenis.scrollTo(el, { offset: -80 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) {
      var target = document.querySelector(url.hash);
      if (target) { e.preventDefault(); closeMenu(); scrollToTarget(target); history.pushState(null, '', url.hash); }
      return;
    }
    if (url.pathname === location.pathname) return;
    if (/\.(pdf|mp4|jpg|png)$/i.test(url.pathname)) return;
    e.preventDefault();
    closeMenu();
    root.classList.add('leaving');
    setTimeout(function () { location.href = url.href; }, reduce ? 0 : 620);
  });

  /* ---------- Menu ---------- */
  var menu = document.querySelector('.menu');
  var menuBtn = document.querySelector('.menu-toggle');
  function closeMenu() {
    if (!menu || !menu.classList.contains('open')) return;
    menu.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.textContent = 'Menu';
    if (lenis) lenis.start();
  }
  if (menu && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? 'Close' : 'Menu';
      if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- Background video ---------- */
  var VIDEO_SPEED = 0.5; // 1 = original speed
  var videos = Array.prototype.slice.call(document.querySelectorAll('.bg video'));
  var mainVideo = document.querySelector('.bg .bg-main');
  var fillVideo = document.querySelector('.bg .bg-fill');
  var toggle = document.querySelector('.motion-toggle');
  var videoOn = true;
  function visible(v) { return getComputedStyle(v).display !== 'none'; }
  function setVideo(play) {
    videoOn = play;
    videos.forEach(function (v) {
      v.defaultPlaybackRate = v.playbackRate = VIDEO_SPEED;
      if (play && visible(v)) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
    });
    if (toggle) {
      toggle.setAttribute('aria-pressed', String(!play));
      toggle.querySelector('.label').textContent = play ? 'Pause video' : 'Play video';
      toggle.querySelector('.icon').innerHTML = play
        ? '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1" width="3" height="10" fill="currentColor"/><rect x="7" y="1" width="3" height="10" fill="currentColor"/></svg>'
        : '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg>';
    }
  }
  if (videos.length) {
    var pref = store('ms-video');
    setVideo(pref ? pref === 'on' : !reduce);
    videos.forEach(function (v) {
      v.addEventListener('loadedmetadata', function () { v.defaultPlaybackRate = v.playbackRate = VIDEO_SPEED; });
    });
    // Keep the blurred side fill in step with the sharp centre clip.
    if (mainVideo && fillVideo) mainVideo.addEventListener('timeupdate', function () {
      if (visible(mainVideo) && Math.abs(fillVideo.currentTime - mainVideo.currentTime) > .25) fillVideo.currentTime = mainVideo.currentTime;
    });
    if (toggle) toggle.addEventListener('click', function () {
      setVideo(!videoOn);
      store('ms-video', videoOn ? 'on' : 'off');
    });
  }

  /* ---------- Reveals ---------- */
  var revealTargets = document.querySelectorAll('[data-reveal], .split');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Count-up numbers ---------- */
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var end = parseFloat(el.getAttribute('data-count'));
    var decimals = (el.getAttribute('data-count').split('.')[1] || '').length;
    var suffix = el.getAttribute('data-suffix') || '';
    var fmt = function (v) { return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix; };
    if (reduce || !('IntersectionObserver' in window)) { el.textContent = fmt(end); return; }
    el.textContent = fmt(0);
    var obs = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      var start = performance.now();
      (function tick(now) {
        var t = clamp((now - start) / 1600, 0, 1);
        el.textContent = fmt(end * (1 - Math.pow(1 - t, 4)));
        if (t < 1) requestAnimationFrame(tick);
      })(start);
    }, { threshold: .6 });
    obs.observe(el);
  });

  /* ---------- Scroll-scrubbed word highlighting ---------- */
  var scrubs = [];
  document.querySelectorAll('.scrub-words').forEach(function (el) {
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
    scrubs.push({ el: el, words: el.querySelectorAll('.w'), lit: -1 });
  });

  /* ---------- Marquees ---------- */
  var marquees = [];
  document.querySelectorAll('.marquee').forEach(function (row) {
    row.innerHTML += row.innerHTML;
    marquees.push({ el: row, dir: parseFloat(row.getAttribute('data-dir') || '1'), half: 0 });
  });
  function measureMarquees() { marquees.forEach(function (m) { m.half = m.el.scrollWidth / 2; }); }

  /* ---------- Horizontal work track ---------- */
  var pin = document.querySelector('.work-pin');
  var track = pin && pin.querySelector('.work-track');
  var counterNow = pin && pin.querySelector('.work-counter .now');
  var counterBar = pin && pin.querySelector('.work-counter');
  var cards = track ? track.querySelectorAll('.project') : [];
  var workDist = 0;
  var wideMq = window.matchMedia('(min-width: 1024px) and (min-height: 620px)');
  function layoutWork() {
    if (!pin) return;
    var enable = !reduce && wideMq.matches;
    root.classList.toggle('hscroll', enable);
    if (enable) {
      workDist = Math.max(0, track.scrollWidth - vw);
      pin.style.height = (workDist + vh) + 'px';
    } else {
      pin.style.height = '';
      track.style.transform = '';
    }
  }

  /* ---------- Frame loop: everything scroll- or pointer-driven ---------- */
  var nav = document.querySelector('.nav-wrap');
  var heroInner = document.querySelector('.hero-inner');
  var heroMeta = document.querySelector('.hero-meta');
  var fills = document.querySelectorAll('[data-fill]');
  var lastY = -1;
  var lastDir = 0;
  var mouse = { x: vw / 2, y: vh / 2 };
  var spot = { x: vw / 2, y: vh * .42 };

  function progressOf(el, startAt, endAt) {
    var r = el.getBoundingClientRect();
    return clamp((vh * startAt - r.top) / (r.height + vh * (startAt - endAt)), 0, 1);
  }

  function onScroll(y) {
    var max = document.documentElement.scrollHeight - vh;
    root.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);

    if (nav) {
      nav.classList.toggle('scrolled', y > 40);
      var dir = y > lastY ? 1 : -1;
      if (dir !== lastDir || y < 200) nav.classList.toggle('hidden', dir === 1 && y > 500 && !(menu && menu.classList.contains('open')));
      lastDir = dir;
    }

    if (!reduce) {
      var h = clamp(y / vh, 0, 1);
      if (isHome) {
        root.style.setProperty('--shade', (.3 + h * .46).toFixed(3));
        root.style.setProperty('--bg-scale', (1.14 - h * .08).toFixed(4));
        if (heroInner) {
          heroInner.style.transform = 'translate3d(0,' + (y * .32).toFixed(1) + 'px,0)';
          heroInner.style.opacity = clamp(1 - y / (vh * .75), 0, 1).toFixed(3);
          heroInner.style.filter = h > .02 ? 'blur(' + (h * 6).toFixed(2) + 'px)' : '';
        }
        if (heroMeta) heroMeta.style.opacity = clamp(1 - y / (vh * .4), 0, 1).toFixed(3);
      } else {
        root.style.setProperty('--bg-scale', (1.06 + h * .06).toFixed(4));
      }
    }

    scrubs.forEach(function (s) {
      var n = Math.round(progressOf(s.el, .88, .38) * s.words.length);
      if (n === s.lit) return;
      s.words.forEach(function (w, i) { w.classList.toggle('lit', i < n); });
      s.lit = n;
    });

    fills.forEach(function (el) {
      el.style.setProperty(el.getAttribute('data-fill'), progressOf(el, .8, .5).toFixed(4));
    });

    if (root.classList.contains('hscroll')) {
      var r = pin.getBoundingClientRect();
      var p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
      track.style.transform = 'translate3d(' + (-p * workDist).toFixed(1) + 'px,0,0)';
      counterBar.style.setProperty('--work', p.toFixed(4));
      if (counterNow) counterNow.textContent = String(Math.min(cards.length, Math.round(p * (cards.length - 1)) + 1)).padStart(2, '0');
    }
  }

  function frame(t) {
    var y = window.scrollY;
    if (y !== lastY) { onScroll(y); lastY = y; }

    if (!reduce) {
      spot.x += (mouse.x - spot.x) * .06;
      spot.y += (mouse.y - spot.y) * .06;
      root.style.setProperty('--mx', spot.x.toFixed(0) + 'px');
      root.style.setProperty('--my', spot.y.toFixed(0) + 'px');

      var offset = t * .03 + y * .45;
      marquees.forEach(function (m) {
        if (!m.half) return;
        var o = offset % m.half;
        m.el.style.transform = 'translate3d(' + (m.dir > 0 ? -o : o - m.half).toFixed(1) + 'px,0,0)';
      });
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('pointermove', function (e) {
    mouse.x = e.clientX; mouse.y = e.clientY;
  }, { passive: true });

  /* ---------- Pointer tilt + glow on cards ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach(function (el) {
      var strength = parseFloat(el.getAttribute('data-tilt')) || 5;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transform = 'perspective(1200px) rotateX(' + ((.5 - py) * strength).toFixed(2) + 'deg) rotateY(' + ((px - .5) * strength).toFixed(2) + 'deg)';
        el.style.setProperty('--nx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--ny', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
    document.querySelectorAll('.teaser-link').forEach(function (el) {
      var float = el.querySelector('.teaser-float');
      if (!float) return;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        float.style.left = (e.clientX - r.left) + 'px';
        float.style.top = (e.clientY - r.top) + 'px';
      });
    });
  }

  /* ---------- Active nav link for in-page sections ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    navLinks.forEach(function (l) { var s = document.querySelector(l.getAttribute('href')); if (s) navObs.observe(s); });
  }

  /* ---------- Seattle clock ---------- */
  var clocks = document.querySelectorAll('[data-clock]');
  if (clocks.length) {
    var fmtTime = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' });
    var updateClock = function () { var s = fmtTime.format(new Date()); clocks.forEach(function (c) { c.textContent = 'Seattle · ' + s; }); };
    updateClock();
    setInterval(updateClock, 15000);
  }

  /* ---------- Layout ---------- */
  function relayout() {
    vh = window.innerHeight; vw = window.innerWidth;
    layoutWork();
    measureMarquees();
    if (videos.length) setVideo(videoOn);
    lastY = -1;
  }
  var resizeTimer;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(relayout, 120); });
  window.addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  relayout();
  requestAnimationFrame(frame);
})();
