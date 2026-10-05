// Perfil sin registro, crear / unirse a sala y conexión con el rival.
const $ = id => document.getElementById(id);
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

let role = null;      // 'host' o 'guest'
let net = null;       // conexión
let host = null;      // HostGame (solo el anfitrión)
let S = null;         // último estado de la partida
let roomCode = '';
let localEndsAt = 0;  // cuándo se acaba el tiempo en este dispositivo
let pending = null;   // respuesta enviada que el anfitrión aún no ha confirmado
let joined = false, lastSv = 0, lastHostMsg = 0, joinDeadline = 0, guestTimer = null, loops = 0;

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

function showNet(st) {
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

// Acciones del jugador: el anfitrión las procesa directamente, el rival las envía
function act(t, data = {}) {
  if (role === 'host') host.handle({ ...data, t, from: me.id });
  else if (net) net.send({ ...data, t });
}

// ---------- Crear sala (anfitrión) ----------
function createRoom() {
  readProfile();
  Sound.unlock();
  role = 'host';
  roomCode = Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
  net = Net.create({ code: roomCode, role, myId: me.id, onMessage: m => host && host.handle(m), onStatus: showNet });
  host = new HostGame(roomCode, me, msg => net.send(msg), applyState);
  host.broadcast();
}

// ---------- Unirse (rival) ----------
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
  $('createBtn').disabled = $('joinBtn').disabled = true;
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
      homeMsg('No se encuentra la sala. Revisa el código y que tu rival siga con la página abierta.', true);
      return;
    }
    return sendHello();
  }
  if (loops % 2 === 0) sendHello(); // latido para que el anfitrión sepa que sigues aquí
  if (pending && S && S.phase === 'question' && S.round === pending.round && !S.answered[me.id]) {
    net.send({ t: 'answer', round: pending.round, text: pending.text }); // reenvío por si se perdió
  }
  $('connLost').classList.toggle('hidden', now - lastHostMsg < 8000);
}

function onGuestMessage(msg) {
  if (msg.to !== me.id) return;
  lastHostMsg = Date.now();
  if (msg.t === 'full') {
    leaveRoom(false);
    homeMsg('Esa sala ya está llena (es 1 vs 1).', true);
  } else if (msg.t === 'closed') {
    leaveRoom(false);
    homeMsg('El anfitrión ha cerrado la sala.', true);
  } else if (msg.t === 'state' && msg.s && msg.s.sv > lastSv && msg.s.players.some(p => p.id === me.id)) {
    lastSv = msg.s.sv;
    if (!joined) { joined = true; homeMsg(''); }
    applyState(msg.s);
  }
}

// ---------- Salir ----------
function leaveRoom(notify = true) {
  clearInterval(guestTimer);
  guestTimer = null;
  if (host) { host.close(); host = null; } // avisa al rival y para la partida
  else if (net && notify) net.send({ t: 'bye' });
  if (net) { const n = net; setTimeout(() => n.destroy(), 400); net = null; }
  role = null;
  S = null;
  joined = false;
  pending = null;
  roomCode = '';
  lastPhase = null;
  lastPlayers = '';
  session.set('vd_room', '');
  setUrl(location.pathname);
  $('inviteBanner').classList.add('hidden');
  $('connLost').classList.add('hidden');
  $('countdown').classList.add('hidden');
  $('netStatus').classList.add('hidden');
  $('createBtn').disabled = $('joinBtn').disabled = false;
  showScreen('home');
}

// ---------- Partida ----------
function submitAnswer(text) {
  if (!S || S.phase !== 'question' || S.answered[me.id] || (pending && pending.round === S.round)) return;
  pending = { round: S.round, text };
  act('answer', { round: S.round, text });
  render();
}

function roomLink() { return location.href.split(/[?#]/)[0] + '?sala=' + roomCode; }

async function copyText(text, okMsg) {
  try { await navigator.clipboard.writeText(text); toast(okMsg); }
  catch (e) { window.prompt('Cópialo desde aquí:', text); }
}

// ---------- Eventos ----------
$('createBtn').onclick = createRoom;
$('joinForm').onsubmit = e => { e.preventDefault(); joinRoom($('codeInput').value); };
$('codeInput').oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); };
$('copyLinkBtn').onclick = () => copyText(roomLink(), '¡Enlace copiado! Pásaselo a tu rival');
$('roomCode').onclick = () => copyText(roomCode, 'Código copiado');
if (navigator.share) {
  $('shareBtn').classList.remove('hidden');
  $('shareBtn').onclick = () => navigator.share({
    title: 'Vocab Duel', text: `¡Te reto a un duelo de vocabulario! Sala ${roomCode}`, url: roomLink(),
  }).catch(() => {});
}
$('settings').onclick = e => {
  const b = e.target.closest('button');
  if (!b || role !== 'host') return;
  const key = b.parentElement.dataset.key;
  host.setSettings({ [key]: key === 'time' ? Number(b.dataset.val) : b.dataset.val });
};
$('startBtn').onclick = () => host && host.start();
$('answerForm').onsubmit = e => {
  e.preventDefault();
  const text = $('answerInput').value.trim();
  if (text) submitAnswer(text);
  else $('answerInput').focus();
};
$('skipBtn').onclick = () => submitAnswer('');
$('rematchBtn').onclick = () => act('rematch');
$('toLobbyBtn').onclick = () => host && host.toLobby();
document.querySelectorAll('.leave-btn').forEach(b => { b.onclick = () => leaveRoom(); });
$('muteBtn').textContent = Sound.muted ? '🔇' : '🔊';
$('muteBtn').onclick = () => { $('muteBtn').textContent = Sound.toggle() ? '🔇' : '🔊'; };

window.addEventListener('beforeunload', e => {
  if (S && S.phase !== 'lobby' && S.phase !== 'end') { e.preventDefault(); e.returnValue = ''; }
});
window.addEventListener('pagehide', () => {
  if (host) host.close();
  else if (net) net.send({ t: 'bye' });
});

// número de palabras en los botones de ajustes
document.querySelectorAll('[data-key="set"] button').forEach(b => {
  b.insertAdjacentHTML('beforeend', ` <small>(${countWords(b.dataset.val)})</small>`);
});

// invitación por enlace: ?sala=CODIGO
const invite = (new URLSearchParams(location.search).get('sala') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
if (invite) {
  $('inviteBanner').classList.remove('hidden');
  $('inviteCode').textContent = invite;
  $('codeInput').value = invite;
  $('joinBtn').className = 'btn btn-primary';
  $('joinBtn').textContent = '¡Unirme!';
  $('createBtn').className = 'btn btn-ghost btn-block';
  if (session.get('vd_room') === invite) joinRoom(invite); // has recargado la página: vuelves a entrar
}

requestAnimationFrame(frame);
