// Voz del navegador: elige la voz inglesa más clara que haya (las "Natural" de Edge, las de Google en Chrome,
// las "Enhanced" de Apple…) y nunca lee el inglés con una voz española. Se puede elegir otra voz y la velocidad.
const Voice = (() => {
  const synth = window.speechSynthesis || null;
  let voices = [];
  let loaded = false;
  const waiting = [];
  const prefs = { name: '', rate: 1 }; // voz elegida ('' = la mejor automática) y velocidad (0.8 / 1 / 1.15)
  try { Object.assign(prefs, JSON.parse(localStorage.getItem('vd_voice') || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem('vd_voice', JSON.stringify(prefs)); } catch (e) {} };

  function load() {
    if (!synth) return;
    const list = synth.getVoices();
    if (!list.length) return;
    voices = list;
    loaded = true;
    while (waiting.length) waiting.shift()();
  }
  if (synth) {
    load();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', load);
    else synth.onvoiceschanged = load;
    setTimeout(() => { loaded = true; while (waiting.length) waiting.shift()(); }, 1500); // por si nunca avisa
  }

  const langOf = v => String(v.lang || '').toLowerCase().replace('_', '-');
  // voces de broma de Apple que no sirven para aprender
  const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox/i;
  // Puntuación de calidad: cuanto más alta, más clara suele ser la voz
  function score(v, lang) {
    if (!langOf(v).startsWith(lang)) return -1;
    const n = v.name;
    let s = 0;
    if (/natural|neural/i.test(n)) s += 60;
    if (/online/i.test(n)) s += 15;
    if (/google/i.test(n)) s += 45;
    if (/premium|enhanced|siri/i.test(n)) s += 50;
    if (NOVELTY.test(n)) s -= 100;
    const l = langOf(v);
    if (lang === 'en') s += l === 'en-gb' ? 10 : l === 'en-us' ? 8 : l === 'en-ie' || l === 'en-au' ? 4 : 0;
    else s += l === 'es-es' ? 10 : 0;
    return s;
  }
  const list = lang => voices.filter(v => score(v, lang) >= 0).sort((a, b) => score(b, lang) - score(a, lang));

  // Hombre o mujer (para dar voces distintas a los personajes), por el nombre de las voces más comunes
  const FEMALE = /female|sonia|libby|maisie|hazel|susan|zira|aria|jenny|michelle|emma|natasha|clara|kate|serena|martha|samantha|karen|moira|tessa|fiona|victoria|ava\b|allison|catherine|heera|neerja|ana\b|sara\b|emily/i;
  const MALE = /\bmale|ryan|thomas|george|david|mark|guy|christopher|eric|brian|daniel|arthur|oliver|alex\b|fred|liam|william|andrew|roger|steffan|james|noah|tom\b/i;
  const genderOf = v => (FEMALE.test(v.name) && !/\bmale/i.test(v.name) ? 'f' : MALE.test(v.name) ? 'm' : '');

  // La voz para leer en ese idioma. variant: otro personaje (otra voz parecida de buena calidad); gender: 'f' o 'm'
  function pick(lang, variant = 0, gender = '') {
    const all = list(lang);
    if (!all.length) return null;
    const chosen = lang === 'en' && prefs.name ? all.find(v => v.name === prefs.name) : null;
    const top = score(chosen || all[0], lang);
    const good = all.filter(v => score(v, lang) >= top - 20); // solo voces de calidad parecida
    if (chosen) { good.splice(good.indexOf(chosen), 1); good.unshift(chosen); }
    if (!variant && !gender) return good[0];
    const pool = gender ? good.filter(v => genderOf(v) === gender) : [];
    const from = pool.length ? pool : good;
    return from[variant % from.length];
  }

  // Lee un texto. opts: rate, pitch, variant, gender, quiet (sin avisos), onend (avisa al terminar, aunque el navegador no lo haga)
  function speak(text, lang = 'en', opts = {}) {
    const done = typeof opts.onend === 'function' ? opts.onend : null;
    if (!synth) {
      if (!opts.quiet) toast('Tu navegador no puede leer en voz alta');
      return false;
    }
    // queued: se lee después de cargar las voces (ya se dijo que sí se podía, así que hay que avisar al terminar)
    const go = queued => {
      const voice = pick(lang, opts.variant || 0, opts.gender || '');
      if (!voice) { // mejor no leer que leer el inglés con acento español
        if (!opts.quiet) toast(lang === 'en' ? 'Tu navegador no tiene voz en inglés: ábrelo en Chrome o Edge (en 🎵 tienes más ayuda)' : 'No hay voz en español');
        if (queued && done) done();
        return false;
      }
      const u = new SpeechSynthesisUtterance(String(text).replace(/\s*\/\s*/g, ', ').replace(/_{2,}/g, ' … '));
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = Math.min(1.6, Math.max(0.5, (opts.rate || 0.95) * (lang === 'en' ? prefs.rate : 1)));
      u.pitch = opts.pitch || 1;
      if (done) {
        let called = false;
        const finish = () => { if (!called) { called = true; done(); } };
        u.onend = finish;
        u.onerror = finish;
        setTimeout(finish, 2500 + (String(text).length * 90) / u.rate);
      }
      if (synth.speaking || synth.pending) synth.cancel();
      synth.resume(); // Chrome a veces se queda en pausa
      synth.speak(u);
      return true;
    };
    if (loaded) return go(false);
    waiting.push(() => go(true));
    return true;
  }

  function stop() { if (synth) synth.cancel(); }

  return {
    speak, stop, pick,
    get ready() { return loaded; },
    // ¿Hay alguna voz inglesa? (mientras no han cargado, se supone que sí)
    hasEnglish: () => !!synth && (!loaded || list('en').length > 0),
    englishVoices: () => list('en'),
    quality: v => score(v, 'en'),
    get prefs() { return prefs; },
    setVoice(name) { prefs.name = name; save(); },
    setRate(rate) { prefs.rate = rate; save(); },
    onReady(fn) { if (loaded) fn(); else waiting.push(fn); },
  };
})();
