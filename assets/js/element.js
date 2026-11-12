/* element.js — صفحة العنصر */
(function () {
  'use strict';
  var A = window.App, S = window.Store, h = A.h;

  var d = A.data();
  var id = parseInt(A.param('id'), 10);
  var el = A.findElement(id);
  var main = document.getElementById('main');
  A.clear(main);

  if (!d.elements.length) {
    A.mountChrome('elements', { hero: h('div', { class: 'container page-hero' }, h('h1', { text: 'عنصر الأداء' })) });
    var c0 = h('div', { class: 'container section' }); main.appendChild(c0); A.missingData(c0);
    return;
  }
  if (!el) {
    A.mountChrome('elements', { hero: h('div', { class: 'container page-hero' }, h('h1', { text: 'العنصر غير موجود' })) });
    main.appendChild(h('div', { class: 'container section' }, h('div', { class: 'card notice notice-warn' }, [
      A.icon('info'),
      h('div', null, [h('strong', { text: 'لم يتم العثور على هذا العنصر' }), h('p', { text: 'تحقق من الرابط أو عد إلى لوحة الإنجاز.' })]),
      h('a', { href: 'index.html', class: 'btn btn-sm' }, 'الرئيسية')
    ])));
    return;
  }

  document.title = el.title + ' — ملف إنجاز المعلم';

  /* ===== البطل ===== */
  var ringHolder = h('div', { class: 'ring-wrap' });
  var metaRow = h('div', { class: 'meta' });
  var hero = h('div', { class: 'container' }, [
    h('div', { class: 'el-hero' }, [
      h('span', { class: 'el-emoji', 'aria-hidden': 'true', text: el.icon || '📁' }),
      h('div', null, [
        h('div', { class: 'crumbs' }, [h('a', { href: 'index.html', text: 'الرئيسية' }), '›', h('span', { text: 'العنصر ' + el.id + ' من ' + d.elements.length })]),
        h('h1', { text: el.title }),
        metaRow
      ]),
      ringHolder
    ])
  ]);
  A.mountChrome('elements', { hero: hero });

  function refreshProgress() {
    var ev = S.load().evidence;
    var p = S.elementProgress(el, ev);
    var complete = p.total > 0 && p.done === p.total;
    A.clear(ringHolder).appendChild(A.ring(Math.round(p.ratio * 100), { size: 112, stroke: 10, cls: 'sm', label: 'إنجاز العنصر' }));
    A.clear(metaRow);
    A.append(metaRow, [
      h('span', { class: 'weight-chip', text: 'الوزن ' + (el.weight || 0) + '%' }),
      h('span', { class: 'weight-chip', text: p.done + ' من ' + p.total + ' شاهد' }),
      complete ? A.goldBadge('مكتمل 100%') : null
    ]);
    if (countEl) countEl.textContent = p.done + ' من ' + p.total;
  }

  /* ===== المحتوى ===== */
  var wrap = h('div', { class: 'container overlap' });
  main.appendChild(wrap);
  var col = h('div');
  var side = h('aside', { class: 'sidebar' });
  wrap.appendChild(h('div', { class: 'layout-2' }, [col, side]));

  // الملخص والأمثلة
  var examples = Array.isArray(el.examples) ? el.examples : [];
  col.appendChild(h('section', { class: 'card' }, [
    h('h2', { class: 'card-title' }, [A.icon('info'), 'عن هذا العنصر']),
    h('p', { class: 'summary-text', text: el.summary || '' }),
    examples.length ? h('h3', { style: 'font-size:1rem;color:var(--dark);margin-top:16px', text: 'أمثلة على تحقق العنصر' }) : null,
    examples.length ? h('ul', { class: 'examples' }, examples.map(function (x) {
      return h('li', null, [A.icon('check'), h('span', { text: x })]);
    })) : null
  ]));

  // قائمة تحقق الشواهد
  var countEl = h('span', { class: 'count' });
  var list = h('ul', { class: 'checklist' });
  var qrTimer = null;
  (Array.isArray(el.evidence) ? el.evidence : []).forEach(function (ev) {
    list.appendChild(evidenceItem(ev));
  });
  col.appendChild(h('section', { class: 'card', id: 'evidence' }, [
    h('h2', { class: 'card-title' }, [A.icon('check'), 'قائمة تحقق الشواهد', countEl]),
    h('p', { class: 'muted', style: 'font-size:.92rem', text: 'ضع علامة على كل شاهد أنجزته، والصق رابط ملفه من Google Drive (اختياري) ليظهر للمقيّم.' }),
    list
  ]));

  function evidenceItem(ev) {
    var cur = S.getEvidence(ev.id);
    var cbId = 'cb-' + ev.id;
    var li = h('li', { class: 'ev' + (cur.done ? ' is-done' : '') });
    var cb = h('input', { type: 'checkbox', id: cbId, checked: cur.done });
    var openBtn = h('a', { class: 'btn btn-outline btn-sm', target: '_blank', rel: 'noopener noreferrer', title: 'فتح الشاهد' }, [A.icon('open'), 'فتح']);
    var input = h('input', {
      class: 'input', type: 'url', inputmode: 'url', dir: 'ltr', value: cur.link || '',
      placeholder: 'https://drive.google.com/…', 'aria-label': 'رابط الشاهد: ' + ev.title
    });
    var err = h('div', { class: 'ev-err', role: 'alert' });

    function setOpen(url) {
      var safe = S.safeUrl(url);
      if (safe) { openBtn.setAttribute('href', safe); openBtn.classList.remove('is-disabled'); openBtn.removeAttribute('aria-disabled'); }
      else { openBtn.removeAttribute('href'); openBtn.classList.add('is-disabled'); openBtn.setAttribute('aria-disabled', 'true'); }
    }
    setOpen(cur.link);

    cb.addEventListener('change', function () {
      S.setEvidence(ev.id, { done: cb.checked });
      li.classList.toggle('is-done', cb.checked);
      refreshProgress();
      scheduleQr();
    });
    var t = null;
    function commitLink() {
      var v = input.value.trim();
      if (v && !S.safeUrl(v)) {
        input.classList.add('is-invalid');
        err.textContent = 'يُقبل فقط رابط يبدأ بـ http:// أو https://';
        setOpen('');
        return;
      }
      input.classList.remove('is-invalid');
      err.textContent = '';
      S.setEvidence(ev.id, { link: v });
      setOpen(v);
      scheduleQr();
    }
    input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(commitLink, 400); });
    input.addEventListener('change', function () { clearTimeout(t); commitLink(); });

    A.append(li, [
      h('label', { class: 'ev-head', for: cbId }, [
        h('span', { class: 'ev-check' }, [cb, h('span', { class: 'ev-box' }, A.icon('check'))]),
        h('span', null, [
          h('span', { class: 'ev-title', text: ev.title }),
          ev.hint ? h('p', { class: 'ev-hint', text: ev.hint }) : null
        ])
      ]),
      h('div', { class: 'ev-link' }, [input, openBtn]),
      err
    ]);
    return li;
  }

  // الأفكار الإبداعية
  var ideas = Array.isArray(el.ideas) ? el.ideas : [];
  if (ideas.length) {
    col.appendChild(h('section', { class: 'card' }, [
      h('h2', { class: 'card-title' }, [A.icon('bulb'), 'أفكار إبداعية لإثبات العنصر']),
      h('ol', { class: 'ideas' }, ideas.map(function (x) { return h('li', { text: x }); }))
    ]));
  }

  /* ===== الشريط الجانبي ===== */
  side.appendChild(h('section', { class: 'card' }, [
    h('h2', { class: 'card-title' }, [A.icon('folder'), 'ارفع شواهدك']),
    h('p', { class: 'muted', style: 'font-size:.9rem', text: 'افتح مجلد هذا العنصر في Google Drive وارفع ملفاتك، ثم انسخ رابط كل ملف والصقه أمام الشاهد.' }),
    A.extLink(el.driveFolder, [A.icon('upload'), 'ارفع شواهدك في Drive'], 'btn btn-gold'),
  ]));

  var reps = A.reportsFor(el);
  side.appendChild(h('section', { class: 'card' }, [
    h('h2', { class: 'card-title' }, [A.icon('doc'), 'تقارير جاهزة', h('span', { class: 'count', text: String(reps.length) })]),
    reps.length ? h('ul', { class: 'report-list' }, reps.map(function (r) {
      return h('li', null, h('a', { class: 'report-item', href: 'report.html?id=' + encodeURIComponent(r.id) }, [
        h('span', { class: 'qa-icon' }, A.icon('doc')),
        h('span', null, [h('strong', { text: r.title }), r.description ? h('small', { text: r.description }) : null]),
        A.icon('arrowL', 'go')
      ]));
    })) : h('p', { class: 'muted', text: 'لا توجد تقارير مرتبطة بهذا العنصر بعد.' })
  ]));

  var qrImg = h('img', { alt: 'رمز QR لعرض المقيّم لهذا العنصر', width: '180', height: '180', loading: 'lazy' });
  side.appendChild(h('section', { class: 'card qr-box' }, [
    h('h2', { class: 'card-title' }, [A.icon('qr'), 'رمز QR للمقيّم']),
    qrImg,
    h('p', { text: 'امسح الرمز لفتح عرض المقيّم مباشرة على هذا العنصر (يتحدث مع كل تعديل).' }),
    h('button', { type: 'button', class: 'btn btn-outline btn-sm', style: 'margin-top:10px', on: { click: function () {
      A.copy(A.evaluatorUrl(el.id)).then(function (ok) { A.toast(ok ? 'تم نسخ رابط المقيّم لهذا العنصر' : 'تعذّر النسخ', ok ? '' : 'err'); });
    } } }, [A.icon('copy'), 'نسخ الرابط'])
  ]));
  function updateQr() { qrImg.src = A.qrSrc(A.evaluatorUrl(el.id)); }
  function scheduleQr() { clearTimeout(qrTimer); qrTimer = setTimeout(updateQr, 700); }
  updateQr();

  /* ===== سابق / تالي ===== */
  var idx = d.elements.indexOf(el);
  var prev = d.elements[idx - 1], next = d.elements[idx + 1];
  wrap.appendChild(h('nav', { class: 'pager', 'aria-label': 'التنقل بين العناصر' }, [
    prev ? h('a', { href: 'element.html?id=' + prev.id, class: 'prev' }, [A.icon('arrowR'), h('span', null, [h('small', { text: 'العنصر السابق' }), h('strong', { text: prev.title })])]) : h('span', { style: 'flex:1' }),
    next ? h('a', { href: 'element.html?id=' + next.id, class: 'next' }, [h('span', null, [h('small', { text: 'العنصر التالي' }), h('strong', { text: next.title })]), A.icon('arrowL')]) : h('span', { style: 'flex:1' })
  ]));

  refreshProgress();
})();
