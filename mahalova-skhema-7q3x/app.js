/* Страница «Помогите уточнить схему» — Л. В. Махалова, урок 4 КНС 2026.
   Данные экранов взяты из cards.py (точки варианта A, раскладка кадра) и тексты_методиста.md. */
'use strict';

var PAGE_VERSION = '19.10.2026 14:34';
var STORE_KEY = 'asd_mahalova_urok4_v1';
var IDB_NAME = 'asd_mahalova_urok4';
var FW = 1920, FH = 1080;            // исходный кадр
var MIN_W = 240, MAX_W = 1440;        // пределы увеличения (ширина окна в координатах кадра, окно 4:3)

var FRAMES = {
  s11: { src: 'media/slide11.jpg', path: 'кадры/слайд11_28-20.jpg' },
  dr:  { src: 'media/drawing.jpg', path: 'кадры/чертеж_31-10.jpg' }
};
var PLACES = {
  1: { window: [1709.48, 1726.82], connect: 'route' },
  2: { window: [1727.06, 1745.58], connect: 'separate' },
  3: { window: [1747.68, 1764.42], connect: 'route' },
  4: { window: [1764.60, 1784.38], connect: 'route' },
  5: { window: [1859.22, 1866.84], connect: 'auto' },
  6: { window: [1866.94, 1878.24], connect: 'separate' },
  7: { window: [1887.48, 1898.38], connect: 'auto' },
  8: { window: [1898.74, 1921.90], connect: 'route' }
};

/* places — исходные места; firstCount — сколько первых точек относится к первому месту (для экранов 5, 6);
   ours — наше предположение (вариант A), oursPlace — к какому месту каждая точка; view — обрезка кадра как в макете. */
var SCREENS = [
  { n: 1, places: [1], time: '28:29–28:43', frame: 's11', clips: [1], route: true,
    title: 'Как идёт кабель от ВРУ до первой розетки?',
    fixTitle: 'Покажите сами: как идёт кабель от ВРУ до розетки',
    steps: ['где ВРУ', 'куда «пришли сюда»', 'розетка, к которой сделали опуск'],
    short: ['ВРУ', '«пришли сюда»', 'розетка (опуск)'],
    quote: '«…чтобы из ВРУ мы пришли сюда и дошли до места установки розетки по запотолочному пространству и сделали опуск до розетки…»',
    ours: [[910, 705], [1128, 273], [1379, 252]], oursPlace: [1, 1, 1],
    line: [[910, 705], [920, 273], [1128, 273], [1379, 252]],   // изгиб по лотку — без номера
    view: [634.5, 110, 1020, 765] },
  { n: 2, places: [2], time: '28:47–29:03', frame: 's11', clips: [2], route: false,
    title: 'Где ответвление и где две розетки группы 18?',
    fixTitle: 'Покажите сами: ответвление и две розетки группы 18',
    steps: ['ответвление («сюда»)', 'первая «группа 18 здесь»', 'вторая «группа 18 здесь»'],
    short: ['ответвление', 'группа 18 — первая', 'группа 18 — вторая'],
    quote: '«А дальше у нас идёт ответвление сюда. А у нас и здесь есть группа 18, и здесь есть группа 18…»',
    ours: [[1128, 273], [1096, 554], [1379, 506]], oursPlace: [2, 2, 2],
    view: [828.2, 110, 818.7, 614] },
  { n: 3, places: [3], time: '29:07–29:24', frame: 's11', clips: [3], route: true,
    title: 'Где Вы ставите коробку на ответвлении группы 18?',
    fixTitle: 'Покажите сами: где коробка на ответвлении группы 18',
    steps: ['где ВРУ', 'где ставим коробку', 'конец «длины, которую не считаем» (по желанию — мы не отметили)'],
    short: ['ВРУ', 'коробка', 'конец длины'],
    quote: '«Мы выходим из ВРУ, идём до первого ответвления на группу 18. Вот на это. Ставим здесь коробку…»',
    ours: [[910, 705], [1130, 290]], oursPlace: [3, 3],
    view: [516.7, 120, 1006.7, 755] },
  { n: 4, places: [4], time: '29:24–29:44', frame: 's11', clips: [4], route: true,
    title: 'Как один кабель идёт от коробки к двум розеткам?',
    fixTitle: 'Покажите сами: путь кабеля от коробки к двум розеткам',
    steps: ['коробка', 'первая розетка (опуск)', '«вот сюда» — куда прошли', 'вторая розетка (опуск)'],
    short: ['коробка', 'розетка 1 (опуск)', '«вот сюда»', 'розетка 2 (опуск)'],
    note: 'Если был поворот трассы — отметьте и его.',
    quote: '«Мы от этой коробки идём с вами, делаем сюда и делаем опуск к розетке. Потом… можем пройти вот сюда… Это будет всё один кабель…»',
    ours: [[1130, 290], [1096, 554], [1379, 522], [1379, 506]], oursPlace: [4, 4, 4, 4],
    view: [834.8, 120, 805.3, 604] },
  { n: 5, places: [5, 6], firstCount: 2, time: '31:00–31:18', frame: 'dr', clips: [5, 6], route: false,
    title: 'Откуда начинается группа 4, где вентилятор и выключатель?',
    fixTitle: 'Покажите сами: начало группы 4, вентилятор и выключатель',
    steps: ['ВРУ', '«вот здесь мы поставим»', 'вытяжной вентилятор', 'выключатель'],
    short: ['ВРУ', '«вот здесь поставим»', 'вентилятор', 'выключатель'],
    quote: '«Это всё одна группа… Но она начинает свой путь от ВРУ… Нам кроме вот этого вентилятора самого вытяжного надо подключить его управление… Вот этот выключатель.»',
    ours: [[617, 834], [760, 538], [808, 365], [747, 537]], oursPlace: [5, 5, 6, 6],
    view: [173.2, 195, 1078.7, 809] },
  { n: 6, places: [7, 8], firstCount: 1, time: '31:28–32:02', frame: 'dr', clips: [7, 8], route: true,
    title: 'Где коробка на помещения 4, 5, 6 и куда идёт кабель?',
    fixTitle: 'Покажите сами: коробка на помещения 4, 5, 6 и путь кабеля',
    steps: ['коробка на помещения 4, 5, 6', '«зайдём сюда»', 'коробка внутри помещения', 'выключатель', 'коробка с опуском к вентилятору'],
    short: ['коробка на 4, 5, 6', '«зайдём сюда»', 'коробка в помещении', 'выключатель', 'коробка к вентилятору'],
    note: 'Если вентилятора на чертеже не видно — отметьте коробку и расскажите голосом.',
    quote: '«Вот здесь мы поставим с вами распределительную коробку, чтобы пошло питание на 4, 5 и 6 помещение. А от этой коробки мы уже зайдём сюда… поставили коробку внутри, ответвление сделали к выключателю…»',
    ours: [[821, 565], [947, 507], [956, 488], [922, 502], [925, 365]], oursPlace: [7, 8, 8, 8, 8],
    view: [528.5, 195, 720, 540] }
];

/* ---------- Хранение ---------- */
var S = loadState();
var VOICES = {};          // номер экрана → Blob
var ui = { fix: false, view: null, scr: null, hl: null };
var REC = null;           // идёт запись
var player = null;        // текущее воспроизведение фрагмента

function loadState() {
  var s = null;
  try { s = JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch (e) { s = null; }
  if (!s || typeof s !== 'object') s = {};
  if (!s.answers) s.answers = {};
  if (typeof s.cur !== 'number') s.cur = 0;
  return s;
}
function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); return true; } catch (e) { return false; }
}
function ans(k) {
  if (!S.answers[k]) S.answers[k] = { mode: null, approx: false, points: [], text: '', voice: null, updated: null };
  return S.answers[k];
}
function touch(k) { ans(k).updated = new Date().toISOString(); return saveState(); }

function idbOpen() {
  return new Promise(function (res, rej) {
    if (!window.indexedDB) { rej(new Error('no idb')); return; }
    var r = indexedDB.open(IDB_NAME, 1);
    r.onupgradeneeded = function () { r.result.createObjectStore('voice'); };
    r.onsuccess = function () { res(r.result); };
    r.onerror = function () { rej(r.error); };
  });
}
function idbPut(k, blob) {
  return idbOpen().then(function (db) {
    return new Promise(function (res) {
      var tx = db.transaction('voice', 'readwrite');
      tx.objectStore('voice').put(blob, 's' + k);
      tx.oncomplete = function () { res(true); };
      tx.onerror = function () { res(false); };
    });
  }).catch(function () { return false; });
}
function idbLoadAll() {
  return idbOpen().then(function (db) {
    return Promise.all(SCREENS.map(function (scr) {
      return new Promise(function (res) {
        var g = db.transaction('voice').objectStore('voice').get('s' + scr.n);
        g.onsuccess = function () { if (g.result) VOICES[scr.n] = g.result; res(); };
        g.onerror = function () { res(); };
      });
    }));
  }).catch(function () {});
}

/* ---------- Помощники ---------- */
function $(sel, root) { return (root || document).querySelector(sel); }
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function plural(n, a, b, c) { var m = n % 10, h = n % 100; return (m === 1 && h !== 11) ? a : (m >= 2 && m <= 4 && (h < 10 || h >= 20)) ? b : c; }
function fmtTime(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function setStatus(text, kind) {
  var el = $('#status'); if (!el) return;
  el.className = 'status ' + (kind || 'ok');
  el.textContent = text || '';
}
function persist(k, okText) {
  setStatus('Сохраняю…', 'info');
  var ok = touch(k);
  if (ok) setStatus(okText || '✓ Сохранено', 'ok');
  else setStatus('Не удалось сохранить в этом браузере (возможно, приватный режим). Пожалуйста, не закрывайте страницу до отправки.', 'warn');
  return ok;
}
function isAnswered(k) {
  var a = S.answers[k];
  if (!a || !a.mode) return false;
  if (a.mode === 'own') return a.points.length > 0 || !!(a.text && a.text.trim()) || !!VOICES[k];
  return true;
}
function answerLabel(k) {
  var a = S.answers[k];
  if (!isAnswered(k)) return null;
  if (a.mode === 'ours') return '✓ Да, так';
  if (a.mode === 'skip') return '✓ Указатель не нужен';
  var parts = [];
  if (a.points.length) parts.push(a.points.length + ' ' + plural(a.points.length, 'точка', 'точки', 'точек'));
  if (VOICES[k]) parts.push('голос');
  if (a.text && a.text.trim()) parts.push('текст');
  return '✓ ' + (a.approx ? 'Примерно: ' : 'Ваши отметки: ') + parts.join(', ');
}

/* ---------- Отрисовка ---------- */
function render() {
  stopPlayer();
  if (REC) stopRec();
  var app = $('#app');
  var prog = $('#progress');
  var onScreen = S.cur >= 1 && S.cur <= 6;
  document.body.classList.toggle('screen-mode', onScreen);
  if (onScreen) { prog.hidden = false; prog.textContent = 'Экран ' + S.cur + ' из 6'; }
  else { prog.hidden = true; }
  ui.scr = null;
  if (S.cur === 0) renderIntro(app);
  else if (S.cur === 7) renderFinal(app);
  else renderScreen(app, SCREENS[S.cur - 1]);
  window.scrollTo(0, 0);
}
function go(n) { S.cur = clamp(n, 0, 7); saveState(); render(); }

function renderIntro(app) {
  var started = Object.keys(S.answers).some(function (k) { return isAnswered(+k); });
  app.innerHTML =
    '<section class="card">' +
      '<h1>Лариса Владимировна, здравствуйте!</h1>' +
      '<p>Ваше объяснение в уроке 4 очень наглядное: на реальном чертеже видно, почему кабель ведут через коробку, а не каждый раз от ВРУ. ' +
      'В нескольких местах на записи не видно, куда Вы показываете на схеме, и ученикам сложно уследить за мыслью — помогите, пожалуйста, это уточнить.</p>' +
      '<p>На каждом из 6 экранов послушайте свой короткий фрагмент и посмотрите, как мы поняли Ваши слова. По Вашим ответам мы добавим в видео яркий указатель и увеличение. Это займёт около 10 минут.</p>' +
      '<h2>Как отвечать</h2>' +
      '<ol class="howto">' +
        '<li><span class="num">1</span><span>Нажмите «Послушать свой фрагмент» — прозвучит Ваш фрагмент (можно слушать сколько угодно раз).</span></li>' +
        '<li><span class="num">2</span><span>Посмотрите на схему: жёлтыми кружками с номерами и табличками со стрелками мы отметили, как поняли Ваши слова. Если верно — нажмите «Да, так».</span></li>' +
        '<li><span class="num">3</span><span>Если не так — «Нет — исправлю»: нажмите на схеме по порядку нужные места (синяя подсказка над схемой подскажет, что отметить) или расскажите голосом.</span></li>' +
      '</ol>' +
      '<div class="legend"><span><i class="l-ours"></i>наше предположение</span><span><i class="l-own"></i>Ваши отметки</span></div>' +
      '<p class="note" style="margin-top:16px">Ответы сохраняются сами — страницу можно закрыть и вернуться позже.</p>' +
      '<button class="btn btn-primary" id="start">' + (started ? 'Продолжить →' : 'Начать →') + '</button>' +
    '</section>';
  $('#start').onclick = function () {
    var first = 1;
    if (started) { for (var i = 1; i <= 6; i++) { if (!isAnswered(i)) { first = i; break; } if (i === 6) first = 7; } }
    go(first);
  };
}

function shortLabel(scr, i) {
  var t = (scr.short && scr.short[i]) || 'доп. точка';
  return (i + 1) + ' · ' + t;
}
function stepsOursHTML(scr) {
  return '<ol class="steps ours" id="steplist">' + scr.steps.map(function (s, i) {
    var mark = i < scr.ours.length ? '<span class="num num-ours">' + (i + 1) + '</span>' : '<span class="num num-wait">' + (i + 1) + '</span>';
    return '<li data-i="' + i + '" tabindex="0">' + mark + '<span>' + esc(s) + '</span></li>';
  }).join('') + '</ol>';
}
function stepsFixHTML(scr, a) {
  var n = a.points.length;
  var html = '<ol class="steps own" id="steplist">' + scr.steps.map(function (s, i) {
    if (i < n) return '<li class="done" data-i="' + i + '" tabindex="0"><span class="num num-done">✓</span><span>' + esc(s) + '</span></li>';
    if (i === n) return '<li class="now" aria-current="step"><span class="num num-now">' + (i + 1) + '</span><span>' + esc(s) + '</span></li>';
    return '<li class="wait"><span class="num num-wait">' + (i + 1) + '</span><span>' + esc(s) + '</span></li>';
  }).join('') + '</ol>';
  if (n > scr.steps.length) html += '<div class="step-note">Дополнительных точек: ' + (n - scr.steps.length) + '</div>';
  return html;
}

function renderScreen(app, scr) {
  var a = ans(scr.n);
  ui.scr = scr;
  ui.fix = (a.mode === 'own');
  ui.hl = null;
  ui.view = { x: scr.view[0], y: scr.view[1], w: scr.view[2], h: scr.view[3] };

  app.innerHTML =
    '<section class="screen">' +
      '<div class="col">' +
        '<div class="col-head">' +
          '<h1 id="title"></h1>' +
          '<button class="btn listen" id="listen"><span class="lt" id="listen-t">▶ Послушать свой фрагмент</span><span class="ltime" aria-label="время в уроке">' + scr.time + '</span></button>' +
        '</div>' +
        '<div class="col-body" id="panel"></div>' +
        '<div class="status" id="status" role="status"></div>' +
        '<nav class="col-nav" id="nav"></nav>' +
      '</div>' +
      '<div class="right">' +
        '<div class="fix-bar" id="fhint" role="status" hidden></div>' +
        '<div class="stage" id="stage">' +
          '<div class="frame" id="frame">' +
            '<svg id="svg" viewBox="0 0 1920 1080" preserveAspectRatio="none" aria-label="Кадр урока со схемой">' +
              '<image href="' + FRAMES[scr.frame].src + '" x="0" y="0" width="1920" height="1080"/>' +
              '<g id="marks"></g>' +
            '</svg>' +
          '</div>' +
          '<div class="tools">' +
            '<div class="zoom" id="zoom" role="group" aria-label="Размер схемы">' +
              '<button class="btn btn-light" id="zin" aria-label="Увеличить схему">+<span class="zl"> Крупнее</span></button>' +
              '<button class="btn btn-light" id="zout" aria-label="Уменьшить схему">−<span class="zl"> Мельче</span></button>' +
              '<button class="btn btn-light" id="zreset">Как было</button>' +
            '</div>' +
            '<div class="legend-chip" id="legend"></div>' +
          '</div>' +
          '<div class="player" id="player" hidden>' +
            '<div class="p-head"><span class="p-title">Фрагмент ' + scr.time + '</span>' +
              '<button class="btn btn-light p-close" id="pclose" aria-label="Закрыть окошко видео">✕ Закрыть</button></div>' +
            '<video id="video" playsinline controls preload="none"></video>' +
            '<div class="part" id="part"></div><p class="quote">' + esc(scr.quote) + '</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>';

  $('#listen').onclick = function () { togglePlayer(scr); };
  $('#pclose').onclick = function () { closePlayer(); };
  $('#zin').onclick = function () { zoomBy(1.4); };
  $('#zout').onclick = function () { zoomBy(1 / 1.4); };
  $('#zreset').onclick = function () { ui.view = { x: scr.view[0], y: scr.view[1], w: scr.view[2], h: scr.view[3] }; drawFrame(); };
  bindFrame();
  bindHover();
  renderPanel();
  var lbl = answerLabel(scr.n);
  if (lbl) setStatus(lbl + ' — ответ сохранён', 'ok');
}

function renderNav() {
  var scr = ui.scr, nav = $('#nav');
  if (!ui.fix) {
    nav.innerHTML =
      '<button class="btn btn-light" id="back">← Назад</button>' +
      '<span class="pos">Экран ' + scr.n + ' из 6</span>' +
      '<button class="btn btn-light" id="next">' + (scr.n === 6 ? 'К отправке →' : 'Дальше →') + '</button>';
    $('#next').onclick = function () { go(S.cur + 1); };
  } else {
    nav.innerHTML =
      '<button class="btn btn-light" id="back">← Назад</button>' +
      '<button class="btn btn-primary" id="savefix">Сохранить и дальше →</button>';
  }
  $('#back').onclick = function () { go(S.cur - 1); };
}

function renderPanel() {
  var scr = ui.scr, a = ans(scr.n), panel = $('#panel');
  $('#title').textContent = ui.fix ? (a.approx ? 'Отметьте примерно, как помните' : scr.fixTitle) : scr.title;
  $('#frame').classList.toggle('fix', ui.fix);
  $('.screen').classList.toggle('fixing', ui.fix);
  $('#legend').innerHTML = ui.fix
    ? '<i class="l-own"></i>Ваши отметки · схему можно двигать и увеличивать'
    : '<i class="l-ours"></i>Так мы поняли Ваши слова';
  renderNav();

  if (!ui.fix) {
    var chosen = a.mode;
    panel.innerHTML =
      '<div class="ask"><span>Мы поняли так. Верно?</span>' +
        (S.answers[scr.n] && S.answers[scr.n].mode === null && hasOwnDraft(scr.n) ? '<button class="btn-link" id="mine">Мои отметки →</button>' : '') + '</div>' +
      stepsOursHTML(scr) +
      '<div class="answers">' +
        '<button class="btn btn-yes' + (chosen === 'ours' ? ' chosen' : '') + '" id="yes">' + (chosen === 'ours' ? '✓ Да, так — выбрано' : 'Да, так') + '</button>' +
        '<button class="btn btn-no" id="no">Нет — исправлю (точки или голос)</button>' +
        '<div class="links">' +
          '<button class="btn-link" id="approx">Не помню точно — отмечу примерно</button><span class="sep">·</span>' +
          '<button class="btn-link' + (chosen === 'skip' ? ' chosen-link' : '') + '" id="skip">' + (chosen === 'skip' ? '✓ Указатель не нужен — выбрано' : 'Здесь указатель не нужен') + '</button>' +
        '</div>' +
      '</div>';
    $('#yes').onclick = function () {
      a.mode = 'ours';
      persist(scr.n, '✓ Выбор сохранён: «Да, так»');
      renderPanel(); setStatus('✓ Выбор сохранён: «Да, так». Переходим дальше…', 'ok');
      setTimeout(function () { if (S.cur === scr.n) go(scr.n + 1); }, 900);
    };
    $('#no').onclick = function () { openFix(false); };
    $('#approx').onclick = function () { openFix(true); };
    $('#skip').onclick = function () {
      a.mode = 'skip';
      persist(scr.n, '✓ Отмечено: здесь указатель не нужен');
      renderPanel(); setStatus('✓ Отмечено: здесь указатель не нужен. Переходим дальше…', 'ok');
      setTimeout(function () { if (S.cur === scr.n) go(scr.n + 1); }, 900);
    };
    var mine = $('#mine'); if (mine) mine.onclick = function () { openFix(a.approx); };
  } else {
    panel.innerHTML =
      '<div id="steps">' + stepsFixHTML(scr, a) + '</div>' +
      '<div class="row2">' +
        '<button class="btn btn-light" id="undo">↶ Убрать точку</button>' +
        '<button class="btn btn-light" id="reset">Начать заново</button>' +
      '</div>' +
      '<div id="voice"></div>' +
      '<div class="ask"><label class="text-label" for="text">Или напишите:</label>' +
        '<button class="btn-link" id="toours">← к нашему варианту</button></div>' +
      '<textarea id="text" rows="2" placeholder="Например: коробка не здесь, а у двери в помещение 3"></textarea>';
    var ta = $('#text');
    ta.value = a.text || '';
    var tmr = null;
    ta.addEventListener('input', function () {
      a.text = ta.value; a.mode = 'own';
      clearTimeout(tmr); setStatus('Сохраняю…', 'info');
      tmr = setTimeout(function () { persist(scr.n, '✓ Текст сохранён'); }, 500);
    });
    ta.addEventListener('blur', function () { a.text = ta.value; clearTimeout(tmr); persist(scr.n, '✓ Текст сохранён'); });
    $('#undo').onclick = function () {
      if (!a.points.length) { setStatus('Точек пока нет — нажмите на схеме.', 'info'); return; }
      a.points.pop(); persist(scr.n, '✓ Последняя точка убрана'); refreshFix();
    };
    $('#reset').onclick = function () {
      if (!a.points.length) { setStatus('Точек пока нет — нажмите на схеме.', 'info'); return; }
      if (!ui.resetAsk || Date.now() - ui.resetAsk > 4000) { ui.resetAsk = Date.now(); setStatus('Убрать все точки на этом экране? Нажмите «Начать заново» ещё раз.', 'warn'); return; }
      ui.resetAsk = 0; a.points = []; persist(scr.n, '✓ Точки убраны — можно отмечать заново'); refreshFix();
    };
    $('#savefix').onclick = function () {
      a.text = ta.value;
      if (!a.points.length && !(a.text && a.text.trim()) && !VOICES[scr.n]) {
        setStatus('Отметьте хотя бы одну точку на схеме, расскажите голосом или напишите словами.', 'warn');
        return;
      }
      if (REC) { stopRec(function () { $('#savefix').click(); }); return; }
      a.mode = 'own';
      if (persist(scr.n, '✓ Ваши отметки сохранены. Переходим дальше…')) {
        setTimeout(function () { if (S.cur === scr.n) go(scr.n + 1); }, 900);
      }
    };
    $('#toours').onclick = function () {
      if (REC) stopRec();
      // Свои отметки не стираем — они останутся, если вернуться в «Нет — исправлю».
      if (a.mode === 'own') { a.mode = null; saveState(); }
      ui.fix = false; renderPanel();
      setStatus('Показан наш вариант. Ваши отметки не удалены.', 'info');
    };
    renderVoice();
  }
  drawFrame();
}
function hasOwnDraft(k) { var a = S.answers[k]; return !!(a && (a.points.length || (a.text && a.text.trim()) || VOICES[k])); }

function openFix(approx) {
  var a = ans(ui.scr.n);
  a.approx = !!approx;
  a.mode = 'own';
  saveState();
  ui.fix = true;
  ui.hl = null;
  renderPanel();
  setStatus(approx ? 'Отметьте места примерно — точность не важна, важен порядок.' : 'Нажмите на схеме первое место.', 'info');
}
function refreshFix() {
  var st = $('#steps'); if (st) st.innerHTML = stepsFixHTML(ui.scr, ans(ui.scr.n));
  drawFrame();
}

/* ---------- Подсветка: шаг слева ↔ точка и табличка на схеме ---------- */
function setHL(i) {
  ui.hl = (i === null || i === undefined || isNaN(i)) ? null : i;
  Array.prototype.forEach.call(document.querySelectorAll('[data-i]'), function (el) {
    el.classList.toggle('hl', ui.hl !== null && +el.getAttribute('data-i') === ui.hl);
  });
}
function bindHover() {
  var panel = $('#panel'), svg = $('#svg');
  function from(e) { var t = e.target.closest ? e.target.closest('[data-i]') : null; return t ? +t.getAttribute('data-i') : null; }
  panel.addEventListener('mouseover', function (e) { var i = from(e); if (i !== ui.hl) setHL(i); });
  panel.addEventListener('mouseleave', function () { setHL(null); });
  panel.addEventListener('focusin', function (e) { var i = from(e); if (i !== null) setHL(i); });
  panel.addEventListener('focusout', function () { setHL(null); });
  svg.addEventListener('mouseover', function (e) { var i = from(e); if (i !== ui.hl) setHL(i); });
  svg.addEventListener('mouseleave', function () { setHL(null); });
}

/* ---------- Кадр: геометрия ---------- */
/* ui.view — нужная область кадра (4:3). На экране она вписывается в рамку любой формы:
   по длинной стороне рамки видно чуть больше кадра. s — единиц кадра на 1 пиксель экрана. */
function geom() {
  var svg = $('#svg');
  var W = (svg && svg.clientWidth) || 1000, H = (svg && svg.clientHeight) || 750, v = ui.view;
  var s = Math.max(v.w / W, v.h / H);
  return { W: W, H: H, s: s, vx: v.x + v.w / 2 - W * s / 2, vy: v.y + v.h / 2 - H * s / 2 };
}
function rectOf(el, base) {
  if (!el || el.hidden || !el.offsetParent) return null;
  var r = el.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  return { x: r.left - base.left - 6, y: r.top - base.top - 6, w: r.width + 12, h: r.height + 12 };
}
function overlap(a, b) {
  var w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  var h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return (w > 0 && h > 0) ? w * h : 0;
}
var MEASURE = null;
function textW(t) {
  try {
    if (!MEASURE) MEASURE = document.createElement('canvas').getContext('2d');
    MEASURE.font = '600 17px "Golos Text", Arial, sans-serif';
    return MEASURE.measureText(t).width;
  } catch (e) { return t.length * 9.5; }
}

/* Таблички «1 · ВРУ» со стрелкой: пробуем 8 направлений и 3 расстояния, выбираем место,
   где табличка не закрывает другие таблички, точки, панель «Крупнее», легенду и окошко видео
   и не выходит за видимую часть схемы. Всё в пикселях экрана. */
function placeLabels(items, g, obstacles, rp) {
  var DIRS = [[1, -1], [-1, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [0, -1], [0, 1]];
  var DIST = [16, 48, 90, 140];
  var pad = 4, placed = [], out = [];
  var circles = items.map(function (it) { return { x: it.px - rp - 3, y: it.py - rp - 3, w: 2 * rp + 6, h: 2 * rp + 6 }; });
  items.forEach(function (it, idx) {
    var w = Math.round(textW(it.text) + 22), h = 32, best = null;
    DIST.forEach(function (d, di) {
      DIRS.forEach(function (dr, k) {
        var cx = it.px + (dr[0] ? dr[0] * (rp + d + w / 2) : 0);
        var cy = it.py + (dr[1] ? dr[1] * (rp + d + h / 2) : 0);
        if (!dr[1]) cy = it.py;
        var r = { x: cx - w / 2, y: cy - h / 2, w: w, h: h };
        var score = di * 40 + k * 6;
        var inside = overlap(r, { x: pad, y: pad, w: g.W - 2 * pad, h: g.H - 2 * pad });
        score += (w * h - inside) * 30;
        placed.forEach(function (q) { score += overlap(r, q) * 25; });
        circles.forEach(function (c, ci) { if (ci !== idx) score += overlap(r, c) * 12; else score += overlap(r, c) * 40; });
        obstacles.forEach(function (o) { score += overlap(r, o) * 8; });
        // табличка должна быть заметно ближе к своей точке, чем к чужой — иначе стрелку легко перепутать
        var own = rectDist(r, it.px, it.py);
        items.forEach(function (o2, j) { if (j !== idx) { var d2 = rectDist(r, o2.px, o2.py); if (d2 < own + 12) score += 3000 + (own + 12 - d2) * 40; else if (d2 < own + 110) score += (own + 110 - d2) * 6; } });
        if (!best || score < best.score) best = { score: score, r: r };
      });
    });
    placed.push({ x: best.r.x - 3, y: best.r.y - 3, w: best.r.w + 6, h: best.r.h + 6 });
    out.push({ i: it.i, text: it.text, num: it.num, px: it.px, py: it.py, r: best.r });
  });
  return out;
}
function rectDist(r, x, y) {
  var dx = Math.max(r.x - x, 0, x - (r.x + r.w)), dy = Math.max(r.y - y, 0, y - (r.y + r.h));
  return Math.hypot(dx, dy);
}
function labelsSVG(list, cls, rp) {
  return list.map(function (L) {
    var r = L.r, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    // начало стрелки — край таблички по направлению к точке
    var dx = L.px - cx, dy = L.py - cy;
    var tx = dx ? (r.w / 2) / Math.abs(dx) : Infinity, ty = dy ? (r.h / 2) / Math.abs(dy) : Infinity, t = Math.min(tx, ty);
    var sx = cx + dx * t, sy = cy + dy * t;
    var len = Math.hypot(L.px - sx, L.py - sy) || 1, ux = (L.px - sx) / len, uy = (L.py - sy) / len;
    var ex = L.px - ux * (rp + 3), ey = L.py - uy * (rp + 3);           // остриё — у края кружка
    var arrow = '';
    if (Math.hypot(ex - sx, ey - sy) > 6) {
      var bx = ex - ux * 13, by = ey - uy * 13, nx = -uy * 7, ny = ux * 7;
      arrow = '<line class="arr" x1="' + sx.toFixed(1) + '" y1="' + sy.toFixed(1) + '" x2="' + bx.toFixed(1) + '" y2="' + by.toFixed(1) + '" stroke-linecap="round"/>' +
              '<polygon class="tip" points="' + ex.toFixed(1) + ',' + ey.toFixed(1) + ' ' + (bx + nx).toFixed(1) + ',' + (by + ny).toFixed(1) + ' ' + (bx - nx).toFixed(1) + ',' + (by - ny).toFixed(1) + '"/>';
    }
    var rest = L.text.slice(String(L.num).length);
    return '<g class="lab ' + cls + '" data-i="' + L.i + '">' + arrow +
      '<rect class="plate" x="' + r.x.toFixed(1) + '" y="' + r.y.toFixed(1) + '" width="' + r.w + '" height="' + r.h + '" rx="8"/>' +
      '<text x="' + (r.x + 11).toFixed(1) + '" y="' + (cy + 0.5).toFixed(1) + '" dominant-baseline="central"><tspan font-weight="800">' + L.num + '</tspan>' + esc(rest) + '</text></g>';
  }).join('');
}

/* ---------- Кадр: точки, маршрут, таблички, увеличение ---------- */
function drawFrame() {
  var svg = $('#svg'); if (!svg || !ui.scr) return;
  var scr = ui.scr, a = ans(scr.n), G = geom(), u = G.s;
  svg.setAttribute('viewBox', G.vx + ' ' + G.vy + ' ' + (G.W * u) + ' ' + (G.H * u));
  var base = clamp(G.W / 1040, G.W < 700 ? 0.5 : 0.85, 1);   // размер значков как в макете, меньше на телефоне
  var kL = G.W < 700 ? clamp(G.W / 760, 0.62, 1) : 1;            // таблички на телефоне мельче
  var g = '', items = [], i;
  function toPx(x, y) { return [(x - G.vx) / u, (y - G.vy) / u]; }
  if (!ui.fix) {
    var pts = scr.ours;
    if (scr.route && pts.length > 1) {
      g += '<polyline points="' + (scr.line || pts).map(function (p) { return p.join(','); }).join(' ') + '" fill="none" stroke="#FF6A00" stroke-opacity=".9" stroke-width="' + (9 * base * u) + '" stroke-linejoin="round" stroke-linecap="round"/>';
    }
    var R = 30 * base * u, placed = [];
    for (i = 0; i < pts.length; i++) {
      var x0 = pts[i][0], y0 = pts[i][1], x = x0, y = y0;
      var hits = function (px, py) { return placed.some(function (q) { return Math.hypot(q[0] - px, q[1] - py) < 2.1 * R; }); };
      if (hits(x, y)) {      // номер закрыл бы соседний — выносим в сторону с тонкой линией к месту
        var angs = [-60, -120, 60, 120, 0, 180, -90, 90];
        for (var k = 0; k < angs.length; k++) {
          var ax = x0 + Math.cos(angs[k] * Math.PI / 180) * 2.6 * R, ay = y0 + Math.sin(angs[k] * Math.PI / 180) * 2.6 * R;
          if (!hits(ax, ay)) { x = ax; y = ay; break; }
        }
        g += '<line x1="' + x0 + '" y1="' + y0 + '" x2="' + x + '" y2="' + y + '" stroke="#FF6A00" stroke-width="' + (4 * base * u) + '"/>' +
             '<circle cx="' + x0 + '" cy="' + y0 + '" r="' + (9 * base * u) + '" fill="#FF2D55" stroke="#fff" stroke-width="' + (2 * base * u) + '"/>';
      }
      placed.push([x, y]);
      g += '<g class="pt" data-i="' + i + '">' +
           '<circle class="halo" cx="' + x + '" cy="' + y + '" r="' + (30 * base * u) + '" fill="#FFE600" stroke="#FF6A00" stroke-width="' + (3 * base * u) + '"/>' +
           '<circle cx="' + x + '" cy="' + y + '" r="' + (30 * base * u) + '" fill="#FFE600" fill-opacity=".6" stroke="#FF6A00" stroke-width="' + (6 * base * u) + '"/>' +
           '<circle class="core" cx="' + x + '" cy="' + y + '" r="' + (17 * base * u) + '" fill="#FF2D55" stroke="#fff" stroke-width="' + (3 * base * u) + '"/>' +
           '<text x="' + x + '" y="' + y + '" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-weight="700" font-size="' + (20 * base * u) + '" fill="#fff">' + (i + 1) + '</text></g>';
      var sp = toPx(x, y);
      items.push({ i: i, num: i + 1, text: shortLabel(scr, i), px: sp[0], py: sp[1] });
    }
  } else {
    var own = a.points;
    if (scr.route && own.length > 1) {
      g += '<polyline points="' + own.map(function (p) { return p.x + ',' + p.y; }).join(' ') + '" fill="none" stroke="#2EA05A" stroke-opacity=".9" stroke-width="' + (8 * base * u) + '" stroke-linejoin="round" stroke-linecap="round"/>';
    }
    var R2 = 26 * base * u, placed2 = [];
    for (i = 0; i < own.length; i++) {
      var p = own[i], ox = p.x, oy = p.y;
      var hits2 = function (px, py) { return placed2.some(function (q) { return Math.hypot(q[0] - px, q[1] - py) < 1.6 * R2; }); };
      if (hits2(ox, oy)) {   // то же место — номер выносим в сторону, место отмечаем маленьким кружком (координаты не меняем)
        var angs2 = [-60, -120, 60, 120, 0, 180, -90, 90];
        for (var k2 = 0; k2 < angs2.length; k2++) {
          var bx2 = p.x + Math.cos(angs2[k2] * Math.PI / 180) * 2.4 * R2, by2 = p.y + Math.sin(angs2[k2] * Math.PI / 180) * 2.4 * R2;
          if (!hits2(bx2, by2)) { ox = bx2; oy = by2; break; }
        }
        g += '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + ox + '" y2="' + oy + '" stroke="#2EA05A" stroke-width="' + (4 * base * u) + '"/>' +
             '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (8 * base * u) + '" fill="#2EA05A" stroke="#fff" stroke-width="' + (2 * base * u) + '"/>';
      }
      placed2.push([ox, oy]);
      g += '<g class="pt" data-i="' + i + '"><circle class="core" cx="' + ox + '" cy="' + oy + '" r="' + R2 + '" fill="#2EA05A" stroke="#fff" stroke-width="' + (4 * base * u) + '"/>' +
           '<text x="' + ox + '" y="' + oy + '" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-weight="700" font-size="' + (22 * base * u) + '" fill="#fff">' + (i + 1) + '</text></g>';
      var q = toPx(ox, oy);
      items.push({ i: i, num: i + 1, text: shortLabel(scr, i), px: q[0], py: q[1] });
    }
  }
  // таблички — в пикселях экрана (группа с масштабом), только для точек в видимой части
  // (на телефоне считаем в «увеличенных» пикселях: W/kL, а группу уменьшаем в kL раз)
  var sb = svg.getBoundingClientRect();
  var obstacles = [rectOf($('#zoom'), sb), rectOf($('#legend'), sb), rectOf($('#player'), sb)].filter(Boolean)
    .map(function (o) { return { x: o.x / kL, y: o.y / kL, w: o.w / kL, h: o.h / kL }; });
  var rp = (ui.fix ? 26 : 30) * base;
  var vis = items.filter(function (it) { return it.px > -rp && it.py > -rp && it.px < G.W + rp && it.py < G.H + rp; })
    .map(function (it) { return { i: it.i, num: it.num, text: it.text, px: it.px / kL, py: it.py / kL }; });
  var labs = placeLabels(vis, { W: G.W / kL, H: G.H / kL }, obstacles, rp / kL);
  g += '<g class="labels" transform="translate(' + G.vx + ' ' + G.vy + ') scale(' + (u * kL) + ')">' + labelsSVG(labs, ui.fix ? 'own' : 'ours', rp / kL) + '</g>';
  $('#marks').innerHTML = g;
  if (ui.hl !== null && ui.hl !== undefined) setHL(ui.hl);

  var hint = $('#fhint'), frame = $('#frame');
  if (ui.fix) {
    var n = a.points.length, total = scr.steps.length;
    hint.hidden = false;
    if (n < total) {
      hint.className = 'fix-bar';
      hint.innerHTML = esc('Шаг ' + (n + 1) + ' из ' + total + ': нажмите на схеме — ' + scr.steps[n]) +
        (scr.note ? '<span class="bar-note">' + esc(scr.note) + '</span>' : '');
      frame.classList.add('wait'); frame.classList.remove('done');
    } else {
      hint.className = 'fix-bar done';
      hint.textContent = 'Все точки отмечены ✓ — нажмите «Сохранить и дальше»';
      frame.classList.remove('wait'); frame.classList.add('done');
    }
  } else {
    hint.hidden = true;
    frame.classList.remove('wait', 'done');
  }
}

function setView(w, fx, fy, px, py) {
  // w — новая ширина области; точка кадра (fx, fy) окажется в точке экрана (px, py) внутри схемы (по умолчанию — в центре)
  w = clamp(w, MIN_W, MAX_W);
  var h = w * 3 / 4, G = geom(), s = Math.max(w / G.W, h / G.H);
  if (px === undefined) { px = G.W / 2; py = G.H / 2; }
  var cx = fx - px * s + G.W * s / 2, cy = fy - py * s + G.H * s / 2;
  ui.view = { x: clamp(cx - w / 2, 0, FW - w), y: clamp(cy - h / 2, 0, FH - h), w: w, h: h };
  drawFrame();
}
function zoomBy(f) {
  var v = ui.view;
  setView(v.w / f, v.x + v.w / 2, v.y + v.h / 2);
}
function clientToFrame(cx, cy) {
  var r = $('#svg').getBoundingClientRect(), G = geom();
  var px = cx - r.left, py = cy - r.top;
  return { x: G.vx + px * G.s, y: G.vy + py * G.s, px: px, py: py };
}

function bindFrame() {
  var svg = $('#svg');
  var ptrs = {}, gesture = null;
  function count() { return Object.keys(ptrs).length; }
  function two() { var k = Object.keys(ptrs); return [ptrs[k[0]], ptrs[k[1]]]; }

  svg.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' && !ui.fix) return;   // на телефоне в режиме просмотра — обычная прокрутка страницы
    if (e.button !== undefined && e.button > 0) return;
    try { svg.setPointerCapture(e.pointerId); } catch (er) {}
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (count() === 2) {
      var t = two();
      var mx = (t[0].x + t[1].x) / 2, my = (t[0].y + t[1].y) / 2;
      gesture = { type: 'pinch', d0: Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y) || 1, view0: Object.assign({}, ui.view), m0: clientToFrame(mx, my) };
    } else if (count() === 1) {
      gesture = { type: 'tap', x0: e.clientX, y0: e.clientY, view0: Object.assign({}, ui.view), s0: geom().s };
    }
    e.preventDefault();
  });
  svg.addEventListener('pointermove', function (e) {
    if (!ptrs[e.pointerId] || !gesture) return;
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    var r = svg.getBoundingClientRect();
    if (gesture.type === 'pinch' && count() >= 2) {
      var t = two();
      var d = Math.hypot(t[0].x - t[1].x, t[0].y - t[1].y) || 1;
      var mx = (t[0].x + t[1].x) / 2, my = (t[0].y + t[1].y) / 2;
      setView(gesture.view0.w / (d / gesture.d0), gesture.m0.x, gesture.m0.y, mx - r.left, my - r.top);
    } else if (gesture.type === 'tap' || gesture.type === 'pan') {
      var dx = e.clientX - gesture.x0, dy = e.clientY - gesture.y0;
      if (gesture.type === 'tap' && Math.hypot(dx, dy) > 8) gesture.type = 'pan';
      if (gesture.type === 'pan') {
        var v0 = gesture.view0, k = gesture.s0;
        ui.view = { x: clamp(v0.x - dx * k, 0, FW - v0.w), y: clamp(v0.y - dy * k, 0, FH - v0.h), w: v0.w, h: v0.h };
        drawFrame();
      }
    }
  });
  function end(e) {
    if (!ptrs[e.pointerId]) return;
    if (e.type === 'pointerup' && gesture && gesture.type === 'tap' && count() === 1 && ui.fix) {
      var f = clientToFrame(e.clientX, e.clientY);
      if (f.x >= 0 && f.x <= FW && f.y >= 0 && f.y <= FH) addPoint(f.x, f.y);
      else setStatus('Здесь край кадра — нажмите, пожалуйста, на самой схеме.', 'info');
    }
    delete ptrs[e.pointerId];
    if (count() === 0) gesture = null;
    else gesture = { type: 'none' };   // после двух пальцев оставшийся палец точку не ставит
  }
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);
  svg.addEventListener('wheel', function (e) {
    if (!ui.fix) return;
    e.preventDefault();
    var f = clientToFrame(e.clientX, e.clientY);
    setView(ui.view.w / Math.exp(-e.deltaY * 0.0015), f.x, f.y, f.px, f.py);
  }, { passive: false });
}

function addPoint(fx, fy) {
  var scr = ui.scr, a = ans(scr.n);
  var x = Math.round(clamp(fx, 0, FW - 1)), y = Math.round(clamp(fy, 0, FH - 1));
  var upx = geom().s;   // единиц кадра на 1 пиксель экрана
  var last = a.points[a.points.length - 1], now = Date.now();
  if (last && now - (ui.lastAddT || 0) < 700 && Math.hypot(last.x - x, last.y - y) <= 30 * upx) {
    setStatus('Эта точка уже стоит — двойной щелчок не нужен, достаточно одного.', 'info'); return;   // защита от двойного щелчка
  }
  ui.lastAddT = now;
  var same = null;
  for (var i = 0; i < a.points.length; i++) {
    if (Math.hypot(a.points[i].x - x, a.points[i].y - y) <= 8 * upx) { same = i + 1; break; }   // координаты не переносим
  }
  a.points.push({ x: x, y: y, same_as: same });
  a.mode = 'own';
  var n = a.points.length;
  var msg = '✓ Точка ' + n + ' сохранена' + (same ? ' (то же место, что точка ' + same + ')' : '');
  persist(scr.n, msg);
  if (x >= 1620 && y < 225) setStatus('Точка ' + n + ' попала под окно с видео в правом верхнем углу — там её будет плохо видно. Если можно, поставьте рядом.', 'warn');
  refreshFix();
}

/* предзагрузка кадров, чтобы схема не появлялась с белым фоном */
['media/slide11.jpg', 'media/drawing.jpg'].forEach(function (src) { var im = new Image(); im.src = src; });

/* ---------- Прослушивание фрагмента: окошко поверх схемы в левом верхнем углу ---------- */
function togglePlayer(scr) {
  var box = $('#player'), btn = $('#listen'), video = $('#video');
  if (player) { stopPlayer(); return; }
  if (REC) stopRec();
  var wasHidden = box.hidden;
  box.hidden = false;
  if (wasHidden) drawFrame();          // таблички уходят из-под окошка
  player = { i: 0 };
  $('#listen-t').textContent = '■ Остановить';
  btn.classList.add('on');
  function playPart() {
    var c = scr.clips[player.i];
    $('#part').textContent = scr.clips.length > 1 ? 'Часть ' + (player.i + 1) + ' из ' + scr.clips.length + ' (воспроизводятся подряд)' : '';
    video.src = 'media/clip' + c + '.mp4';
    var p = video.play();
    if (p && p.catch) p.catch(function () { $('#part').textContent = 'Нажмите ▶ на окошке видео, чтобы послушать.'; });
  }
  video.onended = function () {
    if (!player) return;
    if (player.i < scr.clips.length - 1) { player.i++; playPart(); }
    else { player = null; $('#listen-t').textContent = '▶ Послушать ещё раз'; btn.classList.remove('on'); }
  };
  video.onerror = function () { $('#part').textContent = 'Видео не загрузилось. Проверьте интернет и нажмите «Послушать» ещё раз.'; };
  playPart();
}
function stopPlayer() {
  var video = $('#video');
  if (video) { try { video.pause(); } catch (e) {} }
  if (player) { player = null; var b = $('#listen'), t = $('#listen-t'); if (t) t.textContent = '▶ Послушать ещё раз'; if (b) b.classList.remove('on'); }
}
function closePlayer() {
  stopPlayer();
  var box = $('#player'); if (box && !box.hidden) { box.hidden = true; drawFrame(); }
  var b = $('#listen'); if (b) b.focus();
}

/* ---------- Голос ---------- */
function pickMime() {
  if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return '';
  var list = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'];
  for (var i = 0; i < list.length; i++) if (MediaRecorder.isTypeSupported(list[i])) return list[i];
  return '';
}
function renderVoice(hintHTML) {
  var box = $('#voice'); if (!box) return;
  var k = ui.scr.n, a = ans(k), blob = VOICES[k];
  var html = '';
  if (REC && REC.k === k) {
    html = '<button class="rec on" id="recbtn" aria-label="Идёт запись, нажмите, чтобы остановить"><span class="dot"></span><span>Идёт запись <span id="rectime">' + fmtTime((Date.now() - REC.t0) / 1000) + '</span> · Стоп</span></button>';
  } else if (blob) {
    html = '<audio id="vaudio" preload="metadata" hidden></audio>' +
           '<div class="row2"><button class="btn btn-light voice-ok" id="vplay" aria-label="Прослушать мою запись">✓ ▶ Голос' + (a.voice && a.voice.dur ? ' ' + fmtTime(a.voice.dur) : '') + '</button>' +
           '<button class="btn btn-light" id="rerec">Перезаписать</button></div>';
  } else {
    html = '<button class="rec" id="recbtn"><span class="dot"></span><span>Или расскажите голосом</span></button>';
  }
  if (hintHTML) html += '<div class="mic-hint">' + hintHTML + '</div>';
  box.innerHTML = html;
  var rb = $('#recbtn');
  if (rb) rb.onclick = function () { if (REC) stopRec(); else startRec(k); };
  var au = $('#vaudio');
  if (blob && au) {
    au.src = URL.createObjectURL(blob);
    $('#vplay').onclick = function () {
      stopPlayer();
      if (!au.paused) { au.pause(); return; }
      au.currentTime = 0; var p = au.play(); if (p && p.catch) p.catch(function () {});
      setStatus('▶ Звучит Ваша запись. Нажмите ещё раз, чтобы остановить.', 'info');
    };
    $('#rerec').onclick = function () { au.pause(); startRec(k); };
  }
}
function micFail(kind) {
  var msg = kind === 'NotAllowedError' || kind === 'SecurityError'
    ? 'Нет доступа к микрофону. Разрешите его у значка замка (или «аА») рядом с адресом — или просто напишите ниже.'
    : 'Микрофон недоступен — ничего страшного, напишите, пожалуйста, ниже.';
  renderVoice(esc(msg));
  setStatus('Голос сейчас недоступен — напишите текстом.', 'warn');
  var ta = $('#text');
  if (ta) { ta.classList.add('attention'); ta.focus(); }
}
function startRec(k) {
  stopPlayer();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { micFail('nosupport'); return; }
  setStatus('Включаю микрофон… Если браузер спросит разрешение — нажмите «Разрешить».', 'info');
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
    var mime = pickMime(), mr;
    try { mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream); }
    catch (e) { stream.getTracks().forEach(function (t) { t.stop(); }); micFail('nosupport'); return; }
    var chunks = [];
    REC = { k: k, mr: mr, stream: stream, t0: Date.now(), timer: null, after: null };
    mr.ondataavailable = function (ev) { if (ev.data && ev.data.size) chunks.push(ev.data); };
    mr.onstop = function () {
      var r = REC; REC = null;
      clearInterval(r.timer);
      stream.getTracks().forEach(function (t) { t.stop(); });
      var type = mr.mimeType || mime || 'audio/webm';
      var blob = new Blob(chunks, { type: type });
      var a = ans(k);
      if (blob.size > 0) {
        VOICES[k] = blob;
        a.voice = { mime: type, dur: Math.round((Date.now() - r.t0) / 1000), size: blob.size };
        a.mode = 'own';
        setStatus('Сохраняю голос…', 'info');
        idbPut(k, blob).then(function (ok) {
          touch(k);
          if (S.cur === k) setStatus(ok ? '✓ Голос сохранён' : '✓ Голос записан. Пожалуйста, отправьте ответы, не закрывая страницу.', ok ? 'ok' : 'warn');
        });
      } else if (S.cur === k) setStatus('Запись получилась пустой — попробуйте ещё раз.', 'warn');
      if (S.cur === k && ui.fix) renderVoice();
      if (r.after) r.after();
    };
    mr.start(1000);
    REC.timer = setInterval(function () {
      var el = $('#rectime'); if (el && REC) el.textContent = fmtTime((Date.now() - REC.t0) / 1000);
      if (REC && Date.now() - REC.t0 > 5 * 60 * 1000) stopRec();   // не дольше 5 минут
    }, 500);
    setStatus('Идёт запись — говорите. Когда закончите, нажмите «Стоп».', 'info');
    renderVoice();
  }).catch(function (e) { micFail(e && e.name); });
}
function stopRec(after) {
  if (!REC) { if (after) after(); return; }
  REC.after = after || null;
  try { REC.mr.stop(); } catch (e) { var r = REC; REC = null; clearInterval(r.timer); if (after) after(); }
}

/* ---------- Итог и отправка ---------- */
function isoLocal(d) {
  var off = -d.getTimezoneOffset(), sign = off >= 0 ? '+' : '-';
  function p(n) { return String(Math.floor(Math.abs(n))).padStart(2, '0'); }
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) + sign + p(off / 60) + ':' + p(off % 60);
}
function extFor(mime) { return /mp4|aac|m4a/.test(mime) ? 'm4a' : /ogg/.test(mime) ? 'ogg' : 'webm'; }

function buildData() {
  var places = [], screens = [];
  SCREENS.forEach(function (scr) {
    var a = S.answers[scr.n] || {};
    var answered = isAnswered(scr.n);
    var mode = answered ? a.mode : 'none';
    var text = (a.text || '').trim();
    var voice = (mode === 'own' && VOICES[scr.n]) ? { file: 'voice_screen' + scr.n + '.' + extFor(a.voice ? a.voice.mime : VOICES[scr.n].type), mime: (a.voice && a.voice.mime) || VOICES[scr.n].type, duration_s: a.voice ? a.voice.dur : null } : null;
    var commentParts = [];
    if (mode === 'own' && a.approx) commentParts.push('примерно (эксперт не помнит точно)');
    if (mode === 'own' && text) commentParts.push(text);
    if (voice) commentParts.push('[голос] ' + voice.file);
    var comment = commentParts.join(' · ');

    // точки по местам
    var byPlace = {};
    scr.places.forEach(function (pn) { byPlace[pn] = []; });
    var labelFor = function (idx) { return scr.steps[idx] || ''; };
    if (mode === 'ours') {
      scr.ours.forEach(function (pt, idx) { byPlace[scr.oursPlace[idx]].push({ x: pt[0], y: pt[1], label: labelFor(idx), same_global: null }); });
    } else if (mode === 'own') {
      (a.points || []).forEach(function (pt, idx) {
        var pn = scr.places.length > 1 ? (idx < scr.firstCount ? scr.places[0] : scr.places[1]) : scr.places[0];
        byPlace[pn].push({ x: pt.x, y: pt.y, label: labelFor(idx), same_global: pt.same_as, gidx: idx + 1 });
      });
    }
    scr.places.forEach(function (pn) {
      var list = byPlace[pn];
      var status = mode === 'skip' ? 'skip' : mode === 'none' ? 'no_answer' : list.length ? 'marked' : 'unclear';
      var points = list.map(function (p, i) {
        var same = null;
        if (p.same_global) {                       // «то же место» — номер внутри этого места, если точка в нём
          for (var j = 0; j < i; j++) if (list[j].gidx === p.same_global) { same = j + 1; break; }
        }
        return { i: i + 1, x: p.x, y: p.y, word: null, t: null, same_as: same, label: p.label };
      });
      places.push({
        n: pn, screen: scr.n, frame: FRAMES[scr.frame].path, window: PLACES[pn].window,
        status: status,
        source: mode === 'ours' ? 'наш вариант' : mode === 'own' ? 'эксперт' : null,
        approx: mode === 'own' ? !!a.approx : false,
        connect: PLACES[pn].connect,
        comment: comment,
        voice: voice,
        points: points
      });
    });
    screens.push({ screen: scr.n, places: scr.places, answer: mode === 'own' && a.approx ? 'approx' : mode,
      points_count: mode === 'own' ? (a.points || []).length : mode === 'ours' ? scr.ours.length : 0,
      text: mode === 'own' ? text : '', voice: voice, updated_at: a.updated || null });
  });
  return {
    schema: 'asd-marker-points/1', lesson: 'urok4', time_base: 'lesson_seconds', frame_size: [FW, FH],
    submitted_at: isoLocal(new Date()), expert: 'Махалова Лариса Владимировна', page_version: PAGE_VERSION,
    places: places, screens: screens
  };
}

function renderFinal(app) {
  var missing = SCREENS.filter(function (s) { return !isAnswered(s.n); }).length;
  app.innerHTML =
    '<div id="final-main"></div>' +
    '<div class="debug" id="send-debug"></div>';
  if (S.sentAt) { renderThanks(true); return; }
  var rows = SCREENS.map(function (s) {
    var lbl = answerLabel(s.n);
    return '<li><div><div class="r-title">Экран ' + s.n + '. ' + esc(s.title) + '</div>' +
      '<div class="r-state ' + (lbl ? 'ok' : 'none') + '">' + (lbl ? esc(lbl) : 'Пока без ответа') + '</div></div>' +
      '<button class="btn btn-light" data-go="' + s.n + '">' + (lbl ? 'Изменить' : 'Ответить') + '</button></li>';
  }).join('');
  $('#final-main').innerHTML =
    '<section class="card">' +
      '<h1>Почти готово</h1>' +
      '<p>Проверьте, пожалуйста, ответы по экранам. Любой экран можно открыть и поправить.</p>' +
      '<ul class="review">' + rows + '</ul>' +
      (missing ? '<p class="status warn" style="margin-top:16px">Без ответа: ' + missing + ' ' + plural(missing, 'экран', 'экрана', 'экранов') + '. Можно ответить сейчас или отправить как есть.</p>' : '') +
      '<button class="btn btn-primary" id="send">Отправить ответы</button>' +
      '<div class="status" id="status" role="status"></div>' +
      '<button class="btn-link" id="back6">← Назад к экрану 6</button>' +
    '</section>';
  Array.prototype.forEach.call(document.querySelectorAll('[data-go]'), function (b) {
    b.onclick = function () { go(+b.getAttribute('data-go')); };
  });
  $('#back6').onclick = function () { go(6); };
  $('#send').onclick = onSend;
}

function onSend() {
  var btn = $('#send');
  btn.disabled = true; btn.textContent = 'Отправляю…';
  setStatus('Отправляю…', 'info');
  var data = buildData();
  var blobs = [];
  data.screens.forEach(function (s) {
    if (s.voice && VOICES[s.screen]) blobs.push({ screen: s.screen, places: s.places, file: s.voice.file, mime: s.voice.mime, blob: VOICES[s.screen] });
  });
  Promise.resolve().then(function () {
    if (typeof window.sendAnswers !== 'function') throw new Error('нет функции отправки');
    return window.sendAnswers(data, blobs);
  }).then(function (r) {
    if (r && r.ok === false) throw new Error(r.message || '');
    S.sentAt = data.submitted_at; S.sentMessage = (r && r.message) || 'Ответы сохранены';
    saveState();
    renderThanks(false);
  }).catch(function (e) {
    btn.disabled = false; btn.textContent = 'Отправить ещё раз';
    setStatus('Не получилось отправить' + (e && e.message ? ' (' + e.message + ')' : '') + '. Ваши ответы сохранены на этом устройстве — проверьте интернет и нажмите «Отправить ещё раз».', 'warn');
  });
}

function renderThanks(again) {
  $('#progress').hidden = true;
  $('#final-main').innerHTML =
    '<section class="card">' +
      '<p class="status ok" style="font-size:22px">✓ ' + esc(S.sentMessage || 'Ответы сохранены') + '</p>' +
      '<h1>Лариса Владимировна, спасибо!</h1>' +
      '<p>Ваши отметки получены. Мы добавим в урок указатели и увеличение, и ученики смогут шаг за шагом проследить путь кабеля — от ВРУ через коробку до розетки и вентилятора. Готовый фрагмент пришлём Вам на просмотр перед публикацией.</p>' +
      (again ? '<p class="note">Ответы уже отправлены. Если хотите что-то поправить — откройте экраны и отправьте ещё раз.</p>' : '') +
      '<button class="btn btn-light" id="edit">Посмотреть или изменить ответы</button>' +
    '</section>';
  $('#edit').onclick = function () { S.sentAt = null; saveState(); go(1); };
}

/* ---------- Запуск ---------- */
document.getElementById('version').textContent = 'Версия страницы: ' + PAGE_VERSION;
function redrawIfScreen() { if (ui.scr && S.cur >= 1 && S.cur <= 6) drawFrame(); }
window.addEventListener('resize', redrawIfScreen);
if (window.ResizeObserver) {          // рамка меняет размер, когда появляется синяя полоса-подсказка
  var RO = new ResizeObserver(function () { redrawIfScreen(); });
  var watchFrame = function () { var f = $('#frame'); if (f && !f._ro) { f._ro = true; RO.observe(f); } };
  new MutationObserver(watchFrame).observe(document.getElementById('app'), { childList: true });
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(redrawIfScreen);   // ширина табличек — по настоящему шрифту
window.addEventListener('beforeunload', function () { saveState(); });
idbLoadAll().then(render);
