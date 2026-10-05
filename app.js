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

const soloSettings = (() => {
  const s = { set: 'all', time: 0, dir: 'mix' };
  try {
    const saved = JSON.parse(local.get('vd_solo') || '{}');
    if (saved.set === 'all' || Object.keys(VOCAB).includes(saved.set)) s.set = saved.set;
    if ([0, ...TIME_OPTIONS].includes(saved.time)) s.time = saved.time;
    if (['mix', 'en', 'es'].includes(saved.dir)) s.dir = saved.dir;
  } catch (e) {}
  return s;
})();

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
  const target = Date.now() + snap.remaining;
  if (!S || snap.phase !== S.phase || snap.round !== S.round || Math.abs(target - localEndsAt) > 400) localEndsAt = target;
  S = snap;
  render();
}

// Acciones del jugador: el anfitrión (o la práctica) las procesa aquí mismo, el resto las envía
function act(t, data = {}) {
  if (host) host.handle({ ...data, t, from: me.id });
  else if (net) net.send({ ...data, t });
}

// ---------- Ajustes (palabras / tiempo / idioma) ----------
$('settings').querySelector('[data-key="set"]').innerHTML = ['all', ...Object.keys(VOCAB)].map(k =>
  `<button type="button" data-val="${esc(k)}">${k === 'all' ? 'Todas' : esc(VOCAB[k].name)} <small>(${countWords(k)})</small></button>`).join('');

function cloneSettings(id, slotId) {
  const box = $('settings').cloneNode(true);
  box.id = id;
  $(slotId).replaceWith(box);
  return box;
}
cloneSettings('pSettings', 'pSettingsSlot');
cloneSettings('sSettings', 'sSettingsSlot').querySelector('[data-key="time"]')
  .insertAdjacentHTML('beforeend', '<button type="button" data-val="0">Sin límite</button>');

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
  local.set('vd_solo', JSON.stringify(soloSettings));
  paintSettings($('sSettings'), soloSettings, true);
};

// ---------- Crear sala (1 vs 1 o multijugador) ----------
function createRoom(mode) {
  readProfile();
  Sound.unlock();
  role = 'host';
  roomCode = Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  net = Net.create({ code: roomCode, role, myId: me.id, onMessage: m => host && host.handle(m), onStatus: showNet });
  host = new HostGame(roomCode, me, msg => net.send(msg), applyState, mode);
  host.broadcast();
}

// ---------- Práctica ----------
function showSoloSetup() {
  paintSettings($('sSettings'), soloSettings, true);
  showScreen('solo');
}

function stopSolo() {
  if (host) { host.close(); host = null; }
  S = null;
  role = null;
  lastPhase = null;
  lastPlayers = {};
  $('countdown').classList.add('hidden');
}

function startSolo(deck = null) {
  readProfile();
  Sound.unlock();
  stopSolo();
  role = 'solo';
  host = new HostGame('', me, () => {}, applyState, 'solo', soloSettings);
  host.start(deck);
  if (!S) { stopSolo(); showSoloSetup(); toast('No hay palabras en esa lista'); }
}

const wordKey = (from, prompt, answer) => (from === 'en' ? prompt + '|' + answer : answer + '|' + prompt);
function failedDeck() {
  const fails = new Set((S.history || []).filter(h => !(h.results[me.id] || {}).ok).map(h => wordKey(h.from, h.prompt, h.answer)));
  return buildDeck({ ...soloSettings, set: 'all' }).filter(d => fails.has(wordKey(d.from, d.prompt, d.answer)));
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

function sendHello() { net.send({ t: 'hello', name: me.name, avatar: me.avatar }); }

function guestLoop() {
  const now = Date.now();
  loops++;
  if (!joined) {
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
      net.send({ t: 'answer', round: pending.round, text: pending.text, n: pending.n });
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
  } else if (msg.t === 'state') {
    if (!msg.s || msg.s.sv <= lastSv || !msg.s.players.some(p => p.id === me.id)) return;
    lastSv = msg.s.sv;
    if (!joined) { joined = true; homeMsg(''); }
    applyState(msg.s);
  } else if (!S) {
    // aún no estás dentro
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
  if (host) { host.close(); host = null; } // avisa a los demás y para la partida
  else if (net && notify) net.send({ t: 'bye' });
  if (net) { const n = net; setTimeout(() => n.destroy(), 400); net = null; }
  role = null;
  S = null;
  joined = false;
  pending = null;
  editing = 0;
  roomCode = '';
  lastPhase = null;
  lastPlayers = {};
  session.set('vd_room', '');
  setUrl(location.pathname);
  $('inviteBanner').classList.add('hidden');
  $('connLost').classList.add('hidden');
  $('countdown').classList.add('hidden');
  $('netStatus').classList.add('hidden');
  setHomeBusy(false);
  showScreen('home');
}

// ---------- Partida ----------
function submitAnswer(text) {
  if (!S || S.phase !== 'question') return;
  const sent = pending && pending.round === S.round;
  if (editing !== S.round && (S.answered[me.id] || sent)) return;
  editing = 0;
  pending = { round: S.round, text, n: ++actN };
  act('answer', { round: S.round, text, n: pending.n });
  render();
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
$('createBtn').onclick = () => createRoom('duel');
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
  const b = e.target.closest('[data-kick]');
  const p = b && S && S.players.find(x => x.id === b.dataset.kick);
  if (p && host && confirm(`¿Sacar a ${p.name} de la sala?`)) host.kick(p.id);
};

$('answerForm').onsubmit = e => {
  e.preventDefault();
  const text = $('answerInput').value.trim();
  if (text) submitAnswer(text);
  else $('answerInput').focus();
};
$('skipBtn').onclick = () => submitAnswer('');
$('editBtn').onclick = editAnswer;
$('revealBox').onclick = e => { if (e.target.closest('[data-next]') && host) host.skipReveal(); };
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.repeat && host && S && S.mode === 'solo' && S.phase === 'reveal') {
    e.preventDefault();
    host.skipReveal();
  }
});
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
