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
const COUNTDOWN_MS = 3000;
const REVEAL_MS = 4500;        // 1 vs 1
const PARTY_REVEAL_MS = 6000;  // multijugador: da tiempo a ver la clasificación
const SOLO_OK_MS = 1600;       // práctica: si aciertas pasa rápido...
const SOLO_BAD_MS = 4500;      // ...y si fallas te deja leer la respuesta

const cleanName = n => String(n || '').replace(/\s+/g, ' ').trim().slice(0, 16) || 'Jugador';
const cleanAvatar = a => (AVATARS.includes(a) ? a : AVATARS[0]);

// Clasificación: más aciertos primero; si empatan, quien acertó más rápido
const rankPlayers = players => [...players].sort((a, b) => b.score - a.score || a.time - b.time);

class HostGame {
  constructor(code, me, send, onChange, mode = 'duel', settings = null) {
    this.code = code;
    this.meId = me.id;
    this.send = send;          // manda un mensaje a los demás
    this.onChange = onChange;  // pinta el estado en la pantalla del anfitrión
    this.mode = mode;          // 'duel' (1 vs 1), 'party' (multijugador) o 'solo' (práctica)
    this.max = MAX_PLAYERS[mode];
    this.settings = settings ? { ...settings } : { set: 'all', time: 20, dir: 'mix' };
    this.players = [this.newPlayer(me)];
    this.phase = 'lobby';
    this.deck = [];
    this.round = 0;
    this.answers = {};
    this.answerMs = {};
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
    this.tickTimer = setInterval(() => this.tick(), 250);
    this.beatTimer = mode === 'duel' ? setInterval(() => this.broadcast(), 2000)
      : mode === 'party' ? setInterval(() => this.beat(), 4000) : null;
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
      q: item ? { prompt: item.prompt, from: item.from, cat: item.cat } : null,
      answered: Object.fromEntries(Object.keys(this.answers).map(id => [id, true])),
      reveal: this.phase === 'reveal' ? this.reveal : null,
      remaining: this.duration ? Math.max(0, this.endsAt - Date.now()) : 0,
      duration: this.duration,
      history: this.phase === 'end' ? this.history : null,
      winner: this.winner,
    };
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
        if (this.players.length >= this.max) return this.send({ t: 'full', to: id, max: this.max });
        if (this.mode === 'duel' && this.phase === 'end') this.toLobby(false);
        this.players.push(this.newPlayer({ id, name: msg.name, avatar: msg.avatar }));
        return this.broadcast();
      }
      p.name = cleanName(msg.name);
      p.avatar = cleanAvatar(msg.avatar);
      if (!p.online) { p.online = true; this.broadcast(); }
      return;
    }
    if (!p) return;
    if (msg.t === 'answer') this.submit(id, msg.round, msg.text, msg.n);
    else if (msg.t === 'unanswer') this.unsubmit(id, msg.round, msg.n);
    else if (msg.t === 'rematch') this.wantRematch(id);
    else if (msg.t === 'bye') this.playerLeft(p);
    else if (msg.t === 'sync' && this.mode === 'party') this.queueNet();
  }

  playerLeft(p) {
    if (p.id === this.meId) return;
    if (this.phase === 'lobby' || this.phase === 'end') this.players = this.players.filter(x => x !== p);
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
        this.players = this.players.filter(x => x !== p);
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
    const cards = deck || buildDeck(this.settings);
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
    this.actN = {};
    this.prev = {};
    this.reveal = null;
    this.phase = 'question';
    this.qStart = Date.now();
    this.duration = this.settings.time * 1000; // 0 = sin límite (solo en práctica)
    this.endsAt = this.duration ? this.qStart + this.duration : Infinity;
    this.broadcast();
  }

  submit(id, round, text, n = 1) {
    if (this.phase !== 'question' || round !== this.round || n <= (this.actN[id] || 0)) return;
    this.actN[id] = n;
    this.answers[id] = String(text || '').slice(0, 80);
    this.answerMs[id] = Date.now() - this.qStart;
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
    this.prev[id] = { text: this.answers[id], ms: this.answerMs[id] };
    delete this.answers[id];
    delete this.answerMs[id];
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
      if (!(id in this.answers)) { this.answers[id] = this.prev[id].text; this.answerMs[id] = this.prev[id].ms; }
    }
    const oks = {};
    for (const p of this.players) {
      const text = this.answers[p.id] || '';
      oks[p.id] = text ? checkAnswer(text, item.accepted) : 0;
    }
    // El primero que acierta se lleva 2 puntos; el resto de aciertos, 1 (en práctica siempre 1)
    let fastest = null;
    if (this.mode !== 'solo') {
      for (const p of this.players) {
        if (oks[p.id] && (!fastest || this.answerMs[p.id] < this.answerMs[fastest])) fastest = p.id;
      }
    }
    const results = {};
    let okCount = 0;
    for (const p of this.players) {
      const ok = oks[p.id];
      const pts = ok ? (p.id === fastest ? 2 : 1) : 0;
      if (ok) {
        p.score += pts;
        p.correct++;
        p.streak++;
        p.best = Math.max(p.best, p.streak);
        p.time += this.answerMs[p.id] || 0;
        okCount++;
      } else {
        p.streak = 0;
      }
      results[p.id] = { text: this.answers[p.id] || '', ok, pts };
    }
    this.reveal = { answer: item.answer, also: item.also, results };
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
    clearInterval(this.tickTimer);
    clearInterval(this.beatTimer);
    clearTimeout(this.netTimer);
  }
}
