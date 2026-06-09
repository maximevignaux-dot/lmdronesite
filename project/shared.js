/* LM DRONE — shared interactions */

(function () {
  // Arm CSS reveal animations (content stays visible if JS never runs)
  document.documentElement.classList.add('js');

  // Hero staggered entrance: add .pre (hidden) now, release shortly after so
  // the transition plays. Base CSS is visible, so a JS failure can't hide it.
  // forceShow() drops the transition and pins the final visible state — used as
  // a fallback so content can never stay stuck hidden (e.g. a stalled/background
  // iframe where transitions never advance past their start frame).
  const forceShow = (el) => {
    el.style.transition = 'none';
    el.style.opacity = '1';
    el.style.transform = 'none';
  };
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const heroEls = document.querySelectorAll('.hero-anim, .hero-anim-visual');
    const heroKids = document.querySelectorAll('.hero-anim > *, .hero-anim-visual');
    heroEls.forEach(el => el.classList.add('pre'));
    const releaseHero = () => heroEls.forEach(el => el.classList.remove('pre'));
    requestAnimationFrame(() => requestAnimationFrame(releaseHero));
    // Fallback: if frames aren't advancing, pin children visible outright.
    setTimeout(() => { releaseHero(); heroKids.forEach(forceShow); }, 900);
  }

  // Header scroll state
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 12);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile menu
  const burger = document.querySelector('.nav-burger');
  const menu = document.querySelector('.mobile-menu');
  if (burger && menu) {
    burger.addEventListener('click', () => menu.classList.toggle('open'));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
  }

  // FAQ
  document.querySelectorAll('.faq-item .faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      item.classList.toggle('open');
    });
  });

  // Reveal on scroll
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    // Safety net: if the observer/transitions never advance (stalled or
    // background iframe), pin everything visible without a transition.
    setTimeout(() => document.querySelectorAll('.reveal:not(.in)').forEach(el => {
      el.classList.add('in');
      forceShow(el);
    }), 1400);
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }

  // Before / After slider
  document.querySelectorAll('.ba-wrap').forEach(wrap => {
    const after = wrap.querySelector('.ba-after');
    const handle = wrap.querySelector('.ba-handle');
    let active = false;
    const setX = (clientX) => {
      const rect = wrap.getBoundingClientRect();
      let x = ((clientX - rect.left) / rect.width) * 100;
      x = Math.max(2, Math.min(98, x));
      handle.style.left = x + '%';
      after.style.clipPath = `inset(0 0 0 ${x}%)`;
    };
    const onDown = (e) => { active = true; setX(e.clientX ?? e.touches[0].clientX); };
    const onMove = (e) => { if (!active) return; setX(e.clientX ?? e.touches[0].clientX); };
    const onUp = () => { active = false; };
    wrap.addEventListener('mousedown', onDown);
    wrap.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    // hover preview
    wrap.addEventListener('mousemove', (e) => { if (!active) { /* hover-light: do nothing */ } });
  });

  // Radio group (devis)
  document.querySelectorAll('.radio-group').forEach(group => {
    group.querySelectorAll('label').forEach(label => {
      label.addEventListener('click', () => {
        group.querySelectorAll('label').forEach(l => l.classList.remove('checked'));
        label.classList.add('checked');
      });
    });
  });

  // Smooth anchor offset (account for sticky header)
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href.length <= 1) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Count-up for hero stats (animates the leading number, keeps suffix)
  if (!reduceMotion && 'IntersectionObserver' in window) {
    document.querySelectorAll('.hero-stats .stat-num').forEach(el => {
      const html = el.innerHTML;
      const m = html.match(/^\s*(\d+)/);
      if (!m) return;
      const target = parseInt(m[1], 10);
      const rest = html.slice(m[0].length); // suffix like €, %, &nbsp;h, <span>…</span>
      const prefixSpace = m[0].match(/^\s*/)[0];
      let started = false;
      const run = () => {
        if (started) return; started = true;
        const dur = 1100, t0 = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.innerHTML = prefixSpace + Math.round(target * eased) + rest;
          if (p < 1) requestAnimationFrame(tick);
          else el.innerHTML = html;
        };
        requestAnimationFrame(tick);
      };
      const so = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { run(); so.disconnect(); } });
      }, { threshold: 0.5 });
      so.observe(el);
    });
  }

  // Subtle parallax on hero blobs
  if (!reduceMotion) {
    const blobs = document.querySelectorAll('.hero .blob');
    if (blobs.length) {
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          const y = window.scrollY;
          blobs.forEach((b, i) => {
            const speed = i % 2 === 0 ? 0.12 : -0.08;
            b.style.marginTop = (y * speed) + 'px';
          });
          ticking = false;
        });
      }, { passive: true });
    }
  }
})();
