/* ============================================================
   HamdyTech — experience.js
   Premium UI experience layer (independent of the scroll-motion
   layer in animations.js):
     • Cinematic loading screen
     • Command palette (Ctrl / ⌘ + K)
     • Custom cursor (desktop / fine-pointer only)
     • Project card 3D tilt

   Loaded AFTER animations.js so it can reuse window.HTAnim
   (lenis instance + scrollTo helper). Degrades gracefully if
   that module is absent.
   ============================================================ */

(function () {
  'use strict';

  /* ── Capability detection ────────────────────────────────── */
  const reduce  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  /* Has the loader already run this session? (skip on internal reloads) */
  let alreadyLoaded = false;
  try { alreadyLoaded = sessionStorage.getItem('ht-loaded') === '1'; } catch (e) { /* private mode */ }

  /* Published SYNCHRONOUSLY (before DOMContentLoaded) so animations.js
     initHero() can decide whether to wait for the loader to lift. */
  window.HTLoader = { active: !reduce && !alreadyLoaded };

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  const fireLoaded = () => {
    window.HTLoader.active = false;
    try { sessionStorage.setItem('ht-loaded', '1'); } catch (e) {}
    document.dispatchEvent(new CustomEvent('ht:loaded'));
  };

  /* ══════════════════════════════════════════════════════════
     LOADING SCREEN
  ══════════════════════════════════════════════════════════ */
  function initLoader() {
    const loader = document.querySelector('.loader');
    if (!loader) { fireLoaded(); return; }

    /* Reduced motion or repeat visit → reveal instantly */
    if (!window.HTLoader.active) {
      loader.classList.add('is-hidden');
      setTimeout(() => loader.remove(), 700);
      fireLoaded();
      return;
    }

    const lines = Array.prototype.slice.call(loader.querySelectorAll('.loader-line'));
    const fill  = loader.querySelector('.loader-bar-fill');
    const lenis = window.HTAnim && window.HTAnim.lenis;

    /* Lock scroll while the loader is up */
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';

    let i = 0;
    const step = () => {
      if (i > 0) lines[i - 1].classList.add('done');
      if (i < lines.length) {
        lines[i].classList.add('show');
        if (fill) fill.style.width = Math.round(((i + 1) / lines.length) * 100) + '%';
        i++;
        setTimeout(step, 380);
      } else {
        setTimeout(() => {
          loader.classList.add('is-hidden');
          if (lenis) lenis.start();
          document.body.style.overflow = '';
          fireLoaded();
          setTimeout(() => loader.remove(), 700);
        }, 320);
      }
    };
    setTimeout(step, 250);
  }

  /* ══════════════════════════════════════════════════════════
     CUSTOM CURSOR
  ══════════════════════════════════════════════════════════ */
  function initCursor() {
    if (reduce || isTouch) return;
    const ring = document.querySelector('.cursor-ring');
    const dot  = document.querySelector('.cursor-dot');
    if (!ring || !dot) return;

    document.body.classList.add('has-custom-cursor');

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    /* Dot tracks the pointer exactly; ring lerps for a smooth trail.
       The trailing translate(-50%,-50%) keeps both centred at any size. */
    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0) translate(-50%,-50%)';
    }, { passive: true });

    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = 'translate3d(' + rx.toFixed(2) + 'px,' + ry.toFixed(2) + 'px,0) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    const interactive = 'a,button,[role="button"],input,.card,.project-card,.hub-pill,.mon-pill,.lang-switch,[data-copy],.cmdk-item,.contact-card,.booking-type-card';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(interactive)) ring.classList.add('is-hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(interactive)) ring.classList.remove('is-hover');
    });
    window.addEventListener('mousedown', () => ring.classList.add('is-down'));
    window.addEventListener('mouseup',   () => ring.classList.remove('is-down'));
    /* Hide when the pointer leaves the window */
    document.addEventListener('mouseleave', () => { ring.style.opacity = '0'; dot.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { ring.style.opacity = '1'; dot.style.opacity = '1'; });
  }

  /* ══════════════════════════════════════════════════════════
     PROJECT CARD 3D TILT
  ══════════════════════════════════════════════════════════ */
  function initTilt() {
    if (reduce || isTouch) return;
    const grid = document.getElementById('projects-grid');
    if (!grid) return;
    const MAX = 6; // max degrees
    let last = null;

    grid.addEventListener('mousemove', e => {
      const card = e.target.closest('.project-card');
      if (card !== last) { if (last) last.style.transform = ''; last = card; }
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        'perspective(1100px) rotateY(' + (px * MAX * 2).toFixed(2) + 'deg) rotateX(' +
        (-py * MAX * 2).toFixed(2) + 'deg) translateZ(8px)';
    });
    grid.addEventListener('mouseleave', () => {
      if (last) { last.style.transform = ''; last = null; }
    });
  }

  /* ══════════════════════════════════════════════════════════
     COMMAND PALETTE  (Ctrl / ⌘ + K)
  ══════════════════════════════════════════════════════════ */
  function initCommandPalette() {
    const overlay = document.getElementById('cmdk');
    if (!overlay) return;
    const input = overlay.querySelector('.cmdk-input');
    const list  = overlay.querySelector('.cmdk-list');
    const trigger = document.getElementById('cmdk-trigger');

    const goto = sel => {
      close();
      const fn = window.HTAnim && window.HTAnim.scrollTo;
      setTimeout(() => {
        if (fn) fn(sel);
        else { const el = document.querySelector(sel); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
      }, 60);
    };
    const openLink = sel => {
      const a = document.querySelector(sel);
      if (!a) return;
      if (a.href && a.href.indexOf('mailto:') === 0) window.location.href = a.href;
      else if (a.href) window.open(a.href, a.target || '_self', 'noopener');
      close();
    };
    /* Navigate to another internal page (solution / about). */
    const nav = url => { close(); window.location.href = url; };
    /* Open an external live product domain in a new, isolated tab. */
    const ext = url => { window.open(url, '_blank', 'noopener,noreferrer'); close(); };

    /* Command registry — labels in English (power-user tool). */
    const COMMANDS = [
      { group: 'Navigate', icon: '▸', label: 'Home',                run: () => goto('#hero') },
      { group: 'Navigate', icon: '▸', label: 'Book a Meeting',      run: () => goto('#book') },
      { group: 'Navigate', icon: '▸', label: 'Services',            run: () => goto('#services') },
      { group: 'Navigate', icon: '▸', label: 'Architecture',        run: () => goto('#architecture') },
      { group: 'Navigate', icon: '▸', label: 'About',              run: () => nav('about.html') },
      { group: 'Navigate', icon: '▸', label: 'Contact',             run: () => goto('#contact') },
      { group: 'Projects', icon: '◎', label: 'Monitoring Platform',        meta: 'live ↗', run: () => ext('https://monitoring.hamdyzone.icu') },
      { group: 'Projects', icon: '▣', label: 'HamdyHost — VPS',            meta: 'live ↗', run: () => ext('https://hosting.hamdyzone.icu') },
      { group: 'Projects', icon: '⚡', label: 'Automation Hub',             meta: 'live ↗', run: () => ext('https://automation-hub.hamdyzone.icu') },
      { group: 'Projects', icon: '⊞', label: 'HR Platform',                meta: 'live ↗', run: () => ext('https://attendance.hamdyzone.icu') },
      { group: 'Projects', icon: '✦', label: 'AI Agent',                   meta: 'live ↗', run: () => ext('https://agent.hamdyzone.icu') },
      { group: 'Projects', icon: '✎', label: 'Content Creation Platform',  meta: 'live ↗', run: () => ext('https://content-generator.hamdyzone.icu') },
      { group: 'Solutions', icon: '▦', label: 'Virtualization & Private Cloud', run: () => nav('solution.html?id=virtualization') },
      { group: 'Solutions', icon: '■', label: 'ERP & Business Systems',        run: () => nav('solution.html?id=erp') },
      { group: 'Solutions', icon: '▤', label: 'File & Collaboration',          run: () => nav('solution.html?id=file-collaboration') },
      { group: 'Solutions', icon: '✉', label: 'Internal Communication',        run: () => nav('solution.html?id=internal-communication') },
      { group: 'Solutions', icon: '⎇', label: 'DevOps & Version Control',      run: () => nav('solution.html?id=devops') },
      { group: 'Solutions', icon: '◎', label: 'Monitoring & Observability',    run: () => nav('solution.html?id=monitoring') },
      { group: 'Actions', icon: '↓',  label: 'Download CV',   meta: 'PDF',      run: () => { const a = document.querySelector('[data-content="cv-link"]'); if (a) a.click(); close(); } },
      { group: 'Actions', icon: '✉',  label: 'Send Email',     meta: 'mail',     run: () => openLink('[data-content="email-link"]') },
      { group: 'Actions', icon: '◆',  label: 'WhatsApp',       meta: 'chat',     run: () => openLink('[data-content="whatsapp-link"]') },
      { group: 'Actions', icon: 'in', label: 'LinkedIn',       meta: 'profile',  run: () => openLink('[data-content="linkedin-link"]') },
      { group: 'Actions', icon: '⌥',  label: 'GitHub Profile', meta: 'profile',  run: () => openLink('[data-content="github-link"]') },
      { group: 'Actions', icon: '⇄',  label: 'Switch Language', meta: 'EN / AR', run: () => { const s = document.getElementById('lang-switcher'); if (s) s.click(); close(); } }
    ];

    let items = [];      // visible <li> nodes
    let activeIdx = 0;

    function highlight() {
      items.forEach((li, i) => li.classList.toggle('active', i === activeIdx));
      if (items[activeIdx]) items[activeIdx].scrollIntoView({ block: 'nearest' });
    }
    function execute(cmd) { if (cmd && typeof cmd.run === 'function') cmd.run(); }

    function render(filter) {
      list.innerHTML = '';
      items = [];
      const q = (filter || '').trim().toLowerCase();
      let group = null;
      COMMANDS.forEach(cmd => {
        if (q && cmd.label.toLowerCase().indexOf(q) === -1) return;
        if (cmd.group !== group) {
          group = cmd.group;
          const gl = document.createElement('li');
          gl.className = 'cmdk-group-label';
          gl.textContent = cmd.group;
          list.appendChild(gl);
        }
        const li = document.createElement('li');
        li.className = 'cmdk-item';
        li.setAttribute('role', 'option');
        li.innerHTML =
          '<span class="cmdk-ico">' + cmd.icon + '</span><span>' + cmd.label + '</span>' +
          (cmd.meta ? '<span class="cmdk-meta">' + cmd.meta + '</span>' : '');
        li._cmd = cmd;
        li.addEventListener('click', () => execute(cmd));
        const idx = items.length;
        li.addEventListener('mousemove', () => { activeIdx = idx; highlight(); });
        list.appendChild(li);
        items.push(li);
      });
      if (!items.length) {
        const e = document.createElement('li');
        e.className = 'cmdk-empty';
        e.textContent = 'No results';
        list.appendChild(e);
      }
      activeIdx = 0;
      highlight();
    }

    function open() {
      render('');
      input.value = '';
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      const lenis = window.HTAnim && window.HTAnim.lenis;
      if (lenis) lenis.stop();
      /* Focus now and again next frame — covers the visibility-flip timing
         so the user can type immediately after the shortcut. */
      input.focus();
      requestAnimationFrame(() => input.focus());
    }
    function close() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      const lenis = window.HTAnim && window.HTAnim.lenis;
      if (lenis) lenis.start();
    }
    const isOpen = () => overlay.classList.contains('open');

    /* Global shortcut */
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isOpen() ? close() : open();
      } else if (e.key === 'Escape' && isOpen()) {
        close();
      }
    });

    input.addEventListener('input', () => render(input.value));
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, items.length - 1); highlight(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); highlight(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (items[activeIdx]) execute(items[activeIdx]._cmd); }
    });

    /* Click on the backdrop closes */
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });
    if (trigger) trigger.addEventListener('click', open);
  }

  /* ══════════════════════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════════════════════ */
  ready(() => {
    initLoader();
    initCursor();
    initTilt();
    initCommandPalette();
  });

})();
