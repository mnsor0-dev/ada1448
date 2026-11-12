/* settings.js — بيانات المعلم والنسخ الاحتياطي */
(function () {
  'use strict';
  var A = window.App, S = window.Store, h = A.h;

  A.mountChrome('settings', {
    hero: h('div', { class: 'container page-hero' }, [
      h('div', { class: 'crumbs' }, [h('a', { href: 'index.html', text: 'الرئيسية' }), '›', h('span', { text: 'الإعدادات' })]),
      h('h1', { text: 'الإعدادات' }),
      h('p', { text: 'بياناتك تظهر تلقائياً في التقارير وعرض المقيّم، وتُحفظ في هذا المتصفح فقط.' })
    ])
  });

  var main = document.getElementById('main');
  A.clear(main);
  var wrap = h('div', { class: 'container overlap' });
  main.appendChild(wrap);

  /* ===== بيانات المعلم ===== */
  var FIELDS = [
    { key: 'name', label: 'اسم المعلم/ـة', ph: 'مثال: أحمد بن محمد العتيبي', auto: 'name' },
    { key: 'subject', label: 'التخصص / المادة', ph: 'مثال: الرياضيات' },
    { key: 'stage', label: 'المرحلة', type: 'select', options: ['', 'رياض الأطفال', 'المرحلة الابتدائية', 'المرحلة المتوسطة', 'المرحلة الثانوية'] },
    { key: 'school', label: 'اسم المدرسة', ph: 'مثال: الأمير سلطان الابتدائية', help: 'يظهر في التقرير: «مدرسة …»' },
    { key: 'office', label: 'إدارة التعليم', ph: 'مثال: الرياض', help: 'يظهر في التقرير: «إدارة التعليم بـ…» — اكتب اسم المنطقة/المحافظة فقط' },
    { key: 'year', label: 'العام الدراسي', ph: 'مثال: 1448هـ' },
    { key: 'principal', label: 'اسم مدير/ة المدرسة', ph: 'يظهر في خانة التوقيع' }
  ];

  var t = S.getTeacher();
  var inputs = {};
  var status = h('div', { class: 'status-msg', role: 'status', 'aria-live': 'polite' });
  var grid = h('div', { class: 'grid-2' });
  var timer = null;

  FIELDS.forEach(function (f) {
    var id = 's-' + f.key, ctrl;
    if (f.type === 'select') {
      ctrl = h('select', { id: id }, f.options.map(function (o) { return h('option', { value: o, text: o || '— اختر —' }); }));
      if (t[f.key] && f.options.indexOf(t[f.key]) === -1) ctrl.appendChild(h('option', { value: t[f.key], text: t[f.key] }));
      ctrl.value = t[f.key] || '';
    } else {
      ctrl = h('input', { id: id, type: 'text', value: t[f.key] || '', placeholder: f.ph || '', maxlength: '200', autocomplete: f.auto || 'off' });
    }
    ctrl.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { saveTeacher(true); }, 500); });
    ctrl.addEventListener('change', function () { saveTeacher(true); });
    inputs[f.key] = ctrl;
    grid.appendChild(h('div', { class: 'field' }, [h('label', { for: id, text: f.label }), ctrl, f.help ? h('span', { class: 'help', text: f.help }) : null]));
  });

  function saveTeacher(quiet) {
    clearTimeout(timer);
    var obj = {};
    FIELDS.forEach(function (f) { obj[f.key] = inputs[f.key].value; });
    var ok = S.setTeacher(obj);
    status.className = 'status-msg ' + (ok ? 'ok' : 'err');
    status.textContent = ok ? 'تم الحفظ ✓' : 'تعذّر الحفظ في المتصفح (قد يكون التخزين معطلاً أو في وضع التصفح الخاص). صدّر نسخة احتياطية.';
    if (!quiet && ok) A.toast('تم حفظ البيانات');
  }

  wrap.appendChild(h('section', { class: 'card' }, [
    h('h2', { class: 'card-title' }, [A.icon('gear'), 'بيانات المعلم']),
    grid,
    h('div', { class: 'btn-row' }, [
      h('button', { type: 'button', class: 'btn', on: { click: function () { saveTeacher(false); } } }, [A.icon('check'), 'حفظ']),
      h('a', { href: 'index.html', class: 'btn btn-outline' }, 'العودة للوحة الإنجاز')
    ]),
    status
  ]));

  /* ===== النسخ الاحتياطي ===== */
  var backupStatus = h('div', { class: 'status-msg', role: 'status', 'aria-live': 'polite' });
  var fileInput = h('input', { type: 'file', accept: 'application/json,.json', class: 'file-input', id: 'import-file' });
  fileInput.addEventListener('change', function () {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setBackup(false, 'الملف كبير جداً.'); fileInput.value = ''; return; }
    var reader = new FileReader();
    reader.onload = function () {
      var ok = S.importJSON(String(reader.result || ''));
      if (ok) {
        setBackup(true, 'تم استيراد النسخة الاحتياطية بنجاح.');
        var nt = S.getTeacher();
        FIELDS.forEach(function (f) {
          var c = inputs[f.key];
          if (c.tagName === 'SELECT' && nt[f.key] && f.options.indexOf(nt[f.key]) === -1) c.appendChild(h('option', { value: nt[f.key], text: nt[f.key] }));
          c.value = nt[f.key] || '';
        });
        A.toast('تم الاستيراد');
      } else {
        setBackup(false, 'الملف غير صالح. اختر ملف JSON صدّرته من هذا الموقع.');
      }
      fileInput.value = '';
    };
    reader.onerror = function () { setBackup(false, 'تعذّرت قراءة الملف.'); fileInput.value = ''; };
    reader.readAsText(file);
  });
  function setBackup(ok, msg) { backupStatus.className = 'status-msg ' + (ok ? 'ok' : 'err'); backupStatus.textContent = msg; }

  function doExport() {
    try {
      var blob = new Blob([S.exportJSON()], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = h('a', { href: url, download: 'ملف-الإنجاز-' + A.today() + '.json' });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      setBackup(true, 'تم تنزيل النسخة الاحتياطية.');
    } catch (e) {
      setBackup(false, 'تعذّر التصدير في هذا المتصفح.');
    }
  }

  wrap.appendChild(h('section', { class: 'card' }, [
    h('h2', { class: 'card-title' }, [A.icon('download'), 'النسخ الاحتياطي']),
    h('p', { class: 'muted', text: 'بياناتك محفوظة في هذا المتصفح فقط. صدّر نسخة JSON دورياً واحفظها في Drive، ويمكنك استيرادها على جهاز آخر.' }),
    h('div', { class: 'btn-row' }, [
      h('button', { type: 'button', class: 'btn', on: { click: doExport } }, [A.icon('download'), 'تصدير JSON']),
      h('label', { for: 'import-file', class: 'btn btn-outline', tabindex: '0', role: 'button', on: { keydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } } } }, [A.icon('upload'), 'استيراد JSON']),
      fileInput
    ]),
    backupStatus
  ]));

  /* ===== مسح البيانات ===== */
  var confirmBox = h('div', { class: 'confirm-box', role: 'alertdialog', 'aria-labelledby': 'confirm-text' });
  var clearBtn = h('button', { type: 'button', class: 'btn btn-outline', style: 'color:var(--danger);border-color:rgba(168,50,43,.4)', on: { click: function () {
    confirmBox.classList.add('show');
    clearBtn.setAttribute('aria-expanded', 'true');
    yesBtn.focus();
  } } }, [A.icon('trash'), 'مسح جميع البيانات']);
  var yesBtn = h('button', { type: 'button', class: 'btn btn-danger btn-sm', on: { click: function () {
    S.clearAll();
    FIELDS.forEach(function (f) { inputs[f.key].value = ''; });
    confirmBox.classList.remove('show');
    status.textContent = '';
    A.toast('تم مسح جميع البيانات');
    setTimeout(function () { location.href = 'index.html'; }, 900);
  } } }, 'نعم، امسح كل شيء');
  var noBtn = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', on: { click: function () {
    confirmBox.classList.remove('show');
    clearBtn.setAttribute('aria-expanded', 'false');
    clearBtn.focus();
  } } }, 'إلغاء');
  A.append(confirmBox, [
    h('p', { id: 'confirm-text', text: 'سيتم حذف بيانات المعلم وحالة الشواهد وروابطها وقيم التقارير من هذا المتصفح نهائياً. هل أنت متأكد؟ ننصح بتصدير نسخة احتياطية أولاً.' }),
    h('div', { class: 'btn-row' }, [yesBtn, noBtn])
  ]);

  wrap.appendChild(h('section', { class: 'card' }, [
    h('h2', { class: 'card-title' }, [A.icon('trash'), 'مسح البيانات']),
    h('p', { class: 'muted', text: 'إعادة الموقع إلى حالته الأولى على هذا الجهاز.' }),
    clearBtn,
    confirmBox
  ]));
})();
