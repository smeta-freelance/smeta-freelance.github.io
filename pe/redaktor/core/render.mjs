// Слайд → HTML (1920×1080). Один и тот же вид для редактора, миниатюр, показа и PDF.
import { CARD, TEMPLATES, logoZone } from './model.mjs';
import { textColor, slideLabels, slideDecor, padOf, keyLines, tocItems } from './pptx_map.mjs';

// Фото хранятся в презентации отдельно (assets), в блоке — ссылка «asset:…». Экран получает быстрый адрес (Blob).
let resolveSrc = src => src;
export const setSrcResolver = fn => { resolveSrc = fn; };
export const srcOf = src => (src ? resolveSrc(src) : src);

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// «Главное» [[…]] → жёлтый маркер. Сам текст выводится как есть (white-space: pre-wrap).
export const richText = t => esc(t).replace(/\[\[([\s\S]*?)\]\]/g, '<mark>$1</mark>');

const box = b => `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px`;
const weightCss = b => (b.weight === 'bold' ? (b.role === 'title' ? 900 : 800) : 500);

export function photoImgStyle(b) {
  if (!b.src || !b.iw) return '';
  const k = Math.max(b.w / b.iw, b.h / b.ih) * (b.crop?.zoom || 1);
  const dw = b.iw * k, dh = b.ih * k;
  const cx = b.crop?.cx ?? 0.5, cy = b.crop?.cy ?? 0.5;
  return `width:${dw}px;height:${dh}px;left:${(b.w - dw) * cx}px;top:${(b.h - dh) * cy}px`;
}

export function slideHTML(slide, o = {}) {
  const tpl = TEMPLATES[slide.tpl] || {};
  const edit = !!o.edit;
  const cls = tpl.style === 'mm' ? ' mm' : tpl.style === 'mmCover' ? ' cover' : tpl.poster ? ' poster' : '';
  let h = `<div class="S${cls}" data-slide="${slide.id}">` + (tpl.style ? '' : `<div class="card" style="${box(CARD)}"></div>`);
  for (const d of slideDecor(slide)) h += d.img ? `<img class="dec" draggable="false" src="${d.img}" style="${box(d)};object-fit:cover">` : `<div class="dec" style="${box(d)};background:#${d.color}"></div>`;
  for (const l of slideLabels(slide, o.num)) h += `<div class="lbl" style="left:${l.x}px;top:${l.y}px;width:${l.w}px;font-size:${l.size}px;color:${l.color};font-weight:${l.normal ? 500 : 800};text-align:${l.align || 'left'};letter-spacing:${l.spacing ? '.08em' : '0'}">${esc(l.text)}</div>`;
  for (const b of slide.blocks) {
    if (b.type === 'photo') {
      h += `<div class="pb${o.cropId === b.id ? ' cropping' : ''}" data-id="${b.id}" style="${box(b)}">` +
        (b.src ? `<img draggable="false" src="${srcOf(b.src)}" style="${photoImgStyle(b)}">`
               : (edit ? `<div class="pempty">Перетащите фото сюда</div>` : '')) + `</div>`;
      continue;
    }
    const empty = !b.text;
    if (empty && !edit) continue;
    const color = '#' + textColor(slide, b);
    const pd = padOf(b);
    const pad = pd.x || pd.y ? `padding:${pd.y}px ${pd.x}px` : '';
    const inner = empty ? `<span class="ph">${esc(b.ph || 'Текст')}</span>`
      : b.role === 'key' ? keyLines(b.text).map(l => `<div class="kv"><b>${esc(l.value)}</b>${l.cap ? `<span>${esc(l.cap)}</span>` : ''}</div>`).join('')
      : b.role === 'toc' ? tocItems(b.text).map(it => `<div class="ti">${it.label ? `<i>${esc(it.label)}</i>` : ''}${richText(it.text)}</div>`).join('')
      : richText(b.text);
    h += `<div class="tb r-${b.role}${b.plate ? ' plate' : ''}${b.keybox && empty ? ' keyempty' : ''}${empty ? ' empty' : ''}${o.editingId === b.id ? ' editing' : ''}" data-id="${b.id}" ` +
      `style="${box(b)};font-size:${b.size}px;font-weight:${weightCss(b)};text-align:${b.align};color:${color};${pad}">` +
      (b.tag ? `<div class="tag ${b.tag}">${b.tag === 'minus' ? '✕ Неправильно' : '✓ Правильно'}</div>` : '') +
      `<div class="tx">${inner}</div></div>`;
  }
  if (slide.logo !== false) h += `<img class="logo" src="assets/${tpl.poster || tpl.style === 'mmCover' ? 'logo_dark' : 'logo'}.svg" style="${box(logoZone(tpl))}">`;
  const sel = edit && o.selId && slide.blocks.find(b => b.id === o.selId);
  if (sel) h += `<div class="selbox" style="${box(sel)}">${['nw', 'ne', 'sw', 'se'].map(c => `<i class="hd ${c}" data-h="${c}"></i>`).join('')}</div>`;
  return h + '</div>';
}

// Обёртка нужного размера: слайд 1920×1080, уменьшенный до ширины w.
export const scaled = (slide, w, o) =>
  `<div class="sw" style="width:${w}px;height:${Math.round(w * 9 / 16)}px"><div class="sx" style="transform:scale(${w / 1920})">${slideHTML(slide, o)}</div></div>`;
