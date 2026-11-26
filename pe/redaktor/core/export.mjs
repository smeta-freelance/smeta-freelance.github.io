// Выгрузка: PowerPoint (PptxGenJS в браузере, текст редактируемый) и PDF (печать браузера).
import { slideToPptx } from './pptx_map.mjs';
import { slideHTML, photoImgStyle, srcOf } from './render.mjs';

const toDataURL = url => fetch(url).then(r => r.blob()).then(b => new Promise(ok => { const f = new FileReader(); f.onload = () => ok(f.result); f.readAsDataURL(b); }));

// Фото с обрезкой → готовая картинка точно под размер блока (PowerPoint получает то, что на экране).
async function croppedPhoto(b) {
  const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = srcOf(b.src); });
  const scale = Math.min(2, 1600 / b.w);
  const c = document.createElement('canvas');
  c.width = Math.round(b.w * scale); c.height = Math.round(b.h * scale);
  const g = c.getContext('2d');
  const st = Object.fromEntries(photoImgStyle(b).split(';').map(p => p.split(':')).map(([k, v]) => [k, parseFloat(v)]));
  g.drawImage(img, st.left * scale, st.top * scale, st.width * scale, st.height * scale);
  return c.toDataURL('image/jpeg', 0.9);
}

const splitLines = runs => runs.flatMap(r => {
  const parts = r.text.split('\n');
  return parts.map((t, i) => ({ text: t, options: { ...r.options, ...(i < parts.length - 1 ? { breakLine: true } : {}) } }));
});

export async function exportPptx(pres) {
  const pptx = new window.PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';              // 13,333 × 7,5 дюйма = 1920 × 1080
  pptx.title = pres.title;
  pptx.company = 'Академия Сметного Дела';
  const logos = { light: await toDataURL('assets/logo.png'), dark: await toDataURL('assets/logo_dark.png') };
  for (const [i, slide] of pres.slides.entries()) {
    const s = pptx.addSlide();
    for (const op of slideToPptx(slide, i + 1)) {
      if (op.kind === 'frame') s.background = { color: op.color };
      else if (op.kind === 'card') s.addShape(pptx.ShapeType.roundRect, { x: op.x, y: op.y, w: op.w, h: op.h, rectRadius: op.radius, fill: { color: op.poster ? '1A3DB0' : 'FFFFFF' }, line: { type: 'none' } });
      else if (op.kind === 'decorImage') s.addImage({ data: await toDataURL(op.src), x: op.x, y: op.y, w: op.w, h: op.h });
      else if (op.kind === 'rect') s.addShape(pptx.ShapeType.rect, { x: op.x, y: op.y, w: op.w, h: op.h, fill: { color: op.color }, line: { type: 'none' } });
      else if (op.kind === 'plate') s.addShape(pptx.ShapeType.roundRect, { x: op.x, y: op.y, w: op.w, h: op.h, rectRadius: op.radius, fill: { color: op.color }, line: { type: 'none' } });
      else if (op.kind === 'label') s.addText(op.text, { x: op.x, y: op.y, w: op.w, h: op.h, fontFace: op.fontFace, fontSize: op.fontSize, bold: op.bold !== false, color: op.color, margin: 0, valign: 'top', align: op.align || 'left', charSpacing: op.charSpacing || 0 });
      else if (op.kind === 'text') s.addText(splitLines(op.text), { x: op.x, y: op.y, w: op.w, h: op.h, fontFace: op.fontFace, fontSize: op.fontSize, bold: op.bold, color: op.color, align: op.align, valign: 'top', margin: 0, fit: 'none', wrap: true, lineSpacingMultiple: op.lineSpacingMultiple });
      else if (op.kind === 'image') { const b = slide.blocks.find(x => x.id === op.blockId); s.addImage({ data: await croppedPhoto(b), x: op.x, y: op.y, w: op.w, h: op.h }); }
      else if (op.kind === 'logo') s.addImage({ data: op.dark ? logos.dark : logos.light, x: op.x, y: op.y, w: op.w, h: op.h });
    }
  }
  await pptx.writeFile({ fileName: (pres.title || 'Презентация') + '.pptx' });
}

export function exportPdf(pres) {
  const box = document.createElement('div');
  box.id = 'print';
  box.innerHTML = pres.slides.map((s, i) => `<div class="page">${slideHTML(s, { num: i + 1 })}</div>`).join('');
  document.body.appendChild(box);
  const old = document.title;
  document.title = pres.title || 'Презентация';
  const done = () => { box.remove(); document.title = old; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  document.fonts.ready.then(() => setTimeout(() => window.print(), 50));
}
