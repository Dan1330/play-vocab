// Pantallas de los modos práctica (solo) y multijugador (party).

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function paintSettings(box, settings, editable) {
  for (const seg of box.querySelectorAll('.seg')) {
    for (const btn of seg.children) {
      btn.classList.toggle('on', String(settings[seg.dataset.key]) === btn.dataset.val);
      btn.disabled = !editable;
    }
  }
  box.classList.toggle('readonly', !editable);
}

function myResultHTML(res) {
  const mine = S.players.find(p => p.id === me.id) || me;
  const said = res.text ? `“${esc(res.text)}”` : '<i>sin respuesta</i>';
  return `<div class="result${res.ok ? ' ok' : ''}">${avatarHTML(mine, false)}
    <div class="r-text"><b>Tú</b>: ${said}${resultNotes(res)}</div>
    <div class="r-points">${ptsHTML(res)}</div></div>`;
}

// ---------- Multijugador ----------
function renderPartyLobby() {
  const isHost = role === 'host';
  $('pRoomCode').textContent = S.code;
  $('pCount').textContent = `${S.players.length} / ${S.max}`;
  $('pPlayers').innerHTML = S.players.map(p => `<div class="pchip${p.id === me.id ? ' me' : ''}${p.online ? '' : ' off'}">
    ${avatarHTML(p)}<span class="pname">${esc(p.name)}</span>
    ${p.id === S.hostId ? '<span class="tag">Anfitrión</span>' : ''}${p.id === me.id ? '<span class="tag me">Tú</span>' : ''}
    ${p.wins ? `<span class="tag">🏆 ${p.wins}</span>` : ''}
    ${isHost && p.id !== me.id ? `<button class="kick" type="button" data-kick="${esc(p.id)}" title="Sacar de la sala">✕</button>` : ''}
  </div>`).join('');
  paintSettings($('pSettings'), S.settings, isHost);
  $('pStartBtn').classList.toggle('hidden', !isHost);
  const n = countWords(S.settings.set);
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
  const bump = lastScores[mine.id] !== undefined && mine.score > lastScores[mine.id] ? ' bump' : '';
  lastScores[mine.id] = mine.score;
  $('scoreboard').innerHTML = `<div class="party-bar">
    <div class="pb-info"><div>${info}</div><div class="pb-dots">${dots}</div></div>
    <div class="pb-me">${avatarHTML(mine)}<div><div class="sb-score${bump}">${mine.score}<small> pts</small></div>
      <div class="pb-pos">${pos}º de ${S.players.length}${mine.streak > 1 ? ` · 🔥${mine.streak}` : ''}</div></div></div>
  </div>`;
}

function partyStatus() {
  const left = S.players.filter(p => p.online && !S.answered[p.id]).length;
  return left ? `✅ Enviado. ${left === 1 ? 'Falta 1' : `Faltan ${left}`} por responder…` : '✅ Enviado';
}

function partyRevealHTML() {
  const r = S.reveal;
  const ranked = rankPlayers(S.players);
  const myPos = ranked.findIndex(p => p.id === me.id);
  const row = (p, i) => {
    const res = r.results[p.id] || { ok: 0 };
    return `<div class="lb-row${p.id === me.id ? ' me' : ''}"><span class="lb-pos">${i + 1}</span>${avatarHTML(p, false)}
      <span class="lb-name">${esc(p.name)}</span><span class="lb-round${res.ok ? ' ok' : ''}">${res.ok ? '+' + (res.pts || 1) : '✗'}</span>
      <span class="lb-score">${p.score}</span></div>`;
  };
  const rows = ranked.slice(0, 5).map(row).join('') + (myPos >= 5 ? `<div class="lb-gap">···</div>${row(ranked[myPos], myPos)}` : '');
  const fast = S.players.find(p => (r.results[p.id] || {}).pts > 1);
  const mineR = r.results[me.id];
  return `<div class="sol-label">Respuesta correcta</div><div class="sol">${esc(r.answer)}</div>${revealAlsoHTML(r)}
    ${mineR ? myResultHTML(mineR) : ''}
    ${fast ? `<div class="fast">⚡ El más rápido: ${esc(fast.avatar)} <b>${esc(fast.name)}</b> (+2)</div>` : ''}
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
  const medals = ['🥇', '🥈', '🥉'];
  $('pePodium').innerHTML = [1, 0, 2].filter(i => ranked[i]).map(i => {
    const p = ranked[i];
    const win = p.id === S.winner;
    return `<div class="pod p${i + 1}${win ? ' win' : ''}">${win ? '<span class="big-crown">👑</span>' : ''}
      <div class="medal">${medals[i]}</div>${avatarHTML(p, false)}
      <div class="name">${esc(p.name)}${p.id === me.id ? ' (tú)' : ''}</div>
      <div class="score">${p.score}<small> pts</small></div><div class="detail">${plural(p.correct, 'acierto', 'aciertos')}</div></div>`;
  }).join('');
  $('peRanking').innerHTML = ranked.map((p, i) => `<div class="lb-row${p.id === me.id ? ' me' : ''}">
    <span class="lb-pos">${i + 1}</span>${avatarHTML(p, false)}
    <span class="lb-name">${esc(p.name)}${p.online ? '' : ' 🔌'}</span>
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
    return `<div class="rv">
      <div class="rv-q">${i + 1}. ${LANG[h.from]} ${esc(h.prompt)} <span class="arrow">→</span> ${LANG[otherLang(h.from)]} ${esc(h.answer)}</div>
      <div class="rv-a ${res && res.ok ? 'ok' : 'bad'}">Tú: ${mineTxt}</div>
      <div class="rv-a">👥 ${h.ok} de ${h.n} acertaron</div></div>`;
  }).join('');
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
  $('scoreboard').innerHTML = `<div class="party-bar solo">
    <div class="pb-info">✅ <b class="sb-score${bump}">${p.correct}</b> ${p.correct === 1 ? 'acierto' : 'aciertos'} &nbsp; ❌ <b>${fails}</b> ${fails === 1 ? 'fallo' : 'fallos'}</div>
    <div class="pb-pos">${p.streak > 1 ? `🔥 Racha de ${p.streak}` : ''}</div></div>`;
}

function soloRevealHTML() {
  const r = S.reveal;
  const res = r.results[me.id] || { text: '', ok: 0 };
  return `<div class="sol-label">Respuesta correcta</div><div class="sol">${esc(r.answer)}</div>${revealAlsoHTML(r)}
    ${myResultHTML(res)}
    <button class="btn btn-secondary btn-small next-btn" type="button" data-next>Siguiente ▶ <small>(Enter)</small></button>
    <div class="next-bar"><div id="nextBar"></div></div>`;
}

function renderSoloEnd() {
  const p = S.players[0];
  const hist = S.history || [];
  const total = hist.length;
  const pct = total ? Math.round((p.correct / total) * 100) : 0;
  $('seTitle').textContent = pct === 100 ? '¡Perfecto! 🏆' : pct >= 80 ? '¡Muy bien! 💪' : pct >= 50 ? '¡Vas bien! 👍' : '¡A seguir practicando! 📚';
  $('seScore').innerHTML = `<div class="big">${p.correct}<small> / ${total}</small></div>
    <div class="detail">${pct}% de aciertos · mejor racha 🔥 ${p.best}</div>`;
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
