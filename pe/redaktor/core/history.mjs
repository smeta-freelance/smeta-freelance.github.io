// Отменить / Вернуть: стек снимков. Снимки — глубокие копии, текст возвращается ровно таким, каким был.
export function createHistory(initial, limit = 200) {
  let stack = [structuredClone(initial)], i = 0;
  return {
    push(state) { stack = stack.slice(0, i + 1); stack.push(structuredClone(state)); if (stack.length > limit) stack.shift(); i = stack.length - 1; },
    undo() { if (i > 0) i--; return this.current(); },
    redo() { if (i < stack.length - 1) i++; return this.current(); },
    current: () => structuredClone(stack[i]),
    canUndo: () => i > 0,
    canRedo: () => i < stack.length - 1,
    reset(state) { stack = [structuredClone(state)]; i = 0; },
  };
}
