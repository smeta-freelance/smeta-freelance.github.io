// Презентация и файл-копия («Сохранить файл» / «Открыть файл»). Текст в файле — как есть.
import { uid } from './model.mjs';

export const APP = 'asd-slides', VERSION = 1;

export function newPresentation(title, author) {
  const now = new Date().toISOString();
  return { id: uid('p'), title: title || 'Новая презентация', author: author || 'Команда', created: now, updated: now, slides: [] };
}

export const toFile = p => JSON.stringify({ app: APP, version: VERSION, presentation: p });

export function fromFile(str) {
  let d;
  try { d = JSON.parse(str); } catch { throw new Error('Этот файл — не презентация редактора Академии.'); }
  if (!d || d.app !== APP || !d.presentation || !Array.isArray(d.presentation.slides))
    throw new Error('Этот файл — не презентация редактора Академии.');
  return d.presentation;
}
