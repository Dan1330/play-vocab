// Pantallas de los modos práctica (solo) y multijugador (party).

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function paintSettings(box, settings, editable) {
  for (const seg of box.querySelectorAll('.seg')) {
    for (const btn of seg.children) {
      btn.classList.toggle('on', String(settings[seg.dataset.key]) === btn.dataset.val);
      btn.disabled = !editable;
    }
  }
  const sets = settings.sets || [];
  // en la sala "exam" es la lista del anfitrión; en la práctica, sí/no (y se usa tu lista)
  const examN = Array.isArray(settings.exam) ? settings.exam.length : settings.exam ? Exam.count : 0;
  for (const inp of box.querySelectorAll('input[type="checkbox"]')) {
    if (inp.value === 'hard') inp.checked = !!settings.hard;
    else if (inp.value === 'exam') inp.checked = examN > 0;
    else inp.checked = sets.includes(inp.value);
    inp.disabled = !editable;
    inp.closest('.check-chip').classList.toggle('on', inp.checked);
  }
  const examChip = box.querySelector('.exam-chip');
  if (examChip) {
    examChip.querySelector('small').textContent = examN || Exam.count;
    box.querySelector('.exam-edit').classList.toggle('hidden', !editable);
  }
  box.classList.toggle('exam-on', examN > 0);
  for (const b of box.querySelectorAll('.check-all')) {
    b.disabled = !editable;
    b.classList.toggle('hidden', sets.length === ALL_SETS.length);
  }
  box.classList.toggle('readonly', !editable);
}

// Posición de cada uno antes de esta ronda (para las flechas ▲▼ de la clasificación)
function prevRanks(players, results) {
  const before = players.map(p => {
    const r = results[p.id] || {};
    return { id: p.id, score: p.score - (r.pts || 0), time: p.time - (r.ok ? r.ms || 0 : 0) };
  });
  return Object.fromEntries(rankPlayers(before).map((p, i) => [p.id, i]));
}

// ---------- Multijugador ----------
function renderPartyLobby() {
  const isHost = role === 'host';
  $('pRoomCode').textContent = S.code;
  $('pCount').textContent = `${S.players.length} / ${S.max}`;
  setHTML($('pPlayers'), S.players.map(p => `<div class="pchip${p.id === me.id ? ' me' : ''}${p.online ? '' : ' off'}">
    ${avatarHTML(p)}<span class="pname">${esc(p.name)}</span>
    ${p.id === S.hostId ? '<span class="tag">Anfitrión</span>' : ''}${p.id === me.id ? '<span class="tag me">Tú</span>' : ''}
    ${p.wins ? `<span class="tag">🏆 ${p.wins}</span>` : ''}
    ${isHost && p.id !== me.id ? `<button class="give-host" type="button" data-host="${esc(p.id)}" title="Pasarle el anfitrión">🔑</button>
      <button class="kick" type="button" data-kick="${esc(p.id)}" title="Sacar de la sala">✕</button>` : ''}
  </div>`).join(''));
  paintSettings($('pSettings'), S.settings, isHost);
  $('pStartBtn').classList.toggle('hidden', !isHost);
  const n = settingsCount(S.settings);
  $('pLobbyMsg').textContent = !isHost ? 'Esperando a que el anfitrión empiece la partida…'
    : S.players.length > 1 ? `${S.players.length} jugadores · ${n} palabras · ¡Cuando quieras!`
      : 'Comparte el código o el enlace. Podéis jugar de 1 a 40 personas.';
}

function renderPartyBoard() {
  const ranked = rankPlayers(S.players);
  const mine = S.players.find(p => p.id === me.id) || ranked[0];
  const pos = ranked.findIndex(p => p.id === mine.id) + 1;
  const online = S.players.filter(p => p.online);
  const results = S.phase === 'reveal' && S.reveal ? S.reveal.results : null;
  let info = `👥 ${S.players.length} jugadores`;
  if (results) info = `✅ Han acertado <b>${Object.values(results).filter(r => r.ok).length} / ${S.players.length}</b>`;
  else if (S.phase === 'question') info = `✍️ Han respondido <b>${online.filter(p => S.answered[p.id]).length} / ${online.length}</b>`;
  const dots = S.players.map(p => {
    const lit = results ? (results[p.id] || {}).ok : S.answered[p.id];
    return `<span class="dot${lit ? ' on' : ''}" title="${esc(p.name)}">${esc(p.avatar)}</span>`;
  }).join('');
  $('scoreboard').innerHTML = `<div class="party-bar${mine.streak >= 3 ? ' hot' : ''}">
    <div class="pb-info"><div>${info}</div><div class="pb-dots">${dots}</div></div>
    <div class="pb-me">${avatarHTML(mine)}<div>${scoreHTML(mine, '<small> pts</small>')}
      <div class="pb-pos">${pos}º de ${S.players.length}${mine.streak >= 2 ? ` · 🔥${mine.streak}` : ''}</div></div></div>
  </div>`;
}

function partyStatus() {
  const left = S.players.filter(p => p.online && !S.answered[p.id]).length;
  return left ? `✅ Enviado. ${left === 1 ? 'Falta 1' : `Faltan ${left}`} por responder…` : '✅ Enviado';
}

function partyPositionHTML(ranked) {
  const i = ranked.findIndex(p => p.id === me.id);
  if (i < 0) return '';
  const mine = ranked[i];
  let text;
  if (i === 0) {
    const next = ranked[1];
    const gap = next ? mine.score - next.score : 0;
    text = !next ? '🏆 ¡Vas 1º!' : gap > 0 ? `🏆 ¡Vas 1º! Le sacas ${plural(gap, 'punto', 'puntos')} a ${esc(next.name)}`
      : `🏆 ¡Vas 1º! Empatas a puntos con ${esc(next.name)}, pero has sido más rápido`;
  } else {
    const ahead = ranked[i - 1];
    const gap = ahead.score - mine.score;
    text = `Vas ${i + 1}º de ${ranked.length} · ${gap ? `a ${plural(gap, 'punto', 'puntos')} de` : 'empatado a puntos con'} ${esc(ahead.avatar)} ${esc(ahead.name)}`;
  }
  return `<div class="position">${text}</div>`;
}

// Respuestas de todos, agrupando las iguales (primero las correctas, luego los fallos)
function answersHTML(results) {
  const groups = new Map();
  for (const p of S.players) {
    const res = results[p.id];
    if (!res) continue; // entró a mitad de la palabra
    const key = res.text ? (res.ok ? 'ok:' : 'bad:') + norm(res.text) : 'none';
    if (!groups.has(key)) groups.set(key, { text: res.text, ok: res.ok, who: [] });
    groups.get(key).who.push(p);
  }
  const rank = g => (g.ok ? 0 : g.text ? 1 : 2);
  const list = [...groups.values()].sort((a, b) => rank(a) - rank(b) || b.who.length - a.who.length);
  return `<div class="answers"><div class="ans-title">📝 Respuestas de todos</div>${list.map(g => `
    <div class="ans-group ${g.ok ? 'ok' : 'bad'}">
      <div class="ans-text">${g.text ? `“${esc(g.text)}”` : '<i>Sin respuesta</i>'} ${g.ok ? '✓' : '✗'}${g.ok === 2 ? ' <small>(sin tilde)</small>' : ''}${g.who.length > 1 ? ` <span class="ans-count">×${g.who.length}</span>` : ''}</div>
      <div class="ans-who">${g.who.map(p => `<span class="ans-player${p.id === me.id ? ' me' : ''}">${esc(p.avatar)} ${esc(p.name)}</span>`).join('')}</div>
    </div>`).join('')}</div>`;
}

function partyRevealHTML() {
  const r = S.reveal;
  const ranked = rankPlayers(S.players);
  const before = prevRanks(S.players, r.results);
  const myPos = ranked.findIndex(p => p.id === me.id);
  const row = (p, i) => {
    const res = r.results[p.id] || { ok: 0 };
    const move = p.id in before ? before[p.id] - i : 0;
    const arrow = move > 0 ? `<span class="lb-move up">▲${move}</span>` : move < 0 ? `<span class="lb-move down">▼${-move}</span>` : '<span class="lb-move"></span>';
    return `<div class="lb-row${p.id === me.id ? ' me' : ''}"><span class="lb-pos">${i + 1}</span>${arrow}${avatarHTML(p, false)}
      <span class="lb-name">${esc(p.name)}${streakBadge(p)}</span>
      <span class="lb-round${res.ok ? ' ok' : ''}">${res.ok ? '+' + res.pts : '✗'}</span>
      <span class="lb-score">${p.score}</span></div>`;
  };
  const rows = ranked.slice(0, 5).map(row).join('') + (myPos >= 5 ? `<div class="lb-gap">···</div>${row(ranked[myPos], myPos)}` : '');
  const fastest = S.players
    .filter(p => (r.results[p.id] || {}).ok && r.results[p.id].ms != null)
    .sort((a, b) => r.results[a.id].ms - r.results[b.id].ms)[0];
  return `${splashHTML(r.results[me.id])}
    <div class="sol-label">Respuesta correcta</div><div class="sol">${esc(r.answer)}</div>${revealAlsoHTML(r)}
    ${answersHTML(r.results)}
    ${partyPositionHTML(ranked)}
    ${fastest ? `<div class="fast">⚡ El más rápido: ${esc(fastest.avatar)} <b>${esc(fastest.name)}</b> · ${secs(r.results[fastest.id].ms)}</div>` : ''}
    <div class="leaderboard">${rows}</div>
    <div class="next-bar"><div id="nextBar"></div></div>`;
}

function renderPartyEnd() {
  const isHost = role === 'host';
  const ranked = rankPlayers(S.players);
  const winner = S.players.find(p => p.id === S.winner);
  const hist = S.history || [];
  const myPos = ranked.findIndex(p => p.id === me.id);
  const mine = ranked[myPos];

  $('peTitle').textContent = winner ? (winner.id === me.id ? '¡Has ganado! 🎉' : `¡Gana ${winner.name}!`) : 'Partida terminada';
  $('peMine').textContent = mine ? `Has quedado ${myPos + 1}º de ${ranked.length} · ${mine.score} pts · ${mine.correct} de ${hist.length} acertadas` : '';

  // el podio solo se repinta si cambia (si no, la animación de la ceremonia volvería a empezar)
  const podKey = 'p' + ranked.slice(0, 3).map(p => `${p.id}:${p.score}`).join() + '|' + S.winner;
  if (podKey !== podiumKey) {
    podiumKey = podKey;
    const medals = ['🥇', '🥈', '🥉'];
    $('pePodium').innerHTML = [1, 0, 2].filter(i => ranked[i]).map(i => {
      const p = ranked[i];
      const win = p.id === S.winner;
      return `<div class="pod p${i + 1} place-${i + 1}${win ? ' win' : ''}">${win ? '<span class="big-crown">👑</span>' : ''}
        <div class="medal">${medals[i]}</div>${avatarHTML(p, false)}
        <div class="name">${esc(p.name)}${p.id === me.id ? ' (tú)' : ''}</div>
        <div class="score">${p.score}<small> pts</small></div>
        <div class="detail">${plural(p.correct, 'acierto', 'aciertos')}</div>
        ${p.best >= 2 ? `<div class="detail">🔥 Racha: ${p.best}</div>` : ''}</div>`;
    }).join('');
  }
  $('peRanking').innerHTML = ranked.map((p, i) => `<div class="lb-row${p.id === me.id ? ' me' : ''}">
    <span class="lb-pos">${i + 1}</span>${avatarHTML(p, false)}
    <span class="lb-name">${esc(p.name)}${p.online ? '' : ' 🔌'}</span>
    ${p.best >= 2 ? `<span class="lb-time" title="Mejor racha">🔥${p.best}</span>` : ''}
    <span class="lb-time" title="Tiempo total en los aciertos (desempata)">⏱ ${(p.time / 1000).toFixed(1)} s</span>
    <span class="lb-score">${p.score}</span></div>`).join('');

  $('peAgainBtn').classList.toggle('hidden', !isHost);
  $('peLobbyBtn').classList.toggle('hidden', !isHost);
  $('peMsg').textContent = isHost ? 'Con empate a puntos gana quien acertó más rápido.' : 'Esperando a que el anfitrión empiece otra partida…';

  const key = 'p' + hist.length + '|' + S.sv;
  if (key === reviewKey) return;
  reviewKey = key;
  $('peReview').innerHTML = hist.map((h, i) => {
    const res = myLog[i + 1];
    const mineTxt = res ? `${res.ok ? '✓' : '✗'} ${res.text ? esc(res.text) : '—'}` : '—';
    const all = roundLog[i + 1];
    const others = all ? S.players.filter(p => p.id !== me.id && all[p.id]).map(p => {
      const x = all[p.id];
      return `<span class="${x.ok ? 'ok' : 'bad'}">${esc(p.avatar)} ${esc(p.name)}: ${x.text ? esc(x.text) : '—'} ${x.ok ? '✓' : '✗'}</span>`;
    }).join('') : '';
    return `<div class="rv">
      <div class="rv-q">${i + 1}. ${LANG[h.from]} ${esc(h.prompt)} <span class="arrow">→</span> ${LANG[otherLang(h.from)]} ${esc(h.answer)}</div>
      <div class="rv-a ${res && res.ok ? 'ok' : 'bad'}">Tú: ${mineTxt}</div>
      <div class="rv-a">👥 ${h.ok} de ${h.n} acertaron</div>
      ${others ? `<div class="rv-others">${others}</div>` : ''}</div>`;
  }).join('');
}

// ---------- Lista de palabras ----------
const wordsView = { cat: 'all', hide: '', q: '', shown: new Set() };

function wordCellHTML(side) {
  return `<b>${esc(side.label)}</b>${side.extra.length ? `<small>También vale: ${side.extra.map(esc).join(', ')}</small>` : ''}`;
}

function renderWords() {
  const q = stripAccents(norm(wordsView.q));
  const hard = new Set(Stats.hardKeys());
  if (wordsView.cat === 'hard' && !hard.size) wordsView.cat = 'all';
  const list = WORDS.map((w, i) => ({ w, i })).filter(({ w }) =>
    (wordsView.cat === 'all' || w.cat === wordsView.cat || (wordsView.cat === 'hard' && hard.has(wordKeyOf(w)))) &&
    (!q || [...w.en.forms, ...w.es.forms].some(f => stripAccents(f).includes(q))));
  const cats = ['all', ...Object.keys(VOCAB), ...(hard.size ? ['hard'] : [])];
  $('wordsCats').innerHTML = cats.map(k => `<button type="button" data-cat="${esc(k)}"${wordsView.cat === k ? ' class="on"' : ''}>
    ${k === 'all' ? 'Todas' : k === 'hard' ? '🧠 Mis difíciles' : esc(VOCAB[k].name)} <small>(${k === 'hard' ? hard.size : countWords(k)})</small></button>`).join('');
  for (const b of $('wordsHide').children) b.classList.toggle('on', b.dataset.hide === wordsView.hide);
  $('wordsCount').textContent = q ? plural(list.length, 'palabra encontrada', 'palabras encontradas') : plural(list.length, 'palabra', 'palabras');
  const cell = (w, i, lang) => {
    if (wordsView.hide === lang && !wordsView.shown.has(i)) return `<div class="wcell covered" data-reveal="${i}">👆 Toca para ver</div>`;
    const bad = lang === 'en' ? Stats.word(wordKeyOf(w)).bad : 0;
    return `<div class="wcell">${bad ? `<span class="wbad" title="Veces que la has fallado">❌ ${bad}</span>` : ''}${wordCellHTML(w[lang])}</div>`;
  };
  $('wordsList').innerHTML = !list.length ? '<p class="msg">No hay ninguna palabra con esa búsqueda.</p>'
    : `<div class="wrow whead"><div>${LANG.en} Inglés</div><div>${LANG.es} Español</div></div>`
      + list.map(({ w, i }) => `<div class="wrow">${cell(w, i, 'en')}${cell(w, i, 'es')}</div>`).join('');
  $('wordsPractice').classList.toggle('hidden', role === 'host' || role === 'guest'); // en una sala no
  $('wordsPractice').textContent = `🎯 Practicar ${wordsView.cat === 'all' ? 'todas' : wordsView.cat === 'hard' ? 'mis difíciles' : VOCAB[wordsView.cat].name}`;
}

function openWords() {
  if (S && ['countdown', 'question', 'reveal'].includes(S.phase)) return; // nada de chuletas en mitad de la partida
  wordsView.shown.clear();
  renderWords();
  $('wordsModal').classList.remove('hidden');
}

function closeWords() {
  $('wordsModal').classList.add('hidden');
}

// ---------- Práctica ----------
function soloPct() {
  const p = S.players[0];
  const total = (S.history || []).length || S.total;
  return total ? p.correct / total : 0;
}

function renderSoloBoard() {
  const p = S.players[0];
  const done = S.phase === 'reveal' ? S.round : S.round - 1;
  const fails = Math.max(0, done - p.correct);
  const bump = lastScores[p.id] !== undefined && p.correct > lastScores[p.id] ? ' bump' : '';
  lastScores[p.id] = p.correct;
  $('scoreboard').innerHTML = `<div class="party-bar solo${p.streak >= 3 ? ' hot' : ''}">
    <div class="pb-info">✅ <b class="sb-score${bump}">${p.correct}</b> ${p.correct === 1 ? 'acierto' : 'aciertos'} &nbsp; ❌ <b>${fails}</b> ${fails === 1 ? 'fallo' : 'fallos'}</div>
    <div class="pb-pos">${p.streak >= 2 ? `🔥 Racha de ${p.streak}` : p.best >= 2 ? `Mejor racha: ${p.best}` : ''}</div></div>`;
}

function soloRevealHTML() {
  const r = S.reveal;
  const res = r.results[me.id] || { text: '', ok: 0 };
  return `${splashHTML(res)}
    <div class="sol-label">Respuesta correcta</div><div class="sol">${esc(r.answer)}</div>${revealAlsoHTML(r)}
    ${!res.ok && res.text ? `<div class="also">Tú pusiste: “${esc(res.text)}”</div>` : ''}
    ${hintRound === S.round && res.ok ? '<div class="also">💡 Con pista: la repasarás en «Mis difíciles»</div>' : ''}
    <button class="btn btn-secondary btn-small next-btn" type="button" data-next>Siguiente ▶ <small>(Enter)</small></button>
    <div class="next-bar"><div id="nextBar"></div></div>`;
}

function renderSoloEnd() {
  const p = S.players[0];
  const hist = S.history || [];
  const total = hist.length;
  const pct = total ? Math.round((p.correct / total) * 100) : 0;
  $('seTitle').textContent = pct === 100 ? '¡Perfecto! 🏆' : pct >= 80 ? '¡Muy bien! 💪' : pct >= 50 ? '¡Vas bien! 👍' : '¡A seguir practicando! 📚';
  const setName = soloRun.name;
  const records = [];
  if (soloRecord.pct) records.push(`🏅 ¡Nuevo récord! Tu mejor resultado ${setName}`);
  if (soloRecord.streak) records.push(`🔥 ¡Récord de racha: ${p.best} seguidas!`);
  const best = soloRun.retry ? null : Stats.bestPct(soloRun.key);
  $('seScore').innerHTML = `<div class="big">${p.correct}<small> / ${total}</small></div>
    <div class="detail">${pct}% de aciertos · mejor racha 🔥 ${p.best}</div>
    ${records.length ? `<div class="records">${records.map(x => `<span>${x}</span>`).join('')}</div>`
      : best !== null ? `<div class="detail">Tu récord ${setName}: ${best}%</div>` : ''}`;
  const fails = hist.filter(h => !(h.results[me.id] || {}).ok);
  $('seRetryBtn').classList.toggle('hidden', !fails.length);
  $('seRetryBtn').textContent = `🔁 Repetir fallos (${fails.length})`;
  $('seFails').innerHTML = !fails.length ? '<p class="msg">¡No has fallado ninguna! 🎉</p>'
    : '<span class="label">Palabras falladas</span>' + fails.map(h => {
      const res = h.results[me.id] || {};
      return `<div class="fail"><div>${LANG[h.from]} <b>${esc(h.prompt)}</b> <span class="arrow">→</span> ${LANG[otherLang(h.from)]} <b class="ok-text">${esc(h.answer)}</b></div>
        <small>Tú: ${res.text ? esc(res.text) : '—'}</small></div>`;
    }).join('');
}
