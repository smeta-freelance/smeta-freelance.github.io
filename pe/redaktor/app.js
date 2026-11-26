// Редактор презентаций Академии Сметного Дела — экраны и правка. Логика — в core/ (покрыта тестами).
import { TEMPLATES, LAYER1, CARD, newSlide, fontStep, moveBlock, resetBlock, setStyle, MIN_BLOCK } from './core/model.mjs';
import { slidesFromQA, qaWarnings } from './core/qa.mjs';
import { createHistory } from './core/history.mjs';
import { newPresentation, toFile, fromFile } from './core/store.mjs';
import { allPres, getPres, putPres, delPres } from './core/db.mjs';
import { scaled, slideHTML, esc, setSrcResolver } from './core/render.mjs';
import { plainText, padOf } from './core/pptx_map.mjs';
import { exportPptx, exportPdf } from './core/export.mjs';
import { uid } from './core/model.mjs';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');
const S = { screen: 'list', pres: null, cur: 0, sel: null, editing: null, crop: null, sheet: false, show: null, saving: false, saveError: '', over: false, lastWrite: null };
let hist = null, saveTimer = null;

// ---------- фото: хранятся в презентации отдельно (assets), экран берёт быстрый адрес Blob ----------
const blobCache = new Map();
setSrcResolver(src => {
  if (!src.startsWith('asset:')) return src;
  const id = src.slice(6);
  if (blobCache.has(id)) return blobCache.get(id);
  const data = S.pres?.assets?.[id];
  if (!data) return '';
  const [head, b64] = data.split(',');
  const bin = atob(b64), arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([arr], { type: head.slice(5, head.indexOf(';')) }));
  blobCache.set(id, url);
  return url;
});
// Снимок для «Отменить» — без фото (фото не копируются на каждый шаг).
const snap = p => { const { assets, ...rest } = p; return rest; };
const restore = st => ({ ...st, assets: S.pres.assets || {} });

// ---------- общее ----------
const fmtDate = iso => { const d = new Date(iso); const p = n => String(n).padStart(2, '0'); return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}<br>${p(d.getHours())}:${p(d.getMinutes())}`; };
const wordsWord = n => n % 10 === 1 && n % 100 !== 11 ? 'слово' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'слова' : 'слов';
const slidesWord = n => n % 10 === 1 && n % 100 !== 11 ? 'слайд' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'слайда' : 'слайдов';
function toast(msg, ms = 2600) { $$('.toast').forEach(t => t.remove()); const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), ms); }
const slide = () => S.pres.slides[S.cur];
const block = id => slide()?.blocks.find(b => b.id === (id ?? S.sel));

function scheduleSave() {
  if (S.saveError) return;
  S.saving = true; setSavedLabel();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 400);
}
async function saveNow() {
  clearTimeout(saveTimer);
  if (!S.pres || S.saveError) return;
  try {
    // Защита от двух вкладок: если презентацию уже изменили в другой вкладке — не перетираем.
    const cur = await getPres(S.pres.id);
    if (cur && S.lastWrite && cur.updated !== S.lastWrite && cur.updated > S.lastWrite) {
      S.saveError = 'Эта презентация изменена в другой вкладке. Закройте одну из вкладок и откройте презентацию заново.';
      toast(S.saveError, 8000);
    } else {
      await putPres(S.pres);
      S.lastWrite = S.pres.updated;
    }
  } catch (e) {
    S.saveError = 'Не сохранилось в браузере — нажмите «На компьютер», чтобы не потерять работу.';
    toast(S.saveError, 8000);
  }
  S.saving = false; setSavedLabel();
}
function setSavedLabel() {
  const el = $('#saved'); if (!el) return;
  el.textContent = S.saveError ? '⚠ Не сохранено' : S.saving ? 'Сохраняю…' : '✓ Сохранено';
  el.title = S.saveError || '';
  el.classList.toggle('busy', S.saving);
  el.classList.toggle('err', !!S.saveError);
}
// Закрыли вкладку или ушли в другое окно — сохраняем сразу, вместе с набираемым текстом.
const saveOnLeave = () => { if (S.screen === 'edit' && S.pres) { flushEdit(true); S.pres.updated = new Date().toISOString(); saveNow(); } };
addEventListener('pagehide', saveOnLeave);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveOnLeave(); });
navigator.storage?.persist?.().catch(() => {});

// Каждое действие: перерисовать → дорастить блоки по тексту → снимок для «Отменить» → сохранить.
function commit() {
  S.pres.updated = new Date().toISOString();
  renderEditor();
  if (layout()) renderEditor();
  hist.push(snap(S.pres));
  scheduleSave();
}
// Текст не режем: не помещается — блок растёт вниз, а блок под ним сдвигается. Упёрся в край — красная рамка и подсказка.
function layout() {
  let changed = false;
  const blocks = (slide()?.blocks || []).slice().sort((a, b) => a.y - b.y);
  const bottom = CARD.y + CARD.h;
  for (const b of blocks) {
    if (b.type !== 'text') continue;
    const el = $(`.canvas .tb[data-id="${b.id}"]`);
    if (!el) continue;
    const need = Math.ceil(el.scrollHeight);
    if (need > b.h + 1) {
      const old = b.y + b.h;
      b.h = Math.min(need, bottom - b.y); changed = true;
      const delta = b.y + b.h - old;
      for (const o of blocks) {           // соседи ниже, которые теперь задеты, — вниз на ту же величину
        if (o === b || o.y < old - 1 || o.x >= b.x + b.w || o.x + o.w <= b.x) continue;
        if (o.y < b.y + b.h + 16) { o.y = Math.min(o.y + delta, bottom - o.h); changed = true; }
      }
    }
  }
  return changed;
}
function markOverflow() {
  S.over = false;
  for (const b of slide()?.blocks || []) {
    if (b.type !== 'text' || !b.text) continue;
    const el = $(`.canvas .tb[data-id="${b.id}"]`);
    if (!el) continue;
    const others = slide().blocks.filter(o => o !== b && o.x < b.x + b.w && o.x + o.w > b.x && o.y < b.y + b.h && o.y + o.h > b.y);
    if (el.scrollHeight > b.h + 2 || others.length) { el.classList.add('over'); S.over = true; }
  }
  const st = $('#overMsg'); if (st) st.hidden = !S.over;
}

// ---------- 1. Мои презентации ----------
async function renderList() {
  S.screen = 'list';
  const list = (await allPres()).sort((a, b) => b.updated.localeCompare(a.updated));
  app.innerHTML = `<div class="app">
    <div class="bar"><img src="assets/logo.svg" height="26" alt="Академия Сметного Дела"><div class="t" style="margin-left:6px">Презентации</div><div class="sp"></div>
      <button class="btn ghost" id="openFile">Открыть файл</button><button class="btn main" id="create">+ Создать презентацию</button></div>
    <div class="list"><div class="note">Презентации хранятся в этом браузере на этом компьютере. Чтобы не потерять работу или открыть её на другом компьютере — в редакторе нажмите «На компьютер».</div>${list.length ? list.map(p => `
      <div class="row" data-id="${p.id}"><div class="d">${fmtDate(p.updated)}</div>
        ${p.slides[0] ? scaled(p.slides[0], 104, { edit: true }) : '<div class="sw" style="width:104px;height:58px;background:#E8EDF7"></div>'}
        <div class="n">${esc(p.title)}<small>${p.slides.length} ${slidesWord(p.slides.length)}</small></div>
        <div class="w">${esc(p.author || '')}</div>
        <button class="btn">Открыть</button><button class="btn ghost danger del" data-del="${p.id}">Удалить</button></div>`).join('')
      : `<div class="empty-list"><b>Презентаций пока нет</b>Нажмите «+ Создать презентацию» — вставьте вопросы и ответы<br>или начните с чистого листа.</div>`}</div></div>`;
  $('#create').onclick = renderQA;
  $('#openFile').onclick = () => $('#fileOpen').click();
  $$('.row').forEach(r => r.onclick = async e => {
    const del = e.target.closest('[data-del]');
    if (del) {
      e.stopPropagation();
      const p = list.find(x => x.id === del.dataset.del);
      if (confirm(`Удалить презентацию «${p.title}»? Восстановить её будет нельзя — если нужна копия, сначала откройте её и нажмите «На компьютер».`)) { await delPres(p.id); renderList(); }
      return;
    }
    openEditor(await getPres(r.dataset.id));
  });
}
// Файл из «Открыть файл» приводим к полному виду: у каждого блока есть «родное» место, у фото — обрезка.
function normalize(p) {
  p.assets ||= {};
  for (const s of p.slides || []) for (const b of s.blocks || []) {
    b.id ||= uid('b');
    b.home ||= { x: b.x, y: b.y, w: b.w, h: b.h };
    if (b.type === 'photo') b.crop ||= { cx: 0.5, cy: 0.5, zoom: 1 };
    if (b.type === 'text' && typeof b.text !== 'string') b.text = String(b.text ?? '');
  }
  return p;
}
$('#fileOpen').onchange = async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {
    const p = normalize(fromFile(await f.text()));
    p.id = uid('p'); p.updated = new Date().toISOString();
    await putPres(p); openEditor(p); toast('Презентация открыта из файла');
  } catch (err) { toast(err.message, 4000); }
};

// ---------- 2. Вопрос — ответ ----------
function renderQA() {
  S.screen = 'qa';
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const d = new Date();
  app.innerHTML = `<div class="app">
    <div class="bar"><button class="btn" id="back">← Презентации</button><div class="t">Новая презентация</div><div class="sp"></div>
      <button class="btn ghost" id="blank">Начать с чистого листа</button><button class="btn main" id="go" disabled>Открыть в редакторе →</button></div>
    <div class="qa">
      <div class="paste">
        <div class="hd"><label>Название <input id="ttl" value="Мастер-майнд" title="Это название будет на титульном слайде"></label>
          <label>Кто делает <input id="who" class="who" value="${esc(localStorage.getItem('asd-author') || '')}" placeholder="Имя"></label></div>
        <textarea id="src" spellcheck="false" placeholder="Вставьте вопросы и ответы.&#10;&#10;Вопрос (Имя участника): …&#10;Тема: … (по желанию)&#10;Ответ: …&#10;Главное: 1500 руб. — Доставка в КП (по желанию)&#10;&#10;Вопрос: …&#10;Ответ: …"></textarea>
        <div class="tip">Порядок: титул → содержание → вопрос-ответ по шагам → выводы → прощание. Вопрос — <b>Вопрос:</b> или <b>Вопрос (Имя):</b>, под ним по желанию <b>Тема:</b>. Ответ — <b>Ответ:</b>; делится на начало, обоснование, выводы по абзацам или пометкам <b>Начало: Обоснование: Выводы:</b>. Под ответом по желанию <b>Главное:</b> — строки «значение — подпись». Текст переносится без изменений.</div>
      </div>
      <div class="prev"><div class="hd" id="cnt">Слайды появятся здесь</div><div class="found" id="found"></div><div id="warn"></div><div class="grid" id="pv"></div></div>
    </div></div>`;
  let slides = [], raf = 0;
  const upd = () => {
    slides = slidesFromQA($('#src').value, { title: $('#ttl').value });
    $('#cnt').innerHTML = slides.length ? `Получится ${slides.length} ${slidesWord(slides.length)} <span class="ok">✓ собрано</span>` : 'Слайды появятся здесь';
    const w = Math.floor(($('#pv').clientWidth - 10) / 2);
    $('#pv').innerHTML = slides.map((s, i) => `<div class="it">${i + 1} · ${esc(({ mmtitle: 'Титул', mmlist: 'Содержание', mmsum: 'Выводы', mmend: 'Прощание' })[s.tpl] || (s.meta ? `Вопрос ${s.meta.qnum} · ${s.meta.part}` : s.label || ''))}${scaled(s, w, { num: i + 1 })}</div>`).join('');
    $('#go').disabled = !slides.length;
    // Что нашлось: вопросы по порядку — чтобы сразу видеть, не слиплось ли что-нибудь
    const qs = slides.filter(s => s.tpl === 'mmpart' || s.tpl === 'question').reduce((m, s) => (m.set(s.meta?.qnum ?? s.label, s), m), new Map());
    $('#found').textContent = qs.size ? `Нашёл ${qs.size} ${qs.size === 1 ? 'вопрос' : qs.size < 5 ? 'вопроса' : 'вопросов'}` : '';
    const warns = qaWarnings($('#src').value);
    $('#warn').innerHTML = warns.map(w => `<div class="warn">В ответе на вопрос ${w.after} есть строка с «?»: «${esc(w.text.slice(0, 90))}${w.text.length > 90 ? '…' : ''}». Это отдельный вопрос? <button class="btn" data-line="${w.line}">Сделать отдельным вопросом</button></div>`).join('');
    $$('#warn [data-line]').forEach(btn => btn.onclick = () => {
      const lines = $('#src').value.split('\n');
      lines[+btn.dataset.line] = 'Вопрос: ' + lines[+btn.dataset.line].replace(/^\s+/, '');
      $('#src').value = lines.join('\n'); upd();
    });
  };
  const later = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(upd); };
  $('#src').oninput = later; $('#ttl').oninput = later;
  $('#src').focus();
  $('#back').onclick = renderList;
  const make = async list => {
    const who = $('#who').value.trim();
    localStorage.setItem('asd-author', who);
    const name = $('#ttl').value.trim() || 'Мастер-майнд';
    const p = newPresentation(name === 'Мастер-майнд' ? `Мастер-майнд ${d.getDate()} ${months[d.getMonth()]}` : name, who || 'Команда');
    p.assets = {};
    p.slides = list;
    await putPres(p);
    openEditor(p);
  };
  $('#go').onclick = () => slides.length && make(slides);
  $('#blank').onclick = () => { const s = newSlide('title'); s.blocks[0].text = $('#ttl').value.trim(); make([s]); };
}

// ---------- 3. Редактор ----------
function openEditor(p) {
  S.pres = normalize(p); S.cur = 0; S.sel = null; S.editing = null; S.crop = null; S.sheet = false; S.saveError = ''; S.lastWrite = p.updated;
  hist = createHistory(snap(S.pres));
  if (history.state?.screen !== 'edit') history.pushState({ screen: 'edit' }, '');
  S.screen = 'edit';
  renderEditor();
}

// Набранный текст + запомненные «Главное» → текст блока. Слова, которые человек стёр, просто теряют маркер.
// Маркер ставится на ближайшее к прежнему месту вхождение слов, а не на первое попавшееся.
function withMarks(plain) {
  const ranges = [];
  for (const m of (S.marks || []).slice().sort((a, b) => a.pos - b.pos)) {
    if (!m.t) continue;
    let best = -1;
    for (let i = plain.indexOf(m.t); i >= 0; i = plain.indexOf(m.t, i + 1)) {
      if (ranges.some(r => i < r[1] && i + m.t.length > r[0])) continue;
      if (best < 0 || Math.abs(i - m.pos) < Math.abs(best - m.pos)) best = i;
    }
    if (best >= 0) ranges.push([best, best + m.t.length]);
  }
  ranges.sort((a, b) => b[0] - a[0]);
  let out = plain;
  for (const [a, b] of ranges) out = out.slice(0, a) + '[[' + out.slice(a, b) + ']]' + out.slice(b);
  return out;
}
const marksOf = text => { let shift = 0; return [...text.matchAll(/\[\[([\s\S]*?)\]\]/g)].map(m => { const r = { t: m[1], pos: m.index - shift }; shift += 4; return r; }); };

// Если во время набора что-то перерисовывает экран — набранный текст не теряем.
function flushEdit(keepEditing = false) {
  const ta = $('#canvas textarea.ed');
  let changed = false;
  if (ta && S.editing) { const b = S.pres.slides.flatMap(x => x.blocks).find(x => x.id === S.editing); const v = withMarks(ta.value); if (b && b.text !== v) { b.text = v; changed = true; } if (!keepEditing) ta.onblur = null; }
  if (!keepEditing) S.editing = null;
  return changed;
}

function renderEditor() {
  if (S.screen !== 'edit') return;
  if (flushEdit()) { S.pres.updated = new Date().toISOString(); hist.push(snap(S.pres)); scheduleSave(); }
  const p = S.pres;
  if (S.cur >= p.slides.length) S.cur = Math.max(0, p.slides.length - 1);
  const b = block();
  const isText = b?.type === 'text';
  const words = (slide()?.blocks || []).filter(x => x.type === 'text').map(x => plainText(x.text)).join(' ').split(/\s+/).filter(Boolean).length;
  const moved = b && (b.x !== b.home.x || b.y !== b.home.y || b.w !== b.home.w || b.h !== b.home.h);
  app.innerHTML = `<div class="app edit">
    <div class="bar"><button class="btn" id="back">← Презентации</button><input class="t" id="title" value="${esc(p.title)}"><span class="ok" id="saved"></span><div class="sp"></div>
      <button class="btn sq" id="undo" title="Отменить (⌘Z)" aria-label="Отменить" ${hist.canUndo() ? '' : 'disabled'}>↶</button><button class="btn sq" id="redo" title="Вернуть (⇧⌘Z)" aria-label="Вернуть" ${hist.canRedo() ? '' : 'disabled'}>↷</button>
      <button class="btn" id="saveFile" title="Сохранить копию презентации на компьютер — её можно открыть на другом компьютере кнопкой «Открыть файл»">На компьютер</button><button class="btn" id="play" title="Показ с первого слайда" ${p.slides.length ? '' : 'disabled'}>▶ Показать</button><button class="btn" id="pdf" ${p.slides.length ? '' : 'disabled'}>PDF</button>
      <button class="btn main" id="pptx" ${p.slides.length ? '' : 'disabled'}>Скачать PowerPoint</button></div>
    <div class="ed">
      <div class="film">${p.slides.map((s, i) => `<div class="f${i === S.cur ? ' cur' : ''}" data-i="${i}">${i + 1}${scaled(s, 94, { edit: true, num: i + 1 })}<button class="x" data-delslide="${i}" title="Удалить слайд">✕</button></div>`).join('')}
        <button class="add" id="addSlide">+ Слайд</button></div>
      <div class="stage">
        <div class="tool">${b ? `
          <span class="lab">Размер</span><button class="btn" id="fminus" ${isText ? '' : 'disabled'}>A−</button><div class="v${isText ? '' : ' off'}">${isText ? b.size : '—'}</div><button class="btn" id="fplus" ${isText ? '' : 'disabled'}>A+</button><i class="s"></i>
          <div class="seg"><button data-w="normal" ${isText ? '' : 'disabled'} class="${isText && b.weight === 'normal' ? 'on' : ''}">Обычный</button><button data-w="bold" ${isText ? '' : 'disabled'} class="${isText && b.weight === 'bold' ? 'on' : ''}">Жирный</button></div><i class="s"></i>
          <button class="btn" id="mark" title="Выделить главное: отметьте слова в тексте и нажмите" ${isText ? '' : 'disabled'}><span class="mk">Выделить</span></button><i class="s"></i>
          <div class="seg">${[['left', 'Слева'], ['center', 'Центр'], ['right', 'Справа']].map(([v, l]) => `<button data-a="${v}" ${isText ? '' : 'disabled'} class="${isText && b.align === v ? 'on' : ''}">${l}</button>`).join('')}</div>
          <div class="sp"></div><button class="btn" id="photoBtn" title="Поставить фото на этот слайд">Фото</button><button class="btn danger" id="delBlock">Удалить блок</button>`
          : `<span class="hint">Щёлкните текст на слайде, чтобы изменить его</span><div class="sp"></div><button class="btn" id="photoBtn" title="Поставить фото на этот слайд">Фото</button>`}
        </div>
        <div class="canvas" id="canvas"></div>
        <div class="status"><span>${p.slides.length ? `Слайд ${S.cur + 1} из ${p.slides.length} · ${words} ${wordsWord(words)}` : 'Слайдов нет — нажмите «+ Слайд»'}</span><span class="overmsg" id="overMsg" hidden>Текст не помещается — нажмите A− или сократите</span><span class="sp"></span>${moved ? '<button id="reset">Вернуть блок на место</button>' : ''}</div>
      </div>
    </div>${S.sheet ? sheetHTML() : ''}</div>`;
  setSavedLabel();
  drawCanvas();
  bindEditor();
  markOverflow();
}

function drawCanvas() {
  const c = $('#canvas'), s = slide();
  if (!c || !s) return;
  const w = Math.floor(Math.min(c.clientWidth, c.clientHeight * 16 / 9));
  c.innerHTML = scaled(s, w, { edit: true, selId: S.sel, editingId: S.editing, cropId: S.crop, num: S.cur + 1 });
  const b = block();
  if (b?.type === 'photo') {
    const k = w / 1920;
    const tools = document.createElement('div');
    tools.className = 'photo-tools';
    tools.style.right = ((1920 - b.x - b.w) * k + 14) + 'px';
    tools.style.bottom = ((1080 - b.y - b.h) * k + 14) + 'px';
    tools.innerHTML = S.crop === b.id
      ? `<button class="btn" data-z="-1">− Мельче</button><button class="btn" data-z="1">+ Крупнее</button><button class="btn main" id="cropDone">Готово</button>`
      : `<button class="btn" id="pickPhoto">${b.src ? 'Заменить фото' : 'Выбрать фото'}</button>${b.src ? '<button class="btn" id="cropStart">Обрезать</button>' : ''}`;
    $('.sw', c).appendChild(tools);
  }
}

const sheetHTML = () => `<div class="dim" id="dim"></div><div class="sheet"><div class="hd">Какой слайд добавить?<span class="sp"></span><button class="btn" id="closeSheet">Закрыть</button></div>
  <div class="grid">${LAYER1.map(t => `<div class="it" data-tpl="${t}">${scaled(newSlide(t), 240, { edit: true })}<b>${TEMPLATES[t].name}</b><br><small>${TEMPLATES[t].hint}</small></div>`).join('')}</div></div>`;

function bindEditor() {
  const p = S.pres;
  $('#back').onclick = () => goList();
  $('#title').onchange = e => { p.title = e.target.value; commit(); };
  $('#undo').onclick = undo; $('#redo').onclick = redo;
  $('#saveFile').onclick = () => {
    flushEdit(true);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([toFile(p)], { type: 'application/json' }));
    a.download = (p.title || 'Презентация') + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Сохранено в «Загрузки». Открыть на другом компьютере: «Открыть файл» в списке презентаций', 4000);
  };
  $('#play').onclick = () => startShow(0);
  // Кнопки панели не забирают фокус у набираемого текста (иначе первый щелчок по A+ терялся)
  $$('.tool button').forEach(x => x.onmousedown = e => e.preventDefault());
  $('#photoBtn').onclick = () => {
    const s = slide(); if (!s) return;
    let ph = block()?.type === 'photo' ? block() : s.blocks.find(x => x.type === 'photo');
    if (!ph) {                              // на слайде нет места для фото — добавляем блок фото справа
      ph = { id: uid('b'), type: 'photo', role: 'photo', x: 1040, y: 300, w: 760, h: 560, src: null, iw: 0, ih: 0, crop: { cx: 0.5, cy: 0.5, zoom: 1 } };
      ph.home = { x: ph.x, y: ph.y, w: ph.w, h: ph.h };
      s.blocks.push(ph);
    }
    S.sel = ph.id; commit(); $('#filePhoto').click();
  };
  $('#pdf').onclick = () => { toast('В окне печати выберите «Сохранить как PDF»', 4000); exportPdf(p); };
  $('#pptx').onclick = async () => {
    toast('Готовлю PowerPoint…', 8000);
    try { await exportPptx(p); toast('PowerPoint скачан в «Загрузки»'); } catch (e) { console.error(e); toast('Не получилось собрать PowerPoint: ' + e.message, 5000); }
  };
  $$('.film .f').forEach(f => f.onclick = e => {
    const d = e.target.closest('[data-delslide]');
    if (d) { e.stopPropagation(); p.slides.splice(+d.dataset.delslide, 1); if (S.cur >= p.slides.length) S.cur = p.slides.length - 1; S.sel = null; commit(); toast('Слайд удалён — «Отменить» вернёт его'); return; }
    S.cur = +f.dataset.i; S.sel = null; S.crop = null; renderEditor();
  });
  $('#addSlide').onclick = () => { S.sheet = true; renderEditor(); };
  if (S.sheet) {
    $('#closeSheet').onclick = $('#dim').onclick = () => { S.sheet = false; renderEditor(); };
    $$('.sheet .it').forEach(it => it.onclick = () => {
      const s = newSlide(it.dataset.tpl);
      p.slides.splice(S.cur + 1, 0, s);
      S.cur = p.slides.length === 1 ? 0 : S.cur + 1;
      S.sheet = false;
      const first = s.blocks.find(x => x.type === 'text');
      S.sel = first?.id || null;
      commit();
      if (first) startEdit(first.id);
    });
  }
  const b = block();
  if ($('#fminus')) {
  $('#fminus').onclick = () => { b.size = fontStep(b.size, -1, b.role); commit(); };
  $('#fplus').onclick = () => { b.size = fontStep(b.size, +1, b.role); commit(); };
  $$('[data-w]').forEach(x => x.onclick = () => { Object.assign(b, setStyle(b, { weight: x.dataset.w })); commit(); });
  $$('[data-a]').forEach(x => x.onclick = () => { Object.assign(b, setStyle(b, { align: x.dataset.a })); commit(); });
  $('#mark').onclick = toggleMark;
  $('#delBlock').onclick = deleteBlock;
  }
  $('#reset') && ($('#reset').onclick = () => { Object.assign(b, resetBlock(b)); commit(); });
  // фото
  $('#pickPhoto') && ($('#pickPhoto').onclick = () => $('#filePhoto').click());
  $('#cropStart') && ($('#cropStart').onclick = () => { S.crop = b.id; renderEditor(); });
  $('#cropDone') && ($('#cropDone').onclick = () => { S.crop = null; commit(); });
  $$('[data-z]').forEach(z => z.onclick = () => { b.crop.zoom = Math.min(4, Math.max(1, +(b.crop.zoom + 0.2 * z.dataset.z).toFixed(2))); drawCanvas(); bindCanvas(); });
  bindCanvas();
}

// Пересчёт координат мыши в координаты слайда 1920×1080.
function toSlide(e) { const r = $('#canvas .sx').getBoundingClientRect(); const k = r.width / 1920; return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k, k }; }

function bindCanvas() {
  const c = $('#canvas');
  if (!c || !slide()) return;
  c.onpointerdown = e => {
    if (e.button !== 0 || e.target.closest('.photo-tools') || e.target.closest('textarea')) return;
    const handle = e.target.closest('[data-h]');
    const el = e.target.closest('.tb,.pb');
    if (!el && !handle) { if (S.editing) return; if (S.sel || S.crop) { S.sel = null; S.crop = null; renderEditor(); } return; }
    const id = handle ? S.sel : el.dataset.id;
    const b = block(id);
    if (!b || S.editing === id) return;
    if (S.editing) finishEdit();
    e.preventDefault();
    const start = toSlide(e), orig = structuredClone(b);
    const wasSel = S.sel === id;
    if (!wasSel) { S.sel = id; S.crop = null; renderEditor(); }
    let moved = false;
    const mode = handle ? 'resize' : (S.crop === id ? 'crop' : 'move');
    const onMove = ev => {
      const pt = toSlide(ev), dx = pt.x - start.x, dy = pt.y - start.y;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      const nb = block(id);
      if (mode === 'move') Object.assign(nb, moveBlock(orig, dx, dy));
      else if (mode === 'resize') Object.assign(nb, resizeFrom(orig, handle.dataset.h, dx, dy));
      else {
        const k = Math.max(orig.w / orig.iw, orig.h / orig.ih) * orig.crop.zoom, ow = orig.w - orig.iw * k, oh = orig.h - orig.ih * k;
        nb.crop = { ...orig.crop, cx: ow ? clamp01(orig.crop.cx + dx / ow) : 0.5, cy: oh ? clamp01(orig.crop.cy + dy / oh) : 0.5 };
      }
      drawCanvas();
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp);
      if (moved) { if (mode === 'crop') { drawCanvas(); bindEditor(); } else commit(); }
      else if (b.type === 'text') startEdit(id);           // один щелчок по тексту — сразу курсор
      else { drawCanvas(); bindEditor(); }
    };
    document.addEventListener('pointermove', onMove); document.addEventListener('pointerup', onUp);
  };
  c.ondblclick = e => { const el = e.target.closest('.tb'); if (el) startEdit(el.dataset.id); };
  c.ondragover = e => { if ([...e.dataTransfer.items].some(i => i.type.startsWith('image/'))) e.preventDefault(); };
  c.ondrop = e => {
    e.preventDefault();
    const f = [...e.dataTransfer.files].find(x => x.type.startsWith('image/'));
    if (!f) return;
    const el = e.target.closest('.pb');
    const target = el ? block(el.dataset.id) : (block()?.type === 'photo' ? block() : slide().blocks.find(x => x.type === 'photo'));
    if (!target) { toast('На этом слайде нет места для фото — добавьте слайд «Мысль и фото»', 4000); return; }
    setPhoto(target, f);
  };
}
const clamp01 = v => Math.min(1, Math.max(0, v));
function resizeFrom(o, h, dx, dy) {
  let { x, y, w, h: hh } = o;
  const R = CARD.x + CARD.w, B = CARD.y + CARD.h;
  if (h.includes('e')) w = Math.min(Math.max(o.w + dx, MIN_BLOCK.w), R - o.x);
  if (h.includes('s')) hh = Math.min(Math.max(o.h + dy, MIN_BLOCK.h), B - o.y);
  if (h.includes('w')) { x = Math.min(Math.max(o.x + dx, CARD.x), o.x + o.w - MIN_BLOCK.w); w = o.x + o.w - x; }
  if (h.includes('n')) { y = Math.min(Math.max(o.y + dy, CARD.y), o.y + o.h - MIN_BLOCK.h); hh = o.y + o.h - y; }
  return { x, y, w, h: hh };
}

// ---------- правка текста: поле поверх блока, текст — символ в символ ----------
function startEdit(id) {
  const b = block(id);
  if (!b || b.type !== 'text') return;
  S.sel = id; S.crop = null;
  renderEditor();
  S.editing = id;
  const el = $(`#canvas .tb[data-id="${id}"]`), sx = $('#canvas .S');
  el.classList.add('editing');
  const cs = getComputedStyle(el);
  const ta = document.createElement('textarea');
  ta.className = 'ed';
  S.marks = marksOf(b.text);
  ta.value = plainText(b.text);
  const pd = padOf(b), pt = pd.y, pl = pd.x;
  Object.assign(ta.style, { left: b.x + pl + 'px', top: b.y + pt + 'px', width: b.w - 2 * pl + 'px', fontSize: b.size + 'px', fontWeight: cs.fontWeight, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, textAlign: b.align, color: cs.color });
  sx.appendChild(ta);
  const fit = () => { ta.style.height = 'auto'; ta.style.height = Math.max(ta.scrollHeight, b.h - 2 * pt) + 'px'; };
  fit();
  // Каждая буква сразу в презентации и в сохранении (без шага «Отменить» на каждую букву)
  // Пока печатаешь: текст дошёл до низа слайда — сразу красная рамка и предупреждение
  const liveOver = () => { const over = b.y + pt + ta.scrollHeight > CARD.y + CARD.h; ta.classList.toggle('over', over); const m = $('#overMsg'); if (m) m.hidden = !over && !S.over; };
  ta.oninput = () => { fit(); liveOver(); b.text = withMarks(ta.value); S.pres.updated = new Date().toISOString(); scheduleSave(); };
  ta.onblur = () => finishEdit();
  ta.onkeydown = e => { if (e.key === 'Escape') { e.preventDefault(); ta.blur(); } };
  ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
}
function finishEdit() {
  const ta = $('#canvas textarea.ed');
  const b = block(S.editing);
  const id = S.editing;
  S.editing = null;
  if (!ta || !b) return;
  ta.onblur = null;
  const v = withMarks(ta.value);           // ровно то, что набрано, плюс маркеры «Главное»
  const last = hist.current();             // сравниваем со снимком: набор уже попал в блок по ходу ввода
  const lastText = last.slides.flatMap(x => x.blocks).find(x => x.id === id)?.text;
  b.text = v;
  const changed = v !== lastText;
  S.sel = id;
  if (changed) commit(); else renderEditor();
}

// «Главное» — жёлтый маркер. В режиме набора — выделенные слова; иначе — весь блок (повторно — снять).
function toggleMark() {
  const ta = $('#canvas textarea.ed');
  const b = block();
  if (!b || b.type !== 'text') return;
  if (ta && ta.selectionStart !== ta.selectionEnd) {
    const a = ta.selectionStart, z = ta.selectionEnd, sel = ta.value.slice(a, z);
    // уже выделено — снимаем, иначе отмечаем (сам текст не меняется)
    const hit = (S.marks || []).find(m => m.t === sel && Math.abs(m.pos - a) < 2);
    S.marks = hit ? S.marks.filter(m => m !== hit) : [...(S.marks || []), { t: sel, pos: a }];
    finishEdit();
    return;
  }
  if (ta) finishEdit();
  const bb = block();
  bb.text = /\[\[[\s\S]*?\]\]/.test(bb.text) ? bb.text.replace(/\[\[([\s\S]*?)\]\]/g, '$1') : (bb.text ? `[[${bb.text}]]` : bb.text);
  commit();
}

function deleteBlock() {
  const s = slide(); if (!s || !S.sel) return;
  s.blocks = s.blocks.filter(b => b.id !== S.sel);
  S.sel = null; S.editing = null; S.crop = null;
  commit(); toast('Блок удалён — «Отменить» вернёт его');
}

function undo() { if (!hist.canUndo()) return; S.pres = restore(hist.undo()); afterHistory(); }
function redo() { if (!hist.canRedo()) return; S.pres = restore(hist.redo()); afterHistory(); }
function afterHistory() { S.editing = null; S.crop = null; if (!block()) S.sel = null; renderEditor(); scheduleSave(); }

// ---------- фото: уменьшаем до 2000 px, храним в презентации ----------
$('#filePhoto').onchange = e => { const f = e.target.files[0]; e.target.value = ''; const b = block(); if (f && b?.type === 'photo') setPhoto(b, f); };
async function setPhoto(b, file) {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);   // PNG с прозрачностью не станет чёрным
    g.drawImage(bmp, 0, 0, c.width, c.height);
    const aid = uid('a');
    (S.pres.assets ||= {})[aid] = c.toDataURL('image/jpeg', 0.88);
    Object.assign(b, { src: 'asset:' + aid, iw: c.width, ih: c.height, crop: { cx: 0.5, cy: 0.5, zoom: 1 } });
    S.sel = b.id; commit();
  } catch { toast('Это не картинка — выберите фото (JPG или PNG)', 4000); }
}

// ---------- клавиши ----------
document.addEventListener('keydown', e => {
  if (S.show !== null) {
    if (['ArrowRight', 'ArrowDown', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); showGo(1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); showGo(-1); }
    else if (e.key === 'Escape') stopShow();
    return;
  }
  if (S.screen !== 'edit' || S.editing || e.target.matches('input,textarea')) return;
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  if (e.key === 'Escape') { if (S.sheet) S.sheet = false; else { S.sel = null; S.crop = null; } renderEditor(); return; }
  const b = block();
  if (!b) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteBlock(); }
  else if (e.key === 'Enter' && b.type === 'text') { e.preventDefault(); startEdit(b.id); }
  else if (e.key.startsWith('Arrow')) {
    e.preventDefault();
    const st = e.shiftKey ? 20 : 4, d = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
    Object.assign(b, moveBlock(b, ...d)); commit();
  }
});
window.addEventListener('resize', () => { if (S.screen === 'edit') { drawCanvas(); bindEditor(); } if (S.show !== null) drawShow(); });

// ---------- 4. Показ на весь экран ----------
function startShow(i) {
  S.show = i;
  const d = document.createElement('div'); d.className = 'show'; d.id = 'show';
  document.body.appendChild(d);
  d.onclick = () => showGo(1);
  d.requestFullscreen?.().catch(() => {});
  drawShow();
}
function drawShow() {
  const d = $('#show'); if (!d) return;
  const s = S.pres.slides[S.show];
  const w = Math.min(innerWidth, innerHeight * 16 / 9);
  d.innerHTML = scaled(s, Math.floor(w), { num: S.show + 1 }) + `<div class="nav${S.show === 0 ? '' : ' fade'}">← → листать · Esc — вернуться к правке · ${S.show + 1} из ${S.pres.slides.length}</div>`;
}
function showGo(dir) { const n = S.show + dir; if (n < 0) return; if (n >= S.pres.slides.length) return stopShow(); S.show = n; drawShow(); }
function stopShow() { const last = S.show; S.show = null; $('#show')?.remove(); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); S.cur = last ?? S.cur; renderEditor(); }
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && S.show !== null) stopShow(); });

// ---------- «Назад» в браузере = «← Презентации» ----------
async function goList() {
  flushEdit(); clearTimeout(saveTimer);
  if (S.pres) { await saveNow(); }
  S.screen = 'list';
  if (history.state?.screen === 'edit') history.back(); else renderList();
}
addEventListener('popstate', () => { if (S.screen === 'edit') { flushEdit(); saveNow(); S.screen = 'list'; } renderList(); });

// ---------- старт ----------
document.fonts.ready.then(renderList);
