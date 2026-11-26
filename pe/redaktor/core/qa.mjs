// Окно «Вопрос — ответ» → слайды мастер-майнда. Без модели, мгновенно.
// Композиция (Руслан 26.11.2026): 1-й слайд — список всех вопросов; на каждый ответ — до 3 слайдов
// «1 · Начало», «2 · Обоснование», «3 · Выводы»; вопрос повторяется сверху на каждом слайде.
// Правило Руслана: текст не меняется ни на символ — мы только делим его на части и обрезаем пробелы по краям частей.
import { newSlide, fitSize, textHeight, CARD } from './model.mjs';

const MARK = /^[ \t]*(вопрос|ответ)(?:[ \t]*\(([^)\n]*)\))?[ \t]*[:—–-][ \t]*/i;
// «Тема», «Главное», «Начало», «Обоснование», «Выводы» — только с двоеточием: строка «Выводы — это…» остаётся текстом.
const TOPIC = /^[ \t]*тема[ \t]*:[ \t]*/i;
const KEY = /^[ \t]*главное[ \t]*:[ \t]*/i;
const PART = /^[ \t]*(начало|обоснование|выводы|вывод)[ \t]*:[ \t]*/i;
const ABBR = new Set(['г', 'гг', 'ул', 'им', 'см', 'ср', 'рис', 'табл', 'п', 'пп', 'ст', 'ч', 'т', 'тыс', 'млн', 'млрд', 'руб', 'коп', 'кв', 'м', 'др', 'стр', 'гл', 'разд', 'прил', 'напр', 'т.е', 'т.к', 'т.н']);
const trimEdges = s => s.replace(/^\s+|\s+$/g, '');

export function splitFirstSentence(s) {
  const re = /([.!?…]+)([ \t\n]+)(?=[«"„(]?[A-ZА-ЯЁ0-9])/g;
  let m;
  while ((m = re.exec(s))) {
    const end = m.index + m[1].length;
    if (m[1] === '.') {
      const word = (s.slice(0, m.index).match(/([A-Za-zА-Яа-яЁё.]+)$/) || [, ''])[1].toLowerCase();
      if (ABBR.has(word) || /\d$/.test(s.slice(0, m.index)) && /^[ \t]*\d/.test(s.slice(end + m[2].length))) continue;
    }
    return { title: s.slice(0, end), sep: m[2], body: s.slice(end + m[2].length) };
  }
  return { title: s, sep: '', body: '' };
}

// Текст → [часть, разделитель, часть, …] по фразам; склейка даёт исходный текст.
function sentences(s) {
  const out = [];
  let rest = s;
  for (;;) { const { title, sep, body } = splitFirstSentence(rest); out.push(title); if (!sep) break; out.push(sep); rest = body; }
  return out;
}

// Ответ → части. Пометки «Начало: / Обоснование: / Выводы:» — главнее; иначе абзацы; один-два абзаца… — фразы.
export function answerParts(text) {
  const lines = text.split('\n');
  if (lines.some(l => PART.test(l))) {
    const parts = []; let cur = null;
    for (const line of lines) {
      const m = line.match(PART);
      if (m) { const k = m[1].toLowerCase(); cur = { key: k === 'начало' ? 'start' : k === 'обоснование' ? 'basis' : 'end', text: line.slice(m[0].length) }; parts.push(cur); }
      else if (cur) cur.text += '\n' + line;
      else if (line.trim()) { cur = { key: 'start', text: line }; parts.push(cur); }
    }
    return { parts: parts.map(p => ({ ...p, text: trimEdges(p.text) })).filter(p => p.text), marked: true };
  }
  let units = text.split(/(\n[ \t]*\n)/);
  if (units.length < 5) units = sentences(text);            // меньше трёх абзацев — делим по фразам
  const n = (units.length + 1) / 2;
  if (n === 1) return { parts: [{ key: 'start', text: units[0] }], seps: [] };
  if (n === 2) return { parts: [{ key: 'start', text: units[0] }, { key: 'end', text: units[2] }], seps: [units[1]] };
  return {
    parts: [{ key: 'start', text: units[0] }, { key: 'basis', text: units.slice(2, -2).join('') }, { key: 'end', text: units[units.length - 1] }],
    seps: [units[1], units[units.length - 2]],
  };
}

export function parseQA(text) {
  const src = String(text ?? '').replace(/\r\n?/g, '\n');
  if (!src.trim()) return [];
  const lines = src.split('\n');
  const raw = [];
  if (lines.some(l => MARK.test(l))) {
    let cur = null, sink = 'text';
    for (const line of lines) {
      const m = line.match(MARK);
      if (m) { cur = { kind: m[1].toLowerCase() === 'ответ' ? 'answer' : 'question', name: trimEdges(m[2] || ''), text: line.slice(m[0].length), topic: '', key: '' }; raw.push(cur); sink = 'text'; continue; }
      if (cur?.kind === 'question' && TOPIC.test(line)) { cur.topic = trimEdges(line.replace(TOPIC, '')); continue; }
      if (cur?.kind === 'answer' && KEY.test(line)) { cur.key = line.replace(KEY, ''); sink = 'key'; continue; }
      if (cur) cur[sink] += '\n' + line;
      else if (line.trim()) { cur = { kind: 'question', name: '', text: line, topic: '', key: '' }; raw.push(cur); }
    }
  } else {
    src.split(/\n[ \t]*\n/).map(trimEdges).filter(Boolean)
      .forEach((p, i) => raw.push({ kind: i % 2 ? 'answer' : 'question', name: '', text: p }));
  }
  let num = 0;
  return raw.map(r => ({ ...r, text: trimEdges(r.text), key: trimEdges(r.key || '') })).filter(r => r.text).map(r => r.kind === 'answer'
    ? { kind: 'answer', text: r.text, key: r.key, ...splitFirstSentence(r.text), ...answerParts(r.text) }
    : { kind: 'question', num: ++num, name: r.name, topic: r.topic || '', text: r.text });
}

import { PART_NAMES_SHORT as PART_NAMES } from './labels.mjs';
export { PART_NAMES };
export const questionLabel = (num, name) => `Вопрос ${num}${name ? ' · ' + name : ''}`;

const today = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`; };

// Кегль шага ответа по длине: коротко — крупно (правка дизайнера мастермайнда 26.11.2026).
const bodyMax = t => t.length <= 180 ? 48 : t.length <= 450 ? 42 : t.length <= 900 ? 36 : 32;

// Пункт списка «Содержание» / «Выводы»: подпись (наша) + текст эксперта дословно; пункты через пустую строку.
const tocItem = (q, text) => `${questionLabel(q.num, q.name).toUpperCase()}\n${text}`;

// Структура мастер-майнда (Руслан 26.11.2026): 1 титул · 2 содержание · 3 вопрос-ответ пошагово · 4 выводы · 5 прощание.
export function slidesFromQA(text, opts = {}) {
  const items = parseQA(text);
  const questions = items.filter(i => i.kind === 'question');
  if (!questions.length) return [];
  const slides = [];
  const toc = (tpl, list) => {
    const s = newSlide(tpl), b = s.blocks[1];
    b.text = list.join('\n\n');
    b.size = fitSize(b.text, b.w, b.h, list.length <= 4 ? 44 : 40, 24);
    grow(b, false);
    return s;
  };
  // 1. Титул
  const T = newSlide('mmtitle');
  if (opts.title) T.blocks[0].text = opts.title;
  T.blocks[0].size = fitSize(T.blocks[0].text, T.blocks[0].w * 0.92, T.blocks[0].h, 100, 64);
  T.blocks[1].text = opts.date || today();
  slides.push(T);
  // 2. Содержание — тема, если её указали, иначе вопрос дословно
  slides.push(toc('mmlist', questions.map(q => tocItem(q, q.topic || q.text))));
  // 3. Вопрос-ответ пошагово; вопрос повторяется сверху на каждом слайде
  const conclusions = [];
  items.forEach((it, i) => {
    if (it.kind !== 'question') return;
    const ans = items[i + 1]?.kind === 'answer' ? items[i + 1] : null;
    if (!ans || !ans.parts.length) {             // вопрос без ответа — тот же вид мастер-майнда, вопрос крупно
      const s = newSlide('mmpart');
      s.meta = { qnum: it.num, qname: it.name, part: 'Вопрос', key: '', of: [], noAnswer: true };
      const [topic, q] = s.blocks;
      s.blocks = it.topic ? [topic, q] : [q];
      if (it.topic) topic.text = it.topic; else q.y = 120;
      q.text = it.text;
      q.size = fitSize(q.text, q.w - 80, 960 - q.y - 56, 48, 24);
      q.h = Math.min(960 - q.y, Math.max(160, Math.ceil(textHeight(q.text, q.w - 80, q.size, false) + q.size * 0.4) + 56));
      slides.push(s);
      return;
    }
    const keys = ans.parts.map(p => p.key);
    const end = ans.parts.find(p => p.key === 'end') || ans.parts[ans.parts.length - 1];
    conclusions.push(tocItem(it, end.text));
    ans.parts.forEach((p, k) => {
      const s = newSlide('mmpart');
      const last = k === ans.parts.length - 1;
      s.meta = { qnum: it.num, qname: it.name, part: ans.parts.length === 1 ? 'Ответ' : `${k + 1} · ${PART_NAMES[p.key]}`, key: ans.parts.length === 1 ? '' : p.key, of: keys };
      let [topic, q, body, key] = s.blocks;
      if (it.topic) topic.text = it.topic;
      else { s.blocks = s.blocks.filter(b => b !== topic); q.y = 120; }   // нет темы — плашка вопроса поднимается, пустой полосы нет
      q.text = it.text;
      q.size = fitSize(q.text, q.w - 80, 184, 34, 24);
      q.h = Math.max(110, Math.ceil(textHeight(q.text, q.w - 80, q.size, false) + q.size * 0.4) + 56);
      body.y = q.y + q.h + 136;
      body.h = Math.max(160, 960 - body.y);
      if (last && ans.key) {
        key.text = ans.key;
        // «Главное» по высоте текста; если не помещается до подвала — начинается выше, рядом с подписью ответа
        const need = keyHeight(ans.key, key.w);
        key.y = Math.max(q.y + q.h + 40, Math.min(body.y, 960 - need));
        key.h = Math.min(960 - key.y, need);
      } else { s.blocks = s.blocks.filter(b => b !== key); body.w = 1700; }
      body.text = p.text;
      body.size = fitSize(body.text, body.w, body.h, bodyMax(body.text), 24);
      grow(body, false);
      slides.push(s);
    });
  });
  // 4. Выводы — вывод каждого ответа дословно, с подписью вопроса
  if (conclusions.length) slides.push(toc('mmsum', conclusions));
  // 5. Прощание
  slides.push(newSlide('mmend'));
  slides.forEach(s => s.blocks.forEach(b => (b.home = { x: b.x, y: b.y, w: b.w, h: b.h })));
  return slides;
}
// Высота блока «Главное»: заголовок 70 + на каждую строку значение 36 px и подпись 26 px с переносами, 22 px между парами.
function keyHeight(t, w) {
  const inner = w - 68;
  return 70 + 28 + t.split('\n').filter(l => l.trim()).reduce((h, l) => {
    const i = l.indexOf(' — '), v = i < 0 ? l : l.slice(0, i), c = i < 0 ? '' : l.slice(i + 3);
    return h + textHeight(v, inner, 36, true) + (c ? textHeight(c, inner, 26, false) + 4 : 0) + 22;
  }, 0);
}

// Подсказка во «Вопрос — ответ»: строка с «?» внутри ответа — возможно, это отдельный вопрос без пометки.
export function qaWarnings(text) {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  if (!lines.some(l => MARK.test(l))) return [];
  const out = []; let inAnswer = false, qn = 0;
  lines.forEach((l, i) => {
    const m = l.match(MARK);
    if (m) { inAnswer = m[1].toLowerCase() === 'ответ'; if (!inAnswer) qn++; return; }
    if (inAnswer && /\?\s*$/.test(l) && !TOPIC.test(l) && !KEY.test(l)) out.push({ line: i, text: l.trim(), after: qn });
  });
  return out;
}

// Если даже на минимальном шрифте не помещается — растим блок вниз до края карточки (текст не режем).
function grow(b, bold) {
  const need = Math.ceil(textHeight(b.text, b.w, b.size, bold));
  if (need > b.h) b.h = Math.min(need, CARD.y + CARD.h - b.y);
}
