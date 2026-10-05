// Vocabulario de las fotos: [inglés, español, otras respuestas en inglés, otras respuestas en español]
// " / " (con espacios) separa sinónimos. "o/a", "e/a" o "r/a" pegado a una palabra = masculino/femenino.
const VOCAB = {
  skills: {
    name: 'Soft skills',
    words: [
      ['Communicative skills', 'Habilidades comunicativas', ['communication skills'], ['habilidades de comunicación', 'competencias comunicativas', 'capacidad de comunicación']],
      ['Teamwork', 'Trabajo en equipo', ['team work'], []],
      ['Working under pressure', 'Trabajar bajo presión', ['work under pressure'], ['trabajo bajo presión']],
      ['Take initiative', 'Tomar la iniciativa', ['take the initiative', 'taking initiative'], ['tomar iniciativa', 'tener iniciativa']],
      ['Enthusiastic', 'Entusiasta', [], []],
      ['Motivated', 'Motivado/a', [], []],
      ['Dedicated', 'Dedicado/a', [], ['entregado/a']],
      ['Energetic', 'Enérgico/a', [], []],
      ['Flexible', 'Flexible', [], []],
      ['Responsible', 'Responsable', [], []],
      ['Committed', 'Comprometido/a', [], []],
      ['Passionate', 'Apasionado/a', [], []],
      ['Consistent / Hard-working', 'Constante / Trabajador/a', ['hardworking'], ['consistente', 'perseverante']],
      ['Resourceful', 'Resolutivo/a', [], ['ingenioso/a', 'con recursos']],
      ['Polite', 'Educado/a', [], ['cortés']],
      ['Generous', 'Generoso/a', [], []],
      ['Empathetic', 'Empático/a', ['empathic'], []],
      ['Intelligent', 'Inteligente', [], []],
      ['Focused', 'Centrado/a', [], ['concentrado/a', 'enfocado/a']],
      ['Careful', 'Cuidadoso/a', [], ['prudente']],
      ['Digital competence', 'Competencia digital', ['digital skills'], ['competencias digitales']],
      ['Optimistic', 'Optimista', [], []],
      ['Respectful', 'Respetuoso/a', [], []],
      ['Calm / Serene', 'Tranquilo/a / Sereno/a', [], ['calmado/a']],
    ],
  },
  film: {
    name: 'Audiovisual',
    words: [
      ['Audiovisual production', 'Producción audiovisual', [], []],
      ['Film production', 'Producción cinematográfica', [], ['producción de cine', 'producción de películas']],
      ['Film / Movie', 'Película', [], ['filme']],
      ['Short film', 'Cortometraje', [], ['corto']],
      ['TV programme', 'Programa de televisión', ['tv program', 'television programme', 'television program', 'tv show'], ['programa de tv', 'programa de tele', 'programa televisivo']],
      ['Series', 'Serie', [], []],
      ['Live broadcast', 'Retransmisión en directo', [], ['emisión en directo', 'transmisión en directo', 'retransmisión en vivo', 'transmisión en vivo']],
      ['Production team', 'Equipo de producción', [], []],
      ['Line producer', 'Jefe/a de producción', [], ['productor/a de línea', 'director/a de producción']],
      ['Production designer', 'Diseñador/a de producción', [], ['director/a de arte']],
      ['Focus puller', 'Foquista', [], ['ayudante de cámara', 'primer/a ayudante de cámara']],
      ['Gaffer', 'Jefe/a de eléctricos', [], ['jefe/a de iluminación']],
      ['Sound mixer', 'Jefe/a de sonido', [], ['mezclador/a de sonido', 'técnico/a de sonido', 'sonidista']],
      ['Boom operator', 'Microfonista', [], ['operador/a de pértiga', 'pertiguista', 'operador/a de boom']],
      ['Location manager', 'Jefe/a de localizaciones', [], ['localizador/a', 'responsable de localizaciones', 'encargado/a de localizaciones']],
      ['Costume designer', 'Diseñador/a de vestuario', [], ['figurinista', 'vestuarista']],
      ['Set designer', 'Escenógrafo/a', [], ['diseñador/a de escenografía', 'diseñador/a de decorados', 'decorador/a']],
      ['Workflow', 'Flujo de trabajo', ['work flow'], []],
      ['Project management', 'Gestión de proyectos', [], ['gestión de proyecto', 'gestión del proyecto', 'dirección de proyectos', 'administración de proyectos']],
      ['Production schedule', 'Calendario de producción', [], ['plan de rodaje', 'cronograma de producción', 'plan de producción', 'planificación de producción']],
      ['Screenplay', 'Guion', [], ['guión']],
      ['Script', 'Guion', [], ['guión', 'libreto']],
      ['Plot', 'Trama', [], ['argumento']],
      ['Storyline', 'Argumento', ['story line'], ['hilo argumental', 'línea argumental', 'trama']],
      ['Treatment', 'Tratamiento', [], []],
      ['Synopsis', 'Sinopsis', [], []],
      ['Scene', 'Escena', [], []],
      ['Sequence', 'Secuencia', [], []],
      ['Script breakdown', 'Desglose del guion', [], ['desglose del guión', 'desglose de guion', 'desglose de guión']],
    ],
  },
};

const ARTICLES = new Set(['the', 'a', 'an', 'el', 'la', 'los', 'las', 'un', 'una']);

// minúsculas, sin signos, guiones = espacio, sin artículo inicial ("la trama" = "trama")
function norm(s) {
  const parts = String(s || '').normalize('NFC').toLowerCase()
    .replace(/[‐-―_-]+/g, ' ')
    .replace(/[.,;:!?¿¡'"’‘“”()]/g, '')
    .replace(/\s+/g, ' ').trim().split(' ');
  if (parts.length > 1 && ARTICLES.has(parts[0])) parts.shift();
  return parts.join(' ');
}

const baseChar = ch => ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
const stripAccents = s => Array.from(s, baseChar).join('');

// 0 = mal, 1 = perfecto, 2 = bien pero le falta alguna tilde.
// Una tilde que sobra o está mal puesta cuenta como fallo.
function compareAnswer(input, answer) {
  const A = Array.from(norm(input)), B = Array.from(norm(answer));
  if (!A.length || A.length !== B.length) return 0;
  let missing = false;
  for (let i = 0; i < A.length; i++) {
    if (A[i] === B[i]) continue;
    if (baseChar(A[i]) !== baseChar(B[i]) || A[i] !== baseChar(A[i])) return 0;
    missing = true;
  }
  return missing ? 2 : 1;
}

function checkAnswer(input, accepted) {
  let best = 0;
  for (const a of accepted) {
    const r = compareAnswer(input, a);
    if (r === 1) return 1;
    if (r === 2) best = 2;
  }
  return best;
}

function genderForms(tok) {
  let m;
  if ((m = tok.match(/^(.+)([oe])\/a$/))) return [m[1] + m[2], m[1] + 'a'];
  if ((m = tok.match(/^(.+)\/a$/))) return [m[1], m[1] + 'a'];
  return [tok];
}

// "Tranquilo/a / Sereno/a" -> ["tranquilo", "tranquila", "sereno", "serena"]
function expandForms(labels) {
  const out = new Set();
  for (const label of labels) {
    for (const syn of label.split(' / ')) {
      let combos = [''];
      for (const tok of syn.trim().split(/\s+/)) {
        const forms = genderForms(tok);
        combos = combos.flatMap(c => forms.map(f => (c ? c + ' ' : '') + f));
      }
      combos.forEach(c => out.add(norm(c)));
    }
  }
  return [...out];
}

const WORDS = [];
for (const [cat, group] of Object.entries(VOCAB)) {
  for (const [en, es, enX, esX] of group.words) {
    WORDS.push({
      cat,
      en: { label: en, extra: enX, forms: expandForms([en, ...enX]) },
      es: { label: es, extra: esX, forms: expandForms([es, ...esX]) },
    });
  }
}

function countWords(set) {
  return set === 'all' ? WORDS.length : WORDS.filter(w => w.cat === set).length;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Crea la lista de rondas. Si una palabra en pantalla también es traducción de otra
// (p. ej. "Guion" = screenplay / script), se aceptan las respuestas de todas.
function buildDeck(settings) {
  const pool = shuffle(WORDS.filter(w => settings.set === 'all' || w.cat === settings.set));
  const dirs = pool.map((_, i) => (settings.dir === 'mix' ? (i % 2 ? 'en' : 'es') : settings.dir));
  shuffle(dirs);
  return pool.map((w, i) => {
    const from = dirs[i], to = from === 'en' ? 'es' : 'en';
    const shown = new Set(expandForms([w[from].label]).map(stripAccents));
    const matches = WORDS.filter(o => o[from].forms.some(f => shown.has(stripAccents(f))));
    const accepted = [...new Set(matches.flatMap(o => o[to].forms))];
    const seen = new Set([norm(w[to].label)]);
    const also = [];
    for (const label of [...w[to].extra, ...matches.filter(o => o !== w).map(o => o[to].label)]) {
      const k = norm(label);
      if (!seen.has(k)) { seen.add(k); also.push(label); }
    }
    return { cat: w.cat, from, prompt: w[from].label, answer: w[to].label, also, accepted };
  });
}
