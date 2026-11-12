/* app.js — عناصر الواجهة المشتركة: الترويسة، التذييل، شريط التنقل السفلي، أدوات مساعدة */
(function () {
  'use strict';

  var MAIN_DRIVE = 'https://drive.google.com/drive/folders/180UXJSJRP47BO_DD-2UwZJ5lxVkvhKe1';
  var QR_BASE = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=';
  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* ألوان مميزة لكل عنصر: [الأساسي، الداكن، الفاتح] — يُستخدم el.color إن وُجد */
  var ACCENTS = {
    1: ['#2563EB', '#1E3A8A', '#E8EFFE'],
    2: ['#7C3AED', '#4C1D95', '#F1EAFE'],
    3: ['#DB2777', '#831843', '#FDE8F2'],
    4: ['#EA580C', '#9A3412', '#FEEEE4'],
    5: ['#059669', '#064E3B', '#E2F6EE'],
    6: ['#0891B2', '#164E63', '#E0F4F9'],
    7: ['#4F46E5', '#312E81', '#ECEBFD'],
    8: ['#65A30D', '#365314', '#EEF6E1'],
    9: ['#C026D3', '#701A75', '#FAE8FC'],
    10: ['#0D9488', '#134E4A', '#DFF4F2'],
    11: ['#DC2626', '#7F1D1D', '#FDE9E9']
  };
  function accent(el) {
    var id = el && el.id ? el.id : 1;
    var a = ACCENTS[((id - 1) % 11) + 1];
    if (el && typeof el.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(el.color)) a = [el.color, a[1], a[2]];
    return { main: a[0], deep: a[1], soft: a[2] };
  }
  /* يضبط متغيرات CSS للون العنصر على العقدة */
  function paint(node, el) {
    var a = accent(el);
    node.style.setProperty('--ac', a.main);
    node.style.setProperty('--ac-deep', a.deep);
    node.style.setProperty('--ac-soft', a.soft);
    return node;
  }

  /* أيقونات ثابتة (نصوص من الكود فقط، لا قيم مستخدم) */
  var ICONS = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    open: '<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
    doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
    arrowR: '<path d="M9 6l6 6-6 6"/>',
    arrowL: '<path d="M15 6l-6 6 6 6"/>',
    check: '<path d="M5 12.5 10 17l9-10"/>',
    tick: '<path pathLength="1" d="M5 12.5 10 17l9-10"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
    star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 20h2M20 14v2"/>',
    upload: '<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    download: '<path d="M12 4v12"/><path d="M7 11l5 5 5-5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    reset: '<path d="M4 4v6h6"/><path d="M5.5 15a7 7 0 1 0 1.6-7.4L4 10"/>'
  };

  function icon(name, cls) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'ic' + (cls ? ' ' + cls : ''));
    svg.innerHTML = ICONS[name] || ''; // ثوابت من الكود فقط
    return svg;
  }

  /* منشئ عناصر آمن: النصوص عبر textContent فقط */
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'on') Object.keys(v).forEach(function (ev) { el.addEventListener(ev, v[ev]); });
        else if (k === 'dataset') Object.keys(v).forEach(function (d) { el.dataset[d] = v[d]; });
        else if (k === 'value') el.value = v;
        else if (k === 'checked') el.checked = !!v;
        else if (k === 'href') el.setAttribute('href', v);
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    append(el, children);
    return el;
  }
  function append(el, children) {
    if (children === null || children === undefined) return el;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return el;
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

  /* رابط خارجي آمن (http/https فقط) */
  function extLink(url, children, cls) {
    var safe = window.Store.safeUrl(url);
    if (!safe) return h('span', { class: (cls || '') + ' is-disabled', 'aria-disabled': 'true' }, children);
    return h('a', { href: safe, target: '_blank', rel: 'noopener noreferrer', class: cls || null }, children);
  }

  function param(name) {
    try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; }
  }

  function data() {
    var els = Array.isArray(window.ELEMENTS) ? window.ELEMENTS.slice() : [];
    els.sort(function (a, b) { return (a.id || 0) - (b.id || 0); });
    return { elements: els, reports: Array.isArray(window.REPORTS) ? window.REPORTS : [] };
  }
  function findElement(id) {
    var n = parseInt(id, 10);
    return data().elements.filter(function (e) { return e.id === n; })[0] || null;
  }
  function findReport(id) {
    return data().reports.filter(function (r) { return r.id === id; })[0] || null;
  }
  function reportsFor(el) {
    var all = data().reports;
    var ids = Array.isArray(el.reports) ? el.reports : [];
    var list = ids.map(function (id) { return all.filter(function (r) { return r.id === id; })[0]; }).filter(Boolean);
    all.forEach(function (r) { if (r.elementId === el.id && list.indexOf(r) === -1) list.push(r); });
    return list;
  }

  /* ===== إشعار مؤقت (بديل alert) ===== */
  var toastTimer = null;
  function toast(msg, kind) {
    var t = document.getElementById('toast');
    if (!t) {
      t = h('div', { id: 'toast', class: 'toast', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = 'toast show' + (kind ? ' toast-' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, 2600);
  }

  /* ===== نسخ إلى الحافظة مع بديل ===== */
  function copy(text) {
    function fallback() {
      try {
        var ta = h('textarea', { class: 'sr-only', readonly: true });
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch (e) { return false; }
    }
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallback(); });
    }
    return Promise.resolve(fallback());
  }

  /* ===== روابط المقيّم و QR ===== */
  function evaluatorUrl(elId) {
    var code = window.Store.encodeShare(window.Store.load());
    var base = new URL('evaluator.html', location.href);
    base.search = '';
    return base.href.split('#')[0] + '#d=' + code + (elId ? '&el=' + encodeURIComponent(elId) : '');
  }
  function qrSrc(text) { return QR_BASE + encodeURIComponent(text); }

  /* ===== العدّاد الدائري المتحرك ===== */
  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* تجاهل */ }

  function ring(pct, opts) {
    opts = opts || {};
    var size = opts.size || 180, stroke = opts.stroke || 14;
    var r = (size - stroke) / 2, c = 2 * Math.PI * r;
    var wrap = h('div', { class: 'ring' + (opts.cls ? ' ' + opts.cls : ''), role: 'img', 'aria-label': (opts.label || 'نسبة الإنجاز') + ' ' + pct + '%' });
    wrap.style.width = size + 'px';
    wrap.style.height = size + 'px';
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + size + ' ' + size);
    svg.setAttribute('aria-hidden', 'true');
    var gid = 'rg' + Math.random().toString(36).slice(2, 8);
    var defs = document.createElementNS(SVG_NS, 'defs');
    var grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', gid);
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0'); grad.setAttribute('x2', '1'); grad.setAttribute('y2', '1');
    var stops = opts.gold || pct >= 100 ? [['0', '#FCE7A2'], ['.55', '#E3B641'], ['1', '#B8871A']]
      : opts.light ? [['0', '#FFFFFF'], ['1', '#FCE7A2']]
      : opts.accent ? [['0', opts.accent], ['1', opts.accentDeep || opts.accent]]
      : [['0', '#1FB389'], ['1', '#0B4F3E']];
    stops.forEach(function (s) {
      var st = document.createElementNS(SVG_NS, 'stop');
      st.setAttribute('offset', s[0]); st.setAttribute('stop-color', s[1]);
      grad.appendChild(st);
    });
    defs.appendChild(grad);
    svg.appendChild(defs);
    function circle(cls) {
      var ci = document.createElementNS(SVG_NS, 'circle');
      ci.setAttribute('cx', size / 2); ci.setAttribute('cy', size / 2); ci.setAttribute('r', r);
      ci.setAttribute('fill', 'none'); ci.setAttribute('stroke-width', stroke);
      ci.setAttribute('class', cls);
      return ci;
    }
    var track = circle('ring-track');
    var bar = circle('ring-bar');
    bar.setAttribute('stroke', 'url(#' + gid + ')');
    bar.setAttribute('stroke-linecap', 'round');
    bar.setAttribute('stroke-dasharray', c.toFixed(2));
    bar.setAttribute('stroke-dashoffset', c.toFixed(2));
    bar.setAttribute('transform', 'rotate(-90 ' + size / 2 + ' ' + size / 2 + ')');
    svg.appendChild(track);
    svg.appendChild(bar);
    if (opts.star) {
      var star = document.createElementNS(SVG_NS, 'svg');
      star.setAttribute('viewBox', '0 0 100 100');
      star.setAttribute('class', 'ring-star');
      star.setAttribute('aria-hidden', 'true');
      star.innerHTML = '<g fill="none" stroke="currentColor"><path stroke-width=".6" d="M50 3.5l13.3 13.2h20v20L96.5 50 83.3 63.3v20h-20L50 96.5 36.7 83.3h-20v-20L3.5 50l13.2-13.3v-20h20z"/><path stroke-width=".35" d="M50 8.5l12 12h17.5V38L91.5 50 79.5 62v17.5H62L50 91.5 38 79.5H20.5V62L8.5 50l12-12V20.5H38z"/><circle cx="50" cy="50" r="49.5" stroke-width=".5" stroke-dasharray=".6 2.4"/></g>';
      wrap.appendChild(star);
    }
    wrap.appendChild(svg);
    var num = h('span', { class: 'ring-num' }, '0');
    var center = h('div', { class: 'ring-center' }, [
      h('div', { class: 'ring-value' }, [num, h('span', { class: 'ring-pct' }, '%')]),
      opts.caption ? h('div', { class: 'ring-caption', text: opts.caption }) : null
    ]);
    wrap.appendChild(center);

    var target = Math.max(0, Math.min(100, pct));
    var finalOffset = c * (1 - target / 100);
    function fmt(v) { return (Math.round(v * 10) / 10).toString(); }
    if (reduceMotion) {
      bar.setAttribute('stroke-dashoffset', finalOffset.toFixed(2));
      num.textContent = fmt(target);
    } else {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          bar.style.strokeDashoffset = finalOffset.toFixed(2);
        });
      });
      var start = null, dur = 1200;
      var step = function (ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        num.textContent = p < 1 ? String(Math.round(target * eased)) : fmt(target);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
    return wrap;
  }

  function progressBar(ratio, gold) {
    var pct = Math.round(ratio * 100);
    var fill = h('span', { class: 'bar-fill' + (gold ? ' is-gold' : '') });
    fill.style.width = '0%';
    var bar = h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct) }, fill);
    requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.width = pct + '%'; }); });
    return bar;
  }

  function goldBadge(text) {
    return h('span', { class: 'badge-gold', title: 'مكتمل 100%' }, [icon('star'), h('span', { text: text || 'مكتمل' })]);
  }

  /* ===== الترويسة والتذييل والتنقل ===== */
  var NAV = [
    { key: 'home', href: 'index.html', label: 'الرئيسية', icon: 'home' },
    { key: 'elements', href: 'index.html#elements', label: 'العناصر', icon: 'grid' },
    { key: 'evaluator', href: 'evaluator.html', label: 'عرض المقيّم', icon: 'eye', share: true },
    { key: 'settings', href: 'settings.html', label: 'الإعدادات', icon: 'gear' }
  ];

  function navLink(item, active, cls) {
    var a = h('a', { href: item.href, class: cls + (active === item.key ? ' is-active' : '') }, [icon(item.icon), h('span', { text: item.label })]);
    if (active === item.key) a.setAttribute('aria-current', 'page');
    if (item.share) {
      /* عرض المقيّم يفتح برابط يحمل بيانات المعلم الحالية */
      a.addEventListener('click', function (e) {
        if (active === 'evaluator') return;
        e.preventDefault();
        location.href = evaluatorUrl();
      });
    }
    return a;
  }

  function mountChrome(active, opts) {
    opts = opts || {};
    var header = document.getElementById('site-header');
    if (header) {
      clear(header);
      header.className = 'site-header' + (opts.accentEl ? ' is-accent' : '') + (opts.big ? ' is-big' : '');
      if (opts.accentEl) paint(header, opts.accentEl);
      header.appendChild(heroFx());
      var teacher = window.Store.getTeacher();
      var brand = h('a', { href: 'index.html', class: 'brand' }, [
        h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, starMark()),
        h('span', { class: 'brand-text' }, [
          h('strong', { text: 'ملف إنجاز المعلم' }),
          h('small', { text: opts.subtitle || (teacher.name ? teacher.name : 'نظام إدارة الأداء الوظيفي') })
        ])
      ]);
      var nav = h('nav', { class: 'top-nav', 'aria-label': 'التنقل الرئيسي' },
        NAV.filter(function (n) { return n.key !== 'elements'; }).map(function (n) { return navLink(n, active, 'top-link'); }));
      header.appendChild(h('div', { class: 'container header-row' }, [brand, nav]));
      if (opts.hero) header.appendChild(opts.hero);
    }

    var footer = document.getElementById('site-footer');
    if (footer) {
      clear(footer);
      footer.className = 'site-footer no-print';
      footer.appendChild(h('div', { class: 'container' }, [
        h('p', { text: 'ملف إنجاز المعلم — أداة شخصية لتنظيم شواهد الأداء الوظيفي. بياناتك محفوظة في متصفحك فقط.' }),
        h('p', { class: 'muted', text: 'غير تابع رسمياً لوزارة التعليم.' })
      ]));
    }

    if (!document.querySelector('.bottom-nav')) {
      var bn = h('nav', { class: 'bottom-nav no-print', 'aria-label': 'تنقل الجوال' },
        NAV.map(function (n) { return navLink(n, active, 'bn-link'); }));
      document.body.appendChild(bn);
      document.body.classList.add('has-bottom-nav');
    }
  }

  /* طبقة الخلفية الحية: نقش هندسي متحرك + أشكال ضبابية */
  function heroFx() {
    return h('div', { class: 'hero-fx', 'aria-hidden': 'true' }, [
      h('span', { class: 'fx-pattern' }),
      h('span', { class: 'blob b1' }),
      h('span', { class: 'blob b2' }),
      h('span', { class: 'blob b3' })
    ]);
  }

  /* احتفال خفيف (قصاصات ملونة) — يُتجاهل مع تقليل الحركة */
  function confetti(colors) {
    if (reduceMotion) return;
    var pal = colors && colors.length ? colors : ['#E3B641', '#0F6E56', '#1FB389', '#FCE7A2', '#ffffff'];
    var layer = h('div', { class: 'confetti', 'aria-hidden': 'true' });
    for (var i = 0; i < 90; i++) {
      var p = h('i');
      p.style.left = (Math.random() * 100) + '%';
      p.style.background = pal[i % pal.length];
      p.style.setProperty('--dx', ((Math.random() - .5) * 220).toFixed(0) + 'px');
      p.style.setProperty('--rot', (360 + Math.random() * 720).toFixed(0) + 'deg');
      p.style.animationDelay = (Math.random() * .45).toFixed(2) + 's';
      p.style.animationDuration = (1.8 + Math.random() * 1.4).toFixed(2) + 's';
      if (i % 3 === 0) p.style.borderRadius = '50%';
      layer.appendChild(p);
    }
    document.body.appendChild(layer);
    setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 3800);
  }

  /* صورة الشعار المرفوع (إن وُجد) */
  function logoImg(cls) {
    var src = window.Store.getLogo ? window.Store.getLogo() : '';
    if (!src) return null;
    return h('img', { src: src, alt: 'شعار', class: cls || 'logo-img' });
  }

  function starMark() {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 40 40');
    svg.innerHTML = '<g fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="22" height="22" rx="1"/><rect x="9" y="9" width="22" height="22" rx="1" transform="rotate(45 20 20)"/><circle cx="20" cy="20" r="4.5" fill="currentColor" stroke="none"/></g>';
    return svg;
  }

  function missingData(container) {
    clear(container);
    container.appendChild(h('div', { class: 'card notice notice-warn' }, [
      icon('info'),
      h('div', null, [
        h('strong', { text: 'لم تُحمَّل بيانات العناصر بعد' }),
        h('p', { text: 'تأكد من وجود الملفين data/elements.js و data/reports.js في المستودع.' })
      ])
    ]));
  }

  function today() {
    var d = new Date();
    var m = String(d.getMonth() + 1), day = String(d.getDate());
    return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
  }

  window.App = {
    MAIN_DRIVE: MAIN_DRIVE,
    h: h, append: append, clear: clear, icon: icon, extLink: extLink,
    param: param, data: data, findElement: findElement, findReport: findReport, reportsFor: reportsFor,
    toast: toast, copy: copy,
    evaluatorUrl: evaluatorUrl, qrSrc: qrSrc,
    ring: ring, progressBar: progressBar, goldBadge: goldBadge,
    accent: accent, paint: paint, confetti: confetti, logoImg: logoImg, reduceMotion: reduceMotion,
    mountChrome: mountChrome, missingData: missingData, today: today
  };
})();
