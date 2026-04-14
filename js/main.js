/* ============================================================
   HamdyTech — main.js
   Log streaming, metrics, animations, interactivity
   ============================================================ */

(function () {
  'use strict';

  /* ── Fake log entries ──────────────────────────────────── */
  const LOG_ENTRIES = [
    { level: 'ok',   msg: 'nginx: upstream 10.0.0.1:8080 health check PASS' },
    { level: 'ok',   msg: 'docker: service api_gateway scaled to 3 replicas' },
    { level: 'info', msg: 'proxmox: VM-104 (web-prod) CPU 11% MEM 2.1GB' },
    { level: 'ok',   msg: 'certbot: certificate renewed — 89 days remaining' },
    { level: 'info', msg: 'backup: snapshot pve-storage-01 → completed 4.1GB' },
    { level: 'ok',   msg: 'gitlab-ci: pipeline #3847 passed in 01m 22s' },
    { level: 'info', msg: 'netdata: avg response time 142ms (p99: 381ms)' },
    { level: 'ok',   msg: 'dns: zone hamdy.tech propagated (TTL 300)' },
    { level: 'warn', msg: 'disk: /dev/sda3 at 78% — monitor recommended' },
    { level: 'ok',   msg: 'firewall: ufw rules synced (42 active rules)' },
    { level: 'info', msg: 'ansible: playbook site.yml finished 14/14 hosts' },
    { level: 'ok',   msg: 'redis: replication lag 0ms — in sync' },
    { level: 'info', msg: 'cron: daily-report generated → /var/reports/' },
    { level: 'ok',   msg: 'traefik: TLS handshake 0.8ms (ECDHE-RSA-AES256)' },
    { level: 'ok',   msg: 'monitoring: all 9 services reporting HEALTHY' },
    { level: 'info', msg: 'k8s: pod rollout finished — 0 restarts in 24h' },
    { level: 'ok',   msg: 'postgres: vacuum analyze completed — 0 dead tuples' },
    { level: 'info', msg: 'cadvisor: container memory budget 68% utilized' },
    { level: 'warn', msg: 'swap: 12% usage — consider adding RAM' },
    { level: 'ok',   msg: 'haproxy: sticky sessions active — session store OK' },
  ];

  const LEVEL_CLASS = {
    ok:   'text-neon',
    info: 'text-blue-400',
    warn: 'text-amber-400',
    err:  'text-red-400',
  };
  const LEVEL_PREFIX = {
    ok:   '✓',
    info: '›',
    warn: '⚠',
    err:  '✗',
  };

  /* ── Pad time string ───────────────────────────────────── */
  function ts() {
    const n = new Date();
    const h = String(n.getHours()).padStart(2,'0');
    const m = String(n.getMinutes()).padStart(2,'0');
    const s = String(n.getSeconds()).padStart(2,'0');
    return `${h}:${m}:${s}`;
  }

  /* ── Start log streaming ───────────────────────────────── */
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
      // fade in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { line.classList.remove('opacity-0'); });
      });
      // keep max 12 lines
      const lines = el.children;
      if (lines.length > 12) lines[0].remove();
      // scroll to bottom
      el.parentElement.scrollTop = el.parentElement.scrollHeight;
    }

    // Pre-populate 6 lines
    for (let i = 0; i < 6; i++) {
      setTimeout(() => addLine(), i * 120);
    }
    // Stream new line every 3-5s
    setInterval(addLine, Math.random() * 2000 + 2800);
  }

  /* ── Live metric counters ──────────────────────────────── */
  function animateCounter(el, target, suffix) {
    let current = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = (suffix === '%' ? Math.round(current) : current.toFixed(1)) + suffix;
      if (current >= target) clearInterval(timer);
    }, 35);
  }

  /* ── Animate metric bars ───────────────────────────────── */
  function animateMetricBars() {
    document.querySelectorAll('[data-metric-width]').forEach(bar => {
      const w = bar.dataset.metricWidth;
      bar.style.width = w;
    });
  }

  /* ── IntersectionObserver reveals ─────────────────────── */
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
  }

  /* ── Staggered reveal for grid children ────────────────── */
  function initStagger() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const children = entry.target.querySelectorAll(':scope > .reveal');
        children.forEach((child, i) => {
          setTimeout(() => child.classList.add('visible'), i * 100);
        });
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('[data-stagger]').forEach(el => observer.observe(el));
  }

  /* ── Live uptime ticker ────────────────────────────────── */
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

  /* ── Mobile nav toggle ─────────────────────────────────── */
  function initMobileNav() {
    const btn  = document.getElementById('nav-toggle');
    const menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', () => {
      menu.classList.toggle('open');
      const icon = btn.querySelector('[data-icon]');
      if (icon) icon.dataset.icon = menu.classList.contains('open') ? 'close' : 'menu';
    });
  }

  /* ── Smooth nav link close on mobile ──────────────────── */
  function initNavLinks() {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => menu.classList.remove('open'));
    });
  }

  /* ── Pricing toggle: monthly / yearly ─────────────────── */
  function initPricingToggle() {
    const toggle    = document.getElementById('billing-toggle');
    const labels    = document.querySelectorAll('[data-billing]');
    const prices    = document.querySelectorAll('[data-price-monthly]');
    if (!toggle) return;
    toggle.addEventListener('change', () => {
      const yearly = toggle.checked;
      prices.forEach(p => {
        p.textContent = yearly ? p.dataset.priceYearly : p.dataset.priceMonthly;
      });
      labels.forEach(l => {
        l.classList.toggle('text-neon', l.dataset.billing === (yearly ? 'yearly' : 'monthly'));
        l.classList.toggle('text-gray-500', l.dataset.billing !== (yearly ? 'yearly' : 'monthly'));
      });
    });
  }

  /* ── Copy email to clipboard ───────────────────────────── */
  function initCopyEmail() {
    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.copy).then(() => {
          const orig = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = orig; }, 1800);
        });
      });
    });
  }

  /* ── Active nav highlight on scroll ───────────────────── */
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

  /* ── Init everything on DOMContentLoaded ──────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    startLogStream('log-stream');
    startUptimeTicker();
    initReveal();
    initStagger();
    initMobileNav();
    initNavLinks();
    initPricingToggle();
    initCopyEmail();
    initScrollSpy();

    // Animate metric bars after short delay
    setTimeout(animateMetricBars, 800);

    // Animate hero stat counters
    const counters = document.querySelectorAll('[data-counter]');
    counters.forEach(el => {
      const target = parseFloat(el.dataset.counter);
      const suffix = el.dataset.suffix || '';
      setTimeout(() => animateCounter(el, target, suffix), 600);
    });
  });
})();
