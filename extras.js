// Extras: estadísticas (palabras difíciles y récords), "¡Casi!", código QR, reacciones y panel de música.

// ---------- Estadísticas guardadas en este dispositivo ----------
const Stats = (() => {
  const data = { w: {}, best: {}, streak: 0 };
  try { Object.assign(data, JSON.parse(localStorage.getItem('vd_stats') || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem('vd_stats', JSON.stringify(data)); } catch (e) {} };
  const rate = s => s.bad / (s.ok + s.bad);
  return {
    record(key, ok) {
      const s = data.w[key] || (data.w[key] = { ok: 0, bad: 0 });
      if (ok) s.ok++; else s.bad++;
      save();
    },
    word(key) { return data.w[key] || { ok: 0, bad: 0 }; },
    // Las que más te cuestan: las fallas al menos 1 de cada 3 veces (máx. 15)
    hardKeys() {
      return Object.entries(data.w).filter(([, s]) => s.bad > 0 && rate(s) >= 0.34)
        .sort((a, b) => rate(b[1]) - rate(a[1]) || b[1].bad - a[1].bad)
        .slice(0, 15).map(([k]) => k);
    },
    // Al acabar una práctica: guarda y devuelve los récords superados
    finishPractice(set, pct, total, streak) {
      const out = {};
      const prev = data.best[set];
      if (set && total >= 5 && (!prev || pct > prev.pct)) { out.pct = true; data.best[set] = { pct }; }
      if (streak >= 3 && streak > (data.streak || 0)) { out.streak = true; data.streak = streak; }
      save();
      return out;
    },
    bestPct(set) { return data.best[set] ? data.best[set].pct : null; },
  };
})();

const wordKeyOf = w => w.en.label + '|' + w.es.label;

// ---------- "¡Casi!": qué letras sobran y cuáles faltan ----------
function levenshtein(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

// La respuesta aceptada más parecida a lo que has escrito
function closestAnswer(text, reveal) {
  const input = norm(text);
  let best = null;
  for (const f of expandForms([reveal.answer, ...reveal.also])) {
    const d = levenshtein(Array.from(stripAccents(input)), Array.from(stripAccents(f)));
    if (!best || d < best.d) best = { target: f, d };
  }
  return best && { input, ...best };
}

function diffMarks(a, b) {
  const A = Array.from(a), B = Array.from(b);
  const L = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
  for (let i = A.length - 1; i >= 0; i--) {
    for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  }
  let i = 0, j = 0, outA = '', outB = '';
  while (i < A.length || j < B.length) {
    if (i < A.length && j < B.length && A[i] === B[j]) { outA += esc(A[i++]); outB += esc(B[j++]); }
    else if (j < B.length && (i === A.length || L[i][j + 1] >= L[i + 1][j])) outB += `<mark class="miss">${esc(B[j++])}</mark>`;
    else outA += `<mark class="extra">${esc(A[i++])}</mark>`;
  }
  return { a: outA, b: outB };
}

// { near, html }: si has fallado por poco (o te falta una tilde), enseña dónde
function almostInfo(res, reveal) {
  if (!res || !res.text || res.ok === 1 || !reveal || typeof reveal.correct === 'number') return { near: false, html: '' }; // en el quiz no
  const c = closestAnswer(res.text, reveal);
  if (!c) return { near: false, html: '' };
  const d = diffMarks(c.input, c.target);
  if (res.ok === 2) return { near: false, html: `<div class="diff">✍️ Se escribe: <b>${d.b}</b></div>` };
  const near = c.d <= Math.max(1, Math.floor(Array.from(c.target).length / 4));
  return near ? { near, html: `<div class="diff">Tú: <span>${d.a}</span><br>Era: <b>${d.b}</b></div>` } : { near: false, html: '' };
}

// ---------- Código QR de la sala ----------
function openQR() {
  const box = $('qrBig');
  box.innerHTML = '';
  let ok = false;
  if (window.QRCode) {
    const size = Math.min(320, window.innerWidth - 110);
    new QRCode(box, { text: roomLink(), width: size, height: size, colorDark: '#23124f', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
    ok = true;
  }
  $('qrNote').classList.toggle('hidden', ok);
  $('qrCode').textContent = roomCode;
  $('qrLink').textContent = roomLink();
  $('qrModal').classList.remove('hidden');
}

// ---------- Reacciones ----------
let lastReactAt = 0;
function sendReaction(e) {
  if (Date.now() - lastReactAt < 400) return;
  lastReactAt = Date.now();
  showReaction(me.id, e);
  act('react', { e });
}

function showReaction(id, e) {
  const p = S && S.players.find(x => x.id === id);
  const box = $('reactions');
  const el = document.createElement('div');
  el.className = 'reaction';
  el.style.left = 8 + Math.random() * 78 + '%';
  el.innerHTML = `<span class="r-emoji">${esc(e)}</span><span class="r-who">${p ? `${esc(p.avatar)} ${esc(p.name)}` : ''}</span>`;
  box.appendChild(el);
  setTimeout(() => el.remove(), 2600);
  while (box.children.length > 30) box.firstChild.remove();
}

// ---------- Música: panel y qué debe sonar ----------
let personalYt = null; // tu música de YouTube fuera de las salas
try { personalYt = localStorage.getItem('vd_yt') || null; } catch (e) {}
let musicPanelTimer = null;

const inRoom = () => role === 'host' || role === 'guest';

// En una sala suena la música que ponga el anfitrión (a la vez para todos); fuera, la tuya
function desiredYt() {
  if (inRoom()) {
    if (!S || !S.music) return null;
    return { id: S.music.id, pos: S.music.pos + (Date.now() - (S.music.recv || Date.now())) / 1000 };
  }
  return personalYt ? { id: personalYt, pos: 0 } : null;
}

function paintMusicBtn() {
  $('musicBtn').classList.toggle('off', !Music.enabled);
  $('musicBtn').title = Music.enabled ? 'Música (activada)' : 'Música (apagada)';
}

function renderMusicPanel() {
  const room = inRoom();
  const canSet = !room || role === 'host';
  $('musicToggle').textContent = Music.enabled ? '🔊 Música activada · toca para apagarla' : '🔇 Música apagada · toca para encenderla';
  $('musicToggle').className = 'btn btn-block ' + (Music.enabled ? 'btn-secondary' : 'btn-ghost');
  const yt = desiredYt();
  let now = '🎶 Suena la música del juego (va cambiando de canción sola).';
  if (!Music.enabled) now = 'La música está apagada.';
  else if (yt) now = `▶ Suena en YouTube: <b>${esc(YTMusic.title || 'cargando…')}</b>${room ? ' · para toda la sala' : ''}`;
  if (YTMusic.error) now += `<br><span class="error">${esc(YTMusic.error)}</span>`;
  $('musicNow').innerHTML = now;
  $('ytInput').disabled = !canSet;
  $('ytSet').disabled = !canSet;
  $('ytClear').classList.toggle('hidden', !yt || !canSet);
  $('ytNote').textContent = !room ? 'Fuera de una sala, la música de YouTube solo suena para ti.'
    : canSet ? '🎧 Eres el anfitrión: la música que pongas la escuchará toda la sala.' : '🔒 En la sala, la música la elige el anfitrión.';
}

function openMusic() {
  renderMusicPanel();
  $('ytMsg').textContent = '';
  $('musicModal').classList.remove('hidden');
  clearInterval(musicPanelTimer);
  musicPanelTimer = setInterval(renderMusicPanel, 800); // para que se vea el título cuando cargue
}

function closeMusic() {
  $('musicModal').classList.add('hidden');
  clearInterval(musicPanelTimer);
}

function setYoutube(text) {
  const id = YTMusic.parseId(text);
  if (!id) {
    $('ytMsg').textContent = 'Ese enlace no parece de YouTube. Copia el enlace del vídeo (por ejemplo https://youtu.be/…).';
    $('ytMsg').classList.add('error');
    return;
  }
  Sound.unlock();
  if (!Music.enabled) { Music.toggle(); paintMusicBtn(); }
  if (inRoom()) { if (role === 'host' && host) host.setMusic(id); }
  else { personalYt = id; local.set('vd_yt', id); }
  $('ytInput').value = '';
  $('ytMsg').textContent = '¡Puesta! Si no empieza a sonar, toca ▶ en el reproductor pequeño.';
  $('ytMsg').classList.remove('error');
  renderMusicPanel();
}

function clearYoutube() {
  if (inRoom()) { if (role === 'host' && host) host.setMusic(null); }
  else { personalYt = null; local.set('vd_yt', ''); }
  $('ytMsg').textContent = '';
  renderMusicPanel();
}
