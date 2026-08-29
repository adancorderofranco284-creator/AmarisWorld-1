/* ==========================================================================
   AMARIS WORLD — REGALO INTERACTIVO DE CUMPLEAÑOS
   JS vanilla. Sin dependencias externas.
   ========================================================================== */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* ------------------------------------------------------------------ */
  /* 1) Fallback de altura de viewport para iOS Safari antiguo           */
  /* ------------------------------------------------------------------ */

  function setAppHeight() {
    const root = document.documentElement;
    if (!CSS.supports('height', '100dvh')) {
      root.style.setProperty('--app-height', `${window.innerHeight}px`);
    }
  }
  setAppHeight();
  window.addEventListener('resize', setAppHeight);
  window.addEventListener('orientationchange', setAppHeight);

  /* ------------------------------------------------------------------ */
  /* 2) Generación de estrellas y partículas (decorativas)               */
  /* ------------------------------------------------------------------ */

  function createStars(count) {
    const layer = document.getElementById('starsLayer');
    if (!layer) return;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.className = 'star';

      const size = (Math.random() * 1.8 + 0.8).toFixed(2);
      const top = (Math.random() * 100).toFixed(2);
      const left = (Math.random() * 100).toFixed(2);
      const duration = (Math.random() * 3 + 3).toFixed(2);
      const delay = (Math.random() * 4).toFixed(2);

      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.top = `${top}%`;
      star.style.left = `${left}%`;
      star.style.setProperty('--dur', `${duration}s`);
      star.style.setProperty('--delay', `${delay}s`);

      fragment.appendChild(star);
    }

    layer.appendChild(fragment);
  }

  function createParticles(count) {
    const layer = document.getElementById('particlesLayer');
    if (!layer || prefersReducedMotion) return;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      particle.className = 'particle';

      const size = (Math.random() * 3 + 2).toFixed(2);
      const left = (Math.random() * 100).toFixed(2);
      const bottom = (Math.random() * 30).toFixed(2);
      const duration = (Math.random() * 6 + 10).toFixed(2);
      const delay = (Math.random() * 10).toFixed(2);

      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${left}%`;
      particle.style.bottom = `${bottom}%`;
      particle.style.setProperty('--dur', `${duration}s`);
      particle.style.setProperty('--delay', `${delay}s`);

      fragment.appendChild(particle);
    }

    layer.appendChild(fragment);
  }

  /* ------------------------------------------------------------------ */
  /* 3) Transición ENTRAR → Umbral → Lobby                               */
  /* ------------------------------------------------------------------ */

  function goToThreshold() {
    const orb = document.getElementById('orb');
    const lobbyScreen = document.getElementById('lobbyScreen');
    const thresholdScreen = document.getElementById('thresholdScreen');
    const enterBtn = document.getElementById('enterBtn');

    if (!orb || !lobbyScreen || !thresholdScreen || !enterBtn) return;

    enterBtn.disabled = true;
    orb.classList.add('is-opening');

    const portalDuration = prefersReducedMotion ? 300 : 900;
    const holdDuration = prefersReducedMotion ? 400 : 1200;

    window.setTimeout(() => {
      lobbyScreen.setAttribute('aria-hidden', 'true');
      thresholdScreen.setAttribute('aria-hidden', 'false');
      thresholdScreen.setAttribute('tabindex', '-1');
      thresholdScreen.focus({ preventScroll: true });

      window.setTimeout(() => {
        thresholdScreen.classList.add('is-settled');
        revealWorld();
      }, holdDuration);
    }, portalDuration);
  }

  /* ------------------------------------------------------------------ */
  /* 4) Luciérnagas y destellos decorativos de la escena pixel-art       */
  /* ------------------------------------------------------------------ */

  function createFireflies(count) {
    const layer = document.getElementById('firefliesLayer');
    if (!layer || prefersReducedMotion || layer.dataset.rendered === 'true') return;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const firefly = document.createElement('span');
      firefly.className = 'pixel-firefly';

      const left = (Math.random() * 70 + 10).toFixed(2);
      const bottom = (Math.random() * 30 + 6).toFixed(2);
      const duration = (Math.random() * 5 + 7).toFixed(2);
      const delay = (Math.random() * 8).toFixed(2);

      firefly.style.left = `${left}%`;
      firefly.style.bottom = `${bottom}%`;
      firefly.style.setProperty('--dur', `${duration}s`);
      firefly.style.setProperty('--delay', `${delay}s`);

      fragment.appendChild(firefly);
    }

    layer.appendChild(fragment);
    layer.dataset.rendered = 'true';
  }

  function createSkyTwinkles(count) {
    const layer = document.getElementById('skyTwinkleLayer');
    if (!layer || prefersReducedMotion || layer.dataset.rendered === 'true') return;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.className = 'sky-twinkle';

      const left = (Math.random() * 90 + 5).toFixed(2);
      const top = (Math.random() * 35 + 4).toFixed(2);
      const duration = (Math.random() * 3 + 3).toFixed(2);
      const delay = (Math.random() * 4).toFixed(2);

      star.style.left = `${left}%`;
      star.style.top = `${top}%`;
      star.style.setProperty('--dur', `${duration}s`);
      star.style.setProperty('--delay', `${delay}s`);

      fragment.appendChild(star);
    }

    layer.appendChild(fragment);
    layer.dataset.rendered = 'true';
  }

  /* ------------------------------------------------------------------ */
  /* 5) Lobby: revelación y render de los 5 puntos interactivos          */
  /* ------------------------------------------------------------------ */

  function revealWorld() {
    const thresholdScreen = document.getElementById('thresholdScreen');
    const worldScreen = document.getElementById('worldScreen');
    if (!thresholdScreen || !worldScreen) return;

    renderWorld();
    bindZoneEvents();
    createFireflies(6);
    createSkyTwinkles(14);
    showMiniPlayer();

    const worldRevealDelay = prefersReducedMotion ? 200 : 700;

    window.setTimeout(() => {
      thresholdScreen.setAttribute('aria-hidden', 'true');
      worldScreen.setAttribute('aria-hidden', 'false');
      worldScreen.setAttribute('tabindex', '-1');
      worldScreen.focus({ preventScroll: true });
    }, worldRevealDelay);
  }

  function renderWorld() {
    const stage = document.getElementById('worldStage');
    if (!stage || stage.dataset.rendered === 'true') return;

    const zones = window.AMARIS_ZONES || [];
    if (!zones.length) return;

    const fragment = document.createDocumentFragment();

    zones.forEach((zone) => {
      if (zone.unlocked === false) return;

      const point = document.createElement('button');
      point.type = 'button';
      point.className = 'zone-point';
      point.dataset.zoneId = zone.id;
      point.style.setProperty('--x', `${zone.position.x}%`);
      point.style.setProperty('--y', `${zone.position.y}%`);
      point.setAttribute('aria-label', zone.name);

      const arrow = document.createElement('span');
      arrow.className = 'zone-arrow';
      arrow.textContent = '▾';
      arrow.setAttribute('aria-hidden', 'true');

      const badge = document.createElement('span');
      badge.className = 'zone-badge';
      badge.textContent = zone.icon || '✦';
      badge.setAttribute('aria-hidden', 'true');

      const label = document.createElement('span');
      label.className = 'zone-label';
      label.textContent = zone.name;

      point.appendChild(arrow);
      point.appendChild(badge);
      point.appendChild(label);
      fragment.appendChild(point);
    });

    stage.appendChild(fragment);
    stage.dataset.rendered = 'true';
  }

  function bindZoneEvents() {
    const stage = document.getElementById('worldStage');
    if (!stage || stage.dataset.bound === 'true') return;

    stage.addEventListener('click', (event) => {
      const point = event.target.closest('.zone-point');
      if (!point) return;
      enterZone(point.dataset.zoneId);
    });

    stage.dataset.bound = 'true';

    bindWorldParallax();
  }

  function enterZone(zoneId) {
    // La sorpresa final tiene su propia escena cinematográfica.
    if (zoneId === 'sorpresa') {
      enterSurprise();
      return;
    }

    const worldScreen = document.getElementById('worldScreen');
    const zoneScreen = document.getElementById('zoneScreen');
    if (!worldScreen || !zoneScreen) return;

    const zone = (window.AMARIS_ZONES || []).find((z) => z.id === zoneId);
    if (!zone) return;

    populateZoneContent(zone);

    const feedbackDelay = prefersReducedMotion ? 0 : 260;

    window.setTimeout(() => {
      worldScreen.setAttribute('aria-hidden', 'true');
      zoneScreen.setAttribute('aria-hidden', 'false');
      zoneScreen.setAttribute('tabindex', '-1');
      zoneScreen.focus({ preventScroll: true });
    }, feedbackDelay);
  }

  function exitZone() {
    const worldScreen = document.getElementById('worldScreen');
    const zoneScreen = document.getElementById('zoneScreen');
    if (!worldScreen || !zoneScreen) return;

    zoneScreen.setAttribute('aria-hidden', 'true');
    worldScreen.setAttribute('aria-hidden', 'false');
    worldScreen.setAttribute('tabindex', '-1');
    worldScreen.focus({ preventScroll: true });
  }

  // Parallax sutil, solo con puntero fino y sin movimiento reducido.
  function bindWorldParallax() {
    const worldScreen = document.getElementById('worldScreen');
    const ambient = document.querySelector('.world-ambient');
    if (!worldScreen || !ambient) return;

    const canParallax = window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion;
    if (!canParallax) return;

    let rafId = null;

    worldScreen.addEventListener('mousemove', (event) => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        const offsetX = (event.clientX / window.innerWidth - 0.5) * 12;
        const offsetY = (event.clientY / window.innerHeight - 0.5) * 12;
        ambient.style.setProperty('--px', `${offsetX.toFixed(2)}px`);
        ambient.style.setProperty('--py', `${offsetY.toFixed(2)}px`);
        rafId = null;
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* 6) Contenido de cada zona (dispatch por tipo)                       */
  /* ------------------------------------------------------------------ */

  function populateZoneContent(zone) {
    const body = document.getElementById('zoneBody');
    if (!body) return;

    body.innerHTML = '';
    body.className = 'zone-body';

    switch (zone.id) {
      case 'carta':
        renderCarta(body);
        break;
      case 'recuerdos':
        renderRecuerdos(body);
        break;
      case 'regalo':
        renderRegalo(body);
        break;
      case 'musica':
        renderMusica(body);
        break;
      default:
        break;
    }
  }

  /* ---- 💌 CARTA ------------------------------------------------------- */

  function renderCarta(body) {
    const content = (window.AMARIS_CONTENT && window.AMARIS_CONTENT.carta) || {};
    body.classList.add('content-carta');

    const wrap = document.createElement('div');
    wrap.className = 'letter-card';

    const title = document.createElement('h2');
    title.className = 'zone-title';
    title.textContent = `💌 ${content.titulo || 'Una carta para ti'}`;

    const paper = document.createElement('div');
    paper.className = 'letter-paper';

    const text = document.createElement('p');
    text.className = 'letter-text';
    text.textContent = content.texto || '';

    const signature = document.createElement('p');
    signature.className = 'letter-signature';
    signature.textContent = content.firma || '';

    paper.appendChild(text);
    paper.appendChild(signature);
    wrap.appendChild(title);
    wrap.appendChild(paper);
    body.appendChild(wrap);
  }

  /* ---- 📸 RECUERDOS ----------------------------------------------------- */

  function renderRecuerdos(body) {
    const items = (window.AMARIS_CONTENT && window.AMARIS_CONTENT.galeria) || [];
    body.classList.add('content-galeria');

    const wrap = document.createElement('div');
    wrap.className = 'gallery';

    const title = document.createElement('h2');
    title.className = 'zone-title';
    title.textContent = '📸 Recuerdos';
    wrap.appendChild(title);

    const frame = document.createElement('div');
    frame.className = 'gallery-frame';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'gallery-nav gallery-prev';
    prevBtn.setAttribute('aria-label', 'Recuerdo anterior');
    prevBtn.textContent = '‹';

    const slide = document.createElement('div');
    slide.className = 'gallery-slide';
    slide.id = 'gallerySlide';

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'gallery-nav gallery-next';
    nextBtn.setAttribute('aria-label', 'Recuerdo siguiente');
    nextBtn.textContent = '›';

    frame.appendChild(prevBtn);
    frame.appendChild(slide);
    frame.appendChild(nextBtn);
    wrap.appendChild(frame);

    const dots = document.createElement('div');
    dots.className = 'gallery-dots';
    wrap.appendChild(dots);

    body.appendChild(wrap);

    // ---------------------------------------------------------------------
    // Carga de fotos: comprueba cada foto antes de mostrarla (si el archivo
    // no existe, se omite sin romper nada) y las va agregando a la galería
    // progresivamente, en lugar de esperar a que las ~100+ fotos terminen de
    // precargar todas antes de mostrar la primera. Así la sección responde
    // al instante aunque la carpeta tenga muchas fotos de varios MB cada una.
    //
    // Además de las fotos listadas en content.js, se auto-detectan fotos
    // numeradas adicionales que sigan la secuencia (123.jpg, 124.jpg...) por
    // si en el futuro se agregan más sin editar content.js.
    // ---------------------------------------------------------------------

    let loaded = [];
    let index = 0;
    let cancelled = false;

    // Si el usuario cambia de zona antes de que termine de cargar/detectar
    // fotos en segundo plano, se detiene el trabajo pendiente (no tiene
    // sentido seguir pidiendo fotos para una vista que ya no está visible).
    function isCancelled() {
      return cancelled || !wrap.isConnected;
    }

    function checkImage(src) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });
    }

    function addLoadedItems(newItems) {
      if (isCancelled() || !newItems.length) return;
      const wasEmpty = !loaded.length;
      const activeSrc = wasEmpty ? null : loaded[index] && loaded[index].src;
      loaded = loaded.concat(newItems);
      if (!wasEmpty && activeSrc) {
        // Mantiene visible la foto actual aunque se agreguen más al final.
        const keepIndex = loaded.findIndex((item) => item.src === activeSrc);
        if (keepIndex !== -1) index = keepIndex;
      }
      renderSlide();
    }

    async function loadManualItems() {
      // Se comprueban en tandas pequeñas en paralelo: la primera foto se
      // muestra en cuanto está lista, sin esperar al resto.
      const CHUNK_SIZE = 6;
      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        if (isCancelled()) return;
        const chunk = items.slice(i, i + CHUNK_SIZE);
        // eslint-disable-next-line no-await-in-loop
        const results = await Promise.all(
          chunk.map((item) => checkImage(item.src).then((ok) => (ok ? item : null)))
        );
        addLoadedItems(results.filter(Boolean));
      }
    }

    function highestListedNumber() {
      let max = 0;
      items.forEach((item) => {
        const match = /\/(\d+)\.\w+$/.exec(item.src || '');
        if (match) max = Math.max(max, parseInt(match[1], 10));
      });
      return max;
    }

    async function autoDetectMore() {
      const EXTENSIONS = ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG', 'webp', 'WEBP'];
      const MAX_CONSECUTIVE_MISSES = 15;
      const HARD_CAP = highestListedNumber() + 500; // límite de seguridad

      let misses = 0;
      let n = highestListedNumber() + 1;

      while (!isCancelled() && misses < MAX_CONSECUTIVE_MISSES && n <= HARD_CAP) {
        let foundSrc = null;
        for (let e = 0; e < EXTENSIONS.length; e += 1) {
          if (isCancelled()) return;
          const candidate = `assets/recuerdos/${n}.${EXTENSIONS[e]}`;
          // eslint-disable-next-line no-await-in-loop
          const ok = await checkImage(candidate);
          if (ok) {
            foundSrc = candidate;
            break;
          }
        }

        if (foundSrc) {
          addLoadedItems([
            { src: foundSrc, caption: 'Escribe aquí el recuerdo de esta foto ✨' }
          ]);
          misses = 0;
        } else {
          misses += 1;
        }
        n += 1;
      }
    }

    loadManualItems().then(autoDetectMore);

    function renderSlide() {
      slide.innerHTML = '';
      dots.innerHTML = '';

      if (!loaded.length) {
        const placeholder = document.createElement('div');
        placeholder.className = 'gallery-placeholder';
        placeholder.innerHTML =
          '<span class="gallery-placeholder-icon">🖼️</span>' +
          '<p>Aún no hay fotos aquí…<br>pronto llegarán ✨</p>';
        slide.appendChild(placeholder);
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        return;
      }

      prevBtn.disabled = loaded.length < 2;
      nextBtn.disabled = loaded.length < 2;

      const current = loaded[index];
      const img = document.createElement('img');
      img.className = 'gallery-photo';
      img.src = current.src;
      img.alt = current.caption || 'Recuerdo';
      slide.appendChild(img);

      if (current.caption) {
        const caption = document.createElement('p');
        caption.className = 'gallery-caption';
        caption.textContent = current.caption;
        slide.appendChild(caption);
      }

      loaded.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.className = 'gallery-dot' + (i === index ? ' is-active' : '');
        dots.appendChild(dot);
      });
    }

    prevBtn.addEventListener('click', () => {
      if (!loaded.length) return;
      index = (index - 1 + loaded.length) % loaded.length;
      renderSlide();
    });

    nextBtn.addEventListener('click', () => {
      if (!loaded.length) return;
      index = (index + 1) % loaded.length;
      renderSlide();
    });
  }

  /* ---- 🎁 REGALO ---------------------------------------------------------- */

  function renderRegalo(body) {
    const content = (window.AMARIS_CONTENT && window.AMARIS_CONTENT.regalo) || {};
    body.classList.add('content-regalo');

    const wrap = document.createElement('div');
    wrap.className = 'gift-scene';

    const title = document.createElement('h2');
    title.className = 'zone-title';
    title.textContent = '🎁 Un regalito';

    const box = document.createElement('button');
    box.type = 'button';
    box.className = 'gift-box';
    box.setAttribute('aria-label', 'Abrir regalo');
    box.innerHTML =
      '<span class="gift-lid"></span>' +
      '<span class="gift-glow"></span>' +
      '<span class="gift-body"></span>' +
      '<span class="gift-ribbon-v"></span>' +
      '<span class="gift-ribbon-h"></span>';

    const hint = document.createElement('p');
    hint.className = 'gift-hint';
    hint.textContent = 'Toca la caja';

    const message = document.createElement('p');
    message.className = 'gift-message';
    message.id = 'giftMessage';
    message.textContent = content.mensaje || '';

    wrap.appendChild(title);
    wrap.appendChild(box);
    wrap.appendChild(hint);
    wrap.appendChild(message);
    body.appendChild(wrap);

    box.addEventListener('click', () => {
      if (box.classList.contains('is-open')) return;
      box.classList.add('is-open');
      box.disabled = true;
      hint.classList.add('is-hidden');
      window.setTimeout(() => {
        message.classList.add('is-visible');
      }, prefersReducedMotion ? 100 : 450);
    });
  }

  /* ---- 🎵 MÚSICA — reproductor global y persistente -------------------------
     El audio vive en <audio id="bgAudio"> (fuera de las pantallas), así que
     sigue sonando sin importar a qué zona o pantalla se navegue. La barra
     inferior (#miniPlayer) es el control de siempre-visible; el apartado
     "Música" del mundo muestra además la lista completa para elegir canción. */

  const musicPlaylist =
    (window.AMARIS_CONTENT && window.AMARIS_CONTENT.musica && window.AMARIS_CONTENT.musica.playlist) || [];
  let currentTrackIndex = 0;
  let musicLoadErrors = 0;

  function getAudioEl() {
    return document.getElementById('bgAudio');
  }

  function initMusicPlayer() {
    const audio = getAudioEl();
    if (!audio || !musicPlaylist.length) return;

    audio.volume = 0.7;

    audio.addEventListener('play', syncMusicUI);
    audio.addEventListener('pause', syncMusicUI);
    audio.addEventListener('ended', () => nextTrack(true));
    audio.addEventListener('error', () => {
      // Si una canción no carga, salta a la siguiente automáticamente
      // (con un límite para no dar vueltas infinitas si faltan todos los archivos).
      musicLoadErrors += 1;
      if (musicLoadErrors < musicPlaylist.length) {
        nextTrack(false);
      }
    });

    audio.src = musicPlaylist[0].src;

    const miniPlayBtn = document.getElementById('miniPlayBtn');
    const miniNextBtn = document.getElementById('miniNextBtn');
    const miniPrevBtn = document.getElementById('miniPrevBtn');
    if (miniPlayBtn) miniPlayBtn.addEventListener('click', playPauseToggle);
    if (miniNextBtn) miniNextBtn.addEventListener('click', () => nextTrack(true));
    if (miniPrevBtn) miniPrevBtn.addEventListener('click', prevTrack);

    syncMusicUI();
  }

  function showMiniPlayer() {
    if (!musicPlaylist.length) return;
    const miniPlayer = document.getElementById('miniPlayer');
    if (!miniPlayer) return;
    miniPlayer.setAttribute('aria-hidden', 'false');
    miniPlayer.classList.add('is-visible');
    document.body.classList.add('has-mini-player');
  }

  function loadTrack(index, autoplay) {
    const audio = getAudioEl();
    if (!audio || !musicPlaylist.length) return;

    currentTrackIndex = ((index % musicPlaylist.length) + musicPlaylist.length) % musicPlaylist.length;
    musicLoadErrors = 0;
    audio.src = musicPlaylist[currentTrackIndex].src;

    if (autoplay) {
      audio.play().catch(syncMusicUI);
    }

    syncMusicUI();
  }

  // Arranca la música justo al presionar "ENTRAR" (gesto del usuario),
  // que es el momento correcto para que Chrome/Safari permitan el autoplay
  // con sonido. Si por lo que sea el navegador la bloquea igual, no rompe
  // nada: el mini-player queda visible y listo para tocar play a mano.
  function startBackgroundMusic() {
    const audio = getAudioEl();
    if (!audio || !musicPlaylist.length) return;

    if (!audio.src) {
      loadTrack(currentTrackIndex, true);
    } else if (audio.paused) {
      audio.play().catch(syncMusicUI);
    }
  }

  function playPauseToggle() {
    const audio = getAudioEl();
    if (!audio || !musicPlaylist.length) return;
    if (!audio.src) {
      loadTrack(currentTrackIndex, true);
      return;
    }
    if (audio.paused) {
      audio.play().catch(syncMusicUI);
    } else {
      audio.pause();
    }
  }

  function nextTrack(autoplay) {
    loadTrack(currentTrackIndex + 1, !!autoplay);
  }

  function prevTrack() {
    const audio = getAudioEl();
    const wasPlaying = !!(audio && !audio.paused);
    loadTrack(currentTrackIndex - 1, wasPlaying);
  }

  function selectTrack(index) {
    if (index === currentTrackIndex) {
      playPauseToggle();
      return;
    }
    loadTrack(index, true);
  }

  // Mantiene sincronizados la barra inferior y (si está abierta) la lista
  // dentro del apartado Música, cada vez que cambia el estado de reproducción.
  function syncMusicUI() {
    const audio = getAudioEl();
    const isPlaying = !!(audio && !audio.paused && !audio.ended);
    const track = musicPlaylist[currentTrackIndex];

    const miniPlayer = document.getElementById('miniPlayer');
    const miniTrack = document.getElementById('miniPlayerTrack');
    const miniBtn = document.getElementById('miniPlayBtn');
    if (miniPlayer) miniPlayer.classList.toggle('is-playing', isPlaying);
    if (miniTrack) miniTrack.textContent = track ? track.titulo : 'Agrega canciones en assets/music/';
    if (miniBtn) {
      miniBtn.textContent = isPlaying ? '⏸' : '▶';
      miniBtn.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproducir');
    }

    const zoneVinyl = document.getElementById('zoneVinyl');
    const zonePlayBtn = document.getElementById('zonePlayPauseBtn');
    const nowPlaying = document.getElementById('nowPlayingTitle');
    if (zoneVinyl) zoneVinyl.classList.toggle('is-spinning', isPlaying);
    if (zonePlayBtn) {
      zonePlayBtn.textContent = isPlaying ? '⏸' : '▶';
      zonePlayBtn.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproducir');
    }
    if (nowPlaying) nowPlaying.textContent = track ? track.titulo : '';

    document.querySelectorAll('.playlist-row').forEach((row) => {
      const isActive = Number(row.dataset.index) === currentTrackIndex;
      row.classList.toggle('is-active', isActive);
      const icon = row.querySelector('.playlist-row-icon');
      if (icon) icon.textContent = isActive && isPlaying ? '⏸' : '▶';
    });
  }

  function renderMusica(body) {
    const content = (window.AMARIS_CONTENT && window.AMARIS_CONTENT.musica) || {};
    body.classList.add('content-musica');

    const wrap = document.createElement('div');
    wrap.className = 'music-player';

    const title = document.createElement('h2');
    title.className = 'zone-title';
    title.textContent = `🎵 ${content.titulo || 'Nuestra playlist'}`;
    wrap.appendChild(title);

    if (!musicPlaylist.length) {
      const hint = document.createElement('p');
      hint.className = 'music-hint';
      hint.textContent = 'Agrega tus canciones en assets/music/ (edita data/content.js) para activar el reproductor.';
      wrap.appendChild(hint);
      body.appendChild(wrap);
      return;
    }

    const vinyl = document.createElement('div');
    vinyl.className = 'vinyl';
    vinyl.id = 'zoneVinyl';
    vinyl.setAttribute('aria-hidden', 'true');

    const nowPlaying = document.createElement('p');
    nowPlaying.className = 'now-playing-title';
    nowPlaying.id = 'nowPlayingTitle';

    const controls = document.createElement('div');
    controls.className = 'music-controls';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'music-btn';
    prevBtn.setAttribute('aria-label', 'Anterior');
    prevBtn.textContent = '⏮';
    prevBtn.addEventListener('click', prevTrack);

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'music-btn music-btn--play';
    playBtn.id = 'zonePlayPauseBtn';
    playBtn.textContent = '▶';
    playBtn.setAttribute('aria-label', 'Reproducir');
    playBtn.addEventListener('click', playPauseToggle);

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'music-btn';
    nextBtn.setAttribute('aria-label', 'Siguiente');
    nextBtn.textContent = '⏭';
    nextBtn.addEventListener('click', () => nextTrack(true));

    controls.appendChild(prevBtn);
    controls.appendChild(playBtn);
    controls.appendChild(nextBtn);

    const volume = document.createElement('input');
    volume.type = 'range';
    volume.className = 'volume-range';
    volume.min = '0';
    volume.max = '1';
    volume.step = '0.01';
    const audioForVolume = getAudioEl();
    volume.value = String(audioForVolume ? audioForVolume.volume : 0.7);
    volume.setAttribute('aria-label', 'Volumen');
    volume.addEventListener('input', () => {
      const audio = getAudioEl();
      if (audio) audio.volume = Number(volume.value);
    });

    const list = document.createElement('ul');
    list.className = 'playlist';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Lista de canciones');

    musicPlaylist.forEach((track, index) => {
      const li = document.createElement('li');

      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'playlist-row';
      row.dataset.index = String(index);
      row.setAttribute('role', 'option');
      row.setAttribute('aria-label', track.titulo);

      const icon = document.createElement('span');
      icon.className = 'playlist-row-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '▶';

      const label = document.createElement('span');
      label.className = 'playlist-row-title';
      label.textContent = track.titulo;

      row.appendChild(icon);
      row.appendChild(label);
      row.addEventListener('click', () => selectTrack(index));

      li.appendChild(row);
      list.appendChild(li);
    });

    wrap.appendChild(vinyl);
    wrap.appendChild(nowPlaying);
    wrap.appendChild(controls);
    wrap.appendChild(volume);
    wrap.appendChild(list);
    body.appendChild(wrap);

    syncMusicUI();
  }

  /* ------------------------------------------------------------------ */
  /* 7) ⭐ Sorpresa final — escena cinematográfica de cierre              */
  /* ------------------------------------------------------------------ */

  function createSurpriseStars(count) {
    const layer = document.getElementById('surpriseStars');
    if (!layer || layer.dataset.rendered === 'true') return;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.className = 'surprise-star';

      const size = (Math.random() * 2 + 1).toFixed(2);
      const top = (Math.random() * 100).toFixed(2);
      const left = (Math.random() * 100).toFixed(2);
      const duration = (Math.random() * 3 + 2.5).toFixed(2);
      const delay = (Math.random() * 3).toFixed(2);

      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.top = `${top}%`;
      star.style.left = `${left}%`;
      star.style.setProperty('--dur', `${duration}s`);
      star.style.setProperty('--delay', `${delay}s`);

      fragment.appendChild(star);
    }

    layer.appendChild(fragment);
    layer.dataset.rendered = 'true';
  }

  function enterSurprise() {
    const worldScreen = document.getElementById('worldScreen');
    const surpriseScreen = document.getElementById('surpriseScreen');
    const nameEl = document.getElementById('surpriseName');
    const messageEl = document.getElementById('surpriseMessage');
    if (!worldScreen || !surpriseScreen || !nameEl || !messageEl) return;

    const content = (window.AMARIS_CONTENT && window.AMARIS_CONTENT.sorpresa) || {};
    const nombre = (window.AMARIS_CONTENT && window.AMARIS_CONTENT.nombre) || '';

    nameEl.textContent = nombre;
    messageEl.textContent = content.mensaje || '';

    createSurpriseStars(40);

    worldScreen.setAttribute('aria-hidden', 'true');
    surpriseScreen.setAttribute('aria-hidden', 'false');
    surpriseScreen.setAttribute('tabindex', '-1');
    surpriseScreen.focus({ preventScroll: true });
  }

  function exitSurprise() {
    const worldScreen = document.getElementById('worldScreen');
    const surpriseScreen = document.getElementById('surpriseScreen');
    if (!worldScreen || !surpriseScreen) return;

    surpriseScreen.setAttribute('aria-hidden', 'true');
    worldScreen.setAttribute('aria-hidden', 'false');
    worldScreen.setAttribute('tabindex', '-1');
    worldScreen.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------------ */
  /* Inicialización                                                      */
  /* ------------------------------------------------------------------ */

  document.addEventListener('DOMContentLoaded', () => {
    createStars(36);
    createParticles(prefersReducedMotion ? 0 : 12);

    const enterBtn = document.getElementById('enterBtn');
    if (enterBtn) {
      enterBtn.addEventListener('click', () => {
        startBackgroundMusic();
        goToThreshold();
      });
    }

    const backToWorldBtn = document.getElementById('backToWorldBtn');
    if (backToWorldBtn) backToWorldBtn.addEventListener('click', exitZone);

    const backFromSurpriseBtn = document.getElementById('backFromSurpriseBtn');
    if (backFromSurpriseBtn) backFromSurpriseBtn.addEventListener('click', exitSurprise);

    initMusicPlayer();
  });
})();
