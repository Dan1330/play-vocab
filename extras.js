// Extras: estadísticas (palabras difíciles y récords), "¡Casi!", código QR, reacciones y panel de música.

// ---------- Estadísticas guardadas en este dispositivo ----------
const Stats = (() => {
  const data = { w: {}, best: {}, streak: 0 };
  try { Object.assign(data, JSON.parse(localStorage.getItem('vd_stats') || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem('vd_stats', JSON.stringify(data)); } catch (e) {} };
  const rate = s => s.bad / (s.ok + s.bad);
  const dayOf = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  // Días seguidos estudiando (cuenta el día en que contestas algo)
  function touchDay() {
    const days = data.days || (data.days = { last: '', streak: 0, best: 0 });
    const today = dayOf(new Date());
    if (days.last === today) return;
    const yesterday = dayOf(new Date(Date.now() - 864e5));
    days.streak = days.last === yesterday ? days.streak + 1 : 1;
    days.best = Math.max(days.best, days.streak);
    days.last = today;
  }
  return {
    record(key, ok) {
      const s = data.w[key] || (data.w[key] = { ok: 0, bad: 0 });
      if (ok) s.ok++; else s.bad++;
      s.run = ok ? (s.run || 0) + 1 : 0; // aciertos seguidos
      touchDay();
      save();
    },
    // racha de días (0 si ayer no estudiaste)
    get dayStreak() {
      const days = data.days;
      if (!days) return 0;
      return days.last === dayOf(new Date()) || days.last === dayOf(new Date(Date.now() - 864e5)) ? days.streak : 0;
    },
    get studiedToday() { return !!data.days && data.days.last === dayOf(new Date()); },
    word(key) { return data.w[key] || { ok: 0, bad: 0 }; },
    // Nivel: 0 sin ver · 1 aprendiendo · 2 casi · 3 dominada (3 aciertos seguidos)
    level(key) {
      const s = data.w[key];
      if (!s) return 0;
      return s.run >= 3 ? 3 : s.run === 2 ? 2 : 1;
    },
    // Las que más te cuestan: las fallas al menos 1 de cada 3 veces (máx. 15).
    // filter: para separar palabras y expresiones
    hardKeys(filter = () => true) {
      return Object.entries(data.w).filter(([k, s]) => filter(k) && s.bad > 0 && rate(s) >= 0.34)
        .sort((a, b) => rate(b[1]) - rate(a[1]) || b[1].bad - a[1].bad)
        .slice(0, 15).map(([k]) => k);
    },
    // Al acabar una práctica: guarda y devuelve los récords superados
    finishPractice(set, pct, total, streak) {
      const out = {};
      const prev = data.best[set];
      if (set && total >= 5 && (!prev || pct > prev.pct)) { out.pct = true; data.best[set] = { pct }; }
      if (streak >= 3 && streak > (data.streak || 0)) { out.streak = true; data.streak = streak; }
      save();
      return out;
    },
    bestPct(set) { return data.best[set] ? data.best[set].pct : null; },
  };
})();

const wordKeyOf = w => w.en.label + '|' + w.es.label;

// ---------- Palabras del examen (elegidas una a una, guardadas en este dispositivo) ----------
const Exam = (() => {
  let keys = new Set(), on = false;
  try {
    keys = new Set(JSON.parse(localStorage.getItem('vd_exam') || '[]'));
    on = localStorage.getItem('vd_exam_on') === '1';
  } catch (e) {}
  const valid = new Set(WORDS.map(wordKeyOf));
  keys = new Set([...keys].filter(k => valid.has(k))); // por si cambiaste alguna palabra en words.js
  const save = () => {
    try {
      localStorage.setItem('vd_exam', JSON.stringify([...keys]));
      localStorage.setItem('vd_exam_on', on ? '1' : '0');
    } catch (e) {}
  };
  return {
    keys: () => [...keys],
    has: k => keys.has(k),
    get count() { return keys.size; },
    set(k, yes) { if (yes) keys.add(k); else keys.delete(k); save(); },
    setMany(list, yes) { list.forEach(k => (yes ? keys.add(k) : keys.delete(k))); save(); },
    get on() { return on && keys.size > 0; }, // usar solo estas palabras al jugar
    set on(v) { on = !!v; save(); },
  };
})();
let examQuery = '';

// ---------- Compartir la lista del examen (enlace o código) ----------
// Cada palabra viaja como una "huella" de 5 letras de cómo está escrita: si luego se añaden
// palabras a words.js, los enlaces antiguos siguen funcionando.
function wordHash(key) {
  let h = 2166136261;
  for (const ch of key) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 60466176).toString(36).padStart(5, '0'); // 36^5 combinaciones
}
const examCode = keys => 'v1-' + keys.map(wordHash).join('');
const examLink = () => location.href.split(/[?#]/)[0] + '?examen=' + examCode(Exam.keys());

// Lee un enlace o un código pegado: { keys, missing } (o null si no es válido)
function parseExamCode(text) {
  const m = String(text || '').match(/v1-([0-9a-z]+)/i);
  if (!m) return null;
  const byHash = new Map(WORDS.map(w => [wordHash(wordKeyOf(w)), wordKeyOf(w)]));
  const keys = new Set();
  let missing = 0;
  for (const chunk of m[1].toLowerCase().match(/.{5}/g) || []) {
    if (byHash.has(chunk)) keys.add(byHash.get(chunk));
    else missing++;
  }
  return { keys: [...keys], missing };
}

let examImport = null; // lista leída, pendiente de importar
function showExamImport(text = '', fromLink = false) {
  $('examImportBox').classList.remove('hidden');
  $('examImportInput').value = text;
  $('examImportTitle').textContent = fromLink ? '📩 Te han pasado una lista de palabras del examen' : '📥 Importar una lista';
  readExamImport();
}

function readExamImport() {
  const text = $('examImportInput').value.trim();
  examImport = text ? parseExamCode(text) : null;
  const info = $('examImportInfo');
  if (!text) info.textContent = 'Pega aquí el enlace o el código que te hayan pasado.';
  else if (!examImport || !examImport.keys.length) info.textContent = '❌ Ese enlace o código no es válido.';
  else info.textContent = `✓ ${plural(examImport.keys.length, 'palabra', 'palabras')}` + (examImport.missing ? ` (${examImport.missing} no existen en esta versión)` : '');
  info.classList.toggle('error', !!text && !(examImport && examImport.keys.length));
  const ok = !!(examImport && examImport.keys.length);
  $('examImportReplace').disabled = !ok;
  $('examImportAdd').disabled = !ok;
}

function applyExamImport(replace) {
  if (!examImport || !examImport.keys.length) return;
  if (replace) Exam.setMany(Exam.keys(), false);
  Exam.setMany(examImport.keys, true);
  toast(`📝 ${plural(examImport.keys.length, 'palabra importada', 'palabras importadas')}`);
  examImport = null;
  $('examImportBox').classList.add('hidden');
  renderExam();
}

// En el móvil abre el menú de compartir; en el ordenador copia el enlace (y lo enseña por si acaso)
function shareExam() {
  if (!Exam.count) return toast('Primero marca alguna palabra');
  const url = examLink();
  $('examLinkBox').classList.remove('hidden');
  $('examLinkBox').value = url;
  if (navigator.share && /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)) {
    navigator.share({ title: 'Palabras del examen', text: `📝 ${Exam.count} palabras del examen para Vocab Duel`, url }).catch(() => {});
  } else {
    copyText(url, `¡Enlace copiado! (${Exam.count} palabras). Pásaselo a quien quieras`);
  }
}

// Temas abiertos en la lista del examen (cerrados se ve mejor cuántas has marcado de cada uno)
const examOpen = new Set(ALL_SETS.length <= 3 ? ALL_SETS : []);
function renderExam() {
  const q = stripAccents(norm(examQuery));
  $('examTotal').textContent = Exam.count ? `${plural(Exam.count, 'palabra seleccionada', 'palabras seleccionadas')}` : 'Aún no has seleccionado ninguna';
  const groupHTML = cat => {
    const words = WORDS.filter(w => w.cat === cat);
    const picked = words.filter(w => Exam.has(wordKeyOf(w))).length;
    const shown = words.filter(w => !q || [...w.en.forms, ...w.es.forms].some(f => stripAccents(f).includes(q)));
    if (!shown.length) return '';
    const open = !!q || examOpen.has(cat); // al buscar se ven todas las que coinciden
    return `<div class="exam-group${open ? ' open' : ''}">
      <div class="exam-head"><button type="button" class="exam-toggle" data-toggle="${esc(cat)}"><span class="cg-arrow">▸</span><b>${esc(VOCAB[cat].name)}</b></button>
        <span class="pill${picked ? ' some' : ''}">${picked} de ${words.length}</span>
        <button type="button" class="btn-mini" data-all="${esc(cat)}">✓ Todas</button>
        <button type="button" class="btn-mini" data-none="${esc(cat)}">✕ Ninguna</button></div>
      ${open ? shown.map(w => {
        const k = wordKeyOf(w);
        const on = Exam.has(k);
        return `<label class="exam-word${on ? ' on' : ''}"><input type="checkbox" data-key="${esc(k)}"${on ? ' checked' : ''}>
          <span class="cbox"></span><span class="ew-en">${esc(w.en.label)}</span><span class="ew-es">${esc(w.es.label)}</span></label>`;
      }).join('') : ''}</div>`;
  };
  setHTML($('examList'), GROUPS.map(g => {
    const html = ALL_SETS.filter(k => groupOf(k) === g).map(groupHTML).join('');
    return html && GROUPS.length > 1 ? `<div class="exam-gtitle">${esc(g)}</div>${html}` : html;
  }).join('') || '<p class="msg">No hay ninguna palabra con esa búsqueda.</p>');
  $('examPractice').classList.toggle('hidden', !Exam.count || role === 'host' || role === 'guest');
  $('examShare').disabled = !Exam.count;
  $('homeExamBtn').textContent = Exam.count ? `📝 Palabras del examen (${Exam.count})` : '📝 Palabras del examen';
}

function openExam() {
  if (S && ['countdown', 'question', 'reveal'].includes(S.phase)) return;
  renderExam();
  $('examModal').classList.remove('hidden');
}

// Al cerrar: si hay palabras elegidas, se activa "Solo las del examen" en todos los modos
function closeExam() {
  if ($('examModal').classList.contains('hidden')) return;
  $('examModal').classList.add('hidden');
  Exam.on = Exam.count > 0;
  examChanged();
}

// ---------- "¡Casi!": qué letras sobran y cuáles faltan (levenshtein está en words.js) ----------
// La respuesta aceptada más parecida a lo que has escrito
function closestAnswer(text, reveal) {
  const input = norm(text);
  let best = null;
  for (const f of expandForms([reveal.answer, ...reveal.also])) {
    const d = levenshtein(Array.from(stripAccents(input)), Array.from(stripAccents(f)));
    if (!best || d < best.d) best = { target: f, d };
  }
  return best && { input, ...best };
}

function diffMarks(a, b) {
  const A = Array.from(a), B = Array.from(b);
  const L = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
  for (let i = A.length - 1; i >= 0; i--) {
    for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  }
  let i = 0, j = 0, outA = '', outB = '';
  while (i < A.length || j < B.length) {
    if (i < A.length && j < B.length && A[i] === B[j]) { outA += esc(A[i++]); outB += esc(B[j++]); }
    else if (j < B.length && (i === A.length || L[i][j + 1] >= L[i + 1][j])) outB += `<mark class="miss">${esc(B[j++])}</mark>`;
    else outA += `<mark class="extra">${esc(A[i++])}</mark>`;
  }
  return { a: outA, b: outB };
}

// Frases: qué palabras sobran (tachadas) y cuáles faltan (resaltadas)
function wordDiff(a, b) {
  const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  }
  const outA = [], outB = [];
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) { outA.push(esc(a[i++])); outB.push(esc(b[j++])); }
    else if (j < b.length && (i === a.length || L[i][j + 1] >= L[i + 1][j])) outB.push(`<mark class="miss">${esc(b[j++])}</mark>`);
    else outA.push(`<mark class="extra">${esc(a[i++])}</mark>`);
  }
  return { a: outA.join(' '), b: outB.join(' ') };
}

function phraseAlmost(res, reveal) {
  const a = phraseWords(res.text, false);
  let best = null;
  for (const t of [reveal.answer, ...reveal.also].flatMap(expandPhrase)) {
    const b = phraseWords(t, false);
    const d = levenshtein(a, b);
    if (!best || d < best.d) best = { b, d };
  }
  if (!best) return { near: false, html: '' };
  const d = wordDiff(a, best.b);
  if (res.ok === 2) return { near: false, html: `<div class="diff">✍️ Se escribe: <b>${d.b}</b></div>` };
  const chars = levenshtein(Array.from(stripAccents(a.join(' '))), Array.from(stripAccents(best.b.join(' '))));
  return { near: best.d <= 1 && chars <= 3, html: `<div class="diff">Tú: <span>${d.a || '—'}</span><br>Era: <b>${d.b}</b></div>` };
}

// { near, html }: si has fallado por poco (o te falta una tilde), enseña dónde
function almostInfo(res, reveal) {
  if (!res || !res.text || res.ok === 1 || !reveal || typeof reveal.correct === 'number' || reveal.kind === 'match') return { near: false, html: '' }; // al elegir no
  if (reveal.ph && (!reveal.full || String(reveal.answer).includes(' '))) return phraseAlmost(res, reveal); // frases: palabra a palabra
  const c = closestAnswer(res.text, reveal);
  if (!c) return { near: false, html: '' };
  const d = diffMarks(c.input, c.target);
  if (res.ok === 2) return { near: false, html: `<div class="diff">✍️ Se escribe: <b>${d.b}</b></div>` };
  const near = c.d <= Math.max(1, Math.floor(Array.from(c.target).length / 4));
  return near ? { near, html: `<div class="diff">Tú: <span>${d.a}</span><br>Era: <b>${d.b}</b></div>` } : { near: false, html: '' };
}

// ---------- Portada: panel de progreso y marquesina ----------
function renderDash() {
  const words = WORDS.filter(w => Stats.level(wordKeyOf(w)) === 3).length;
  const phrases = PHRASES.filter(p => Stats.level(phraseKeyOf(p)) === 3).length;
  let grade = null, talks = 0;
  try {
    const ex = JSON.parse(localStorage.getItem('vd_examscores') || '{}');
    for (const s of Object.values(ex)) if (s.sim != null) grade = Math.max(grade || 0, s.sim / 10);
    talks = Object.keys(JSON.parse(localStorage.getItem('vd_talk') || '{}')).length;
  } catch (e) {}
  const streak = Stats.dayStreak;
  const stat = (big, small, label, pct = null, cls = '') => `<div class="stat ${cls}"><div class="s-top"><b>${big}</b><small>${small}</small></div>
    <span class="s-label">${label}</span>${pct === null ? '' : `<div class="bar"><i style="width:${Math.round(pct * 100)}%"></i></div>`}</div>`;
  $('dash').innerHTML = [
    stat(`🔥 ${streak}`, streak === 1 ? 'día' : 'días', streak ? (Stats.studiedToday ? 'Racha de estudio' : '¡Juega hoy para no perderla!') : '¡Empieza tu racha hoy!', null, 'fire'),
    stat(words, `/ ${WORDS.length}`, '🌳 Palabras dominadas', words / WORDS.length),
    stat(phrases, `/ ${PHRASES.length}`, '💬 Frases dominadas', phrases / PHRASES.length),
    grade === null ? stat('—', '', `📝 Simulacro de examen${talks ? ` · 🎭 ${talks}` : ''}`) : stat(String(grade).replace('.', ','), '/ 10', '📝 Mejor simulacro', grade / 10),
  ].join('');
}

// Marquesina con expresiones del PDF (al azar), dos veces seguidas para que dé la vuelta sin cortes
function fillTicker() {
  const list = shuffle(PHRASES.map(p => p.en.replace(/[.!?]+$/, ''))).slice(0, 24);
  const html = list.map(t => `<span>${esc(t)}</span>`).join('');
  $('tickerTrack').innerHTML = html + html;
}

// ---------- Código QR de la sala ----------
function openQR() {
  const box = $('qrBig');
  box.innerHTML = '';
  let ok = false;
  if (window.QRCode) {
    const size = Math.min(320, window.innerWidth - 110);
    new QRCode(box, { text: roomLink(), width: size, height: size, colorDark: '#23124f', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
    ok = true;
  }
  $('qrNote').classList.toggle('hidden', ok);
  $('qrCode').textContent = roomCode;
  $('qrLink').textContent = roomLink();
  $('qrModal').classList.remove('hidden');
}

// ---------- Reacciones ----------
let lastReactAt = 0;
function sendReaction(e) {
  if (Date.now() - lastReactAt < 400) return;
  lastReactAt = Date.now();
  showReaction(me.id, e);
  act('react', { e });
}

function showReaction(id, e) {
  const p = S && S.players.find(x => x.id === id);
  const box = $('reactions');
  const el = document.createElement('div');
  el.className = 'reaction';
  el.style.left = 8 + Math.random() * 78 + '%';
  el.innerHTML = `<span class="r-emoji">${esc(e)}</span><span class="r-who">${p ? `${esc(p.avatar)} ${esc(p.name)}` : ''}</span>`;
  box.appendChild(el);
  setTimeout(() => el.remove(), 2600);
  while (box.children.length > 30) box.firstChild.remove();
}

// ---------- Música: panel y qué debe sonar ----------
let personalYt = null; // tu música de YouTube fuera de las salas
try { personalYt = localStorage.getItem('vd_yt') || null; } catch (e) {}
let musicPanelTimer = null;

const inRoom = () => role === 'host' || role === 'guest';

// En una sala suena la música que ponga el anfitrión (a la vez para todos); fuera, la tuya
function desiredYt() {
  if (inRoom()) {
    if (!S || !S.music) return null;
    return { id: S.music.id, pos: S.music.pos + (Date.now() - (S.music.recv || Date.now())) / 1000 };
  }
  return personalYt ? { id: personalYt, pos: 0 } : null;
}

function paintMusicBtn() {
  $('musicBtn').classList.toggle('off', !Music.enabled);
  $('musicBtn').title = Music.enabled ? 'Música (activada)' : 'Música (apagada)';
}

function renderMusicPanel() {
  const room = inRoom();
  const canSet = !room || role === 'host';
  $('musicToggle').textContent = Music.enabled ? '🔊 Música activada · toca para apagarla' : '🔇 Música apagada · toca para encenderla';
  $('musicToggle').className = 'btn btn-block ' + (Music.enabled ? 'btn-secondary' : 'btn-ghost');
  const yt = desiredYt();
  let now = '🎶 Suena la música del juego (va cambiando de canción sola).';
  if (!Music.enabled) now = 'La música está apagada.';
  else if (yt) now = `▶ Suena en YouTube: <b>${esc(YTMusic.title || 'cargando…')}</b>${room ? ' · para toda la sala' : ''}`;
  if (YTMusic.error) now += `<br><span class="error">${esc(YTMusic.error)}</span>`;
  $('musicNow').innerHTML = now;
  $('ytInput').disabled = !canSet;
  $('ytSet').disabled = !canSet;
  $('ytClear').classList.toggle('hidden', !yt || !canSet);
  $('ytNote').textContent = !room ? 'Fuera de una sala, la música de YouTube solo suena para ti.'
    : canSet ? '🎧 Eres el anfitrión: la música que pongas la escuchará toda la sala.' : '🔒 En la sala, la música la elige el anfitrión.';
}

// Voz en inglés: la más clara va primero (⭐); si no hay ninguna, cómo conseguirla
function renderVoicePanel() {
  const sel = $('voiceSelect');
  const list = Voice.englishVoices();
  for (const b of $('voiceRate').children) b.classList.toggle('on', Number(b.dataset.rate) === Voice.prefs.rate);
  if (!list.length) {
    sel.innerHTML = '<option>(no hay ninguna voz en inglés)</option>';
    sel.disabled = $('voiceTest').disabled = true;
    $('voiceNote').innerHTML = '⚠️ Este navegador no tiene ninguna voz en inglés. Abre el juego en <b>Chrome</b> o <b>Edge</b> (tienen voces muy claras) '
      + 'o instala la voz inglesa en Windows: <i>Configuración → Hora e idioma → Voz → Agregar voces → English (United Kingdom)</i>.';
    return;
  }
  const best = list[0];
  sel.innerHTML = `<option value="">⭐ Automática: ${esc(best.name)}</option>`
    + list.map(v => `<option value="${esc(v.name)}">${Voice.quality(v) >= 45 ? '⭐ ' : ''}${esc(v.name)} (${esc(v.lang)})</option>`).join('');
  sel.value = list.some(v => v.name === Voice.prefs.name) ? Voice.prefs.name : '';
  sel.disabled = $('voiceTest').disabled = false;
  $('voiceNote').textContent = Voice.quality(best) >= 45 ? 'Las voces con ⭐ son las más claras.'
    : 'Para una voz más clara y natural, abre el juego en Microsoft Edge (voces «Natural») o en Chrome (voces de Google).';
}

function openMusic() {
  Voice.onReady(renderVoicePanel);
  renderMusicPanel();
  $('ytMsg').textContent = '';
  $('musicModal').classList.remove('hidden');
  clearInterval(musicPanelTimer);
  musicPanelTimer = setInterval(renderMusicPanel, 800); // para que se vea el título cuando cargue
}

function closeMusic() {
  $('musicModal').classList.add('hidden');
  clearInterval(musicPanelTimer);
}

function setYoutube(text) {
  const id = YTMusic.parseId(text);
  if (!id) {
    $('ytMsg').textContent = 'Ese enlace no parece de YouTube. Copia el enlace del vídeo (por ejemplo https://youtu.be/…).';
    $('ytMsg').classList.add('error');
    return;
  }
  Sound.unlock();
  if (!Music.enabled) { Music.toggle(); paintMusicBtn(); }
  if (inRoom()) { if (role === 'host' && host) host.setMusic(id); }
  else { personalYt = id; local.set('vd_yt', id); }
  $('ytInput').value = '';
  $('ytMsg').textContent = '¡Puesta! Si no empieza a sonar, toca ▶ en el reproductor pequeño.';
  $('ytMsg').classList.remove('error');
  renderMusicPanel();
}

function clearYoutube() {
  if (inRoom()) { if (role === 'host' && host) host.setMusic(null); }
  else { personalYt = null; local.set('vd_yt', ''); }
  $('ytMsg').textContent = '';
  renderMusicPanel();
}
