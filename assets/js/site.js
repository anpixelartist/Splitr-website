// ── Site config: change these in one place ───────────────────────────────────
// appUrl:  where the Splitr web app is deployed (Firebase Hosting).
// mcpUrl:  the AI connector's endpoint (Cloudflare Worker + /mcp).
// connectorLive: set to false to show "In development" badges and callouts
//                instead of "Available", e.g. during an outage.
const SPLITR = {
  appUrl: 'https://splitr-bills.web.app',
  repoUrl: 'https://github.com/anpixelartist/Splitr',
  mcpUrl: 'https://splitr-mcp.splitr.workers.dev/mcp',
  connectorLive: true,
};

const issues = `${SPLITR.repoUrl}/issues/new`;
const LINKS = {
  app: SPLITR.appUrl,
  repo: SPLITR.repoUrl,
  bug: `${issues}?labels=bug&title=${encodeURIComponent('Bug: ')}`,
  feature: `${issues}?labels=enhancement&title=${encodeURIComponent('Idea: ')}`,
  question: `${issues}?labels=question&title=${encodeURIComponent('Question: ')}`,
  security: `${SPLITR.repoUrl}/security/advisories/new`,
  deployment: `${SPLITR.repoUrl}/blob/main/DEPLOYMENT.md`,
  rules: `${SPLITR.repoUrl}/blob/main/firestore.rules`,
  license: `${SPLITR.repoUrl}/blob/main/LICENSE`,
  mcpReadme: `${SPLITR.repoUrl}/blob/main/mcp/README.md`,
};

// <a data-link="app"> gets its href from LINKS
document.querySelectorAll('[data-link]').forEach((a) => {
  const href = LINKS[a.dataset.link];
  if (href) a.href = href;
});
document.querySelectorAll('[data-mcp-url]').forEach((el) => { el.textContent = SPLITR.mcpUrl; });
document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

document.querySelectorAll('[data-connector-status]').forEach((el) => {
  el.textContent = SPLITR.connectorLive ? 'Available' : 'In development';
  el.classList.toggle('green', SPLITR.connectorLive);
  el.classList.toggle('amber', !SPLITR.connectorLive);
});
document.querySelectorAll('[data-when-live]').forEach((el) => { el.hidden = !SPLITR.connectorLive; });
document.querySelectorAll('[data-when-not-live]').forEach((el) => { el.hidden = SPLITR.connectorLive; });

// ── Brand: "Splitr" is never shown in capitals, even inside uppercase labels ─
{
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (/Splitr/.test(n.nodeValue)
      && !n.parentElement.closest('.brand-name, script, style, code, pre')
      && getComputedStyle(n.parentElement).textTransform !== 'none'
      ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((n) => {
    const parts = n.nodeValue.split('Splitr');
    const frag = document.createDocumentFragment();
    parts.forEach((part, i) => {
      if (i) {
        const span = document.createElement('span');
        span.className = 'brand-name';
        span.textContent = 'Splitr';
        frag.appendChild(span);
      }
      if (part) frag.appendChild(document.createTextNode(part));
    });
    n.replaceWith(frag);
  });
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Mobile nav: bottom sheet with backdrop ───────────────────────────────────
const toggle = document.querySelector('.nav-toggle');
const links = document.querySelector('.nav-links');
if (toggle && links) {
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  document.body.appendChild(backdrop);
  const setOpen = (open) => {
    links.classList.toggle('open', open);
    backdrop.classList.toggle('open', open);
    document.documentElement.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) links.querySelector('a')?.focus({ preventScroll: true });
  };
  toggle.addEventListener('click', () => setOpen(!links.classList.contains('open')));
  backdrop.addEventListener('click', () => setOpen(false));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && links.classList.contains('open')) { setOpen(false); toggle.focus(); }
  });
}

// ── Tabs (install instructions); preselect the visitor's platform ────────────
function detectPlatform() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}
document.querySelectorAll('[role="tablist"]').forEach((list) => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      const next = tabs[(i + d + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });
  const preferred = list.dataset.autoselect === 'platform'
    ? tabs.find((t) => t.dataset.platform === detectPlatform())
    : null;
  select(preferred || tabs[0]);
});

// ── Copy buttons on <pre> blocks ─────────────────────────────────────────────
document.querySelectorAll('pre[data-copy]').forEach((pre) => {
  const wrap = document.createElement('div');
  wrap.className = 'copy-wrap';
  pre.replaceWith(wrap);
  wrap.appendChild(pre);
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.type = 'button';
  btn.textContent = 'Copy';
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pre.innerText.trim());
      btn.textContent = 'Copied';
    } catch {
      btn.textContent = 'Press Ctrl+C';
    }
    setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
  });
  wrap.appendChild(btn);
});

// ── Docs table of contents: highlight the section in view ────────────────────
// On phones the TOC is a sticky bar showing the current section; tap to expand.
const toc = document.querySelector('.toc');
const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
let tocCurrent = null;
if (toc && tocLinks.length) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'toc-toggle';
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<small>On this page</small><span></span>'
    + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  tocCurrent = btn.querySelector('span');
  tocCurrent.textContent = tocLinks[0].textContent;
  toc.prepend(btn);
  toc.classList.add('enhanced');
  btn.addEventListener('click', () => {
    const open = toc.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  toc.addEventListener('click', (e) => {
    if (e.target.closest('a')) { toc.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
  });
}
if (tocLinks.length && 'IntersectionObserver' in window) {
  const byId = new Map(tocLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      tocLinks.forEach((a) => a.classList.remove('active'));
      const link = byId.get(entry.target.id);
      link?.classList.add('active');
      if (link && tocCurrent) tocCurrent.textContent = link.textContent;
    });
  }, { rootMargin: '-80px 0px -70% 0px' });
  byId.forEach((_, id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
}

// ── Hero: notifications pop in and the balances update ───────────────────────
const notif = document.querySelector('.notif');
if (notif) {
  const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
  const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
  const fields = {
    balance: { el: document.querySelector('[data-amount="balance"]'), fmt: inr },
    priya: { el: document.querySelector('[data-amount="priya"]'), fmt: inr0 },
    rahul: { el: document.querySelector('[data-amount="rahul"]'), fmt: inr0 },
  };
  const start = { balance: 2350, priya: 1600, rahul: 750 };
  // Each event moves the numbers the way the app would
  const events = [
    { color: '#16a34a', icon: '✓', title: 'Priya paid you ₹500', sub: 'Goa Trip · confirmed', set: { balance: 1850, priya: 1100 } },
    { color: '#2563eb', icon: '+', title: 'Rahul added “Fuel”', sub: '₹800 · split 4 ways', set: { balance: 1650, rahul: 550 } },
    { color: '#b45309', icon: 'A', title: 'Ananya joined Goa Trip', sub: 'Claimed their spot · balances carried over', set: {} },
  ];
  const values = { ...start };
  const tween = (key, to) => {
    const f = fields[key];
    const from = values[key];
    values[key] = to;
    if (!f.el) return;
    if (reducedMotion) { f.el.textContent = f.fmt.format(to); return; }
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 700);
      f.el.textContent = f.fmt.format(Math.round(from + (to - from) * (1 - (1 - p) ** 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const show = (ev) => {
    notif.querySelector('.notif-icon').textContent = ev.icon;
    notif.querySelector('.notif-icon').style.background = ev.color;
    notif.querySelector('.notif-title').textContent = ev.title;
    notif.querySelector('.notif-sub').textContent = ev.sub;
    notif.classList.add('show');
    Object.entries(ev.set).forEach(([k, v]) => tween(k, v));
  };

  if (reducedMotion) {
    show(events[0]);
  } else {
    // Loop only while the hero is on screen and the tab is visible
    let i = 0;
    let timer = null;
    let visible = true;
    const tick = () => {
      notif.classList.remove('show');
      timer = setTimeout(() => {
        if (i === events.length) { i = 0; Object.entries(start).forEach(([k, v]) => tween(k, v)); }
        show(events[i++]);
        timer = setTimeout(tick, 3200);
      }, i === events.length ? 900 : 450);
    };
    const run = () => { if (!timer && visible && !document.hidden) timer = setTimeout(tick, 1200); };
    const stop = () => { clearTimeout(timer); timer = null; };
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? run() : stop(); })
      .observe(document.querySelector('.hero'));
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : run()));
  }
}

// ── Chat demo plays once when scrolled into view ─────────────────────────────
const chat = document.querySelector('.chat');
if (chat && !reducedMotion && 'IntersectionObserver' in window) {
  const items = [...chat.querySelectorAll(':scope > .bubble, :scope > .tool-call')];
  chat.classList.add('playing');
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    let t = 300;
    items.forEach((item) => {
      const isAi = item.classList.contains('ai');
      setTimeout(() => {
        item.classList.add('shown');
        if (isAi) {
          item.classList.add('typing');
          setTimeout(() => item.classList.remove('typing'), 900);
        }
      }, t);
      t += isAi ? 1500 : item.classList.contains('tool-call') ? 600 : 800;
    });
  }, { threshold: 0.4 });
  io.observe(chat);
}

// ── Wordmark: letters rise in, then "Splitr" splits along the logo's diagonal ─
const wordmark = document.querySelector('[data-wordmark]');
if (wordmark) {
  const text = wordmark.textContent.trim();
  const letters = [...text].map((c, i) =>
    `<span class="wm-ch${i === text.length - 1 ? ' wm-accent' : ''}" style="--i:${i}">${c}</span>`).join('');
  wordmark.innerHTML = `<span class="sr-only">${text}</span>`
    + `<span class="wm-layer wm-top" aria-hidden="true">${letters}</span>`
    + `<span class="wm-layer wm-bottom" aria-hidden="true">${letters}</span>`;

  if (!reducedMotion) {
    const split = () => {
      if (wordmark.classList.contains('cut')) return;
      wordmark.classList.add('cut', 'split');
      setTimeout(() => wordmark.classList.remove('split'), 750);
      setTimeout(() => wordmark.classList.remove('cut'), 1400);
    };
    wordmark.classList.add('intro');
    requestAnimationFrame(() => requestAnimationFrame(() => wordmark.classList.add('play')));
    setTimeout(() => { wordmark.classList.remove('intro', 'play'); split(); }, 1200);
    wordmark.addEventListener('pointerenter', split);
    wordmark.addEventListener('click', split);
    // Repeat now and then, only while the hero is on screen
    let loop = null;
    new IntersectionObserver(([e]) => {
      clearInterval(loop);
      if (e.isIntersecting) loop = setInterval(() => { if (!document.hidden) split(); }, 6500);
    }).observe(wordmark);
  }
}

// ── Use-case marquee: duplicate once for a seamless loop, pause off-screen ───
const marquee = document.querySelector('.marquee');
if (marquee && !reducedMotion) {
  const track = marquee.querySelector('.marquee-track');
  [...track.children].forEach((li) => {
    const copy = li.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.appendChild(copy);
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => marquee.classList.toggle('paused', !e.isIntersecting)).observe(marquee);
  }
}

// ── Statement: words light up as it scrolls through the screen ───────────────
const scrollText = document.querySelector('[data-scroll-text]');
if (scrollText && !reducedMotion && 'IntersectionObserver' in window) {
  const words = scrollText.textContent.trim().split(/\s+/);
  scrollText.setAttribute('aria-label', scrollText.textContent.trim());
  scrollText.innerHTML = words
    .map((w) => `<span class="sw${/fair|good|part/.test(w) ? ' hl' : ''}" aria-hidden="true">${w}</span>`)
    .join(' ');
  const spans = [...scrollText.querySelectorAll('.sw')];
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = scrollText.getBoundingClientRect();
    // 0 when the text's top reaches 85% down the screen, 1 when it reaches 35%
    const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (innerHeight * 0.5)));
    const lit = Math.round(p * spans.length);
    spans.forEach((s, i) => s.classList.toggle('lit', i < lit));
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { addEventListener('scroll', onScroll, { passive: true }); update(); }
    else removeEventListener('scroll', onScroll);
  }).observe(scrollText);
}

// ── Fade sections up as they scroll in (below the fold only) ─────────────────
if (!reducedMotion && 'IntersectionObserver' in window) {
  const targets = [...document.querySelectorAll(
    'main .section-head, .bento-card, main .grid > .card, .step, .split > div:first-child, .chat, .install-steps, .faq details, .cta-box'
  )].filter((el) => el.getBoundingClientRect().top > window.innerHeight);
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  targets.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => targets.includes(c));
    el.style.setProperty('--d', `${Math.min(siblings.indexOf(el), 5) * 70}ms`);
    el.classList.add('reveal');
    io.observe(el);
  });

  // Section headings rise word by word
  targets.filter((el) => el.matches('.section-head')).forEach((head) => {
    const h2 = head.querySelector('h2');
    if (!h2 || h2.children.length) return;
    h2.setAttribute('aria-label', h2.textContent);
    h2.innerHTML = h2.textContent.split(' ')
      .map((w, i) => `<span class="hw" style="--w:${i}" aria-hidden="true">${w}</span>`).join(' ');
  });

  // Bento previews act themselves out once their card is in view
  targets.filter((el) => el.matches('.bento-card')).forEach((card) => {
    const parts = card.querySelectorAll(
      '.mini, .split-arrow, .code-boxes span, .chips span, .settle-viz .col > span, .status-row > *, .offline-viz > *'
    );
    parts.forEach((part, i) => {
      part.classList.add('pop');
      part.style.setProperty('--pd', `${200 + i * 90}ms`);
    });
    card.querySelectorAll('.strike').forEach((s, i) => s.style.setProperty('--sd', `${700 + i * 160}ms`));
  });

  // Steps: draw the line connecting the numbers
  const steps = document.querySelector('.steps');
  if (steps && steps.getBoundingClientRect().top > window.innerHeight) {
    steps.classList.add('draw');
    const sio = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { steps.classList.add('drawn'); sio.disconnect(); }
    }, { rootMargin: '0px 0px -15% 0px' });
    sio.observe(steps);
  }
}

// ── Phones: sticky "Open Splitr" bar once the hero buttons scroll away ───────
const heroButtons = document.querySelector('.hero .btn-row');
if (heroButtons && 'IntersectionObserver' in window) {
  const bar = document.createElement('div');
  bar.className = 'mobile-cta';
  bar.innerHTML = `<a class="btn btn-secondary" href="#install">Install</a><a class="btn btn-primary" href="${LINKS.app}">Open Splitr</a>`;
  bar.inert = true;
  document.body.appendChild(bar);
  document.body.classList.add('has-mobile-cta');
  const cta = document.querySelector('.cta-box');
  let pastHero = false;
  let atCta = false;
  const update = () => { const on = pastHero && !atCta; bar.classList.toggle('show', on); bar.inert = !on; };
  new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; update(); }).observe(heroButtons);
  if (cta) new IntersectionObserver(([e]) => { atCta = e.isIntersecting; update(); }).observe(cta);
}
