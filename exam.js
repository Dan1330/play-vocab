// Modo examen: los textos enteros, como en el examen de listening y reading (texts.js).
// Cada texto tiene actividades: listening con huecos, reading con preguntas, test, verdadero o falso,
// ordenar el diálogo, ¿quién lo dice? y el simulacro completo con nota.
const ExamMode = (() => {
  const ACTS = {
    listen: { icon: '🎧', name: 'Listening', desc: 'Escucha el audio y completa los huecos (1 punto cada uno).' },
    read: { icon: '📖', name: 'Reading', desc: 'Contesta a las preguntas en inglés (2 puntos cada una).', exam: true },
    test: { icon: '🅰️', name: 'Test', desc: 'Elige la respuesta correcta de cada pregunta.', exam: true },
    tf: { icon: '⚖️', name: 'True or false', desc: '¿Verdadero o falso según el texto?', exam: true },
    order: { icon: '🔢', name: 'Ordenar', desc: 'Pon las frases del diálogo en orden.' },
    who: { icon: '🗣️', name: '¿Quién lo dice?', desc: 'Elige qué personaje dice cada frase.' },
    sim: { icon: '🎯', name: 'Simulacro', desc: 'Listening + reading juntos, como el examen, con nota sobre 10.', exam: true },
  };
  const actsFor = t => Object.keys(ACTS).filter(a => !ACTS[a].exam || t.group === 'exam');
  let scores = {};
  try { scores = JSON.parse(localStorage.getItem('vd_examscores') || '{}'); } catch (e) {}
  const saveScore = (t, act, pct) => {
    const s = scores[t.id] || (scores[t.id] = {});
    if (!(s[act] >= pct)) s[act] = pct;
    try { localStorage.setItem('vd_examscores', JSON.stringify(scores)); } catch (e) {}
  };

  let cur = null;      // { t, act, done, pts: { … }, order: […], picked: […], who: […] }
  let playRun = 0;     // reproducción del audio (cambia para pararla)
  let plays = 0, slow = false;

  // ---------- Lista ----------
  function list() {
    stopAudio();
    const card = t => {
      const s = scores[t.id] || {};
      return `<div class="ex-item">
        <div class="ex-item-head"><span class="ti-ico">${t.icon}</span>
          <span class="ti-main"><b>${esc(t.title)}</b><small>${esc(t.es)}</small></span></div>
        <div class="ex-acts">${actsFor(t).map(a => `<button type="button" class="ex-act" data-text="${esc(t.id)}" data-act="${a}" title="${esc(ACTS[a].desc)}">
          ${ACTS[a].icon} ${ACTS[a].name}${s[a] != null ? ` <small class="${s[a] >= 80 ? 'good' : ''}">${a === 'sim' ? `${(s[a] / 10).toFixed(1).replace('.', ',')}` : `${s[a]}%`}</small>` : ''}</button>`).join('')}</div>
      </div>`;
    };
    const texts = allTexts();
    $('exList').innerHTML = `<div class="exam-gtitle">📝 Textos tipo examen (${texts.filter(t => t.group === 'exam').length})</div>
      ${texts.filter(t => t.group === 'exam').map(card).join('')}
      <div class="exam-gtitle">🎭 Diálogos de las conversaciones (listening, ordenar y ¿quién lo dice?)</div>
      ${texts.filter(t => t.group === 'convo').map(card).join('')}`;
  }

  // ---------- Audio: el diálogo leído, cada personaje con su voz ----------
  function stopAudio() {
    playRun++;
    if (window.speechSynthesis) speechSynthesis.cancel();
    document.querySelectorAll('.ex-line.speaking').forEach(el => el.classList.remove('speaking'));
  }
  function playLines(t, lines, done) {
    const run = ++playRun;
    const who = Object.keys(t.cast);
    let i = 0;
    const next = () => {
      document.querySelectorAll('.ex-line.speaking').forEach(el => el.classList.remove('speaking'));
      if (run !== playRun) return;
      if (i >= lines.length) { if (done) done(); return; }
      const l = lines[i++];
      const row = document.querySelector(`.ex-line[data-line="${l.i}"]`);
      if (row) { row.classList.add('speaking'); row.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
      const ok = Voice.speak(l.plain, 'en', { variant: who.indexOf(l.who) + 1, rate: slow ? 0.75 : 0.95, quiet: true, onend: () => setTimeout(next, 450) });
      if (!ok) setTimeout(next, 900 + l.plain.length * 40); // sin voz: al menos se van marcando las frases
    };
    if (window.speechSynthesis) speechSynthesis.cancel();
    next();
  }

  // ---------- Trozos de cada actividad ----------
  // todos los huecos del mismo ancho (como en el examen) y crecen al escribir
  const gapInput = p => `<span class="gapw"><small>(${p.n + 1})</small><input class="gap" data-gap="${p.n}" size="12"
    autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Hueco ${p.n + 1}"><span class="gap-sol"></span></span>`;
  const lineHTML = (t, l, body) => `<div class="ex-line" data-line="${l.i}">
    <button type="button" class="b-btn" data-say-line="${l.i}" title="Escuchar esta frase">🔊</button>
    <div><b class="ex-who">${esc(roleName(t, l.who))}:</b> <span class="ex-text">${body}</span>
    <div class="ex-es hidden">🇪🇸 ${esc(l.es)}</div></div></div>`;

  function listenHTML(t) {
    return `<div class="ex-audio">
        <button type="button" class="btn btn-primary" data-play>▶ Escuchar el audio</button>
        <button type="button" class="btn btn-ghost btn-small" data-stop>⏹ Parar</button>
        <button type="button" class="btn btn-ghost btn-small" data-slow>🐢 Más despacio</button>
        <span class="ex-plays">Escuchado: <b>${plays}</b> ${plays === 1 ? 'vez' : 'veces'}</span>
      </div>
      ${canSpeak() ? '' : '<p class="ex-warn">⚠️ Este navegador no tiene voz en inglés. Ábrelo en Chrome o Edge para oír el audio (mientras, puedes intentarlo leyendo).</p>'}
      <label class="ex-opt"><input type="checkbox" data-bank> 🧺 Ver las respuestas desordenadas (más fácil)</label>
      <div class="ex-bank hidden">${shuffle(t.gaps.map(g => g.answers[0])).map(a => `<span>${esc(a)}</span>`).join('')}</div>
      <div class="ex-transcript">${t.lines.map(l => lineHTML(t, l, l.parts.map(p => (p.gap ? gapInput(p) : esc(p.text))).join(''))).join('')}</div>`;
  }
  const textHTML = t => `<div class="ex-transcript reading">${t.lines.map(l => lineHTML(t, l, esc(l.plain))).join('')}</div>`;

  function readHTML(t) {
    return `<div class="ex-questions">${t.questions.map(q => `<div class="ex-q" data-q="${q.n}">
      <div class="ex-qtext"><b>${q.n + 1}.</b> ${esc(q.q)} <button type="button" class="btn-mini" data-q-tr="${q.n}" title="Traducción">🇪🇸</button></div>
      <div class="ex-qes hidden">${esc(q.es)}</div>
      <textarea rows="2" data-answer="${q.n}" placeholder="Write your answer in English…" spellcheck="false"></textarea>
      <div class="ex-qres hidden"></div></div>`).join('')}</div>`;
  }

  function testHTML(t) {
    return `<div class="ex-questions">${t.questions.map(q => {
      const opts = shuffle([q.mc, ...q.wrong.slice(0, 3)]);
      return `<div class="ex-q" data-q="${q.n}"><div class="ex-qtext"><b>${q.n + 1}.</b> ${esc(q.q)}</div>
        <div class="ex-opts">${opts.map(o => `<label class="ex-optc"><input type="radio" name="tq${q.n}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join('')}</div>
        <div class="ex-qres hidden"></div></div>`;
    }).join('')}</div>`;
  }

  function tfHTML(t) {
    return `<div class="ex-questions">${t.tf.map(s => `<div class="ex-q ex-tf" data-tf="${s.n}">
      <div class="ex-qtext"><b>${s.n + 1}.</b> ${esc(s.s)}</div>
      <div class="ex-tfbtns"><button type="button" class="btn-mini" data-tfv="1">✅ True</button><button type="button" class="btn-mini" data-tfv="0">❌ False</button></div>
      <div class="ex-qres hidden"></div></div>`).join('')}</div>`;
  }

  function orderHTML() {
    const lines = cur.order;
    const shown = cur.shuffled.filter(i => !cur.picked.includes(i));
    return `<p class="msg">Toca las frases en el orden en que se dicen. (Para quitar una, tócala arriba.)</p>
      <div class="ex-ordered">${cur.picked.map((i, pos) => `<button type="button" class="ex-oline on" data-unpick="${pos}"${cur.done ? ' disabled' : ''}>
        <span class="num">${pos + 1}</span><b>${esc(roleName(cur.t, cur.t.lines[i].who))}:</b> ${esc(cur.t.lines[i].plain)}<span class="ex-mark"></span></button>`).join('') || '<span class="order-empty">Aquí irán las frases en orden 👇</span>'}</div>
      <div class="ex-pool">${shown.map(i => `<button type="button" class="ex-oline" data-pick="${i}"><b>${esc(roleName(cur.t, cur.t.lines[i].who))}:</b> ${esc(cur.t.lines[i].plain)}</button>`).join('')}</div>
      <!--${lines.length}-->`;
  }

  function whoHTML(t) {
    const roles = [...new Set(Object.keys(t.cast).map(k => roleName(t, k)))];
    return `<div class="ex-questions">${cur.who.map((i, n) => `<div class="ex-q" data-who="${n}">
      <div class="ex-qtext">«${esc(t.lines[i].plain)}»</div>
      <select data-who-sel="${n}"><option value="">¿Quién lo dice?</option>${roles.map(r => `<option>${esc(r)}</option>`).join('')}</select>
      <div class="ex-qres hidden"></div></div>`).join('')}</div>`;
  }

  // ---------- Abrir una actividad ----------
  function open(textId, act) {
    const t = textById(textId);
    if (!t || !actsFor(t).includes(act)) return;
    stopAudio();
    plays = 0;
    cur = { t, act, done: false, pts: {} };
    if (act === 'order') { // un trozo de hasta 8 frases seguidas
      const n = Math.min(8, t.lines.length);
      const start = Math.floor(Math.random() * (t.lines.length - n + 1));
      cur.order = t.lines.slice(start, start + n).map(l => l.i);
      cur.shuffled = scramble(cur.order);
      cur.picked = [];
    }
    if (act === 'who') cur.who = shuffle(t.lines.filter(l => l.plain.split(' ').length >= 3).map(l => l.i)).slice(0, 8).sort((a, b) => a - b);
    $('exTitle').textContent = `${t.icon} ${t.title}`;
    $('exSub').textContent = `${ACTS[act].icon} ${ACTS[act].name} · ${ACTS[act].desc}`;
    $('exTag').classList.add('hidden');
    paint();
    showScreen('examrun');
    window.scrollTo({ top: 0 });
  }

  function paint() {
    const { t, act } = cur;
    let body = '';
    if (act === 'listen') body = listenHTML(t);
    else if (act === 'read') body = `<div class="ex-part">📖 Lee el texto</div>${textHTML(t)}<div class="ex-part">✍️ Answer the following questions</div>${readHTML(t)}`;
    else if (act === 'test') body = `${textHTML(t)}<div class="ex-part">🅰️ Choose the correct answer</div>${testHTML(t)}`;
    else if (act === 'tf') body = `${textHTML(t)}<div class="ex-part">⚖️ True or false?</div>${tfHTML(t)}`;
    else if (act === 'order') body = orderHTML();
    else if (act === 'who') body = `<div class="ex-part">🗣️ Who says it?</div>${whoHTML(t)}`;
    else if (act === 'sim') body = `<div class="ex-part">🎧 LISTENING · Fill in the gaps (1 point each)</div>${listenHTML(t)}
      <div class="ex-part">📖 READING · Answer the following questions (2 points each)</div>${readHTML(t)}`;
    $('exBody').innerHTML = `${body}
      <div class="ex-actions"><button type="button" class="btn btn-primary btn-block" data-check>✓ Corregir</button></div>
      <div class="ex-result hidden"></div>`;
  }

  // ---------- Corregir ----------
  function gradeListen() {
    let ok = 0;
    for (const inp of $('exBody').querySelectorAll('input[data-gap]')) {
      const g = cur.t.gaps[Number(inp.dataset.gap)];
      const good = inp.value.trim() && checkPhrase(inp.value, g.answers);
      if (good) ok++;
      inp.classList.add(good ? 'ok' : 'bad');
      inp.disabled = true;
      inp.nextElementSibling.textContent = good ? ' ✓' : ` ✗ ${g.answers[0]}`;
    }
    return { pts: ok, max: cur.t.gaps.length };
  }

  function readResult(q, res, text) {
    const box = $('exBody').querySelector(`.ex-q[data-q="${q.n}"] .ex-qres`);
    const self = res.points < 2 && text.trim() ? `<button type="button" class="btn-mini" data-self="${q.n}">✓ Me la doy por buena</button>` : '';
    box.innerHTML = `<span class="ex-pts p${res.points}">${res.points} / 2</span> <b>Respuesta modelo:</b> ${esc(q.a)}
      ${res.points < 2 ? `<br><small>💡 Ideas clave: ${q.keys.map((g, i) => `<span class="${res.hit[i] ? 'hit' : 'miss'}">${esc(g[0])}</span>`).join(' · ')}</small>` : ''} ${self}`;
    box.classList.remove('hidden');
  }
  function gradeRead() {
    let pts = 0;
    for (const q of cur.t.questions) {
      const ta = $('exBody').querySelector(`textarea[data-answer="${q.n}"]`);
      const res = gradeAnswer(ta.value, q);
      cur.pts['q' + q.n] = res.points;
      pts += res.points;
      ta.disabled = true;
      readResult(q, res, ta.value);
    }
    return { pts, max: cur.t.questions.length * 2 };
  }

  function gradeTest() {
    let ok = 0;
    for (const q of cur.t.questions) {
      const box = $('exBody').querySelector(`.ex-q[data-q="${q.n}"]`);
      const chosen = box.querySelector('input:checked');
      const good = chosen && chosen.value === q.mc;
      if (good) ok++;
      for (const l of box.querySelectorAll('.ex-optc')) {
        const v = l.querySelector('input').value;
        l.classList.toggle('right', v === q.mc);
        l.classList.toggle('wrong', !!chosen && v === chosen.value && !good);
        l.querySelector('input').disabled = true;
      }
      const res = box.querySelector('.ex-qres');
      res.innerHTML = good ? '✓ ¡Bien!' : `✗ Era: <b>${esc(q.mc)}</b>`;
      res.classList.remove('hidden');
    }
    return { pts: ok, max: cur.t.questions.length };
  }

  function gradeTF() {
    let ok = 0;
    for (const s of cur.t.tf) {
      const box = $('exBody').querySelector(`.ex-q[data-tf="${s.n}"]`);
      const on = box.querySelector('[data-tfv].on');
      const good = !!on && (on.dataset.tfv === '1') === s.ok;
      if (good) ok++;
      box.querySelectorAll('[data-tfv]').forEach(b => { b.disabled = true; b.classList.toggle('right', (b.dataset.tfv === '1') === s.ok); });
      const res = box.querySelector('.ex-qres');
      res.innerHTML = `${good ? '✓' : '✗'} <b>${s.ok ? 'True' : 'False'}</b>. ${esc(s.why)}`;
      res.classList.remove('hidden');
    }
    return { pts: ok, max: cur.t.tf.length };
  }

  function gradeOrder() {
    let ok = 0;
    $('exBody').querySelectorAll('.ex-ordered .ex-oline').forEach((el, pos) => {
      const good = cur.picked[pos] === cur.order[pos];
      if (good) ok++;
      el.classList.add(good ? 'right' : 'wrong');
      el.querySelector('.ex-mark').textContent = good ? '✓' : `✗ era la ${cur.order.indexOf(cur.picked[pos]) + 1}ª`;
    });
    return { pts: ok, max: cur.order.length };
  }

  function gradeWho() {
    let ok = 0;
    cur.who.forEach((i, n) => {
      const box = $('exBody').querySelector(`.ex-q[data-who="${n}"]`);
      const sel = box.querySelector('select');
      const right = roleName(cur.t, cur.t.lines[i].who);
      const good = sel.value === right;
      if (good) ok++;
      sel.disabled = true;
      const res = box.querySelector('.ex-qres');
      res.innerHTML = good ? '✓ ¡Bien!' : `✗ Lo dice: <b>${esc(right)}</b>`;
      res.classList.remove('hidden');
    });
    return { pts: ok, max: cur.who.length };
  }

  function check() {
    if (cur.done) return;
    if (cur.act === 'order' && cur.picked.length < cur.order.length) return toast('Coloca todas las frases antes de corregir');
    stopAudio();
    cur.done = true;
    let r;
    if (cur.act === 'listen') r = gradeListen();
    else if (cur.act === 'read') r = gradeRead();
    else if (cur.act === 'test') r = gradeTest();
    else if (cur.act === 'tf') r = gradeTF();
    else if (cur.act === 'order') { r = gradeOrder(); $('exBody').querySelectorAll('.ex-oline').forEach(b => { b.disabled = true; }); }
    else if (cur.act === 'who') r = gradeWho();
    else if (cur.act === 'sim') {
      const l = gradeListen(), rd = gradeRead();
      cur.listenPts = l.pts;
      r = { pts: l.pts + rd.pts, max: l.max + rd.max };
    }
    cur.result = r;
    showResult();
    $('exBody').querySelectorAll('.ex-es').forEach(el => el.classList.remove('hidden')); // y ahora, con la traducción
  }

  function showResult() {
    const { t, act, result: r } = cur;
    const pct = Math.round((r.pts / r.max) * 100);
    const grade = Math.round((r.pts / r.max) * 100) / 10; // nota sobre 10
    saveScore(t, act, act === 'sim' ? Math.round(grade * 10) : pct);
    if (pct >= 80) { Sound.win(); confetti(); } else if (pct >= 50) Sound.correct(); else Sound.wrong();
    $('exTag').textContent = act === 'sim' ? `Nota: ${String(grade).replace('.', ',')}` : `${r.pts} / ${r.max}`;
    $('exTag').classList.remove('hidden');
    const next = act === 'listen' && t.group === 'exam' ? 'read' : act === 'read' ? 'test' : act === 'test' ? 'tf' : null;
    const box = $('exBody').querySelector('.ex-result');
    box.innerHTML = `<div class="ex-score"><b>${r.pts}</b> / ${r.max}${act === 'sim' ? ` · <span>Nota: <b>${String(grade).replace('.', ',')}</b> / 10</span>` : ` · ${pct}%`}</div>
      <p class="msg">${pct === 100 ? '¡Perfecto! 🏆' : pct >= 80 ? '¡Muy bien! 💪' : pct >= 50 ? '¡Aprobado! Repasa lo que has fallado 👍' : 'Hay que repasarlo un poco más 📚'}
        ${act === 'sim' ? `(listening ${cur.listenPts} / ${t.gaps.length} · reading ${r.pts - cur.listenPts} / ${t.questions.length * 2})` : ''}</p>
      ${act === 'read' || act === 'sim' ? '<p class="music-note">En el reading, si tu respuesta es correcta pero con otras palabras, pulsa «Me la doy por buena».</p>' : ''}
      <div class="row">
        <button type="button" class="btn btn-secondary" data-again>🔁 Repetir</button>
        ${next ? `<button type="button" class="btn btn-primary" data-go="${next}">${ACTS[next].icon} Ahora: ${ACTS[next].name}</button>` : ''}
        <button type="button" class="btn btn-ghost" data-random>🔀 Otra al azar</button>
      </div>`;
    box.classList.remove('hidden');
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // "Me la doy por buena": la respuesta del reading cuenta 2 puntos
  function selfGrade(n) {
    const q = cur.t.questions[n];
    const before = cur.pts['q' + n] || 0;
    cur.pts['q' + n] = 2;
    cur.result.pts += 2 - before;
    readResult(q, { points: 2, hit: q.keys.map(() => true) }, '');
    showResult();
  }

  function random(act = null) {
    const exam = allTexts().filter(t => t.group === 'exam');
    const t = exam[Math.floor(Math.random() * exam.length)];
    const acts = actsFor(t).filter(a => a !== 'sim');
    open(t.id, act || acts[Math.floor(Math.random() * acts.length)]);
  }

  // ---------- Eventos ----------
  $('exList').onclick = e => { const b = e.target.closest('[data-act]'); if (b) open(b.dataset.text, b.dataset.act); };
  $('exRandomSim').onclick = () => random('sim');
  $('exRandomAct').onclick = () => random();
  $('exBack').onclick = () => { stopAudio(); list(); showScreen('exams'); };
  $('exBody').addEventListener('click', e => {
    const el = e.target;
    if (el.closest('[data-play]')) {
      plays++;
      const counter = $('exBody').querySelector('.ex-plays b');
      if (counter) counter.textContent = plays;
      return playLines(cur.t, cur.t.lines);
    }
    if (el.closest('[data-stop]')) return stopAudio();
    const slowBtn = el.closest('[data-slow]');
    if (slowBtn) { slow = !slow; slowBtn.classList.toggle('on', slow); return toast(slow ? '🐢 Audio más despacio' : 'Audio a velocidad normal'); }
    const say = el.closest('[data-say-line]');
    if (say) { const l = cur.t.lines[Number(say.dataset.sayLine)]; return playLines(cur.t, [l]); }
    const tr = el.closest('[data-q-tr]');
    if (tr) return $('exBody').querySelector(`.ex-q[data-q="${tr.dataset.qTr}"] .ex-qes`).classList.toggle('hidden');
    const tf = el.closest('[data-tfv]');
    if (tf && !tf.disabled) { tf.parentElement.querySelectorAll('[data-tfv]').forEach(b => b.classList.toggle('on', b === tf)); return; }
    const pick = el.closest('[data-pick]');
    if (pick && !cur.done) { cur.picked.push(Number(pick.dataset.pick)); Sound.tick(); return paintOrder(); }
    const unpick = el.closest('[data-unpick]');
    if (unpick && !cur.done) { cur.picked.splice(Number(unpick.dataset.unpick), 1); return paintOrder(); }
    if (el.closest('[data-check]')) return check();
    const self = el.closest('[data-self]');
    if (self) return selfGrade(Number(self.dataset.self));
    if (el.closest('[data-again]')) return open(cur.t.id, cur.act);
    const go = el.closest('[data-go]');
    if (go) return open(cur.t.id, go.dataset.go);
    if (el.closest('[data-random]')) return random();
  });
  $('exBody').addEventListener('change', e => {
    if (e.target.matches('[data-bank]')) $('exBody').querySelector('.ex-bank').classList.toggle('hidden', !e.target.checked);
  });
  $('exBody').addEventListener('input', e => {
    if (e.target.matches('input.gap')) e.target.size = Math.max(12, e.target.value.length + 2);
  });
  $('exBody').addEventListener('keydown', e => { // Enter en un hueco: al siguiente
    if (e.key !== 'Enter' || !e.target.matches('input.gap')) return;
    e.preventDefault();
    const all = [...$('exBody').querySelectorAll('input.gap')];
    const next = all[all.indexOf(e.target) + 1];
    if (next) next.focus(); else e.target.blur();
  });
  function paintOrder() {
    const keep = $('exBody').querySelector('.ex-actions').outerHTML + $('exBody').querySelector('.ex-result').outerHTML;
    $('exBody').innerHTML = orderHTML() + keep;
  }

  return { list, open, stop: stopAudio };
})();
