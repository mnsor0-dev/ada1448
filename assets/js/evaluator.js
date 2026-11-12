/* evaluator.js — عرض المقيّم (قراءة فقط) */
(function () {
  'use strict';
  var A = window.App, S = window.Store, h = A.h;

  var d = A.data();
  var main = document.getElementById('main');
  var heroHost = h('div', { class: 'container page-hero' });
  A.mountChrome('evaluator', { hero: heroHost, subtitle: 'عرض المقيّم — للقراءة فقط' });

  function parseHash() {
    var raw = (location.hash || '').replace(/^#/, '');
    var p;
    try { p = new URLSearchParams(raw); } catch (e) { p = new URLSearchParams(''); }
    return { d: p.get('d'), el: parseInt(p.get('el'), 10) || null };
  }

  function render() {
    A.clear(main);
    A.clear(heroHost);
    var hp = parseHash();
    var source = 'link', data;

    if (hp.d) {
      data = S.decodeShare(hp.d);
      if (!data) {
        heroHost.appendChild(h('h1', { text: 'عرض المقيّم' }));
        main.appendChild(h('div', { class: 'container overlap' }, h('div', { class: 'card notice notice-warn' }, [
          A.icon('info'),
          h('div', null, [h('strong', { text: 'الرابط غير صالح أو ناقص' }), h('p', { text: 'تأكد من نسخ رابط المقيّم كاملاً كما أرسله المعلم.' })])
        ])));
        return;
      }
    } else {
      source = 'local';
      var st = S.load();
      data = { teacher: st.teacher, evidence: {} };
      Object.keys(st.evidence).forEach(function (k) {
        if (st.evidence[k].done) data.evidence[k] = { done: true, link: S.safeUrl(st.evidence[k].link) };
      });
    }

    var t = data.teacher;
    document.title = 'عرض المقيّم' + (t.name ? ' — ' + t.name : '') + ' — ملف إنجاز المعلم';

    heroHost.appendChild(h('div', { class: 'crumbs', text: 'عرض للقراءة فقط' }));
    heroHost.appendChild(h('h1', { text: t.name ? 'ملف إنجاز: ' + t.name : 'ملف إنجاز المعلم' }));
    heroHost.appendChild(h('p', { text: [t.subject, t.school, t.year].filter(Boolean).join(' · ') || 'نظام إدارة الأداء الوظيفي — شواهد عناصر الأداء' }));

    var wrap = h('div', { class: 'container overlap' });
    main.appendChild(wrap);

    if (!d.elements.length) { A.missingData(wrap); return; }

    // رأس الطباعة
    wrap.appendChild(h('div', { class: 'print-only', style: 'text-align:center;margin-bottom:10px' }, [
      h('h1', { style: 'font-size:18pt;margin:0;color:#0B4F3E', text: 'ملخص ملف إنجاز المعلم' }),
      h('div', { style: 'font-size:10pt;color:#555', text: 'تاريخ الطباعة: ' + A.today() })
    ]));

    if (source === 'local') {
      wrap.appendChild(h('div', { class: 'card notice notice-warn no-print', style: 'margin-bottom:18px' }, [
        A.icon('info'),
        h('div', null, [
          h('strong', { text: 'هذه معاينة لبياناتك المحلية' }),
          h('p', { text: 'لإرسال ملفك إلى المقيّم أنشئ رابطاً يحمل بياناتك ثم انسخه.' })
        ]),
        h('button', { type: 'button', class: 'btn btn-gold btn-sm', on: { click: function () {
          var url = A.evaluatorUrl();
          A.copy(url).then(function (ok) { A.toast(ok ? 'تم نسخ رابط المقيّم' : 'تعذّر النسخ'); });
          history.replaceState(null, '', url);
          render();
        } } }, [A.icon('link'), 'إنشاء الرابط ونسخه'])
      ]));
    }

    // الملخص
    var ev = data.evidence;
    var score = S.weightedScore(d.elements, ev);
    var totalEv = 0, doneEv = 0, complete = 0;
    d.elements.forEach(function (el) {
      var p = S.elementProgress(el, ev);
      totalEv += p.total; doneEv += p.done;
      if (p.total && p.done === p.total) complete++;
    });

    var dl = h('dl');
    [['name', 'المعلم/ـة'], ['subject', 'التخصص'], ['stage', 'المرحلة'], ['school', 'المدرسة'], ['office', 'إدارة التعليم'], ['year', 'العام الدراسي'], ['principal', 'مدير/ة المدرسة']].forEach(function (f) {
      if (t[f[0]]) { dl.appendChild(h('dt', { text: f[1] })); dl.appendChild(h('dd', { text: t[f[0]] })); }
    });
    if (!dl.firstChild) { dl.appendChild(h('dt', { text: 'المعلم/ـة' })); dl.appendChild(h('dd', { text: 'لم تُذكر البيانات' })); }

    wrap.appendChild(h('section', { class: 'card eval-summary' }, [
      A.ring(score, { size: 170, stroke: 14, caption: 'الإنجاز الموزون', label: 'الإنجاز الموزون' }),
      h('div', { class: 'eval-teacher' }, [
        dl,
        h('div', { class: 'eval-stats' }, [
          h('span', { class: 'stat' }, [h('b', { text: String(doneEv) }), ' من ' + totalEv + ' شاهد منجز']),
          h('span', { class: 'stat' }, [h('b', { text: String(complete) }), ' من ' + d.elements.length + ' عنصر مكتمل'])
        ]),
        h('div', { class: 'btn-row no-print', style: 'margin-top:14px' }, [
          h('button', { type: 'button', class: 'btn btn-sm', on: { click: printSummary } }, [A.icon('print'), 'طباعة الملخص']),
          source === 'link' ? h('button', { type: 'button', class: 'btn btn-outline btn-sm', on: { click: function () {
            A.copy(location.href).then(function (ok) { A.toast(ok ? 'تم نسخ الرابط' : 'تعذّر النسخ'); });
          } } }, [A.icon('copy'), 'نسخ الرابط']) : null
        ])
      ])
    ]));

    // العناصر
    var sec = h('section', { class: 'section' }, h('div', { class: 'section-head' }, h('h2', { text: 'العناصر والشواهد المنجزة' })));
    wrap.appendChild(sec);
    var target = null;
    d.elements.forEach(function (el) {
      var p = S.elementProgress(el, ev);
      var full = p.total > 0 && p.done === p.total;
      var isTarget = hp.el === el.id;
      var det = h('details', { class: 'card eval-el' + (isTarget ? ' is-target' : ''), id: 'el-' + el.id });
      if (isTarget || (!hp.el && p.done > 0)) det.open = true;
      det.appendChild(h('summary', null, [
        h('span', { class: 'el-emoji', 'aria-hidden': 'true', text: el.icon || '📁' }),
        h('span', { class: 'grow' }, [
          h('span', { class: 'el-num', text: 'العنصر ' + el.id + ' · الوزن ' + (el.weight || 0) + '% · ' + p.done + ' من ' + p.total + ' شاهد' }),
          h('span', { class: 'el-title', style: 'display:block', text: el.title }),
          A.progressBar(p.ratio, full)
        ]),
        full ? A.goldBadge() : null,
        A.icon('arrowL', 'chev')
      ]));
      var ul = h('ul', { class: 'eval-ev' });
      (el.evidence || []).forEach(function (e) {
        var got = ev[e.id];
        if (got && got.done) {
          var link = S.safeUrl(got.link);
          ul.appendChild(h('li', { class: 'yes' }, [
            A.icon('check', 'mark'),
            h('span', { class: 'name' }, [h('span', { text: e.title }), link ? h('span', { class: 'url-print', text: link }) : null]),
            link ? h('a', { href: link, target: '_blank', rel: 'noopener noreferrer', class: 'btn btn-outline btn-sm' }, [A.icon('open'), 'عرض الشاهد']) : h('small', { class: 'muted', text: 'بدون رابط' })
          ]));
        } else {
          ul.appendChild(h('li', { class: 'no' }, [h('span', { class: 'name', text: e.title }), h('small', { text: 'لم يُنجز بعد' })]));
        }
      });
      det.appendChild(h('div', { class: 'body' }, [el.summary ? h('p', { class: 'muted', style: 'margin:12px 0 0;font-size:.92rem', text: el.summary }) : null, ul]));
      sec.appendChild(det);
      if (isTarget) target = det;
    });

    if (target) setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 300);
  }

  /* فتح كل العناصر عند الطباعة ثم استعادة الحالة */
  var openState = null;
  window.addEventListener('beforeprint', function () {
    var all = document.querySelectorAll('details.eval-el');
    openState = [];
    all.forEach(function (x) { openState.push(x.open); x.open = true; });
  });
  window.addEventListener('afterprint', function () {
    if (!openState) return;
    document.querySelectorAll('details.eval-el').forEach(function (x, i) { x.open = !!openState[i]; });
    openState = null;
  });
  function printSummary() { window.print(); }

  window.addEventListener('hashchange', render);
  render();
})();
