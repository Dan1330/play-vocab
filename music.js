// Música de fondo generada con el propio navegador (no hace falta descargar nada).
// Hay varias canciones de cada tipo que van rotando cada 16 compases.
// Si quieres canciones de verdad, pon archivos en la carpeta "musica": sala.mp3 (menú y salas)
// y partida.mp3 (durante el juego). Si existen, se usan esos en vez de estas.
const Music = (() => {
  // Notas en números MIDI (60 = do central). Acordes: [bajo, [notas]]. Melodías: 64 pasos (0 = silencio).
  const SONGS = {
    lobby: [
      { // tranquila
        bpm: 92, wave: 'triangle', arpEvery: 2, arpVol: 0.05, bass: [0, 8], kick: [0], hat: [4, 12], hatVol: 0.025,
        chords: [[48, [64, 67, 71, 74]], [45, [64, 67, 69, 72]], [41, [65, 69, 72, 76]], [43, [62, 67, 71, 74]]],
      },
      { // soleada, con melodía
        bpm: 100, wave: 'sine', arpEvery: 2, arpVol: 0.06, bass: [0, 6, 8], kick: [0, 8], hat: [2, 6, 10, 14], hatVol: 0.018,
        chords: [[41, [65, 69, 72]], [48, [64, 67, 72]], [50, [62, 65, 69]], [46, [62, 65, 70]]],
        lead: [77, 0, 0, 0, 76, 0, 74, 0, 72, 0, 0, 0, 0, 0, 0, 0, 72, 0, 0, 0, 74, 0, 76, 0, 79, 0, 0, 0, 76, 0, 0, 0,
          74, 0, 0, 0, 72, 0, 69, 0, 74, 0, 0, 0, 0, 0, 0, 0, 70, 0, 0, 0, 72, 0, 74, 0, 77, 0, 0, 0, 0, 0, 0, 0],
        leadVol: 0.05,
      },
      { // de ensueño (jazz suave, bajo andando)
        bpm: 84, wave: 'sine', arpEvery: 4, arpVol: 0.07, bass: [0, 4, 8, 12], walk: true, kick: [], hat: [4, 12], hatVol: 0.02,
        chords: [[50, [65, 69, 72, 76]], [43, [65, 67, 71, 74]], [48, [64, 67, 71, 76]], [45, [64, 67, 69, 72]]],
      },
    ],
    game: [
      { // concurso
        bpm: 124, wave: 'square', arpEvery: 1, arpVol: 0.014, arpUp: 12, bass: [0, 3, 6, 8, 11, 14], octave: true,
        kick: [0, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], hatVol: 0.03,
        chords: [[45, [69, 72, 76]], [41, [69, 72, 77]], [48, [67, 72, 76]], [43, [67, 71, 74]]],
        lead: [81, 0, 0, 79, 0, 0, 76, 0, 0, 0, 74, 0, 76, 0, 0, 0, 77, 0, 0, 76, 0, 0, 72, 0, 0, 0, 69, 0, 72, 0, 0, 0,
          79, 0, 0, 76, 0, 0, 72, 0, 0, 0, 76, 0, 79, 0, 0, 0, 74, 0, 0, 0, 79, 0, 0, 0, 83, 0, 81, 0, 79, 0, 0, 0],
        leadVol: 0.065,
      },
      { // persecución
        bpm: 132, wave: 'square', arpEvery: 1, arpVol: 0.012, arpUp: 12, bass: [0, 2, 4, 6, 8, 10, 12, 14], octave: true,
        kick: [0, 6, 8, 14], snare: [4, 12], hat: [2, 6, 10, 14], hatVol: 0.035,
        chords: [[40, [64, 67, 71]], [36, [64, 67, 72]], [43, [62, 67, 71]], [38, [62, 66, 69]]],
        lead: [76, 0, 79, 0, 83, 0, 0, 0, 81, 0, 79, 0, 76, 0, 0, 0, 76, 0, 79, 0, 84, 0, 0, 0, 83, 0, 79, 0, 76, 0, 0, 0,
          79, 0, 83, 0, 86, 0, 0, 0, 83, 0, 81, 0, 79, 0, 0, 0, 78, 0, 0, 0, 81, 0, 0, 0, 78, 0, 74, 0, 0, 0, 0, 0],
        leadVol: 0.05,
      },
      { // funky
        bpm: 116, wave: 'triangle', arpEvery: 2, arpVol: 0.04, arpUp: 12, bass: [0, 3, 7, 10, 12, 14], octave: true,
        kick: [0, 7, 10], snare: [4, 12], hat: [0, 2, 3, 4, 6, 8, 10, 11, 12, 14], hatVol: 0.025,
        chords: [[38, [65, 69, 74]], [46, [65, 70, 74]], [48, [64, 67, 72]], [45, [64, 69, 73]]],
        lead: [74, 0, 0, 77, 0, 0, 79, 0, 81, 0, 79, 0, 77, 0, 74, 0, 0, 0, 72, 0, 74, 0, 0, 0, 77, 0, 0, 0, 0, 0, 0, 0,
          74, 0, 0, 77, 0, 0, 79, 0, 81, 0, 84, 0, 81, 0, 79, 0, 0, 0, 76, 0, 77, 0, 76, 0, 73, 0, 0, 0, 0, 0, 0, 0],
        leadVol: 0.055,
      },
    ],
  };
  const BARS_PER_SONG = 16;

  let ctx = null, bus = null, noiseBuf = null, timer = null, fileAudio = null;
  let current = null, tension = false, step = 0, bar = 0, nextTime = 0;
  const songIndex = { lobby: 0, game: 0 };
  let enabled = true;
  try { enabled = localStorage.getItem('vd_music') !== '0'; } catch (e) {}
  const files = { lobby: { src: 'musica/sala.mp3' }, game: { src: 'musica/partida.mp3' } };

  const freq = m => 440 * 2 ** ((m - 69) / 12);

  function tone(m, t, dur, type, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq(m);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise(t, dur, vol, cutoff) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuf;
    f.type = 'highpass';
    f.frequency.value = cutoff;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(bus);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  function kick(t, vol) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 0.22);
  }

  // Una semicorchea (paso s del compás b) de una canción
  function playStep(song, b, s, t, len) {
    const [bass, chord] = song.chords[b % 4];
    const bi = song.bass.indexOf(s);
    if (bi >= 0) {
      let note = bass;
      if (song.octave && bi % 2) note += 12;
      if (song.walk) note += [0, 4, 7, 9][bi % 4]; // bajo andando
      tone(note, t, len * (song.bass.length > 4 ? 1.7 : 3.5), 'triangle', 0.16);
    }
    if (s % song.arpEvery === 0) {
      const i = s / song.arpEvery;
      tone(chord[i % chord.length] + (song.arpUp || 0), t, len * song.arpEvery * 1.4, song.wave, song.arpVol);
    }
    const lead = song.lead && song.lead[(b % 4) * 16 + s];
    if (lead) tone(lead, t, len * 2.6, 'triangle', song.leadVol);
    if (song.kick.includes(s) || (tension && s === 12)) kick(t, current === 'game' ? 0.3 : 0.16);
    if (song.snare && song.snare.includes(s)) noise(t, 0.12, 0.07, 1800);
    if (song.hat.includes(s) || (tension && s % 2)) noise(t, 0.03, tension ? 0.05 : song.hatVol, 8000);
  }

  function schedule() {
    if (!current || fileAudio) return;
    let song = SONGS[current][songIndex[current]];
    while (nextTime < ctx.currentTime + 0.6) {
      const len = 60 / (song.bpm * (tension ? 1.13 : 1)) / 4;
      playStep(song, bar, step, nextTime, len);
      nextTime += len;
      if (++step === 16) {
        step = 0;
        if (++bar % BARS_PER_SONG === 0) { // siguiente canción de la lista
          songIndex[current] = (songIndex[current] + 1) % SONGS[current].length;
          song = SONGS[current][songIndex[current]];
          bar = 0;
        }
      }
    }
  }

  function stopNow() {
    clearInterval(timer);
    timer = null;
    if (bus) {
      const old = bus;
      old.gain.setTargetAtTime(0, ctx.currentTime, 0.12); // fundido
      setTimeout(() => old.disconnect(), 800);
      bus = null;
    }
    if (fileAudio) { fileAudio.pause(); fileAudio = null; }
    current = null;
  }

  function startTrack(name) {
    stopNow();
    if (!name) return;
    current = name;
    const file = files[name];
    if (file.audio) { // canción puesta en la carpeta "musica"
      fileAudio = file.audio;
      fileAudio.currentTime = 0;
      fileAudio.playbackRate = tension ? 1.12 : 1;
      fileAudio.play().catch(() => {});
      return;
    }
    if (!file.tried) tryFile(name);
    bus = ctx.createGain();
    bus.gain.value = 0.55;
    bus.connect(ctx.destination);
    step = 0;
    bar = 0;
    nextTime = ctx.currentTime + 0.08;
    schedule();
    timer = setInterval(schedule, 100);
  }

  function tryFile(name) {
    const file = files[name];
    file.tried = true;
    const a = new Audio();
    a.loop = true;
    a.volume = 0.35;
    a.addEventListener('canplaythrough', () => {
      file.audio = a;
      if (current === name) startTrack(name);
    }, { once: true });
    a.src = file.src;
  }

  return {
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem('vd_music', enabled ? '1' : '0'); } catch (e) {}
      if (!enabled) stopNow();
      return enabled;
    },
    // Se llama continuamente con la música que toca (o null) y si hay tensión (últimos segundos)
    want(name, tense) {
      if (!enabled || document.hidden) { if (current) stopNow(); return; }
      if (!ctx) {
        ctx = Sound.audioCtx(); // solo existe después de tocar algo en la página
        if (!ctx) return;
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      if (ctx.state !== 'running') return;
      if (tense !== tension) {
        tension = tense;
        if (fileAudio) fileAudio.playbackRate = tension ? 1.12 : 1;
      }
      if (name !== current) startTrack(name);
    },
    stop: stopNow,
  };
})();

document.addEventListener('visibilitychange', () => { if (document.hidden) Music.stop(); });
