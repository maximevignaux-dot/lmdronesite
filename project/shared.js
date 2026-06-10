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
    el.querySelectorAll('img').forEach(img => {
      img.style.transition = 'none';
      img.style.clipPath = 'none';
    });
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

  // Reveal on scroll — with cascade: sibling reveals stagger their entrance
  document.querySelectorAll('.reveal').forEach(el => {
    const parent = el.parentElement;
    if (!parent) return;
    const sibs = Array.from(parent.children).filter(c => c.classList && c.classList.contains('reveal'));
    if (sibs.length > 1) {
      el.style.transitionDelay = Math.min(sibs.indexOf(el) * 80, 480) + 'ms';
    }
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          // clear the stagger delay so hover transitions stay snappy
          setTimeout(() => { e.target.style.transitionDelay = ''; }, 1300);
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
    const onDown = (e) => { active = true; wrap.classList.add('touched'); setX(e.clientX ?? e.touches[0].clientX); };
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

  // Sticky mobile CTA bar — injected on every page (hidden on desktop via CSS)
  (function () {
    const path = window.location.pathname;
    const depth = (path.match(/\/(villes|departements)\//)) ? '../' : '';
    const bar = document.createElement('div');
    bar.className = 'mobile-cta-bar';
    bar.innerHTML =
      '<a href="tel:+33644302373" class="bar-call">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/></svg>' +
        'Appeler</a>' +
      '<a href="' + depth + 'devis.html" class="bar-devis">Devis gratuit →</a>';
    document.body.appendChild(bar);
  })();

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

  // ===== Signature animations =====

  // Typewriter word rotator (hero headline)
  document.querySelectorAll('.type-words').forEach(el => {
    const words = (el.dataset.words || '').split('|').filter(Boolean);
    if (words.length < 2 || reduceMotion) return;
    let wi = 0, ci = words[0].length, deleting = true;
    const tick = () => {
      const w = words[wi];
      if (deleting) {
        ci--;
        el.textContent = w.slice(0, ci);
        if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; setTimeout(tick, 300); return; }
        setTimeout(tick, 40);
      } else {
        ci++;
        el.textContent = words[wi].slice(0, ci);
        if (ci === words[wi].length) { deleting = true; setTimeout(tick, 2400); return; }
        setTimeout(tick, 70);
      }
    };
    setTimeout(tick, 2600);
  });

  // Trust strip → infinite marquee
  const tg = document.querySelector('.trust-grid');
  if (tg && !reduceMotion) {
    const group = document.createElement('div');
    group.className = 'marquee-group';
    while (tg.firstElementChild) group.appendChild(tg.firstElementChild);
    const clone = group.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    tg.appendChild(group);
    tg.appendChild(clone);
    tg.classList.add('marquee-on');
  }

  // 3D tilt on cards and hero visual (desktop pointers only)
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.service-card, .adv-item, .hero-visual').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${(x * 4).toFixed(2)}deg) rotateX(${(-y * 4).toFixed(2)}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  // Scroll progress bar
  const prog = document.createElement('div');
  prog.className = 'scroll-progress';
  prog.setAttribute('aria-hidden', 'true');
  document.body.appendChild(prog);
  const updateProg = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    prog.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
  };
  window.addEventListener('scroll', updateProg, { passive: true });
  updateProg();

  // Drone flying across the hero
  const heroEl = document.querySelector('.hero');
  if (heroEl && !reduceMotion) {
    const fly = document.createElement('div');
    fly.className = 'drone-flyer';
    fly.setAttribute('aria-hidden', 'true');
    fly.innerHTML =
      '<svg width="84" height="40" viewBox="0 0 84 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<g class="props">' +
          '<line x1="2" y1="6" x2="30" y2="6" stroke="#9FB4CC" stroke-width="2" stroke-linecap="round"/>' +
          '<line x1="54" y1="6" x2="82" y2="6" stroke="#9FB4CC" stroke-width="2" stroke-linecap="round"/>' +
        '</g>' +
        '<rect x="12" y="8" width="8" height="6" rx="2" fill="#3FE08F"/>' +
        '<rect x="64" y="8" width="8" height="6" rx="2" fill="#3FE08F"/>' +
        '<path d="M16 14 L34 21 H50 L68 14" stroke="#9FB4CC" stroke-width="2.5" fill="none"/>' +
        '<rect x="30" y="18" width="24" height="11" rx="5.5" fill="#E6ECF4"/>' +
        '<circle cx="42" cy="33" r="4" fill="#0B1B30" stroke="#3FE08F" stroke-width="1.5"/>' +
        '<circle class="led" cx="51" cy="23" r="2" fill="#3FE08F"/>' +
      '</svg>';
    heroEl.appendChild(fly);
  }
})();
