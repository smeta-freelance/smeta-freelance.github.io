// Хранение в браузере (IndexedDB). Работает без интернета, мгновенно.
const NAME = 'asd-slides', STORE = 'pres';
let dbp;
const open = () => dbp ||= new Promise((ok, bad) => {
  const r = indexedDB.open(NAME, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
  r.onsuccess = () => ok(r.result);
  r.onerror = () => bad(r.error);
});
const tx = async (mode, fn) => {
  const db = await open();
  return new Promise((ok, bad) => {
    const t = db.transaction(STORE, mode), st = t.objectStore(STORE), req = fn(st);
    t.oncomplete = () => ok(req?.result);
    t.onerror = () => bad(t.error);
    t.onabort = () => bad(t.error || new Error('Сохранение прервано'));   // переполнение места, приватный режим
  });
};
export const allPres = () => tx('readonly', s => s.getAll());
export const getPres = id => tx('readonly', s => s.get(id));
export const putPres = p => tx('readwrite', s => s.put(p));
export const delPres = id => tx('readwrite', s => s.delete(id));
