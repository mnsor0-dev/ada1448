/* index.js — لوحة الإنجاز */
(function () {
  'use strict';
  var A = window.App, S = window.Store, h = A.h;

  var d = A.data();
  var state = S.load();
  var teacher = state.teacher;
  var score = S.weightedScore(d.elements, state.evidence);

  var totalEv = 0, doneEv = 0, completeEls = 0;
  d.elements.forEach(function (el) {
    var p = S.elementProgress(el, state.evidence);
    totalEv += p.total; doneEv += p.done;
    if (p.total && p.done === p.total) completeEls++;
  });

  /* ===== البطل: بطاقة المعلم + العداد ===== */
  var meta = [];
  [['subject', 'التخصص'], ['school', 'المدرسة'], ['year', 'العام'], ['stage', 'المرحلة']].forEach(function (m) {
    if (teacher[m[0]]) meta.push(h('li', null, [h('b', { text: m[1] + ':' }), h('span', { text: teacher[m[0]] })]));
  });

  var hero = h('div', { class: 'container hero-dash' }, [
    h('div', { class: 'teacher-card' }, [
      h('div', { class: 'hello', text: teacher.name ? 'ملف إنجاز المعلم/ـة' : 'مرحباً بك في' }),
      h('h1', { text: teacher.name || 'ملف إنجاز المعلم' }),
      meta.length ? h('ul', { class: 'teacher-meta' }, meta)
        : h('p', { class: 'muted-light', text: 'نظّم شواهد عناصر الأداء الوظيفي الأحد عشر، وولّد تقاريرك، وشارك ملفك مع المقيّم برابط واحد.' })
    ]),
    h('div', { class: 'hero-ring-wrap' }, [
      A.ring(score, { size: 190, stroke: 15, caption: 'الإنجاز الموزون', label: 'الإنجاز الموزون' }),
      h('div', { class: 'hint', text: doneEv + ' من ' + totalEv + ' شاهد مكتمل · ' + completeEls + ' من ' + d.elements.length + ' عنصر مكتمل' })
    ])
  ]);

  A.mountChrome('home', { hero: hero });

  var main = document.getElementById('main');
  A.clear(main);
  var wrap = h('div', { class: 'container overlap' });
  main.appendChild(wrap);

  if (!d.elements.length) { A.missingData(wrap); return; }

  /* ===== تنبيه بيانات المعلم ===== */
  if (!S.teacherFilled(teacher)) {
    wrap.appendChild(h('div', { class: 'card notice notice-warn', style: 'margin-bottom:18px' }, [
      A.icon('info'),
      h('div', null, [
        h('strong', { text: 'أكمل بياناتك أولاً' }),
        h('p', { text: 'أضف اسمك ومدرستك وإدارة التعليم لتظهر تلقائياً في التقارير وعرض المقيّم.' })
      ]),
      h('a', { href: 'settings.html', class: 'btn btn-gold btn-sm' }, 'تعبئة البيانات')
    ]));
  }

  /* ===== أزرار سريعة ===== */
  var sharePanel = h('div', { class: 'card share-panel', id: 'share-panel', style: 'margin-top:14px' });

  function quick(tag, attrs, iconName, title, sub, gold) {
    attrs.class = 'qa' + (gold ? ' gold' : '');
    return h(tag, attrs, [
      h('span', { class: 'qa-icon' }, A.icon(iconName)),
      h('span', null, [h('strong', { text: title }), h('small', { text: sub })])
    ]);
  }

  var shareBtn = quick('button', { type: 'button' }, 'qr', 'إنشاء رابط المقيّم', 'رابط للقراءة فقط + رمز QR، يُنسخ تلقائياً', true);
  shareBtn.addEventListener('click', makeShare);

  wrap.appendChild(h('div', { class: 'quick-actions' }, [
    quick('a', { href: A.MAIN_DRIVE, target: '_blank', rel: 'noopener noreferrer' }, 'folder', 'مجلد الشواهد في Drive', 'المجلد الرئيسي لرفع ملفات الشواهد'),
    shareBtn,
    quick('a', { href: 'settings.html' }, 'gear', 'الإعدادات', 'بيانات المعلم والنسخ الاحتياطي')
  ]));
  wrap.appendChild(sharePanel);

  function makeShare() {
    var url = A.evaluatorUrl();
    A.clear(sharePanel);
    var input = h('input', { class: 'input', type: 'text', readonly: true, value: url, 'aria-label': 'رابط المقيّم', dir: 'ltr' });
    input.addEventListener('focus', function () { input.select(); });
    var tooLong = url.length > 1800;
    sharePanel.appendChild(h('div', { class: 'qr-box' }, [
      h('img', { src: A.qrSrc(url), alt: 'رمز QR لرابط المقيّم', width: '150', height: '150', loading: 'lazy' })
    ]));
    sharePanel.appendChild(h('div', { class: 'share-url' }, [
      h('div', { class: 'card-title', style: 'margin-bottom:8px' }, [A.icon('link'), 'رابط عرض المقيّم']),
      h('p', { class: 'muted', style: 'font-size:.9rem', text: 'يحمل الرابط بياناتك وشواهدك المنجزة الآن. إذا أضفت شواهد جديدة فأنشئ رابطاً جديداً.' }),
      input,
      tooLong ? h('p', { class: 'ev-err', style: 'padding:0;margin-top:6px', text: 'الرابط طويل لكثرة الروابط المرفقة؛ قد يصعب مسح رمز QR — استخدم الرابط المنسوخ مباشرة.' }) : null,
      h('div', { class: 'btn-row', style: 'margin-top:10px' }, [
        h('button', { type: 'button', class: 'btn btn-sm', on: { click: function () { A.copy(url).then(function (ok) { A.toast(ok ? 'تم نسخ الرابط' : 'تعذّر النسخ، انسخه يدوياً', ok ? '' : 'err'); }); } } }, [A.icon('copy'), 'نسخ']),
        h('a', { href: url, class: 'btn btn-outline btn-sm', target: '_blank', rel: 'noopener' }, [A.icon('open'), 'فتح عرض المقيّم'])
      ])
    ]));
    sharePanel.classList.add('show');
    A.copy(url).then(function (ok) { A.toast(ok ? 'تم إنشاء رابط المقيّم ونسخه' : 'تم إنشاء الرابط — انسخه من الحقل'); });
    sharePanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ===== شبكة العناصر ===== */
  var grid = h('div', { class: 'el-grid' });
  d.elements.forEach(function (el) {
    var p = S.elementProgress(el, state.evidence);
    var complete = p.total > 0 && p.done === p.total;
    grid.appendChild(h('a', { href: 'element.html?id=' + encodeURIComponent(el.id), class: 'el-card' + (complete ? ' is-complete' : '') }, [
      complete ? A.goldBadge() : null,
      h('div', { class: 'el-top' }, [
        h('span', { class: 'el-emoji', 'aria-hidden': 'true', text: el.icon || '📁' }),
        h('div', null, [
          h('div', { class: 'el-num', text: 'العنصر ' + el.id }),
          h('h3', { class: 'el-title', text: el.title })
        ])
      ]),
      A.progressBar(p.ratio, complete),
      h('div', { class: 'el-foot' }, [
        h('span', { text: p.done + ' من ' + p.total + ' شاهد مكتمل' }),
        h('span', { class: 'weight-chip', text: 'الوزن ' + (el.weight || 0) + '%' })
      ])
    ]));
  });

  wrap.appendChild(h('section', { class: 'section', id: 'elements' }, [
    h('div', { class: 'section-head' }, [
      h('div', null, [
        h('h2', { text: 'عناصر الأداء الوظيفي' }),
        h('p', { text: 'اختر عنصراً لمتابعة شواهده وتوليد تقاريره. الشارة الذهبية تعني اكتمال جميع شواهد العنصر.' })
      ])
    ]),
    grid
  ]));

  if (location.hash === '#elements') {
    setTimeout(function () { var t = document.getElementById('elements'); if (t) t.scrollIntoView(); }, 50);
  }
})();
