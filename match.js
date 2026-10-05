// Rival al azar: busca a otra persona que también esté buscando partida 1 vs 1.
// Todos los que buscan se anuncian por un canal común; para emparejarse sin líos hay un
// "apretón de manos": oferta → acepto → confirmo. El que tiene el id menor crea la sala.
const Matchmaker = (() => {
  // canal propio de esta web (para no mezclarse con copias del juego en otras direcciones)
  const site = (() => {
    let h = 0;
    for (const ch of location.host + location.pathname) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return (h >>> 0).toString(36);
  })();
  const TOPIC = `${Net.PREFIX}/buscar/${site}`;

  let clients = [], seen = new Map(), seekers = new Map(), timer = null, seq = 0;
  let me = null, code = '', status = 'off', partner = null, statusUntil = 0, onMatch = null, onCount = null;

  function send(msg) {
    msg.from = me.id;
    msg.mid = `${me.id}:${++seq}:${Math.random().toString(36).slice(2, 6)}`;
    const data = JSON.stringify(msg);
    for (const c of clients) if (c.connected) c.publish(TOPIC, data);
  }

  function setStatus(s, who = null, ms = 0) {
    status = s;
    partner = who;
    statusUntil = ms ? Date.now() + ms : 0;
  }

  function matched(role, roomCode) {
    setStatus('done');
    const cb = onMatch;
    stop(1500); // deja salir el último mensaje antes de cerrar la conexión
    cb({ role, code: roomCode });
  }

  function receive(raw) {
    let msg;
    try { msg = JSON.parse(new TextDecoder().decode(raw)); } catch (e) { return; }
    if (!msg || !msg.mid || msg.from === me.id || seen.has(msg.mid)) return;
    seen.set(msg.mid, 1);
    if (seen.size > 500) seen.delete(seen.keys().next().value);
    if (msg.t === 'seek') {
      seekers.set(msg.from, Date.now());
      // el de id menor propone la partida (y crea la sala)
      if (status === 'free' && me.id < msg.from) {
        setStatus('offering', msg.from, 3000);
        send({ t: 'offer', to: msg.from, code });
      }
      return;
    }
    if (msg.to !== me.id) return;
    if (msg.t === 'offer') {
      if (status === 'free' || (status === 'offering' && msg.from < me.id)) {
        setStatus('accepting', msg.from, 4000);
        send({ t: 'accept', to: msg.from });
      } else {
        send({ t: 'reject', to: msg.from });
      }
    } else if (msg.t === 'accept') {
      if (status === 'offering' && partner === msg.from) {
        send({ t: 'confirm', to: msg.from, code });
        matched('host', code);
      } else {
        send({ t: 'reject', to: msg.from });
      }
    } else if (msg.t === 'confirm') {
      if (status === 'accepting' && partner === msg.from) matched('guest', msg.code);
    } else if (msg.t === 'reject') {
      if (partner === msg.from) setStatus('free');
    }
  }

  function loop() {
    const now = Date.now();
    if (statusUntil && now > statusUntil) setStatus('free'); // nadie contestó: seguimos buscando
    if (status === 'free') send({ t: 'seek', name: me.name, avatar: me.avatar });
    for (const [id, ts] of seekers) if (now - ts > 6000) seekers.delete(id);
    if (onCount) onCount(seekers.size, clients.some(c => c.connected));
  }

  function start(player, roomCode, matchCb, countCb) {
    stop();
    me = player;
    code = roomCode;
    onMatch = matchCb;
    onCount = countCb;
    setStatus('free');
    if (window.mqtt) {
      Net.BROKERS.forEach((url, i) => {
        try {
          const c = mqtt.connect(url, {
            clientId: `vdm_${me.id}_${i}_${Math.random().toString(36).slice(2, 7)}`,
            connectTimeout: 8000, reconnectPeriod: 4000, keepalive: 20, clean: true,
          });
          c.on('connect', () => c.subscribe(TOPIC));
          c.on('message', (t, payload) => receive(payload));
          c.on('error', () => {});
          clients.push(c);
        } catch (e) {}
      });
    }
    timer = setInterval(loop, 2000);
    setTimeout(loop, 800);
  }

  function stop(delay = 0) {
    clearInterval(timer);
    timer = null;
    const old = clients;
    clients = [];
    setTimeout(() => old.forEach(c => { try { c.end(true); } catch (e) {} }), delay);
    seekers.clear();
    if (status !== 'done') status = 'off';
  }

  return { start, stop, get searching() { return !!timer; } };
})();
