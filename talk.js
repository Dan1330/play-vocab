// Conversaciones: diálogos de rodaje (convos.js) en los que tú eres uno de los personajes.
// Los demás hablan (con voz, si quieres) y, cuando te toca, eliges, ordenas o completas lo que dices.
const Talk = (() => {
  const load = (k, d) => { try { return { ...d, ...JSON.parse(localStorage.getItem(k) || '{}') }; } catch (e) { return { ...d }; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const done = load('vd_talk', {});                                // mejor resultado de cada conversación
  const prefs = load('vd_talk_prefs', { voice: true, tr: false }); // leer en voz alta / ver traducciones
  let c = null;           // conversación en curso
  let i = 0;              // línea por la que va
  let tasks = 0, first = 0, tries = 0;
  let run = 0;            // cambia al salir o al empezar otra: cancela lo que estuviera pendiente
  let picked = [];        // ordenar: fichas que has tocado, en orden
  let chips = [];
  let found = new Map();  // expresiones del PDF que han salido

  const later = (fn, ms) => { const r = run; setTimeout(() => { if (r === run) fn(); }, ms); };
  // Cada personaje con su voz (de hombre o de mujer si se puede) y el tono casi sin tocar, para que se entienda bien
  const GENDER = { Emma: 'f', Leo: 'm', Sara: 'f', Nora: 'f', Max: 'm', Ana: 'f', Mike: 'm', Lucía: 'f', Pablo: 'm', 'Sr. Grant': 'm', Julia: 'f', Tom: 'm', Helen: 'f' };
  const voiceOf = who => {
    const p = c && c.cast[who];
    if (!p) return { rate: 0.95 }; // tú
    return { variant: Object.keys(c.cast).indexOf(who) + 1, gender: GENDER[p.name] || '', pitch: 1 + ((p.pitch || 1) - 1) * 0.4, rate: p.rate || 0.95 };
  };
  const task = () => (c && !Array.isArray(c.lines[i]) ? c.lines[i] : null);

  function list() {
    $('talkList').innerHTML = CONVOS.map((cv, n) => {
      const d = done[cv.id];
      const stars = d ? '⭐'.repeat(d.stars) + '<span class="off">☆</span>'.repeat(3 - d.stars) : '<span class="ti-new">Nueva</span>';
      const turns = cv.lines.filter(l => !Array.isArray(l)).length;
      return `<button type="button" class="talk-item" data-talk="${esc(cv.id)}">
        <span class="ti-ico">${cv.icon}</span>
        <span class="ti-main"><b>${n + 1}. ${esc(cv.title)}</b><small>${esc(cv.desc)}</small>
          <small class="ti-role">🗣️ Tú: ${esc(cv.you)} · ${turns} turnos</small></span>
        <span class="ti-stars">${stars}</span></button>`;
    }).join('');
  }

  function paintPrefs() {
    $('talkVoice').textContent = prefs.voice ? '🔊' : '🔇';
    $('talkVoice').title = prefs.voice ? 'Voz activada (toca para quitarla)' : 'Voz apagada (toca para activarla)';
    $('talkTr').classList.toggle('on', prefs.tr);
    $('talkTr').title = prefs.tr ? 'Traducciones visibles' : 'Traducciones ocultas (toca un mensaje para verla)';
  }

  function start(id) {
    const cv = CONVOS.find(x => x.id === id);
    if (!cv) return;
    run++;
    c = cv;
    i = 0;
    tasks = first = tries = 0;
    picked = [];
    found = new Map();
    $('talkTitle').textContent = `${c.icon} ${c.title}`;
    $('talkRole').textContent = `Tú: ${c.you}`;
    $('talkLog').innerHTML = '';
    $('talkTask').classList.add('hidden');
    $('talkEnd').classList.add('hidden');
    paintPrefs();
    bar();
    showScreen('talk');
    Sound.unlock();
    later(next, 350);
  }

  function stop() {
    run++;
    c = null;
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  function bar() {
    $('talkBar').style.width = (c ? Math.round((i / c.lines.length) * 100) : 0) + '%';
  }

  // Baja el chat hasta lo último (y la tarjeta, para que se vea tu turno)
  function scrollDown() {
    requestAnimationFrame(() => {
      const log = $('talkLog');
      log.scrollTop = log.scrollHeight;
      const last = !$('talkEnd').classList.contains('hidden') ? $('talkEnd') : !$('talkTask').classList.contains('hidden') ? $('talkTask') : log;
      const r = last.getBoundingClientRect();
      if (r.bottom > window.innerHeight || r.top < 0) last.scrollIntoView({ block: 'end', behavior: 'smooth' });
    });
  }

  function addNarr(text) {
    $('talkLog').insertAdjacentHTML('beforeend', `<div class="narr">🎬 ${esc(text)}</div>`);
    scrollDown();
  }

  function addTyping(who) {
    const p = c.cast[who];
    const row = document.createElement('div');
    row.className = 'bubble-row npc typing';
    row.innerHTML = `<span class="b-avatar">${esc(p.avatar)}</span><div class="bubble"><span class="dots"><i></i><i></i><i></i></span></div>`;
    $('talkLog').appendChild(row);
    scrollDown();
    return row;
  }

  // Un mensaje: en inglés con las expresiones del PDF marcadas, y debajo la traducción
  function addLine(who, en, es) {
    const mine = who === 'you';
    const p = mine ? { name: 'Tú', role: c.you, avatar: me.avatar } : c.cast[who];
    const terms = findTerms(en);
    for (const t of terms) if (t.type === 'xp') found.set(t.item.en, t.item);
    const row = document.createElement('div');
    row.className = `bubble-row ${mine ? 'me' : 'npc'}`;
    row.innerHTML = `<span class="b-avatar">${esc(p.avatar)}</span>
      <div class="bubble${prefs.tr ? ' show-es' : ''}">
        <div class="b-name">${esc(p.name)} <small>${esc(p.role)}</small></div>
        <div class="b-en">${markTerms(en, terms)}</div>
        <div class="b-es">🇪🇸 ${esc(es)}</div>
        <div class="b-tools">
          <button type="button" class="b-btn" data-say="${esc(en)}" data-who="${esc(who)}" title="Escuchar">🔊</button>
          <button type="button" class="b-btn" data-tr title="Ver la traducción">🇪🇸</button>
        </div>
      </div>`;
    $('talkLog').appendChild(row);
    scrollDown();
  }

  // Lee la frase y sigue al terminar (o tras un rato, si la voz está apagada)
  function sayThenNext(who, en) {
    const go = () => later(next, 450);
    if (prefs.voice && Teach.speak(en, 'en', { ...voiceOf(who), quiet: true, onend: go })) return;
    later(next, Math.min(4000, 900 + en.length * 45));
  }

  function next() {
    bar();
    if (i >= c.lines.length) return finish();
    const line = c.lines[i];
    if (!Array.isArray(line)) return showTask(line);
    const [who, en, es] = line;
    i++;
    if (who === 'narr') { addNarr(en); return later(next, 1300); }
    const typing = addTyping(who);
    later(() => {
      typing.remove();
      addLine(who, en, es);
      sayThenNext(who, en);
    }, Math.min(1400, 450 + en.length * 14));
  }

  // ---------- Tu turno ----------
  // Ordenar: las palabras de tu frase, desordenadas (sin signos ni mayúsculas de principio de frase)
  function talkChips(en) {
    const words = en.split(/\s+/).map((w, k, all) => {
      let x = w.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '');
      const starts = k === 0 || /[.!?]$/.test(all[k - 1]);
      if (starts && !/^I('|$)/.test(x)) x = x.charAt(0).toLowerCase() + x.slice(1);
      return x;
    }).filter(Boolean);
    let out = words;
    for (let t = 0; t < 10 && out.join(' ') === words.join(' '); t++) out = shuffle([...words]);
    return out;
  }

  function showTask(t) {
    tries = 0;
    picked = [];
    const box = $('talkTask');
    let body = '';
    if (t.task === 'choose') {
      t.shown = shuffle(t.options.map((o, k) => ({ en: o[0], note: o[1], ok: k === 0 })));
      body = `<div class="tt-opts">${t.shown.map((o, k) => `<button type="button" class="tt-opt" data-opt="${k}">${esc(o.en)}</button>`).join('')}</div>`;
    } else if (t.task === 'order') {
      chips = talkChips(t.en);
      body = `<div class="order-built tt-built"></div><div class="order-bank tt-bank"></div>
        <div class="order-actions">
          <button type="button" class="btn btn-ghost btn-small" data-undo>⌫ Quitar la última</button>
          <button type="button" class="btn btn-primary" data-check>Comprobar</button>
        </div>`;
    } else {
      const m = t.en.match(/^(.*)\[(.+?)\](.*)$/);
      body = `<div class="tt-gap">${esc(m[1])}<input id="talkGap" size="${Math.max(6, m[2].length + 2)}" autocomplete="off" autocorrect="off"
        autocapitalize="off" spellcheck="false" aria-label="Palabra que falta">${esc(m[3])}</div>
        <button type="button" class="btn btn-primary" data-check>Comprobar</button>`;
    }
    box.innerHTML = `<div class="tt-head">🗣️ <b>Te toca:</b> ${esc(t.say)}</div>
      ${t.task !== 'choose' ? `<div class="tt-hint">Quieres decir: «${esc(t.es)}»</div>` : ''}
      ${body}<div class="tt-feedback hidden"></div>`;
    box.classList.remove('hidden');
    if (t.task === 'order') paintOrder();
    if (t.task === 'gap') setTimeout(() => { const inp = $('talkGap'); if (inp) inp.focus({ preventScroll: true }); }, 60);
    scrollDown();
  }

  function paintOrder() {
    const box = $('talkTask');
    box.querySelector('.tt-built').innerHTML = picked.map((ci, pos) => `<button type="button" class="chip on" data-unpick="${pos}">${esc(chips[ci])}</button>`).join('')
      || '<span class="order-empty">Toca las palabras en orden 👇</span>';
    box.querySelector('.tt-bank').innerHTML = chips.map((w, ci) => (picked.includes(ci) ? `<span class="chip ghost">${esc(w)}</span>`
      : `<button type="button" class="chip" data-pick="${ci}">${esc(w)}</button>`)).join('');
  }

  function feedback(html) {
    const fb = $('talkTask').querySelector('.tt-feedback');
    fb.innerHTML = html;
    fb.classList.remove('hidden');
    shake(fb);
    scrollDown();
  }

  // Tras dos intentos se enseña la respuesta y se sigue (sin contar como acierto a la primera)
  function showAnswer(html) {
    $('talkTask').querySelectorAll('[data-check], [data-undo], [data-pick], [data-unpick], #talkGap').forEach(el => { el.disabled = true; });
    feedback(`${html} <button type="button" class="btn btn-secondary btn-small" data-continue>Continuar ▶</button>`);
  }

  function answerChoose(t, k, btn) {
    const o = t.shown[k];
    if (o.ok) return success(t, o.en);
    tries++;
    btn.disabled = true;
    btn.classList.add('wrong');
    Sound.wrong();
    feedback(`❌ <b>${esc(o.en)}</b><br>${esc(o.note)}`);
  }

  // (t.alt: otros órdenes que también son correctos, p. ej. «Camera one, stand by»)
  function answerOrder(t) {
    if (!picked.length) return;
    const text = picked.map(ci => chips[ci]).join(' ');
    const good = [t.en, ...(t.alt || [])];
    const hit = good.find(g => checkPhrase(text, [g]));
    if (hit) return success(t, hit);
    tries++;
    Sound.wrong();
    if (tries >= 2) return showAnswer(`Era así: <b>${esc(t.en)}</b>`);
    const a = phraseWords(text, false);
    let ok = 0, b = phraseWords(t.en, false);
    for (const g of good) {
      const w = phraseWords(g, false);
      let n = 0;
      while (n < a.length && a[n] === w[n]) n++;
      if (n > ok) { ok = n; b = w; }
    }
    feedback(`🤏 Todavía no. ${picked.length < chips.length ? 'Te faltan palabras. ' : ''}`
      + (ok ? `Las ${ok === 1 ? 'primera palabra está bien' : `${ok} primeras palabras están bien`}: revisa a partir de ahí.` : `Pista: la frase empieza por «${esc(b[0])}».`));
  }

  function answerGap(t) {
    const inp = $('talkGap');
    const word = t.en.match(/\[(.+?)\]/)[1];
    const val = inp.value.trim();
    if (!val) return inp.focus();
    if (checkPhrase(val, [word])) return success(t);
    tries++;
    Sound.wrong();
    shake(inp);
    if (tries >= 2) return showAnswer(`La palabra era <b>${esc(word)}</b>.`);
    feedback(`🤏 No es «${esc(val)}». Pista: empieza por «${esc(word.charAt(0))}» y tiene ${Array.from(word.replace(/-/g, '')).length} letras.`);
    inp.select();
  }

  function success(t, chosen = null, counts = true) {
    tasks++;
    if (counts && tries === 0) first++;
    Sound.correct();
    const en = chosen || t.en.replace(/\[(.+?)\]/g, '$1');
    const es = t.task === 'choose' ? t.options[0][1] : t.es;
    $('talkTask').classList.add('hidden');
    addLine('you', en, es);
    i++;
    sayThenNext('you', en);
  }

  // ---------- Final ----------
  function finish() {
    bar();
    const pct = tasks ? first / tasks : 1;
    const stars = pct === 1 ? 3 : pct >= 0.6 ? 2 : 1;
    const prev = done[c.id];
    done[c.id] = { stars: Math.max(stars, prev ? prev.stars : 0), best: Math.max(first, prev ? prev.best : 0), total: tasks };
    save('vd_talk', done);
    if (stars === 3) { Sound.win(); confetti(); }
    const nextC = CONVOS[CONVOS.indexOf(c) + 1];
    const xps = [...found.values()];
    $('talkEnd').innerHTML = `<div class="te-stars">${'⭐'.repeat(stars)}<span class="off">${'☆'.repeat(3 - stars)}</span></div>
      <h3>${stars === 3 ? '¡Perfecto! 🏆' : stars === 2 ? '¡Muy bien! 💪' : '¡Conversación completada! 👍'}</h3>
      <p class="msg">Has acertado <b>${first} de ${tasks}</b> a la primera.</p>
      ${xps.length ? `<div class="te-xps"><b>📌 Expresiones del PDF que han salido (${xps.length})</b>
        ${xps.map(p => `<div class="te-xp"><button type="button" class="b-btn" data-say="${esc(p.en)}" title="Escuchar">🔊</button>
          <span><b>${esc(p.en)}</b><small>${esc(p.es)}</small></span></div>`).join('')}</div>` : ''}
      <div class="row">
        <button type="button" class="btn btn-secondary" data-again>🔁 Repetir</button>
        ${nextC ? `<button type="button" class="btn btn-primary" data-start="${esc(nextC.id)}">▶ Siguiente: ${esc(nextC.title)}</button>` : ''}
      </div>
      <button type="button" class="btn btn-link" data-list>🎭 Todas las conversaciones</button>`;
    $('talkEnd').classList.remove('hidden');
    scrollDown();
  }

  function backToList() {
    stop();
    list();
    showScreen('talks');
  }

  // ---------- Eventos ----------
  $('talkList').onclick = e => { const b = e.target.closest('[data-talk]'); if (b) start(b.dataset.talk); };
  $('talkBack').onclick = backToList;
  $('talkVoice').onclick = () => {
    prefs.voice = !prefs.voice;
    save('vd_talk_prefs', prefs);
    if (!prefs.voice && window.speechSynthesis) speechSynthesis.cancel(); // (si estaba hablando, sigue la conversación)
    paintPrefs();
  };
  $('talkTr').onclick = () => {
    prefs.tr = !prefs.tr;
    save('vd_talk_prefs', prefs);
    document.querySelectorAll('#talkLog .bubble').forEach(b => b.classList.toggle('show-es', prefs.tr));
    paintPrefs();
  };
  $('talkLog').onclick = e => {
    const say = e.target.closest('[data-say]');
    if (say) return Teach.speak(say.dataset.say, 'en', voiceOf(say.dataset.who));
    const term = e.target.closest('[data-tr]:not(.b-btn)'); // expresión o palabra marcada: su traducción
    if (term) return toast(term.dataset.tr);
    const bubble = e.target.closest('.bubble');
    if (bubble && !bubble.closest('.typing')) bubble.classList.toggle('show-es');
  };
  $('talkTask').onclick = e => {
    const t = task();
    if (!t) return;
    const opt = e.target.closest('[data-opt]');
    if (opt && !opt.disabled) return answerChoose(t, Number(opt.dataset.opt), opt);
    if (e.target.closest('[data-continue]')) return success(t, null, false);
    if (e.target.closest('button:disabled')) return;
    const pick = e.target.closest('[data-pick]');
    if (pick) { picked.push(Number(pick.dataset.pick)); Sound.tick(); return paintOrder(); }
    const unpick = e.target.closest('[data-unpick]');
    if (unpick) { picked.splice(Number(unpick.dataset.unpick), 1); return paintOrder(); }
    if (e.target.closest('[data-undo]')) { picked.pop(); return paintOrder(); }
    if (e.target.closest('[data-check]')) return t.task === 'order' ? answerOrder(t) : answerGap(t);
  };
  $('talkTask').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'talkGap' && !e.target.disabled) { e.preventDefault(); answerGap(task()); }
  });
  $('talkEnd').onclick = e => {
    const say = e.target.closest('[data-say]');
    if (say) return Teach.speak(say.dataset.say, 'en');
    if (e.target.closest('[data-again]')) return start(c.id);
    const nx = e.target.closest('[data-start]');
    if (nx) return start(nx.dataset.start);
    if (e.target.closest('[data-list]')) backToList();
  };

  return { list, start, stop, get active() { return !!c; } };
})();
