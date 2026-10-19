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
      '<a href="/devis" class="bar-devis">Devis gratuit →</a>';
    document.body.appendChild(bar);
  })();

  // Quick call-back forms (city, department and service pages)
  document.querySelectorAll('form.quick-lead').forEach(form => {
    const msg = form.querySelector('.ql-msg');
    const btn = form.querySelector('button[type="submit"]');
    const label = btn.textContent;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (form.tel.value.replace(/\D/g, '').length < 9) {
        msg.textContent = 'Merci d’indiquer un numéro de téléphone valide.';
        form.tel.focus();
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Envoi…';
      fetch('https://formsubmit.co/ajax/maxime.lmdrone@gmail.com', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      })
        .then(r => r.json())
        .then(d => {
          if (String(d.success) !== 'true') throw new Error(d.message || 'refused');
          form.classList.add('sent');
          btn.textContent = 'Demande envoyée ✓';
          msg.textContent = 'Merci ! Nous vous rappelons très vite.';
        })
        .catch(() => {
          btn.disabled = false;
          btn.textContent = label;
          msg.innerHTML = 'Envoi impossible pour le moment — appelez-nous au <a href="tel:+33644302373">06 44 30 23 73</a>.';
        });
    });
  });
})();
