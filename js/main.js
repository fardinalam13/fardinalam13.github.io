/* =====================================================================
   Fardin Alam Alif — Portfolio interactions
   Theme toggle · mobile nav · active link · reveal · counters · typing
   ===================================================================== */
(function () {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle ---------- */
  const root = document.documentElement;
  const themeBtn = $('#themeToggle');
  const metaTheme = $('meta[name="theme-color"]');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#1B2922' : '#f6f8f3');
  }
  themeBtn.addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ---------- Sticky nav shadow + scroll progress + back-to-top ---------- */
  const nav = $('#nav');
  const progress = $('.scroll-progress');
  const toTop = $('#toTop');

  function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('is-scrolled', y > 10);
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    toTop.classList.toggle('is-visible', y > 600);
    setActiveLink();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------- Mobile menu ---------- */
  const burger = $('#navBurger');
  const links = $('#navLinks');

  function closeMenu() {
    burger.classList.remove('is-open');
    links.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
  }
  burger.addEventListener('click', () => {
    const open = !links.classList.contains('is-open');
    burger.classList.toggle('is-open', open);
    links.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  $$('a', links).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('click', e => {
    if (!nav.contains(e.target)) closeMenu();
  });

  /* ---------- Active nav link while scrolling ---------- */
  const navAnchors = $$('a[href^="#"]', links);
  const sections = navAnchors.map(a => $(a.getAttribute('href'))).filter(Boolean);

  function setActiveLink() {
    const offset = window.innerHeight * 0.35;
    let current = null;
    for (const sec of sections) {
      if (sec.getBoundingClientRect().top - offset <= 0) current = sec;
    }
    navAnchors.forEach(a => a.classList.toggle('is-active', current && a.getAttribute('href') === '#' + current.id));
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Animated counters ---------- */
  const counters = $$('.stat__num');
  const fmt = n => n.toLocaleString('en-US');

  function animateCount(el) {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = fmt(target) + suffix; return; }
    const duration = 1400;
    const start = performance.now();
    const step = now => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * eased)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); obs.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(c => cio.observe(c));
  } else {
    counters.forEach(animateCount);
  }

  /* ---------- Typing effect (hero) ---------- */
  const typedEl = $('#typed');
  const phrases = ['.NET Developer', 'Angular Developer', 'SQL Server Specialist', 'ERP Systems Builder'];
  if (reduceMotion) {
    typedEl.textContent = phrases[0];
  } else {
    let pi = 0, ci = 0, deleting = false;
    const tick = () => {
      const word = phrases[pi];
      ci += deleting ? -1 : 1;
      typedEl.textContent = word.slice(0, ci);
      let delay = deleting ? 45 : 85;
      if (!deleting && ci === word.length) { delay = 1800; deleting = true; }
      else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 350; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 600);
  }

  /* ---------- LeetCode stats (static snapshot, refreshed live when the API answers) ---------- */
  const LC_USER = 'fardin_31';
  const lcCard = $('#lcCard');
  const lcStatus = $('#lcStatus');
  let lcData = {
    totalSolved: 227, totalQuestions: 4105,
    easySolved: 108, totalEasy: 975,
    mediumSolved: 110, totalMedium: 2142,
    hardSolved: 9, totalHard: 988,
    ranking: 754323, submissions: 258
  };
  let lcVisible = false;

  function paintLC() {
    if (!lcCard) return;
    const d = lcData;
    $$('[data-lc]', lcCard).forEach(el => {
      const key = el.dataset.lc;
      if (!(key in d)) return;
      if (el.classList.contains('stat__num')) {
        el.dataset.count = d[key];
        if (lcVisible) el.textContent = fmt(d[key]);
      } else {
        el.textContent = fmt(d[key]);
      }
    });
    if (!lcVisible) return;
    // ring: composition of solved problems by difficulty (bars below show progress per pool)
    const C = 2 * Math.PI * 52, gap = 5;
    const solved = [d.easySolved, d.mediumSolved, d.hardSolved];
    const usable = C - gap * 3;
    let offset = 0;
    $$('.lc__arc', lcCard).forEach(arc => {
      const i = Number(arc.dataset.arc);
      const len = Math.max((solved[i] / d.totalSolved) * usable, 2);
      arc.style.strokeDasharray = `${len} ${C - len}`;
      arc.style.strokeDashoffset = -offset;
      offset += len + gap;
    });
    const pct = { easy: d.easySolved / d.totalEasy, med: d.mediumSolved / d.totalMedium, hard: d.hardSolved / d.totalHard };
    $$('.lc__bar-fill', lcCard).forEach(bar => { bar.style.width = (pct[bar.dataset.bar] * 100).toFixed(1) + '%'; });
  }

  if (lcCard) {
    paintLC();
    if ('IntersectionObserver' in window) {
      const lio = new IntersectionObserver((entries, obs) => {
        if (entries.some(e => e.isIntersecting)) { lcVisible = true; paintLC(); obs.disconnect(); }
      }, { threshold: 0.3 });
      lio.observe(lcCard);
    } else { lcVisible = true; paintLC(); }

    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    if (ctrl) setTimeout(() => ctrl.abort(), 9000);
    fetch(`https://leetcode-api-faisalshohag.vercel.app/${LC_USER}`, ctrl ? { signal: ctrl.signal } : {})
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        if (!d || !d.totalSolved) throw new Error('bad payload');
        const all = (d.totalSubmissions || []).find(s => s.difficulty === 'All');
        lcData = {
          totalSolved: d.totalSolved, totalQuestions: d.totalQuestions,
          easySolved: d.easySolved, totalEasy: d.totalEasy,
          mediumSolved: d.mediumSolved, totalMedium: d.totalMedium,
          hardSolved: d.hardSolved, totalHard: d.totalHard,
          ranking: d.ranking, submissions: all ? all.submissions : lcData.submissions
        };
        paintLC();
        if (lcStatus) lcStatus.textContent = 'Live from LeetCode · updated just now';
      })
      .catch(() => { if (lcStatus) lcStatus.textContent = 'Snapshot from 8 Nov 2026 (live refresh unavailable right now)'; });
  }

  /* ---------- Footer year ---------- */
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Subtle parallax on hero blobs (desktop, pointer only) ---------- */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    const blobs = $$('.blob');
    let raf = null;
    window.addEventListener('mousemove', e => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - .5) * 2;
        const y = (e.clientY / window.innerHeight - .5) * 2;
        blobs.forEach((b, i) => {
          const k = (i + 1) * 12;
          b.style.translate = `${x * k}px ${y * k}px`;
        });
        raf = null;
      });
    }, { passive: true });
  }

  onScroll();
})();
