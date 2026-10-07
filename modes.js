// Pantallas de los modos práctica (solo) y multijugador (party).

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// Lo marcado en cada grupo de casillas (los ejercicios, con los de siempre si no hay nada guardado)
const KIND_CONTENT = { wkinds: 'words', pkinds: 'phrases', tkinds: 'texts' };
const checkedOf = (settings, key) => (KIND_CONTENT[key] ? validKinds(settings[key], KIND_CONTENT[key]) : settings[key] || []);
// Ejercicios en los que importa en qué idioma sale la pregunta
const DIR_KINDS = { words: ['type', 'quiz', 'first', 'tf', 'match'], phrases: ['quiz', 'type', 'tf'], texts: [] };

function paintSettings(box, settings, editable) {
  const content = CONTENTS.includes(settings.content) ? settings.content : 'words';
  for (const seg of box.querySelectorAll('.seg')) {
    for (const btn of seg.children) {
      btn.classList.toggle('on', String(settings[seg.dataset.key]) === btn.dataset.val);
      btn.disabled = !editable;
    }
  }
  // en la sala "exam" es la lista del anfitrión; en la práctica, sí/no (y se usa tu lista)
  const examList = Array.isArray(settings.exam) ? settings.exam : settings.exam && Exam.count ? Exam.keys() : null;
  const examN = examList ? examList.length : 0;
  for (const inp of box.querySelectorAll('input[type="checkbox"]')) {
    if (inp.value === 'hard') inp.checked = !!settings.hard;
    else if (inp.value === 'exam') inp.checked = examN > 0;
    else inp.checked = checkedOf(settings, inp.closest('.checks').dataset.key).includes(inp.value);
    inp.disabled = !editable;
    inp.closest('.check-chip').classList.toggle('on', inp.checked);
  }
  // grupos: cuántos hay marcados; se abren solos si hay unos sí y otros no
  for (const g of box.querySelectorAll('.check-group')) {
    const key = g.closest('.checks').dataset.key;
    const keys = [...g.querySelectorAll('.cg-body input')].map(i => i.value);
    const on = keys.filter(k => checkedOf(settings, key).includes(k));
    g.querySelector('.cg-count').textContent = key === 'sets'
      ? `${on.length} de ${keys.length} temas · ${plural(on.reduce((s, k) => s + countWords(k), 0), 'palabra', 'palabras')}`
      : `${on.length} de ${keys.length}`;
    if (!g.dataset.touched) g.classList.toggle('open', keys.length <= 3 || (on.length > 0 && on.length < keys.length));
    g.classList.toggle('none', !on.length);
    for (const b of g.querySelectorAll('.cg-btns button')) b.disabled = !editable;
    g.querySelector('.cg-all').classList.toggle('hidden', on.length === keys.length);
    g.querySelector('.cg-none').classList.toggle('hidden', !on.length);
  }
  const examChip = box.querySelector('.exam-chip');
  if (examChip) {
    examChip.querySelector('small').textContent = examN || Exam.count;
    box.querySelector('.exam-edit').classList.toggle('hidden', !editable);
  }
  box.classList.toggle('exam-on', examN > 0);
  for (const b of box.querySelectorAll('.check-all')) {
    const key = b.closest('.checks').dataset.key;
    b.disabled = !editable;
    b.classList.toggle('hidden', checkedOf(settings, key).length === allValues(key).length);
  }
  // filas de palabras, de expresiones o de textos, según lo que se practique
  for (const row of box.querySelectorAll('[data-for]')) row.classList.toggle('hidden', row.dataset.for !== content);
  const kinds = checkedOf(settings, { words: 'wkinds', phrases: 'pkinds', texts: 'tkinds' }[content]);
  const dirRow = box.querySelector('[data-dir]');
  dirRow.classList.toggle('hidden', !kinds.some(k => DIR_KINDS[content].includes(k)));
  dirRow.querySelector('.dir-label').textContent = content === 'phrases' ? 'La frase sale en…' : 'La palabra sale en…';
  const total = poolCount({ ...settings, exam: examList });
  box.querySelector('.count-note').textContent = `· al azar entre ${total} ${unitName(settings, total)}`;
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
    : S.players.length > 1 ? `${S.players.length} jugadores · ${n} ${unitName(S.settings, n)} · ¡Cuando quieras!`
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
    const shown = answerText(res, S.reveal && S.reveal.kind);
    const key = res.text ? (res.ok ? 'ok:' : 'bad:') + norm(shown) : 'none';
    if (!groups.has(key)) groups.set(key, { text: shown, ok: res.ok, who: [] });
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
  return `${splashHTML(r.results[me.id])}${solHTML(r)}
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
    const mineTxt = res ? `${res.ok ? '✓' : '✗'} ${res.text ? esc(answerText(res, h.kind)) : '—'}` : '—';
    const all = roundLog[i + 1];
    const others = all ? S.players.filter(p => p.id !== me.id && all[p.id]).map(p => {
      const x = all[p.id];
      return `<span class="${x.ok ? 'ok' : 'bad'}">${esc(p.avatar)} ${esc(p.name)}: ${x.text ? esc(answerText(x, h.kind)) : '—'} ${x.ok ? '✓' : '✗'}</span>`;
    }).join('') : '';
    return `<div class="rv">
      <div class="rv-q">${i + 1}. ${LANG[h.from]} ${esc(h.prompt)} <span class="arrow">→</span> ${LANG[h.to || otherLang(h.from)]} ${esc(h.answer)}</div>
      <div class="rv-a ${res && res.ok ? 'ok' : 'bad'}">Tú: ${mineTxt}</div>
      <div class="rv-a">👥 ${h.ok} de ${h.n} acertaron</div>
      ${others ? `<div class="rv-others">${others}</div>` : ''}</div>`;
  }).join('');
}

// ---------- Lista de palabras y expresiones ----------
const wordsView = { tab: 'words', cat: 'all', hide: '', q: '', shown: new Set() };

function wordCellHTML(side) {
  return `<b>${esc(side.label)}</b>${side.extra.length ? `<small>También vale: ${side.extra.map(esc).join(', ')}</small>` : ''}`;
}

// Contenido de una casilla de la lista (palabra o expresión, en inglés o en español)
function wordsCellInner(i, lang) {
  if (wordsView.tab === 'words') return wordCellHTML(WORDS[i][lang]);
  const p = PHRASES[i];
  const say = lang === 'en' ? p.en : expandPhrase(p.es)[0];
  return `<button type="button" class="say-btn" data-say="${lang}" data-text="${esc(say)}" title="Escuchar">🔊</button><b>${esc(p[lang])}</b>`;
}

function renderWords() {
  const phrases = wordsView.tab === 'phrases';
  const q = stripAccents(norm(wordsView.q));
  const hard = new Set(Stats.hardKeys(phrases ? isPhraseKey : k => !isPhraseKey(k)));
  if (wordsView.cat === 'hard' && !hard.size) wordsView.cat = 'all';
  const cat = wordsView.cat;
  for (const b of $('wordsTabs').children) {
    b.classList.toggle('on', b.dataset.tab === wordsView.tab);
    b.querySelector('small').textContent = `(${b.dataset.tab === 'phrases' ? PHRASES.length : WORDS.length})`;
  }
  // desplegable de temas (o secciones)
  let opts = `<option value="all">${phrases ? `Todas las expresiones (${PHRASES.length})` : `Todos los temas (${WORDS.length})`}</option>`;
  if (hard.size) opts += `<option value="hard">🧠 Mis difíciles (${hard.size})</option>`;
  opts += phrases ? ALL_PSETS.map(k => `<option value="${k}">${esc(PHRASE_SETS[k].name)} (${countPhrases([k])})</option>`).join('')
    : GROUPS.map(g => `<optgroup label="${esc(g)}">${ALL_SETS.filter(k => groupOf(k) === g)
      .map(k => `<option value="${k}">${esc(VOCAB[k].name)} (${countWords(k)})</option>`).join('')}</optgroup>`).join('');
  setHTML($('wordsCat'), opts);
  $('wordsCat').value = cat;
  for (const b of $('wordsHide').children) b.classList.toggle('on', b.dataset.hide === wordsView.hide);
  const items = phrases
    ? PHRASES.map((p, i) => ({ i, cat: p.cat, key: phraseKeyOf(p), text: stripAccents(norm(p.en + ' ' + p.es)) }))
    : WORDS.map((w, i) => ({ i, cat: w.cat, key: wordKeyOf(w), forms: [...w.en.forms, ...w.es.forms] }));
  const list = items.filter(it => (cat === 'all' || it.cat === cat || (cat === 'hard' && hard.has(it.key)))
    && (!q || (phrases ? it.text.includes(q) : it.forms.some(f => stripAccents(f).includes(q)))));
  const unit = phrases ? ['expresión', 'expresiones'] : ['palabra', 'palabras'];
  $('wordsCount').textContent = plural(list.length, unit[0], unit[1]) + (q ? (list.length === 1 ? ' encontrada' : ' encontradas') : '');
  const cell = (it, lang) => {
    if (wordsView.hide === lang && !wordsView.shown.has(it.i)) return `<div class="wcell covered" data-reveal="${it.i}">👆 Toca para ver</div>`;
    const bad = lang === 'en' ? Stats.word(it.key).bad : 0;
    const lvl = lang === 'en' ? Stats.level(it.key) : 0;
    const lvlBadge = lvl ? `<span class="wlevel" title="${['', 'Aprendiendo', 'Casi dominada', 'Dominada'][lvl]}">${['', '🌱', '🌿', '🌳'][lvl]}</span>` : '';
    return `<div class="wcell${phrases ? ' phrase' : ''}">${bad ? `<span class="wbad" title="Veces que la has fallado">❌ ${bad}</span>` : ''}${lvlBadge}${wordsCellInner(it.i, lang)}</div>`;
  };
  $('wordsList').innerHTML = !list.length ? `<p class="msg">No hay ninguna ${unit[0]} con esa búsqueda.</p>`
    : `<div class="wrow whead"><div>${LANG.en} Inglés</div><div>${LANG.es} Español</div></div>`
      + list.map(it => `<div class="wrow">${cell(it, 'en')}${cell(it, 'es')}</div>`).join('');
  $('wordsPractice').classList.toggle('hidden', role === 'host' || role === 'guest'); // en una sala no
  const name = cat === 'all' ? (phrases ? 'todas las expresiones' : 'todas') : cat === 'hard' ? 'mis difíciles'
    : (phrases ? PHRASE_SETS[cat].name : VOCAB[cat].name).replace(/^\d+ · /, '');
  $('wordsPractice').textContent = `${phrases ? '💬' : '🎯'} Practicar ${name}`;
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
  return soloSummary().pct / 100;
}

function renderSoloBoard() {
  const p = S.players[0];
  const done = S.phase === 'reveal' ? S.round : S.round - 1;
  const fails = Math.max(0, done - p.correct);
  const bump = lastScores[p.id] !== undefined && p.correct > lastScores[p.id] ? ' bump' : '';
  lastScores[p.id] = p.correct;
  $('scoreboard').innerHTML = `<div class="party-bar solo${p.streak >= 3 ? ' hot' : ''}">
    <div class="pb-info">✅ <b class="sb-score${bump}">${p.correct}</b> ${p.correct === 1 ? 'acierto' : 'aciertos'} &nbsp; ❌ <b>${fails}</b> ${fails === 1 ? 'fallo' : 'fallos'}</div>
    <div class="pb-pos">${host && host.deck[S.round - 1] && host.deck[S.round - 1].tries ? '🔁 Repaso de una que fallaste'
      : p.streak >= 2 ? `🔥 Racha de ${p.streak}` : p.best >= 2 ? `Mejor racha: ${p.best}` : ''}</div></div>`;
}

function soloRevealHTML() {
  const r = S.reveal;
  const res = r.results[me.id] || { text: '', ok: 0 };
  const card = host && host.deck[S.round - 1];
  const how = inputOf(r.kind);
  const typed = how === 'text' || how === 'order'; // se escribe (o se ordena): se puede explicar el fallo
  const learn = !!S.settings.learn;
  const retype = !res.ok && learn && typed && card; // modo aprender: escríbela bien para seguir
  const tips = !res.ok && typed && card ? (card.ph ? Teach.explainPhrase(res.text, card) : Teach.explain(res.text, card)) : [];
  let tools, extra = '';
  const enText = card && (card.ph || card.tx) ? card.en || card.say || '' : '';
  if (card && (card.ph || card.tx)) {
    // frases y textos: escucharla y ver el vocabulario que lleva dentro
    const vocab = enText ? vocabIn(enText) : [];
    tools = enText ? `<button type="button" class="btn-mini" data-say="en" data-text="${esc(enText)}">🔊 En inglés</button>
      <button type="button" class="btn-mini" data-say="en" data-rate="0.6" data-text="${esc(enText)}">🐢 Despacio</button>` : '';
    if (card.es) tools += `<button type="button" class="btn-mini" data-say="es" data-text="${esc(expandPhrase(card.es)[0])}">🔊 En español</button>`;
    if (vocab.length) extra += `<div class="vocab-box"><b>📘 Vocabulario de la frase</b>${vocab.map(w => `<span>${esc(w.en.label)} = ${esc(w.es.label)}</span>`).join('')}</div>`;
  } else {
    const w = card && wordOf(card.key);
    const enWord = w ? firstSyn(w.en.label) : S.q.from === 'en' ? S.q.prompt : r.answer;
    const esWord = w ? w.es.label : S.q.from === 'es' ? S.q.prompt : r.answer;
    tools = `<button type="button" class="btn-mini" data-say="en" data-text="${esc(enWord)}">🔊 ${esc(enWord)}</button>
      <button type="button" class="btn-mini" data-say="es" data-text="${esc(esWord)}">🔊 ${esc(esWord)}</button>
      <a class="btn-mini" href="${Teach.dictLink(enWord)}" target="_blank" rel="noopener">📖 Diccionario</a>`;
  }
  const sentence = card && card.ph && !card.full;
  const typeIt = !card ? '' : sentence ? expandPhrase(card.answer)[0] : card.ph ? card.answer : expandForms([card.answer])[0];
  return `${splashHTML(res)}${solHTML(r)}${extra}
    <div class="learn-tools">${tools}</div>
    ${tips.length ? `<div class="tips"><b>💡 Por qué has fallado</b><ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
    ${!res.ok && res.text && typed ? `<div class="also">Tú pusiste: “${esc(res.text)}”</div>` : ''}
    ${hintRound === S.round && res.ok ? '<div class="also">💡 Con pista: la repasarás en «Mis difíciles»</div>' : ''}
    ${!res.ok && learn && card && (card.tries || 0) < 2 ? '<div class="also">🔁 Te la volveré a preguntar dentro de poco.</div>' : ''}
    ${retype ? `<div class="retype">
        <label for="retypeInput">✍️ ${sentence ? 'Escribe la frase bien' : 'Escríbela bien'} para seguir (así se te queda)</label>
        <div class="answer-row">
          <input id="retypeInput" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" maxlength="150" placeholder="${esc(typeIt)}">
          <button class="btn btn-primary" type="button" data-retype>Comprobar</button>
        </div>
        <button class="btn-link" type="button" data-next>Saltar ▶</button>
      </div>`
    : `<button class="btn btn-secondary btn-small next-btn" type="button" data-next>Siguiente ▶ <small>(Enter)</small></button>
       ${S.duration ? '<div class="next-bar"><div id="nextBar"></div></div>' : ''}`}`;
}

// Resumen de la práctica por palabra: a la primera, aprendidas (falladas y luego bien) y por repasar
function soloSummary() {
  const byKey = new Map();
  for (const h of S.history || []) {
    const k = h.key;
    if (!byKey.has(k)) byKey.set(k, { h, tries: [] });
    byKey.get(k).tries.push((h.results[me.id] || {}).ok ? 1 : 0);
  }
  const all = [...byKey.values()];
  const first = all.filter(e => e.tries[0]);
  const learned = all.filter(e => !e.tries[0] && e.tries.some(Boolean));
  const pending = all.filter(e => !e.tries.some(Boolean));
  return { total: all.length, first, learned, pending, pct: all.length ? Math.round((first.length / all.length) * 100) : 0 };
}

function renderSoloEnd() {
  const p = S.players[0];
  const sum = soloSummary();
  const total = sum.total;
  const pct = sum.pct;
  $('seTitle').textContent = pct === 100 ? '¡Perfecto! 🏆' : pct >= 80 ? '¡Muy bien! 💪' : pct >= 50 ? '¡Vas bien! 👍' : '¡A seguir practicando! 📚';
  const setName = soloRun.name;
  const records = [];
  if (soloRecord.pct) records.push(`🏅 ¡Nuevo récord! Tu mejor resultado ${setName}`);
  if (soloRecord.streak) records.push(`🔥 ¡Récord de racha: ${p.best} seguidas!`);
  const best = soloRun.retry ? null : Stats.bestPct(soloRun.key);
  const mastered = sum.first.concat(sum.learned).filter(e => Stats.level(e.h.key) === 3).length;
  $('seScore').innerHTML = `<div class="big">${sum.first.length}<small> / ${total}</small></div>
    <div class="detail">${pct}% a la primera · mejor racha 🔥 ${p.best}</div>
    <div class="learn-sum">
      <span class="ls ok">✅ ${sum.first.length} a la primera</span>
      ${sum.learned.length ? `<span class="ls learn">🧠 ${sum.learned.length} ${sum.learned.length === 1 ? 'aprendida' : 'aprendidas'}</span>` : ''}
      ${sum.pending.length ? `<span class="ls todo">📚 ${sum.pending.length} por repasar</span>` : ''}
      ${mastered ? `<span class="ls master">🌳 ${mastered} ${mastered === 1 ? 'dominada' : 'dominadas'}</span>` : ''}
    </div>
    ${records.length ? `<div class="records">${records.map(x => `<span>${x}</span>`).join('')}</div>`
      : best !== null ? `<div class="detail">Tu récord ${setName}: ${best}%</div>` : ''}`;
  const missed = sum.learned.concat(sum.pending); // las que fallaste alguna vez
  $('seRetryBtn').classList.toggle('hidden', !missed.length);
  $('seRetryBtn').textContent = `🔁 Repetir fallos (${missed.length})`;
  $('seFails').innerHTML = !missed.length ? '<p class="msg">¡No has fallado ninguna! 🎉</p>'
    : '<span class="label">Para repasar</span>' + missed.map(e => {
      const h = e.h;
      const wrong = (S.history || []).filter(x => x.key === h.key).map(x => x.results[me.id] || {}).filter(r => !r.ok && r.text).map(r => answerText(r, h.kind));
      const learnedIt = e.tries.some(Boolean);
      return `<div class="fail${learnedIt ? ' learned' : ''}"><div>${LANG[h.from]} <b>${esc(h.prompt)}</b> <span class="arrow">→</span> ${LANG[h.to || otherLang(h.from)]} <b class="ok-text">${esc(h.answer)}</b>
        ${learnedIt ? '<span class="tag-learned">🧠 aprendida</span>' : ''}</div>
        ${h.sub ? `<small>🇪🇸 ${esc(h.sub)}</small><br>` : ''}<small>Tú: ${wrong.length ? wrong.map(esc).join(' · ') : '—'}</small></div>`;
    }).join('');
}
