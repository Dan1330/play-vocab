// Pinta las pantallas a partir del estado (S) que manda el anfitrión, más sonidos y efectos.
// Las pantallas propias de práctica y multijugador están en modes.js.
const $ = id => document.getElementById(id);
const LANG ={ en: '<span class="lang en">EN</span>', es: '<span class="lang es">ES</span>' };
const LANG_NAME = { en: 'inglés', es: 'español' };
const otherLang = l => (l === 'en' ? 'es' : 'en');

let lastPhase = null, lastRound = -1, lastScores = {}, lastPlayers = {}, reviewKey = '', podiumKey = '', lastTickSec = 0;
let endShownAt = 0;  // cuándo empezó la ceremonia del podio (para callar la música durante el redoble)
// Pistas de la práctica: a los 20 s sin responder sale una letra (o una palabra, en las frases), y otra cada 5 s
const HINT_AFTER_MS = 20000, HINT_EVERY_MS = 5000;
let roundShownAt = 0, hintRound = 0, hintTarget = '', hintShown = 0, hintWords = false;
let orderPicked = []; // ejercicio de ordenar: fichas que has ido tocando, en orden
let matchSel = -1, matchPairs = []; // parejas: la de la izquierda elegida y con cuál de la derecha va cada una
let soloRecord = {}; // récords superados en la última práctica
let myLog = [];    // mis resultados por ronda (para el repaso del multijugador)
let roundLog = []; // resultados de todos por ronda (para ver las respuestas de los demás en el repaso)
let ceremonyTimer = null;

const secs = ms => (ms / 1000).toFixed(1).replace('.', ',') + ' s';
const timecode = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; // 00:12

// Cambia el contenido solo si es distinto (así las animaciones no se repiten en cada actualización)
function setHTML(el, html) {
  if (el._html === html) return;
  el._html = html;
  el.innerHTML = html;
}

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
  $('reactBar').classList.toggle('hidden', !(mode !== 'solo' && S.players.length > 1 && ['lobby', 'reveal', 'end'].includes(phase)));
  notifyPlayers();
  lastPhase = phase;
}

function onPhaseChange(phase) {
  clearTimeout(ceremonyTimer);
  if (phase === 'countdown' || phase === 'question' || phase === 'reveal') closeWords(); // empieza la partida
  if (phase === 'countdown') { lastRound = -1; lastScores = {}; myLog = []; roundLog = []; hintRound = 0; }
  if (phase === 'reveal' && S.reveal) {
    const r = S.reveal.results[me.id];
    if (r) myLog[S.round] = r;
    roundLog[S.round] = S.reveal.results;
    // para "Mis difíciles" (si necesitaste pistas, también cuenta como difícil)
    if (r && S.q) Stats.record(S.q.key, !!r.ok && hintRound !== S.round);
    if (r && r.ok) {
      Sound.correct();
      if (r.streak >= 2) Sound.streak(r.streak);
    } else if (r) {
      Sound.wrong();
      shake(document.querySelector('.question'));
      if (r.lost >= 2) Sound.lostStreak();
    }
  }
  if (phase === 'end') {
    reviewKey = '';
    podiumKey = '';
    if (!lastPhase) return;
    endShownAt = Date.now();
    if (S.mode === 'solo') {
      const p = S.players[0];
      const sum = soloSummary(); // récord: las acertadas a la primera
      soloRecord = Stats.finishPractice(soloRun.retry ? null : soloRun.key, sum.pct, sum.total, p.best);
      if (soloPct() >= 0.8 || soloRecord.pct || soloRecord.streak) { Sound.win(); confetti(); }
    } else {
      // ceremonia: redoble de tambor y, al salir el primero, fanfarria y confeti
      Sound.drumroll(2.5);
      ceremonyTimer = setTimeout(() => {
        if (!S || S.phase !== 'end') return;
        Sound.win();
        confetti(S.winner === me.id ? 150 : 50);
      }, 2700);
    }
  }
}

let lastHostId = '';
function notifyPlayers() {
  if (S.mode !== 'solo') {
    if (lastHostId && S.hostId !== lastHostId && S.hostId !== me.id) {
      const h = S.players.find(p => p.id === S.hostId);
      if (h) toast(`🔑 ${h.name} es ahora el anfitrión`);
    }
    lastHostId = S.hostId;
  }
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
  const give = role === 'host' && p.id !== me.id
    ? `<button class="btn btn-small btn-ghost give-host-btn" type="button" data-host="${esc(p.id)}">🔑 Pasar anfitrión</button>` : '';
  return `<div class="slot">${avatarHTML(p)}<div class="name">${esc(p.name)}</div><div class="tags">${tags.join('')}</div>${give}</div>`;
}

function renderLobby() {
  const isHost = role === 'host';
  const [a, b] = S.players;
  $('roomCode').textContent = S.code;
  setHTML($('lobbyPlayers'), slotHTML(a) + '<div class="vs">VS</div>' + (b ? slotHTML(b)
    : '<div class="slot empty"><div><span class="avatar">❔</span><div class="name">Esperando rival…</div><small>Pásale el código o el enlace</small></div></div>'));
  paintSettings($('settings'), S.settings, isHost);
  const ready = S.players.length === 2;
  $('startBtn').classList.toggle('hidden', !isHost);
  $('startBtn').disabled = !ready;
  const n = settingsCount(S.settings);
  $('lobbyMsg').textContent = !isHost ? 'Esperando a que el anfitrión empiece la partida…'
    : ready ? `${n} ${unitName(S.settings, n)} · ¡Cuando quieras!` : 'Esperando a que entre tu rival…';
}

// Qué hay que hacer en cada tipo de pregunta
function langHintHTML(q, kind) {
  const to = q.to || otherLang(q.from);
  const pair = `${LANG[q.from]} → ${LANG[to]} &nbsp;`;
  const title = q.title ? ` · <b>${esc(q.title)}</b>` : '';
  const voice = canSpeak();
  switch (kind) {
    case 'quiz': return `${pair}Elige la traducción en <b>${LANG_NAME[to]}</b>`;
    case 'first': return `${pair}🔡 Escríbela en <b>${LANG_NAME[to]}</b> (con pista)`;
    case 'anagram': return `${LANG.es} → ${LANG.en} &nbsp;🔤 Ordena las letras de la palabra en <b>inglés</b>`;
    case 'spell': return voice ? `${LANG.en} &nbsp;🎧 Escucha la palabra y escríbela en <b>inglés</b>` : `${LANG.es} → ${LANG.en} &nbsp;Escríbela en <b>inglés</b>`;
    case 'hear': return voice ? `${LANG.en} → ${LANG.es} &nbsp;👂 Escucha y elige qué significa` : `${LANG.en} → ${LANG.es} &nbsp;Elige qué significa`;
    case 'tf': return `${pair}⚖️ ¿Es correcta esta traducción?`;
    case 'match': return `${LANG.en} ⇄ ${LANG.es} &nbsp;🔗 Une cada una con su traducción`;
    case 'order': return `${pair}🧩 Ordena las palabras en <b>inglés</b>`;
    case 'gap': return `${LANG.en} &nbsp;🕳️ Escribe la palabra que falta`;
    case 'gapq': return `${LANG.en} &nbsp;🎯 Elige la palabra que falta`;
    case 'initials': return `${LANG.es} → ${LANG.en} &nbsp;🔠 Escribe la frase en <b>inglés</b> (con las iniciales)`;
    case 'listen': return voice ? `${LANG.en} &nbsp;🎧 Escucha y escribe la frase en <b>inglés</b>` : `${LANG.es} → ${LANG.en} &nbsp;Escribe esta frase en <b>inglés</b>`;
    case 'error': return `${LANG.en} &nbsp;🕵️ Toca la palabra que está mal escrita`;
    case 'role': return `${LANG.en} &nbsp;🧑‍🎤 ¿Quién lo diría en un rodaje?`;
    case 'tgap': return `🎧 Listening${title}`;
    case 'tq': return `📖 Reading${title}`;
    case 'ttf': return `⚖️ True or false?${title}`;
    case 'who': return `🗣️ ¿Quién lo dice?${title}`;
    case 'next': return `⏭️ ¿Qué viene después?${title}`;
    default: return `${pair}${q.ph ? 'Escribe la frase en' : 'Escríbela en'} <b>${LANG_NAME[to]}</b>`;
  }
}
const PLACEHOLDERS = {
  gap: 'Escribe la palabra que falta…', listen: 'Escribe lo que oyes…', spell: 'Escribe la palabra que oyes…',
  tgap: 'Escribe lo que falta…', initials: 'Escribe la frase en inglés…',
};
const VOICE_KINDS = ['listen', 'spell', 'hear', 'tgap'];

// El enunciado de la pregunta: trozo del diálogo, palabra o frase, pregunta, pista fija, traducción y audio
function paintPrompt(q, kind) {
  const voice = canSpeak();
  const ctx = q && q.ctx;
  setHTML($('ctxBox'), ctx ? ctx.map(l => `<div class="ctx-line${l.me ? ' me' : ''}"><b>${esc(l.who)}:</b> ${esc(l.text).replace(/_____/g, '<span class="blank">_____</span>')}</div>`).join('') : '');
  $('ctxBox').classList.toggle('hidden', !ctx);
  let text = q ? q.prompt : '…';
  if (q && q.tx) text = ''; // en los textos ya se ve en el diálogo
  else if (q && !voice && (kind === 'listen' || kind === 'spell')) text = q.sub || q.prompt; // sin voz: se traduce
  else if (q && !voice && kind === 'hear') text = q.say;
  const prompt = $('promptText');
  prompt.textContent = text;
  prompt.classList.toggle('hidden', !text);
  prompt.classList.toggle('long', text.length > 22);
  prompt.classList.toggle('icon', Array.from(text).length <= 2 && /\p{Extended_Pictographic}/u.test(text));
  const question = !q ? '' : kind === 'tf' ? `= ${q.pair}` : q.question || (kind === 'error' ? '¿Qué palabra está mal escrita?' : '');
  $('qText').textContent = question;
  $('qText').classList.toggle('hidden', !question);
  $('qText').classList.toggle('pair', kind === 'tf');
  $('patternBox').textContent = (q && q.pattern) || '';
  $('patternBox').classList.toggle('hidden', !(q && q.pattern));
  const sub = q && ['gap', 'gapq'].includes(kind) ? q.sub : '';
  $('subText').textContent = sub ? `🇪🇸 ${sub}` : '';
  $('subText').classList.toggle('hidden', !sub);
  $('listenBox').classList.toggle('hidden', !(q && q.say && voice && VOICE_KINDS.includes(kind) && S.phase === 'question'));
}

// ---------- Partida (todos los modos) ----------
function renderGame() {
  const mode = S.mode || 'duel';
  if (mode === 'party') renderPartyBoard();
  else if (mode === 'solo') renderSoloBoard();
  else renderDuelBoard();

  const q = S.q;
  const kind = q ? q.kind || (q.options ? 'quiz' : 'type') : 'type';
  const how = inputOf(kind); // text, choice, pick, order o match
  $('roundText').textContent = S.total ? `${q && q.tx ? 'Pregunta' : q && q.ph ? 'Frase' : 'Palabra'} ${Math.max(S.round, 1)} / ${S.total}` : '';
  $('langHint').innerHTML = q ? langHintHTML(q, kind) : '';
  paintPrompt(q, kind);

  const input = $('answerInput');
  if (S.phase === 'question' && S.round !== lastRound) {
    lastRound = S.round;
    lastTickSec = 0;
    pending = null;
    editing = 0;
    actN = 0;
    orderPicked = [];
    matchSel = 0;
    matchPairs = [];
    roundShownAt = Date.now();
    hintShown = 0;
    // pistas de la práctica (solo al escribir o al ordenar palabras)
    const card = mode === 'solo' && host && (how === 'text' || kind === 'order') ? host.deck[S.round - 1] : null;
    hintTarget = !card ? '' : card.ph && !card.full ? expandPhrase(card.answer)[0] : card.ph ? card.answer : expandForms([card.answer])[0];
    hintWords = !!(card && card.ph && hintTarget.includes(' '));
    input.value = '';
    input.placeholder = PLACEHOLDERS[kind] || (q && q.ph ? `Escribe la frase en ${LANG_NAME[q.to || 'en']}…` : 'Escribe la traducción…');
    if (q && q.say && VOICE_KINDS.includes(kind) && canSpeak()) setTimeout(() => Teach.speak(q.say, 'en', { quiet: true }), 350);
    if (how === 'text') setTimeout(() => input.focus({ preventScroll: true }), 60);
  }
  const sent = pending && pending.round === S.round;
  const isEditing = S.phase === 'question' && editing === S.round;
  const canAnswer = S.phase === 'question' && (isEditing || (!S.answered[me.id] && !sent));
  const revealing = S.phase === 'reveal';
  $('answerForm').classList.toggle('hidden', revealing || how !== 'text');
  $('skipBtn').classList.toggle('hidden', revealing);
  $('quizBox').classList.toggle('hidden', how !== 'choice' && how !== 'pick');
  $('orderBox').classList.toggle('hidden', how !== 'order');
  $('matchBox').classList.toggle('hidden', how !== 'match');
  if (how === 'choice' || how === 'pick') renderQuiz(canAnswer, how === 'pick');
  if (how === 'order') renderOrder(canAnswer, kind === 'anagram');
  if (how === 'match') renderMatch(canAnswer);
  input.disabled = !canAnswer;
  $('sendBtn').disabled = !canAnswer;
  $('skipBtn').disabled = !canAnswer;
  $('editBtn').classList.toggle('hidden', !(S.phase === 'question' && !canAnswer && mode !== 'solo'));
  $('quitBtn').classList.toggle('hidden', mode === 'duel');
  $('endGameBtn').classList.toggle('hidden', !host); // solo el anfitrión (o tú en la práctica)
  $('endGameBtn').textContent = mode === 'solo' ? '⏹ Terminar práctica' : '⏹ Terminar partida';

  let status = '';
  if (S.phase === 'question' && !canAnswer) status = mode === 'party' ? partyStatus() : duelStatus();
  else if (isEditing) status = '✏️ Editando… si se acaba el tiempo, cuenta tu respuesta anterior';
  $('answerStatus').innerHTML = status;

  const box = $('revealBox');
  if (!revealing || !S.reveal) { box.classList.add('hidden'); return; }
  setHTML(box, mode === 'party' ? partyRevealHTML() : mode === 'solo' ? soloRevealHTML() : duelRevealHTML());
  box.classList.remove('hidden');
  const retype = document.getElementById('retypeInput'); // modo aprender: listo para escribirla bien
  if (retype && !retype.dataset.focused) { retype.dataset.focused = '1'; setTimeout(() => retype.focus({ preventScroll: true }), 80); }
}

function scoreHTML(p, unit = '') {
  const diff = lastScores[p.id] !== undefined ? p.score - lastScores[p.id] : 0;
  lastScores[p.id] = p.score;
  return `<div class="sb-score${diff > 0 ? ' bump' : ''}">${p.score}${unit}${diff > 0 ? `<span class="float-pts">+${diff}</span>` : ''}</div>`;
}

const streakBadge = p => (p.streak >= 2 ? ` <span class="streak-badge">🔥${p.streak}</span>` : '');

// Modo quiz: casillas de colores (como en Kahoot). pick: las palabras de la frase, para tocar la que está mal
const QUIZ_SHAPES = ['▲', '◆', '●', '■'];
function renderQuiz(canAnswer, pick = false) {
  const q = S.q;
  const r = S.phase === 'reveal' && S.reveal && typeof S.reveal.correct === 'number' ? S.reveal : null;
  const mine = r ? r.results[me.id] : null;
  const chosen = r ? (mine ? mine.choice : null) : pending && pending.round === S.round ? pending.choice : null;
  const picked = chosen !== null && chosen !== undefined;
  $('quizBox').classList.toggle('pick-mode', pick);
  $('quizBox').classList.toggle('two', q.options.length === 2);
  if (pick) {
    setHTML($('quizBox'), `<div class="pick">${q.options.map((w, i) => {
      let cls = 'chip';
      if (r) cls += i === r.correct ? ' right' : chosen === i ? ' wrong' : '';
      else if (picked && chosen === i) cls += ' on';
      return `<button type="button" class="${cls}" data-choice="${i}"${canAnswer ? '' : ' disabled'}>${esc(w)}</button>`;
    }).join('')}</div><!--${S.round}-->`);
    return;
  }
  setHTML($('quizBox'), q.options.map((opt, i) => {
    let cls = 'qopt q' + i;
    if (r) cls += i === r.correct ? ' right' : chosen === i ? ' wrong' : ' dim';
    else if (picked) cls += chosen === i ? ' chosen' : ' dim';
    const mark = r && i === r.correct ? '<span class="qmark">✓</span>' : r && chosen === i ? '<span class="qmark">✗</span>' : '';
    return `<button type="button" class="${cls}" data-choice="${i}"${canAnswer ? '' : ' disabled'}>
      <span class="qshape">${QUIZ_SHAPES[i]}</span><span class="qtext">${esc(opt)}</span>${mark}</button>`;
  }).join('') + `<!--${S.round}-->`); // cada palabra nueva se vuelve a animar
}

// Parejas: inglés a la izquierda y español a la derecha; tocas una y luego su pareja (cada pareja, de un color)
function renderMatch(canAnswer) {
  const q = S.q;
  const r = S.phase === 'reveal' && S.reveal ? S.reveal : null;
  const off = canAnswer ? '' : ' disabled';
  let pairs = matchPairs;
  const right = r && r.solution ? r.solution.split(',').map(Number) : null;
  if (r) { // lo que respondiste (también si lo mandaste desde otro dispositivo)
    const mine = r.results[me.id];
    pairs = mine && /^\d(,\d)*$/.test(mine.text) ? mine.text.split(',').map(Number) : pairs;
  }
  setHTML($('matchLeft'), q.left.map((t, i) => {
    let cls = 'mitem' + (pairs[i] >= 0 ? ` p${i}` : '') + (!r && matchSel === i ? ' sel' : '');
    if (right) cls += pairs[i] === right[i] ? ' right' : ' wrong';
    return `<button type="button" class="${cls}" data-ml="${i}"${off}>${esc(t)}</button>`;
  }).join(''));
  setHTML($('matchRight'), q.right.map((t, j) => {
    const owner = pairs.indexOf(j);
    return `<button type="button" class="mitem${owner >= 0 ? ` p${owner}` : ''}" data-mr="${j}"${off}>${esc(t)}</button>`;
  }).join('') + `<!--${S.round}-->`);
  document.querySelector('.match-actions').classList.toggle('hidden', !!r);
  $('matchSend').disabled = !canAnswer || pairs.filter(x => x >= 0).length < q.left.length;
  $('matchReset').disabled = !canAnswer || !pairs.some(x => x >= 0);
}

// Ordenar la frase (o las letras de una palabra): arriba lo que llevas, abajo las fichas que quedan
function renderOrder(canAnswer, letters = false) {
  $('orderBox').classList.toggle('letters', letters);
  const chips = S.q.chips || [];
  const revealing = S.phase === 'reveal';
  const off = canAnswer ? '' : ' disabled';
  const built = orderPicked.map((ci, pos) => `<button type="button" class="chip on" data-unpick="${pos}"${off}>${esc(chips[ci])}</button>`).join('');
  setHTML($('orderBuilt'), built || `<span class="order-empty">${revealing ? '—' : `Toca las ${letters ? 'letras' : 'palabras'} en orden 👇`}</span>`);
  setHTML($('orderBank'), chips.map((c, ci) => (orderPicked.includes(ci) ? `<span class="chip ghost">${esc(c)}</span>`
    : `<button type="button" class="chip" data-pick="${ci}"${off}>${esc(c)}</button>`)).join('') + `<!--${S.round}-->`);
  const mine = revealing && S.reveal ? S.reveal.results[me.id] : null;
  $('orderBuilt').classList.toggle('ok', !!(mine && mine.ok));
  $('orderBuilt').classList.toggle('bad', !!(mine && !mine.ok));
  $('orderBank').classList.toggle('hidden', revealing);
  document.querySelector('.order-actions').classList.toggle('hidden', revealing);
  $('orderUndo').disabled = !canAnswer || !orderPicked.length;
  $('orderSend').disabled = !canAnswer || !orderPicked.length;
}

function renderDuelBoard() {
  $('scoreboard').innerHTML = S.players.map(p => {
    let state = p.online ? '' : '🔌 Desconectado';
    if (S.phase === 'question' && p.online) state = S.answered[p.id] ? '✅ Respondido' : '✍️ Pensando…';
    if (S.phase === 'reveal' && S.reveal) state = (S.reveal.results[p.id] || {}).ok ? '✅ ¡Acierto!' : '❌ Fallo';
    return `<div class="sb-player${p.id === me.id ? ' me' : ''}${p.streak >= 3 ? ' hot' : ''}">${avatarHTML(p)}
      <div class="sb-info"><div class="sb-name">${esc(p.name)}${p.id === me.id ? ' (tú)' : ''}${streakBadge(p)}</div>
      <div class="sb-state${S.answered[p.id] ? ' done' : ''}">${state}</div></div>
      ${scoreHTML(p)}</div>`;
  }).join('');
}

function duelStatus() {
  const rival = S.players.find(p => p.id !== me.id);
  return rival && rival.online && !S.answered[rival.id] ? `✅ Enviado. Esperando a ${esc(rival.name)}…` : '✅ Enviado';
}

function ptsHTML(res) {
  if (!res.ok) return '✗';
  return `+${res.pts || 1} ${res.fast || res.bonus ? (res.fast ? '⚡' : '') + (res.bonus ? '🔥' : '') : '✓'}`;
}

function resultNotes(res) {
  const notes = [];
  if (res.fast) notes.push(`⚡ Rápido (${secs(res.ms)}): +1`);
  if (res.bonus) notes.push(`🔥 Racha de ${res.streak}: +${res.bonus}`);
  if (res.ok === 2) notes.push(accentNote());
  if (!res.ok && res.lost >= 2) notes.push(`💔 Racha de ${res.lost} perdida`);
  return notes.length ? `<small>${notes.join(' · ')}</small>` : '';
}

const accentNote = () => (S.reveal && S.reveal.ph ? 'Vale, pero ojo con las tildes y los apóstrofos (\')' : 'Vale, pero ojo con las tildes');

// Aviso grande con tu resultado (como en Kahoot)
function splashHTML(res) {
  if (!res) return '';
  const solo = S.mode === 'solo';
  const almost = almostInfo(res, S.reveal); // "¡Casi!" o dónde va la tilde
  if (res.ok) {
    const parts = ['+1 acierto'];
    if (res.fast) parts.push(`+1 ⚡ rápido (${secs(res.ms)})`);
    if (res.bonus) parts.push(`+${res.bonus} 🔥 racha`);
    let streak = '';
    if (res.streak >= 2) {
      const hint = solo ? '' : res.streak === 3 ? ' Desde ahora, +1 extra por acierto' : res.streak === 5 ? ' ¡Ahora +2 extra por acierto!' : '';
      streak = `<div class="splash-streak">🔥 ¡Racha de ${res.streak}!${hint}</div>`;
    }
    return `<div class="splash ok"><div class="splash-title">¡Correcto!${solo ? '' : ` <b>+${res.pts}</b>`}</div>
      ${!solo && parts.length > 1 ? `<div class="splash-parts">${parts.map(x => `<span>${x}</span>`).join('')}</div>` : ''}
      ${res.ok === 2 ? `<div class="splash-note">${accentNote()}</div>${almost.html}` : ''}${streak}</div>`;
  }
  const lost = res.lost >= 2 ? `<div class="splash-streak">💔 Has perdido tu racha de ${res.lost}</div>` : '';
  const title = !res.text ? 'Sin respuesta' : almost.near ? '🤏 ¡Casi!' : '¡Incorrecto!';
  return `<div class="splash bad"><div class="splash-title">${title}</div>${almost.html}${lost}</div>`;
}

function duelPositionHTML() {
  const mine = S.players.find(p => p.id === me.id);
  const rival = S.players.find(p => p.id !== me.id);
  if (!mine || !rival) return '';
  const d = mine.score - rival.score;
  const text = d > 0 ? `🏆 Vas ganando ${mine.score} a ${rival.score}` : d < 0 ? `😬 Vas perdiendo ${mine.score} a ${rival.score}` : `🤝 Empate a ${mine.score}`;
  return `<div class="position">${text}</div>`;
}

function revealAlsoHTML(r) {
  return r.also.length ? `<div class="also">También vale: ${r.also.map(esc).join(' · ')}</div>` : '';
}

// La respuesta correcta (en "completar", también la frase entera; en frases, su traducción; en parejas, todas)
function solHTML(r) {
  const full = r.full ? `<div class="sol-full">${esc(r.full.pre)}<b>${esc(r.full.word)}</b>${esc(r.full.post)}</div>` : '';
  const main = r.pairs
    ? `<div class="sol-label">Las parejas eran</div><div class="sol-pairs">${r.pairs.map(([a, b]) => `<div><b>${esc(a)}</b><span>=</span>${esc(b)}</div>`).join('')}</div>`
    : `<div class="sol-label">Respuesta correcta</div><div class="sol${String(r.answer).length > 24 ? ' long' : ''}">${esc(r.answer)}</div>`;
  return `${main}${full}${r.sub ? `<div class="sol-sub">🇪🇸 ${esc(r.sub)}</div>` : ''}
    ${r.note ? `<div class="sol-note">💡 ${esc(r.note)}</div>` : ''}${revealAlsoHTML(r)}`;
}

// Lo que respondió alguien, para enseñarlo (en parejas no se ve el código de la respuesta)
const answerText = (res, kind) => (kind === 'match' && res.text ? (res.ok ? '✓ todas las parejas' : '✗ alguna pareja mal') : res.text);

function duelRevealHTML() {
  const r = S.reveal;
  const results = S.players.map(p => {
    const res = r.results[p.id] || { text: '', ok: 0 };
    const said = res.text ? `“${esc(answerText(res, r.kind))}”` : '<i>sin respuesta</i>';
    return `<div class="result${res.ok ? ' ok' : ''}">${avatarHTML(p, false)}
      <div class="r-text"><b>${esc(p.name)}</b>: ${said}${resultNotes(res)}</div>
      <div class="r-points">${ptsHTML(res)}</div></div>`;
  }).join('');
  return `${splashHTML(r.results[me.id])}${solHTML(r)}
    <div class="results">${results}</div>${duelPositionHTML()}<div class="next-bar"><div id="nextBar"></div></div>`;
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
  // el podio solo se repinta si cambia (si no, la animación de la ceremonia volvería a empezar)
  const podKey = 'd' + S.players.map(p => `${p.id}:${p.score}:${p.wins}`).join() + '|' + S.winner;
  if (podKey !== podiumKey) {
    podiumKey = podKey;
    $('podium').innerHTML = S.players.map(p => {
      const win = p.id === S.winner;
      const correct = p.correct !== undefined ? p.correct : p.score;
      const pct = total ? Math.round((correct / total) * 100) : 0;
      return `<div class="pod place-${win || !S.winner ? 1 : 2}${win ? ' win' : ''}">${win ? '<span class="big-crown">👑</span>' : ''}${avatarHTML(p, false)}
        <div class="name">${esc(p.name)}${p.id === me.id ? ' (tú)' : ''}</div>
        <div class="score">${p.score}<small> pts</small></div>
        <div class="detail">${correct} de ${total} acertadas · ${pct}%</div>
        ${p.best >= 2 ? `<div class="detail">🔥 Mejor racha: ${p.best}</div>` : ''}
        ${p.wins ? `<div class="detail">🏆 ${p.wins} ${p.wins === 1 ? 'victoria' : 'victorias'}</div>` : ''}</div>`;
    }).join('');
  }

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
    <div class="rv-q">${i + 1}. ${LANG[h.from]} ${esc(h.prompt)} <span class="arrow">→</span> ${LANG[h.to || otherLang(h.from)]} ${esc(h.answer)}</div>
    ${S.players.map(p => {
      const res = h.results[p.id] || { text: '', ok: 0 };
      return `<div class="rv-a ${res.ok ? 'ok' : 'bad'}">${esc(p.avatar)} ${res.ok ? '✓' : '✗'} ${res.text ? esc(answerText(res, h.kind)) : '—'}</div>`;
    }).join('')}</div>`).join('');
}

// Barra de tiempo y cuenta atrás (60 veces por segundo)
function desiredMusic(ceremony) {
  if (!S) return 'lobby';
  if (['countdown', 'question', 'reveal'].includes(S.phase)) return 'game';
  return ceremony ? null : 'lobby'; // durante el redoble del podio, silencio
}

function frame() {
  requestAnimationFrame(frame);
  // música: YouTube si hay (la de la sala o la tuya); si no, la del juego
  const ceremony = !!(S && S.phase === 'end' && S.mode !== 'solo' && Date.now() - endShownAt < 3800);
  const tense = !!(S && S.phase === 'question' && S.duration && localEndsAt - Date.now() < 5000);
  const yt = Music.enabled ? desiredYt() : null;
  YTMusic.want(yt ? yt.id : null, yt ? yt.pos : 0, ceremony);
  Music.want(yt ? null : desiredMusic(ceremony), tense);
  if (!S) return;
  const left = Math.max(0, localEndsAt - Date.now());
  const frac = S.duration ? left / S.duration : 0;
  const answered = S.answered[me.id] || (pending && pending.round === S.round);
  // aviso de "⚡ +1" mientras dura la ventana de respuesta rápida (más larga con las frases)
  const fastOn = S.phase === 'question' && S.mode !== 'solo' && S.duration && S.duration - left < ((S.q && S.q.fast) || FAST_MS) && !answered;
  $('fastBadge').classList.toggle('hidden', !fastOn);
  updateHint(answered);
  // (solo se toca el DOM si algo cambia: esto se ejecuta 60 veces por segundo)
  const setText = (el, text) => { if (el.textContent !== text) el.textContent = text; };
  const bar = $('timerBar');
  if (S.phase === 'question') {
    if (!S.duration) { // práctica sin límite de tiempo
      bar.style.width = '100%';
      if (bar.className !== 'timer-bar') bar.className = 'timer-bar';
      setText($('timeLeft'), '∞');
      return;
    }
    bar.style.width = frac * 100 + '%';
    const cls = 'timer-bar' + (frac < 0.25 ? ' danger' : frac < 0.5 ? ' warn' : '');
    if (bar.className !== cls) bar.className = cls;
    const sec = Math.ceil(left / 1000);
    setText($('timeLeft'), timecode(sec));
    if (sec <= 3 && sec > 0 && sec !== lastTickSec && !answered) { lastTickSec = sec; Sound.tick(); }
  } else if (S.phase === 'reveal') {
    bar.style.width = '0%';
    setText($('timeLeft'), '00:00');
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

// Pista de la práctica: "e _ _ _ _ _" con las primeras letras destapadas
// (en las frases, las primeras palabras: "Let's go _ _ _ _ _ _ _ …")
function hintText(target, n, words = false) {
  if (words) return target.split(/\s+/).map((w, i) => (i < n ? w : Array.from(w, ch => (/[\p{L}\p{N}]/u.test(ch) ? '_' : ch)).join(' '))).join('   ');
  let shown = 0;
  return target.split(' ').map(word => Array.from(word).map(ch => {
    if (!/[\p{L}\p{N}]/u.test(ch)) return ch;
    return shown++ < n ? ch : '_';
  }).join(' ')).join('   ');
}

function updateHint(answered) {
  const el = $('hintBox');
  if (!(S.mode === 'solo' && S.phase === 'question' && hintTarget && !answered)) {
    if (!(S.phase === 'reveal' && hintRound === S.round)) el.classList.add('hidden');
    return;
  }
  const elapsed = Date.now() - roundShownAt;
  const total = hintWords ? hintTarget.split(/\s+/).length : Array.from(hintTarget).filter(ch => /[\p{L}\p{N}]/u.test(ch)).length;
  const n = elapsed < HINT_AFTER_MS ? 0 : Math.min(total, 1 + Math.floor((elapsed - HINT_AFTER_MS) / HINT_EVERY_MS));
  if (!n) { el.classList.add('hidden'); return; }
  if (n !== hintShown) {
    hintShown = n;
    hintRound = S.round;
    el.textContent = '💡 ' + hintText(hintTarget, n, hintWords);
    el.classList.remove('hidden');
    shake(el);
    Sound.tick();
  }
}

function shake(el) {
  if (!el) return;
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

function confetti(count = 90) {
  const box = $('confetti');
  const colors = ['#ff4b2b', '#ffd23f', '#3d5afe', '#17c27c', '#ff6fb1', '#8f5cff', '#21d0ec'];
  for (let i = 0; i < count; i++) {
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
    audioCtx: () => ctx, // el mismo contexto de audio lo usa la música
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
    streak(n) { // arpegio que sube más cuanto más larga es la racha
      const base = 520 + Math.min(n, 8) * 35;
      [0, 4, 7, 12].forEach((s, i) => tone(base * 2 ** (s / 12), 0.12, 'square', 0.25 + i * 0.07, 0.045));
    },
    lostStreak() { [494, 440, 392, 330].forEach((f, i) => tone(f, 0.18, 'triangle', 0.3 + i * 0.1, 0.07)); },
    drumroll(sec = 2.5) {
      for (let t = 0; t < sec; t += 0.06) tone(90 + Math.random() * 40, 0.05, 'triangle', t, 0.04 + (0.08 * t) / sec);
    },
  };
})();
