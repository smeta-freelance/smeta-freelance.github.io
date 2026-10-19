/*
  Отправка ответов эксперта в базу Академии (Supabase, проект smeta-freelance) — та же схема, что у других
  страниц согласования: ответ — строка в таблице sf_comments (section = mahalova-urok4-skhema),
  голосовые — файлы в хранилище sf-voice (папка mahalova-urok4/). Публичный ключ — тот же, что на других
  страницах Академии; чтение голосовых со страниц закрыто правилами доступа.
*/
window.ASD_CONFIG = {
  SUPABASE_URL: 'https://twtxrtgknenldyqmwymy.supabase.co',
  SUPABASE_KEY: 'sb_publishable_N5Zaxf5mfaMc67JoaCWxVA_fp_fnlLE',
  BUCKET: 'sf-voice',
  TABLE: 'sf_comments',
  SECTION: 'mahalova-urok4-skhema',
  AUTHOR: 'Лариса Владимировна Махалова',
};

function asdVoter() {
  try {
    var v = localStorage.getItem('asd-voter');
    if (!v) { v = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); localStorage.setItem('asd-voter', v); }
    return v;
  } catch (e) { return 'v-nostore'; }
}

/**
 * @param {object} data        — итоговый JSON (schema "asd-marker-points/1")
 * @param {Array}  audioBlobs  — [{ screen, places:[n...], file, mime, blob }]
 */
window.sendAnswers = async function sendAnswers(data, audioBlobs) {
  var C = window.ASD_CONFIG;
  var H = { apikey: C.SUPABASE_KEY, Authorization: 'Bearer ' + C.SUPABASE_KEY };
  var stamp = new Date().toISOString().replace(/[:.]/g, '-');
  for (var i = 0; i < (audioBlobs || []).length; i++) {
    var a = audioBlobs[i];
    var ext = /mp4|m4a|aac/.test(a.mime) ? 'm4a' : (/ogg/.test(a.mime) ? 'ogg' : 'webm');
    var path = 'mahalova-urok4/' + stamp + '_ekran' + a.screen + '.' + ext;
    var up = await fetch(C.SUPABASE_URL + '/storage/v1/object/' + C.BUCKET + '/' + path, {
      method: 'POST', headers: Object.assign({ 'Content-Type': a.mime || 'audio/webm' }, H), body: a.blob });
    if (!up.ok) throw new Error('Голосовое сообщение не загрузилось (' + up.status + ').');
    (data.screens || []).forEach(function (s) { if (s.voice && s.voice.file === a.file) s.voice.path = path; });
    (data.places || []).forEach(function (p) { if (p.voice && p.voice.file === a.file) p.voice.path = path; });
  }
  var r = await fetch(C.SUPABASE_URL + '/rest/v1/' + C.TABLE, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }, H),
    body: JSON.stringify({ section: C.SECTION, voter: asdVoter(), author: C.AUTHOR, body: JSON.stringify(data) }) });
  var txt = await r.text();                       // return=minimal → пустое тело, r.json() не вызываем
  if (!r.ok) throw new Error('Сервер ответил ' + r.status + (txt ? ': ' + txt.slice(0, 200) : ''));
  return { ok: true, message: 'Ответы получены' };
};
