// Lógica de la partida. Solo la ejecuta quien crea la sala (anfitrión):
// el rival recibe el estado y manda sus respuestas, así nadie ve la solución antes de tiempo.
const AVATARS = ['🦊', '🐼', '🐸', '🐯', '🦁', '🐵', '🐙', '🦄', '🐨', '🐧', '🐶', '🐱', '🐰', '🐻', '🐲', '👽', '🤖', '👻'];
const COUNTDOWN_MS = 3000;
const REVEAL_MS = 4500;

const cleanName = n => String(n || '').replace(/\s+/g, ' ').trim().slice(0, 16) || 'Jugador';
const cleanAvatar = a => (AVATARS.includes(a) ? a : AVATARS[0]);

class HostGame {
  constructor(code, me, send, onChange) {
    this.code = code;
    this.meId = me.id;
    this.send = send;          // manda un mensaje al rival
    this.onChange = onChange;  // pinta el estado en la pantalla del anfitrión
    this.settings = { set: 'all', time: 20, dir: 'mix' };
    this.players = [this.newPlayer(me)];
    this.phase = 'lobby';
    this.deck = [];
    this.round = 0;
    this.answers = {};
    this.reveal = null;
    this.history = [];
    this.winner = null;
    this.endsAt = 0;
    this.duration = 0;
    this.sv = 0;
    this.lastSeen = {};
    this.tickTimer = setInterval(() => this.tick(), 250);
    this.beatTimer = setInterval(() => this.broadcast(), 2000);
  }

  newPlayer(p) {
    return { id: p.id, name: cleanName(p.name), avatar: cleanAvatar(p.avatar), score: 0, wins: 0, crown: false, online: true, rematch: false };
  }

  get guest() { return this.players.find(p => p.id !== this.meId); }

  snapshot() {
    const item = this.phase === 'question' || this.phase === 'reveal' ? this.deck[this.round - 1] : null;
    return {
      sv: ++this.sv,
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
      remaining: Math.max(0, this.endsAt - Date.now()),
      duration: this.duration,
      history: this.phase === 'end' ? this.history : null,
      winner: this.winner,
    };
  }

  broadcast() {
    const snap = this.snapshot();
    this.onChange(snap);
    const g = this.guest;
    if (g) this.send({ t: 'state', to: g.id, s: snap });
  }

  handle(msg) {
    const id = msg.from;
    if (!id) return;
    this.lastSeen[id] = Date.now();
    let p = this.players.find(x => x.id === id);
    if (msg.t === 'hello') {
      if (!p) {
        if (this.players.length >= 2) return this.send({ t: 'full', to: id });
        if (this.phase === 'end') this.toLobby(false);
        this.players.push(this.newPlayer({ id, name: msg.name, avatar: msg.avatar }));
        return this.broadcast();
      }
      p.name = cleanName(msg.name);
      p.avatar = cleanAvatar(msg.avatar);
      if (!p.online) { p.online = true; this.broadcast(); }
      return;
    }
    if (!p) return;
    if (msg.t === 'answer') this.submit(id, msg.round, msg.text);
    else if (msg.t === 'rematch') this.wantRematch(id);
    else if (msg.t === 'bye') this.playerLeft(p);
  }

  playerLeft(p) {
    if (p.id === this.meId) return;
    if (this.phase === 'lobby' || this.phase === 'end') this.players = this.players.filter(x => x !== p);
    else { p.online = false; this.lastSeen[p.id] = 0; }
    this.broadcast();
  }

  tick() {
    const now = Date.now();
    let changed = false;
    for (const p of [...this.players]) {
      if (p.id === this.meId) continue;
      const idle = now - (this.lastSeen[p.id] || 0);
      if (p.online && idle > 7000) { p.online = false; changed = true; }
      if (!p.online && idle > 20000 && (this.phase === 'lobby' || this.phase === 'end')) {
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

  start() {
    if (this.players.length < 2) return;
    this.deck = buildDeck(this.settings);
    this.round = 0;
    this.answers = {};
    this.reveal = null;
    this.history = [];
    this.winner = null;
    this.players.forEach(p => { p.score = 0; p.rematch = false; });
    this.phase = 'countdown';
    this.duration = COUNTDOWN_MS;
    this.endsAt = Date.now() + COUNTDOWN_MS;
    this.broadcast();
  }

  nextQuestion() {
    this.round++;
    this.answers = {};
    this.reveal = null;
    this.phase = 'question';
    this.duration = this.settings.time * 1000;
    this.endsAt = Date.now() + this.duration;
    this.broadcast();
  }

  submit(id, round, text) {
    if (this.phase !== 'question' || round !== this.round || id in this.answers) return;
    this.answers[id] = String(text || '').slice(0, 80);
    this.tick(); // si ya han contestado los dos, se revela al momento
    if (this.phase === 'question') this.broadcast();
  }

  doReveal() {
    const item = this.deck[this.round - 1];
    const results = {};
    for (const p of this.players) {
      const text = this.answers[p.id] || '';
      const ok = text ? checkAnswer(text, item.accepted) : 0;
      if (ok) p.score++;
      results[p.id] = { text, ok };
    }
    this.reveal = { answer: item.answer, also: item.also, results };
    this.history.push({ prompt: item.prompt, from: item.from, answer: item.answer, results });
    this.phase = 'reveal';
    this.duration = REVEAL_MS;
    this.endsAt = Date.now() + REVEAL_MS;
    this.broadcast();
  }

  finish() {
    const [a, b] = this.players;
    this.players.forEach(p => { p.crown = false; p.rematch = false; });
    this.winner = null;
    if (a && b && a.score !== b.score) {
      const w = a.score > b.score ? a : b;
      w.wins++;
      w.crown = true;
      this.winner = w.id;
    }
    this.phase = 'end';
    this.duration = 0;
    this.broadcast();
  }

  wantRematch(id) {
    if (this.phase !== 'end') return;
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
    const g = this.guest;
    if (g) this.send({ t: 'closed', to: g.id });
    clearInterval(this.tickTimer);
    clearInterval(this.beatTimer);
  }
}
