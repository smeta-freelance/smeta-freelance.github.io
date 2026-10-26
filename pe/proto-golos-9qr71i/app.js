/* Дружелюбная страница согласования — прототип.
   Сохранение: Supabase (sf_votes / sf_comments, разделы proto-test-*, голос — sf-voice/proto-test/…) или «демо» (только на устройстве).
   Правило PostgREST: return=minimal → пустое тело, поэтому r.text() и JSON.parse только если не пусто. */
(function () {
  'use strict';
  var D = window.PROTO, CFG = window.PROTO_SB || { mode: 'demo' };
  var SL = D.slides, N = SL.length, PREFIX = 'proto-test-';
  var DEMO = CFG.mode !== 'supabase' || !CFG.url || !CFG.key;
  var $ = function (id) { return document.getElementById(id); };
  var UA = navigator.userAgent || '';
  var IOS = /iPhone|iPad|iPod/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
  var ANDROID = /Android/.test(UA);
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var LIMIT = 300, WARN_AT = 270; /* 5 минут, предупреждение за 30 с */

  /* ---------- хранилище на устройстве ---------- */
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  var ST;
  try { ST = JSON.parse(ls('proto-state') || 'null'); } catch (e) { ST = null; }
  if (!ST) ST = { entered: false, cur: 0, ans: {}, voices: {}, queue: [], consent: false, done: false, visited: {} };
  function save() { ls('proto-state', JSON.stringify(ST)); }
  var voter = ls('proto-voter'); if (!voter) { voter = 'p' + Math.random().toString(36).slice(2) + Date.now().toString(36); ls('proto-voter', voter); }
  var AUTHOR = 'Проба прототипа (' + voter.slice(1, 6) + ')';
  function A(sid) { return ST.ans[sid] || (ST.ans[sid] = { choice: null, textSaved: '', voices: [] }); }
  function uuid() { try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (e) {} return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }); }

  /* IndexedDB для голосовых (localStorage не вмещает аудио) */
  var MEM = {}, dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res) {
      try { var r = indexedDB.open('proto-friendly', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('blobs'); };
        r.onsuccess = function () { res(r.result); }; r.onerror = function () { res(null); };
      } catch (e) { res(null); }
    });
    return dbp;
  }
  function idbPut(id, val) { MEM[id] = val; return db().then(function (d) { if (!d) return; return new Promise(function (res) { try { var t = d.transaction('blobs', 'readwrite'); t.objectStore('blobs').put(val, id); t.oncomplete = res; t.onerror = res; } catch (e) { res(); } }); }); }
  function idbGet(id) { if (MEM[id]) return Promise.resolve(MEM[id]); return db().then(function (d) { if (!d) return null; return new Promise(function (res) { try { var q = d.transaction('blobs').objectStore('blobs').get(id); q.onsuccess = function () { res(q.result || null); }; q.onerror = function () { res(null); }; } catch (e) { res(null); } }); }); }
  function idbDel(id) { return db().then(function (d) { if (!d) return; try { d.transaction('blobs', 'readwrite').objectStore('blobs').delete(id); } catch (e) {} }); }

  /* ---------- сеть ---------- */
  var BASE = DEMO ? '' : CFG.url.replace(/\/$/, '');
  function H(extra) { var h = { apikey: CFG.key, Authorization: 'Bearer ' + CFG.key }; for (var k in extra) h[k] = extra[k]; return h; }
  function NetErr(status, retry) { var e = new Error('net ' + status); e.status = status; e.retry = retry; return e; }
  function req(path, opt) {
    var ctl = window.AbortController ? new AbortController() : null, tm = ctl ? setTimeout(function () { ctl.abort(); }, 30000) : 0;
    if (ctl) opt.signal = ctl.signal;
    return fetch(BASE + path, opt).then(function (r) {
      clearTimeout(tm);
      return r.text().then(function (t) {
        if (r.ok) return t ? JSON.parse(t) : null;
        if (r.status === 409 || /Duplicate|already exists/i.test(t)) return null; /* уже есть = успех */
        throw NetErr(r.status, r.status >= 500 || r.status === 408 || r.status === 429);
      });
    }, function () { clearTimeout(tm); throw NetErr(0, true); });
  }
  function vote(sec, verdict) { return req('/rest/v1/sf_votes?on_conflict=section,voter', { method: 'POST', headers: H({ 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }), body: JSON.stringify({ section: sec, voter: voter, author: AUTHOR, verdict: verdict, updated_at: new Date().toISOString() }) }); }
  function comment(sec, body) { return req('/rest/v1/sf_comments', { method: 'POST', headers: H({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }), body: JSON.stringify({ section: sec, voter: voter, author: AUTHOR, body: String(body) }) }); }
  function upload(path, blob, type) { return req('/storage/v1/object/sf-voice/' + path, { method: 'POST', headers: H({ 'Content-Type': (type || 'application/octet-stream').split(';')[0], 'x-upsert': 'false' }), body: blob }); }

  /* ---------- очередь: всё уходит само, при обрыве — повтор ---------- */
  var BACK = [2, 5, 15, 30, 60], step = 0, timer = 0, busy = false, NETDOWN = false;
  function enqueue(op) {
    op.id = op.id || uuid(); op.tries = 0;
    if (op.t === 'vote') ST.queue = ST.queue.filter(function (o) { return !(o.t === 'vote' && o.sec === op.sec); });
    ST.queue.push(op); save(); setSave('wait'); flush();
  }
  function runOp(op) {
    if (DEMO) return new Promise(function (r) { setTimeout(r, 350); }).then(function () { if (op.t === 'voice') return finishVoice(op); });
    if (op.t === 'vote') return vote(op.sec, op.verdict);
    if (op.t === 'cmt') { /* в базе строка до 2000 знаков — длинный текст уходит частями, ничего не обрезаем */
      var body = String(op.body), parts = [];
      if (body.length <= 2000) parts = [body]; else { var n = Math.ceil(body.length / 1900); for (var i = 0; i < n; i++) parts.push('[часть ' + (i + 1) + '/' + n + '] ' + body.slice(i * 1900, (i + 1) * 1900)); }
      var from = op.done || 0;
      return parts.slice(from).reduce(function (p, part, j) { return p.then(function () { return comment(op.sec, part).then(function () { op.done = from + j + 1; save(); }); }); }, Promise.resolve()); }
    if (op.t === 'voice') {
      var v = ST.voices[op.vid]; if (!v) return Promise.resolve();
      var p = v.uploaded ? Promise.resolve() : idbGet(op.vid).then(function (rec) {
        if (!rec) throw NetErr(404, false);
        return upload(v.path, rec.blob, rec.type).then(function () { v.uploaded = true; save(); });
      });
      return p.then(function () { return comment(PREFIX + v.sid, '[голос] ' + v.path + '|' + v.sec + '|' + v.id); }).then(function () { return finishVoice(op); });
    }
    return Promise.resolve();
  }
  function finishVoice(op) { var v = ST.voices[op.vid]; if (!v) return; v.status = 'done'; v.savedAt = Date.now(); save(); if (!DEMO) idbDel(op.vid); renderCards(); }
  function flush() {
    if (busy) return; clearTimeout(timer);
    var op = ST.queue[0];
    if (!op) { step = 0; if (lastWasWork) setSave('ok'); return; }
    busy = true; lastWasWork = true;
    runOp(op).then(function () {
      busy = false; step = 0; if (NETDOWN) { NETDOWN = false; renderCards(); } ST.queue.shift(); save(); flush();
    }, function (e) {
      busy = false;
      if (e && e.retry) { NETDOWN = true; setSave('off'); markPending(); timer = setTimeout(flush, BACK[Math.min(step++, BACK.length - 1)] * 1000); return; }
      op.tries++;
      if (op.tries < 3) { timer = setTimeout(flush, 2000); return; }
      ST.queue.shift();
      if (op.t === 'voice' && ST.voices[op.vid]) ST.voices[op.vid].status = 'fail';
      save(); setSave('fail'); renderCards(); flush();
    });
  }
  var lastWasWork = false;
  function markPending() { renderCards(); }
  window.addEventListener('online', function () { step = 0; flush(); });
  window.addEventListener('beforeunload', function (e) { var act = !navigator.userActivation || navigator.userActivation.hasBeenActive; if (act && (ST.queue.length || REC)) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- строка сохранения ---------- */
  function hm() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  var WAITERS = []; /* поля текста ждут подтверждения сохранения */
  function setSave(k) {
    if (k === 'ok') { WAITERS.forEach(function (f) { f('ok', '✓ Сохранено'); }); WAITERS = []; }
    if (k === 'off') WAITERS.forEach(function (f) { f('warn', 'Нет связи — текст сохранён на этом устройстве, отправим сами'); });
    if (k === 'fail') { WAITERS.forEach(function (f) { f('warn', 'Не получилось сохранить — текст остался в поле'); }); WAITERS = []; }
    var s = $('save'); s.className = 'save ' + k;
    s.textContent = k === 'wait' ? 'Сохраняю…'
      : k === 'ok' ? '✓ Сохранено в ' + hm() + (DEMO ? ' (на этом устройстве)' : '')
      : k === 'off' ? 'Нет связи. Ваш ответ сохранён на этом устройстве, отправим сами, когда появится интернет'
      : k === 'fail' ? 'Не получилось сохранить. Ответ остаётся на этом устройстве — нажмите «Обсудить с Яной»'
      : 'Всё сохраняется само. Любой ответ можно изменить.';
  }

  /* ---------- экраны ---------- */
  var SCREENS = ['s-login', 's-hello', 's-slide', 's-final', 's-thanks'];
  function show(id) {
    SCREENS.forEach(function (s) { $(s).hidden = s !== id; });
    $('bottom').hidden = id !== 's-slide'; document.body.classList.toggle('on-slide', id === 's-slide');
    window.scrollTo(0, 0);
    if (id === 's-hello') renderHello();
    if (id === 's-final') renderFinal();
  }
  function fill() {
    document.querySelectorAll('.lesson').forEach(function (e) { e.textContent = D.lesson; });
    document.querySelectorAll('.expert').forEach(function (e) { e.textContent = D.expert; });
    document.querySelectorAll('.nslides').forEach(function (e) { e.textContent = N; });
    document.querySelectorAll('.mins').forEach(function (e) { e.textContent = Math.max(5, Math.round(N * 1.5)); });
    document.querySelectorAll('.ver').forEach(function (e) { e.textContent = 'Версия страницы: ' + D.built + (DEMO ? ' · режим «демо»' : ''); });
  }

  /* вход */
  function login() {
    var b = $('loginBtn'), v = $('code').value.replace(/\D/g, '');
    b.textContent = 'Открываю…'; b.disabled = true; $('code').disabled = true; $('codeErr').hidden = true;
    setTimeout(function () {
      b.textContent = 'Открыть презентацию'; b.disabled = false; $('code').disabled = false;
      if (v === '123456') { ST.entered = true; save(); show('s-hello'); }
      else { $('codeErr').hidden = false; $('code').focus(); }
    }, 300);
  }

  /* приветствие */
  function answered(sid) { return !!kind(sid); }
  function countAns() { return SL.filter(function (s) { return answered(s.id); }).length; }
  function firstOpen() { for (var i = 0; i < N; i++) if (!answered(SL[i].id)) return i; return N - 1; }
  function dmy(t) { var d = new Date(t); return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear() + ' в ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function renderHello() {
    var c = countAns(), back = c > 0 || Object.keys(ST.visited).length > 0, sent = !!ST.done;
    $('helloSent').hidden = !sent; $('sentBtns').hidden = !sent; $('startBtn').hidden = sent; $('micTest').hidden = sent;
    if (sent) { $('sentText').textContent = 'Ваши ответы уже у Яны ✓ (' + dmy(ST.doneAt || Date.now()) + ')'; $('sentSub').textContent = 'Вы ответили на ' + c + ' из ' + N + ' слайдов. Вспомнили что-то ещё — добавьте правку, она тоже дойдёт до Яны.'; }
    $('helloNew').hidden = back || sent; $('helloBack').hidden = !back || sent; $('restartBtn').hidden = !back || sent;
    var nx = firstOpen();
    $('backText').textContent = 'Вы ответили на ' + c + ' из ' + N + ' слайдов. Всё, что Вы сказали и написали, сохранено.';
    $('startBtn').textContent = back ? (c >= N ? 'Перейти к проверке ответов' : 'Продолжить — слайд ' + (nx + 1)) : 'Начать — слайд 1 из ' + N;
    $('startBtn').onclick = function () { if (back && c >= N) show('s-final'); else go(back ? nx : 0); };
  }

  /* ---------- слайд ---------- */
  var cur = 0, tab = 'now';
  function setChoice(sid, c) { var a = A(sid);
    if (a.choice === 'orig' && c !== 'orig') enqueue({ t: 'cmt', sec: PREFIX + sid, body: '[выбор отменён] «оставить как было у автора» больше не действует — новый ответ: ' + stWord(c) });
    a.choice = c; }
  function kind(sid) { var a = ST.ans[sid]; return a ? a.choice : null; }
  function liveVoices(sid) { return (A(sid).voices || []).map(function (id) { return ST.voices[id]; }).filter(function (v) { return v && v.status !== 'deleted' && v.status !== 'replaced'; }); }
  var TC = [];
  function go(i) {
    TC.forEach(function (t) { t.commit(false); });
    if (REC) stopRec('nav');
    cur = Math.max(0, Math.min(N - 1, i)); ST.cur = cur; ST.visited[SL[cur].id] = 1; save();
    show('s-slide'); renderSlide();
  }
  function renderSlide() {
    var s = SL[cur];
    $('sTitle').textContent = 'Слайд ' + s.n + '. ' + s.title;
    $('imgWas').src = s.was; $('imgNow').src = s.now;
    $('imgWas').alt = 'Как сейчас: ' + s.title; $('imgNow').alt = 'Как предлагаем: ' + s.title;
    setTab('now');
    $('why').innerHTML = ''; var b = document.createElement('b'); b.textContent = 'Что поменяли: '; $('why').appendChild(b);
    $('why').appendChild(document.createTextNode((s.why || []).map(function (x) { return /[.…!?]$/.test(x) ? x : x + '.'; }).join(' ')));
    $('nextBtn').textContent = cur === N - 1 ? 'Завершить →' : 'Далее →';
    $('prevBtn').disabled = false;
    $('toast').hidden = true;
    var a = A(s.id);
    $('ta').value = ls('proto-draft-' + s.id) || a.textSaved || '';
    $('textBox').hidden = !$('ta').value; $('taStat').textContent = a.textSaved && $('ta').value === a.textSaved ? '✓ Сохранено' : ''; $('taStat').className = 'tstat ok';
    $('textBtn').hidden = !$('textBox').hidden;
    renderKeep(); renderProgress(); renderVoice($('voiceBox'), s.id); renderCards();
  }
  function setTab(t) {
    tab = t;
    document.querySelectorAll('.tab').forEach(function (b) { var on = b.dataset.tab === t; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    document.querySelectorAll('.pic').forEach(function (p) { p.classList.toggle('show', p.dataset.k === t); });
  }
  var REWARD = { half: 'Половина позади. Спасибо за внимание к деталям', 3: 'Осталось 3 слайда', 2: 'Осталось 2 слайда — почти всё', 1: 'Остался 1 слайд', last: 'Последний слайд' };
  function renderProgress() {
    var left = N - cur - 1;
    $('progT').innerHTML = 'Слайд <b>' + (cur + 1) + '</b> из <b>' + N + '</b>';
    var rw = left === 0 ? REWARD.last : (cur + 1 === Math.ceil(N / 2) && N > 3) ? REWARD.half : left <= 3 ? REWARD[left] : '';
    $('progR').textContent = rw || 'Осталось ' + left; $('progR').classList.toggle('reward', !!rw);
    var box = $('segs'); box.textContent = '';
    SL.forEach(function (s, i) {
      var b = document.createElement('button'); b.type = 'button';
      var k = kind(s.id); b.className = 'seg' + (k ? ' ' + k : '') + (i === cur ? ' cur' : '');
      b.setAttribute('aria-label', 'Слайд ' + (i + 1) + ': ' + stWord(k)); b.onclick = function () { go(i); };
      box.appendChild(b);
    });
  }
  function stWord(k) { return k === 'keep' ? '✓ Принимаю новый вариант' : k === 'voice' ? '🎤 Голосовое' : k === 'text' ? '✎ Текст' : k === 'orig' ? '↩ Вернуть старый вариант' : 'Без ответа'; }

  /* «Хорошо, так и оставим»: повторное нажатие выбор не снимает — меняется голосом, текстом или «как было» */
  var MSG_KEEP = ['Принято. Спасибо', 'Отлично, этот слайд готов', 'Спасибо — едем дальше', 'Записала. Хорошее решение'];
  var MSG_VOICE = ['Спасибо, голосовое у нас. Яна послушает его сегодня', 'Услышали. Внесём, как Вы сказали', 'Спасибо за точное замечание — именно такие делают урок сильнее', 'Принято. Ваш опыт здесь виден сразу'];
  var MSG_TEXT = ['Спасибо, правка записана', 'Принято — поправим', 'Понятно, сделаем так'];
  var MSG_ORIG = ['Хорошо, оставим Ваш вариант', 'Принято — Ваш слайд остаётся как был'];
  var mi = {}; function msg(arr, key) { mi[key] = ((mi[key] == null ? -1 : mi[key]) + 1) % arr.length; return arr[mi[key]]; }
  function toast(t) { var e = $('toast'); e.textContent = '✓ ' + t; e.hidden = false; clearTimeout(e._t); e._t = setTimeout(function () { e.hidden = true; }, 2600); }
  function renderKeep() {
    var k = kind(SL[cur].id), b = $('keepBtn');
    b.classList.toggle('on', k === 'keep'); b.setAttribute('aria-pressed', k === 'keep');
    b.textContent = k === 'keep' ? '✓ Принимаю новый вариант' : '👍 Принимаю новый вариант';
    var o = $('origBtn'); o.classList.toggle('on', k === 'orig'); o.setAttribute('aria-pressed', k === 'orig');
    o.textContent = k === 'orig' ? '✓ Верните мой старый вариант' : '↩ Верните мой старый вариант';
    $('keepMark').hidden = k !== 'keep'; $('origMark').hidden = k !== 'orig';
  }
  var advT = 0;
  function doKeep(confirmed) {
    var sid = SL[cur].id, a = A(sid);
    if (a.choice === 'keep') { toast('Выбор уже сохранён. Передумали — скажите голосом, напишите текстом или верните старый вариант'); return; }
    if (!confirmed && liveVoices(sid).length) { askInline($('keepBtn'), 'У Вас есть голосовое на этом слайде. Всё-таки принять новый вариант без правок?', 'Да, принимаю', 'Нет, учесть голосовое', function () { doKeep(true); }); return; }
    setChoice(sid, 'keep'); save(); renderKeep(); renderProgress();
    enqueue({ t: 'vote', sec: PREFIX + sid, verdict: 'keep' });
    toast(msg(MSG_KEEP, 'k'));
    clearTimeout(advT); var at = cur;
    advT = setTimeout(function () { if (cur === at && !$('s-slide').hidden) next(); }, 1200);
  }
  function doOrig() {
    var sid = SL[cur].id, a = A(sid);
    if (a.choice === 'orig') { toast('Выбор уже сохранён: возвращаем Ваш вариант'); return; }
    setChoice(sid, 'orig'); save(); renderKeep(); renderProgress();
    enqueue({ t: 'vote', sec: PREFIX + sid, verdict: 'drop' });
    enqueue({ t: 'cmt', sec: PREFIX + sid, body: '[выбор] оставить как было у автора' });
    toast(msg(MSG_ORIG, 'o'));
  }
  function next() { if (cur < N - 1) go(cur + 1); else { TC.forEach(function (t) { t.commit(false); }); if (REC) stopRec('nav'); show('s-final'); } }

  /* вопрос прямо на месте, без всплывающих окон */
  function askInline(after, q, yes, no, onYes, onNo) {
    var old = after.parentNode.querySelector('.ask'); if (old) old.remove();
    var box = document.createElement('div'); box.className = 'vcard ask';
    var p = document.createElement('p'); p.textContent = q; box.appendChild(p);
    var r = document.createElement('div'); r.className = 'acts';
    var y = mkBtn(yes, 'btn primary'), n = mkBtn(no, 'btn ghost');
    y.onclick = function () { box.remove(); onYes(); }; n.onclick = function () { box.remove(); if (onNo) onNo(); };
    r.appendChild(y); r.appendChild(n); box.appendChild(r);
    after.parentNode.insertBefore(box, after.nextSibling); y.focus();
  }
  function mkBtn(t, c) { var b = document.createElement('button'); b.type = 'button'; b.className = c; b.textContent = t; return b; }

  /* ---------- текст ---------- */
  var MAXT = 5000;
  function textCtl(sidFn, ta, stat, box, openBtn, cnt) {
    var tmr = 0, dr = 0;
    function count() { var l = ta.value.trim().length; cnt.hidden = l < MAXT - 1000; cnt.className = 'cnt' + (l > MAXT ? ' over' : ''); cnt.textContent = l > MAXT ? 'Больше лимита, знаков лишних: ' + (l - MAXT) + ' — сократите' : 'Осталось знаков: ' + (MAXT - l); }
    function put(cls, t) { stat.className = 'tstat ' + cls; stat.textContent = t; }
    function commit(manual) {
      var sid = sidFn(), v = ta.value.trim(), a = A(sid);
      if (!v) { if (manual) put('warn', 'Напишите хотя бы пару слов — или скажите голосом'); return; }
      if (v.length > MAXT) { put('warn', 'Текст длиннее ' + MAXT + ' знаков (сейчас ' + v.length + ') — пока не сохранён. Сократите или часть скажите голосом. Текст остаётся в поле'); return; }
      if (v === a.textSaved) { if (manual) put('ok', '✓ Уже сохранено'); return; }
      a.textSaved = v; if (sid !== 'all') setChoice(sid, 'text'); save();
      ls('proto-draft-' + sid, null);
      put('wait', 'Сохраняю…');
      enqueue({ t: 'cmt', sec: PREFIX + sid, body: v });
      if (sid !== 'all') enqueue({ t: 'vote', sec: PREFIX + sid, verdict: 'redo' });
      WAITERS.push(put);
      if (sid !== 'all') { renderKeep(); renderProgress(); toast(msg(MSG_TEXT, 't')); }
    }
    ta.addEventListener('input', function () {
      var sid = sidFn(); clearTimeout(dr); clearTimeout(tmr); count();
      dr = setTimeout(function () { ls('proto-draft-' + sid, ta.value); }, 500);
      tmr = setTimeout(function () { commit(false); }, 3000);
      if (ta.value.trim() !== A(sid).textSaved) put('wait', 'Черновик сохранён на этом устройстве');
    });
    ta.addEventListener('blur', function () { clearTimeout(tmr); commit(false); });
    function open() { box.hidden = false; openBtn.hidden = true; ta.focus({ preventScroll: true }); count(); setTimeout(function () { var b = box.querySelector('.row'); if (b) b.scrollIntoView({ block: 'nearest' }); }, 120); }
    openBtn.addEventListener('click', open);
    return { count: count, commit: commit, open: open };
  }

  /* ---------- голос ---------- */
  var REC = null; /* текущая запись */
  function pickMime() {
    var c = ['audio/webm;codecs=opus', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/ogg;codecs=opus', ''];
    for (var i = 0; i < c.length; i++) { if (!c[i]) return ''; try { if (MediaRecorder.isTypeSupported(c[i])) return c[i]; } catch (e) {} }
    return '';
  }
  function extOf(t) { return /webm/.test(t) ? 'webm' : /mp4|aac|m4a/.test(t) ? 'm4a' : /ogg/.test(t) ? 'ogg' : /mpeg|mp3/.test(t) ? 'mp3' : /wav/.test(t) ? 'wav' : 'webm'; }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }

  function renderVoice(box, sid) {
    box.textContent = ''; box.dataset.sid = sid;
    var recNow = REC && REC.sid === sid && !REC.test;
    var b = mkBtn('', 'btn primary wide vbtn'); b.id = sid === 'all' ? 'vbtnAll' : 'vbtn';
    if (recNow) { b.classList.add('rec'); b.innerHTML = '<span class="dot"></span> ✓ Готово'; }
    else b.textContent = (liveVoices(sid).length ? '🎤 Добавить ещё голосовое' : '🎤 Сказать голосом');
    b.onclick = function () { if (REC && REC.sid === sid && !REC.test) stopRec('done'); else startRec(sid, box); };
    box.appendChild(b);
    if (recNow) {
      var ri = document.createElement('div'); ri.className = 'recinfo';
      ri.innerHTML = '<span><b>● Идёт запись</b> · <span class="rt">' + mmss((Date.now() - REC.t0) / 1000) + '</span></span>';
      var c = mkBtn('Отменить запись', 'link'); c.onclick = function () { stopRec('cancel'); }; ri.appendChild(c);
      box.appendChild(ri);
      var lv = document.createElement('div'); lv.className = 'level'; lv.innerHTML = '<i></i>'; box.appendChild(lv);
      var h = document.createElement('p'); h.className = 'muted rh'; h.textContent = 'Говорите, как удобно — своими словами, как коллеге. Оговорки не страшны. Закончили — нажмите «Готово».'; box.appendChild(h);
      var lv2 = document.createElement('p'); lv2.className = 'live'; lv2.hidden = true; box.appendChild(lv2);
      REC.ui = { time: ri.querySelector('.rt'), lvl: lv.firstChild, hint: h, live: lv2 };
    } else {
      var p = document.createElement('p'); p.className = 'consent';
      p.innerHTML = (ST.consent ? 'Запись хранится для расшифровки и удаляется в течение 7 дней. ' : 'Нажимая «Сказать голосом», Вы соглашаетесь, что Академия сохранит запись для расшифровки и удалит её в течение 7 дней. ')
        + '<details><summary>Подробнее</summary><span class="more-t">Голосовое нужно, чтобы Яна услышала Ваши правки и перенесла их в слайды. Голос не используется для установления личности. Запись хранится не дольше 7 дней после расшифровки, затем удаляется. Не хотите записывать голос — нажмите «Написать текстом».</span></details>';
      box.appendChild(p);
    }
  }

  function startRec(sid, box, test) {
    if (REC) stopRec(REC.test ? 'cancel' : 'done');
    clearTimeout(advT);
    var hasMR = !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    if (!hasMR) { micHelp(window.isSecureContext === false ? 'insecure' : 'nosupport', sid); return; }
    if (!test && !ST.consent) { ST.consent = true; save(); enqueue({ t: 'cmt', sec: PREFIX + 'consent', body: '[согласие] нажата кнопка «Сказать голосом» на слайде ' + sid + ', текст согласия: сохранить запись для расшифровки и удалить в течение 7 дней' }); }
    /* AudioContext создаём сразу в обработчике нажатия — иначе Safari его не запустит */
    var AC = window.AudioContext || window.webkitAudioContext, ac = null;
    try { ac = AC ? new AC() : null; } catch (e) { ac = null; }
    var R = REC = { sid: sid, box: box, test: !!test, chunks: [], t0: Date.now(), ac: ac, peak: 0, loud: Date.now(), id: uuid(), starting: true };
    var pre = function () {
      if (test) { $('micTestHint').textContent = 'Если появится вопрос о микрофоне — нажмите «Разрешить».'; return; }
      var b = box.querySelector('.vbtn'); b.classList.add('busy'); b.textContent = 'Включаю микрофон…';
      var c = box.querySelector('.consent'); if (c) c.textContent = 'Если появится вопрос о микрофоне — нажмите «Разрешить».';
    };
    pre();
    var permP = Promise.resolve('prompt');
    try { if (navigator.permissions && navigator.permissions.query) permP = navigator.permissions.query({ name: 'microphone' }).then(function (p) { return p.state; }, function () { return 'prompt'; }); } catch (e) {}
    permP.then(function (state) {
      if (state === 'denied') throw { name: 'NotAllowedError' };
      return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    }).then(function (stream) {
      if (REC !== R) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
      R.stream = stream; ls('proto-mic-ok', '1');
      var mime = pickMime(), mr;
      try { mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : { audioBitsPerSecond: 32000 }); }
      catch (e) { mr = new MediaRecorder(stream); }
      R.mr = mr;
      mr.ondataavailable = function (e) { if (e.data && e.data.size) R.chunks.push(e.data); };
      mr.start(1000);
      R.type = mr.mimeType || mime || 'audio/webm';
      R.t0 = Date.now(); R.loud = Date.now(); R.starting = false;
      stream.getTracks().forEach(function (t) { t.onended = function () { if (REC === R) stopRec('ended'); }; });
      if (ac) { try { if (ac.state === 'suspended') ac.resume(); var src = ac.createMediaStreamSource(stream), an = ac.createAnalyser(); an.fftSize = 512; src.connect(an); R.an = an; R.buf = new Uint8Array(an.fftSize); } catch (e) {} }
      if (test) { $('micTestBtn').textContent = '✓ Готово'; $('micTestLevel').hidden = false; $('micTestHint').textContent = 'Скажите «Здравствуйте» и нажмите «Готово».'; $('micTestRes').hidden = true; setTimeout(function () { if (REC === R) stopRec('done'); }, 6000); }
      else renderVoice(box, sid);
      if (!test && SR && !IOS) startSR(R);
      R.iv = setInterval(function () { tick(R); }, 100);
      /* черновик голосового на устройстве каждые 5 с — при обрыве теряем не больше 5 с */
      if (!test) { ST.recDraft = { id: R.id, sid: sid, t0: R.t0, type: R.type }; save(); }
      if (!test) R.dv = setInterval(function () { if (R.chunks.length) idbPut(R.id, { blob: new Blob(R.chunks, { type: R.type.split(';')[0] }), type: R.type, sid: sid, partial: true }); }, 5000);
    }).catch(function (e) {
      if (REC !== R) return;
      cleanup(R); REC = null;
      if (test) { $('micTestBtn').textContent = '🎤 Проверить микрофон'; $('micTestHint').textContent = 'Скажите «Здравствуйте» — проверим, что Вас слышно. Это можно пропустить.'; }
      else renderVoice(box, sid);
      var n = e && e.name;
      micHelp(n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError' ? 'denied' : n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError' ? 'nomic' : n === 'NotReadableError' || n === 'TrackStartError' || n === 'AbortError' ? 'busy' : 'denied', sid);
    });
  }
  function tick(R) {
    var sec = (Date.now() - R.t0) / 1000, lvl = 0;
    if (R.an) { R.an.getByteTimeDomainData(R.buf); var m = 0; for (var i = 0; i < R.buf.length; i++) { var d = Math.abs(R.buf[i] - 128); if (d > m) m = d; } lvl = Math.min(1, m / 60); }
    else lvl = 0.3; /* нет анализатора — не пугаем «не слышно» */
    if (lvl > R.peak) R.peak = lvl;
    if (lvl > 0.08) R.loud = Date.now();
    if (R.test) { var li = $('micTestLevel').firstChild; li.style.width = Math.round(lvl * 100) + '%'; return; }
    if (!R.ui) return;
    R.ui.time.textContent = mmss(sec); R.ui.lvl.style.width = Math.round(lvl * 100) + '%';
    var quiet = Date.now() - R.loud > 5000;
    R.ui.hint.className = quiet ? 'warn-line rh' : 'muted rh';
    R.ui.hint.textContent = sec >= WARN_AT ? 'Ещё ' + Math.max(0, Math.ceil(LIMIT - sec)) + ' секунд — потом сохраним само и можно записать ещё'
      : quiet ? 'Вас не слышно. Говорите ближе к телефону или микрофону'
      : 'Говорите, как удобно — своими словами, как коллеге. Оговорки не страшны. Закончили — нажмите «Готово».';
    if (sec >= LIMIT) stopRec('limit');
  }
  function startSR(R) {
    try {
      var r = new SR(); R.sr = r; R.live = ''; var fin = '';
      r.lang = 'ru-RU'; r.continuous = true; r.interimResults = true;
      r.onresult = function (e) { var inter = ''; for (var i = e.resultIndex; i < e.results.length; i++) { if (e.results[i].isFinal) fin += e.results[i][0].transcript + ' '; else inter += e.results[i][0].transcript; } R.live = (fin + inter).trim(); if (R.ui && R.live) { R.ui.live.hidden = false; R.ui.live.textContent = R.live; } };
      r.onerror = function () { R.sr = null; }; /* сбой распознавания запись не останавливает */
      r.onend = function () { if (REC === R && R.sr) { try { r.start(); } catch (e) {} } };
      r.start();
    } catch (e) { R.sr = null; }
  }
  function cleanup(R) {
    clearInterval(R.iv); clearInterval(R.dv);
    if (R.sr) { var s = R.sr; R.sr = null; try { s.stop(); } catch (e) {} }
    if (R.stream) R.stream.getTracks().forEach(function (t) { t.stop(); }); /* гасим значок микрофона */
    if (R.ac) { try { R.ac.close(); } catch (e) {} }
  }
  function stopRec(why) {
    var R = REC; if (!R) return; REC = null; if (ST.recDraft) { ST.recDraft = null; save(); }
    var sec = Math.round((Date.now() - R.t0) / 1000);
    var finish = function () {
      cleanup(R);
      if (R.test) return testResult(R);
      var box = R.box, sid = R.sid;
      if (why === 'cancel') { idbDel(R.id); renderVoice(box, sid); return; }
      if (sec < 1 || !R.chunks.length || (R.an && R.peak < 0.05)) {
        idbDel(R.id); renderVoice(box, sid);
        var w = document.createElement('div'); w.className = 'warn-line'; w.textContent = 'Ничего не записалось. Проверьте микрофон и попробуйте ещё раз — или напишите текстом.';
        box.appendChild(w); return;
      }
      var type = R.type.split(';')[0], blob = new Blob(R.chunks, { type: type }), ext = extOf(R.type);
      var v = { id: R.id, sid: sid, sec: sec, status: 'pending', path: 'proto-test/' + sid + '/' + R.id + '.' + ext, created: Date.now(), live: R.live || '', note: why === 'hidden' || why === 'ended' ? 'Сохранили ' + mmss(sec) + '. Можно продолжить — нажмите «Добавить ещё голосовое».' : why === 'limit' ? 'Сохранили. Можно записать ещё одно голосовое.' : '' };
      ST.voices[v.id] = v; var a = A(sid); a.voices.push(v.id); if (sid !== 'all') setChoice(sid, 'voice'); save();
      URLS[v.id] = URL.createObjectURL(blob);
      idbPut(v.id, { blob: blob, type: type, sid: sid }).then(function () { enqueue({ t: 'voice', vid: v.id }); if (sid !== 'all') enqueue({ t: 'vote', sec: PREFIX + sid, verdict: 'redo' }); });
      renderVoice(box, sid); renderCards();
      if (sid !== 'all') { renderKeep(); renderProgress(); toast(msg(MSG_VOICE, 'v')); }
      pollSoon();
    };
    if (R.mr && R.mr.state !== 'inactive') {
      var done = false, f = function () { if (!done) { done = true; finish(); } };
      R.mr.onstop = f; try { R.mr.stop(); } catch (e) { f(); } setTimeout(f, 2500);
    } else finish();
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden && REC && !REC.starting) stopRec('hidden'); else if (!document.hidden) { flush(); pollSoon(); } });

  /* пробная запись на приветствии */
  var testURL = null;
  function testResult(R) {
    $('micTestBtn').textContent = '🎤 Проверить ещё раз'; $('micTestLevel').hidden = true;
    var res = $('micTestRes'); res.hidden = false; res.textContent = '';
    if (!R.chunks.length || (R.an && R.peak < 0.12)) {
      $('micTestHint').textContent = '';
      var w = document.createElement('p'); w.className = 'warn-line'; w.textContent = 'Вас почти не слышно. Поднесите телефон ближе и попробуйте ещё раз.'; res.appendChild(w);
      return;
    }
    if (testURL) URL.revokeObjectURL(testURL);
    testURL = URL.createObjectURL(new Blob(R.chunks, { type: R.type.split(';')[0] }));
    $('micTestHint').textContent = 'Эта проба никуда не отправляется.';
    var ok = document.createElement('p'); ok.className = 'ok-line'; ok.textContent = '✓ Вас хорошо слышно'; res.appendChild(ok);
    var pl = mkBtn('▶ Послушать себя', 'btn ghost small'); var au = new Audio(testURL); pl.onclick = function () { au.currentTime = 0; au.play(); }; res.appendChild(pl);
  }

  /* загрузка готового файла */
  function sendFile(f, sid, box) {
    if (!f) return;
    if (f.size > 25e6) { toast('Файл больше 25 МБ — запишите покороче или напишите текстом'); return; }
    var id = uuid(), type = f.type || 'audio/mpeg', ext = extOf(type + ' ' + f.name.toLowerCase());
    var v = { id: id, sid: sid, sec: 0, status: 'pending', path: 'proto-test/' + sid + '/' + id + '.' + ext, created: Date.now(), live: '', file: true };
    ST.voices[id] = v; var a = A(sid); a.voices.push(id); if (sid !== 'all') setChoice(sid, 'voice'); save();
    URLS[id] = URL.createObjectURL(f);
    idbPut(id, { blob: f, type: type, sid: sid }).then(function () { enqueue({ t: 'voice', vid: id }); if (sid !== 'all') enqueue({ t: 'vote', sec: PREFIX + sid, verdict: 'redo' }); });
    renderVoice(box, sid); renderCards(); if (sid !== 'all') { renderKeep(); renderProgress(); toast(msg(MSG_VOICE, 'v')); }
  }

  /* ---------- карточки «Мы услышали» ---------- */
  var URLS = {}, undoT = {};
  function renderCards() {
    var targets = [['cards', $('s-slide').hidden ? null : SL[cur] && SL[cur].id], ['cardsAll', $('s-final').hidden ? null : 'all']];
    targets.forEach(function (t) {
      var box = $(t[0]); if (!t[1]) return; box.textContent = '';
      var sid = t[1], list = (A(sid).voices || []).map(function (id) { return ST.voices[id]; }).filter(Boolean).reverse();
      list.forEach(function (v) {
        if (v.status === 'replaced') return;
        if (v.status === 'deleted') { if (undoT[v.id]) box.appendChild(undoRow(v)); return; }
        box.appendChild(card(v));
      });
    });
  }
  function undoRow(v) {
    var r = document.createElement('div'); r.className = 'undo';
    r.appendChild(document.createTextNode('Голосовое удалено'));
    var b = mkBtn('Вернуть', 'link'); b.onclick = function () { clearTimeout(undoT[v.id]); delete undoT[v.id]; v.status = v.prevStatus || 'done'; recalc(v.sid); save(); renderCards(); renderAfter(v.sid); };
    r.appendChild(b); return r;
  }
  function card(v) {
    var c = document.createElement('div'); c.className = 'vcard' + (v.status === 'pending' ? ' pend' : v.status === 'fail' ? ' fail' : '');
    var h = document.createElement('div'); h.className = 'vh';
    h.appendChild(document.createTextNode('🎤 Ваш голос' + (v.sec ? ': ' + mmss(v.sec) : '')));
    var st = document.createElement('span'); st.className = 'st ' + (v.status === 'done' ? 'ok' : 'wait');
    st.textContent = v.status === 'done' ? '✓ Голосовое сохранено' : v.status === 'fail' ? 'Не сохранилось' : (NETDOWN || !navigator.onLine ? '⏳ Нет связи, отправим сами' : 'Сохраняю…');
    h.appendChild(st); c.appendChild(h);
    if (v.note) { var nt = document.createElement('p'); nt.className = 'muted'; nt.textContent = v.note; c.appendChild(nt); }
    if (URLS[v.id]) { var au = document.createElement('audio'); au.controls = true; au.preload = 'metadata'; au.src = URLS[v.id]; c.appendChild(au); }
    else idbGet(v.id).then(function (rec) { if (rec && rec.blob) { URLS[v.id] = URL.createObjectURL(rec.blob); renderCards(); } });
    if (v.status === 'pending' && (NETDOWN || !navigator.onLine)) { var pn = document.createElement('p'); pn.className = 'muted'; pn.textContent = 'Не получилось отправить — нет связи. Голосовое сохранено на этом устройстве, отправим сами.'; c.appendChild(pn); }
    if (v.status === 'fail') {
      var fp = document.createElement('p'); fp.className = 'warn-line'; fp.textContent = 'Не получилось сохранить. Скачайте запись и пришлите Яне — или нажмите «Отправить ещё раз».'; c.appendChild(fp);
      var fr = document.createElement('div'); fr.className = 'acts';
      var rb = mkBtn('Отправить ещё раз', 'btn primary'); rb.onclick = function () { v.status = 'pending'; save(); enqueue({ t: 'voice', vid: v.id }); renderCards(); };
      var dl = document.createElement('a'); dl.className = 'btn ghost'; dl.textContent = 'Скачать запись'; dl.download = 'golosovoe-' + v.sid + '.' + v.path.split('.').pop(); if (URLS[v.id]) dl.href = URLS[v.id];
      fr.appendChild(rb); fr.appendChild(dl); c.appendChild(fr);
    }
    /* что услышали */
    var hd = document.createElement('div'); hd.className = 'heard';
    if (v.fixed) { hd.innerHTML = '<b>Мы услышали:</b> '; hd.appendChild(document.createTextNode('«' + v.fixed + '»')); }
    else if (v.heard) { hd.innerHTML = '<b>Мы услышали:</b> '; hd.appendChild(document.createTextNode('«' + v.heard + '»')); }
    else if (v.live) { hd.innerHTML = '<b>Мы услышали:</b> '; var sp = document.createElement('span'); sp.className = 'draft'; sp.textContent = '«' + v.live + '» — черновик, уточняем'; hd.appendChild(sp); }
    else if (Date.now() - v.created > 5 * 60000) hd.textContent = 'Голосовое у нас. Текст появится позже — Яна прослушает его сама. Ничего делать не нужно.';
    else hd.textContent = v.status === 'done' ? 'Голосовое сохранено, текст появится позже. Можно переходить к следующему слайду.' : '';
    if (hd.textContent) c.appendChild(hd);
    if (v.heard || v.live || v.fixed) { var hh = document.createElement('p'); hh.className = 'muted'; hh.textContent = v.fixedSaved ? '✓ Исправление сохранено' : 'Если мы что-то услышали неверно — поправьте текст. Голосовое тоже останется у нас.'; c.appendChild(hh); }
    var acts = document.createElement('div'); acts.className = 'acts';
    if (v.heard || v.live || v.fixed) { var fx = mkBtn('Поправить текст', 'btn ghost'); fx.onclick = function () { editHeard(c, v); }; acts.appendChild(fx); }
    var rr = mkBtn('Перезаписать', 'btn ghost'); rr.onclick = function () {
      askInline(acts, 'Заменить это голосовое новым?', 'Да, записать заново', 'Нет, оставить', function () {
        v.status = 'replaced'; save(); enqueue({ t: 'cmt', sec: PREFIX + v.sid, body: '[заменено] ' + v.id }); recalc(v.sid); renderCards();
        var box = v.sid === 'all' ? $('voiceBoxAll') : $('voiceBox'); startRec(v.sid, box);
      });
    };
    var del = mkBtn('Удалить', 'btn danger'); del.onclick = function () {
      askInline(acts, 'Удалить это голосовое?', 'Да, удалить', 'Нет', function () {
        v.prevStatus = v.status; v.status = 'deleted'; recalc(v.sid); save(); renderAfter(v.sid);
        undoT[v.id] = setTimeout(function () { delete undoT[v.id]; enqueue({ t: 'cmt', sec: PREFIX + v.sid, body: '[удалено экспертом] ' + v.id }); renderCards(); }, 10000);
        renderCards();
      });
    };
    acts.appendChild(rr); acts.appendChild(del); c.appendChild(acts);
    return c;
  }
  function editHeard(c, v) {
    var ta = document.createElement('textarea'); ta.rows = 3; ta.value = v.fixed || v.heard || v.live || '';
    var r = document.createElement('div'); r.className = 'acts';
    var s = mkBtn('Сохранить исправление', 'btn primary'), x = mkBtn('Отменить', 'btn ghost');
    s.onclick = function () { var t = ta.value.trim(); if (!t) { ta.focus(); return; } v.fixed = t; v.fixedSaved = true; save(); enqueue({ t: 'cmt', sec: PREFIX + v.sid, body: '[исправление текста голосового ' + v.id + '] ' + t }); renderCards(); };
    x.onclick = function () { renderCards(); };
    c.textContent = ''; c.appendChild(ta); r.appendChild(s); r.appendChild(x); c.appendChild(r);
    ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  }
  function recalc(sid) {
    if (sid === 'all') return; var a = A(sid);
    if (liveVoices(sid).length) setChoice(sid, 'voice');
    else if (a.choice === 'voice') a.choice = a.textSaved ? 'text' : null;
    if (a.choice !== 'keep' && a.choice !== 'orig' && a.choice !== 'voice' && a.choice !== 'text') a.choice = null;
    var verdict = a.choice === 'keep' ? 'keep' : a.choice === 'orig' ? 'drop' : a.choice ? 'redo' : null;
    if (verdict) enqueue({ t: 'vote', sec: PREFIX + sid, verdict: verdict });
  }
  function renderAfter(sid) { if (sid === 'all') renderVoice($('voiceBoxAll'), 'all'); else if (!$('s-slide').hidden) { renderVoice($('voiceBox'), sid); renderKeep(); renderProgress(); } }

  /* опрос расшифровок (если обработчик подключён к разделам proto-test-) */
  var pollT = 0, pollStart = 0;
  function waiting() { return Object.keys(ST.voices).some(function (k) { var v = ST.voices[k]; return v.status === 'done' && !v.heard && Date.now() - v.created < 24 * 3600e3; }); }
  function pollSoon() { if (DEMO) return; if (!pollStart) pollStart = Date.now(); clearTimeout(pollT); pollT = setTimeout(poll, 5000); }
  function poll() {
    if (DEMO || document.hidden || !waiting()) { pollStart = 0; return; }
    req('/rest/v1/sf_comments?select=section,author,body,created_at&section=like.' + encodeURIComponent(PREFIX + '*') + '&author=eq.' + encodeURIComponent('Расшифровка голосового (' + AUTHOR + ')') + '&order=created_at', { method: 'GET', headers: H({}) })
      .then(function (rows) {
        var used = {}; Object.keys(ST.voices).forEach(function (k) { if (ST.voices[k].heardAt) used[ST.voices[k].heardAt] = 1; });
        Object.keys(ST.voices).map(function (k) { return ST.voices[k]; }).sort(function (a, b) { return a.created - b.created; }).forEach(function (v) {
          if (v.heard || v.status !== 'done') return;
          var r = (rows || []).find(function (x) { return x.section === PREFIX + v.sid && !used[x.created_at] && new Date(x.created_at).getTime() >= v.created - 60000; });
          if (r) { v.heard = r.body; v.heardAt = r.created_at; used[r.created_at] = 1; }
        });
        save(); renderCards();
      }, function () {})
      .then(function () { var el = Date.now() - pollStart; pollT = setTimeout(poll, el < 180000 ? 5000 : 30000); renderCards(); });
  }

  /* ---------- помощь с микрофоном ---------- */
  var micSid = null;
  function micHelp(kind, sid) {
    micSid = sid;
    var why = {
      denied: 'Микрофон выключен для этой страницы. Включить его можно за минуту — или ответить текстом.',
      nomic: 'На этом устройстве не найден микрофон. Ответьте текстом или загрузите готовое голосовое.',
      busy: 'Микрофон занят другой программой (Zoom, Телемост?). Закройте её и нажмите «Попробовать ещё раз».',
      nosupport: 'В этой программе запись голоса не работает. Откройте страницу в Safari или Chrome — или ответьте текстом.',
      insecure: 'Запись голоса работает только по защищённой ссылке. Откройте ссылку из письма — или ответьте текстом.'
    }[kind] || '';
    $('micWhy').textContent = why;
    var steps;
    if (kind === 'busy' || kind === 'nomic') steps = [];
    else if (IOS) steps = ['Нажмите «аА» слева в адресной строке.', 'Выберите «Настройки веб-сайта».', '«Микрофон» → «Разрешить». Если такого пункта нет: Настройки iPhone → Safari → Микрофон → «Разрешить».'];
    else if (ANDROID) steps = ['Нажмите значок слева от адреса сайта.', '«Разрешения» → «Микрофон» → «Разрешить».', 'Если не помогло: Настройки телефона → Приложения → Chrome → Разрешения → Микрофон.'];
    else if (/Firefox/.test(UA)) steps = ['Нажмите значок микрофона с чертой слева от адреса.', 'Нажмите крестик «Убрать разрешение».', 'Обновите страницу и при вопросе отметьте «Запомнить решение».'];
    else if (/Safari/.test(UA) && !/Chrome|Chromium|Edg|YaBrowser/.test(UA)) steps = ['В меню сверху: Safari → «Настройки для этого сайта».', '«Микрофон» → «Разрешить».', 'Обновите страницу.'];
    else steps = ['Нажмите значок слева от адреса сайта (замок или ползунки).', '«Микрофон» → «Разрешить».', 'Обновите страницу — Ваши ответы сохранятся.'];
    var ol = $('micSteps'); ol.textContent = ''; ol.hidden = !steps.length;
    steps.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ol.appendChild(li); });
    $('micMsgInfo').hidden = true;
    openM('m-mic');
  }

  /* ---------- окна ---------- */
  var lastFocus = null;
  function openM(id) { lastFocus = document.activeElement; $(id).hidden = false; var f = $(id).querySelector('button'); if (f) f.focus(); }
  function closeM(el) { el.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]'); if (o) { if (o.dataset.open === 'talk') { $('callBox').hidden = true; $('callOk').hidden = true; $('msgInfo').hidden = true; } document.querySelectorAll('.sheet').forEach(function (s) { s.hidden = true; }); openM('m-' + o.dataset.open); return; }
    var c = e.target.closest('[data-close]'); if (c) { closeM(c.closest('.sheet,.viewer')); return; }
    if (e.target.classList && (e.target.classList.contains('sheet'))) closeM(e.target);
  });
  function renderList() {
    $('listSum').textContent = 'Ответили на ' + countAns() + ' из ' + N;
    var ul = $('slist'); ul.textContent = '';
    SL.forEach(function (s, i) {
      var li = document.createElement('li'), b = document.createElement('button'); b.type = 'button';
      var im = document.createElement('img'); im.src = s.now; im.alt = ''; b.appendChild(im);
      var d = document.createElement('span'); d.textContent = 'Слайд ' + s.n + '. ' + s.title;
      var k = kind(s.id), st = document.createElement('span'); st.className = 's-st ' + (k || ''); st.textContent = stWord(k); d.appendChild(st);
      b.setAttribute('aria-label', 'Открыть слайд ' + s.n + '. ' + s.title + '. Ответ: ' + stWord(k));
      b.appendChild(d); b.onclick = function () { $('m-list').hidden = true; go(i); };
      li.appendChild(b); ul.appendChild(li);
    });
  }

  /* ---------- итог ---------- */
  function renderFinal() {
    var c = { keep: 0, voice: 0, text: 0, orig: 0 }, miss = [];
    SL.forEach(function (s, i) { var k = kind(s.id); if (k) c[k]++; else miss.push(i); });
    var ul = $('sumList'); ul.textContent = '';
    [['👍 Принимаю новый вариант', c.keep], ['🎤 Голосовые', c.voice], ['✏️ Текстом', c.text], ['↩ Вернуть старый вариант', c.orig]].forEach(function (r) {
      if (!r[1] && r[0].indexOf('старый') >= 0) return;
      var li = document.createElement('li'); li.innerHTML = '<span></span><span></span>'; li.firstChild.textContent = r[0]; li.lastChild.textContent = r[1]; ul.appendChild(li);
    });
    var m = $('missed'); m.textContent = '';
    if (miss.length) {
      var p = document.createElement('p'); p.className = 'muted'; p.textContent = 'Эти слайды Вы пока не отметили — вернуться? Ответ не обязателен.'; m.appendChild(p);
      miss.forEach(function (i) { var b = mkBtn('Посмотреть слайд ' + (i + 1), 'link'); b.onclick = function () { go(i); }; m.appendChild(b); });
    }
    renderVoice($('voiceBoxAll'), 'all'); renderCards();
    $('taAll').value = ls('proto-draft-all') || A('all').textSaved || '';
    $('textBoxAll').hidden = !$('taAll').value; $('textBtnAll').hidden = !$('textBoxAll').hidden;
    $('doneErr').hidden = true; $('doneBtn').disabled = false; $('doneBtn').textContent = 'Готово — передать Яне';
  }
  function doDone() {
    if (REC) stopRec('done');
    TC.forEach(function (t) { t.commit(false); });
    var b = $('doneBtn'); b.textContent = 'Передаю…'; b.disabled = true;
    var c = countAns(), body = '✅ Готово: эксперт просмотрел пробную презентацию, ответил на ' + c + ' из ' + N + ' слайдов';
    var p = DEMO ? new Promise(function (r) { setTimeout(r, 400); }) : comment(PREFIX + 'deck', body);
    p.then(function () {
      ST.done = true; ST.doneAt = Date.now(); save();
      var v = 0, k = 0, o = 0; SL.forEach(function (s) { var x = kind(s.id); if (x === 'voice' || x === 'text') v++; if (x === 'keep') k++; if (x === 'orig') o++; });
      $('today').textContent = N + ' слайдов просмотрено · ' + v + ' с правками · ' + k + ' приняли новый вариант' + (o ? ' · ' + o + ' вернули Ваш вариант' : '');
      show('s-thanks');
    }, function () {
      b.textContent = 'Попробовать ещё раз'; b.disabled = false;
      var e = $('doneErr'); e.hidden = false; e.textContent = 'Не получилось передать — нет связи. Ответы сохранены, попробуйте ещё раз через минуту.';
    });
  }

  /* ---------- события ---------- */
  function init() {
    fill(); setSave('idle');
    if (/Telegram|WhatsApp|Instagram|FBAN|FBAV|VKAndroidApp|; wv\)/.test(UA) || window.TelegramWebviewProxy) $('inapp').hidden = false;
    $('copyLink').onclick = function () { var u = location.href.split('#')[0], b = $('copyLink'); var ok = function () { b.textContent = '✓ Ссылка скопирована'; }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(u).then(ok, function () { prompt('Скопируйте ссылку:', u); }); else prompt('Скопируйте ссылку:', u); };
    $('loginBtn').onclick = login;
    $('code').addEventListener('keydown', function (e) { if (e.key === 'Enter') login(); });
    $('code').addEventListener('input', function () { $('codeErr').hidden = true; });
    $('restartBtn').onclick = function () { go(0); };
    $('seeAnswers').onclick = function () { renderList(); openM('m-list'); };
    $('addMore').onclick = function () { var f = firstOpen(); go(answered(SL[f].id) ? 0 : f); };
    $('micTestBtn').onclick = function () { if (REC && REC.test) stopRec('done'); else startRec('test', null, true); };
    $('keepBtn').onclick = function () { doKeep(false); };
    $('origBtn').onclick = doOrig;
    $('prevBtn').onclick = function () { if (cur === 0) show('s-hello'); else go(cur - 1); };
    $('nextBtn').onclick = next;
    $('listBtn').onclick = function () { renderList(); openM('m-list'); };
    document.querySelectorAll('.tab').forEach(function (b) { b.onclick = function () { setTab(b.dataset.tab); }; });
    ['imgWas', 'imgNow'].forEach(function (id) { $(id).onclick = function () { $('viewerImg').src = $(id).src; $('viewerImg').alt = $(id).alt; openM('viewer'); }; });
    /* свайп по картинке переключает «было/предлагаем», слайды не листает */
    var sx = null; $('pair').addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    $('pair').addEventListener('touchend', function (e) { if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) setTab(tab === 'now' ? 'was' : 'now'); });
    var tc = textCtl(function () { return SL[cur].id; }, $('ta'), $('taStat'), $('textBox'), $('textBtn'), $('taCnt'));
    $('taSave').onclick = function () { tc.commit(true); };
    var tcAll = textCtl(function () { return 'all'; }, $('taAll'), $('taStatAll'), $('textBoxAll'), $('textBtnAll'), $('taCntAll'));
    $('taSaveAll').onclick = function () { tcAll.commit(true); };
    TC = [tc, tcAll];
    $('fileIn').onchange = function () { sendFile(this.files[0], SL[cur].id, $('voiceBox')); this.value = ''; };
    $('micRetry').onclick = function () { $('m-mic').hidden = true; if (/Chrome|CriOS/.test(UA) && !IOS) { ST.resume = $('s-final').hidden ? { slide: cur } : { final: 1 }; save(); location.reload(); return; } var box = micSid === 'all' ? $('voiceBoxAll') : micSid === 'test' ? null : $('voiceBox'); startRec(micSid || SL[cur].id, box, micSid === 'test'); };
    $('micText').onclick = function () { $('m-mic').hidden = true; if (micSid === 'all') { $('textBoxAll').hidden = false; $('textBtnAll').hidden = true; $('taAll').focus(); } else if (!$('s-slide').hidden) { tc.open(); } else { go(ST.cur || 0); tc.open(); } };
    $('micMsg').onclick = function () { $('micMsgInfo').hidden = false; };
    $('callMe').onclick = function () { $('callBox').hidden = false; $('callOk').hidden = true; };
    document.querySelectorAll('[data-when]').forEach(function (b) { b.onclick = function () {
      enqueue({ t: 'cmt', sec: PREFIX + 'call', body: '[звонок] просьба перезвонить: ' + b.dataset.when });
      $('callBox').hidden = true; var ok = $('callOk'); ok.hidden = false; ok.textContent = '✓ Просьба сохранена. Яна позвонит Вам ' + b.dataset.when + '. Пока можно продолжить смотреть слайды.';
    }; });
    $('msgBtn').onclick = function () { $('msgInfo').hidden = false; };
    $('doneBtn').onclick = doDone;
    $('backToSlides').onclick = function () { go(firstOpen()); };
    $('thanksBack').onclick = function () { go(0); };
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { document.querySelectorAll('.sheet,.viewer').forEach(function (s) { if (!s.hidden) closeM(s); }); return; }
      if ($('s-slide').hidden || /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || '')) || document.querySelector('.sheet:not([hidden]),.viewer:not([hidden])')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); if (cur > 0) go(cur - 1); }
      else if (e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); $('vbtn').click(); }
    });
    /* запись оборвалась (закрыли вкладку) — сохраняем то, что успело записаться */
    if (ST.recDraft) { var rd = ST.recDraft; ST.recDraft = null; save();
      idbGet(rd.id).then(function (rec) { if (!rec || !rec.blob || !rec.blob.size) return;
        var ext = extOf(rd.type || rec.type), sec = Math.max(1, Math.round((rec.blob.size * 8) / 32000));
        var v = { id: rd.id, sid: rd.sid, sec: sec, status: 'pending', path: 'proto-test/' + rd.sid + '/' + rd.id + '.' + ext, created: Date.now(), live: '', note: 'Запись прервалась — сохранили то, что успели записать.' };
        ST.voices[v.id] = v; var a = A(rd.sid); a.voices.push(v.id); if (rd.sid !== 'all') setChoice(rd.sid, 'voice'); save();
        enqueue({ t: 'voice', vid: v.id }); renderCards(); }); }
    /* то, что не ушло в прошлый раз — досылаем */
    var pend = ST.queue.filter(function (o) { return o.t === 'voice'; }).length;
    if (ST.queue.length) { lastWasWork = true; setTimeout(flush, 300); }
    if (pend) setTimeout(function () { var s = $('save'); s.className = 'save wait'; s.textContent = 'Досылаем Ваше голосовое…'; }, 350);
    var rs = ST.resume; ST.resume = null; save();
    if (ST.entered && rs && rs.final) show('s-final');
    else if (ST.entered && rs && rs.slide != null) go(rs.slide);
    else show(ST.entered ? 's-hello' : 's-login');
    pollSoon();
  }
  init();
})();
