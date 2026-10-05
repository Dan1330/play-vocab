// Pinta las pantallas a partir del estado (S) que manda el anfitrión, más sonidos y efectos.
// Las pantallas propias de práctica y multijugador están en modes.js.
const LANG = { en: '<span class="lang en">EN</span>', es: '<span class="lang es">ES</span>' };
const LANG_NAME = { en: 'inglés', es: 'español' };
const otherLang = l => (l === 'en' ? 'es' : 'en');

let lastPhase = null, lastRound = -1, lastScores = {}, lastPlayers = {}, reviewKey = '', lastTickSec = 0;
let myLog = []; // mis resultados por ronda (para el repaso del multijugador)

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function avatarHTML(p, withCrown = true) {
  return `<span class="avatar">${esc(p.avatar)}${withCrown && p.crown ? '<span class="crown">👑</span>' : ''}</span>`;
}

function showScreen(name) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== 'screen-' + name);
}

let toastTimer = null;
function toast(text) {
  const t = $('toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

function render() {
  if (!S) return;
  const phase = S.phase;
  const mode = S.mode || 'duel';
  if (phase !== lastPhase) onPhaseChange(phase);
  $('countdown').classList.toggle('hidden', phase !== 'countdown');
  if (phase === 'lobby') {
    if (mode === 'party') { showScreen('party-lobby'); renderPartyLobby(); }
    else { showScreen('lobby'); renderLobby(); }
  } else if (phase === 'end') {
    if (mode === 'party') { showScreen('party-end'); renderPartyEnd(); }
    else if (mode === 'solo') { showScreen('solo-end'); renderSoloEnd(); }
    else { showScreen('end'); renderEnd(); }
  } else {
    showScreen('game');
    renderGame();
  }
  notifyPlayers();
  lastPhase = phase;
}

function onPhaseChange(phase) {
  if (phase === 'countdown') { lastRound = -1; lastScores = {}; myLog = []; }
  if (phase === 'reveal' && S.reveal) {
    const r = S.reveal.results[me.id];
    if (r) myLog[S.round] = r;
    if (r && r.ok) Sound.correct();
    else if (r) { Sound.wrong(); shake(document.querySelector('.question')); }
  }
  if (phase === 'end' && lastPhase) {
    reviewKey = '';
    if (S.mode === 'solo') { if (soloPct() >= 0.8) { Sound.win(); confetti(); } }
    else if (S.winner === me.id) { Sound.win(); confetti(); }
    else if (S.winner) Sound.lose();
  }
}

function notifyPlayers() {
  const now = Object.fromEntries(S.players.map(p => [p.id, p.name]));
  if (Object.keys(lastPlayers).length) {
    for (const p of S.players) {
      if (!(p.id in lastPlayers) && p.id !== me.id) { toast(`${p.avatar} ${p.name} se ha unido`); Sound.join(); }
    }
    const gone = Object.keys(lastPlayers).filter(id => !(id in now));
    if (gone.length) toast(S.mode === 'party' ? `${lastPlayers[gone[0]]} ha salido de la sala` : 'Tu rival ha salido de la sala');
  }
  lastPlayers = now;
}

// ---------- 1 vs 1: sala ----------
function slotHTML(p) {
  const tags = [];
  if (p.id === S.hostId) tags.push('<span class="tag">Anfitrión</span>');
  if (p.id === me.id) tags.push('<span class="tag me">Tú</span>');
  if (p.wins) tags.push(`<span class="tag">🏆 ${p.wins}</span>`);
  if (!p.online) tags.push('<span class="tag off">Desconectado</span>');
  return `<div class="slot">${avatarHTML(p)}<div class="name">${esc(p.name)}</div><div class="tags">${tags.join('')}</div></div>`;
}

function renderLobby() {
  const isHost = role === 'host';
  const [a, b] = S.players;
  $('roomCode').textContent = S.code;
  $('lobbyPlayers').innerHTML = slotHTML(a) + '<div class="vs">VS</div>' + (b ? slotHTML(b)
    : '<div class="slot empty"><div><span class="avatar">❔</span><div class="name">Esperando rival…</div><small>Pásale el código o el enlace</small></div></div>');
  for (const seg of document.querySelectorAll('#settings .seg')) {
    for (const btn of seg.children) {
      btn.classList.toggle('on', String(S.settings[seg.dataset.key]) === btn.dataset.val);
      btn.disabled = !isHost;
    }
  }
  $('settings').classList.toggle('readonly', !isHost);
  const ready = S.players.length === 2;
  $('startBtn').classList.toggle('hidden', !isHost);
  $('startBtn').disabled = !ready;
  const n = countWords(S.settings.set);
  $('lobbyMsg').textContent = !isHost ? 'Esperando a que el anfitrión empiece la partida…'
    : ready ? `${n} palabras · ¡Cuando quieras!` : 'Esperando a que entre tu rival…';
}

// ---------- Partida (todos los modos) ----------
function renderGame() {
  const mode = S.mode || 'duel';
  if (mode === 'party') renderPartyBoard();
  else if (mode === 'solo') renderSoloBoard();
  else renderDuelBoard();

  const q = S.q;
  $('roundText').textContent = S.total ? `Palabra ${Math.max(S.round, 1)} / ${S.total}` : '';
  if (q) {
    const to = otherLang(q.from);
    $('promptText').textContent = q.prompt;
    $('langHint').innerHTML = `${LANG[q.from]} → ${LANG[to]} &nbsp;Escríbela en <b>${LANG_NAME[to]}</b>`;
  } else {
    $('promptText').textContent = '…';
    $('langHint').innerHTML = '';
  }

  const input = $('answerInput');
  if (S.phase === 'question' && S.round !== lastRound) {
    lastRound = S.round;
    lastTickSec = 0;
    pending = null;
    editing = 0;
    actN = 0;
    input.value = '';
    setTimeout(() => input.focus({ preventScroll: true }), 60);
  }
  const sent = pending && pending.round === S.round;
  const isEditing = S.phase === 'question' && editing === S.round;
  const canAnswer = S.phase === 'question' && (isEditing || (!S.answered[me.id] && !sent));
  const revealing = S.phase === 'reveal';
  $('answerForm').classList.toggle('hidden', revealing);
  $('skipBtn').classList.toggle('hidden', revealing);
  input.disabled = !canAnswer;
  $('sendBtn').disabled = !canAnswer;
  $('skipBtn').disabled = !canAnswer;
  $('editBtn').classList.toggle('hidden', !(S.phase === 'question' && !canAnswer && mode !== 'solo'));
  $('quitBtn').classList.toggle('hidden', mode === 'duel');

  let status = '';
  if (S.phase === 'question' && !canAnswer) status = mode === 'party' ? partyStatus() : duelStatus();
  else if (isEditing) status = '✏️ Editando… si se acaba el tiempo, cuenta tu respuesta anterior';
  $('answerStatus').innerHTML = status;

  const box = $('revealBox');
  if (!revealing || !S.reveal) { box.classList.add('hidden'); return; }
  box.innerHTML = mode === 'party' ? partyRevealHTML() : mode === 'solo' ? soloRevealHTML() : duelRevealHTML();
  box.classList.remove('hidden');
}

function renderDuelBoard() {
  $('scoreboard').innerHTML = S.players.map(p => {
    let state = p.online ? '' : '🔌 Desconectado';
    if (S.phase === 'question' && p.online) state = S.answered[p.id] ? '✅ Respondido' : '✍️ Pensando…';
    if (S.phase === 'reveal' && S.reveal) state = (S.reveal.results[p.id] || {}).ok ? '✅ ¡Acierto!' : '❌ Fallo';
    const bump = lastScores[p.id] !== undefined && p.score > lastScores[p.id] ? ' bump' : '';
    lastScores[p.id] = p.score;
    return `<div class="sb-player${p.id === me.id ? ' me' : ''}">${avatarHTML(p)}
      <div class="sb-info"><div class="sb-name">${esc(p.name)}${p.id === me.id ? ' (tú)' : ''}</div>
      <div class="sb-state${S.answered[p.id] ? ' done' : ''}">${state}</div></div>
      <div class="sb-score${bump}">${p.score}</div></div>`;
  }).join('');
}

function duelStatus() {
  const rival = S.players.find(p => p.id !== me.id);
  return rival && rival.online && !S.answered[rival.id] ? `✅ Enviado. Esperando a ${esc(rival.name)}…` : '✅ Enviado';
}

function ptsHTML(res) {
  if (!res.ok) return '✗';
  const pts = res.pts || 1;
  return `+${pts} ${pts > 1 ? '⚡' : '✓'}`;
}

function resultNotes(res) {
  const notes = [];
  if (res.pts > 1) notes.push('⚡ ¡El más rápido! +2');
  if (res.ok === 2) notes.push('Vale, pero ojo con las tildes');
  return notes.length ? `<small>${notes.join(' · ')}</small>` : '';
}

function revealAlsoHTML(r) {
  return r.also.length ? `<div class="also">También vale: ${r.also.map(esc).join(' · ')}</div>` : '';
}

function duelRevealHTML() {
  const r = S.reveal;
  const results = S.players.map(p => {
    const res = r.results[p.id] || { text: '', ok: 0 };
    const said = res.text ? `“${esc(res.text)}”` : '<i>sin respuesta</i>';
    return `<div class="result${res.ok ? ' ok' : ''}">${avatarHTML(p, false)}
      <div class="r-text"><b>${esc(p.name)}</b>: ${said}${resultNotes(res)}</div>
      <div class="r-points">${ptsHTML(res)}</div></div>`;
  }).join('');
  return `<div class="sol-label">Respuesta correcta</div><div class="sol">${esc(r.answer)}</div>${revealAlsoHTML(r)}
    <div class="results">${results}</div><div class="next-bar"><div id="nextBar"></div></div>`;
}

// ---------- 1 vs 1: final ----------
function renderEnd() {
  const isHost = role === 'host';
  const rival = S.players.find(p => p.id !== me.id);
  const mine = S.players.find(p => p.id === me.id);
  const winner = S.players.find(p => p.id === S.winner);
  const hist = S.history || [];
  const total = hist.length;

  $('endTitle').textContent = winner ? (winner.id === me.id ? '¡Has ganado! 🎉' : `¡Gana ${winner.name}!`) : rival ? '¡Empate! 🤝' : 'Partida terminada';
  $('podium').innerHTML = S.players.map(p => {
    const win = p.id === S.winner;
    const correct = p.correct !== undefined ? p.correct : p.score;
    const pct = total ? Math.round((correct / total) * 100) : 0;
    return `<div class="pod${win ? ' win' : ''}">${win ? '<span class="big-crown">👑</span>' : ''}${avatarHTML(p, false)}
      <div class="name">${esc(p.name)}${p.id === me.id ? ' (tú)' : ''}</div>
      <div class="score">${p.score}<small> pts</small></div>
      <div class="detail">${correct} de ${total} acertadas · ${pct}%</div>
      ${p.wins ? `<div class="detail">🏆 ${p.wins} ${p.wins === 1 ? 'victoria' : 'victorias'}</div>` : ''}</div>`;
  }).join('');

  const waiting = !!(mine && mine.rematch);
  $('rematchBtn').classList.toggle('hidden', !rival);
  $('rematchBtn').disabled = waiting;
  $('rematchBtn').textContent = waiting ? '⏳ Esperando…' : '🔁 Volver a jugar';
  $('toLobbyBtn').classList.toggle('hidden', !isHost);
  $('toLobbyBtn').textContent = rival ? '⚙️ Cambiar ajustes' : '🏠 Volver a la sala';
  let msg = '';
  if (!rival) msg = 'Tu rival se ha ido. Vuelve a la sala para esperar a otro.';
  else if (waiting) msg = `Esperando a que ${rival.name} pulse “Volver a jugar”…`;
  else if (rival.rematch) msg = `¡${rival.name} quiere la revancha!`;
  $('endMsg').textContent = msg;

  const key = total + '|' + S.players.map(p => p.id + ':' + p.score).join();
  if (key === reviewKey) return;
  reviewKey = key;
  $('reviewList').innerHTML = hist.map((h, i) => `<div class="rv">
    <div class="rv-q">${i + 1}. ${LANG[h.from]} ${esc(h.prompt)} <span class="arrow">→</span> ${LANG[otherLang(h.from)]} ${esc(h.answer)}</div>
    ${S.players.map(p => {
      const res = h.results[p.id] || { text: '', ok: 0 };
      return `<div class="rv-a ${res.ok ? 'ok' : 'bad'}">${esc(p.avatar)} ${res.ok ? '✓' : '✗'} ${res.text ? esc(res.text) : '—'}</div>`;
    }).join('')}</div>`).join('');
}

// Barra de tiempo y cuenta atrás (60 veces por segundo)
function frame() {
  requestAnimationFrame(frame);
  if (!S) return;
  const left = Math.max(0, localEndsAt - Date.now());
  const frac = S.duration ? left / S.duration : 0;
  if (S.phase === 'question') {
    const bar = $('timerBar');
    if (!S.duration) { // práctica sin límite de tiempo
      bar.style.width = '100%';
      bar.className = 'timer-bar';
      $('timeLeft').textContent = '⏱ ∞';
      return;
    }
    bar.style.width = frac * 100 + '%';
    bar.className = 'timer-bar' + (frac < 0.25 ? ' danger' : frac < 0.5 ? ' warn' : '');
    const sec = Math.ceil(left / 1000);
    $('timeLeft').textContent = `⏱ ${sec} s`;
    if (sec <= 3 && sec > 0 && sec !== lastTickSec && !S.answered[me.id]) { lastTickSec = sec; Sound.tick(); }
  } else if (S.phase === 'reveal') {
    $('timerBar').style.width = '0%';
    $('timeLeft').textContent = '⏱ 0 s';
    const nb = document.getElementById('nextBar');
    if (nb) nb.style.width = frac * 100 + '%';
  } else if (S.phase === 'countdown') {
    const el = $('countNum');
    const n = String(Math.max(1, Math.ceil(left / 1000)));
    if (el.textContent !== n) {
      el.textContent = n;
      el.style.animation = 'none';
      void el.offsetHeight;
      el.style.animation = '';
      Sound.tick();
    }
  }
}

function shake(el) {
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

function confetti() {
  const box = $('confetti');
  const colors = ['#ffcf33', '#ff8a1f', '#2fb8ff', '#1fbf63', '#f0484a', '#a23be8'];
  for (let i = 0; i < 90; i++) {
    const c = document.createElement('i');
    c.style.left = Math.random() * 100 + '%';
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 2 + Math.random() * 2.5 + 's';
    c.style.animationDelay = Math.random() * 0.8 + 's';
    box.appendChild(c);
    setTimeout(() => c.remove(), 6000);
  }
}

const Sound = (() => {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('vd_muted') === '1'; } catch (e) {}
  function getCtx() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type = 'sine', delay = 0, vol = 0.12) {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    try {
      const t = c.currentTime + delay;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  return {
    unlock: getCtx,
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      try { localStorage.setItem('vd_muted', muted ? '1' : '0'); } catch (e) {}
      return muted;
    },
    tick() { tone(880, 0.06, 'square', 0, 0.04); },
    correct() { tone(660, 0.12, 'triangle'); tone(990, 0.2, 'triangle', 0.1); },
    wrong() { tone(220, 0.28, 'sawtooth', 0, 0.06); },
    join() { tone(740, 0.1); tone(988, 0.14, 'sine', 0.08); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', i * 0.14)); },
    lose() { [392, 330, 262].forEach((f, i) => tone(f, 0.25, 'triangle', i * 0.16, 0.08)); },
  };
})();
