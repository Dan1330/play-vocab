// Perfil sin registro, modos de juego (práctica, 1 vs 1, multijugador) y conexión con los demás.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FUN_NAMES = ['Foquista', 'Guionista', 'Gaffer', 'Cinéfilo', 'Productor', 'Microfonista', 'Escenógrafo', 'Montador'];

const storage = type => ({
  get(k) { try { return window[type].getItem(k); } catch (e) { return null; } },
  set(k, v) { try { window[type].setItem(k, v); } catch (e) {} },
});
const local = storage('localStorage');
const session = storage('sessionStorage');

const me = {
  id: session.get('vd_id') || Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
  name: '',
  avatar: cleanAvatar(local.get('vd_avatar') || AVATARS[Math.floor(Math.random() * AVATARS.length)]),
};
session.set('vd_id', me.id);

let role = null;      // 'host', 'guest' o 'solo'
let net = null;       // conexión
let host = null;      // HostGame (anfitrión y práctica)
let S = null;         // último estado de la partida
let roomCode = '';
let localEndsAt = 0;  // cuándo se acaba el tiempo en este dispositivo
let pending = null;   // respuesta enviada: { round, text, n }
let editing = 0;      // ronda en la que estás editando tu respuesta
let editN = 0;
let actN = 0;         // nº de acción dentro de la ronda (ordena los envíos)
let joined = false, lastSv = 0, lastHostMsg = 0, joinDeadline = 0, guestTimer = null, loops = 0, lastSync = 0;
let handoff = null;   // al pasar el anfitrión: si nadie lo coge, lo recuperas
let soloRun = { key: '', name: '', retry: false }; // qué temas se están practicando (para los récords)

// Ajustes de la práctica: qué practicar, temas o secciones, nº de preguntas, "solo mis difíciles", tiempo…
const soloSettings = (() => {
  const s = { ...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), hard: false, time: 0, exam: Exam.on, learn: true };
  try {
    const saved = JSON.parse(local.get('vd_solo') || '{}');
    if (validSets(saved.sets).length) s.sets = validSets(saved.sets);
    else if (ALL_SETS.includes(saved.set)) s.sets = [saved.set]; // ajustes de la versión anterior
    // si antes tenías marcados todos los temas que había, ahora también entran los nuevos
    if (!('content' in saved) && ['skills', 'film'].every(k => (saved.sets || []).includes(k))) s.sets = [...ALL_SETS];
    if (validPsets(saved.psets).length) s.psets = validPsets(saved.psets);
    if (validTsets(saved.tsets).length) s.tsets = validTsets(saved.tsets);
    s.hard = saved.hard === true || saved.set === 'hard';
    if (CONTENTS.includes(saved.content)) s.content = saved.content;
    if (COUNT_OPTIONS.includes(saved.count)) s.count = saved.count;
    if ([0, ...TIME_OPTIONS].includes(saved.time)) s.time = saved.time;
    if (['mix', 'en', 'es'].includes(saved.dir)) s.dir = saved.dir;
    // los ejercicios marcados (antes se elegía uno solo: "answer" para palabras y "pmode" para expresiones)
    s.wkinds = validKinds(saved.wkinds || (saved.answer ? [saved.answer] : null), 'words');
    s.pkinds = validKinds(saved.pkinds || (saved.pmode && saved.pmode !== 'mix' ? [saved.pmode] : null), 'phrases');
    s.tkinds = validKinds(saved.tkinds, 'texts');
    if (typeof saved.learn === 'boolean') s.learn = saved.learn;
  } catch (e) {}
  return s;
})();
const saveSolo = () => local.set('vd_solo', JSON.stringify(soloSettings));

// "en Guion y narrativa + Iluminación", "en 5 temas", "en todas las expresiones"…
function setsName(st) {
  const short = name => name.replace(/^\d+ · /, '');
  const list = (keys, all, nameOf, many, every) => (keys.length === all.length ? every : keys.length > 3 ? `${keys.length} ${many}` : keys.map(k => short(nameOf(k))).join(' + '));
  if (st.content === 'texts') return `en ${list(st.tsets, ALL_TSETS(), id => textById(id).title, 'textos', 'todos los textos')}`;
  if (st.content === 'phrases') {
    const names = list(st.psets, ALL_PSETS, k => PHRASE_SETS[k].name, 'secciones', 'todas las expresiones');
    return st.hard ? `en tus expresiones difíciles (${names})` : `en ${names}`;
  }
  const names = st.exam ? 'las palabras del examen' : list(st.sets, ALL_SETS, k => VOCAB[k].name, 'temas', 'todos los temas');
  return st.hard ? `en tus difíciles (${names})` : `en ${names}`;
}

// Ajustes con los que se juega la práctica (la lista del examen, en el momento de empezar)
const soloPlaySettings = () => ({ ...soloSettings, exam: soloSettings.exam && Exam.count ? Exam.keys() : null });
// Ajustes de una sala nueva: si tienes palabras del examen activadas, se empieza con ellas
const roomSettings = () => ({ ...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), exam: Exam.on ? Exam.keys() : null });
// "Solo mis difíciles": las palabras, las expresiones o las preguntas de los textos que más fallas
const keyContent = k => (String(k).startsWith('t:') ? 'texts' : isPhraseKey(k) ? 'phrases' : 'words');
const hardList = (content = soloSettings.content) => Stats.hardKeys(k => keyContent(k) === content);

// Cambió la lista del examen o si se usa: lo aplica a la práctica y a tu sala
function examChanged() {
  soloSettings.exam = Exam.on;
  saveSolo();
  if (role === 'host' && host && S && S.phase === 'lobby' && S.mode !== 'solo') host.setSettings({ exam: Exam.on ? Exam.keys() : null });
  paintSolo();
  renderExam();
}

// ---------- Perfil ----------
const randomName = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)] + ' ' + (10 + Math.floor(Math.random() * 90));
$('nameInput').placeholder = randomName;
$('nameInput').value = local.get('vd_name') || '';
$('avatarGrid').innerHTML = AVATARS.map(a => `<button type="button">${a}</button>`).join('');

function paintAvatar() {
  $('avatarBtn').textContent = me.avatar;
  for (const b of $('avatarGrid').children) b.classList.toggle('sel', b.textContent === me.avatar);
}
paintAvatar();
$('avatarBtn').onclick = () => $('avatarGrid').classList.toggle('hidden');
$('avatarGrid').onclick = e => {
  const b = e.target.closest('button');
  if (!b) return;
  me.avatar = b.textContent;
  local.set('vd_avatar', me.avatar);
  paintAvatar();
  $('avatarGrid').classList.add('hidden');
};

function readProfile() {
  const typed = $('nameInput').value.trim();
  local.set('vd_name', typed);
  me.name = cleanName(typed || randomName);
}

function setUrl(url) {
  try { history.replaceState(null, '', url); } catch (e) {} // falla si se abre el archivo con doble clic
}

function homeMsg(text, isError = false) {
  $('homeMsg').textContent = text;
  $('homeMsg').classList.toggle('error', isError);
}

function setHomeBusy(busy) {
  document.querySelectorAll('.mode, #joinBtn').forEach(b => { b.disabled = busy; });
}

function showNet(st) {
  if (!net) return; // avisos de una conexión que ya se está cerrando
  const el = $('netStatus');
  el.classList.remove('hidden');
  el.textContent = st.mqtt > 0 || st.p2p ? '🟢 Conectado' : '🟠 Conectando…';
  el.title = `Servidores: ${st.mqtt}/${st.mqttTotal} · Directo (P2P): ${st.p2p ? 'sí' : 'no'}`;
}

function applyState(snap) {
  if (snap.music) snap.music.recv = Date.now(); // para saber por dónde va la canción de la sala
  const target = Date.now() + snap.remaining;
  if (!S || snap.phase !== S.phase || snap.round !== S.round || Math.abs(target - localEndsAt) > 400) localEndsAt = target;
  S = snap;
  render();
  checkAutoStart();
}

// Acciones del jugador: el anfitrión (o la práctica) las procesa aquí mismo, el resto las envía
function act(t, data = {}) {
  if (host) host.handle({ ...data, t, from: me.id });
  else if (net) net.send({ ...data, t });
}

// ---------- Ajustes (qué practicar / temas / preguntas / tiempo / ejercicio / idioma) ----------
// Una casilla por cada tema (bloque) de words.js, por grupos: si añades temas nuevos, salen solos
const chipHTML = (value, name, n = '', title = '') => `<label class="check-chip"${title ? ` title="${esc(title)}"` : ''}>
  <input type="checkbox" value="${esc(value)}"><span class="cbox"></span>
  <span class="ctext">${esc(name)}${n !== '' ? ` <small>${n}</small>` : ''}</span></label>`;
// Casillas por grupos que se abren y se cierran (si solo hay un grupo, sin cabecera)
const groupedChecks = (groups, allLabel) => (groups.length > 1 ? groups.map(g => `<div class="check-group">
    <div class="cg-head">
      <button type="button" class="cg-toggle"><span class="cg-arrow">▸</span><b>${esc(g.name)}</b><small class="cg-count"></small></button>
      <span class="cg-btns"><button type="button" class="btn-mini cg-all">✓ Todos</button><button type="button" class="btn-mini cg-none">✕ Ninguno</button></span>
    </div>
    <div class="cg-body">${g.chips.join('')}</div>
  </div>`).join('') : groups.flatMap(g => g.chips).join('')) + `<button type="button" class="check-all">✓ ${allLabel}</button>`;
const settingsBox = $('settings');
settingsBox.querySelector('[data-key="sets"]').innerHTML = groupedChecks(GROUPS.map(g => ({
  name: g, chips: ALL_SETS.filter(k => groupOf(k) === g).map(k => chipHTML(k, VOCAB[k].name, countWords(k))),
})), 'Todos los temas');
// Una casilla por cada sección de expresiones (phrases.js) y por cada texto (texts.js)
settingsBox.querySelector('[data-key="psets"]').innerHTML = groupedChecks([{ name: '', chips: ALL_PSETS.map(k => chipHTML(k, PHRASE_SETS[k].name, countPhrases([k]))) }], 'Todas las secciones');
settingsBox.querySelector('[data-key="tsets"]').innerHTML = groupedChecks([
  { name: '📝 Textos tipo examen', chips: allTexts().filter(t => t.group === 'exam').map(t => chipHTML(t.id, `${t.icon} ${t.title}`, '', t.es)) },
  { name: '🎭 Diálogos de las conversaciones', chips: allTexts().filter(t => t.group === 'convo').map(t => chipHTML(t.id, `${t.icon} ${t.title}`, '', t.es)) },
], 'Todos los textos');
// Los ejercicios de cada cosa (kinds.js), con su explicación
for (const [key, content] of [['wkinds', 'words'], ['pkinds', 'phrases'], ['tkinds', 'texts']]) {
  const box = settingsBox.querySelector(`[data-key="${key}"]`);
  box.innerHTML = KINDS[content].map(k => chipHTML(k.id, `${k.icon} ${k.name}`, k.voice ? '🔊' : '', k.desc)).join('')
    + '<button type="button" class="check-all">✓ Todos (mezclados)</button>';
  box.insertAdjacentHTML('afterend', `<details class="kinds-help"><summary>❓ ¿Qué es cada ejercicio?</summary><ul>
    ${KINDS[content].map(k => `<li><b>${k.icon} ${esc(k.name)}</b>: ${esc(k.desc)}${k.voice ? ' <small>(necesita voz en inglés)</small>' : ''}</li>`).join('')}</ul></details>`);
}
$('settings').querySelector('[data-key="sets"]').insertAdjacentHTML('afterend', `<div class="exam-row">
  <label class="check-chip exam-chip"><input type="checkbox" value="exam"><span class="cbox"></span>
  <span class="ctext">📝 Solo las del examen <small></small></span></label>
  <button type="button" class="btn-mini exam-edit">Elegir palabras…</button></div>`);

function cloneSettings(id, slotId) {
  const box = $('settings').cloneNode(true);
  box.id = id;
  $(slotId).replaceWith(box);
  return box;
}
cloneSettings('pSettings', 'pSettingsSlot');
const sBox = cloneSettings('sSettings', 'sSettingsSlot');
sBox.querySelector('[data-key="time"]').insertAdjacentHTML('beforeend', '<button type="button" data-val="0">Sin límite</button>');
sBox.querySelector('.setting').insertAdjacentHTML('afterend', `<div class="setting">
  <span class="label">Modo</span>
  <div class="seg" data-key="learn">
    <button type="button" data-val="true">🧠 Aprender <small>(te explica los fallos y los repasa)</small></button>
    <button type="button" data-val="false">🎯 Normal</button>
  </div></div>`);
sBox.querySelector('[data-for="texts"]').insertAdjacentHTML('afterend', `<label class="check-chip hard-chip" id="hardChip">
  <input type="checkbox" value="hard" id="hardChk"><span class="cbox"></span>
  <span class="ctext">🧠 Solo mis difíciles <small></small></span></label>`);

// Ajustes de la práctica, con "Solo mis difíciles" (las palabras o expresiones que más fallas)
function paintSolo() {
  const n = hardList().length;
  if (!n) soloSettings.hard = false;
  paintSettings($('sSettings'), soloSettings, true);
  $('hardChk').disabled = !n;
  $('hardChip').classList.toggle('disabled', !n);
  $('hardChip').querySelector('small').textContent = n;
  const what = { words: 'las palabras', phrases: 'las expresiones', texts: 'las preguntas' }[soloSettings.content];
  $('hardChip').title = n ? `Solo ${what} que más fallas` : 'Juega un poco y aquí saldrán las que más te cuestan';
  const titles = {
    words: ['🎯 Práctica de palabras', 'Tú solo y sin prisas. Al final puedes repetir las que falles.'],
    phrases: ['💬 Práctica de expresiones', 'Las frases de rodaje del PDF: ordénalas, complétalas, tradúcelas o escúchalas.'],
    texts: ['📝 Práctica de textos', 'Listening y reading como en el examen: huecos, preguntas, verdadero o falso…'],
  }[soloSettings.content];
  $('soloTitle').textContent = titles[0];
  $('soloSub').textContent = titles[1];
  const st = soloPlaySettings();
  const total = poolCount(st), count = settingsCount(st);
  $('soloInfo').textContent = soloSettings.hard ? `🧠 Solo ${what} que más te cuestan`
    : count < total ? `🎲 ${count} ${unitName(st, count)} al azar de ${total}` : `${count} ${unitName(st, count)}`;
}

// Todos los valores de cada grupo de casillas, y el aviso si se intentan desmarcar todas
const allValues = key => ({ sets: ALL_SETS, psets: ALL_PSETS, tsets: ALL_TSETS(), wkinds: kindIds('words'), pkinds: kindIds('phrases'), tkinds: kindIds('texts') }[key]);
const EMPTY_MSG = { sets: 'Marca al menos un tema', psets: 'Marca al menos una sección', tsets: 'Marca al menos un texto' };
const emptyMsg = key => EMPTY_MSG[key] || 'Marca al menos un ejercicio';

// Casillas de temas, secciones, textos y ejercicios: al menos una marcada siempre
function watchChecks(box, apply) {
  box.addEventListener('change', e => {
    const inp = e.target.closest('input[type="checkbox"]');
    if (!inp) return;
    if (inp.value === 'hard') return apply({ hard: inp.checked });
    if (inp.value === 'exam') {
      if (inp.checked && !Exam.count) { inp.checked = false; toast('Primero elige las palabras del examen'); return openExam(); }
      Exam.on = inp.checked;
      return apply({ exam: inp.checked });
    }
    const wrap = inp.closest('.checks');
    const key = wrap.dataset.key; // sets, psets, tsets o los ejercicios (wkinds, pkinds, tkinds)
    const list = [...wrap.querySelectorAll('input:checked')].map(i => i.value);
    if (!list.length) { inp.checked = true; return toast(emptyMsg(key)); }
    apply({ [key]: list });
  });
  box.addEventListener('click', e => {
    const toggle = e.target.closest('.cg-toggle'); // abrir o cerrar un grupo de temas
    if (toggle) {
      const g = toggle.closest('.check-group');
      g.dataset.touched = '1';
      g.classList.toggle('open');
      return;
    }
    const all = e.target.closest('.check-all');
    if (all && !all.disabled) {
      const key = all.closest('.checks').dataset.key;
      return apply({ [key]: [...allValues(key)] });
    }
    const group = e.target.closest('.cg-all, .cg-none'); // todos / ninguno de un grupo
    if (group && !group.disabled) {
      const wrap = group.closest('.checks');
      const key = wrap.dataset.key;
      const keys = [...group.closest('.check-group').querySelectorAll('.cg-body input')].map(i => i.value);
      const now = [...wrap.querySelectorAll('input:checked')].map(i => i.value);
      const next = group.classList.contains('cg-all') ? [...now, ...keys] : now.filter(k => !keys.includes(k));
      if (!next.length) return toast(emptyMsg(key));
      return apply({ [key]: allValues(key).filter(k => next.includes(k)) });
    }
    if (e.target.closest('.exam-edit')) openExam();
  });
}
// En la sala, "exam" viaja como la lista de palabras del anfitrión
const hostPatch = patch => {
  if (!(role === 'host' && host)) return;
  if ('exam' in patch) patch.exam = patch.exam ? Exam.keys() : null;
  host.setSettings(patch);
};
watchChecks($('settings'), hostPatch);
watchChecks($('pSettings'), hostPatch);
watchChecks(sBox, patch => { Object.assign(soloSettings, patch); saveSolo(); paintSolo(); });

function readSetting(e) {
  const b = e.target.closest('button[data-val]');
  if (!b || b.disabled) return null;
  const key = b.parentElement.dataset.key;
  const v = b.dataset.val;
  return { [key]: key === 'time' || key === 'count' ? Number(v) : v === 'true' ? true : v === 'false' ? false : v };
}
// Las frases y los textos llevan más tiempo: al pasar a expresiones o textos, mínimo 30 s por pregunta
const morePhraseTime = (patch, st) => {
  if ((patch.content === 'phrases' || patch.content === 'texts') && st.time && st.time < 30) patch.time = 30;
  return patch;
};
const hostSettings = e => {
  const patch = readSetting(e);
  if (patch && role === 'host' && host) host.setSettings(morePhraseTime(patch, host.settings));
};
$('settings').onclick = hostSettings;
$('pSettings').onclick = hostSettings;
$('sSettings').onclick = e => {
  const patch = readSetting(e);
  if (!patch) return;
  Object.assign(soloSettings, morePhraseTime(patch, soloSettings));
  saveSolo();
  paintSolo();
};

// ---------- Crear sala (1 vs 1 o multijugador) ----------
const newCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

function createRoom(mode, code = null) {
  readProfile();
  Sound.unlock();
  role = 'host';
  roomCode = code || newCode();
  net = Net.create({ code: roomCode, role, myId: me.id, onMessage: m => host && host.handle(m), onStatus: showNet });
  host = new HostGame(roomCode, me, msg => net.send(msg), applyState, mode, roomSettings());
  host.onReact = hostReaction;
  host.broadcast();
}

// las reacciones propias ya se pintan al pulsarlas
const hostReaction = (id, e) => { if (id !== me.id) showReaction(id, e); };

// ---------- 1 vs 1: contra un amigo o rival al azar ----------
let autoStart = false, autoStartTimer = null;

function searchRandom() {
  readProfile();
  Sound.unlock();
  $('duelModal').classList.add('hidden');
  $('searchModal').classList.remove('hidden');
  $('searchInfo').textContent = 'Conectando…';
  Matchmaker.start(me, newCode(), found => {
    $('searchModal').classList.add('hidden');
    Sound.join();
    toast('🎲 ¡Rival encontrado!');
    if (found.role === 'host') {
      autoStart = true;
      createRoom('duel', found.code);
      setTimeout(() => { // si el rival no llega, seguimos buscando
        if (autoStart && role === 'host' && S && S.mode === 'duel' && S.players.length < 2) {
          leaveRoom();
          toast('El rival no llegó; seguimos buscando…');
          searchRandom();
        }
      }, 12000);
    } else {
      joinRoom(found.code);
    }
  }, (others, online) => {
    $('searchInfo').textContent = !online ? 'Conectando…'
      : others ? `${others === 1 ? 'Hay 1 persona' : `Hay ${others} personas`} buscando… emparejando` : 'Esperando a que alguien más busque partida…';
  });
}

function cancelSearch() {
  Matchmaker.stop();
  $('searchModal').classList.add('hidden');
}

// En una partida al azar empieza sola en cuanto entra el rival
function checkAutoStart() {
  if (!autoStart || autoStartTimer || role !== 'host' || !S || S.phase !== 'lobby' || S.players.length < 2) return;
  autoStartTimer = setTimeout(() => {
    autoStartTimer = null;
    autoStart = false;
    if (host && S && S.phase === 'lobby' && S.players.length === 2) host.start();
  }, 2500);
  toast('🎲 ¡Rival encontrado! Empezamos en un momento…');
}

// ---------- Pasar el anfitrión ----------
function passHost(id) {
  const p = S && S.players.find(x => x.id === id);
  if (!host || !p) return;
  if (!p.online) return toast(`${p.name} no está conectado`);
  const state = host.handOver(id);
  if (!state) return toast('Solo se puede pasar el anfitrión entre partidas');
  handoff = { state, until: Date.now() + 9000 };
  host = null;
  switchToGuest();
  toast(`🔑 ${p.name} es ahora el anfitrión`);
}

// Dejas de ser anfitrión y pasas a ser un jugador más de la misma sala
function switchToGuest() {
  const old = net;
  if (old) setTimeout(() => old.destroy(), 300); // deja salir el último mensaje
  role = 'guest';
  joined = false;
  lastSv = 0;
  pending = null;
  net = Net.create({ code: roomCode, role, myId: me.id, onMessage: onGuestMessage, onStatus: showNet });
  joinDeadline = Date.now() + 20000;
  lastHostMsg = Date.now();
  session.set('vd_room', roomCode);
  setUrl('?sala=' + roomCode);
  sendHello();
  clearInterval(guestTimer);
  guestTimer = setInterval(guestLoop, 1000);
  render(); // quita ya los botones de anfitrión
}

// Te pasan el anfitrión: abres la sala con los mismos jugadores, victorias y ajustes
function becomeHost(state) {
  clearInterval(guestTimer);
  guestTimer = null;
  handoff = null;
  const old = net;
  if (old) setTimeout(() => old.destroy(), 300);
  role = 'host';
  net = Net.create({ code: roomCode, role, myId: me.id, onMessage: m => host && host.handle(m), onStatus: showNet });
  host = new HostGame(roomCode, me, msg => net.send(msg), applyState, state.mode, state.settings, state);
  host.onReact = hostReaction;
  host.broadcast();
  $('connLost').classList.add('hidden');
}

// ---------- Práctica ----------
function showSoloSetup() {
  paintSolo();
  showScreen('solo');
}

function stopSolo() {
  if (host) { host.close(); host = null; }
  S = null;
  role = null;
  lastPhase = null;
  lastPlayers = {};
  $('countdown').classList.add('hidden');
  $('reactBar').classList.add('hidden');
}

// Solo las palabras (o expresiones) que más fallas, de lo que tengas marcado
function hardDeck() {
  const keys = new Set(hardList());
  const deck = deckFor(soloPlaySettings(), true).filter(d => keys.has(d.key));
  return soloSettings.count > 0 ? deck.slice(0, soloSettings.count) : deck;
}

function startSolo(deck = null) {
  readProfile();
  Sound.unlock();
  const st = soloSettings, content = st.content;
  const kindsKey = { words: 'wkinds', phrases: 'pkinds', texts: 'tkinds' }[content];
  const kinds = validKinds(st[kindsKey], content);
  if (!canSpeak() && kinds.some(k => kindInfo(content, k).voice)) toast('Este navegador no tiene voz en inglés: los ejercicios de escuchar se cambian por otros');
  // los récords son de cada lista con sus ejercicios
  const lists = { words: st.exam && Exam.count ? 'examen' : [...st.sets].sort().join('+'), phrases: [...st.psets].sort().join('+'), texts: [...st.tsets].sort().join('+') };
  soloRun = { key: `${st.hard ? 'hard:' : ''}${content}:${[...kinds].sort().join('+')}:${lists[content]}`, name: setsName({ ...st, exam: st.exam && Exam.count }), retry: !!deck };
  if (!deck && st.hard) {
    deck = hardDeck();
    if (!deck.length) return toast(`No tienes ${{ words: 'palabras difíciles en esos temas', phrases: 'expresiones difíciles en esas secciones', texts: 'preguntas difíciles en esos textos' }[content]}. ¡Juega un poco primero!`);
  }
  stopSolo();
  role = 'solo';
  host = new HostGame('', me, () => {}, applyState, 'solo', soloPlaySettings());
  host.start(deck);
  if (!S) { stopSolo(); showSoloSetup(); toast('No hay preguntas con esos ajustes: prueba a marcar más temas o ejercicios'); }
}

// "Repetir fallos": todas las que fallaste (sin límite de preguntas)
function failedDeck() {
  const fails = new Set((S.history || []).filter(h => !(h.results[me.id] || {}).ok).map(h => h.key));
  const st = { ...soloSettings, exam: null, hard: false, sets: [...ALL_SETS], psets: [...ALL_PSETS] };
  return deckFor(st, true).filter(d => fails.has(d.key));
}

// ---------- Unirse a una sala ----------
function joinRoom(raw) {
  const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 5) return homeMsg('El código tiene 5 caracteres.', true);
  readProfile();
  Sound.unlock();
  role = 'guest';
  roomCode = code;
  joined = false;
  lastSv = 0;
  S = null;
  pending = null;
  homeMsg(`Conectando con la sala ${code}…`);
  setHomeBusy(true);
  net = Net.create({ code, role, myId: me.id, onMessage: onGuestMessage, onStatus: showNet });
  joinDeadline = Date.now() + 15000;
  lastHostMsg = Date.now();
  session.set('vd_room', code);
  setUrl('?sala=' + code);
  sendHello();
  guestTimer = setInterval(guestLoop, 1000);
}

// j: 0 mientras aún no has recibido el estado de la sala (el anfitrión te lo manda en seguida)
function sendHello() { net.send({ t: 'hello', name: me.name, avatar: me.avatar, j: joined ? 1 : 0 }); }

function guestLoop() {
  const now = Date.now();
  loops++;
  if (!joined) {
    if (handoff && now > handoff.until) { // nadie ha cogido el anfitrión: lo recuperas
      const state = handoff.state;
      becomeHost(state);
      toast('No se pudo pasar el anfitrión; sigues siéndolo tú');
      return;
    }
    if (now > joinDeadline) {
      leaveRoom(false);
      homeMsg('No se encuentra la sala. Revisa el código y que el anfitrión siga con la página abierta.', true);
      return;
    }
    return sendHello();
  }
  const party = S && S.mode === 'party';
  if (loops % (party ? 3 : 2) === 0) sendHello(); // latido para que el anfitrión sepa que sigues aquí
  if (S && S.phase === 'question') {
    // reenvíos por si algún mensaje se perdió
    if (pending && S.round === pending.round && !S.answered[me.id]) {
      net.send({ t: 'answer', round: pending.round, text: pending.text, n: pending.n, choice: pending.choice });
    } else if (editing === S.round && S.answered[me.id]) {
      net.send({ t: 'unanswer', round: editing, n: editN });
    }
  }
  $('connLost').classList.toggle('hidden', now - lastHostMsg < (party ? 10000 : 8000));
}

function onGuestMessage(msg) {
  if (msg.to !== me.id && msg.to !== '*') return;
  lastHostMsg = Date.now();
  if (msg.t === 'full') {
    leaveRoom(false);
    homeMsg(msg.max > 2 ? `La sala está llena (máximo ${msg.max} personas).` : 'Esa sala ya está llena (es 1 vs 1).', true);
  } else if (msg.t === 'closed') {
    leaveRoom(false);
    homeMsg('El anfitrión ha cerrado la sala.', true);
  } else if (msg.t === 'kicked') {
    leaveRoom(false);
    homeMsg('El anfitrión te ha sacado de la sala.', true);
  } else if (msg.t === 'host' && msg.to === me.id && msg.state) {
    becomeHost(msg.state);
    toast('🔑 Ahora eres el anfitrión');
  } else if (msg.t === 'state') {
    if (!msg.s || msg.s.sv <= lastSv || !msg.s.players.some(p => p.id === me.id)) return;
    lastSv = msg.s.sv;
    if (!joined) { joined = true; handoff = null; homeMsg(''); }
    applyState(msg.s);
  } else if (!S) {
    // aún no estás dentro
  } else if (msg.t === 'react') {
    if (msg.id !== me.id) showReaction(msg.id, msg.e);
  } else if ((msg.t === 'ans' || msg.t === 'unans') && S.phase === 'question' && S.round === msg.r) {
    if (msg.t === 'ans') S.answered[msg.id] = true;
    else delete S.answered[msg.id];
    render();
  } else if (msg.t === 'beat' && msg.v !== S.v && Date.now() - lastSync > 2500) {
    lastSync = Date.now();
    net.send({ t: 'sync' }); // me he perdido algún cambio: pido el estado completo
  }
}

// ---------- Salir ----------
function leaveRoom(notify = true) {
  Talk.stop();
  ExamMode.stop();
  clearInterval(guestTimer);
  guestTimer = null;
  autoStart = false;
  clearTimeout(autoStartTimer);
  autoStartTimer = null;
  if (host) { host.close(); host = null; } // avisa a los demás y para la partida
  else if (net && notify) net.send({ t: 'bye' });
  if (net) { const n = net; setTimeout(() => n.destroy(), 400); net = null; }
  role = null;
  S = null;
  joined = false;
  handoff = null;
  pending = null;
  editing = 0;
  roomCode = '';
  lastPhase = null;
  lastPlayers = {};
  lastHostId = '';
  session.set('vd_room', '');
  setUrl(location.pathname);
  $('inviteBanner').classList.add('hidden');
  $('connLost').classList.add('hidden');
  $('countdown').classList.add('hidden');
  $('reactBar').classList.add('hidden');
  $('netStatus').classList.add('hidden');
  setHomeBusy(false);
  renderDash();
  showScreen('home');
}

// ---------- Partida ----------
// choice: casilla elegida en el modo quiz (null al escribir)
function submitAnswer(text, choice = null) {
  if (!S || S.phase !== 'question') return;
  const sent = pending && pending.round === S.round;
  if (editing !== S.round && (S.answered[me.id] || sent)) return;
  editing = 0;
  pending = { round: S.round, text, n: ++actN, choice };
  act('answer', { round: S.round, text, n: pending.n, choice });
  render();
}

function submitChoice(i) {
  if (S && S.q && S.q.options && S.q.options[i] !== undefined) submitAnswer(S.q.options[i], i);
}

function editAnswer() {
  if (!S || S.phase !== 'question' || S.mode === 'solo' || editing === S.round) return;
  editing = S.round;
  editN = ++actN;
  pending = null;
  act('unanswer', { round: S.round, n: editN });
  render();
  $('answerInput').focus();
  $('answerInput').select();
}

function roomLink() { return location.href.split(/[?#]/)[0] + '?sala=' + roomCode; }

async function copyText(text, okMsg) {
  try { await navigator.clipboard.writeText(text); toast(okMsg); }
  catch (e) { window.prompt('Cópialo desde aquí:', text); }
}

function share() {
  navigator.share({ title: 'Vocab Duel', text: `¡Juega conmigo al Vocab Duel! Sala ${roomCode}`, url: roomLink() }).catch(() => {});
}

// ---------- Eventos ----------
function openPractice(content) {
  readProfile();
  Object.assign(soloSettings, morePhraseTime({ content }, soloSettings));
  saveSolo();
  showSoloSetup();
}
$('soloBtn').onclick = () => openPractice('words');
$('phrasesBtn').onclick = () => openPractice('phrases');
$('talkBtn').onclick = () => { readProfile(); Sound.unlock(); Talk.list(); showScreen('talks'); };
$('examModeBtn').onclick = () => { readProfile(); Sound.unlock(); ExamMode.list(); showScreen('exams'); };
$('createBtn').onclick = () => { readProfile(); $('duelModal').classList.remove('hidden'); };
$('duelFriendBtn').onclick = () => { $('duelModal').classList.add('hidden'); createRoom('duel'); };
$('duelRandomBtn').onclick = searchRandom;
$('duelClose').onclick = () => $('duelModal').classList.add('hidden');
$('duelModal').onclick = e => { if (e.target === $('duelModal')) $('duelModal').classList.add('hidden'); };
$('searchCancel').onclick = cancelSearch;
$('partyBtn').onclick = () => createRoom('party');
$('joinForm').onsubmit = e => { e.preventDefault(); joinRoom($('codeInput').value); };
$('codeInput').oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); };

$('copyLinkBtn').onclick = () => copyText(roomLink(), '¡Enlace copiado! Pásaselo a tu rival');
$('pCopyLinkBtn').onclick = () => copyText(roomLink(), '¡Enlace copiado! Pásaselo a los demás');
$('roomCode').onclick = $('pRoomCode').onclick = () => copyText(roomCode, 'Código copiado');
if (navigator.share) {
  for (const id of ['shareBtn', 'pShareBtn']) { $(id).classList.remove('hidden'); $(id).onclick = share; }
}

$('startBtn').onclick = () => host && host.start();
$('pStartBtn').onclick = () => host && host.start();
$('pPlayers').onclick = e => {
  const give = e.target.closest('[data-host]');
  if (give) return giveHost(give.dataset.host);
  const b = e.target.closest('[data-kick]');
  const p = b && S && S.players.find(x => x.id === b.dataset.kick);
  if (p && host && confirm(`¿Sacar a ${p.name} de la sala?`)) host.kick(p.id);
};
$('lobbyPlayers').onclick = e => {
  const give = e.target.closest('[data-host]');
  if (give) giveHost(give.dataset.host);
};
function giveHost(id) {
  const p = S && S.players.find(x => x.id === id);
  if (p && host && confirm(`¿Pasarle el anfitrión a ${p.name}? Podrá empezar partidas y cambiar los ajustes.`)) passHost(id);
}

$('answerForm').onsubmit = e => {
  e.preventDefault();
  const text = $('answerInput').value.trim();
  if (text) submitAnswer(text);
  else $('answerInput').focus();
};
$('skipBtn').onclick = () => submitAnswer('');
$('quizBox').onclick = e => { const b = e.target.closest('[data-choice]'); if (b && !b.disabled) submitChoice(Number(b.dataset.choice)); };
document.addEventListener('keydown', e => { // modo quiz: teclas 1-4
  if (!/^[1-4]$/.test(e.key) || !S || S.phase !== 'question' || !S.q || !S.q.options) return;
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  submitChoice(Number(e.key) - 1);
});
// Ordenar la frase (o las letras): tocas las fichas en orden (y las quitas tocándolas otra vez)
const sendOrder = () => {
  if (S && S.q && S.q.chips && orderPicked.length) submitAnswer(orderPicked.map(i => S.q.chips[i]).join(S.q.kind === 'anagram' ? '' : ' '));
};
// Parejas: tocas una de la izquierda y luego la de la derecha que va con ella
$('matchLeft').onclick = e => {
  const b = e.target.closest('[data-ml]');
  if (!b || b.disabled) return;
  matchSel = Number(b.dataset.ml); // tocarla siempre la elige (aunque ya estuviera elegida)
  render();
};
$('matchRight').onclick = e => {
  const b = e.target.closest('[data-mr]');
  if (!b || b.disabled || !S || !S.q || !S.q.left) return;
  const j = Number(b.dataset.mr);
  const n = S.q.left.length;
  if (matchSel < 0) { // sin elegir: si ya estaba unida, se suelta
    const owner = matchPairs.indexOf(j);
    if (owner >= 0) matchPairs[owner] = -1;
    return render();
  }
  for (let i = 0; i < n; i++) if (matchPairs[i] === j) matchPairs[i] = -1;
  matchPairs[matchSel] = j;
  Sound.tick();
  const next = Array.from({ length: n }, (_, i) => (matchSel + 1 + i) % n).find(i => !(matchPairs[i] >= 0));
  matchSel = next === undefined ? -1 : next;
  render();
};
$('matchReset').onclick = () => { matchPairs = []; matchSel = 0; render(); };
$('matchSend').onclick = () => {
  if (S && S.q && S.q.left && S.q.left.every((_, i) => matchPairs[i] >= 0)) submitAnswer(S.q.left.map((_, i) => matchPairs[i]).join(','));
};
$('orderBank').onclick = e => {
  const b = e.target.closest('[data-pick]');
  if (!b || b.disabled) return;
  orderPicked.push(Number(b.dataset.pick));
  Sound.tick();
  render();
};
$('orderBuilt').onclick = e => {
  const b = e.target.closest('[data-unpick]');
  if (!b || b.disabled) return;
  orderPicked.splice(Number(b.dataset.unpick), 1);
  render();
};
$('orderUndo').onclick = () => { orderPicked.pop(); render(); };
$('orderSend').onclick = sendOrder;
document.addEventListener('keydown', e => { // ordenar (palabras o letras): Enter comprueba, Retroceso quita la última
  if (!S || S.phase !== 'question' || !S.q || inputOf(S.q.kind) !== 'order' || $('orderSend').disabled) return;
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  if (e.key === 'Enter') { e.preventDefault(); sendOrder(); }
  else if (e.key === 'Backspace') { e.preventDefault(); orderPicked.pop(); render(); }
});
// Dictado: volver a escuchar la frase (normal o más despacio)
$('listenBtn').onclick = () => { if (S && S.q && S.q.say) Teach.speak(S.q.say, 'en'); };
$('listenSlowBtn').onclick = () => { if (S && S.q && S.q.say) Teach.speak(S.q.say, 'en', { rate: 0.6 }); };
$('editBtn').onclick = editAnswer;
// Modo aprender: comprueba la palabra (o frase) reescrita y, si está bien, sigue
function checkRetype() {
  const inp = document.getElementById('retypeInput');
  const card = host && S && host.deck[S.round - 1];
  if (!inp || !card) return;
  if (checkCard(card, inp.value)) {
    Sound.correct();
    host.revealAt = 0;
    host.skipReveal();
  } else {
    Sound.wrong();
    shake(inp);
    inp.select();
    toast('Todavía no: fíjate bien en la respuesta');
  }
}
$('revealBox').onclick = e => {
  const say = e.target.closest('[data-say]');
  if (say) return Teach.speak(say.dataset.text, say.dataset.say, { rate: Number(say.dataset.rate) || 0 });
  if (e.target.closest('[data-retype]')) return checkRetype();
  if (e.target.closest('[data-next]') && host) host.skipReveal();
};
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.repeat || !host || !S || S.mode !== 'solo' || S.phase !== 'reveal') return;
  e.preventDefault();
  if (document.getElementById('retypeInput')) checkRetype(); // hay que escribirla bien para seguir
  else host.skipReveal();
});
$('endGameBtn').onclick = () => {
  if (!host || !S) return;
  if (S.mode === 'solo') {
    if (host.history.length) host.endGame();
    else { stopSolo(); showSoloSetup(); }
    return;
  }
  if (confirm('¿Terminar la partida ahora? Nadie sale de la sala: se verán los resultados hasta aquí.')) host.endGame();
};
$('quitBtn').onclick = () => {
  if (!S) return;
  if (S.mode === 'solo') { stopSolo(); showSoloSetup(); return; }
  if (role === 'host' && S.players.length > 1 && !confirm('Si sales, se cierra la sala para todos. ¿Salir?')) return;
  leaveRoom();
};

$('rematchBtn').onclick = () => act('rematch');
$('toLobbyBtn').onclick = () => host && host.toLobby();
$('peAgainBtn').onclick = () => host && host.start();
$('peLobbyBtn').onclick = () => host && host.toLobby();
$('soloStartBtn').onclick = () => startSolo();
$('seAgainBtn').onclick = () => startSolo();
$('seRetryBtn').onclick = () => { const deck = failedDeck(); if (deck.length) startSolo(deck); };
$('seSettingsBtn').onclick = () => { stopSolo(); showSoloSetup(); };
document.querySelectorAll('.leave-btn').forEach(b => { b.onclick = () => leaveRoom(); });

// Música (botón 🎵 de arriba) y YouTube
paintMusicBtn();
$('musicBtn').onclick = () => { Sound.unlock(); openMusic(); };
$('musicClose').onclick = closeMusic;
$('musicModal').onclick = e => { if (e.target === $('musicModal')) closeMusic(); };
$('musicToggle').onclick = () => { Sound.unlock(); Music.toggle(); paintMusicBtn(); renderMusicPanel(); };
$('voiceSelect').onchange = e => { Voice.setVoice(e.target.value); Voice.speak('Quiet on set, please.', 'en'); };
$('voiceTest').onclick = () => Voice.speak("Quiet on set, please. We're going live in two minutes.", 'en');
$('voiceRate').onclick = e => {
  const b = e.target.closest('[data-rate]');
  if (!b) return;
  Voice.setRate(Number(b.dataset.rate));
  renderVoicePanel();
  Voice.speak('Stand by. Rolling. And... action!', 'en');
};
$('ytForm').onsubmit = e => { e.preventDefault(); setYoutube($('ytInput').value); };
$('ytClear').onclick = clearYoutube;
$('ytTap').onclick = () => YTMusic.play();
// el audio solo puede empezar después de que toques la página
document.addEventListener('pointerdown', () => Sound.unlock());

// Código QR de la sala
document.querySelectorAll('.qr-open').forEach(b => { b.onclick = openQR; });
$('qrClose').onclick = () => $('qrModal').classList.add('hidden');
$('qrModal').onclick = e => { if (e.target === $('qrModal')) $('qrModal').classList.add('hidden'); };

// Reacciones
$('reactBar').onclick = e => { const b = e.target.closest('[data-e]'); if (b) sendReaction(b.dataset.e); };

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeMusic();
  $('qrModal').classList.add('hidden');
  $('duelModal').classList.add('hidden');
  if (Matchmaker.searching) cancelSearch();
  closeExam();
});

// Palabras del examen
document.querySelectorAll('.exam-open').forEach(b => { b.onclick = openExam; });
$('examClose').onclick = closeExam;
$('examDone').onclick = closeExam;
$('examModal').onclick = e => { if (e.target === $('examModal')) closeExam(); };
const examMatches = () => {
  const q = stripAccents(norm(examQuery));
  return q ? WORDS.filter(w => [...w.en.forms, ...w.es.forms].some(f => stripAccents(f).includes(q))) : [];
};
function refreshExamSearch() {
  const found = examMatches();
  $('examAddFound').classList.toggle('hidden', !found.length);
  $('examAddFound').textContent = `✓ Marcar las encontradas (${found.length})`;
  renderExam();
}
$('examSearch').oninput = e => { examQuery = e.target.value; refreshExamSearch(); };
$('examSearch').onkeydown = e => { // Enter: marca la primera que coincida y deja el buscador listo para la siguiente
  if (e.key !== 'Enter') return;
  e.preventDefault();
  const found = examMatches();
  const w = found.find(x => !Exam.has(wordKeyOf(x))) || found[0];
  if (!w) return toast('No hay ninguna palabra así');
  Exam.set(wordKeyOf(w), true);
  toast(`✓ ${w.en.label} — ${w.es.label}`);
  examQuery = '';
  e.target.value = '';
  refreshExamSearch();
};
$('examAddFound').onclick = () => {
  const found = examMatches();
  Exam.setMany(found.map(wordKeyOf), true);
  toast(`✓ ${plural(found.length, 'palabra marcada', 'palabras marcadas')}`);
  examQuery = '';
  $('examSearch').value = '';
  refreshExamSearch();
};
$('examClear').onclick = () => {
  if (Exam.count && confirm('¿Quitar todas las palabras del examen?')) { Exam.setMany(Exam.keys(), false); renderExam(); }
};
$('examList').addEventListener('change', e => {
  const inp = e.target.closest('input[data-key]');
  if (inp) { Exam.set(inp.dataset.key, inp.checked); renderExam(); }
});
$('examList').addEventListener('click', e => {
  const toggle = e.target.closest('[data-toggle]'); // abrir o cerrar un tema
  if (toggle) {
    const cat = toggle.dataset.toggle;
    if (examOpen.has(cat)) examOpen.delete(cat); else examOpen.add(cat);
    return renderExam();
  }
  const all = e.target.closest('[data-all]'), none = e.target.closest('[data-none]');
  if (!all && !none) return;
  const cat = (all || none).dataset[all ? 'all' : 'none'];
  Exam.setMany(WORDS.filter(w => w.cat === cat).map(wordKeyOf), !!all);
  renderExam();
});
$('examShare').onclick = shareExam;
$('examLinkBox').onclick = e => e.target.select();
$('examImportBtn').onclick = () => { showExamImport(); $('examImportInput').focus(); };
$('examImportInput').oninput = readExamImport;
$('examImportReplace').onclick = () => applyExamImport(true);
$('examImportAdd').onclick = () => applyExamImport(false);
$('examImportCancel').onclick = () => { examImport = null; $('examImportBox').classList.add('hidden'); };
$('examPractice').onclick = () => {
  closeExam();
  soloSettings.content = 'words';
  soloSettings.exam = true;
  soloSettings.hard = false;
  saveSolo();
  stopSolo();
  readProfile();
  showSoloSetup();
};
renderExam();

// Lista de palabras y expresiones
$('homeWordsBtn').textContent = `📖 Palabras (${WORDS.length}) y expresiones (${PHRASES.length})`;
document.querySelectorAll('.words-open').forEach(b => { b.onclick = openWords; });
$('wordsClose').onclick = closeWords;
$('wordsModal').onclick = e => { if (e.target === $('wordsModal')) closeWords(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeWords(); });
$('wordsSearch').oninput = e => { wordsView.q = e.target.value; renderWords(); };
$('wordsTabs').onclick = e => {
  const b = e.target.closest('[data-tab]');
  if (!b || b.dataset.tab === wordsView.tab) return;
  wordsView.tab = b.dataset.tab;
  wordsView.cat = 'all';
  wordsView.shown.clear();
  renderWords();
};
$('wordsCat').onchange = e => { wordsView.cat = e.target.value; wordsView.shown.clear(); renderWords(); };
$('wordsHide').onclick = e => {
  const b = e.target.closest('[data-hide]');
  if (b) { wordsView.hide = b.dataset.hide; wordsView.shown.clear(); renderWords(); }
};
$('wordsList').onclick = e => {
  const say = e.target.closest('[data-say]'); // 🔊 escuchar la frase
  if (say) return Teach.speak(say.dataset.text, say.dataset.say);
  const c = e.target.closest('[data-reveal]'); // destapa solo esa palabra
  if (!c) return;
  const i = Number(c.dataset.reveal);
  wordsView.shown.add(i);
  c.classList.remove('covered');
  c.removeAttribute('data-reveal');
  c.innerHTML = wordsCellInner(i, wordsView.hide);
};
$('wordsPractice').onclick = () => {
  const phrases = wordsView.tab === 'phrases';
  soloSettings.content = phrases ? 'phrases' : 'words';
  soloSettings.hard = wordsView.cat === 'hard';
  if (phrases) soloSettings.psets = ALL_PSETS.includes(wordsView.cat) ? [wordsView.cat] : [...ALL_PSETS];
  else soloSettings.sets = ALL_SETS.includes(wordsView.cat) ? [wordsView.cat] : [...ALL_SETS];
  morePhraseTime(soloSettings, soloSettings);
  saveSolo();
  closeWords();
  stopSolo();
  readProfile();
  showSoloSetup();
};
$('muteBtn').textContent = Sound.muted ? '🔇' : '🔊';
$('muteBtn').onclick = () => { $('muteBtn').textContent = Sound.toggle() ? '🔇' : '🔊'; };

// Tema claro («Plató») u oscuro («Sala de control»)
function paintThemeBtn() {
  const dark = document.documentElement.dataset.theme === 'dark';
  $('themeBtn').textContent = dark ? '☀️' : '🌙';
  $('themeBtn').title = dark ? 'Cambiar a modo claro («Plató»)' : 'Cambiar a modo oscuro («Sala de control»)';
}
$('themeBtn').onclick = () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  local.set('vd_theme', theme);
  paintThemeBtn();
};
paintThemeBtn();
fillTicker();
renderDash();

window.addEventListener('beforeunload', e => {
  const playing = S && S.phase !== 'lobby' && S.phase !== 'end';
  const hostingGroup = host && S && S.mode === 'party' && S.players.length > 1;
  if (playing || hostingGroup) { e.preventDefault(); e.returnValue = ''; }
});
window.addEventListener('pagehide', () => {
  if (host) host.close();
  else if (net) net.send({ t: 'bye' });
});

// lista del examen compartida por enlace: ?examen=CODIGO
const sharedExam = new URLSearchParams(location.search).get('examen');
if (sharedExam) {
  openExam();
  showExamImport(sharedExam, true);
  setUrl(location.pathname + (new URLSearchParams(location.search).get('sala') ? '?sala=' + new URLSearchParams(location.search).get('sala') : ''));
}

// invitación por enlace: ?sala=CODIGO
const invite = (new URLSearchParams(location.search).get('sala') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
if (invite) {
  $('inviteBanner').classList.remove('hidden');
  $('inviteCode').textContent = invite;
  $('codeInput').value = invite;
  $('joinBtn').className = 'btn btn-primary';
  $('joinBtn').textContent = '¡Unirme!';
  if (session.get('vd_room') === invite) joinRoom(invite); // has recargado la página: vuelves a entrar
}

requestAnimationFrame(frame);
