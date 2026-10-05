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
    if (!a) return ['No escribiste nada. Lee la respuesta en voz alta y escríbela para que se te quede.'];
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

  // Pronunciación con la voz del navegador
  function speak(text, lang) {
    if (!window.speechSynthesis) return toast('Tu navegador no puede leer en voz alta');
    const u = new SpeechSynthesisUtterance(String(text).replace(/\s*\/\s*/g, ', '));
    u.lang = lang === 'en' ? 'en-GB' : 'es-ES';
    u.rate = 0.9;
    const voices = speechSynthesis.getVoices();
    u.voice = voices.find(v => v.lang === u.lang) || voices.find(v => v.lang.startsWith(lang)) || null;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  // Diccionario con ejemplos y pronunciación (WordReference)
  const dictLink = enWord => 'https://www.wordreference.com/es/translation.asp?tranword='
    + encodeURIComponent(String(enWord).split(' / ')[0].replace(/\(.*?\)/g, '').trim());

  return { explain, speak, dictLink };
})();
