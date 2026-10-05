// Conexión entre los dos jugadores sin servidor propio (GitHub Pages solo sirve archivos).
// Cada mensaje se manda por varios caminos a la vez y se descartan los duplicados:
//  - brokers MQTT públicos por WebSocket seguro (funciona aunque estéis en la misma wifi o con datos)
//  - PeerJS / WebRTC directo, por si algún broker está bloqueado
const Net = (() => {
  const PREFIX = 'vocabduel-v1';
  const BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'];

  function create({ code, role, myId, onMessage, onStatus = () => {} }) {
    const isHost = role === 'host';
    const inTopic = `${PREFIX}/${code}/${isHost ? 'h' : 'g'}`;
    const outTopic = `${PREFIX}/${code}/${isHost ? 'g' : 'h'}`;
    const hostPeerId = `${PREFIX}-${code}`;
    const decoder = new TextDecoder();
    const nonce = Math.random().toString(36).slice(2, 8); // distinto en cada carga de página
    const seen = new Map();
    const clients = [];
    const conns = new Set();
    let peer = null, seq = 0, closed = false;
    let peerTries = 0, connTries = 0, retryTimer = null, connTimer = null;

    function status() {
      if (closed) return;
      onStatus({
        mqtt: clients.filter(c => c.connected).length,
        mqttTotal: clients.length,
        p2p: [...conns].some(c => c.open),
      });
    }

    function deliver(raw) {
      let msg;
      try { msg = JSON.parse(typeof raw === 'string' ? raw : decoder.decode(raw)); } catch (e) { return; }
      if (!msg || !msg.mid || msg.from === myId || seen.has(msg.mid)) return;
      seen.set(msg.mid, 1);
      if (seen.size > 800) seen.delete(seen.keys().next().value);
      onMessage(msg);
    }

    const outbox = []; // mensajes enviados antes de estar conectados: salen al conectar

    function push(data) {
      for (const c of clients) if (c.connected) c.publish(outTopic, data);
      for (const c of conns) if (c.open) { try { c.send(data); } catch (e) {} }
    }

    function flush() {
      while (outbox.length) push(outbox.shift());
    }

    function send(msg) {
      if (closed) return;
      msg.from = myId;
      msg.mid = `${myId}:${nonce}:${++seq}`;
      const data = JSON.stringify(msg);
      if (clients.some(c => c.connected) || [...conns].some(c => c.open)) return push(data);
      outbox.push(data);
      if (outbox.length > 30) outbox.shift();
    }

    // --- MQTT ---
    if (window.mqtt) {
      BROKERS.forEach((url, i) => {
        try {
          const c = mqtt.connect(url, {
            clientId: `vd_${myId}_${i}_${Math.random().toString(36).slice(2, 7)}`,
            connectTimeout: 8000, reconnectPeriod: 4000, keepalive: 20, clean: true,
          });
          c.on('connect', () => { c.subscribe(inTopic, () => flush()); status(); });
          c.on('message', (topic, payload) => deliver(payload));
          c.on('close', status);
          c.on('offline', status);
          c.on('error', () => {});
          clients.push(c);
        } catch (e) {}
      });
    }

    // --- PeerJS (WebRTC) ---
    function addConn(conn) {
      conn.on('open', () => { conns.add(conn); flush(); status(); });
      conn.on('data', deliver);
      conn.on('close', () => { conns.delete(conn); if (!isHost) connTries = 0; status(); }); // reintenta (p. ej. si cambia el anfitrión)
      conn.on('error', () => { conns.delete(conn); status(); });
    }

    function connectToHost() {
      if (closed || !peer || peer.destroyed || peer.disconnected) return;
      if ([...conns].some(c => c.open)) return;
      try { addConn(peer.connect(hostPeerId, { reliable: true })); } catch (e) {}
    }

    function startPeer() {
      if (closed || !window.Peer) return;
      try { peer = isHost ? new Peer(hostPeerId) : new Peer(); } catch (e) { return; }
      peer.on('open', () => { if (!isHost) connectToHost(); });
      peer.on('connection', conn => { if (isHost) addConn(conn); });
      peer.on('disconnected', () => {
        if (!closed && !peer.destroyed) { try { peer.reconnect(); } catch (e) {} }
      });
      peer.on('error', err => {
        if (closed) return;
        if (err && err.type === 'unavailable-id' && peerTries++ < 3) {
          peer.destroy();
          retryTimer = setTimeout(startPeer, 5000);
        }
      });
    }

    startPeer();
    if (!isHost) {
      // WebRTC a veces falla sin avisar: reintenta unas cuantas veces
      connTimer = setInterval(() => {
        if (connTries++ < 6) connectToHost();
      }, 8000);
    }

    function destroy() {
      closed = true;
      clearTimeout(retryTimer);
      clearInterval(connTimer);
      clients.forEach(c => { try { c.end(true); } catch (e) {} });
      conns.forEach(c => { try { c.close(); } catch (e) {} });
      if (peer) { try { peer.destroy(); } catch (e) {} }
    }

    return { send, destroy };
  }

  return { create, BROKERS, PREFIX };
})();
