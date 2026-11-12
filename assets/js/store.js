/* store.js — التخزين المحلي والحسابات وترميز رابط المقيّم
 * لا يعتمد على DOM؛ يعمل في المتصفح وفي Node (للاختبار).
 */
(function (root) {
  'use strict';

  var KEY = 'ada1448:portfolio:v1';
  var TEACHER_KEYS = ['name', 'subject', 'school', 'office', 'year', 'principal', 'stage'];
  var MAX_TEXT = 200;
  var MAX_URL = 2048;

  function emptyState() {
    return { version: 1, teacher: {}, evidence: {}, reports: {} };
  }

  function isObj(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  function str(v, max) {
    if (v === null || v === undefined) return '';
    var s = String(v);
    return s.length > (max || MAX_TEXT) ? s.slice(0, max || MAX_TEXT) : s;
  }

  /* يقبل فقط روابط http/https ويعيد الرابط المطبّع أو "" */
  function safeUrl(v) {
    if (typeof v !== 'string') return '';
    var s = v.trim();
    if (!s || s.length > MAX_URL) return '';
    if (!/^https?:\/\//i.test(s)) return '';
    try {
      var u = new URL(s);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return '';
      return u.href;
    } catch (e) {
      return '';
    }
  }

  /* تنظيف أي حالة قادمة من التخزين أو الاستيراد */
  function sanitize(raw) {
    var out = emptyState();
    if (!isObj(raw)) return out;
    if (isObj(raw.teacher)) {
      TEACHER_KEYS.forEach(function (k) {
        if (raw.teacher[k] !== undefined) out.teacher[k] = str(raw.teacher[k]);
      });
    }
    if (isObj(raw.evidence)) {
      Object.keys(raw.evidence).forEach(function (id) {
        var e = raw.evidence[id];
        if (!isObj(e) || id.length > 40) return;
        var item = { done: !!e.done, link: str(e.link, MAX_URL).trim() };
        if (item.done || item.link) out.evidence[id] = item;
      });
    }
    if (isObj(raw.reports)) {
      Object.keys(raw.reports).forEach(function (rid) {
        var r = raw.reports[rid];
        if (!isObj(r) || rid.length > 40) return;
        var vals = {};
        Object.keys(r).forEach(function (k) {
          if (k.length <= 60) vals[k] = str(r[k], 5000);
        });
        out.reports[rid] = vals;
      });
    }
    return out;
  }

  var memory = null; // بديل عند تعذر localStorage

  function storage() {
    try {
      if (typeof localStorage === 'undefined') return null;
      var t = '__ada_t';
      localStorage.setItem(t, '1');
      localStorage.removeItem(t);
      return localStorage;
    } catch (e) {
      return null;
    }
  }

  function load() {
    var ls = storage();
    if (!ls) return sanitize(memory);
    try {
      var raw = ls.getItem(KEY);
      return raw ? sanitize(JSON.parse(raw)) : emptyState();
    } catch (e) {
      return emptyState();
    }
  }

  function save(state) {
    var clean = sanitize(state);
    memory = clean;
    var ls = storage();
    if (!ls) return false;
    try {
      ls.setItem(KEY, JSON.stringify(clean));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearAll() {
    memory = null;
    var ls = storage();
    if (!ls) return true;
    try {
      ls.removeItem(KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ===== عمليات مختصرة ===== */
  function getTeacher() { return load().teacher; }
  function setTeacher(t) {
    var s = load();
    s.teacher = {};
    TEACHER_KEYS.forEach(function (k) { if (t && t[k] !== undefined) s.teacher[k] = str(t[k]).trim(); });
    return save(s);
  }
  function getEvidence(id) {
    var e = load().evidence[id];
    return e ? { done: e.done, link: e.link } : { done: false, link: '' };
  }
  function setEvidence(id, patch) {
    var s = load();
    var cur = s.evidence[id] || { done: false, link: '' };
    if (patch && patch.done !== undefined) cur.done = !!patch.done;
    if (patch && patch.link !== undefined) cur.link = str(patch.link, MAX_URL).trim();
    s.evidence[id] = cur;
    return save(s);
  }
  function getReportValues(rid) { return load().reports[rid] || null; }
  function setReportValues(rid, vals) {
    var s = load();
    s.reports[rid] = vals || {};
    return save(s);
  }
  function clearReportValues(rid) {
    var s = load();
    delete s.reports[rid];
    return save(s);
  }
  function teacherFilled(t) {
    t = t || getTeacher();
    return !!(t.name && t.school);
  }

  /* ===== الحساب ===== */
  /* evidenceMap: { id: {done, link} } */
  function elementProgress(el, evidenceMap) {
    var list = (el && Array.isArray(el.evidence)) ? el.evidence : [];
    var total = list.length;
    var done = 0;
    list.forEach(function (ev) {
      var e = evidenceMap && evidenceMap[ev.id];
      if (e && e.done) done++;
    });
    return { done: done, total: total, ratio: total ? done / total : 0 };
  }

  /* الإنجاز الموزون = Σ(الوزن × نسبة الشواهد المكتملة) ÷ Σ الأوزان × 100 */
  function weightedScore(elements, evidenceMap) {
    var sumW = 0, acc = 0;
    (elements || []).forEach(function (el) {
      var w = Number(el.weight) || 0;
      sumW += w;
      acc += w * elementProgress(el, evidenceMap).ratio;
    });
    if (!sumW) return 0;
    return Math.round((acc / sumW) * 1000) / 10; // منزلة عشرية واحدة
  }

  /* ===== ترميز base64url مع دعم UTF-8 ===== */
  function b64urlEncode(text) {
    var bytes = new TextEncoder().encode(text);
    var bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlDecode(b64) {
    var s = String(b64).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  /* مفاتيح مختصرة لبيانات المعلم في رابط المقيّم */
  var SHORT = { name: 'n', subject: 's', school: 'c', office: 'o', year: 'y', principal: 'p', stage: 'g' };

  /* حمولة مضغوطة: {v:1, t:{n,s,...}, e:{ "e1-1": 1 | "https://..." }} */
  function buildSharePayload(state) {
    state = sanitize(state);
    var t = {};
    TEACHER_KEYS.forEach(function (k) { if (state.teacher[k]) t[SHORT[k]] = state.teacher[k]; });
    var e = {};
    Object.keys(state.evidence).forEach(function (id) {
      var ev = state.evidence[id];
      if (!ev.done) return;
      var link = safeUrl(ev.link);
      e[id] = link || 1;
    });
    return { v: 1, t: t, e: e };
  }

  function encodeShare(state) {
    return b64urlEncode(JSON.stringify(buildSharePayload(state)));
  }

  /* يفك الترميز ويعيد {teacher, evidence} منظفة، أو null عند الفشل */
  function decodeShare(code) {
    try {
      if (!code || String(code).length > 20000) return null;
      var obj = JSON.parse(b64urlDecode(code));
      if (!isObj(obj)) return null;
      var teacher = {};
      var t = isObj(obj.t) ? obj.t : {};
      TEACHER_KEYS.forEach(function (k) {
        var v = t[SHORT[k]];
        if (typeof v === 'string' || typeof v === 'number') teacher[k] = str(v).trim();
      });
      var evidence = {};
      var e = isObj(obj.e) ? obj.e : {};
      Object.keys(e).forEach(function (id) {
        if (id.length > 40) return;
        var val = e[id];
        evidence[id] = { done: true, link: typeof val === 'string' ? safeUrl(val) : '' };
      });
      return { teacher: teacher, evidence: evidence };
    } catch (err) {
      return null;
    }
  }

  /* ===== القوالب ===== */
  /* يستبدل {{key}} و{{teacher.x}}. fallback للقيم الفارغة. يعيد نصاً خاماً (يُعرض بـ textContent). */
  function fillTemplate(tpl, values, teacher, fallback) {
    if (tpl === null || tpl === undefined) return '';
    var fb = fallback === undefined ? '' : fallback;
    return String(tpl).replace(/\{\{\s*([\w.]+)\s*\}\}/g, function (m, key) {
      var v;
      if (key.indexOf('teacher.') === 0) {
        v = teacher ? teacher[key.slice(8)] : '';
      } else {
        v = values ? values[key] : '';
      }
      v = (v === null || v === undefined) ? '' : String(v).trim();
      return v || fb;
    });
  }

  /* ===== تصدير/استيراد ===== */
  function exportJSON() {
    var s = load();
    return JSON.stringify({
      app: 'ada1448-teacher-portfolio',
      exportedAt: new Date().toISOString(),
      data: s
    }, null, 2);
  }
  /* يعيد {ok:true, state} أو {ok:false} */
  function parseImport(text) {
    try {
      var obj = JSON.parse(text);
      if (!isObj(obj)) return { ok: false };
      var data = isObj(obj.data) ? obj.data : obj;
      if (!isObj(data.teacher) && !isObj(data.evidence) && !isObj(data.reports)) return { ok: false };
      return { ok: true, state: sanitize(data) };
    } catch (e) {
      return { ok: false };
    }
  }
  function importJSON(text) {
    var r = parseImport(text);
    if (!r.ok) return false;
    save(r.state); // عند تعذر localStorage تبقى في الذاكرة لهذه الجلسة
    return true;
  }

  var Store = {
    KEY: KEY,
    TEACHER_KEYS: TEACHER_KEYS,
    load: load,
    save: save,
    clearAll: clearAll,
    sanitize: sanitize,
    safeUrl: safeUrl,
    getTeacher: getTeacher,
    setTeacher: setTeacher,
    teacherFilled: teacherFilled,
    getEvidence: getEvidence,
    setEvidence: setEvidence,
    getReportValues: getReportValues,
    setReportValues: setReportValues,
    clearReportValues: clearReportValues,
    elementProgress: elementProgress,
    weightedScore: weightedScore,
    b64urlEncode: b64urlEncode,
    b64urlDecode: b64urlDecode,
    buildSharePayload: buildSharePayload,
    encodeShare: encodeShare,
    decodeShare: decodeShare,
    fillTemplate: fillTemplate,
    exportJSON: exportJSON,
    parseImport: parseImport,
    importJSON: importJSON
  };

  root.Store = Store;
  if (typeof module !== 'undefined' && module.exports) module.exports = Store;
})(typeof window !== 'undefined' ? window : globalThis);
