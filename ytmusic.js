// Música de YouTube: sustituye a la música de ambiente.
// En una sala la pone el anfitrión y suena a todos; fuera de una sala, solo para ti.
const YTMusic = (() => {
  const VOLUME = 45;
  let player = null, ready = false, apiLoading = false;
  let wantedId = null, wantedPos = 0, loadedId = null, ducked = false;
  let title = '', error = '', blockedTimer = null;

  // Saca el id del vídeo de cualquier enlace de YouTube (o acepta el id directamente)
  function parseId(text) {
    const s = String(text || '').trim();
    const m = s.match(/(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
    return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : null;
  }

  function loadApi() {
    if (apiLoading) return;
    apiLoading = true;
    window.onYouTubeIframeAPIReady = () => { ready = true; apply(); };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.onerror = () => { error = 'No se ha podido cargar YouTube (¿está bloqueado en esta red?)'; apiLoading = false; };
    document.head.appendChild(tag);
  }

  function showBox(show) {
    $('ytBox').classList.toggle('hidden', !show);
    document.body.classList.toggle('has-yt', show);
  }

  function watchBlocked() {
    clearTimeout(blockedTimer);
    blockedTimer = setTimeout(() => {
      const st = player && player.getPlayerState ? player.getPlayerState() : -1;
      $('ytTap').classList.toggle('hidden', st === 1 || st === 3 || !wantedId); // 1 = sonando, 3 = cargando
    }, 2500);
  }

  function apply() {
    if (!wantedId) {
      if (player && loadedId) { try { player.stopVideo(); } catch (e) {} }
      loadedId = null;
      showBox(false);
      return;
    }
    if (!ready) return loadApi();
    showBox(true);
    if (!player) {
      loadedId = wantedId;
      player = new YT.Player('ytPlayer', {
        width: 144, height: 81, videoId: wantedId,
        playerVars: { autoplay: 1, controls: 1, playsinline: 1, rel: 0, modestbranding: 1, start: Math.floor(wantedPos) },
        events: {
          onReady: e => { e.target.setVolume(ducked ? 15 : VOLUME); e.target.playVideo(); watchBlocked(); },
          onStateChange: e => {
            if (e.data === 1) { // sonando
              $('ytTap').classList.add('hidden');
              const d = player.getVideoData ? player.getVideoData() : null;
              title = (d && d.title) || title;
            }
            if (e.data === 0) { e.target.seekTo(0, true); e.target.playVideo(); } // en bucle
          },
          onError: e => {
            error = [101, 150].includes(e.data) ? 'Ese vídeo no deja que lo pongan fuera de YouTube. Prueba con otro.'
              : 'No se ha podido reproducir ese vídeo.';
          },
        },
      });
      return;
    }
    if (loadedId !== wantedId) {
      loadedId = wantedId;
      title = '';
      error = '';
      player.loadVideoById({ videoId: wantedId, startSeconds: Math.floor(wantedPos) });
      player.setVolume(ducked ? 15 : VOLUME);
      watchBlocked();
    }
  }

  return {
    parseId,
    get active() { return !!wantedId; },
    get title() { return title; },
    get error() { return error; },
    // Se llama continuamente: qué vídeo debe sonar (o null), por dónde va y si hay que bajar el volumen
    want(id, pos, duck) {
      if (duck !== ducked) {
        ducked = duck;
        if (player && player.setVolume) player.setVolume(ducked ? 15 : VOLUME);
      }
      if (id === wantedId) return;
      wantedId = id;
      wantedPos = Math.max(0, pos || 0);
      error = '';
      if (!id) title = '';
      apply();
    },
    play() { // botón "Toca para escuchar" (necesita un toque en la página)
      if (player && player.playVideo) player.playVideo();
      $('ytTap').classList.add('hidden');
    },
  };
})();
