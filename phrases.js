// Expresiones del PDF «2627 PRAE EXPRESSIONS VOCABULARY»: [inglés, español, { alt: otras en inglés, esAlt: otras en español }]
// " / " separa alternativas (vale una o las dos), "buscar/visitar" también, y "o/a" = masculino/femenino.
const PHRASE_SETS = {
  p01: {
    name: '1 · Producción y planificación',
    items: [
      ["Let's go through the production plan.", 'Vamos a revisar el plan de producción.'],
      ['We need to finalize the schedule.', 'Tenemos que cerrar el calendario.'],
      ["Let's check the production schedule.", 'Vamos a revisar el calendario de producción.'],
      ["What's the deadline?", '¿Cuál es la fecha límite?'],
      ["We're working to a tight deadline.", 'Trabajamos con un plazo muy ajustado.'],
      ["We're running behind schedule.", 'Vamos retrasados respecto al calendario.'],
      ["We're ahead of schedule.", 'Vamos por delante del calendario.'],
      ['We need to stick to the schedule.', 'Tenemos que ajustarnos al calendario.'],
      ["Let's move on to the next item.", 'Pasemos al siguiente punto.'],
      ["Let's go over the details.", 'Vamos a repasar los detalles.'],
      ['We need to make a few changes.', 'Tenemos que hacer algunos cambios.'],
      ['Keep me updated.', 'Mantenme informado/a.'],
      ["I'll keep you posted.", 'Te mantendré informado/a.'],
      ["I'll get back to you.", 'Me pondré en contacto contigo.'],
      ["I'll check and let you know.", 'Lo comprobaré y te lo comunicaré.'],
    ],
  },
  p02: {
    name: '2 · Reuniones y comunicación profesional',
    items: [
      ["Let's get started.", 'Empecemos.'],
      ['Shall we start?', '¿Empezamos?'],
      ["Let's go over the agenda.", 'Repasemos el orden del día.'],
      ["What's the current status?", '¿Cuál es el estado actual?'],
      ['Are we all on the same page?', '¿Estamos todos de acuerdo / entendemos lo mismo?'],
      ['Does everyone agree?', '¿Estamos todos de acuerdo?'],
      ["That's a good point.", 'Es un buen punto.'],
      ['I agree.', 'Estoy de acuerdo.'],
      ['I see your point.', 'Entiendo tu punto de vista.'],
      ['We need to discuss this further.', 'Tenemos que hablar más sobre esto.'],
      ["Let's take a closer look at it.", 'Vamos a analizarlo más detenidamente.'],
      ['Could you clarify that?', '¿Podrías aclararlo?'],
      ['Could you explain that in more detail?', '¿Podrías explicarlo con más detalle?'],
      ["I'll make a note of that.", 'Tomo nota de ello.'],
      ["Let's keep that in mind.", 'Tengamos eso en cuenta.'],
    ],
  },
  p03: {
    name: '3 · Rodaje y dirección',
    items: [
      ['Are we ready to shoot?', '¿Estamos preparados para rodar?'],
      ['Stand by.', 'Preparados / en espera.'],
      ['Quiet on set, please.', 'Silencio en el plató, por favor.'],
      ['Ready when you are.', 'Listos cuando tú quieras.'],
      ['Rolling.', 'Grabando.'],
      ['Camera ready.', 'Cámara preparada.', { alt: ['Camera is ready.'] }],
      ['Sound ready.', 'Sonido preparado.'],
      ['Lights ready.', 'Iluminación preparada.'],
      ['And... action!', 'Y... ¡acción!', { alt: ['Action!'], esAlt: ['¡Acción!'] }],
      ['Cut!', '¡Corten!'],
      ["Let's do another take.", 'Hagamos otra toma.'],
      ["Let's do one more.", 'Hagamos una más.'],
      ['That was a good take.', 'Ha sido una buena toma.'],
      ["Let's go again.", 'Vamos otra vez.'],
      ['Reset, please.', 'Volvemos a la posición inicial, por favor.'],
      ['Back to one.', 'Volvemos al principio.'],
      ['Hold that position.', 'Mantén esa posición.'],
      ['Stay where you are.', 'Quédate donde estás.'],
      ['Move slightly to the left.', 'Muévete ligeramente a la izquierda.'],
      ['Look into camera.', 'Mira a cámara.'],
    ],
  },
  p04: {
    name: '4 · Cámara y realización',
    items: [
      ['Get the shot ready.', 'Prepara el plano.'],
      ['Frame the shot.', 'Encuadra el plano.'],
      ['Check the framing.', 'Comprueba el encuadre.'],
      ['Check the focus.', 'Comprueba el enfoque.'],
      ['Pull focus.', 'Haz un cambio de foco.'],
      ['Keep the subject in frame.', 'Mantén al sujeto en el encuadre.'],
      ['Go wider.', 'Abre el plano.'],
      ['Go tighter.', 'Cierra el plano.'],
      ['Hold the shot.', 'Mantén el plano.'],
      ['Follow the action.', 'Sigue la acción.'],
      ['Pan left.', 'Haz una panorámica hacia la izquierda.'],
      ['Pan right.', 'Haz una panorámica hacia la derecha.'],
      ['Tilt up.', 'Inclina la cámara hacia arriba.'],
      ['Tilt down.', 'Inclina la cámara hacia abajo.'],
      ['Move in.', 'Acércate.'],
      ['Move back.', 'Aléjate.'],
      ['Camera is ready.', 'La cámara está preparada.', { alt: ['Camera ready.'] }],
      ['We need another angle.', 'Necesitamos otro ángulo.'],
      ["Let's get a close-up.", 'Hagamos un primer plano.'],
      ["Let's get a wide shot.", 'Hagamos un plano general.'],
    ],
  },
  p05: {
    name: '5 · Sonido durante la producción',
    items: [
      ['Sound ready?', '¿Sonido preparado?'],
      ['Check the sound levels.', 'Comprueba los niveles de sonido.'],
      ['Check the microphone.', 'Comprueba el micrófono.'],
      ['Check the boom.', 'Comprueba la pértiga.'],
      ["We're getting some background noise.", 'Estamos captando algo de ruido de fondo.'],
      ["There's too much noise.", 'Hay demasiado ruido.'],
      ['The dialogue is too quiet.', 'El diálogo está demasiado bajo.'],
      ['The dialogue is too loud.', 'El diálogo está demasiado alto.'],
      ['We need another take for sound.', 'Necesitamos otra toma para sonido.'],
      ['We need room tone.', 'Necesitamos grabar tono de sala.'],
      ['Keep the microphone out of shot.', 'Mantén el micrófono fuera de plano.'],
      ['Watch the levels.', 'Vigila los niveles.'],
      ["We're getting clipping.", 'Estamos teniendo saturación.'],
      ['The signal is clean.', 'La señal está limpia.'],
      ['We have good sound.', 'Tenemos buen sonido.'],
    ],
  },
  p06: {
    name: '6 · Iluminación',
    items: [
      ['Check the lighting.', 'Comprueba la iluminación.'],
      ['Adjust the key light.', 'Ajusta la luz principal.'],
      ['Add some fill light.', 'Añade algo de luz de relleno.'],
      ['Reduce the intensity.', 'Reduce la intensidad.'],
      ['Increase the intensity.', 'Aumenta la intensidad.'],
      ['Move the light.', 'Mueve la luz.'],
      ['Move the light closer.', 'Acerca la luz.'],
      ['Move the light further away.', 'Aleja la luz.', { alt: ['Move the light farther away.'] }],
      ['We need more light.', 'Necesitamos más luz.'],
      ['We need less light.', 'Necesitamos menos luz.'],
      ['Check the colour temperature.', 'Comprueba la temperatura de color.'],
      ['Watch the shadows.', 'Vigila las sombras.'],
      ['The subject is underexposed.', 'El sujeto está subexpuesto.'],
      ['The image is overexposed.', 'La imagen está sobreexpuesta.'],
      ['The lighting looks good.', 'La iluminación tiene buen aspecto.'],
    ],
  },
  p07: {
    name: '7 · Localizaciones y rodaje',
    items: [
      ['We need to scout the location.', 'Tenemos que buscar/visitar la localización.'],
      ["Let's check the location.", 'Vamos a comprobar la localización.'],
      ['Is the location available?', '¿Está disponible la localización?'],
      ['We have permission to shoot here.', 'Tenemos permiso para rodar aquí.'],
      ['Where is the crew parking?', '¿Dónde aparca el equipo?'],
      ['Where is the equipment being delivered?', '¿Dónde se entrega el equipo?'],
      ["What's the call time?", '¿A qué hora es la convocatoria?'],
      ['Call time is at seven.', 'La convocatoria es a las siete.'],
      ['What time do we wrap?', '¿A qué hora terminamos el rodaje?'],
      ["We're wrapping for today.", 'Terminamos el rodaje por hoy.'],
    ],
  },
  p08: {
    name: '8 · Plató y espectáculo en directo',
    items: [
      ['Stand by camera one.', 'Cámara uno, preparada.'],
      ["Camera two, you're live.", 'Cámara dos, estás en directo.'],
      ['Take camera two.', 'Pasamos a cámara dos.'],
      ['Ready for the next cue.', 'Preparados para la siguiente señal.'],
      ['On my cue.', 'A mi señal.'],
      ["You're on.", 'Estás en antena / estás en directo.'],
      ["You're off.", 'Ya no estás en antena / fuera.'],
      ["We're going live.", 'Vamos a entrar en directo.'],
      ["We're live.", 'Estamos en directo.'],
      ['Back to the studio.', 'Volvemos al estudio.'],
      ['Go to commercial.', 'Vamos a publicidad.'],
      ['Take the next shot.', 'Pasamos al siguiente plano.'],
      ['Follow the running order.', 'Sigue la escaleta.'],
      ["What's the next cue?", '¿Cuál es la siguiente señal?'],
      ["We're ready for the next segment.", 'Estamos preparados para la siguiente sección.'],
    ],
  },
  p09: {
    name: '9 · Postproducción',
    items: [
      ["Let's review the footage.", 'Vamos a revisar el material grabado.'],
      ['We need to edit this section.', 'Tenemos que editar esta sección.'],
      ['Cut this shot.', 'Corta este plano.'],
      ['Keep this take.', 'Conserva esta toma.'],
      ['Use the previous take.', 'Usa la toma anterior.'],
      ['Add a transition here.', 'Añade una transición aquí.'],
      ['Add the titles.', 'Añade los títulos.'],
      ['Add the credits.', 'Añade los créditos.'],
      ['We need to colour-correct this shot.', 'Tenemos que corregir el color de este plano.'],
      ["Let's render a preview.", 'Vamos a renderizar una previsualización.'],
      ['Export a high-resolution version.', 'Exporta una versión de alta resolución.'],
      ['Check the final export.', 'Comprueba la exportación final.'],
      ['The file needs to be compressed.', 'Hay que comprimir el archivo.'],
      ['Make a backup of the project.', 'Haz una copia de seguridad del proyecto.'],
      ["Don't overwrite the original file.", 'No sobrescribas el archivo original.'],
    ],
  },
  p10: {
    name: '10 · Incidencias y resolución de problemas',
    items: [
      ['We have a technical issue.', 'Tenemos un problema técnico.'],
      ["There's a problem with the camera.", 'Hay un problema con la cámara.'],
      ["There's an issue with the sound.", 'Hay un problema con el sonido.'],
      ["The equipment isn't working.", 'El equipo no funciona.'],
      ['We need to find a solution.', 'Tenemos que encontrar una solución.'],
      ["Let's see what we can do.", 'Veamos qué podemos hacer.'],
      ["Let's troubleshoot the problem.", 'Vamos a solucionar el problema.'],
      ['Do we have a backup?', '¿Tenemos una copia/equipo de respaldo?', { esAlt: ['¿Tenemos un equipo de respaldo?'] }],
      ['Do we have a spare?', '¿Tenemos uno de repuesto?'],
      ['We need a replacement.', 'Necesitamos un repuesto/sustituto.'],
      ['Can we fix it?', '¿Podemos arreglarlo?'],
      ['How long will it take?', '¿Cuánto tiempo llevará?'],
      ["We don't have much time.", 'No tenemos mucho tiempo.'],
      ['We need to act quickly.', 'Tenemos que actuar rápidamente.'],
      ['The problem has been solved.', 'El problema se ha solucionado.'],
    ],
  },
  p11: {
    name: '11 · Coordinación profesional',
    items: [
      ['Who is in charge?', '¿Quién está al cargo?'],
      ["Who's responsible for this?", '¿Quién es responsable de esto?'],
      ["I'll take care of it.", 'Yo me encargo.'],
      ['Can you take care of this?', '¿Puedes encargarte de esto?'],
      ["I'll handle it.", 'Yo me encargo / lo gestiono.', { esAlt: ['Yo lo gestiono.'] }],
      ['Leave it with me.', 'Déjamelo a mí.'],
      ["I'll sort it out.", 'Yo lo solucionaré.'],
      ['We need to coordinate with the crew.', 'Tenemos que coordinarnos con el equipo.'],
      ['Keep the team informed.', 'Mantén informado al equipo.'],
      ['Let the team know.', 'Informa al equipo.'],
      ['Make sure everyone is ready.', 'Asegúrate de que todos estén preparados.'],
      ["We're good to go.", 'Estamos listos para empezar.'],
      ['Everything is under control.', 'Todo está bajo control.'],
      ["We're all set.", 'Está todo listo.'],
      ["Let's get this show on the road.", 'Vamos a poner esto en marcha.'],
    ],
  },
};

const ALL_PSETS = Object.keys(PHRASE_SETS);
const PHRASES = [];
for (const [cat, set] of Object.entries(PHRASE_SETS)) {
  for (const [en, es, more = {}] of set.items) PHRASES.push({ cat, en, es, alt: more.alt || [], esAlt: more.esAlt || [] });
}
const validPsets = sets => (Array.isArray(sets) ? sets : []).filter(k => ALL_PSETS.includes(k));
const countPhrases = sets => PHRASES.filter(p => sets.includes(p.cat)).length;
const phraseKeyOf = p => 'p:' + p.en;
const isPhraseKey = k => String(k).startsWith('p:');

// ¿Se puede leer en inglés? (voice.js; en las pruebas sin navegador, no)
const canSpeak = () => typeof Voice !== 'undefined' && Voice.hasEnglish();

// ---------- Corregir frases ----------
// Las contracciones valen igual escritas cortas o largas
const CONTRACTIONS = {
  "let's": 'let us', "we're": 'we are', "i'll": 'i will', "what's": 'what is', "that's": 'that is',
  "there's": 'there is', "isn't": 'is not', "don't": 'do not', "who's": 'who is', "you're": 'you are',
  "it's": 'it is', "i'm": 'i am', "can't": 'cannot', "won't": 'will not', "we'll": 'we will',
  "doesn't": 'does not', "aren't": 'are not', "we've": 'we have', "they're": 'they are', "you'll": 'you will',
  "didn't": 'did not', "haven't": 'have not', "wasn't": 'was not', "i've": 'i have', "where's": 'where is',
  "how's": 'how is', "here's": 'here is', "she's": 'she is', "he's": 'he is', "they'll": 'they will',
};
// Sin el apóstrofo también se entiende (con aviso), salvo las que existen como otra palabra (were, ill, its…)
const NO_APOSTROPHE = {
  lets: "let's", whats: "what's", thats: "that's", theres: "there's", isnt: "isn't", dont: "don't",
  whos: "who's", youre: "you're", im: "i'm", doesnt: "doesn't", arent: "aren't", didnt: "didn't",
  havent: "haven't", wasnt: "wasn't", ive: "i've", wheres: "where's", theyre: "they're",
};
// Inglés británico o americano: valen los dos
const SPELLING = {
  colour: 'color', colours: 'colors', finalise: 'finalize', organise: 'organize', programme: 'program',
  centre: 'center', theatre: 'theater', analyse: 'analyze', realise: 'realize', favourite: 'favorite',
  travelling: 'traveling', cancelled: 'canceled', licence: 'license', dialogue: 'dialog', grey: 'gray',
};

// Palabras de una frase: minúsculas, sin signos y (si expand) con las contracciones en largo
function phraseWords(s, expand = true) {
  const words = String(s || '').normalize('NFC').toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[‐-―_-]+/g, ' ')
    .replace(/[^\p{L}\p{N}'\s]+/gu, ' ')
    .split(/\s+/).map(w => w.replace(/^'+|'+$/g, '')).filter(Boolean);
  return expand ? words.flatMap(w => (CONTRACTIONS[w] || SPELLING[w] || w).split(' ')) : words;
}
const phraseKey = s => stripAccents(phraseWords(s).join(' '));

// 0 = mal, 1 = perfecta, 2 = bien pero falta alguna tilde o algún apóstrofo
function comparePhrase(input, target) {
  let warn = false;
  const a = phraseWords(input, false).flatMap(w => {
    if (NO_APOSTROPHE[w]) { warn = true; w = NO_APOSTROPHE[w]; }
    return (CONTRACTIONS[w] || SPELLING[w] || w).split(' ');
  }).join(' ');
  const A = Array.from(a), B = Array.from(phraseWords(target).join(' '));
  if (!A.length || A.length !== B.length) return 0;
  for (let i = 0; i < A.length; i++) {
    if (A[i] === B[i]) continue;
    if (baseChar(A[i]) !== baseChar(B[i]) || A[i] !== baseChar(A[i])) return 0;
    warn = true;
  }
  return warn ? 2 : 1;
}

// "Yo me encargo / lo gestiono." -> ["Yo me encargo", "lo gestiono."];
// "buscar/visitar" -> las dos frases; "informado/a" -> informado e informada
function expandPhrase(label) {
  const out = [];
  for (const alt of String(label || '').split(/\s+\/\s+/)) {
    let combos = [''];
    for (const tok of alt.trim().split(/\s+/)) {
      const m = tok.match(/^(.*?)([.,;:!?…]*)$/u);
      const core = m[1], tail = m[2];
      let forms = [tok];
      if (core.includes('/')) forms = (/\/as?$/.test(core) ? genderForms(core) : core.split('/')).map(f => f + tail);
      combos = combos.flatMap(c => forms.map(f => (c ? c + ' ' : '') + f));
    }
    out.push(...combos);
  }
  return [...new Set(out.filter(s => s.trim()))];
}

// Vale la frase entera, o varias alternativas a la vez si TODAS son correctas
function checkPhrase(text, accepted) {
  const one = s => {
    let best = 0;
    for (const a of accepted) {
      const r = comparePhrase(s, a);
      if (r === 1) return 1;
      if (r) best = 2;
    }
    return best;
  };
  const whole = one(text);
  if (whole) return whole;
  const parts = expandPhrase(text);
  if (parts.length < 2) return 0;
  let worst = 1;
  for (const p of parts) {
    const r = one(p);
    if (!r) return 0;
    if (r === 2) worst = 2;
  }
  return worst;
}

// ---------- Tarjetas de cada ejercicio ----------
// Ordenar: las palabras de la frase desordenadas (sin signos y sin la mayúscula del principio)
function orderChips(en) {
  const words = en.split(/\s+/).map((w, i) => {
    let c = w.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '');
    if (i === 0 && !/^I('|$)/.test(c)) c = c.charAt(0).toLowerCase() + c.slice(1);
    return c;
  }).filter(Boolean);
  if (words.length < 2) return words;
  let chips = words;
  for (let t = 0; t < 10 && chips.join(' ') === words.join(' '); t++) chips = shuffle([...words]);
  return chips;
}

// Completar: quita una palabra importante (mejor las largas), nunca "the", "to", "we"…
const GAP_STOP = new Set(['the', 'and', 'for', 'you', 'your', 'are', 'was', 'were', 'this', 'that', 'there', 'here', 'with',
  'have', 'has', 'can', 'will', 'all', 'our', 'its', 'not', 'but', 'into', 'from', 'what', 'who', 'how', 'where', 'when',
  'let', 'get', 'need', 'one', 'two', 'been', 'being', 'does', 'did', 'too', 'some', 'any']);
function pickGap(en) {
  const toks = en.split(' ');
  const clean = toks.map(t => t.replace(/^[^\p{L}']+|[^\p{L}']+$/gu, ''));
  const idx = clean.map((_, i) => i);
  let cand = idx.filter(i => /^[A-Za-z]{3,}$/.test(clean[i]) && !GAP_STOP.has(clean[i].toLowerCase()));
  if (!cand.length) cand = idx.filter(i => /^[A-Za-z]+$/.test(clean[i]));
  if (!cand.length) cand = [0];
  let r = Math.random() * cand.reduce((s, i) => s + clean[i].length, 0), k = cand[0];
  for (const i of cand) { r -= clean[i].length; if (r <= 0) { k = i; break; } }
  const tok = toks[k], word = clean[k], at = tok.indexOf(word);
  const before = toks.slice(0, k).join(' '), after = toks.slice(k + 1).join(' ');
  const pre = before + (before ? ' ' : '') + tok.slice(0, at);
  const post = tok.slice(at + word.length) + (after ? ' ' + after : '');
  return { word, pre, post, text: pre + '_____' + post };
}

// Quiz: la buena y 3 frases de otras expresiones (mejor de la misma sección) que no signifiquen lo mismo
function withPhraseOptions(card, p) {
  const from = card.from, to = card.to;
  const okKeys = new Set(expandPhrase(card.answer).map(phraseKey));
  const sameKeys = new Set([p[from], ...(from === 'en' ? p.alt : p.esAlt)].flatMap(expandPhrase).map(phraseKey));
  const valid = o => o !== p
    && !expandPhrase(o[to]).some(a => okKeys.has(phraseKey(a)))
    && !expandPhrase(o[from]).some(a => sameKeys.has(phraseKey(a)))
    && levenshtein(phraseKey(o[to]), phraseKey(card.answer)) > 2;
  const pool = [...shuffle(PHRASES.filter(o => o.cat === p.cat && valid(o))), ...shuffle(PHRASES.filter(o => o.cat !== p.cat && valid(o)))];
  const wrong = [];
  for (const o of pool) {
    if (!wrong.some(w => phraseKey(w) === phraseKey(o[to]))) wrong.push(o[to]);
    if (wrong.length === 3) break;
  }
  const options = shuffle([card.answer, ...wrong]);
  return { ...card, options, correct: options.indexOf(card.answer) };
}

function phraseCard(p, kind, from) {
  const base = { ph: true, kind, cat: p.cat, key: phraseKeyOf(p), en: p.en, es: p.es, also: [], sub: null };
  if (kind === 'order') return { ...base, from: 'es', to: 'en', prompt: p.es, answer: p.en, accepted: [p.en], chips: orderChips(p.en), fast: 10000 };
  if (kind === 'gap') {
    const g = pickGap(p.en);
    return { ...base, from: 'en', to: 'en', prompt: g.text, answer: g.word, accepted: [g.word], sub: p.es, full: { pre: g.pre, word: g.word, post: g.post }, fast: 7000 };
  }
  if (kind === 'listen') return { ...base, from: 'en', to: 'en', prompt: '🎧', say: p.en, answer: p.en, accepted: [p.en], sub: p.es, fast: 10000 };
  const to = from === 'en' ? 'es' : 'en';
  const card = { ...base, from, to, prompt: p[from], answer: p[to], fast: kind === 'quiz' ? 5000 : 10000 };
  if (kind === 'quiz') return withPhraseOptions(card, p);
  // traducir escribiendo: también valen las de otras expresiones que se dicen igual ("Yo me encargo")
  const shown = new Set(expandPhrase(p[from]).map(phraseKey));
  const matches = PHRASES.filter(o => o === p || expandPhrase(o[from]).some(a => shown.has(phraseKey(a))));
  const forms = o => (to === 'en' ? [o.en, ...o.alt] : [o.es, ...o.esAlt]);
  card.accepted = [...new Set(matches.flatMap(o => forms(o).flatMap(expandPhrase)))];
  const seen = new Set([phraseKey(card.answer)]);
  for (const label of [...forms(p).slice(1), ...matches.filter(o => o !== p).map(o => o[to])]) {
    const k = phraseKey(label);
    if (!seen.has(k)) { seen.add(k); card.also.push(label); }
  }
  return card;
}

// ---------- Expresiones y palabras del vocabulario dentro de un texto ----------
// (para resaltarlas en las conversaciones y enseñar el vocabulario de cada frase)
const TERM_SKIP = new Set(['action', 'frame']); // en las frases suelen tener otro sentido
let TERMS = null;
function termList() {
  if (TERMS) return TERMS;
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const list = [];
  for (const p of PHRASES) {
    const core = p.en.replace(/[.!?]+$/, '');
    if (phraseWords(core, false).length < 2) continue; // "Cut!", "Rolling."… solo si la frase es solo eso
    const re = new RegExp('\\b' + core.split(/\s+/).map(w => reEsc(w).replace(/'/g, "['’]")).join('\\s+') + '\\b', 'i');
    list.push({ type: 'xp', re, item: p, len: core.length });
  }
  for (const w of WORDS) {
    for (const f of expandForms([w.en.label, ...w.en.extra])) {
      const parts = f.split(' ');
      if (parts.length === 1 && (f.length < 6 || TERM_SKIP.has(f))) continue;
      list.push({ type: 'vt', re: new RegExp('\\b' + parts.map(reEsc).join('[\\s-]+') + '\\b', 'i'), item: w, len: f.length });
    }
  }
  list.sort((a, b) => (a.type === b.type ? b.len - a.len : a.type === 'xp' ? -1 : 1));
  return (TERMS = list);
}

// withPhrases = false: solo las palabras del vocabulario (también las que van dentro de una expresión)
function findTerms(text, withPhrases = true) {
  const found = [];
  const free = (s, e) => found.every(f => e <= f.start || s >= f.end);
  const key = phraseKey(text);
  const whole = withPhrases && PHRASES.find(p => phraseWords(p.en, false).length < 2 && phraseKey(p.en) === key);
  if (whole) found.push({ start: 0, end: text.length, type: 'xp', item: whole });
  for (const t of termList()) {
    if (!withPhrases && t.type === 'xp') continue;
    const m = t.re.exec(text);
    if (m && free(m.index, m.index + m[0].length)) found.push({ start: m.index, end: m.index + m[0].length, type: t.type, item: t.item });
  }
  return found.sort((a, b) => a.start - b.start);
}

// Texto con las expresiones del PDF marcadas y las palabras del vocabulario subrayadas (HTML)
function markTerms(text, found = findTerms(text)) {
  let html = '', at = 0;
  for (const f of found) {
    const seg = text.slice(f.start, f.end);
    html += esc(text.slice(at, f.start));
    html += f.type === 'xp'
      ? `<mark class="xp" data-tr="${esc(f.item.en + ' = ' + f.item.es)}">${esc(seg)}</mark>`
      : `<span class="vt" data-tr="${esc(f.item.en.label + ' = ' + f.item.es.label)}">${esc(seg)}</span>`;
    at = f.end;
  }
  return html + esc(text.slice(at));
}

const vocabIn = text => [...new Set(findTerms(text, false).map(f => f.item))];
