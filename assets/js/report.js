/* report.js — مولّد التقارير */
(function () {
  'use strict';
  var A = window.App, S = window.Store, h = A.h;

  var d = A.data();
  var rid = A.param('id') || '';
  var rep = A.findReport(rid);
  var main = document.getElementById('main');
  A.clear(main);
  var FILL = '..........';

  if (!d.reports.length || !rep) {
    A.mountChrome('elements', { hero: h('div', { class: 'container page-hero' }, h('h1', { text: 'مولّد التقارير' })) });
    var c0 = h('div', { class: 'container section' });
    main.appendChild(c0);
    if (!d.reports.length) { A.missingData(c0); return; }
    c0.appendChild(h('div', { class: 'card notice notice-warn' }, [
      A.icon('info'),
      h('div', null, [h('strong', { text: 'التقرير غير موجود' }), h('p', { text: 'اختر تقريراً من صفحة أحد العناصر.' })]),
      h('a', { href: 'index.html#elements', class: 'btn btn-sm' }, 'العناصر')
    ]));
    return;
  }

  var el = A.findElement(rep.elementId);
  var teacher = S.getTeacher();
  var fields = Array.isArray(rep.fields) ? rep.fields : [];
  document.title = rep.title + ' — ملف إنجاز المعلم';

  /* يستبدل {{teacher.x}} فقط (للقيم الافتراضية) */
  function teacherOnly(s) {
    return String(s).replace(/\{\{\s*teacher\.(\w+)\s*\}\}/g, function (m, k) { return teacher[k] || ''; });
  }

  function defaultValue(f) {
    if (f.default !== undefined && f.default !== null) return teacherOnly(f.default);
    if (S.TEACHER_KEYS.indexOf(f.key) !== -1 && teacher[f.key]) return teacher[f.key];
    if (f.type === 'date') return A.today();
    if (f.type === 'select' && Array.isArray(f.options) && f.options.length) return String(f.options[0]);
    return '';
  }

  var saved = S.getReportValues(rep.id) || {};
  var values = {};
  fields.forEach(function (f) { values[f.key] = saved[f.key] !== undefined ? saved[f.key] : defaultValue(f); });

  /* ===== البطل ===== */
  A.mountChrome('elements', {
    accentEl: el || null,
    hero: h('div', { class: 'container page-hero' }, [
      h('div', { class: 'crumbs' }, [
        h('a', { href: 'index.html', text: 'الرئيسية' }), '›',
        el ? h('a', { href: 'element.html?id=' + el.id, text: el.title }) : null, el ? '›' : null,
        h('span', { text: 'مولّد التقارير' })
      ]),
      h('h1', { text: rep.title }),
      rep.description ? h('p', { text: rep.description }) : null
    ])
  });

  var wrap = h('div', { class: 'container overlap' });
  main.appendChild(wrap);
  var formCard = h('section', { class: 'card report-form no-print' });
  var paperHost = h('div');
  wrap.appendChild(h('div', { class: 'report-layout' }, [
    formCard,
    h('section', { class: 'preview-wrap', 'aria-label': 'معاينة التقرير' }, [
      h('div', { class: 'preview-toolbar no-print' }, [
        h('button', { type: 'button', class: 'btn', on: { click: doPrint } }, [A.icon('print'), 'طباعة / حفظ PDF']),
        h('button', { type: 'button', class: 'btn btn-outline', on: { click: copyText } }, [A.icon('copy'), 'نسخ النص'])
      ]),
      paperHost
    ])
  ]));

  /* ===== النموذج ===== */
  formCard.appendChild(h('h2', { class: 'card-title' }, [A.icon('doc'), 'بيانات التقرير']));
  if (!S.teacherFilled(teacher)) {
    formCard.appendChild(h('div', { class: 'notice notice-warn card', style: 'padding:12px;margin-bottom:14px;box-shadow:none' }, [
      A.icon('info'),
      h('div', null, [
        h('p', { text: 'بيانات المعلم (الاسم، المدرسة، الإدارة) غير مكتملة وستظهر كنقاط في التقرير.' }),
        h('a', { href: 'settings.html', text: 'أكمل الإعدادات' })
      ])
    ]));
  }

  var inputs = {};
  var saveTimer = null;
  fields.forEach(function (f, i) {
    var fid = 'f-' + i;
    var ctrl;
    if (f.type === 'textarea') {
      ctrl = h('textarea', { id: fid, rows: '5' });
      ctrl.value = values[f.key] || '';
    } else if (f.type === 'select') {
      ctrl = h('select', { id: fid }, (Array.isArray(f.options) ? f.options : []).map(function (o) {
        return h('option', { value: String(o), text: String(o) });
      }));
      ctrl.value = values[f.key] || '';
      if (ctrl.value !== values[f.key] && values[f.key]) {
        ctrl.appendChild(h('option', { value: values[f.key], text: values[f.key] }));
        ctrl.value = values[f.key];
      }
    } else {
      var type = ['date', 'number', 'text'].indexOf(f.type) !== -1 ? f.type : 'text';
      ctrl = h('input', { id: fid, type: type, value: values[f.key] || '' });
    }
    ctrl.addEventListener('input', onChange);
    ctrl.addEventListener('change', onChange);
    function onChange() {
      values[f.key] = ctrl.value;
      render();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () { S.setReportValues(rep.id, values); }, 300);
    }
    inputs[f.key] = ctrl;
    formCard.appendChild(h('div', { class: 'field' }, [h('label', { for: fid, text: f.label || f.key }), ctrl]));
  });

  formCard.appendChild(h('div', { class: 'btn-row' }, [
    h('button', { type: 'button', class: 'btn btn-ghost btn-sm', on: { click: resetDefaults } }, [A.icon('reset'), 'استعادة النص الافتراضي'])
  ]));
  formCard.appendChild(h('p', { class: 'muted', style: 'font-size:.82rem;margin-top:10px', text: 'تُحفظ القيم تلقائياً في متصفحك لهذا التقرير.' }));

  function resetDefaults() {
    fields.forEach(function (f) {
      values[f.key] = defaultValue(f);
      if (inputs[f.key]) inputs[f.key].value = values[f.key];
    });
    S.clearReportValues(rep.id);
    render();
    A.toast('تمت استعادة القيم الافتراضية');
  }

  /* ===== عرض القالب كعقد DOM آمنة ===== */
  var dateKeys = fields.filter(function (f) { return f.type === 'date'; }).map(function (f) { return f.key; });
  function parseISO(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
    return m ? new Date(+m[1], +m[2] - 1, +m[3], 12) : null;
  }
  /* تاريخ ميلادي بالعربية، مثل: 12 نوفمبر 2026م */
  function fmtDate(iso) {
    var dt = parseISO(iso);
    if (!dt) return String(iso || '');
    try { return dt.toLocaleDateString('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }) + 'م'; }
    catch (e) { return String(iso); }
  }
  /* تاريخ هجري (أم القرى) */
  function fmtHijri(iso) {
    var dt = parseISO(iso);
    if (!dt) return '';
    try {
      var s = dt.toLocaleDateString('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' });
      return s.replace(/\s*هـ$/, '') + 'هـ';
    } catch (e) { return ''; }
  }
  function lookup(key) {
    var v = key.indexOf('teacher.') === 0 ? teacher[key.slice(8)] : values[key];
    v = (v === undefined || v === null) ? '' : String(v).trim();
    if (v && dateKeys.indexOf(key) !== -1) v = fmtDate(v);
    return v;
  }
  function tplNodes(tpl) {
    var frag = document.createDocumentFragment();
    var s = String(tpl === undefined || tpl === null ? '' : tpl);
    var re = /\{\{\s*([\w.]+)\s*\}\}/g, last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
      var v = lookup(m[1]);
      frag.appendChild(v ? document.createTextNode(v) : h('span', { class: 'placeholder', text: FILL }));
      last = re.lastIndex;
    }
    if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
    return frag;
  }
  function displayValues() {
    var o = {};
    Object.keys(values).forEach(function (k) { o[k] = dateKeys.indexOf(k) !== -1 ? fmtDate(values[k]) : values[k]; });
    return o;
  }
  function tplText(tpl) { return S.fillTemplate(tpl, displayValues(), teacher, FILL); }
  function val(v) { return v ? document.createTextNode(v) : h('span', { class: 'placeholder', text: FILL }); }

  function reportDate() {
    var dateField = fields.filter(function (f) { return f.type === 'date'; })[0];
    return dateField && values[dateField.key] ? values[dateField.key] : A.today();
  }

  /* حقل تاريخ نصي (مثل التاريخ الهجري المكتوب يدوياً) يُعتمد في الترويسة بدل تاريخ اليوم */
  function textDate() {
    if (fields.some(function (f) { return f.type === 'date'; })) return '';
    var f = fields.filter(function (x) { return x.key === 'date'; })[0];
    return f && values[f.key] ? String(values[f.key]).trim() : '';
  }

  function sigParts(sig) {
    var s = String(sig);
    var i = s.indexOf(':');
    return i === -1 ? { role: s, name: '' } : { role: s.slice(0, i), name: s.slice(i + 1) };
  }

  function render() {
    var paper = h('article', { class: 'paper', id: 'paper' });

    var office = teacher.office ? 'إدارة التعليم ب' + teacher.office : '';
    paper.appendChild(h('header', { class: 'paper-head' }, [
      h('div', { class: 'gov' }, [
        h('div', { text: 'المملكة العربية السعودية' }),
        h('div', { text: 'وزارة التعليم' }),
        h('div', null, office ? office : ['إدارة التعليم بـ', h('span', { class: 'placeholder', text: FILL })]),
        h('div', null, ['مدرسة ', val(teacher.school)])
      ]),
      A.logoImg('paper-logo') || paperMark(),
      h('div', { class: 'meta' }, [
        h('div', null, ['التاريخ: ', val(textDate() || fmtHijri(reportDate()) || fmtDate(reportDate()))]),
        !textDate() && fmtHijri(reportDate()) ? h('div', { text: 'الموافق: ' + fmtDate(reportDate()) }) : null,
        h('div', null, ['العام الدراسي: ', val(teacher.year)]),
        teacher.stage ? h('div', { text: teacher.stage }) : null
      ])
    ]));
    paper.appendChild(h('div', { class: 'paper-rule' }));
    paper.appendChild(h('h2', { class: 'paper-title', text: rep.title }));

    paper.appendChild(h('table', { class: 'paper-info' }, h('tbody', null, [
      h('tr', null, [h('th', { text: 'اسم المعلم/ـة' }), h('td', null, val(teacher.name)), h('th', { text: 'التخصص' }), h('td', null, val(teacher.subject))]),
      h('tr', null, [h('th', { text: 'المدرسة' }), h('td', null, val(teacher.school)), h('th', { text: 'عنصر الأداء' }), h('td', { text: el ? el.id + ' — ' + el.title : '' })])
    ])));

    (Array.isArray(rep.sections) ? rep.sections : []).forEach(function (sec) {
      var box = h('section', { class: 'paper-section' }, h('h3', null, tplNodes(sec.heading)));
      if (Array.isArray(sec.list)) {
        box.appendChild(h('ul', null, sec.list.map(function (it) { return h('li', null, tplNodes(it)); })));
      }
      if (sec.body !== undefined && sec.body !== null) box.appendChild(h('p', null, tplNodes(sec.body)));
      paper.appendChild(box);
    });

    var sigs = Array.isArray(rep.signatures) && rep.signatures.length ? rep.signatures : ['المعلم/ـة: {{teacher.name}}', 'مدير/ة المدرسة: {{teacher.principal}}'];
    paper.appendChild(h('div', { class: 'paper-signs-wrap' }, h('table', { class: 'paper-signs' }, h('tbody', null, h('tr', null, sigs.map(function (sg) {
      var p = sigParts(sg);
      return h('td', { style: 'width:' + (100 / sigs.length).toFixed(2) + '%' }, [
        h('div', { class: 'role' }, tplNodes(p.role.trim())),
        p.name ? h('div', null, tplNodes(p.name.trim())) : null,
        h('div', { class: 'sig-line', text: 'التوقيع: ........................' })
      ]);
    }))))));

    A.clear(paperHost).appendChild(paper);
    fitPaper();
  }

  function paperMark() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 40 40');
    svg.setAttribute('class', 'center-mark');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<g fill="none" stroke="currentColor" stroke-width="1.6"><rect x="9" y="9" width="22" height="22"/><rect x="9" y="9" width="22" height="22" transform="rotate(45 20 20)"/><circle cx="20" cy="20" r="5"/></g>';
    return svg;
  }

  /* تصغير الورقة على الشاشات الضيقة (الشاشة فقط) */
  function fitPaper() {
    var paper = document.getElementById('paper');
    if (!paper) return;
    paper.style.transform = '';
    paperHost.style.height = '';
    var avail = paperHost.clientWidth;
    var w = paper.offsetWidth;
    if (avail && w > avail) {
      var k = avail / w;
      paper.style.transform = 'scale(' + k + ')';
      paper.style.transformOrigin = 'top right';
      paperHost.style.height = (paper.offsetHeight * k) + 'px';
    }
  }
  var rt = null;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fitPaper, 120); });
  window.addEventListener('beforeprint', function () {
    var p = document.getElementById('paper');
    if (p) p.style.transform = '';
    paperHost.style.height = '';
  });
  window.addEventListener('afterprint', fitPaper);

  function doPrint() {
    S.setReportValues(rep.id, values);
    var p = document.getElementById('paper');
    if (p) p.style.transform = '';
    paperHost.style.height = '';
    window.print();
  }

  /* ===== نسخ النص ===== */
  function copyText() {
    var lines = [];
    lines.push('المملكة العربية السعودية');
    lines.push('وزارة التعليم');
    lines.push('إدارة التعليم ب' + (teacher.office || FILL));
    lines.push('مدرسة ' + (teacher.school || FILL));
    lines.push('');
    lines.push(rep.title);
    lines.push('التاريخ: ' + (textDate() ? textDate() : (fmtHijri(reportDate()) ? fmtHijri(reportDate()) + ' الموافق ' : '') + fmtDate(reportDate())) + (teacher.year ? ' — العام الدراسي: ' + teacher.year : ''));
    lines.push('اسم المعلم/ـة: ' + (teacher.name || FILL) + (teacher.subject ? ' — التخصص: ' + teacher.subject : ''));
    if (el) lines.push('عنصر الأداء: ' + el.title);
    (Array.isArray(rep.sections) ? rep.sections : []).forEach(function (sec) {
      lines.push('');
      lines.push('■ ' + tplText(sec.heading));
      if (Array.isArray(sec.list)) sec.list.forEach(function (it) { lines.push('• ' + tplText(it)); });
      if (sec.body !== undefined && sec.body !== null) lines.push(tplText(sec.body));
    });
    lines.push('');
    (rep.signatures || []).forEach(function (sg) { lines.push(tplText(sg) + '    التوقيع: ............'); });
    A.copy(lines.join('\n')).then(function (ok) { A.toast(ok ? 'تم نسخ نص التقرير' : 'تعذّر النسخ', ok ? '' : 'err'); });
  }

  render();
})();
