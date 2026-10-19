/* Страница «Помогите уточнить схему» — Л. В. Махалова, урок 4 КНС 2026.
   Данные экранов взяты из cards.py (точки варианта A, раскладка кадра) и тексты_методиста.md. */
'use strict';

var PAGE_VERSION = '19.10.2026 15:30';
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
    quote: '«…чтобы из ВРУ мы пришли сюда и дошли до места установки розетки по запотолочному пространству и сделали опуск до розетки…»',
    ours: [[910, 705], [1128, 273], [1379, 252]], oursPlace: [1, 1, 1],
    line: [[910, 705], [920, 273], [1128, 273], [1379, 252]],   // изгиб по лотку — без номера
    view: [634.5, 110, 1020, 765] },
  { n: 2, places: [2], time: '28:47–29:03', frame: 's11', clips: [2], route: false,
    title: 'Где ответвление и где две розетки группы 18?',
    fixTitle: 'Покажите сами: ответвление и две розетки группы 18',
    steps: ['ответвление («сюда»)', 'первая «группа 18 здесь»', 'вторая «группа 18 здесь»'],
    quote: '«А дальше у нас идёт ответвление сюда. А у нас и здесь есть группа 18, и здесь есть группа 18…»',
    ours: [[1128, 273], [1096, 554], [1379, 506]], oursPlace: [2, 2, 2],
    view: [828.2, 110, 818.7, 614] },
  { n: 3, places: [3], time: '29:07–29:24', frame: 's11', clips: [3], route: true,
    title: 'Где Вы ставите коробку на ответвлении группы 18?',
    fixTitle: 'Покажите сами: где коробка на ответвлении группы 18',
    steps: ['где ВРУ', 'где ставим коробку', 'конец «длины, которую не считаем» (по желанию — мы не отметили)'],
    quote: '«Мы выходим из ВРУ, идём до первого ответвления на группу 18. Вот на это. Ставим здесь коробку…»',
    ours: [[910, 705], [1130, 290]], oursPlace: [3, 3],
    view: [516.7, 120, 1006.7, 755] },
  { n: 4, places: [4], time: '29:24–29:44', frame: 's11', clips: [4], route: true,
    title: 'Как один кабель идёт от коробки к двум розеткам?',
    fixTitle: 'Покажите сами: путь кабеля от коробки к двум розеткам',
    steps: ['коробка', 'первая розетка (опуск)', '«вот сюда» — куда прошли', 'вторая розетка (опуск)'],
    note: 'Если был поворот трассы — отметьте и его.',
    quote: '«Мы от этой коробки идём с вами, делаем сюда и делаем опуск к розетке. Потом… можем пройти вот сюда… Это будет всё один кабель…»',
    ours: [[1130, 290], [1096, 554], [1379, 522], [1379, 506]], oursPlace: [4, 4, 4, 4],
    view: [834.8, 120, 805.3, 604] },
  { n: 5, places: [5, 6], firstCount: 2, time: '31:00–31:18', frame: 'dr', clips: [5, 6], route: false,
    title: 'Откуда начинается группа 4, где вентилятор и выключатель?',
    fixTitle: 'Покажите сами: начало группы 4, вентилятор и выключатель',
    steps: ['ВРУ', '«вот здесь мы поставим»', 'вытяжной вентилятор', 'выключатель'],
    quote: '«Это всё одна группа… Но она начинает свой путь от ВРУ… Нам кроме вот этого вентилятора самого вытяжного надо подключить его управление… Вот этот выключатель.»',
    ours: [[617, 834], [760, 538], [808, 365], [747, 537]], oursPlace: [5, 5, 6, 6],
    view: [173.2, 195, 1078.7, 809] },
  { n: 6, places: [7, 8], firstCount: 1, time: '31:28–32:02', frame: 'dr', clips: [7, 8], route: true,
    title: 'Где коробка на помещения 4, 5, 6 и куда идёт кабель?',
    fixTitle: 'Покажите сами: коробка на помещения 4, 5, 6 и путь кабеля',
    steps: ['коробка на помещения 4, 5, 6', '«зайдём сюда»', 'коробка внутри помещения', 'выключатель', 'коробка с опуском к вентилятору'],
    note: 'Если вентилятора на чертеже не видно — отметьте коробку и расскажите голосом.',
    quote: '«Вот здесь мы поставим с вами распределительную коробку, чтобы пошло питание на 4, 5 и 6 помещение. А от этой коробки мы уже зайдём сюда… поставили коробку внутри, ответвление сделали к выключателю…»',
    ours: [[821, 565], [947, 507], [956, 488], [922, 502], [925, 365]], oursPlace: [7, 8, 8, 8, 8],
    view: [528.5, 195, 720, 540] }
];

/* ---------- Хранение ---------- */
var S = loadState();
var VOICES = {};          // номер экрана → Blob
var ui = { fix: false, view: null, scr: null };
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
  if (S.cur >= 1 && S.cur <= 6) { prog.hidden = false; prog.textContent = 'Экран ' + S.cur + ' из 6'; }
  else { prog.hidden = true; }
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
        '<li><span class="num">2</span><span>Посмотрите на схему: жёлтыми кружками с номерами мы отметили, как поняли Ваши слова. Если верно — нажмите «Да, так».</span></li>' +
        '<li><span class="num">3</span><span>Если не так — «Нет — исправлю»: нажмите на схеме по порядку нужные места или расскажите голосом.</span></li>' +
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

function stepsOursHTML(scr) {
  return '<ol class="steps">' + scr.steps.map(function (s, i) {
    return '<li><span class="num num-ours">' + (i + 1) + '</span><span>' + esc(s) + '</span></li>';
  }).join('') + '</ol>';
}
function stepsFixHTML(scr, a) {
  var n = a.points.length;
  var html = '<ol class="steps">' + scr.steps.map(function (s, i) {
    if (i < n) return '<li class="done"><span class="num num-done">✓</span><span>' + esc(s) + '</span></li>';
    if (i === n) return '<li class="now"><span class="num num-now">' + (i + 1) + '</span><span>' + esc(s) + ' <span class="now-mark">← сейчас</span></span></li>';
    return '<li class="wait"><span class="num num-wait">' + (i + 1) + '</span><span>' + esc(s) + '</span></li>';
  }).join('') + '</ol>';
  if (n > scr.steps.length) html += '<div class="step-note">Дополнительных точек: ' + (n - scr.steps.length) + '</div>';
  else if (n === scr.steps.length) html += '<div class="step-note">Все шаги отмечены. Можно добавить точку (например, поворот трассы) или нажать «Сохранить и дальше».</div>';
  if (scr.note) html += '<div class="step-note">' + esc(scr.note) + '</div>';
  return html;
}

function renderScreen(app, scr) {
  var a = ans(scr.n);
  ui.scr = scr;
  ui.fix = (a.mode === 'own');
  ui.view = { x: scr.view[0], y: scr.view[1], w: scr.view[2], h: scr.view[3] };

  app.innerHTML =
    '<section class="screen">' +
      '<div class="left">' +
        '<div class="frag">Фрагмент ' + scr.time + '</div>' +
        '<h1 id="title"></h1>' +
        '<button class="btn listen" id="listen">▶ Послушать свой фрагмент</button>' +
        '<div class="player" id="player" hidden><video id="video" playsinline controls preload="none"></video>' +
          '<div class="part" id="part"></div><p class="quote">' + esc(scr.quote) + '</p></div>' +
        '<div id="panel"></div>' +
        '<div class="status" id="status" role="status"></div>' +
      '</div>' +
      '<div class="right">' +
        '<div class="frame-wrap">' +
          '<div class="frame" id="frame">' +
            '<svg id="svg" viewBox="0 0 1920 1080" preserveAspectRatio="none" aria-label="Кадр урока со схемой">' +
              '<image href="' + FRAMES[scr.frame].src + '" x="0" y="0" width="1920" height="1080"/>' +
              '<g id="marks"></g>' +
            '</svg>' +
          '</div>' +
          '<div class="frame-hint" id="fhint" hidden></div>' +
        '</div>' +
        '<div class="zoom-row">' +
          '<button class="btn btn-light" id="zin" aria-label="Увеличить схему">+ Крупнее</button>' +
          '<button class="btn btn-light" id="zout" aria-label="Уменьшить схему">− Мельче</button>' +
          '<button class="btn btn-light" id="zreset">Как было</button>' +
        '</div>' +
        '<p class="caption" id="caption"></p>' +
      '</div>' +
    '</section>' +
    '<nav class="nav">' +
      '<button class="btn btn-light" id="back">← Назад</button>' +
      '<button class="btn btn-light" id="next">' + (scr.n === 6 ? 'К отправке →' : 'Дальше →') + '</button>' +
    '</nav>';

  $('#back').onclick = function () { go(S.cur - 1); };
  $('#next').onclick = function () { go(S.cur + 1); };
  $('#listen').onclick = function () { togglePlayer(scr); };
  $('#zin').onclick = function () { zoomBy(1.4); };
  $('#zout').onclick = function () { zoomBy(1 / 1.4); };
  $('#zreset').onclick = function () { ui.view = { x: scr.view[0], y: scr.view[1], w: scr.view[2], h: scr.view[3] }; drawFrame(); };
  bindFrame();
  renderPanel();
  var lbl = answerLabel(scr.n);
  if (lbl) setStatus(lbl + ' — ответ сохранён', 'ok');
}

function renderPanel() {
  var scr = ui.scr, a = ans(scr.n), panel = $('#panel');
  $('#title').textContent = ui.fix ? (a.approx ? 'Отметьте примерно, как помните' : scr.fixTitle) : scr.title;
  $('#frame').classList.toggle('fix', ui.fix);
  $('#caption').textContent = ui.fix
    ? 'Зелёные точки — Ваши отметки. Схему можно увеличить кнопками, колёсиком мыши или двумя пальцами.'
    : 'Жёлтые кружки с номерами — наше предположение. Схему можно увеличить кнопками «Крупнее» / «Мельче».';

  if (!ui.fix) {
    var chosen = a.mode;
    panel.innerHTML =
      '<div class="left" style="gap:14px">' +
        '<h2>Мы предполагаем так. Верно?</h2>' + stepsOursHTML(scr) +
        '<button class="btn btn-yes' + (chosen === 'ours' ? ' chosen' : '') + '" id="yes">' + (chosen === 'ours' ? '✓ Да, так — выбрано' : 'Да, так') + '</button>' +
        '<button class="btn btn-no" id="no">Нет — исправлю (точки или голос)</button>' +
        '<div class="alt">' +
          '<button class="btn btn-light" id="approx">Не помню точно — отмечу примерно</button>' +
          '<button class="btn btn-light' + (chosen === 'skip' ? ' chosen-alt' : '') + '" id="skip">' + (chosen === 'skip' ? '✓ Здесь указатель не нужен' : 'Здесь указатель не нужен') + '</button>' +
        '</div>' +
        (S.answers[scr.n] && S.answers[scr.n].mode === null && hasOwnDraft(scr.n) ? '<button class="btn-link" id="mine">Показать мои отметки</button>' : '') +
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
      '<div class="left" style="gap:14px">' +
        '<h2>' + (a.approx ? 'Нажмите на схеме по порядку — можно примерно:' : 'Нажмите на схеме по порядку:') + '</h2>' +
        '<div id="steps">' + stepsFixHTML(scr, a) + '</div>' +
        '<div class="row2">' +
          '<button class="btn btn-light" id="undo">↶ Убрать точку</button>' +
          '<button class="btn btn-light" id="reset">Начать заново</button>' +
        '</div>' +
        '<h2>Или расскажите голосом:</h2>' +
        '<div id="voice"></div>' +
        '<label class="text-label" for="text">Или напишите словами:</label>' +
        '<textarea id="text" placeholder="Например: коробка не здесь, а у двери в помещение 3"></textarea>' +
        '<button class="btn btn-primary" id="savefix">Сохранить и дальше →</button>' +
        '<button class="btn-link" id="toours">← Вернуться к нашему варианту</button>' +
      '</div>';
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
      ui.fix = false; renderPanel(); drawFrame();
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
  renderPanel();
  setStatus(approx ? 'Отметьте места примерно — точность не важна, важен порядок.' : 'Нажмите на схеме первое место.', 'info');
}
function refreshFix() {
  var st = $('#steps'); if (st) st.innerHTML = stepsFixHTML(ui.scr, ans(ui.scr.n));
  drawFrame();
}

/* ---------- Кадр: точки, маршрут, увеличение ---------- */
function drawFrame() {
  var svg = $('#svg'); if (!svg) return;
  var v = ui.view, scr = ui.scr, a = ans(scr.n);
  svg.setAttribute('viewBox', v.x + ' ' + v.y + ' ' + v.w + ' ' + v.h);
  var wpx = svg.clientWidth || 1000;
  var u = v.w / wpx;                                 // единиц кадра на 1 пиксель экрана
  var base = clamp(wpx / 1040, 0.9, 1);              // размер значков как в макете, меньше на телефоне
  var g = '';
  var pts, i;
  if (!ui.fix) {
    pts = scr.ours;
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
      g += '<circle cx="' + x + '" cy="' + y + '" r="' + (30 * base * u) + '" fill="#FFE600" fill-opacity=".6" stroke="#FF6A00" stroke-width="' + (6 * base * u) + '"/>' +
           '<circle cx="' + x + '" cy="' + y + '" r="' + (17 * base * u) + '" fill="#FF2D55" stroke="#fff" stroke-width="' + (3 * base * u) + '"/>' +
           '<text x="' + x + '" y="' + y + '" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-weight="700" font-size="' + (20 * base * u) + '" fill="#fff">' + (i + 1) + '</text>';
    }
  } else {
    pts = a.points;
    if (scr.route && pts.length > 1) {
      g += '<polyline points="' + pts.map(function (p) { return p.x + ',' + p.y; }).join(' ') + '" fill="none" stroke="#2EA05A" stroke-opacity=".9" stroke-width="' + (8 * base * u) + '" stroke-linejoin="round" stroke-linecap="round"/>';
    }
    for (i = 0; i < pts.length; i++) {
      var p = pts[i];
      g += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (26 * base * u) + '" fill="#2EA05A" stroke="#fff" stroke-width="' + (4 * base * u) + '"/>' +
           '<text x="' + p.x + '" y="' + p.y + '" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-weight="700" font-size="' + (22 * base * u) + '" fill="#fff">' + (i + 1) + '</text>';
    }
  }
  $('#marks').innerHTML = g;

  var hint = $('#fhint');
  if (ui.fix) {
    var n = a.points.length;
    hint.hidden = false;
    if (n < scr.steps.length) {
      hint.className = 'frame-hint';
      hint.textContent = 'Нажмите на схеме — точка ' + (n + 1) + ': ' + scr.steps[n];
    } else {
      hint.className = 'frame-hint done';
      hint.textContent = '✓ Все точки отмечены';
    }
  } else hint.hidden = true;
}

function setView(w, cx, cy, rx, ry) {
  // w — новая ширина окна; (cx, cy) — точка кадра, которая должна оказаться в доле (rx, ry) окна
  w = clamp(w, MIN_W, MAX_W);
  var h = w * 3 / 4;
  var x = clamp(cx - rx * w, 0, FW - w);
  var y = clamp(cy - ry * h, 0, FH - h);
  ui.view = { x: x, y: y, w: w, h: h };
  drawFrame();
}
function zoomBy(f) {
  var v = ui.view;
  setView(v.w / f, v.x + v.w / 2, v.y + v.h / 2, 0.5, 0.5);
}
function clientToFrame(cx, cy) {
  var r = $('#svg').getBoundingClientRect(), v = ui.view;
  var rx = (cx - r.left) / r.width, ry = (cy - r.top) / r.height;
  return { x: v.x + rx * v.w, y: v.y + ry * v.h, rx: rx, ry: ry };
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
      gesture = { type: 'tap', x0: e.clientX, y0: e.clientY, view0: Object.assign({}, ui.view) };
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
      setView(gesture.view0.w / (d / gesture.d0), gesture.m0.x, gesture.m0.y, (mx - r.left) / r.width, (my - r.top) / r.height);
    } else if (gesture.type === 'tap' || gesture.type === 'pan') {
      var dx = e.clientX - gesture.x0, dy = e.clientY - gesture.y0;
      if (gesture.type === 'tap' && Math.hypot(dx, dy) > 8) gesture.type = 'pan';
      if (gesture.type === 'pan') {
        var v0 = gesture.view0, k = v0.w / r.width;
        ui.view = { x: clamp(v0.x - dx * k, 0, FW - v0.w), y: clamp(v0.y - dy * k, 0, FH - v0.h), w: v0.w, h: v0.h };
        drawFrame();
      }
    }
  });
  function end(e) {
    if (!ptrs[e.pointerId]) return;
    if (e.type === 'pointerup' && gesture && gesture.type === 'tap' && count() === 1 && ui.fix) {
      var f = clientToFrame(e.clientX, e.clientY);
      if (f.rx >= 0 && f.rx <= 1 && f.ry >= 0 && f.ry <= 1) addPoint(f.x, f.y);
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
    setView(ui.view.w / Math.exp(-e.deltaY * 0.0015), f.x, f.y, f.rx, f.ry);
  }, { passive: false });
}

function addPoint(fx, fy) {
  var scr = ui.scr, a = ans(scr.n);
  var x = Math.round(clamp(fx, 0, FW - 1)), y = Math.round(clamp(fy, 0, FH - 1));
  var svgEl = $('#svg'), upx = ui.view.w / ((svgEl && svgEl.clientWidth) || 1000);   // единиц кадра на 1 пиксель экрана
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

/* ---------- Прослушивание фрагмента ---------- */
function togglePlayer(scr) {
  var box = $('#player'), btn = $('#listen'), video = $('#video');
  if (player) { stopPlayer(); return; }
  if (REC) stopRec();
  box.hidden = false;
  player = { i: 0 };
  btn.textContent = '■ Остановить';
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
    else { player = null; btn.textContent = '▶ Послушать ещё раз'; }
  };
  video.onerror = function () { $('#part').textContent = 'Видео не загрузилось. Проверьте интернет и нажмите «Послушать» ещё раз.'; };
  playPart();
}
function stopPlayer() {
  var video = $('#video');
  if (video) { try { video.pause(); } catch (e) {} }
  if (player) { player = null; var b = $('#listen'); if (b) b.textContent = '▶ Послушать ещё раз'; }
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
    html = '<div class="voice-ready"><div class="vtitle">✓ Голос сохранён' + (a.voice && a.voice.dur ? ' (' + fmtTime(a.voice.dur) + ')' : '') + '</div>' +
           '<audio id="vaudio" controls preload="metadata"></audio>' +
           '<div class="row2"><button class="btn btn-light" id="vplay">▶ Прослушать</button><button class="btn btn-light" id="rerec">Перезаписать</button></div></div>';
  } else {
    html = '<button class="rec" id="recbtn" aria-label="Записать голосом"><span class="dot"></span><span>Записать голосом</span></button>';
  }
  if (hintHTML) html += '<div class="mic-hint" style="margin-top:10px">' + hintHTML + '</div>';
  box.innerHTML = html;
  var rb = $('#recbtn');
  if (rb) rb.onclick = function () { if (REC) stopRec(); else startRec(k); };
  var au = $('#vaudio');
  if (blob && au) {
    au.src = URL.createObjectURL(blob);
    $('#vplay').onclick = function () { stopPlayer(); au.currentTime = 0; var p = au.play(); if (p && p.catch) p.catch(function () {}); };
    $('#rerec').onclick = function () { au.pause(); startRec(k); };
  }
}
function micFail(kind) {
  var msg = kind === 'NotAllowedError' || kind === 'SecurityError'
    ? 'Браузер не дал доступ к микрофону. Его можно разрешить в настройках браузера (значок замка или «аА» рядом с адресом) — или просто напишите словами в поле ниже, этого достаточно.'
    : 'Микрофон на этом устройстве недоступен. Ничего страшного — напишите, пожалуйста, словами в поле ниже.';
  renderVoice(esc(msg));
  setStatus('Запись голосом сейчас недоступна — можно написать текстом.', 'warn');
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
window.addEventListener('resize', function () { if (ui.scr && S.cur >= 1 && S.cur <= 6) drawFrame(); });
window.addEventListener('beforeunload', function () { saveState(); });
idbLoadAll().then(render);
