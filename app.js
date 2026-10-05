// Perfil sin registro, modos de juego (práctica, 1 vs 1, multijugador) y conexión con los demás.
const $ = id => document.getElementById(id);
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FUN_NAMES = ['Foquista', 'Guionista', 'Gaffer', 'Cinéfilo', 'Productor', 'Microfonista', 'Escenógrafo', 'Montador'];
const TIME_OPTIONS = [10, 15, 20, 30, 60];

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

// Ajustes de la práctica: temas marcados, "solo mis difíciles", tiempo e idioma
const soloSettings = (() => {
  const s = { sets: [...ALL_SETS], hard: false, time: 0, dir: 'mix', answer: 'type', exam: Exam.on };
  try {
    const saved = JSON.parse(local.get('vd_solo') || '{}');
    if (validSets(saved.sets).length) s.sets = validSets(saved.sets);
    else if (ALL_SETS.includes(saved.set)) s.sets = [saved.set]; // ajustes de la versión anterior
    s.hard = saved.hard === true || saved.set === 'hard';
    if ([0, ...TIME_OPTIONS].includes(saved.time)) s.time = saved.time;
    if (['mix', 'en', 'es'].includes(saved.dir)) s.dir = saved.dir;
    if (['type', 'quiz'].includes(saved.answer)) s.answer = saved.answer;
  } catch (e) {}
  return s;
})();
const saveSolo = () => local.set('vd_solo', JSON.stringify(soloSettings));

function setsName(st) {
  const names = st.exam ? 'las palabras del examen' : st.sets.length === ALL_SETS.length ? 'todos los temas' : st.sets.map(k => VOCAB[k].name).join(' + ');
  return st.hard ? `en tus difíciles (${names})` : `en ${names}`;
}

// Ajustes con los que se juega la práctica (la lista del examen, en el momento de empezar)
const soloPlaySettings = () => ({ ...soloSettings, exam: soloSettings.exam && Exam.count ? Exam.keys() : null });
// Ajustes de una sala nueva: si tienes palabras del examen activadas, se empieza con ellas
const roomSettings = () => ({ sets: [...ALL_SETS], time: 20, dir: 'mix', answer: 'type', exam: Exam.on ? Exam.keys() : null });

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

// ---------- Ajustes (temas / tiempo / idioma) ----------
// Una casilla por cada tema (bloque) de words.js: si añades temas nuevos, salen solos
$('settings').querySelector('[data-key="sets"]').innerHTML = ALL_SETS.map(k => `<label class="check-chip">
  <input type="checkbox" value="${esc(k)}"><span class="cbox"></span>
  <span class="ctext">${esc(VOCAB[k].name)} <small>${countWords(k)}</small></span></label>`).join('')
  + (ALL_SETS.length > 1 ? '<button type="button" class="check-all">✓ Todos</button>' : '');
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
sBox.querySelector('[data-key="sets"]').insertAdjacentHTML('afterend', `<label class="check-chip hard-chip" id="hardChip">
  <input type="checkbox" value="hard" id="hardChk"><span class="cbox"></span>
  <span class="ctext">🧠 Solo mis difíciles <small></small></span></label>`);

// Ajustes de la práctica, con "Solo mis difíciles" (las palabras que más fallas)
function paintSolo() {
  const n = Stats.hardKeys().length;
  if (!n) soloSettings.hard = false;
  paintSettings($('sSettings'), soloSettings, true);
  $('hardChk').disabled = !n;
  $('hardChip').classList.toggle('disabled', !n);
  $('hardChip').querySelector('small').textContent = n;
  $('hardChip').title = n ? 'Solo las palabras que más fallas de los temas marcados' : 'Juega un poco y aquí saldrán las palabras que más te cuestan';
}

// Casillas de temas: al menos uno marcado siempre
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
    const sets = [...box.querySelectorAll('.checks input:checked')].map(i => i.value);
    if (!sets.length) { inp.checked = true; return toast('Marca al menos un tema'); }
    apply({ sets });
  });
  box.addEventListener('click', e => {
    if (e.target.closest('.check-all')) apply({ sets: [...ALL_SETS] });
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
  return { [key]: key === 'time' ? Number(b.dataset.val) : b.dataset.val };
}
const hostSettings = e => {
  const patch = readSetting(e);
  if (patch && role === 'host' && host) host.setSettings(patch);
};
$('settings').onclick = hostSettings;
$('pSettings').onclick = hostSettings;
$('sSettings').onclick = e => {
  const patch = readSetting(e);
  if (!patch) return;
  Object.assign(soloSettings, patch);
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

// Solo las palabras que más fallas, de los temas marcados
function hardDeck() {
  const keys = new Set(Stats.hardKeys());
  return deckFor(soloPlaySettings()).filter(d => keys.has(wordKey(d.from, d.prompt, d.answer)));
}

function startSolo(deck = null) {
  readProfile();
  Sound.unlock();
  const listKey = soloSettings.exam && Exam.count ? 'examen' : [...soloSettings.sets].sort().join('+');
  soloRun = { key: (soloSettings.hard ? 'hard:' : '') + listKey, name: setsName({ ...soloSettings, exam: soloSettings.exam && Exam.count }), retry: !!deck };
  if (!deck && soloSettings.hard) {
    deck = hardDeck();
    if (!deck.length) return toast('No tienes palabras difíciles en esos temas. ¡Juega un poco primero!');
  }
  stopSolo();
  role = 'solo';
  host = new HostGame('', me, () => {}, applyState, 'solo', soloPlaySettings());
  host.start(deck);
  if (!S) { stopSolo(); showSoloSetup(); toast('No hay palabras en esa lista'); }
}

const wordKey = (from, prompt, answer) => (from === 'en' ? prompt + '|' + answer : answer + '|' + prompt);
function failedDeck() {
  const fails = new Set((S.history || []).filter(h => !(h.results[me.id] || {}).ok).map(h => wordKey(h.from, h.prompt, h.answer)));
  return deckFor({ ...soloSettings, exam: null, sets: [...ALL_SETS] }).filter(d => fails.has(wordKey(d.from, d.prompt, d.answer)));
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
$('soloBtn').onclick = () => { readProfile(); showSoloSetup(); };
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
$('editBtn').onclick = editAnswer;
$('revealBox').onclick = e => { if (e.target.closest('[data-next]') && host) host.skipReveal(); };
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.repeat && host && S && S.mode === 'solo' && S.phase === 'reveal') {
    e.preventDefault();
    host.skipReveal();
  }
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
  const all = e.target.closest('[data-all]'), none = e.target.closest('[data-none]');
  if (!all && !none) return;
  const cat = (all || none).dataset[all ? 'all' : 'none'];
  Exam.setMany(WORDS.filter(w => w.cat === cat).map(wordKeyOf), !!all);
  renderExam();
});
$('examPractice').onclick = () => {
  closeExam();
  soloSettings.exam = true;
  soloSettings.hard = false;
  saveSolo();
  stopSolo();
  readProfile();
  showSoloSetup();
};
renderExam();

// Lista de palabras
$('homeWordsBtn').textContent = `📖 Ver todas las palabras (${WORDS.length})`;
document.querySelectorAll('.words-open').forEach(b => { b.onclick = openWords; });
$('wordsClose').onclick = closeWords;
$('wordsModal').onclick = e => { if (e.target === $('wordsModal')) closeWords(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeWords(); });
$('wordsSearch').oninput = e => { wordsView.q = e.target.value; renderWords(); };
$('wordsCats').onclick = e => {
  const b = e.target.closest('[data-cat]');
  if (b) { wordsView.cat = b.dataset.cat; wordsView.shown.clear(); renderWords(); }
};
$('wordsHide').onclick = e => {
  const b = e.target.closest('[data-hide]');
  if (b) { wordsView.hide = b.dataset.hide; wordsView.shown.clear(); renderWords(); }
};
$('wordsList').onclick = e => { // destapa solo esa palabra
  const c = e.target.closest('[data-reveal]');
  if (!c) return;
  const i = Number(c.dataset.reveal);
  wordsView.shown.add(i);
  c.classList.remove('covered');
  c.removeAttribute('data-reveal');
  c.innerHTML = wordCellHTML(WORDS[i][wordsView.hide]);
};
$('wordsPractice').onclick = () => {
  soloSettings.hard = wordsView.cat === 'hard';
  soloSettings.sets = ALL_SETS.includes(wordsView.cat) ? [wordsView.cat] : [...ALL_SETS];
  saveSolo();
  closeWords();
  stopSolo();
  readProfile();
  showSoloSetup();
};
$('muteBtn').textContent = Sound.muted ? '🔇' : '🔊';
$('muteBtn').onclick = () => { $('muteBtn').textContent = Sound.toggle() ? '🔇' : '🔊'; };

window.addEventListener('beforeunload', e => {
  const playing = S && S.phase !== 'lobby' && S.phase !== 'end';
  const hostingGroup = host && S && S.mode === 'party' && S.players.length > 1;
  if (playing || hostingGroup) { e.preventDefault(); e.returnValue = ''; }
});
window.addEventListener('pagehide', () => {
  if (host) host.close();
  else if (net) net.send({ t: 'bye' });
});

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
