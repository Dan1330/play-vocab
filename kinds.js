// Tipos de ejercicio: cada pregunta es de un tipo. En los ajustes marcas los que quieras y, si marcas varios, se mezclan.
// Sirven en la práctica, en el 1 vs 1 y en el multijugador.
const KINDS = {
  words: [
    { id: 'type', icon: '✍️', name: 'Escribir', desc: 'Escribe la traducción.' },
    { id: 'quiz', icon: '🟦', name: 'Quiz', desc: 'Elige la traducción entre 4 opciones.' },
    { id: 'first', icon: '🔡', name: 'Con pista', desc: 'Escribe la traducción viendo la primera letra y cuántas letras tiene.' },
    { id: 'anagram', icon: '🔤', name: 'Letras desordenadas', desc: 'Ordena las letras de la palabra en inglés.' },
    { id: 'spell', icon: '🎧', name: 'Escucha y escribe', desc: 'Oyes la palabra en inglés y la escribes bien.', voice: true },
    { id: 'hear', icon: '👂', name: 'Escucha y elige', desc: 'Oyes la palabra en inglés y eliges qué significa.', voice: true },
    { id: 'tf', icon: '⚖️', name: '¿Está bien?', desc: 'Te enseño una traducción: ¿es correcta o no?' },
    { id: 'match', icon: '🔗', name: 'Parejas', desc: 'Une 4 palabras con su traducción.' },
  ],
  phrases: [
    { id: 'quiz', icon: '🟦', name: 'Quiz', desc: 'Elige la traducción entre 4 opciones.' },
    { id: 'order', icon: '🧩', name: 'Ordenar', desc: 'Toca las palabras en inglés en el orden correcto.' },
    { id: 'gap', icon: '🕳️', name: 'Completar', desc: 'Escribe la palabra que falta en la frase.' },
    { id: 'gapq', icon: '🎯', name: 'Hueco con opciones', desc: 'Elige la palabra que falta entre 4.' },
    { id: 'type', icon: '✍️', name: 'Traducir', desc: 'Escribe la traducción entera.' },
    { id: 'initials', icon: '🔠', name: 'Iniciales', desc: 'Escribe la frase en inglés viendo la primera letra de cada palabra.' },
    { id: 'listen', icon: '🎧', name: 'Dictado', desc: 'Oyes la frase en inglés y la escribes.', voice: true },
    { id: 'hear', icon: '👂', name: 'Escucha y elige', desc: 'Oyes la frase en inglés y eliges qué significa.', voice: true },
    { id: 'tf', icon: '⚖️', name: '¿Está bien?', desc: 'Te enseño una traducción: ¿es correcta o no?' },
    { id: 'match', icon: '🔗', name: 'Parejas', desc: 'Une 4 frases con su traducción.' },
    { id: 'error', icon: '🕵️', name: 'Palabra mal escrita', desc: 'Encuentra la palabra que está mal escrita.' },
    { id: 'role', icon: '🧑‍🎤', name: '¿Quién lo diría?', desc: '¿Qué profesional del rodaje diría esa frase?' },
  ],
  texts: [
    { id: 'tgap', icon: '🎧', name: 'Listening: huecos', desc: 'Escuchas una frase del diálogo y escribes lo que falta (como en el examen).' },
    { id: 'tq', icon: '📖', name: 'Reading: preguntas', desc: 'Lees un trozo del texto y eliges la respuesta.' },
    { id: 'ttf', icon: '⚖️', name: 'True or false', desc: '¿Lo que dice la frase es verdad según el texto?' },
    { id: 'who', icon: '🗣️', name: '¿Quién lo dice?', desc: 'Adivina qué personaje dice cada frase.' },
    { id: 'next', icon: '⏭️', name: '¿Qué viene después?', desc: 'Elige la frase que contesta en el diálogo.' },
  ],
};
const DEFAULT_KINDS = { words: ['type'], phrases: ['quiz', 'order', 'gap', 'type', 'listen'], texts: ['tgap', 'tq', 'ttf', 'who', 'next'] };
const kindIds = content => KINDS[content].map(k => k.id);
const validKinds = (list, content) => {
  const ok = (Array.isArray(list) ? list : []).filter(k => kindIds(content).includes(k));
  return ok.length ? ok : [...DEFAULT_KINDS[content]];
};
const kindInfo = (content, id) => KINDS[content].find(k => k.id === id) || KINDS.words[0];

// Cómo se responde cada tipo: escribiendo, eligiendo una opción, tocando una palabra, ordenando fichas o uniendo parejas
const KIND_INPUT = {
  type: 'text', first: 'text', spell: 'text', gap: 'text', listen: 'text', initials: 'text', tgap: 'text',
  quiz: 'choice', hear: 'choice', tf: 'choice', gapq: 'choice', role: 'choice', tq: 'choice', ttf: 'choice', who: 'choice', next: 'choice',
  error: 'pick', order: 'order', anagram: 'order', match: 'match',
};
const inputOf = kind => KIND_INPUT[kind] || 'text';

// Reparte los tipos marcados entre las preguntas, a partes iguales y mezclados
const spreadKinds = (n, kinds) => shuffle(Array.from({ length: n }, (_, i) => kinds[i % kinds.length]));

// "m _ _ _ _ _ _ _   l _ _ _ _": la primera letra de cada palabra y una raya por cada letra que falta
const letterPattern = text => String(text).split(/\s+/)
  .map(w => Array.from(w).map((ch, i) => (i === 0 || !/[\p{L}\p{N}]/u.test(ch) ? ch : '_')).join(' ')).join('   ');

// Baraja hasta que el orden cambie (si se puede)
function scramble(list) {
  let out = list;
  for (let t = 0; t < 12 && out.join('\u0001') === list.join('\u0001'); t++) out = shuffle([...list]);
  return out;
}

// ---------- Palabras ----------
// Quiz: la buena y 3 al azar (mejor del mismo tema) que no sean válidas ni casi iguales ("efecto de sonido" / "efectos de sonido")
function withOptions(card) {
  const to = card.to || (card.from === 'en' ? 'es' : 'en');
  const ok = new Set(card.accepted.map(stripAccents));
  const near = label => levenshtein(stripAccents(norm(label)), stripAccents(norm(card.answer))) <= 2;
  const valid = w => w[to].label !== card.answer && !w[to].forms.some(f => ok.has(stripAccents(f))) && !near(w[to].label);
  const pool = [...shuffle(WORDS.filter(w => w.cat === card.cat && valid(w))), ...shuffle(WORDS.filter(w => w.cat !== card.cat && valid(w)))];
  const wrong = [];
  for (const w of pool) {
    if (!wrong.includes(w[to].label)) wrong.push(w[to].label);
    if (wrong.length === 3) break;
  }
  const options = shuffle([card.answer, ...wrong]);
  return { ...card, options, correct: options.indexOf(card.answer) };
}

let WORD_BY_KEY = null;
const wordOf = key => (WORD_BY_KEY || (WORD_BY_KEY = new Map(WORDS.map(w => [w.en.label + '|' + w.es.label, w])))).get(key);
const firstSyn = label => String(label).split(' / ')[0].trim();

// Parejas: la palabra (o frase) y otras 3, a la izquierda en inglés y a la derecha en español, desordenadas
function matchCard(base, items) {
  const left = shuffle(items.map((x, i) => ({ i, t: x.en })));
  const right = scramble(items.map((x, i) => ({ i, t: x.es })));
  return {
    ...base, kind: 'match', prompt: '🔗', answer: items.map(x => `${x.en} = ${x.es}`).join('  ·  '),
    solution: left.map(l => right.findIndex(r => r.i === l.i)).join(','),
    pairs: left.map(l => [l.t, right.find(r => r.i === l.i).t]),
    view: { left: left.map(x => x.t), right: right.map(x => x.t) },
  };
}

function wordCard(c, kind, pool) {
  const w = wordOf(c.key);
  if (!w) return c;
  switch (kind) {
    case 'quiz': return withOptions({ ...c, kind: 'quiz' });
    case 'first': return { ...c, kind: 'first', view: { pattern: letterPattern(expandForms([c.answer])[0]) } };
    case 'anagram': {
      const target = firstSyn(w.en.label);
      if (!/^[A-Za-z]{3,12}$/.test(target)) return wordCard(c, 'first', pool); // solo palabras sueltas
      return { ...cardFor(w, 'es'), kind: 'anagram', answer: target, chips: scramble(Array.from(target.toLowerCase())), view: { letters: true } };
    }
    case 'spell':
      if (!canSpeak()) return { ...cardFor(w, 'es'), kind: 'type' };
      return { ...cardFor(w, 'es'), kind: 'spell', from: 'en', to: 'en', prompt: '🎧', say: firstSyn(w.en.label), answer: w.en.label, accepted: w.en.forms, also: w.en.extra, sub: w.es.label };
    case 'hear':
      if (!canSpeak()) return withOptions({ ...c, kind: 'quiz' });
      return { ...withOptions({ ...cardFor(w, 'en'), kind: 'hear' }), prompt: '👂', say: firstSyn(w.en.label), note: `Has oído: «${w.en.label}».` };
    case 'tf': {
      const shown = Math.random() < 0.5 ? c.answer : withOptions(c).options.find(o => o !== c.answer) || c.answer;
      const right = shown === c.answer;
      return {
        ...c, kind: 'tf', options: ['✅ Sí, está bien', '❌ No, está mal'], correct: right ? 0 : 1, view: { pair: shown },
        note: right ? `Sí: ${c.prompt} = ${c.answer}` : `No: «${c.prompt}» no es «${shown}». Es «${c.answer}».`,
      };
    }
    case 'match': {
      const used = new Set([norm(w.en.label), norm(w.es.label)]);
      const others = [];
      const sameTopic = shuffle(pool.filter(x => x.cat === c.cat)).map(o => wordOf(o.key));
      for (const ow of [...sameTopic, ...shuffle(pool.map(o => wordOf(o.key))), ...shuffle([...WORDS])]) {
        if (!ow || used.has(norm(ow.en.label)) || used.has(norm(ow.es.label))) continue;
        used.add(norm(ow.en.label)).add(norm(ow.es.label));
        others.push(ow);
        if (others.length === 3) break;
      }
      return matchCard({ ...c }, [w, ...others].map(x => ({ en: x.en.label, es: x.es.label })));
    }
    default: return { ...c, kind: 'type' };
  }
}

function wordDeck(st) {
  const sets = validSets(st.sets);
  const exam = Array.isArray(st.exam) && st.exam.length ? new Set(st.exam) : null;
  let cards = buildDeck({ ...st, set: 'all' }).filter(c => (exam ? exam.has(c.key) : sets.includes(c.cat)));
  if (st.count > 0) cards = cards.slice(0, st.count); // ya vienen barajadas
  const kinds = spreadKinds(cards.length, validKinds(st.wkinds, 'words'));
  // las letras desordenadas, mejor para las palabras sueltas: se cambia el turno con otra que sí lo sea
  const single = c => /^[A-Za-z]{3,12}$/.test(firstSyn(wordOf(c.key).en.label));
  for (let i = 0; i < cards.length; i++) {
    if (kinds[i] !== 'anagram' || single(cards[i])) continue;
    const j = cards.findIndex((c, k) => kinds[k] !== 'anagram' && single(c));
    if (j >= 0) [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  return cards.map((c, i) => wordCard(c, kinds[i], cards));
}

// ---------- Expresiones ----------
// Palabras "de contenido" de otras frases (para las opciones del hueco), mejor de largo parecido
function gapOptions(word, p) {
  const key = word.toLowerCase();
  const words = new Map();
  for (const o of shuffle([...PHRASES])) {
    if (o === p) continue;
    for (const t of o.en.split(/\s+/)) {
      const x = t.replace(/^[^\p{L}']+|[^\p{L}']+$/gu, '');
      if (/^[A-Za-z]{3,}$/.test(x) && !GAP_STOP.has(x.toLowerCase()) && x.toLowerCase() !== key) words.set(x.toLowerCase(), x);
    }
  }
  const list = [...words.values()].sort((a, b) => Math.abs(a.length - word.length) - Math.abs(b.length - word.length));
  const wrong = shuffle(list.slice(0, 12)).slice(0, 3);
  const options = shuffle([word, ...wrong]);
  return { options, correct: options.indexOf(word) };
}

// Una falta de ortografía creíble: letra doble o sencilla, dos letras cambiadas de sitio o una vocal cambiada
let KNOWN_WORDS = null;
function misspell(word) {
  if (!KNOWN_WORDS) {
    KNOWN_WORDS = new Set();
    for (const p of PHRASES) for (const t of phraseWords(p.en, false)) KNOWN_WORDS.add(t);
    for (const w of WORDS) for (const f of w.en.forms) for (const t of f.split(' ')) KNOWN_WORDS.add(t);
  }
  const w = word.toLowerCase();
  const out = [];
  for (let i = 1; i < w.length - 1; i++) {
    if (w[i] === w[i + 1]) out.push(w.slice(0, i) + w.slice(i + 1));                       // ll -> l
    else if (!'aeiou'.includes(w[i]) && 'aeiou'.includes(w[i - 1])) out.push(w.slice(0, i + 1) + w[i] + w.slice(i + 1)); // l -> ll
    if (i < w.length - 2 && w[i] !== w[i + 1]) out.push(w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2)); // ie -> ei
    // vocal cambiada solo en palabras largas (en las cortas saldría otra palabra de verdad: stick -> stock)
    if (w.length >= 7 && 'aeiou'.includes(w[i])) for (const v of 'aeiou') if (v !== w[i]) out.push(w.slice(0, i) + v + w.slice(i + 1));
  }
  const bad = shuffle(out.filter(x => x !== w && !KNOWN_WORDS.has(x)))[0];
  return bad ? (word[0] === word[0].toUpperCase() ? bad[0].toUpperCase() + bad.slice(1) : bad) : null;
}

// ¿Quién lo diría? Departamento típico de cada sección (y algunas frases sueltas que dice otro)
const ROLE_LABELS = {
  dir: 'Director / assistant director (dirección)', cam: 'Camera operator / DoP (cámara)', snd: 'Sound mixer / boom operator (sonido)',
  lig: 'Gaffer / lighting technician (iluminación)', loc: 'Location manager (localizaciones)', live: 'Floor manager / TV director (directo)', edit: 'Editor (montaje)',
};
const SECTION_ROLE = { p03: 'dir', p04: 'cam', p05: 'snd', p06: 'lig', p07: 'loc', p08: 'live', p09: 'edit' };
const PHRASE_ROLE = { 'Rolling.': 'cam', 'Camera ready.': 'cam', 'Sound ready.': 'snd', 'Lights ready.': 'lig', 'Ready when you are.': 'cam', 'Sound ready?': 'dir' };

function phraseKindCard(p, kind, from) {
  switch (kind) {
    case 'gapq': {
      const c = phraseCard(p, 'gap');
      return { ...c, kind: 'gapq', ...gapOptions(c.answer, p), fast: 6000 };
    }
    case 'initials': return { ...phraseCard(p, 'type', 'es'), kind: 'initials', view: { pattern: letterPattern(p.en) } };
    case 'listen': return canSpeak() ? phraseCard(p, 'listen') : phraseCard(p, 'type', 'es');
    case 'hear':
      if (!canSpeak()) return phraseCard(p, 'quiz', 'en');
      return { ...phraseCard(p, 'quiz', 'en'), kind: 'hear', prompt: '👂', say: p.en, note: `Has oído: «${p.en}».`, fast: 8000 };
    case 'tf': {
      const c = phraseCard(p, 'quiz', from);
      const shown = Math.random() < 0.5 ? c.answer : c.options.find(o => o !== c.answer) || c.answer;
      const right = shown === c.answer;
      return {
        ...c, kind: 'tf', options: ['✅ Sí, está bien', '❌ No, está mal'], correct: right ? 0 : 1, view: { pair: shown }, fast: 7000,
        note: right ? 'Sí, es la traducción correcta.' : `No. «${c.prompt}» = «${c.answer}».`,
      };
    }
    case 'match': {
      const others = [];
      const used = new Set([phraseKey(p.en), phraseKey(p.es)]);
      for (const o of [...shuffle(PHRASES.filter(x => x.cat === p.cat)), ...shuffle([...PHRASES])]) {
        if (used.has(phraseKey(o.en)) || used.has(phraseKey(o.es))) continue;
        used.add(phraseKey(o.en)).add(phraseKey(o.es));
        others.push(o);
        if (others.length === 3) break;
      }
      const base = { ph: true, cat: p.cat, key: phraseKeyOf(p), en: p.en, es: p.es, from: 'en', to: 'es', also: [], accepted: [], fast: 12000 };
      return matchCard(base, [p, ...others].map(x => ({ en: x.en, es: x.es })));
    }
    case 'error': {
      const toks = p.en.split(' ');
      const clean = toks.map(t => t.replace(/^[^\p{L}']+|[^\p{L}']+$/gu, ''));
      const cand = toks.length < 3 ? [] : shuffle(clean.map((_, i) => i).filter(i => /^[A-Za-z]{5,}$/.test(clean[i]) && !GAP_STOP.has(clean[i].toLowerCase())));
      for (const k of cand) {
        const bad = misspell(clean[k]);
        if (!bad) continue;
        const options = toks.map((t, i) => (i === k ? t.replace(clean[k], bad) : t));
        return {
          ph: true, kind: 'error', cat: p.cat, key: phraseKeyOf(p), en: p.en, es: p.es, from: 'en', to: 'en', prompt: '🕵️', options, correct: k,
          answer: p.en, also: [], sub: p.es, note: `«${bad}» se escribe «${clean[k]}».`, fast: 7000,
        };
      }
      return phraseCard(p, 'quiz', from); // frase sin palabras largas: quiz normal
    }
    case 'role': {
      const role = PHRASE_ROLE[p.en] || SECTION_ROLE[p.cat];
      if (!role) return phraseCard(p, 'quiz', from); // frases que puede decir cualquiera
      const options = shuffle([role, ...shuffle(Object.keys(ROLE_LABELS).filter(r => r !== role)).slice(0, 3)]).map(r => ROLE_LABELS[r]);
      return {
        ph: true, kind: 'role', cat: p.cat, key: phraseKeyOf(p), en: p.en, es: p.es, from: 'en', to: 'es', prompt: `«${p.en}»`,
        options, correct: options.indexOf(ROLE_LABELS[role]), answer: ROLE_LABELS[role], also: [], sub: p.es, fast: 7000,
        note: `«${p.en}» (${p.es}) es una frase típica de ${PHRASE_SETS[p.cat].name.replace(/^\d+ · /, '').toLowerCase()}.`,
      };
    }
    default: return phraseCard(p, kind, from);
  }
}

// Las rondas: N expresiones al azar de las secciones marcadas, con los ejercicios marcados mezclados
function phraseDeck(st) {
  const sets = validPsets(st.psets);
  let pool = shuffle(PHRASES.filter(p => sets.includes(p.cat)));
  if (st.count > 0) pool = pool.slice(0, st.count);
  const kinds = spreadKinds(pool.length, validKinds(st.pkinds, 'phrases'));
  const dirs = shuffle(pool.map((_, i) => (st.dir === 'mix' ? (i % 2 ? 'en' : 'es') : st.dir === 'en' ? 'en' : 'es')));
  return pool.map((p, i) => phraseKindCard(p, kinds[i], dirs[i]));
}

// ---------- Textos (listening y reading) ----------
const ctxLine = (t, l, text = l.plain) => ({ who: roleName(t, l.who), text });
let ROLE_POOL = null;
const allRoles = () => ROLE_POOL || (ROLE_POOL = [...new Set(allTexts().filter(t => t.group === 'exam').flatMap(t => Object.keys(t.cast).map(k => roleName(t, k))))]);

function tgapCard(t, g) {
  const l = t.lines[g.line];
  let pre = '', post = '', after = false;
  for (const p of l.parts) {
    if (p.gap && p.n === g.n) { after = true; continue; }
    const txt = p.gap ? p.gap[0] : p.text;
    if (after) post += txt; else pre += txt;
  }
  const prev = t.lines[g.line - 1];
  return {
    tx: true, ph: true, kind: 'tgap', cat: t.id, key: `t:${t.id}:g${g.n}`, from: 'en', to: 'en',
    prompt: pre + '_____' + post, answer: g.answers[0], accepted: g.answers, also: g.answers.slice(1), say: l.plain, sub: l.es,
    full: { pre, word: g.answers[0], post }, fast: 10000,
    view: { title: t.title, ctx: [...(prev ? [ctxLine(t, prev)] : []), { ...ctxLine(t, l, pre + '_____' + post), me: true }] },
  };
}

function tqCard(t, q) {
  const options = shuffle([q.mc, ...q.wrong.slice(0, 3)]);
  return {
    tx: true, kind: 'tq', cat: t.id, key: `t:${t.id}:q${q.n}`, from: 'en', to: 'en', prompt: q.q, answer: q.mc, options, correct: options.indexOf(q.mc),
    also: [], sub: q.es, note: q.a !== q.mc ? `Respuesta completa: ${q.a}` : null, fast: 12000,
    view: { title: t.title, ctx: q.ref.map(i => ctxLine(t, t.lines[i])), question: q.q },
  };
}

function ttfCard(t, s) {
  return {
    tx: true, kind: 'ttf', cat: t.id, key: `t:${t.id}:f${s.n}`, from: 'en', to: 'en', prompt: s.s, options: ['✅ True (verdadero)', '❌ False (falso)'],
    correct: s.ok ? 0 : 1, answer: s.ok ? 'True' : 'False', also: [], note: s.why, fast: 8000,
    view: { title: t.title, ctx: s.ref.map(i => ctxLine(t, t.lines[i])), question: s.s },
  };
}

function whoCard(t, l) {
  const right = roleName(t, l.who);
  const mine = [...new Set(Object.keys(t.cast).map(k => roleName(t, k)))].filter(r => r !== right);
  const extra = shuffle(allRoles().filter(r => r !== right && !mine.includes(r)));
  const wrong = shuffle(mine).slice(0, 3);
  while (wrong.length < 3 && extra.length) wrong.push(extra.pop());
  const options = shuffle([right, ...wrong]);
  const prev = t.lines[l.i - 1];
  return {
    tx: true, kind: 'who', cat: t.id, key: `t:${t.id}:w${l.i}`, from: 'en', to: 'en', prompt: l.plain, options, correct: options.indexOf(right),
    answer: right, also: [], sub: l.es, note: `Lo dice: ${right} (${roleOf(t, l.who)[1]}).`, fast: 8000,
    view: { title: t.title, ctx: [...(prev ? [ctxLine(t, prev)] : []), { who: '❓', text: l.plain, me: true }], question: '¿Quién lo dice?' },
  };
}

function nextCard(t, l) {
  const next = t.lines[l.i + 1];
  const same = shuffle(t.lines.filter(x => Math.abs(x.i - l.i) > 1 && x.plain !== next.plain).map(x => x.plain));
  const others = shuffle(allTexts().filter(x => x !== t).flatMap(x => x.lines.map(y => y.plain)));
  const wrong = [...new Set([...same.slice(0, 2), ...others])].filter(s => s !== next.plain).slice(0, 3);
  const options = shuffle([next.plain, ...wrong]);
  return {
    tx: true, kind: 'next', cat: t.id, key: `t:${t.id}:n${l.i}`, from: 'en', to: 'en', prompt: l.plain, options, correct: options.indexOf(next.plain),
    answer: next.plain, also: [], sub: next.es, fast: 10000,
    view: { title: t.title, ctx: [ctxLine(t, l)], question: `¿Qué contesta ${roleName(t, next.who)}?` },
  };
}

// Todas las preguntas posibles de los textos marcados, por tipo
function textItems(st) {
  const ids = validTsets(st.tsets);
  const kinds = validKinds(st.tkinds, 'texts');
  const byKind = Object.fromEntries(kinds.map(k => [k, []]));
  for (const t of allTexts().filter(x => ids.includes(x.id))) {
    if (byKind.tgap) t.gaps.forEach(g => byKind.tgap.push(() => tgapCard(t, g)));
    if (byKind.tq) t.questions.forEach(q => byKind.tq.push(() => tqCard(t, q)));
    if (byKind.ttf) t.tf.forEach(s => byKind.ttf.push(() => ttfCard(t, s)));
    if (byKind.who) t.lines.forEach(l => { if (l.plain.split(' ').length >= 4) byKind.who.push(() => whoCard(t, l)); });
    if (byKind.next) t.lines.forEach(l => { if (l.i < t.lines.length - 1) byKind.next.push(() => nextCard(t, l)); });
  }
  return byKind;
}
const textPoolCount = st => Object.values(textItems(st)).reduce((n, a) => n + a.length, 0);

// N preguntas al azar, repartiendo los tipos marcados a partes iguales
function textDeck(st) {
  const lists = Object.values(textItems(st)).map(a => shuffle(a)).filter(a => a.length);
  const limit = st.count > 0 ? st.count : Infinity;
  const out = [];
  while (out.length < limit && lists.some(a => a.length)) {
    for (const a of lists) if (a.length && out.length < limit) out.push(a.pop());
  }
  return shuffle(out).map(make => make());
}

// ---------- La baraja de la partida ----------
// all = sin límite de preguntas (para repetir los fallos)
function deckFor(settings, all = false) {
  const st = all ? { ...settings, count: 0 } : settings;
  if (st.content === 'phrases') return phraseDeck(st);
  if (st.content === 'texts') return textDeck(st);
  return wordDeck(st);
}
