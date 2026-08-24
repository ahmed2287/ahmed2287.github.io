/* ============================================================
   HamdyTech — animations.js
   Premium cinematic motion layer:
     • Lenis smooth scroll  • GSAP + ScrollTrigger reveals
     • Hero entrance timeline + tsParticles network
     • Terminal typewriter  • Magnetic buttons
     • Scroll-triggered counters  • Ambient parallax
     • Case-study storytelling timeline

   Progressive enhancement: if GSAP fails to load this module
   bails early and js/main.js keeps its IntersectionObserver
   reveal + timeout counters as a fallback.

   Loaded BEFORE js/main.js so the `window._revealObserver`
   shim and `window.HTAnim` flag exist before main.js renders
   the dynamic project cards.
   ============================================================ */

(function () {
  'use strict';

  /* ── Bail if the animation stack didn't load ─────────────── */
  if (!window.gsap || !window.ScrollTrigger) {
    console.warn('[anim] GSAP/ScrollTrigger unavailable — falling back to IntersectionObserver reveals.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ── Capability detection ────────────────────────────────── */
  const reduce   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch  = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const root     = document.documentElement;

  /* Take ownership of the reveal/counter systems from main.js
     and let animations.css hand over the .reveal initial state. */
  window.HTAnim = { enabled: true, reduced: reduce };
  root.classList.add('gsap-enabled');

  /* Small DOM-ready helper (scripts sit at end of <body>, but be safe) */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ══════════════════════════════════════════════════════════
     REVEALS — GSAP/ScrollTrigger replacement for the old IO system
  ══════════════════════════════════════════════════════════ */
  function hiddenState(el) {
    if (el.classList.contains('reveal-left')) {
      const rtl = document.dir === 'rtl';
      return { opacity: 0, x: rtl ? 28 : -28, y: 0 };
    }
    return { opacity: 0, y: 28, x: 0 };
  }

  /* Reveal a single element (used for dynamically-inserted nodes
     such as the project cards rendered by main.js). */
  function revealElement(el) {
    if (!el || el._htRevealed) return;
    el._htRevealed = true;
    if (reduce) { gsap.set(el, { opacity: 1, x: 0, y: 0 }); return; }
    gsap.set(el, hiddenState(el));
    gsap.to(el, {
      opacity: 1, x: 0, y: 0, duration: 0.95, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  }

  /* Shim for any code that reveals dynamically inserted nodes */
  window._revealObserver = { observe: revealElement };

  function setupReveals() {
    const items = gsap.utils.toArray('.reveal, .reveal-left');
    if (reduce) {
      gsap.set(items, { opacity: 1, x: 0, y: 0 });
      return;
    }
    /* Pre-set hidden state so nothing flashes before the batch runs */
    items.forEach(el => { el._htRevealed = true; gsap.set(el, hiddenState(el)); });

    ScrollTrigger.batch('.reveal, .reveal-left', {
      start: 'top 90%',
      once: true,
      onEnter: batch => gsap.to(batch, {
        opacity: 1, x: 0, y: 0,
        duration: 0.95, ease: 'power2.out', stagger: 0.12, overwrite: true
      })
    });
  }

  /* ══════════════════════════════════════════════════════════
     HERO — cinematic entrance timeline
  ══════════════════════════════════════════════════════════ */
  function initHero() {
    if (reduce) return;
    const left     = document.querySelector('#hero .grid > div');
    const terminal = document.querySelector('#hero .terminal');

    /* Hide immediately so nothing shows behind the loader */
    if (left)     gsap.set(left.children, { opacity: 0, y: 26 });
    if (terminal) gsap.set(terminal, { opacity: 0, y: 32, scale: 0.985 });

    const play = () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      if (left)     tl.to(left.children, { opacity: 1, y: 0, duration: 1.1, stagger: 0.14 }, 0.1);
      if (terminal) tl.to(terminal, { opacity: 1, y: 0, scale: 1, duration: 1.2 }, 0.4);
    };

    /* If the loader (experience.js) is running, wait for it to lift so the
       entrance isn't wasted behind the overlay. Otherwise play now. */
    if (window.HTLoader && window.HTLoader.active) {
      document.addEventListener('ht:loaded', play, { once: true });
    } else {
      play();
    }
  }

  /* ══════════════════════════════════════════════════════════
     HERO — tsParticles infrastructure network
  ══════════════════════════════════════════════════════════ */
  function initParticles() {
    if (reduce || !window.tsParticles) return;
    const count    = isMobile ? 14 : 30;
    const linkDist = isMobile ? 110 : 150;

    const loading = tsParticles.load({
      id: 'hero-particles',
      options: {
        fpsLimit: 60,
        detectRetina: true,
        background: { color: 'transparent' },
        fullScreen: { enable: false },
        particles: {
          number: { value: count, density: { enable: true, area: 900 } },
          color:  { value: ['#3cffc0', '#3b82f6', '#6366f1'] },
          links:  { enable: true, color: '#3cffc0', distance: linkDist, opacity: 0.12, width: 1 },
          move:   { enable: true, speed: isMobile ? 0.3 : 0.45, outModes: { default: 'bounce' } },
          opacity: { value: 0.38 },
          size:    { value: { min: 1, max: 2.4 } }
        },
        interactivity: {
          events: { onHover: { enable: !isMobile, mode: 'grab' } },
          modes:  { grab: { distance: 140, links: { opacity: 0.35 } } }
        }
      }
    });
    if (loading && typeof loading.catch === 'function') {
      loading.catch(err => console.warn('[anim] particles failed:', err));
    }
  }

  /* ══════════════════════════════════════════════════════════
     HERO — terminal typewriter
  ══════════════════════════════════════════════════════════ */
  function initTypewriter() {
    const el = document.getElementById('hero-typed');
    if (!el) return;
    const cmds = [
      'deploy infrastructure',
      'docker compose up -d',
      'kubectl get nodes',
      'systemctl status nginx',
      'monitoring active',
      'deployment successful'
    ];
    if (reduce) { el.textContent = cmds[0]; return; }

    let ci = 0, chi = 0, deleting = false;
    function tick() {
      const cmd = cmds[ci];
      if (!deleting) {
        el.textContent = cmd.slice(0, ++chi);
        if (chi === cmd.length) { deleting = true; return setTimeout(tick, 1900); }
        setTimeout(tick, 55 + Math.random() * 45);
      } else {
        el.textContent = cmd.slice(0, --chi);
        if (chi === 0) { deleting = false; ci = (ci + 1) % cmds.length; return setTimeout(tick, 480); }
        setTimeout(tick, 28);
      }
    }
    setTimeout(tick, 900);
  }

  /* ══════════════════════════════════════════════════════════
     MAGNETIC BUTTONS
  ══════════════════════════════════════════════════════════ */
  function initMagnetic() {
    if (reduce || isTouch) return;
    const strength = 0.35;
    document.querySelectorAll('.btn-cv, .btn-hub, .btn-mon, .btn-schedule, .btn-primary')
      .forEach(btn => {
        const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
        const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
        btn.addEventListener('mousemove', e => {
          const r = btn.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * strength);
          yTo((e.clientY - (r.top + r.height / 2)) * strength);
        });
        btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
      });
  }

  /* ══════════════════════════════════════════════════════════
     COUNTERS — scroll-triggered, replaces main.js timeout counters
  ══════════════════════════════════════════════════════════ */
  function initCounters() {
    document.querySelectorAll('[data-counter]').forEach(el => {
      const target = parseFloat(el.dataset.counter);
      if (isNaN(target)) return;
      const suffix   = el.dataset.suffix || '';
      const prefix   = el.dataset.prefix || '';
      const decimals = el.dataset.decimals != null
        ? +el.dataset.decimals
        : (String(el.dataset.counter).indexOf('.') !== -1 ? 1 : 0);
      const render = v => {
        el.textContent = prefix + (decimals ? v.toFixed(decimals) : Math.round(v)) + suffix;
      };
      if (reduce) { render(target); return; }
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.6, ease: 'power2.out',
        onUpdate: () => render(obj.v),
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     SCROLL PROGRESS BAR — synced to page scroll
  ══════════════════════════════════════════════════════════ */
  function initScrollProgress() {
    const wrap = document.querySelector('.scroll-progress');
    const bar  = document.querySelector('.scroll-progress-bar');
    if (!wrap || !bar) return;

    /* Pin the track to the bottom edge of the nav's top row. The wrap is
       absolute inside <nav>, so `top` = the top-row height — independent
       of the banner offset and unaffected when the mobile menu expands
       (the menu is a separate row below the one we measure). */
    const nav = document.querySelector('nav');
    const row = nav ? nav.querySelector('.max-w-7xl') : null;
    const position = () => {
      if (row) wrap.style.top = row.offsetHeight + 'px';
    };
    position();
    window.addEventListener('resize', position);

    const setP = p => {
      bar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, p)).toFixed(4) + ')';
    };

    if (reduce) {
      /* No Lenis/GSAP scrub under reduced motion — a passive listener
         still gives an accurate, jank-free progress fill. */
      const update = () => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        setP(h > 0 ? window.scrollY / h : 0);
      };
      update();
      window.addEventListener('scroll', update, { passive: true });
      return;
    }

    gsap.to(bar, {
      scaleX: 1, ease: 'none',
      scrollTrigger: {
        start: 0,
        end: () => document.documentElement.scrollHeight - window.innerHeight,
        scrub: 0.3,
        invalidateOnRefresh: true
      }
    });
  }

  /* ══════════════════════════════════════════════════════════
     AMBIENT PARALLAX — subtle orb/glow drift (desktop only)
  ══════════════════════════════════════════════════════════ */
  function initParallax() {
    if (reduce || isMobile) return;
    gsap.utils.toArray('.automation-hub-orb, .monitoring-platform-orb').forEach(orb => {
      const section = orb.closest('section') || orb;
      gsap.to(orb, {
        yPercent: 10, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1 }
      });
    });
    const heroGlow = document.querySelector('#hero .rounded-full');
    if (heroGlow) {
      gsap.to(heroGlow, {
        yPercent: 14, ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 1 }
      });
    }
  }

  /* ══════════════════════════════════════════════════════════
     CASE STUDY — storytelling timeline + diagram progression
  ══════════════════════════════════════════════════════════ */
  function initCaseStudy() {
    const timeline = document.querySelector('.case-timeline');
    if (timeline) {
      const progress = timeline.querySelector('.case-tl-progress');
      if (progress && !reduce) {
        gsap.to(progress, {
          scaleY: 1, ease: 'none',
          scrollTrigger: { trigger: timeline, start: 'top 70%', end: 'bottom 70%', scrub: true }
        });
      }
      gsap.utils.toArray('.case-tl-step', timeline).forEach(step => {
        ScrollTrigger.create({
          trigger: step, start: 'top 65%', end: 'bottom 35%',
          onToggle: self => step.classList.toggle('is-active', self.isActive)
        });
      });
    }

    /* Architecture diagram — reveal layer by layer */
    if (reduce) {
      gsap.set('.arch-reveal', { opacity: 1, y: 0 });
    } else {
      gsap.set('.arch-reveal', { opacity: 0, y: 12 });
      ScrollTrigger.batch('.arch-reveal', {
        start: 'top 85%', once: true,
        onEnter: b => gsap.to(b, {
          opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.12, overwrite: true
        })
      });
    }
  }

  /* ══════════════════════════════════════════════════════════
     LENIS — smooth scroll + anchor routing
  ══════════════════════════════════════════════════════════ */
  function initLenis() {
    if (reduce || !window.Lenis) return null;
    const lenis = new Lenis({
      duration: 1.25,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4
    });
    /* Disable native smooth-scroll (custom.css :33) so it can't fight
       Lenis — inline style wins over the stylesheet rule. */
    root.style.scrollBehavior = 'auto';
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    window.HTAnim.lenis = lenis;
    return lenis;
  }

  /* Shared smooth-scroll-to-target, accounting for the fixed banner +
     nav. Exposed on window.HTAnim so the command palette (experience.js)
     can reuse the exact same scroll behaviour. */
  function scrollToTarget(target, opts) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    const nav = document.querySelector('nav');
    const row = nav && nav.querySelector('.max-w-7xl');
    const navH = row ? row.offsetHeight : (nav ? nav.offsetHeight : 64);
    const bannerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--banner-h')) || 0;
    const offset = navH + bannerH + 8;
    const lenis = window.HTAnim.lenis;
    if (lenis) {
      lenis.scrollTo(el, { offset: -offset, duration: (opts && opts.duration) || 1.2 });
    } else {
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  window.HTAnim.scrollTo = scrollToTarget;

  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      const id = a.getAttribute('href');
      if (!id || id.length < 2) return;
      a.addEventListener('click', e => {
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        scrollToTarget(target);
        const menu = document.getElementById('mobile-menu');
        if (menu) menu.classList.remove('open');
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════════════════════ */
  ready(() => {
    initLenis();
    initAnchors();
    setupReveals();
    initHero();
    initParticles();
    initTypewriter();
    initMagnetic();
    initCounters();
    initScrollProgress();
    initParallax();
    initCaseStudy();

    /* Project grid re-renders on language switch → refresh triggers.
       Also gives newly translated/laid-out content correct positions. */
    document.addEventListener('langchange', () => {
      setTimeout(() => ScrollTrigger.refresh(), 80);
    });
  });

  /* Recompute trigger positions once everything (fonts/images) settles */
  window.addEventListener('load', () => ScrollTrigger.refresh());

})();
