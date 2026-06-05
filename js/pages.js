/* ============================================================
   HamdyTech — pages.js
   Data-driven renderer for solution.html / about.html.
   Reads ?id=SLUG (solutions), loads the matching JSON, renders all
   sections into #page-root, and re-renders on language change.
   Projects are EXTERNAL live products and have NO internal pages —
   they are not handled here. Reuses the existing reveal/animation
   contract (window._revealObserver) and the design-system classes
   (.card, .tag, .arch-node, .terminal…).
   ============================================================ */
(function () {
  'use strict';

  var root = document.getElementById('page-root');
  if (!root) return;

  var TYPE = document.body.getAttribute('data-page'); // 'solution' | 'infrastructure' | 'about'
  var IS_SOLUTION = TYPE === 'solution' || TYPE === 'infrastructure';
  var IS_ABOUT = TYPE === 'about';
  var FILE = IS_ABOUT ? '/data/about.json' : '/data/infrastructure.json';
  var BACK = { url: 'solution.html?id=virtualization', key: 'tpl.all_solutions' };

  var STORE = null;   // page data (solutions / about)
  var STR = {};       // i18n chrome strings for current lang
  var lastLang = null;

  /* ── helpers ─────────────────────────────────────────────── */
  function lang() { try { return localStorage.getItem('ht-lang') || 'en'; } catch (e) { return 'en'; } }
  function pick(obj, base) {
    if (!obj) return '';
    var ar = obj[base + 'Ar'];
    return (lang() === 'ar' && ar) ? ar : (obj[base] || '');
  }
  function getSlug() { return new URLSearchParams(location.search).get('id'); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  /* i18n chrome label via main.js's i18n if available, else fallback text */
  var FALLBACK = {
    'tpl.overview': 'Overview', 'tpl.features': 'Features', 'tpl.stack': 'Tech Stack',
    'tpl.screenshots': 'Screenshots', 'tpl.architecture': 'Architecture',
    'tpl.technologies': 'Technologies', 'tpl.scalability': 'Scalability',
    'tpl.deliverables': 'What I Deliver', 'tpl.use_cases': 'Typical Use Cases',
    'tpl.architecture_overview': 'Architecture Overview', 'tpl.book_cta': 'Book a Meeting',
    'tpl.powered_by': 'Powered by',
    'tpl.security': 'Security', 'tpl.performance': 'Performance',
    'tpl.deployment': 'Deployment Flow', 'tpl.diagrams': 'Diagrams',
    'tpl.highlights': 'Technical Highlights', 'tpl.view_live': 'View Live',
    'tpl.coming_soon': 'Coming Soon', 'tpl.preview': 'PREVIEW',
    'tpl.back_home': '← Back to home', 'tpl.not_found': 'Page not found',
    'tpl.not_found_body': "We couldn't find what you were looking for.",
    'tpl.live': 'LIVE', 'tpl.all_projects': 'All Projects', 'tpl.all_infra': 'All Infrastructure',
    'tpl.all_solutions': 'All Solutions', 'tpl.business_value': 'Business Value', 'tpl.solution': 'Solution',
    'tpl.open_platform': 'Open Platform', 'tpl.visit_website': 'Visit Website', 'tpl.request_demo': 'Request Demo',
    'tpl.cta': 'Get Started', 'tpl.live_platform': 'Live Platform', 'tpl.open_project': 'Open Project',
    'tpl.uptime': 'uptime', 'tpl.live_metrics': 'Live Status & Metrics',
    'tpl.live_metrics_note': 'Real-time figures from the production deployment',
    'tpl.about_journey': 'Professional Journey', 'tpl.about_expertise': 'Core Expertise',
    'tpl.about_philosophy': 'Infrastructure Philosophy', 'tpl.about_stack': 'Tools & Technologies'
  };
  function L(key) {
    // Prefer the freshly-loaded i18n string; fall back to English defaults.
    // data-i18n is also emitted so main.js keeps it in sync on any later _apply.
    if (STR && STR[key] !== undefined) return STR[key];
    return FALLBACK[key] || key;
  }
  function lbl(key) { return '<span data-i18n="' + key + '">' + esc(L(key)) + '</span>'; }

  var toneClass = { neon: 'active', blue: 'blue', amber: 'amber', '': '' };

  /* external-link indicator icon */
  var EXT_ICON = '<svg class="ext-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';

  /* Anchor to a real, external live domain — always opens in a new,
     isolated tab with full referrer/opener protection. */
  function extAnchor(url, labelHtml, cls) {
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" ' +
      'class="' + cls + '">' + labelHtml + EXT_ICON + '</a>';
  }

  /* ── section scaffolding ─────────────────────────────────── */
  function section(labelKey, titleKey, inner, extra) {
    return '<section class="py-20 md:py-24 border-t border-border-dim ' + (extra || '') + '">' +
      '<div class="max-w-7xl mx-auto px-6">' +
        '<div class="reveal mb-10">' +
          (labelKey ? '<span class="section-label">' + lbl(labelKey) + '</span>' : '') +
          (titleKey ? '<h2 class="font-grotesk text-3xl md:text-4xl font-bold mt-3 text-white">' + lbl(titleKey) + '</h2>' : '') +
        '</div>' + inner +
      '</div></section>';
  }

  function archChain(nodes) {
    if (!nodes || !nodes.length) return '';
    var parts = [];
    nodes.forEach(function (n, i) {
      parts.push('<span class="arch-node ' + (toneClass[n.tone] || '') + '">' + esc(n.label) + '</span>');
      if (i < nodes.length - 1) parts.push('<span class="arch-line"></span>');
    });
    return '<div class="flex items-center gap-2 md:gap-3 flex-wrap">' + parts.join('') + '</div>';
  }

  /* Vertical / flow architecture stage — glowing animated node chain.
     orientation: 'v' (hero panel) or 'h' (centerpiece section). */
  function archStage(nodes, orientation) {
    if (!nodes || !nodes.length) return '';
    var vertical = orientation === 'v';
    var parts = nodes.map(function (n, i) {
      var tone = toneClass[n.tone] || '';
      var node = '<div class="arch-stage-node ' + tone + ' reveal" style="--ai:' + i + '">' +
        '<span class="arch-stage-dot"></span>' +
        '<span class="arch-stage-label">' + esc(n.label) + '</span>' +
      '</div>';
      var link = i < nodes.length - 1
        ? '<div class="arch-stage-link" aria-hidden="true" style="--ai:' + i + '"><span class="arch-stage-pulse"></span></div>'
        : '';
      return node + link;
    }).join('');
    return '<div class="arch-stage ' + (vertical ? 'arch-stage--v' : 'arch-stage--h') + '">' + parts + '</div>';
  }

  /* ── hero ─────────────────────────────────────────────────── */
  function hero(entry) {
    var h = entry.hero || {};
    var back = '<a href="' + BACK.url + '" class="font-mono text-xs text-gray-500 hover:text-neon transition-colors inline-flex items-center gap-1 mb-8">&#8592; ' + lbl(BACK.key) + '</a>';

    if (!IS_SOLUTION) {
      // About hero — single column.
      return '<section class="relative pt-32 md:pt-40 pb-16 overflow-hidden">' +
        '<div class="hero-grid-bg absolute inset-0" aria-hidden="true"></div>' +
        '<div class="max-w-7xl mx-auto px-6 relative">' + back +
          '<div class="flex items-center gap-3 mb-5 flex-wrap">' +
            '<span class="text-3xl" style="color:var(--neon)">' + esc(entry.icon || '') + '</span>' +
            '<span class="hero-eyebrow font-mono text-xs tracking-widest text-gray-400">' + esc(pick(h, 'eyebrow')) + '</span>' +
            '<span class="tag neon">Founder &amp; Architect</span>' +
          '</div>' +
          '<h1 class="font-grotesk text-4xl md:text-6xl font-bold text-white leading-tight max-w-4xl">' + esc(pick(h, 'title')) + '</h1>' +
          '<p class="hero-sub text-gray-400 mt-6 max-w-2xl leading-relaxed">' + esc(pick(h, 'tagline')) + '</p>' +
        '</div></section>';
    }

    // Solution hero — two columns: copy left, live architecture viz right.
    var poweredBy = entry.poweredBy
      ? '<div class="powered-by reveal">' +
          '<span class="powered-by-label" data-i18n="tpl.powered_by">' + esc(L('tpl.powered_by')) + '</span>' +
          '<span class="powered-by-tech">' + esc(entry.poweredBy) + '</span>' +
        '</div>'
      : '';
    var viz = '<div class="sol-hero-viz reveal-left">' +
      '<div class="sol-hero-viz-head">' +
        '<span class="status-dot online"></span>' +
        '<span class="font-mono text-xs tracking-widest text-gray-400" data-i18n="tpl.architecture_overview">' + esc(L('tpl.architecture_overview')) + '</span>' +
      '</div>' +
      archStage((entry.architecture || {}).nodes, 'v') +
    '</div>';

    return '<section class="relative pt-32 md:pt-40 pb-16 overflow-hidden">' +
      '<div class="hero-grid-bg absolute inset-0" aria-hidden="true"></div>' +
      '<div class="max-w-7xl mx-auto px-6 relative">' + back +
        '<div class="sol-hero-grid">' +
          '<div class="sol-hero-copy">' +
            '<div class="flex items-center gap-3 mb-5 flex-wrap">' +
              '<span class="text-3xl" style="color:var(--neon)">' + esc(entry.icon || '') + '</span>' +
              '<span class="hero-eyebrow font-mono text-xs tracking-widest text-gray-400">' + esc(pick(h, 'eyebrow')) + '</span>' +
              '<span class="tag neon">' + lbl('tpl.solution') + '</span>' +
            '</div>' +
            poweredBy +
            '<h1 class="font-grotesk text-4xl md:text-5xl font-bold text-white leading-tight mt-5">' + esc(pick(h, 'title')) + '</h1>' +
            '<p class="hero-sub text-gray-400 mt-6 leading-relaxed">' + esc(pick(h, 'tagline')) + '</p>' +
            '<div class="flex flex-wrap gap-3 mt-9 reveal">' +
              intAnchor('index.html#book', '<span data-i18n="tpl.book_cta">' + esc(L('tpl.book_cta')) + '</span>',
                'btn-cta btn-live text-sm px-7 py-3.5 tracking-wide inline-flex') +
            '</div>' +
          '</div>' + viz +
        '</div>' +
      '</div></section>';
  }

  /* ── Business Value: outcome-led intro + outcome cards ───── */
  function businessValue(entry) {
    var bv = entry.businessValue || {};
    var body = pick(bv, 'body');
    var outs = entry.outcomes || [];
    if (!body && !outs.length) return '';
    var cards = outs.map(function (o) {
      return '<div class="card bv-card reveal p-7">' +
        '<div class="bv-icon">' + esc(o.icon || '↗') + '</div>' +
        '<h3 class="font-grotesk text-lg font-bold text-white mt-5 mb-2">' + esc(pick(o, 'title')) + '</h3>' +
        '<p class="text-gray-400 text-sm leading-relaxed">' + esc(pick(o, 'desc')) + '</p>' +
      '</div>';
    }).join('');
    return section(null, 'tpl.business_value',
      (body ? '<p class="text-gray-300 text-lg leading-relaxed max-w-3xl reveal mb-10">' + esc(body) + '</p>' : '') +
      (outs.length ? '<div class="grid sm:grid-cols-3 gap-6">' + cards + '</div>' : ''));
  }

  /* ── What I Deliver: titled, explained deliverable cards ──── */
  function deliverables(entry) {
    var list = entry.deliverables || [];
    if (!list.length) return '';
    var items = list.map(function (d) {
      return '<div class="card deliver-card reveal p-6">' +
        '<div class="deliver-top">' +
          '<span class="deliver-check">&#10003;</span>' +
          '<h3 class="font-grotesk font-semibold text-white">' + esc(pick(d, 'title')) + '</h3>' +
        '</div>' +
        '<p class="text-gray-400 text-sm leading-relaxed mt-3">' + esc(pick(d, 'desc')) + '</p>' +
      '</div>';
    }).join('');
    return section(null, 'tpl.deliverables', '<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">' + items + '</div>');
  }

  /* ── Technologies: premium tag pills (existing .tag system) ─ */
  function technologies(entry) {
    var list = entry.technologies || [];
    if (!list.length) return '';
    var tags = list.map(function (s, i) {
      var tone = i % 2 === 0 ? 'neon' : 'blue';
      var role = esc(pick(s, 'role'));
      return '<span class="tag ' + tone + ' tech-tag"' + (role ? ' title="' + role + '"' : '') + '>' + esc(s.name) + '</span>';
    }).join('');
    return section(null, 'tpl.technologies', '<div class="flex flex-wrap gap-3 reveal">' + tags + '</div>');
  }

  /* ── Architecture Overview: the visual centerpiece ───────── */
  function architecture(entry) {
    var a = entry.architecture || {};
    var desc = pick(a, 'description');
    if (!desc && !(a.nodes && a.nodes.length)) return '';
    return section(null, 'tpl.architecture_overview',
      '<div class="card reveal p-7 md:p-10 arch-overview">' +
        '<div class="arch-stage-wrap reveal">' + archStage(a.nodes, 'h') + '</div>' +
        (desc ? '<p class="text-gray-400 leading-relaxed mt-10 max-w-3xl mx-auto text-center arch-desc">' + esc(desc) + '</p>' : '') +
      '</div>');
  }

  /* ── Typical Use Cases: who this is for (cards) ──────────── */
  function useCases(entry) {
    var list = entry.useCases || [];
    if (!list.length) return '';
    var fallbackIco = ['◆', '▣', '◎', '⊞', '✦', '▤', '■', '⇄'];
    var cards = list.map(function (u, i) {
      var d = pick(u, 'desc');
      return '<div class="card reveal p-6">' +
        '<div class="text-2xl mb-3" style="color:var(--neon)">' + esc(u.icon || fallbackIco[i % fallbackIco.length]) + '</div>' +
        '<h3 class="font-grotesk font-semibold text-white' + (d ? ' mb-2' : '') + '">' + esc(pick(u, 'title')) + '</h3>' +
        (d ? '<p class="text-gray-400 text-sm leading-relaxed">' + esc(d) + '</p>' : '') +
      '</div>';
    }).join('');
    return section(null, 'tpl.use_cases', '<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">' + cards + '</div>');
  }

  function highlights(entry) {
    var list = entry.highlights || [];
    if (!list.length) return '';
    var cards = list.map(function (h) {
      return '<div class="card hl-card reveal p-6">' +
        '<span class="hl-icon">' + esc(h.icon || '✓') + '</span>' +
        '<div class="hl-body">' +
          '<h3 class="font-grotesk font-semibold text-white mb-1.5">' + esc(pick(h, 'title')) + '</h3>' +
          '<p class="text-gray-400 text-sm leading-relaxed">' + esc(pick(h, 'desc')) + '</p>' +
        '</div>' +
      '</div>';
    }).join('');
    return section(null, 'tpl.highlights', '<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">' + cards + '</div>');
  }

  /* internal (non-external) CTA anchor */
  function intAnchor(url, labelHtml, cls) {
    return '<a href="' + esc(url) + '" class="' + cls + '">' + labelHtml + '</a>';
  }

  /* Solution / about CTA — single primary button (consulting → booking). */
  function cta(entry) {
    var c = entry.cta || {};
    var heading = pick(c, 'heading');
    if (!heading) return '';
    var url = c.primaryUrl || 'index.html#book';
    var external = /^https?:/.test(url);
    var label = esc(pick(c, 'primaryLabel') || L('tpl.cta'));
    var btns = external
      ? extAnchor(url, '<span>' + label + '</span>', 'btn-cta btn-live text-base px-9 py-4 tracking-wide inline-flex')
      : intAnchor(url, label, 'btn-cta btn-live text-base px-9 py-4 tracking-wide inline-flex');
    return '<section class="py-28 border-t border-border-dim relative overflow-hidden sol-cta">' +
      '<div class="sol-cta-glow" aria-hidden="true"></div>' +
      '<div class="max-w-4xl mx-auto px-6 text-center reveal relative">' +
        '<h2 class="font-grotesk text-3xl md:text-5xl font-bold text-white mb-5">' + esc(heading) + '</h2>' +
        '<p class="text-gray-300 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">' + esc(pick(c, 'body')) + '</p>' +
        '<div class="flex flex-wrap gap-3 justify-center">' + btns + '</div>' +
      '</div></section>';
  }

  function notFound() {
    return '<section class="min-h-screen flex items-center justify-center px-6 pt-24">' +
      '<div class="card p-10 max-w-lg text-center">' +
        '<div class="section-label justify-center">404</div>' +
        '<h1 class="font-grotesk text-3xl font-bold text-white mt-3 mb-4">' + lbl('tpl.not_found') + '</h1>' +
        '<p class="text-gray-400 mb-8">' + lbl('tpl.not_found_body') + '</p>' +
        '<a href="index.html" class="btn-ghost font-mono text-sm px-6 py-3 inline-flex">' + lbl('tpl.back_home') + '</a>' +
      '</div></section>';
  }

  /* ── about page (single object, not slug-keyed) ──────────── */
  function aboutHero(a) {
    var h = a.hero || {};
    return '<section class="relative pt-32 md:pt-40 pb-16 overflow-hidden">' +
      '<div class="hero-grid-bg absolute inset-0" aria-hidden="true"></div>' +
      '<div class="max-w-7xl mx-auto px-6 relative">' +
        '<div class="flex items-center gap-3 mb-5 flex-wrap">' +
          '<span class="hero-eyebrow font-mono text-xs tracking-widest text-gray-400">' + esc(pick(h, 'eyebrow')) + '</span>' +
          '<span class="tag neon">Founder &amp; Architect</span>' +
        '</div>' +
        '<h1 class="font-grotesk text-4xl md:text-6xl font-bold text-white leading-tight max-w-4xl">' + esc(pick(h, 'title')) + '</h1>' +
        '<p class="hero-sub text-gray-400 mt-6 max-w-2xl leading-relaxed">' + esc(pick(h, 'tagline')) + '</p>' +
      '</div></section>';
  }

  function aboutExpertise(a) {
    var list = a.expertise || [];
    if (!list.length) return '';
    var cards = list.map(function (f) {
      return '<div class="card reveal p-6">' +
        '<div class="text-2xl mb-4" style="color:var(--neon)">' + esc(f.icon || '') + '</div>' +
        '<h3 class="font-grotesk font-semibold text-white mb-2">' + esc(pick(f, 'title')) + '</h3>' +
        '<p class="text-gray-400 text-sm leading-relaxed">' + esc(pick(f, 'desc')) + '</p>' +
      '</div>';
    }).join('');
    return section(null, 'tpl.about_expertise', '<div class="grid md:grid-cols-3 gap-6">' + cards + '</div>');
  }

  function aboutJourney(a) {
    var list = a.journey || [];
    if (!list.length) return '';
    var items = list.map(function (s) {
      return '<div class="card reveal p-6">' +
        '<div class="font-mono text-xs text-neon mb-3">' + esc(s.period || '') + '</div>' +
        '<h3 class="font-grotesk font-semibold text-white mb-2">' + esc(pick(s, 'title')) + '</h3>' +
        '<p class="text-gray-400 text-sm leading-relaxed">' + esc(pick(s, 'desc')) + '</p>' +
      '</div>';
    }).join('');
    return section(null, 'tpl.about_journey', '<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">' + items + '</div>');
  }

  function aboutStack(a) {
    var list = a.stack || [];
    if (!list.length) return '';
    var rows = list.map(function (s) {
      return '<div class="card reveal p-5 flex items-center justify-between gap-4">' +
        '<span class="font-grotesk font-semibold text-white">' + esc(s.name) + '</span>' +
        '<span class="font-mono text-xs text-gray-500 text-right">' + esc(pick(s, 'role')) + '</span>' +
      '</div>';
    }).join('');
    return section(null, 'tpl.about_stack', '<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">' + rows + '</div>');
  }

  function aboutPage(a) {
    return aboutHero(a) +
      (pick(a.intro, 'body') ? section(null, 'tpl.overview',
        '<p class="text-gray-300 text-lg leading-relaxed max-w-3xl reveal">' + esc(pick(a.intro, 'body')) + '</p>') : '') +
      aboutExpertise(a) +
      (pick(a.philosophy, 'body') ? section(null, 'tpl.about_philosophy',
        '<p class="text-gray-300 text-lg leading-relaxed max-w-3xl reveal">' + esc(pick(a.philosophy, 'body')) + '</p>') : '') +
      aboutJourney(a) +
      aboutStack(a) +
      cta(a);
  }

  /* ── compose (solution pages) — premium consulting layout ── */
  function renderEntry(entry) {
    return hero(entry) +        // 1. Hero
      businessValue(entry) +    // 2. Business Value (outcomes)
      deliverables(entry) +     // 3. What I Deliver
      technologies(entry) +     // 4. Technologies
      architecture(entry) +     // 5. Architecture Overview
      useCases(entry) +         // 6. Typical Use Cases
      highlights(entry) +       // 7. Technical Highlights
      cta(entry);               // 8. Call To Action
  }

  function afterRender() {
    root.querySelectorAll('.reveal, .reveal-left').forEach(function (el) {
      if (window._revealObserver) window._revealObserver.observe(el);
      else el.classList.add('visible'); // fallback if the GSAP shim isn't ready yet
    });
    if (window.ScrollTrigger) setTimeout(function () { window.ScrollTrigger.refresh(); }, 80);
  }

  function renderAll() {
    if (IS_ABOUT) {
      if (!STORE) { root.innerHTML = notFound(); afterRender(); lastLang = lang(); return; }
      root.innerHTML = aboutPage(STORE);
      var ta = pick(STORE.hero, 'title');
      if (ta) document.title = ta + ' — HamdyTech';
      afterRender();
      lastLang = lang();
      return;
    }
    var slug = getSlug();
    var entry = STORE && slug ? STORE[slug] : null;
    if (!entry) { root.innerHTML = notFound(); afterRender(); lastLang = lang(); return; }
    root.innerHTML = renderEntry(entry);
    // update document title from the localized hero title
    var t = pick(entry.hero, 'title');
    if (t) document.title = t + ' — HamdyTech';
    afterRender();
    lastLang = lang();
  }

  function fetchJSON(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error('load failed'); return r.json(); });
  }
  function loadStrings() {
    return fetchJSON('/data/' + lang() + '.json')
      .then(function (s) { STR = s || {}; })
      .catch(function () { STR = {}; });
  }
  function load() {
    Promise.all([
      fetchJSON(FILE).then(function (d) { STORE = d; }).catch(function () { STORE = null; }),
      loadStrings()
    ]).then(renderAll);
  }

  /* boot + re-render on language change (guard redundant first fire) */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
  document.addEventListener('langchange', function (e) {
    var l = (e.detail && e.detail.lang) || lang();
    if (l === lastLang) return;
    loadStrings().then(renderAll);
  });

  window.HTPages = { reload: renderAll };
})();
