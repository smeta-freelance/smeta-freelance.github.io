// Слайд → команды для PowerPoint (PptxGenJS). 1920 px = 13,333 дюйма (144 px на дюйм), шрифт: px / 2 = pt.
// Текст переносится символ в символ; «Главное» [[…]] — жёлтым выделением; автоподбор выключен.
// Два вида: стиль Академии (синяя рамка, белая карточка) и мастер-майнд по образцу (белый лист с синей полосой, синий титул).
import { CARD, TEMPLATES, logoZone } from './model.mjs';
import { PART_NAMES_SHORT } from './labels.mjs';

const IN = px => px / 144;
export const COLORS = { frame: '0231B9', title: '0038B0', navy: '0A1F5C', ink: '000C3F', mute: '5A6385', plate: 'EFF8FF', marker: 'FFE58A', red: 'D92D20', green: '0F9147', posterTitle: 'FFFFFF', posterBody: 'C9D6FF', posterKey: 'FFE58A',
  qbox: 'EAF2FD', qline: '7FA894', keybox: 'EEF6EF', keyline: '2E7D4F', keyText: '1F6B3A', keyCap: '3F5F4C', cover: '1A3DB0', rule: 'DCE3F0' };
const TONES = { white: 'FFFFFF', light: 'C9D6FF', navy: COLORS.navy, ink: COLORS.ink };

// На синем главное — жёлтым цветом текста (правило стиля Академии), на белом — жёлтым маркером.
// На белых слайдах мастер-майнда главное — синим жирным (как в образце основателя).
export function runs(text, base = {}, onBlue = false, mm = false) {
  const out = [];
  String(text).split(/(\[\[[\s\S]*?\]\])/).forEach(part => {
    if (!part) return;
    const m = part.match(/^\[\[([\s\S]*)\]\]$/);
    const hi = onBlue ? { color: COLORS.posterKey } : mm ? { color: COLORS.title, bold: true } : { highlight: COLORS.marker };
    out.push(m ? { text: m[1], options: { ...base, ...hi } } : { text: part, options: { ...base } });
  });
  return out.length ? out : [{ text: '', options: { ...base } }];
}
export const plainText = t => String(t).replace(/\[\[([\s\S]*?)\]\]/g, '$1');
const onBlueTpl = tpl => !!tpl.poster || tpl.style === 'mmCover';

export function textColor(slide, b) {
  const tpl = TEMPLATES[slide.tpl] || {};
  if (b.tone && TONES[b.tone]) return TONES[b.tone];
  if (tpl.poster) return b.role === 'title' ? COLORS.posterTitle : COLORS.posterBody;
  if (b.role === 'key') return COLORS.keyText;
  if (tpl.style === 'mm') return b.role === 'title' ? COLORS.navy : COLORS.ink;
  return b.role === 'title' ? COLORS.title : COLORS.ink;
}

// Поля внутри блока (px слайда): плашки стиля Академии, плашка вопроса, блок «Главное».
export const padOf = b => b.qbox ? { x: 40, y: 28 } : b.keybox ? { x: 34, y: 70 } : b.plate ? { x: 48, y: b.tag ? 120 : 36 } : { x: 0, y: 0 };

// «Главное»: строки «значение — подпись». Разделитель « — » — разметка: значение крупно, подпись мелко.
export function keyLines(text) {
  return String(text).split('\n').filter(l => l.trim()).map(l => {
    const i = l.indexOf(' — ');
    return i < 0 ? { value: l, cap: '' } : { value: l.slice(0, i), cap: l.slice(i + 3) };
  });
}

// Оформление слайда, которое рисует код (не блоки): полосы, линии, подложки.
export function slideDecor(slide) {
  const tpl = TEMPLATES[slide.tpl] || {};
  const out = [];
  if (tpl.style === 'mm') {
    out.push({ x: 0, y: 0, w: 1920, h: 10, color: COLORS.frame });
    out.push({ x: 110, y: 996, w: 1700, h: 2, color: COLORS.rule });
    out.push({ x: 110, y: 74, w: 44, h: 4, color: COLORS.keyline });
  }
  if (tpl.style === 'mmCover' && tpl.photo) out.push({ x: 960, y: 0, w: 960, h: 1080, img: tpl.photo });
  for (const b of slide.blocks) {
    if (b.type !== 'text') continue;
    if (b.qbox) { out.push({ x: b.x, y: b.y, w: b.w, h: b.h, color: COLORS.qbox }); out.push({ x: b.x, y: b.y, w: 6, h: b.h, color: COLORS.qline }); }
    if (b.keybox && b.text) { out.push({ x: b.x, y: b.y, w: b.w, h: b.h, color: COLORS.keybox }); out.push({ x: b.x, y: b.y, w: 6, h: b.h, color: COLORS.keyline }); }
  }
  return out;
}

// Подписи шаблона (не текст пользователя). num — номер слайда для подвала мастер-майнда.
export function slideLabels(slide, num) {
  const tpl = TEMPLATES[slide.tpl] || {};
  const out = [];
  if (tpl.style === 'mm') {
    const top = tpl.mm && slide.meta ? `Вопрос ${slide.meta.qnum}${slide.meta.qname ? ' · ' + slide.meta.qname : ''}` : tpl.top;
    if (top) out.push({ text: top.toUpperCase(), x: 172, y: 60, w: 1300, size: 24, color: '#0038B0', spacing: 2 });
    if (tpl.mm && slide.meta) {
      const body = slide.blocks.find(b => b.role === 'body');
      const step = slide.meta.key && slide.meta.key !== 'start' ? ' · ' + PART_NAMES_SHORT[slide.meta.key] : '';
      if (body) out.push({ text: `Ответ на вопрос ${slide.meta.qnum}${step}`, x: body.x, y: body.y - 76, w: 1300, size: 40, color: '#000C3F' });
      const key = slide.blocks.find(b => b.role === 'key' && b.text);
      if (key) out.push({ text: 'Главное', x: key.x + 34, y: key.y + 24, w: key.w - 50, size: 24, color: '#2E6B47' });
    }
    out.push({ text: 'Мастер-майнд', x: 110, y: 1014, w: 600, size: 24, color: '#0038B0', normal: true });
    if (num) out.push({ text: String(num).padStart(2, '0'), x: 1610, y: 1014, w: 200, size: 24, color: '#0038B0', normal: true, align: 'right' });
  } else if (slide.label || tpl.label) {
    out.push({ text: slide.label || tpl.label, x: CARD.x + 128, y: CARD.y + 96, w: 1200, size: 40, color: '#5A6385' });
  }
  return out;
}

export function slideToPptx(slide, num) {
  const tpl = TEMPLATES[slide.tpl] || {};
  const box = o => ({ x: IN(o.x), y: IN(o.y), w: IN(o.w), h: IN(o.h) });
  const ops = [];
  if (tpl.style === 'mm') ops.push({ kind: 'frame', color: 'FFFFFF' });
  else if (tpl.style === 'mmCover') ops.push({ kind: 'frame', color: COLORS.cover });
  else ops.push({ kind: 'frame', color: COLORS.frame }, { kind: 'card', ...box(CARD), radius: IN(29), poster: !!tpl.poster });
  for (const d of slideDecor(slide)) ops.push(d.img ? { kind: 'decorImage', src: d.img, ...box(d) } : { kind: 'rect', ...box(d), color: d.color });
  for (const b of slide.blocks) {
    if (b.type === 'photo') { if (b.src) ops.push({ kind: 'image', blockId: b.id, ...box(b) }); continue; }
    if (b.plate) ops.push({ kind: 'plate', ...box(b), radius: IN(24), color: COLORS.plate });
    if (b.tag) ops.push({ kind: 'label', text: b.tag === 'minus' ? '✕ Неправильно' : '✓ Правильно', color: b.tag === 'minus' ? COLORS.red : COLORS.green,
      x: IN(b.x + 48), y: IN(b.y + 36), w: IN(b.w - 96), h: IN(70), fontSize: 20, fontFace: 'Noto Sans', bold: true });
    if (b.role === 'key' && !b.text) continue;                // пустое «Главное» на слайд не попадает
    const pad = padOf(b);
    const color = textColor(slide, b);
    const mm = tpl.style === 'mm';
    const text = b.role === 'key'
      ? keyLines(b.text).flatMap((l, i, all) => [
          { text: l.value, options: { bold: true, color, fontSize: b.size / 2, breakLine: !!l.cap || i < all.length - 1 } },
          ...(l.cap ? [{ text: l.cap, options: { bold: false, color: COLORS.keyCap, fontSize: 13, breakLine: i < all.length - 1 } }] : [])])
      : b.role === 'toc'
      ? tocItems(b.text).flatMap((it, i, all) => [
          ...(it.label ? [{ text: it.label, options: { bold: true, color: COLORS.title, fontSize: 12, charSpacing: 2, breakLine: true } }] : []),
          ...runs(it.text, { bold: false, color: COLORS.navy, fontSize: b.size / 2 }, false, mm).map((r, j, rr) => j === rr.length - 1 ? { ...r, options: { ...r.options, breakLine: i < all.length - 1 } } : r),
          ...(i < all.length - 1 ? [{ text: ' ', options: { fontSize: 10, breakLine: true } }] : [])])
      : runs(b.text, { bold: b.weight === 'bold', color }, onBlueTpl(tpl), mm);
    ops.push({
      kind: 'text', role: b.role, blockId: b.id,
      x: IN(b.x + pad.x), y: IN(b.y + pad.y), w: IN(b.w - 2 * pad.x), h: IN(b.h - 2 * pad.y),
      text, fontFace: 'Noto Sans', fontSize: b.size / 2, bold: b.role === 'key' ? false : b.weight === 'bold', color, align: b.align,
      valign: 'top', margin: 0, fit: 'none', wrap: true, lineSpacingMultiple: b.role === 'title' ? 1.08 : 1.3,
    });
  }
  for (const l of slideLabels(slide, num)) ops.push({ kind: 'label', text: l.text, color: l.color.slice(1), x: IN(l.x), y: IN(l.y), w: IN(l.w), h: IN(l.size * 1.5), fontSize: l.size / 2, fontFace: 'Noto Sans', bold: !l.normal, align: l.align || 'left', charSpacing: l.spacing || 0 });
  if (slide.logo !== false) ops.push({ kind: 'logo', dark: onBlueTpl(tpl), ...box(logoZone(tpl)) });
  return ops;
}

// Пункты «Содержания» и «Выводов»: через пустую строку; первая строка пункта — подпись «ВОПРОС N · ИМЯ», если она есть.
export function tocItems(text) {
  return String(text).split(/\n[ \t]*\n/).filter(p => p.trim()).map(p => {
    const i = p.indexOf('\n');
    const first = i < 0 ? p : p.slice(0, i);
    return /^ВОПРОС \d+/.test(first) && i >= 0 ? { label: first, text: p.slice(i + 1) } : { label: '', text: p };
  });
}
