// Модель слайда Академии Сметного Дела: шаблоны, размер шрифта, блоки.
// Всё в координатах слайда 1920×1080. Рамка, логотип, шрифт и цвета — в коде, не в блоках:
// их нельзя выделить, сдвинуть или поменять. Ни одна функция не меняет текст блока.

export const SLIDE = { w: 1920, h: 1080 };
export const CARD = { x: 22, y: 25, w: 1876, h: 1029 };          // белая карточка внутри синей рамки
export const MARGIN = { left: 128, top: 96, right: 128, bottom: 96 };
// Где стоит логотип: стиль Академии — справа сверху 296 px; мастер-майнд — как в образце.
export const logoZone = tpl => tpl?.style === 'mm' ? { x: 1600, y: 46, w: 210, h: 60 } : tpl?.style === 'mmCover' ? { x: 110, y: 100, w: 330, h: 95 } : LOGO_ZONE;
export const LOGO_ZONE = { x: CARD.x + CARD.w - 96 - 296, y: CARD.y + 72, w: 296, h: Math.round(296 * 37 / 129) };
export const SNAP = 32;          // ближе 32 px к полям Академии — блок встаёт ровно на поле
export const MIN_BLOCK = { w: 120, h: 60 };
export const LIMITS = { title: [40, 120], body: [24, 64], item: [24, 64], q: [24, 64], key: [24, 48], toc: [24, 56] };
export const WEIGHTS = ['normal', 'bold'];
export const ALIGNS = ['left', 'center', 'right'];

const C = (x, y, w, h) => ({ x: CARD.x + x, y: CARD.y + y, w, h });
const A = (x, y, w, h) => ({ x, y, w, h });
const T = (role, box, size, extra = {}) => ({ type: 'text', role, ...box, size, weight: role === 'title' ? 'bold' : 'normal', align: 'left', text: '', ...extra });
const P = box => ({ type: 'photo', role: 'photo', ...box, src: null, iw: 0, ih: 0, crop: { cx: 0.5, cy: 0.5, zoom: 1 } });

// Образцы текста — подсказка в пустом блоке; в сам текст не попадают.
export const TEMPLATES = {
  title:     { name: 'Титул', hint: 'название и подпись', blocks: [
               T('title', C(128, 330, 1300, 280), 110, { ph: 'Название презентации' }),
               T('body',  C(128, 700, 1300, 90), 42,   { ph: 'Подпись: курс, эксперт, дата' })] },
  text:      { name: 'Мысль и текст', hint: 'заголовок и абзац', blocks: [
               T('title', C(128, 200, 1300, 260), 88, { ph: 'Главная мысль слайда' }),
               T('body',  C(128, 540, 1300, 320), 40, { ph: 'Пояснение в 1–3 строки' })] },
  photo:     { name: 'Мысль и фото', hint: 'фото на половину слайда', blocks: [
               P(C(900, 0, 976, 1029)),
               T('title', C(128, 230, 700, 320), 80, { ph: 'Мысль к фото' }),
               T('body',  C(128, 620, 700, 220), 40, { ph: 'Подпись' })] },
  three:     { name: 'Три плашки', hint: 'мысль и до трёх блоков', blocks: [
               T('title', C(128, 96, 1200, 130), 80, { ph: 'Заголовок' }),
               T('item',  C(128, 300, 1620, 170), 44, { plate: true, ph: 'Первый пункт' }),
               T('item',  C(128, 510, 1620, 170), 44, { plate: true, ph: 'Второй пункт' }),
               T('item',  C(128, 720, 1620, 170), 44, { plate: true, ph: 'Третий пункт' })] },
  poster:    { name: 'Удар на синем', hint: 'одна мысль крупно', poster: true, blocks: [
               T('title', C(160, 300, 1500, 380), 110, { ph: 'Одна мысль крупно' }),
               T('body',  C(160, 760, 1400, 100), 42,  { ph: 'Одна строка-подпись' })] },
  minusplus: { name: 'Неправильно и правильно', hint: 'минус красным, плюс зелёным', blocks: [
               T('title', C(128, 96, 1200, 130), 80, { ph: 'Заголовок' }),
               T('item',  C(128, 300, 790, 600), 46, { plate: true, tag: 'minus', ph: 'Как неправильно' }),
               T('item',  C(958, 300, 790, 600), 46, { plate: true, tag: 'plus',  ph: 'Как правильно' })] },
  question:  { name: 'Вопрос участника', hint: 'вопрос дословно', label: 'Вопрос участника', blocks: [
               T('title', C(128, 210, 1560, 640), 72, { tone: 'ink', ph: 'Вопрос участника — дословно' })] },
  // ---- Мастер-майнд (вид по образцу «Мастер-майнд — итоговая презентация», Руслан 26.11.2026) ----
  // Структура: 1 титул · 2 содержание · 3 вопрос-ответ пошагово · 4 выводы · 5 прощание.
  mmtitle:   { name: 'Мастер-майнд: титул', hint: 'название и дата', style: 'mmCover', photo: 'assets/mm_titul.jpg', blocks: [
               T('title', A(110, 380, 820, 280), 100, { tone: 'white', text: 'Мастер-майнд', ph: 'Мастер-майнд' }),
               T('body',  A(110, 700, 780, 70), 44, { tone: 'light', ph: 'Дата' })] },
  mmlist:    { name: 'Мастер-майнд: содержание', hint: 'перечень всех вопросов', style: 'mm', top: 'МАСТЕР-МАЙНД', blocks: [
               T('title', A(110, 120, 1440, 100), 64, { tone: 'navy', text: 'Содержание', ph: 'Содержание' }),
               T('toc',   A(110, 260, 1700, 700), 40, { ph: 'Вопросы участников' })] },
  mmpart:    { name: 'Вопрос и ответ: шаг', hint: 'вопрос сверху, ниже шаг ответа', style: 'mm', mm: true, blocks: [
               T('title', A(110, 120, 1440, 100), 64, { tone: 'navy', ph: 'Тема вопроса — коротко' }),
               T('q',     A(112, 262, 1698, 150), 34, { qbox: true, weight: 'normal', ph: 'Вопрос участника — дословно' }),
               T('body',  A(110, 540, 1300, 420), 42, { ph: 'Шаг ответа' }),
               T('key',   A(1450, 540, 360, 300), 36, { keybox: true, weight: 'bold', ph: '1500 руб. — Доставка в КП' })] },
  mmsum:     { name: 'Мастер-майнд: выводы', hint: 'выводы по всем вопросам', style: 'mm', top: 'ИТОГИ МАСТЕР-МАЙНДА', blocks: [
               T('title', A(110, 120, 1440, 100), 64, { tone: 'navy', text: 'Выводы', ph: 'Выводы' }),
               T('toc',   A(110, 260, 1700, 700), 40, { ph: 'Выводы по вопросам' })] },
  mmend:     { name: 'Мастер-майнд: прощание', hint: 'спасибо и до встречи', style: 'mmCover', photo: 'assets/mm_proshchanie.jpg', blocks: [
               T('title', A(110, 380, 820, 240), 96, { tone: 'white', text: 'Спасибо за ваши вопросы!', ph: 'Спасибо за ваши вопросы!' }),
               T('body',  A(110, 660, 780, 80), 52, { tone: 'light', text: 'До новых встреч!', ph: 'До новых встреч!' })] },
  answer:    { name: 'Ответ', hint: 'первая фраза — заголовок', blocks: [
               T('title', C(128, 180, 1420, 300), 80, { ph: 'Ответ — главная фраза' }),
               T('body',  C(128, 520, 1420, 420), 42, { ph: 'Пояснение' })] },
};
export const LAYER1 = ['title', 'text', 'photo', 'three', 'poster', 'minusplus', 'question', 'answer', 'mmtitle', 'mmlist', 'mmpart', 'mmsum', 'mmend'];

let seq = 0;
export const uid = (p = 'b') => p + Date.now().toString(36) + (seq++).toString(36) + Math.random().toString(36).slice(2, 6);

export function newSlide(tpl) {
  const t = TEMPLATES[tpl];
  if (!t) throw new Error('Нет такого шаблона: ' + tpl);
  const blocks = t.blocks.map(b => {
    const c = structuredClone(b);
    c.id = uid('b');
    c.home = { x: c.x, y: c.y, w: c.w, h: c.h };
    return c;
  });
  const slide = { id: uid('s'), tpl, blocks, logo: true };
  if (t.mm) slide.meta = { qnum: 1, qname: '', part: 'Ответ' };
  return slide;
}

const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const limitsOf = role => LIMITS[role] || LIMITS.body;

// A+ / A−: шаг 2 до 48, шаг 4 выше; границы по роли; меньше 24 — никогда.
export function fontStep(size, dir, role) {
  const [lo, hi] = limitsOf(role);
  let n;
  if (dir > 0) n = size < 48 ? size + 2 : size + 4;
  else n = size > 48 ? Math.max(size - 4, 48) : size - 2;
  return clamp(n, Math.max(lo, 24), hi);
}

export function moveBlock(b, dx, dy) {
  const R = CARD.x + CARD.w, B = CARD.y + CARD.h;
  let x = clamp(b.x + dx, CARD.x, R - b.w);
  let y = clamp(b.y + dy, CARD.y, B - b.h);
  const ml = CARD.x + MARGIN.left, mt = CARD.y + MARGIN.top, mr = R - MARGIN.right, mb = B - MARGIN.bottom;
  if (Math.abs(x - ml) < SNAP) x = ml; else if (Math.abs(x + b.w - mr) < SNAP) x = mr - b.w;
  if (Math.abs(y - mt) < SNAP) y = mt; else if (Math.abs(y + b.h - mb) < SNAP) y = mb - b.h;
  return { ...b, x, y };
}

export function resizeBlock(b, dw, dh) {
  const w = clamp(b.w + dw, MIN_BLOCK.w, CARD.x + CARD.w - b.x);
  const h = clamp(b.h + dh, MIN_BLOCK.h, CARD.y + CARD.h - b.y);
  return { ...b, w, h };
}

export const resetBlock = b => ({ ...b, ...b.home });

export function setStyle(b, patch) {
  const out = { ...b };
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'weight' && WEIGHTS.includes(v)) out.weight = v;
    else if (k === 'align' && ALIGNS.includes(v)) out.align = v;
    else throw new Error('Это свойство в стиле Академии не меняется: ' + k);
  }
  return out;
}

// Оценка, поместится ли текст: ширина знака ≈ 0,56 размера (Noto Sans, жирный — 0,6), строка ≈ 1,22.
export function linesFor(text, w, size, bold) {
  const cpl = Math.max(1, Math.floor(w / (size * (bold ? 0.6 : 0.56))));
  return String(text).replace(/\[\[|\]\]/g, '').split('\n')
    .reduce((n, line) => n + Math.max(1, Math.ceil(line.length / cpl)), 0);
}
// Высота строки как на экране и в PowerPoint: заголовок 1,1, остальной текст 1,3.
export const textHeight = (text, w, size, bold) => linesFor(text, w, size, bold) * size * (bold ? 1.12 : 1.3);

// Подобрать размер, чтобы текст поместился. Текст не трогаем — уменьшаем шрифт, не ниже min.
export function fitSize(text, w, h, max, min = 24) {
  for (let s = max; s > min; s -= 2) if (textHeight(text, w, s, false) <= h) return s;
  return Math.max(min, 24);
}
