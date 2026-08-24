/* ============================================================
   HamdyTech — main.js
   i18n, content loading, log streaming, metrics, animations
   ============================================================ */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     I18N — lightweight translation system
  ══════════════════════════════════════════════════════════ */
  const i18n = {
    lang: localStorage.getItem('ht-lang') || 'en',
    strings: {},

    async load(lang) {
      try {
        const res = await fetch('/data/' + lang + '.json');
        if (!res.ok) throw new Error('Failed to load ' + lang + '.json');
        this.strings = await res.json();
        this.lang = lang;
        localStorage.setItem('ht-lang', lang);
        this._apply();
      } catch (e) {
        console.warn('[i18n] Could not load language:', lang, e);
      }
    },

    t(key) {
      return this.strings[key] !== undefined ? this.strings[key] : key;
    },

    _apply() {
      const isRTL = this.lang === 'ar';
      document.documentElement.lang = this.lang;
      document.documentElement.dir  = isRTL ? 'rtl' : 'ltr';

      /* Plain text nodes */
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const val = this.t(el.dataset.i18n);
        if (val !== el.dataset.i18n) el.textContent = val;
      });

      /* HTML content (safe — values come from our own JSON) */
      document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const val = this.t(el.dataset.i18nHtml);
        if (val !== el.dataset.i18nHtml) el.innerHTML = val;
      });

      /* Pill lang switcher (desktop) */
      const pill = document.getElementById('lang-switcher');
      if (pill) {
        pill.classList.toggle('ar', isRTL);
        pill.querySelectorAll('.lang-switch-option').forEach(opt => {
          opt.classList.toggle('active', opt.dataset.lang === this.lang);
        });
      }

      /* Mobile lang button */
      const mobileBtn = document.getElementById('lang-switcher-mobile');
      if (mobileBtn) mobileBtn.textContent = isRTL ? 'EN' : 'AR';

      /* Notify content module so it can re-render project descriptions */
      document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: this.lang } }));
    },

    toggle() {
      this.load(this.lang === 'ar' ? 'en' : 'ar');
    }
  };

  /* ══════════════════════════════════════════════════════════
     CONTENT — loads content.json and populates dynamic areas
  ══════════════════════════════════════════════════════════ */
  const content = {
    data: {},

    async load() {
      try {
        const res = await fetch('/data/content.json');
        if (!res.ok) throw new Error('content.json not found');
        this.data = await res.json();
        this._renderContact();
        this._renderSocial();
        this._wireCV();
      } catch (e) {
        console.warn('[content] Could not load content.json:', e);
      }
    },

    _renderContact() {
      const { contact } = this.data;
      if (!contact) return;

      document.querySelectorAll('[data-content="email"]').forEach(el => {
        el.textContent = contact.email;
        if (el.tagName === 'A') el.href = 'mailto:' + contact.email;
      });
      document.querySelectorAll('[data-content="email-link"]').forEach(el => {
        el.href = 'mailto:' + contact.email;
      });
      document.querySelectorAll('[data-content="phone"]').forEach(el => {
        el.textContent = contact.phone;
      });
      document.querySelectorAll('[data-content="whatsapp-link"]').forEach(el => {
        el.href = 'https://wa.me/' + contact.whatsapp;
      });
      document.querySelectorAll('[data-content="tel-link"]').forEach(el => {
        el.href = 'tel:+' + contact.whatsapp;
      });
      /* Update copy button value only, leave text for i18n */
      document.querySelectorAll('[data-copy="email"]').forEach(el => {
        el.dataset.copyValue = contact.email;
        /* Only update textContent if the element hasn't been translated yet */
        if (!el.dataset.i18n) {
          el.textContent = contact.email + ' \u2197 copy';
        }
      });
    },

    _renderSocial() {
      const { social } = this.data;
      if (!social) return;
      document.querySelectorAll('[data-content="github-link"]').forEach(el => {
        el.href = social.github;
      });
      document.querySelectorAll('[data-content="linkedin-link"]').forEach(el => {
        el.href = social.linkedin;
      });
    },

    _wireCV() {
      const cv = this.data.cv || '/assets/cv.pdf';
      document.querySelectorAll('[data-content="cv-link"]').forEach(el => {
        el.href = cv;
        el.setAttribute('download', 'Ahmed Hamdy.pdf');
      });
    }
  };

  /* ── Fake log entries ──────────────────────────────────── */
  const LOG_ENTRIES = [
    { level: 'ok',   msg: 'nginx: upstream 10.0.0.1:8080 health check PASS' },
    { level: 'ok',   msg: 'docker: service api_gateway scaled to 3 replicas' },
    { level: 'info', msg: 'proxmox: VM-104 (web-prod) CPU 11% MEM 2.1GB' },
    { level: 'ok',   msg: 'certbot: certificate renewed — 89 days remaining' },
    { level: 'info', msg: 'backup: snapshot pve-storage-01 \u2192 completed 4.1GB' },
    { level: 'ok',   msg: 'gitlab-ci: pipeline #3847 passed in 01m 22s' },
    { level: 'info', msg: 'netdata: avg response time 142ms (p99: 381ms)' },
    { level: 'ok',   msg: 'dns: zone hamdyzone.icu propagated (TTL 300)' },
    { level: 'warn', msg: 'disk: /dev/sda3 at 78% \u2014 monitor recommended' },
    { level: 'ok',   msg: 'firewall: ufw rules synced (42 active rules)' },
    { level: 'info', msg: 'ansible: playbook site.yml finished 14/14 hosts' },
    { level: 'ok',   msg: 'redis: replication lag 0ms \u2014 in sync' },
    { level: 'info', msg: 'cron: daily-report generated \u2192 /var/reports/' },
    { level: 'ok',   msg: 'traefik: TLS handshake 0.8ms (ECDHE-RSA-AES256)' },
    { level: 'ok',   msg: 'monitoring: all 9 services reporting HEALTHY' },
    { level: 'info', msg: 'k8s: pod rollout finished \u2014 0 restarts in 24h' },
    { level: 'ok',   msg: 'postgres: vacuum analyze completed \u2014 0 dead tuples' },
    { level: 'info', msg: 'cadvisor: container memory budget 68% utilized' },
    { level: 'warn', msg: 'swap: 12% usage \u2014 consider adding RAM' },
    { level: 'ok',   msg: 'haproxy: sticky sessions active \u2014 session store OK' },
  ];

  const LEVEL_CLASS  = { ok: 'text-neon', info: 'text-blue-400', warn: 'text-amber-400', err: 'text-red-400' };
  const LEVEL_PREFIX = { ok: '\u2713', info: '\u203a', warn: '\u26a0', err: '\u2717' };

  function ts() {
    const n = new Date();
    return [n.getHours(), n.getMinutes(), n.getSeconds()]
      .map(v => String(v).padStart(2, '0')).join(':');
  }

  function startLogStream(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    let idx = 0;
    function addLine() {
      const entry = LOG_ENTRIES[idx % LOG_ENTRIES.length];
      idx++;
      const line = document.createElement('div');
      line.className = 'flex gap-2 opacity-0 transition-opacity duration-300';
      line.innerHTML =
        `<span class="text-gray-600 select-none shrink-0 font-mono">[${ts()}]</span>` +
        `<span class="${LEVEL_CLASS[entry.level]} shrink-0">${LEVEL_PREFIX[entry.level]}</span>` +
        `<span class="text-gray-300">${entry.msg}</span>`;
      el.appendChild(line);
      requestAnimationFrame(() => requestAnimationFrame(() => line.classList.remove('opacity-0')));
      if (el.children.length > 12) el.children[0].remove();
      el.parentElement.scrollTop = el.parentElement.scrollHeight;
    }
    for (let i = 0; i < 6; i++) setTimeout(addLine, i * 120);
    setInterval(addLine, Math.random() * 2000 + 2800);
  }

  function animateCounter(el, target, suffix) {
    let current = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = (suffix === '%' ? Math.round(current) : current.toFixed(1)) + suffix;
      if (current >= target) clearInterval(timer);
    }, 35);
  }

  function animateMetricBars() {
    document.querySelectorAll('[data-metric-width]').forEach(bar => {
      bar.style.width = bar.dataset.metricWidth;
    });
  }

  function initReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal, .reveal-left').forEach(el => observer.observe(el));
    window._revealObserver = observer;
  }

  function initStagger() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll(':scope > .reveal').forEach((child, i) => {
          setTimeout(() => child.classList.add('visible'), i * 100);
        });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('[data-stagger]').forEach(el => observer.observe(el));
  }

  function startUptimeTicker() {
    const el = document.getElementById('uptime-val');
    if (!el) return;
    let seconds = 47 * 24 * 3600 + 14 * 3600 + 22 * 60 + 11;
    function render() {
      const d = Math.floor(seconds / 86400);
      const h = Math.floor((seconds % 86400) / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      el.textContent = `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
      seconds++;
    }
    render();
    setInterval(render, 1000);
  }

  function initMobileNav() {
    const btn  = document.getElementById('nav-toggle');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', () => menu.classList.toggle('open'));
  }

  function initNavLinks() {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => menu.classList.remove('open'));
    });
  }

  function initCopyButtons() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-copy]');
      if (!btn) return;
      const value = btn.dataset.copyValue || btn.dataset.copy;
      if (!value) return;
      navigator.clipboard.writeText(value).then(() => {
        const orig = btn.textContent;
        btn.textContent = i18n.t('contact.copied') !== 'contact.copied'
          ? i18n.t('contact.copied') : 'Copied!';
        setTimeout(() => { btn.textContent = orig; }, 1800);
      });
    });
  }

  function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const links    = document.querySelectorAll('nav a[href^="#"]');
    if (!sections.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => {
            const active = l.getAttribute('href') === '#' + entry.target.id;
            l.classList.toggle('text-neon', active);
            l.classList.toggle('text-gray-400', !active);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => observer.observe(s));
  }

  /* ── Language switcher pill ───────────────────────────────── */
  function initLangSwitcher() {
    /* Desktop pill */
    const pill = document.getElementById('lang-switcher');
    if (pill) {
      pill.addEventListener('click', () => i18n.toggle());
      pill.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); i18n.toggle(); }
      });
    }
    /* Mobile button */
    const mobileBtn = document.getElementById('lang-switcher-mobile');
    if (mobileBtn) mobileBtn.addEventListener('click', () => i18n.toggle());
  }

  function initContribGrid() {
    const grid = document.getElementById('contrib-grid');
    if (!grid || grid.children.length) return;

    /* Generate a realistic-looking activity pattern */
    const weights = [0.3, 0.2, 0.18, 0.17, 0.15]; // level 0-4 probabilities
    function level() {
      const r = Math.random();
      let acc = 0;
      for (let i = 0; i < weights.length; i++) {
        acc += weights[i];
        if (r < acc) return i;
      }
      return 0;
    }

    for (let w = 0; w < 52; w++) {
      const col = document.createElement('div');
      col.className = 'flex flex-col gap-1';
      /* Simulate some "busy" weeks and some quiet weeks */
      const weekBias = Math.random();
      for (let d = 0; d < 7; d++) {
        const cell = document.createElement('div');
        const lv = weekBias > 0.6 ? Math.min(level() + 1, 4) : level();
        cell.className = 'contrib-cell level-' + lv;
        col.appendChild(cell);
      }
      grid.appendChild(col);
    }
  }

  /* ══════════════════════════════════════════════════════════
     LIVE MONITORING METRICS — realistic micro-fluctuations
  ══════════════════════════════════════════════════════════ */
  function initLiveMonMetrics() {
    /* Latency entries: id, base value, allowed variance */
    const AGENTS = [
      { id: 'mon-lat-1', base: 21, spread: 4 },
      { id: 'mon-lat-2', base: 18, spread: 3 },
      { id: 'mon-lat-3', base: 25, spread: 5 },
    ];

    /* Metrics/s fluctuates around 847 */
    const metricsEl = document.getElementById('mon-metrics-ps');
    const uptimeEl  = document.getElementById('mon-uptime-val');
    let uptimeBase  = 99.94; /* small decimal drift */

    function flashEl(el) {
      if (!el) return;
      el.style.transition = 'opacity 0.12s ease';
      el.style.opacity    = '0.45';
      setTimeout(() => { el.style.opacity = '1'; }, 130);
    }

    function tickLatency() {
      /* Update one random agent latency */
      const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
      const el    = document.getElementById(agent.id);
      if (!el) return;
      const delta  = (Math.random() * agent.spread * 2) - agent.spread;
      const newVal = Math.max(agent.base - agent.spread, Math.min(agent.base + agent.spread, Math.round(agent.base + delta)));
      el.textContent = newVal + 'ms';
      flashEl(el);
    }

    function tickMetrics() {
      if (!metricsEl) return;
      const base   = 847;
      const newVal = base + Math.floor(Math.random() * 21) - 10;
      metricsEl.textContent = newVal;
      flashEl(metricsEl);
    }

    function tickUptime() {
      if (!uptimeEl) return;
      /* Tiny random walk: ±0.001% */
      uptimeBase = Math.max(99.90, Math.min(99.99, uptimeBase + (Math.random() * 0.006 - 0.002)));
      uptimeEl.textContent = uptimeBase.toFixed(1) + '%';
    }

    /* Stagger intervals so they don't all fire at once */
    setInterval(tickLatency,  3200);
    setInterval(tickMetrics,  5100);
    setInterval(tickUptime,   7800);
  }

  /* ══════════════════════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', async () => {
    await content.load();
    await i18n.load(i18n.lang);

    startLogStream('log-stream');
    startUptimeTicker();
    /* Reveal + counters are owned by animations.js (GSAP/ScrollTrigger)
       when present. These run only as a fallback if that stack failed
       to load (window.HTAnim is then undefined). */
    if (!(window.HTAnim && window.HTAnim.enabled)) {
      initReveal();
      initStagger();
    }
    initMobileNav();
    initNavLinks();
    initCopyButtons();
    initScrollSpy();
    initLangSwitcher();

    setTimeout(animateMetricBars, 800);

    if (!(window.HTAnim && window.HTAnim.enabled)) {
      document.querySelectorAll('[data-counter]').forEach(el => {
        const target = parseFloat(el.dataset.counter);
        const suffix = el.dataset.suffix || '';
        setTimeout(() => animateCounter(el, target, suffix), 600);
      });
    }
  });

})();
