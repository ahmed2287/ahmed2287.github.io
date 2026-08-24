/* ============================================================
   HamdyTech — nav.js
   Shared premium navbar: Projects/Infrastructure dropdowns,
   theme toggle, language switch, mobile accordion menu.
   Injected synchronously into <div id="site-nav"> so that
   main.js (i18n, mobile nav, scroll-spy, lang switch) wires it
   on DOMContentLoaded with zero changes.
   ============================================================ */
(function () {
  'use strict';

  var mount = document.getElementById('site-nav');
  if (!mount) return;

  /* ── Route awareness ─────────────────────────────────────── */
  var path = location.pathname;
  var isTemplatePage = /infrastructure\.html|solution\.html|about\.html/.test(path);
  var onHome = !isTemplatePage;
  // Template pages (solution/about) link back to index.html#anchor;
  // everything else is treated as the home page where anchors are local.
  // Projects have no internal pages — they link straight to their live domains.
  var isSolutionPage = /solution\.html|infrastructure\.html/.test(path);
  var homeBase = onHome ? '' : 'index.html';
  function homeLink(hash) { return homeBase + hash; }

  /* ── Menu data ───────────────────────────────────────────── */
  /* One featured project, presented in full on the home page. The entry
     scrolls to #projects rather than jumping straight to GitHub — the
     section itself carries the source link. */
  var PROJECTS = [
    { hash: '#projects', icon: '\u2261', k: 'nav.proj_logflow', t: 'LogFlow', d: 'nav.proj_logflow_d', dt: 'Self-hosted log management' }
  ];
  var INFRA = [
    { id: 'virtualization',          icon: '▦', k: 'nav.sol_virtualization', t: 'Virtualization & Private Cloud', d: 'nav.sol_virtualization_d', dt: 'Proxmox VE clusters' },
    { id: 'erp',                     icon: '■', k: 'nav.sol_erp',            t: 'ERP & Business Systems',         d: 'nav.sol_erp_d',            dt: 'ERPNext deployments' },
    { id: 'file-collaboration',      icon: '▤', k: 'nav.sol_file',           t: 'File & Collaboration',           d: 'nav.sol_file_d',           dt: 'Nextcloud platforms' },
    { id: 'internal-communication',  icon: '✉', k: 'nav.sol_comms',          t: 'Internal Communication',         d: 'nav.sol_comms_d',          dt: 'Mattermost · Rocket.Chat' },
    { id: 'devops',                  icon: '⎇', k: 'nav.sol_devops',         t: 'DevOps & Version Control',       d: 'nav.sol_devops_d',         dt: 'GitLab CI/CD' },
    { id: 'monitoring',              icon: '◎', k: 'nav.sol_monitoring',     t: 'Monitoring & Observability',     d: 'nav.sol_monitoring_d',     dt: 'Prometheus · Grafana · Loki' }
  ];

  /* External (real product domain) → new tab w/ opener protection;
     internal (solution) → solution.html?id=SLUG. */
  function ddAttrs(it, base) {
    if (it.url)  return 'href="' + it.url + '" target="_blank" rel="noopener noreferrer"';
    if (it.hash) return 'href="' + homeLink(it.hash) + '"';
    return 'href="' + base + '?id=' + it.id + '"';
  }

  var extDdIco = '<svg class="nav-dd-ext" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';

  function ddItems(list, base) {
    return list.map(function (it) {
      return '' +
        '<a ' + ddAttrs(it, base) + ' role="menuitem" class="nav-dd-item">' +
          '<span class="nav-dd-ico">' + it.icon + '</span>' +
          '<span class="nav-dd-meta">' +
            '<span class="nav-dd-title" data-i18n="' + it.k + '">' + it.t + '</span>' +
            '<span class="nav-dd-desc" data-i18n="' + it.d + '">' + it.dt + '</span>' +
          '</span>' +
          (it.url ? extDdIco : '') +
        '</a>';
    }).join('');
  }

  function mobileSub(list, base) {
    return list.map(function (it) {
      return '<a ' + ddAttrs(it, base) + ' class="nav-m-sub-item">' +
        '<span class="nav-dd-ico">' + it.icon + '</span>' +
        '<span data-i18n="' + it.k + '">' + it.t + '</span>' +
        (it.url ? extDdIco : '') + '</a>';
    }).join('');
  }

  var chevron = '<svg class="nav-dd-chev" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>';

  var sun = '<svg class="icon-sun" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var moon = '<svg class="icon-moon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  /* ── Markup ──────────────────────────────────────────────── */
  var html = '' +
  '<nav class="nav-blur fixed top-0 left-0 right-0 z-50">' +
    '<div class="scroll-progress" aria-hidden="true"><span class="scroll-progress-bar"></span></div>' +
    '<div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">' +

      '<a href="' + homeLink('#hero') + '" class="flex items-center gap-3 group">' +
        '<img src="/My-Logo.png" alt="HamdyTech Logo" class="h-9 w-auto object-contain logo-img">' +
      '</a>' +

      /* desktop links */
      '<div class="hidden md:flex items-center gap-7">' +
        '<a href="' + homeLink('#hero') + '" class="font-mono text-sm text-gray-400 hover:text-neon transition-colors tracking-wide" data-i18n="nav.home">Home</a>' +

        '<div class="nav-dd" data-dd="projects">' +
          '<button class="nav-dd-trigger font-mono text-sm text-gray-400 tracking-wide" aria-haspopup="true" aria-expanded="false">' +
            '<span data-i18n="nav.projects">Projects</span>' + chevron +
          '</button>' +
          '<div class="nav-dd-panel" role="menu">' + ddItems(PROJECTS, '') + '</div>' +
        '</div>' +

        '<div class="nav-dd" data-dd="solutions">' +
          '<button class="nav-dd-trigger font-mono text-sm text-gray-400 tracking-wide" aria-haspopup="true" aria-expanded="false">' +
            '<span data-i18n="nav.solutions">Solutions</span>' + chevron +
          '</button>' +
          '<div class="nav-dd-panel nav-dd-panel--wide" role="menu">' + ddItems(INFRA, 'solution.html') + '</div>' +
        '</div>' +

        '<a href="about.html" class="font-mono text-sm text-gray-400 hover:text-neon transition-colors tracking-wide" data-i18n="nav.about">About</a>' +
        '<a href="' + homeLink('#book') + '" class="font-mono text-sm btn-book-nav tracking-wide" data-i18n="nav.book">Book Meeting</a>' +
      '</div>' +

      /* desktop right cluster */
      '<div class="hidden md:flex items-center gap-3">' +
        '<span class="flex items-center gap-2 font-mono text-xs text-neon">' +
          '<span class="status-dot online"></span><span data-i18n="nav.available">AVAILABLE</span>' +
        '</span>' +
        '<button class="theme-toggle" id="theme-toggle" aria-label="Toggle color theme">' + sun + moon + '</button>' +
        '<div id="lang-switcher" class="lang-switch" role="button" tabindex="0" aria-label="Switch language">' +
          '<span class="lang-switch-option active" data-lang="en">EN</span>' +
          '<span class="lang-switch-option" data-lang="ar">AR</span>' +
          '<span class="lang-switch-thumb"></span>' +
        '</div>' +
        '<a href="/data/cv.pdf" download="Ahmed Hamdy.pdf" data-content="cv-link" class="btn-cv text-sm px-5 py-2 tracking-wide">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> CV' +
        '</a>' +
      '</div>' +

      /* mobile controls */
      '<div class="flex md:hidden items-center gap-2">' +
        '<button class="theme-toggle" id="theme-toggle-m" aria-label="Toggle color theme">' + sun + moon + '</button>' +
        '<button id="nav-toggle" class="text-gray-400 hover:text-neon transition-colors p-1" aria-label="Open menu">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>' +
        '</button>' +
      '</div>' +
    '</div>' +

    /* mobile menu */
    '<div id="mobile-menu" class="md:hidden border-t border-border-dim">' +
      '<div class="px-6 py-4 flex flex-col gap-1">' +
        '<a href="' + homeLink('#hero') + '" class="nav-m-link font-mono text-sm text-gray-300" data-i18n="nav.home">Home</a>' +

        '<button class="nav-m-acc font-mono text-sm text-gray-300" data-acc="projects">' +
          '<span data-i18n="nav.projects">Projects</span>' + chevron +
        '</button>' +
        '<div class="nav-m-sub" data-sub="projects">' + mobileSub(PROJECTS, '') + '</div>' +

        '<button class="nav-m-acc font-mono text-sm text-gray-300" data-acc="solutions">' +
          '<span data-i18n="nav.solutions">Solutions</span>' + chevron +
        '</button>' +
        '<div class="nav-m-sub" data-sub="solutions">' + mobileSub(INFRA, 'solution.html') + '</div>' +

        '<a href="about.html" class="nav-m-link font-mono text-sm text-gray-300" data-i18n="nav.about">About</a>' +
        '<a href="' + homeLink('#book') + '" class="nav-m-link font-mono text-sm text-neon" data-i18n="nav.book">Book Meeting</a>' +

        '<div class="flex items-center gap-3 pt-3 mt-2 border-t border-border-dim">' +
          '<button id="lang-switcher-mobile" class="btn-lang" aria-label="Switch language">AR</button>' +
          '<a href="/data/cv.pdf" download="Ahmed Hamdy.pdf" data-content="cv-link" class="btn-cv font-mono text-xs px-5 py-2.5 tracking-wide">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
            '<span data-i18n="hero.cta_cv"></span>' +
          '</a>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</nav>';

  mount.innerHTML = html;

  /* ── Active state (template pages) ───────────────────────── */
  if (isSolutionPage) {
    var di = mount.querySelector('[data-dd="solutions"] .nav-dd-trigger');
    if (di) di.classList.add('active');
  }

  /* ── Desktop dropdowns (hover + click + keyboard) ────────── */
  var dds = mount.querySelectorAll('.nav-dd');
  function closeAll(except) {
    dds.forEach(function (dd) {
      if (dd === except) return;
      dd.classList.remove('open');
      var t = dd.querySelector('.nav-dd-trigger');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  }
  dds.forEach(function (dd) {
    var trigger = dd.querySelector('.nav-dd-trigger');
    dd.addEventListener('mouseenter', function () { dd.classList.add('open'); trigger.setAttribute('aria-expanded', 'true'); closeAll(dd); });
    dd.addEventListener('mouseleave', function () { dd.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); });
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      var open = dd.classList.toggle('open');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      closeAll(dd);
    });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(null); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.nav-dd')) closeAll(null); });

  /* ── Mobile accordions ───────────────────────────────────── */
  mount.querySelectorAll('.nav-m-acc').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.dataset.acc;
      var sub = mount.querySelector('.nav-m-sub[data-sub="' + key + '"]');
      var open = btn.classList.toggle('open');
      if (sub) sub.classList.toggle('open', open);
    });
  });

  /* ── Theme toggle ────────────────────────────────────────── */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('ht-theme', t); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#f6f8fb' : '#0e0e0e');
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: t } }));
  }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    applyTheme(cur === 'light' ? 'dark' : 'light');
  }
  var tt = document.getElementById('theme-toggle');
  var ttm = document.getElementById('theme-toggle-m');
  if (tt) tt.addEventListener('click', toggleTheme);
  if (ttm) ttm.addEventListener('click', toggleTheme);

  /* ── i18n safety net: if main.js already applied before nav
        existed (shouldn't happen with sync inject), re-apply on
        the next langchange. main.js._apply re-queries the whole
        DOM, so injected nodes are covered automatically. ──── */
})();
