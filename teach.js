// Modo aprender: explica en qué has fallado y cómo acordarte. Todo con reglas, sin internet.
const Teach = (() => {
  const LANG_TXT = { en: 'inglés', es: 'español' };
  const A = s => Array.from(s);
  const q = s => `«${esc(s)}»`;

  // Alineación letra a letra (contando el intercambio de dos letras seguidas): lista de cambios
  function ops(a, b) {
    const x = A(a), y = A(b), n = x.length, m = y.length;
    const d = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i ? (j ? 0 : i) : j)));
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && x[i - 1] === y[j - 2] && x[i - 2] === y[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    const out = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      if (i > 1 && j > 1 && x[i - 1] === y[j - 2] && x[i - 2] === y[j - 1] && x[i - 1] !== y[j - 1] && d[i][j] === d[i - 2][j - 2] + 1) {
        out.push({ t: 'swap', a: x[i - 2] + x[i - 1], b: y[j - 2] + y[j - 1] });
        i -= 2; j -= 2;
      } else if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1)) {
        if (x[i - 1] !== y[j - 1]) out.push({ t: 'sub', a: x[i - 1], b: y[j - 1] });
        i--; j--;
      } else if (j > 0 && d[i][j] === d[i][j - 1] + 1) {
        out.push({ t: 'miss', b: y[j - 1], prev: y[j - 2], next: y[j] });
        j--;
      } else {
        out.push({ t: 'extra', a: x[i - 1], prev: x[i - 2], next: x[i] });
        i--;
      }
    }
    return out.reverse();
  }

  // La respuesta aceptada más parecida a lo que se escribió
  function closest(input, forms) {
    let best = null;
    for (const f of forms) {
      const dist = levenshtein(A(stripAccents(input)), A(stripAccents(f)));
      if (!best || dist < best.dist) best = { form: f, dist };
    }
    return best;
  }

  function accentTips(a, b) {
    const x = A(a), y = A(b), tips = [];
    for (let i = 0; i < Math.min(x.length, y.length); i++) {
      if (x[i] === y[i]) continue;
      if (baseChar(y[i]) !== y[i] && baseChar(x[i]) === x[i]) tips.push(`Lleva tilde en la ${q(y[i])}: ${q(b)}.`);
      else if (baseChar(x[i]) !== x[i] && baseChar(y[i]) === y[i]) tips.push(`La ${q(y[i])} no lleva tilde: ${q(b)}.`);
      else tips.push(`La tilde está mal puesta: es ${q(y[i])}, no ${q(x[i])}.`);
    }
    return tips.slice(0, 2);
  }

  // Fallos de palabras: orden, falta o sobra alguna
  function wordTips(sa, sb, b) {
    const wa = sa.split(' '), wb = sb.split(' ');
    if (wa.length === wb.length && wa.join('') === wb.join('')) return null;
    if (sa.replace(/ /g, '') === sb.replace(/ /g, '')) return [`Se escribe ${sb.includes(' ') ? 'separado' : 'junto'}: ${q(b)}.`];
    if ([...wa].sort().join(' ') === [...wb].sort().join(' ')) return [`Las palabras van en otro orden: ${q(b)}.`];
    const missing = wb.filter(x => !wa.includes(x));
    const extra = wa.filter(x => !wb.includes(x));
    if (missing.length && !extra.length) return [`Te ha faltado ${missing.map(q).join(' y ')}: ${q(b)}.`];
    if (extra.length && !missing.length) return [`Sobra ${extra.map(q).join(' y ')}: ${q(b)}.`];
    return null;
  }

  // Mismas palabras clave pero cambiadas de sitio o con alguna distinta ("equipo de trabajo")
  function similarWords(a, b) {
    const wa = stripAccents(a).split(' '), wb = stripAccents(b).split(' ').filter(x => x.length > 2);
    if (wb.length < 2) return null;
    const common = wb.filter(x => wa.includes(x));
    return common.length && common.length * 2 >= wb.length
      ? [`Vas bien encaminado, pero la expresión exacta es ${q(b)}: fíjate en el orden y en cada palabra.`] : null;
  }

  const SOUND_ALIKE = [
    ['b', 'v', 'En español la «b» y la «v» suenan igual: esta palabra va con'],
    ['c', 'z', 'La «c» (delante de e, i) y la «z» suenan igual: aquí va'],
    ['c', 's', 'Aquí no es «s»: va'],
    ['s', 'z', 'Aquí va'],
    ['g', 'j', 'La «g» (delante de e, i) y la «j» suenan igual: aquí va'],
  ];

  // Fallos letra a letra (y algunas reglas típicas de inglés y español)
  function letterTips(sa, sb, lang) {
    const tips = [];
    if (sa + 's' === sb) return [`Aquí va en plural: ${q(sb)}.`];
    if (sa === sb + 's' || sa === sb + 'es') return [`Aquí va en singular: ${q(sb)}.`];
    if (lang === 'en') {
      if (/ful\b/.test(sb) && /full\b/.test(sa)) tips.push('En inglés el sufijo <b>-ful</b> lleva una sola «l» (careful, respectful).');
      if (/tion/.test(sb) && /(cion|sion)/.test(sa) && !/(cion|sion)/.test(sb)) tips.push('En inglés se escribe <b>-tion</b> (production), no «-cion» como en español.');
      if (/ph/.test(sb) && /f/.test(sa) && !/ph/.test(sa)) tips.push('En inglés ese sonido «f» se escribe <b>ph</b>.');
    } else if (/cion\b/.test(sb) && /tion\b/.test(sa)) {
      tips.push('En español se escribe <b>-ción</b>, no «-tion» como en inglés.');
    }
    for (const o of ops(sa, sb)) {
      if (tips.length >= 3) break;
      if (o.t === 'swap') tips.push(`Has cambiado el orden de dos letras: es ${q(o.b)}, no ${q(o.a)}.`);
      else if (o.t === 'miss') {
        if (o.b === o.prev || o.b === o.next) tips.push(`Lleva doble ${q(o.b)} (${esc(o.b + o.b)}).`);
        else if (o.b === 'h') tips.push('Te ha faltado la «h»: no suena, pero se escribe.');
        else if (o.b === ' ') tips.push('Van separadas en dos palabras.');
        else tips.push(`Te ha faltado una ${q(o.b)}.`);
      } else if (o.t === 'extra') {
        if (o.a === o.prev || o.a === o.next) tips.push(`Lleva una sola ${q(o.a)}, no dos.`);
        else if (o.a === 'h') tips.push('Esa palabra no lleva «h».');
        else if (o.a === ' ') tips.push('Se escribe todo junto.');
        else tips.push(`Sobra la ${q(o.a)}.`);
      } else if (o.t === 'sub') {
        const pair = SOUND_ALIKE.find(([p, r]) => (o.a === p && o.b === r) || (o.a === r && o.b === p));
        if (pair && lang === 'es') tips.push(`${pair[2]} ${q(o.b)}.`);
        else if ('aeiou'.includes(o.a) && 'aeiou'.includes(o.b)) tips.push(`Ojo con la vocal: es ${q(o.b)}, no ${q(o.a)}.`);
        else tips.push(`Es ${q(o.b)}, no ${q(o.a)}.`);
      }
    }
    return [...new Set(tips)].slice(0, 3);
  }

  function spellingTips(a, b, lang) {
    const sa = stripAccents(a), sb = stripAccents(b);
    if (sa === sb) return accentTips(a, b);
    return wordTips(sa, sb, b) || letterTips(sa, sb, lang);
  }

  // Consejos (HTML) para una respuesta fallada o escrita sin tilde
  function explain(input, card) {
    const to = card.from === 'en' ? 'es' : 'en';
    const a = norm(input);
    if (!a) return [card.kind === 'anagram' ? 'No ordenaste las letras. Lee la respuesta en voz alta y deletréala para que se te quede.'
      : 'No escribiste nada. Lee la respuesta en voz alta y escríbela para que se te quede.'];
    const same = s => stripAccents(s) === stripAccents(a);
    if (expandForms([card.prompt]).some(same)) return [`Has copiado la palabra que salía. Había que traducirla al <b>${LANG_TXT[to]}</b>.`];
    // ¿Es la traducción de otra palabra de la lista?
    const other = WORDS.find(w => w[to].label !== card.answer && w[to].forms.some(same));
    if (other) return [`Cuidado: ${q(input)} es ${q(other[card.from].label)}. ${q(card.prompt)} se dice ${q(card.answer)}.`];
    // ¿Lo escribió en el otro idioma?
    if (WORDS.some(w => w[card.from].forms.some(same))) return [`Eso está en ${LANG_TXT[card.from]}; aquí había que escribirlo en <b>${LANG_TXT[to]}</b>.`];
    const best = closest(a, card.accepted);
    if (!best) return [];
    const far = best.dist > Math.max(2, Math.ceil(A(best.form).length * 0.45));
    if (far) {
      return similarWords(a, best.form)
        || [`No se parece a la respuesta. Recuerda: ${q(card.prompt)} = ${q(card.answer)}. Escúchala y escríbela un par de veces.`];
    }
    return spellingTips(a, best.form, to);
  }

  // ---------- Frases ----------
  // Trucos de gramática de las expresiones: [si la frase lleva esto, palabras que lo forman, explicación]
  const GRAMMAR = [
    [/\blet's\b/i, ['let', 'us', "let's"], '«Let\'s + verbo» sirve para proponer algo al equipo: «Let\'s go» = «Vamos», «Let\'s check» = «Vamos a comprobar».'],
    [/\bwe need to\b/i, ['need', 'to'], '«We need to + verbo» = «Tenemos que / Necesitamos + verbo».'],
    [/\bi'll\b/i, ['i', 'will', "i'll"], '«I\'ll + verbo» (= I will) es para decir lo que vas a hacer tú: «I\'ll check» = «Lo compruebo».'],
    [/^could you\b/i, ['could', 'you'], '«Could you…?» es la forma educada de pedir algo: «¿Podrías…?».'],
    [/\bthere's\b/i, ['there', 'is', "there's"], '«There\'s» (= there is) significa «hay»: «There\'s too much noise» = «Hay demasiado ruido».'],
    [/\bwe're\b/i, ['we', 'are', "we're"], '«We\'re» = «We are». En inglés el sujeto (we, you, it…) siempre se dice.'],
    [/\bdon't\b/i, ['do', 'not', "don't"], 'Para pedir que no se haga algo: «Don\'t + verbo» = «No + verbo».'],
    [/\bwhat's\b/i, ['what', 'is', "what's"], '«What\'s…?» (= What is) = «¿Cuál es…? / ¿Qué es…?».'],
    [/\bhow long\b/i, ['how', 'long'], '«How long…?» pregunta cuánto tiempo.'],
    [/\byou're\b/i, ['you', 'are', "you're"], '«You\'re» = «You are» (estás / eres).'],
    [/\bthe\b/i, ['the'], 'No te olvides del artículo «the» (el, la, los, las).'],
  ];

  // Consejos (HTML) para una frase fallada: palabras que faltan o sobran, orden, ortografía y gramática
  function explainPhrase(input, card) {
    if (!String(input || '').trim()) return [card.kind === 'order' ? 'No ordenaste nada. Escucha la frase 🔊 y vuelve a montarla para que se te quede.'
      : 'No escribiste nada. Escucha la frase 🔊 y escríbela para que se te quede.'];
    if (card.full && !String(card.answer).includes(' ')) { // completar una sola palabra
      const a = norm(input), b = norm(card.answer);
      const near = levenshtein(A(stripAccents(a)), A(stripAccents(b))) <= Math.max(2, Math.ceil(A(b).length * 0.45));
      const f = card.full;
      return near ? spellingTips(a, b, 'en')
        : [`La palabra que falta es ${q(card.answer)}: «${esc(f.pre)}<b>${esc(f.word)}</b>${esc(f.post)}».`];
    }
    const to = card.to;
    const aw = phraseWords(input, false).map(w => NO_APOSTROPHE[w] || w);
    let best = null;
    for (const t of card.accepted) {
      const bw = phraseWords(t, false);
      const d = levenshtein(aw, bw);
      if (!best || d < best.d) best = { t, bw, d };
    }
    const { t: target, bw } = best;
    // ¿lo escribió en el otro idioma?
    const other = phraseWords(to === 'en' ? card.es : card.en, false);
    if (aw.filter(w => other.includes(w) && !bw.includes(w)).length >= Math.max(2, aw.length / 2)) {
      return [`Eso está en ${LANG_TXT[to === 'en' ? 'es' : 'en']}; aquí había que escribirlo en <b>${LANG_TXT[to]}</b>.`];
    }
    const tips = [];
    const same = (x, y) => stripAccents(x) === stripAccents(y);
    const missing = [...bw], extra = [];
    for (const w of aw) {
      const i = missing.findIndex(x => same(x, w));
      if (i >= 0) missing.splice(i, 1); else extra.push(w);
    }
    const missed = [...missing]; // para los trucos de gramática
    if (!missing.length && !extra.length && aw.every((w, i) => same(w, bw[i]))) {
      // las mismas palabras y en orden: el fallo está en las tildes
      aw.forEach((w, i) => { if (w !== bw[i]) tips.push(...accentTips(w, bw[i]).slice(0, 1)); });
      if (!tips.length) tips.push(`La frase es: ${q(target)}.`);
    } else if (!missing.length && !extra.length) {
      // mismas palabras, otro orden: ¿hay dos seguidas al revés? ("light key" en vez de "key light")
      const pair = bw.findIndex((w, i) => i < bw.length - 1 && aw.some((x, j) => same(x, bw[i + 1]) && aw[j + 1] && same(aw[j + 1], w)));
      tips.push(pair >= 0 ? `Ojo con el orden: se dice ${q(bw[pair] + ' ' + bw[pair + 1])}, no ${q(bw[pair + 1] + ' ' + bw[pair])}.`
        : `Tienes todas las palabras, pero en otro orden. Va así: ${q(target)}.`);
    } else {
      // las que se parecen son faltas de ortografía
      for (const m of [...missing]) {
        const e = extra.find(x => levenshtein(A(stripAccents(x)), A(stripAccents(m))) <= Math.max(1, Math.floor(A(m).length / 3)));
        if (!e) continue;
        missing.splice(missing.indexOf(m), 1);
        extra.splice(extra.indexOf(e), 1);
        const tip = same(e, m) ? accentTips(e, m)[0] : spellingTips(e, m, to)[0];
        tips.push(`${q(e)} → ${q(m)}${tip ? `. ${tip}` : '.'}`);
      }
      if (missing.length) tips.push(`Te ha faltado ${missing.slice(0, 3).map(q).join(', ')}.`);
      if (extra.length) tips.push(`Sobra ${extra.slice(0, 3).map(q).join(', ')}.`);
      if (missing.length || extra.length) tips.push(`La frase es: ${q(target)}.`);
    }
    if (to === 'en') {
      const g = GRAMMAR.find(([re, words]) => re.test(target) && words.some(w => missed.includes(w)));
      if (g) tips.push('📌 ' + esc(g[2]));
    }
    return tips.slice(0, 4);
  }

  // Pronunciación: la hace voice.js (elige la voz más clara). Devuelve false si no puede leer.
  const speak = (text, lang, opts = {}) => Voice.speak(text, lang, opts);

  // Diccionario con ejemplos y pronunciación (WordReference)
  const dictLink = enWord => 'https://www.wordreference.com/es/translation.asp?tranword='
    + encodeURIComponent(String(enWord).split(' / ')[0].replace(/\(.*?\)/g, '').trim());

  return { explain, explainPhrase, speak, dictLink };
})();
