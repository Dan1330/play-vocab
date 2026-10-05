// Lógica de la partida. La ejecuta solo quien crea la sala (anfitrión), o tu propio navegador
// en el modo práctica. El resto recibe el estado y manda sus respuestas.
const AVATARS = [
  '🦊', '🐼', '🐸', '🐯', '🦁', '🐵', '🐙', '🦄', '🐨', '🐧', '🐶', '🐱', '🐰', '🐻', '🐲', '👽', '🤖', '👻',
  '🐮', '🐷', '🐔', '🐤', '🦉', '🦇', '🐺', '🐗', '🐴', '🦓', '🦒', '🐘', '🦏', '🦛', '🐭', '🐹', '🦔', '🦦',
  '🦥', '🦘', '🐊', '🐢', '🦎', '🐍', '🦖', '🦕', '🐳', '🐬', '🦈', '🐠', '🐡', '🦀', '🦞', '🦑', '🐌', '🦋',
  '🐝', '🐞', '🦜', '🦩', '🦚', '🦢', '😎', '🤠', '🥳', '🤓', '😈', '🤡', '💀', '🎃', '🧙', '🧛', '🧟', '🧜',
  '🧞', '🦸', '🦹', '🍕', '🍩', '🍉', '🥑', '🌮', '🍔', '🍟', '🍦', '🍿', '🧁', '🎬', '🎥', '🎤', '🎧', '🎸',
  '🎮', '📸', '🚀', '⚽', '🏀', '🎯', '🎲', '💎', '🔥', '⚡', '🌈', '⭐', '🌵', '🌻', '🍄', '🌙', '🪐', '🍀',
];
const MAX_PLAYERS = { duel: 2, party: 40, solo: 1 };
const REACTIONS = ['👏', '😂', '😮', '🔥', '😭', '🎉'];
const COUNTDOWN_MS = 3000;
const REVEAL_MS = 5000;        // 1 vs 1
const PARTY_REVEAL_MS = 8000;  // multijugador: da tiempo a ver las respuestas y la clasificación
const SOLO_OK_MS = 1600;       // práctica: si aciertas pasa rápido...
const SOLO_BAD_MS = 4500;      // ...y si fallas te deja leer la respuesta

const cleanName = n => String(n || '').replace(/\s+/g, ' ').trim().slice(0, 16) || 'Jugador';
const cleanAvatar = a => (AVATARS.includes(a) ? a : AVATARS[0]);

// Temas (bloques de words.js). Se juega con los que estén marcados.
const ALL_SETS = Object.keys(VOCAB);
const validSets = sets => (Array.isArray(sets) ? sets : []).filter(k => ALL_SETS.includes(k));
const countSets = sets => WORDS.filter(w => sets.includes(w.cat)).length;
const deckFor = settings => {
  const sets = validSets(settings.sets);
  const cards = buildDeck({ ...settings, set: 'all' }).filter(c => sets.includes(c.cat));
  return settings.answer === 'quiz' ? cards.map(withOptions) : cards;
};

// Modo quiz: la respuesta buena y 3 palabras al azar (mejor del mismo tema) que no sean válidas
function withOptions(card) {
  const to = card.from === 'en' ? 'es' : 'en';
  const ok = new Set(card.accepted.map(stripAccents));
  const valid = w => w[to].label !== card.answer && !w[to].forms.some(f => ok.has(stripAccents(f)));
  const pool = [...shuffle(WORDS.filter(w => w.cat === card.cat && valid(w))), ...shuffle(WORDS.filter(w => w.cat !== card.cat && valid(w)))];
  const wrong = [];
  for (const w of pool) {
    if (!wrong.includes(w[to].label)) wrong.push(w[to].label);
    if (wrong.length === 3) break;
  }
  const options = shuffle([card.answer, ...wrong]);
  return { ...card, options, correct: options.indexOf(card.answer) };
}

// Clasificación: más puntos primero; si empatan, quien acertó más rápido
const rankPlayers = players => [...players].sort((a, b) => b.score - a.score || a.time - b.time);

// Puntos por acierto: 1, +1 si aciertas en los primeros segundos (todos los que lo consigan)
// y la racha (como en Kahoot): con 3 aciertos seguidos +1 extra por acierto, con 5 o más +2 extra
const FAST_MS = 5000;
const streakBonus = streak => (streak >= 5 ? 2 : streak >= 3 ? 1 : 0);

class HostGame {
  // restore: estado que te pasa el anfitrión anterior al hacerte anfitrión (jugadores, victorias...)
  constructor(code, me, send, onChange, mode = 'duel', settings = null, restore = null) {
    this.code = code;
    this.meId = me.id;
    this.send = send;          // manda un mensaje a los demás
    this.onChange = onChange;  // pinta el estado en la pantalla del anfitrión
    this.mode = mode;          // 'duel' (1 vs 1), 'party' (multijugador) o 'solo' (práctica)
    this.max = MAX_PLAYERS[mode];
    this.settings = settings ? { ...settings } : { sets: [...ALL_SETS], time: 20, dir: 'mix', answer: 'type' };
    if (!validSets(this.settings.sets).length) this.settings.sets = [...ALL_SETS];
    this.players = [this.newPlayer(me)];
    this.phase = 'lobby';
    this.deck = [];
    this.round = 0;
    this.answers = {};
    this.answerMs = {};
    this.choices = {};  // modo quiz: casilla elegida por cada jugador
    this.actN = {};   // nº de la última acción de cada jugador en la ronda (ordena envíos repetidos)
    this.prev = {};   // respuesta retirada con "Cancelar y editar"
    this.qStart = 0;
    this.reveal = null;
    this.history = [];
    this.winner = null;
    this.endsAt = 0;
    this.duration = 0;
    this.sv = 0;
    this.v = 0;
    this.sentV = 0;
    this.lastSeen = {};
    this.banned = new Set();
    this.netTimer = null;
    this.lastNet = 0;
    this.gone = {};             // victorias de quien salió de la sala (por si vuelve)
    this.music = null;          // música de YouTube de la sala: { id, startedAt }
    this.lastReact = {};
    this.onReact = () => {};    // pinta una reacción en la pantalla del anfitrión
    if (restore) {
      if (restore.music) this.music = { id: restore.music.id, startedAt: Date.now() - restore.music.pos * 1000 };
      const now = Date.now();
      this.players = restore.players.map(p => ({ ...p, online: true, rematch: false }));
      this.players.sort((a, b) => (a.id === this.meId ? -1 : b.id === this.meId ? 1 : 0)); // el anfitrión, primero
      this.players.forEach(p => { this.lastSeen[p.id] = now; });
      this.banned = new Set(restore.banned || []);
      this.sv = (restore.sv || 0) + 10; // sigue la numeración para que los demás acepten el estado
    }
    this.tickTimer = setInterval(() => this.tick(), 250);
    this.beatTimer = mode === 'duel' ? setInterval(() => this.broadcast(), 2000)
      : mode === 'party' ? setInterval(() => this.beat(), 4000) : null;
  }

  // Pasar el anfitrión a otro jugador (solo en la sala o al final de una partida)
  handOver(toId) {
    if (this.phase !== 'lobby' && this.phase !== 'end') return null;
    const target = this.players.find(p => p.id === toId);
    if (!target || !target.online || toId === this.meId) return null;
    const state = {
      mode: this.mode, settings: { ...this.settings }, sv: this.sv,
      players: this.players.map(p => ({ ...p })), banned: [...this.banned], music: this.musicNow(),
    };
    this.send({ t: 'host', to: toId, state });
    this.stop();
    return state;
  }

  stop() {
    clearInterval(this.tickTimer);
    clearInterval(this.beatTimer);
    clearTimeout(this.netTimer);
  }

  newPlayer(p) {
    return {
      id: p.id, name: cleanName(p.name), avatar: cleanAvatar(p.avatar),
      score: 0, correct: 0, wins: 0, crown: false, online: true, rematch: false, time: 0, streak: 0, best: 0,
    };
  }

  get guest() { return this.players.find(p => p.id !== this.meId); }

  snapshot() {
    const item = this.phase === 'question' || this.phase === 'reveal' ? this.deck[this.round - 1] : null;
    return {
      sv: ++this.sv,
      v: this.v,
      mode: this.mode,
      max: this.max,
      code: this.code,
      hostId: this.meId,
      phase: this.phase,
      settings: { ...this.settings },
      players: this.players.map(p => ({ ...p })),
      round: this.round,
      total: this.deck.length,
      q: item ? { prompt: item.prompt, from: item.from, cat: item.cat, options: item.options || null } : null,
      answered: Object.fromEntries(Object.keys(this.answers).map(id => [id, true])),
      reveal: this.phase === 'reveal' ? this.reveal : null,
      remaining: this.duration ? Math.max(0, this.endsAt - Date.now()) : 0,
      duration: this.duration,
      history: this.phase === 'end' ? this.history : null,
      winner: this.winner,
      music: this.musicNow(),
    };
  }

  musicNow() {
    return this.music ? { id: this.music.id, pos: (Date.now() - this.music.startedAt) / 1000 } : null;
  }

  // Música de YouTube para toda la sala (null = volver a la del juego)
  setMusic(id) {
    this.music = id ? { id, startedAt: Date.now() } : null;
    this.broadcast();
  }

  broadcast() {
    this.v++;
    const snap = this.snapshot();
    this.onChange(snap);
    if (this.mode === 'duel') {
      const g = this.guest;
      if (g) this.send({ t: 'state', to: g.id, s: snap });
    } else if (this.mode === 'party') {
      this.queueNet();
    }
  }

  // Multijugador: junta los envíos (máx. ~3 por segundo) para no saturar los servidores
  queueNet() {
    if (this.netTimer) return;
    const wait = Math.max(0, 300 - (Date.now() - this.lastNet));
    this.netTimer = setTimeout(() => {
      this.netTimer = null;
      this.lastNet = Date.now();
      if (this.players.length < 2) return;
      const snap = this.snapshot();
      this.sentV = snap.v;
      this.send({ t: 'state', to: '*', s: snap });
    }, wait);
  }

  // Multijugador: latido pequeño; quien se haya perdido algo pide el estado completo
  beat() {
    if (this.players.length > 1) this.send({ t: 'beat', to: '*', v: this.sentV });
  }

  handle(msg) {
    const id = msg.from;
    if (!id) return;
    if (this.banned.has(id)) return this.send({ t: 'kicked', to: id });
    this.lastSeen[id] = Date.now();
    let p = this.players.find(x => x.id === id);
    if (msg.t === 'hello') {
      if (!p) {
        // ¿Vuelve alguien que se había ido? Recupera su puesto (sin duplicarse); solo pierde la racha
        const back = this.reclaim(msg);
        if (back) {
          this.renameId(back, id);
          back.online = true;
          back.streak = 0;
          this.lastSeen[id] = Date.now();
          return this.broadcast();
        }
        if (this.players.length >= this.max) return this.send({ t: 'full', to: id, max: this.max });
        if (this.mode === 'duel' && this.phase === 'end') this.toLobby(false);
        const np = this.newPlayer({ id, name: msg.name, avatar: msg.avatar });
        const old = this.gone[norm(np.name)]; // ya estuvo en la sala: conserva sus victorias
        if (old) { np.wins = old.wins; np.crown = old.crown; delete this.gone[norm(np.name)]; }
        this.players.push(np);
        return this.broadcast();
      }
      p.name = cleanName(msg.name);
      p.avatar = cleanAvatar(msg.avatar);
      if (!p.online || msg.j === 0) { // vuelve a entrar: le mandamos el estado ya
        if (!p.online) p.streak = 0;
        p.online = true;
        this.broadcast();
      }
      return;
    }
    if (!p) return;
    if (msg.t === 'answer') this.submit(id, msg.round, msg.text, msg.n, msg.choice);
    else if (msg.t === 'unanswer') this.unsubmit(id, msg.round, msg.n);
    else if (msg.t === 'rematch') this.wantRematch(id);
    else if (msg.t === 'bye') this.playerLeft(p);
    else if (msg.t === 'sync' && this.mode === 'party') this.queueNet();
    else if (msg.t === 'react') this.react(id, msg.e);
  }

  // Reacciones con emojis: se reenvían a todos (máx. una cada 0,4 s por jugador)
  react(id, e) {
    const now = Date.now();
    if (!REACTIONS.includes(e) || now - (this.lastReact[id] || 0) < 400) return;
    this.lastReact[id] = now;
    if (this.mode === 'party') this.send({ t: 'react', to: '*', id, e });
    else if (this.mode === 'duel') { const g = this.guest; if (g) this.send({ t: 'react', to: g.id, id, e }); }
    this.onReact(id, e);
  }

  // Jugador desconectado con el mismo nombre (y si puede, el mismo avatar) que el que entra
  reclaim(msg) {
    const key = norm(cleanName(msg.name));
    const offline = this.players.filter(p => !p.online && p.id !== this.meId && norm(p.name) === key);
    return offline.find(p => p.avatar === msg.avatar) || (offline.length === 1 ? offline[0] : null);
  }

  // Le pasa a su nuevo id todo lo que tenía (respuestas, historial...)
  renameId(p, newId) {
    const old = p.id;
    for (const map of [this.answers, this.answerMs, this.choices, this.actN, this.prev, this.lastReact]) {
      if (old in map) { map[newId] = map[old]; delete map[old]; }
    }
    for (const h of this.history) {
      if (h.results && old in h.results) { h.results[newId] = h.results[old]; delete h.results[old]; }
    }
    if (this.reveal && old in this.reveal.results) { this.reveal.results[newId] = this.reveal.results[old]; delete this.reveal.results[old]; }
    if (this.winner === old) this.winner = newId;
    delete this.lastSeen[old];
    p.id = newId;
  }

  // Quien sale de la sala entre partidas: guardamos sus victorias por si vuelve
  removePlayer(p) {
    this.gone[norm(p.name)] = { wins: p.wins, crown: p.crown };
    this.players = this.players.filter(x => x !== p);
  }

  playerLeft(p) {
    if (p.id === this.meId) return;
    if (this.phase === 'lobby' || this.phase === 'end') this.removePlayer(p);
    else { p.online = false; this.lastSeen[p.id] = 0; }
    this.broadcast();
  }

  kick(id) {
    if (this.mode !== 'party' || id === this.meId) return;
    this.banned.add(id);
    this.players = this.players.filter(p => p.id !== id);
    this.send({ t: 'kicked', to: id });
    this.broadcast();
  }

  tick() {
    const now = Date.now();
    const idleLimit = this.mode === 'party' ? 12000 : 7000;
    const removeLimit = this.mode === 'party' ? 25000 : 20000;
    let changed = false;
    for (const p of [...this.players]) {
      if (p.id === this.meId) continue;
      const idle = now - (this.lastSeen[p.id] || 0);
      if (p.online && idle > idleLimit) { p.online = false; changed = true; }
      if (!p.online && idle > removeLimit && (this.phase === 'lobby' || this.phase === 'end')) {
        this.removePlayer(p);
        changed = true;
      }
    }
    if (this.phase === 'countdown' && now >= this.endsAt) return this.nextQuestion();
    if (this.phase === 'question') {
      const waiting = this.players.some(p => p.online && !(p.id in this.answers));
      if (!waiting || now >= this.endsAt) return this.doReveal();
    }
    if (this.phase === 'reveal' && now >= this.endsAt) {
      return this.round >= this.deck.length ? this.finish() : this.nextQuestion();
    }
    if (changed) this.broadcast();
  }

  start(deck = null) {
    if (this.players.length < (this.mode === 'duel' ? 2 : 1)) return;
    const cards = deck || deckFor(this.settings);
    if (!cards.length) return;
    this.deck = cards;
    this.round = 0;
    this.answers = {};
    this.reveal = null;
    this.history = [];
    this.winner = null;
    this.players.forEach(p => { p.score = 0; p.correct = 0; p.rematch = false; p.time = 0; p.streak = 0; p.best = 0; });
    this.phase = 'countdown';
    this.duration = COUNTDOWN_MS;
    this.endsAt = Date.now() + COUNTDOWN_MS;
    this.broadcast();
  }

  nextQuestion() {
    this.round++;
    this.answers = {};
    this.answerMs = {};
    this.choices = {};
    this.actN = {};
    this.prev = {};
    this.reveal = null;
    this.phase = 'question';
    this.qStart = Date.now();
    this.duration = this.settings.time * 1000; // 0 = sin límite (solo en práctica)
    this.endsAt = this.duration ? this.qStart + this.duration : Infinity;
    this.broadcast();
  }

  submit(id, round, text, n = 1, choice = null) {
    if (this.phase !== 'question' || round !== this.round || n <= (this.actN[id] || 0)) return;
    this.actN[id] = n;
    this.answers[id] = String(text || '').slice(0, 80);
    this.answerMs[id] = Date.now() - this.qStart;
    this.choices[id] = Number.isInteger(choice) ? choice : null;
    delete this.prev[id];
    if (this.mode === 'party') {
      this.send({ t: 'ans', to: '*', id, r: this.round }); // aviso pequeño en vez del estado entero
      this.onChange(this.snapshot());
      this.tick();
      return;
    }
    this.tick(); // si ya han contestado todos, se revela al momento
    if (this.phase === 'question') this.broadcast();
  }

  // "Cancelar y editar": retira la respuesta mientras los demás no hayan terminado.
  // Si se acaba el tiempo sin volver a enviarla, cuenta la anterior.
  unsubmit(id, round, n = 1) {
    if (this.phase !== 'question' || round !== this.round || n <= (this.actN[id] || 0)) return;
    this.actN[id] = n;
    if (!(id in this.answers)) return;
    this.prev[id] = { text: this.answers[id], ms: this.answerMs[id], choice: this.choices[id] };
    delete this.answers[id];
    delete this.answerMs[id];
    delete this.choices[id];
    if (this.mode === 'party') {
      this.send({ t: 'unans', to: '*', id, r: this.round });
      this.onChange(this.snapshot());
    } else {
      this.broadcast();
    }
  }

  doReveal() {
    const item = this.deck[this.round - 1];
    for (const id of Object.keys(this.prev)) {
      if (!(id in this.answers)) {
        this.answers[id] = this.prev[id].text;
        this.answerMs[id] = this.prev[id].ms;
        this.choices[id] = this.prev[id].choice;
      }
    }
    const quiz = Array.isArray(item.options);
    const results = {};
    let okCount = 0;
    for (const p of this.players) {
      const text = this.answers[p.id] || '';
      const ok = quiz ? (this.choices[p.id] === item.correct ? 1 : 0) : text ? checkAnswer(text, item.accepted) : 0;
      const ms = p.id in this.answerMs ? this.answerMs[p.id] : null;
      if (ok) {
        p.streak++;
        const fast = this.mode !== 'solo' && ms !== null && ms <= FAST_MS; // en práctica no hay bonus
        const bonus = this.mode === 'solo' ? 0 : streakBonus(p.streak);
        const pts = (fast ? 2 : 1) + bonus;
        p.score += pts;
        p.correct++;
        p.best = Math.max(p.best, p.streak);
        p.time += ms || 0;
        okCount++;
        results[p.id] = { text, ok, pts, fast, bonus, streak: p.streak, ms };
      } else {
        results[p.id] = { text, ok: 0, pts: 0, lost: p.streak, ms };
        p.streak = 0;
      }
      if (quiz) results[p.id].choice = this.choices[p.id];
    }
    this.reveal = { answer: item.answer, also: quiz ? [] : item.also, results, correct: quiz ? item.correct : null };
    const entry = { prompt: item.prompt, from: item.from, answer: item.answer };
    if (this.mode === 'party') { entry.ok = okCount; entry.n = this.players.length; }
    else entry.results = results;
    this.history.push(entry);
    this.phase = 'reveal';
    if (this.mode === 'solo') this.duration = results[this.meId].ok ? SOLO_OK_MS : SOLO_BAD_MS;
    else this.duration = this.mode === 'party' ? PARTY_REVEAL_MS : REVEAL_MS;
    this.endsAt = Date.now() + this.duration;
    this.broadcast();
  }

  // Práctica: Enter pasa a la siguiente palabra sin esperar
  skipReveal() {
    if (this.mode !== 'solo' || this.phase !== 'reveal') return;
    if (Date.now() < this.endsAt - this.duration + 400) return; // evita saltársela sin querer
    this.endsAt = 0;
    this.tick();
  }

  finish() {
    this.players.forEach(p => { p.crown = false; p.rematch = false; });
    this.winner = null;
    if (this.mode === 'duel') {
      const [a, b] = this.players;
      if (a && b && a.score !== b.score) {
        const w = a.score > b.score ? a : b;
        w.wins++;
        w.crown = true;
        this.winner = w.id;
      }
    } else if (this.mode === 'party') {
      const top = rankPlayers(this.players)[0];
      if (top && top.score > 0) {
        top.wins++;
        top.crown = true;
        this.winner = top.id;
      }
    }
    this.phase = 'end';
    this.duration = 0;
    this.broadcast();
  }

  // "Terminar partida": acaba ya y enseña los resultados hasta aquí, sin sacar a nadie de la sala
  endGame() {
    if (!['countdown', 'question', 'reveal'].includes(this.phase)) return;
    if (!this.history.length) return this.toLobby(); // aún no se había jugado ninguna palabra
    this.deck = this.deck.slice(0, this.history.length);
    this.round = this.history.length;
    this.finish();
  }

  wantRematch(id) {
    if (this.mode !== 'duel' || this.phase !== 'end') return;
    const p = this.players.find(x => x.id === id);
    if (!p) return;
    p.rematch = true;
    if (this.players.length === 2 && this.players.every(x => x.rematch)) this.start();
    else this.broadcast();
  }

  toLobby(notify = true) {
    this.phase = 'lobby';
    this.players.forEach(p => { p.rematch = false; });
    this.reveal = null;
    if (notify) this.broadcast();
  }

  setSettings(patch) {
    if (this.phase !== 'lobby') return;
    if ('sets' in patch) {
      patch.sets = validSets(patch.sets);
      if (!patch.sets.length) return; // siempre al menos un tema
    }
    Object.assign(this.settings, patch);
    this.broadcast();
  }

  close() {
    if (this.mode === 'duel') {
      const g = this.guest;
      if (g) this.send({ t: 'closed', to: g.id });
    } else if (this.mode === 'party' && this.players.length > 1) {
      this.send({ t: 'closed', to: '*' });
    }
    this.stop();
  }
}
