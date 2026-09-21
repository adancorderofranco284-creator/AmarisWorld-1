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
        img.onerror = () => {
          // TEMPORAL: solo para diagnosticar qué rutas de assets/recuerdos/
          // no están cargando. No afecta nada visual ni funcional.
          console.warn('[Recuerdos] No se pudo cargar:', src);
          resolve(false);
        };
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
     "Música" del mundo muestra además la lista completa para elegir canción.

     ORIGEN DE LA PLAYLIST — SIN LÍMITE FIJO DE CANCIONES:
     GitHub Pages / Netlify son hosting estático: el navegador NO puede pedirle
     al servidor "dime qué archivos hay en assets/music/", así que no existe
     forma 100% automática de leer la carpeta en vivo. La solución correcta
     para este tipo de hosting es un "manifiesto": un archivo
     assets/music/manifest.json que simplemente enumera los archivos reales
     que hay en la carpeta. Esta página abre ese manifiesto con fetch() y
     arma la playlist con TODO lo que encuentre ahí, sin ningún tope numérico
     (nada de .slice(0, 12), nada de "if (n > 12)").

     Para generar/actualizar ese manifiesto sin escribir nada a mano, usa el
     archivo generate-manifest.html incluido: se abre en el navegador, eliges
     la carpeta assets/music/ una vez, y descarga un manifest.json con TODAS
     las canciones que haya en ese momento (12, 30, 200, las que sean). Cada
     vez que agregues o quites canciones, repites ese paso de 10 segundos y
     reemplazas el manifest.json — no hay que tocar script.js ni content.js.

     Si por alguna razón manifest.json no existe todavía o no se puede leer,
     se usa como respaldo la lista manual musica.playlist de data/content.js
     (la que ya tenías) para que el reproductor nunca quede roto mientras
     generas tu primer manifiesto. En cuanto exista manifest.json, ese
     respaldo se ignora por completo. */

  const FALLBACK_PLAYLIST =
    (window.AMARIS_CONTENT && window.AMARIS_CONTENT.musica && window.AMARIS_CONTENT.musica.playlist) || [];

  let musicPlaylist = FALLBACK_PLAYLIST;
  let currentTrackIndex = 0;
  let musicLoadErrors = 0;
  let musicReady = false;
  let pendingAutoplay = false;
  const musicReadyListeners = [];

  function onMusicReady(fn) {
    if (musicReady) {
      fn();
    } else {
      musicReadyListeners.push(fn);
    }
  }

  function markMusicReady() {
    musicReady = true;
    while (musicReadyListeners.length) {
      musicReadyListeners.shift()();
    }
  }

  // Convierte un nombre de archivo ("rose-3am-live.mp3") en un título legible
  // ("Rose 3am Live") cuando el manifiesto no trae un título explícito.
  function tituloDesdeArchivo(nombreArchivo) {
    const sinExtension = String(nombreArchivo).replace(/\.[^/.]+$/, '');
    const sinRuta = sinExtension.split('/').pop();
    const conEspacios = sinRuta.replace(/[-_]+/g, ' ').trim();
    return conEspacios.replace(/\b\w/g, (c) => c.toUpperCase()) || sinRuta;
  }

  // Descarga assets/music/manifest.json y arma la playlist con TODAS las
  // canciones que contenga, sin límite alguno. No modifica ni depende de
  // ninguna variable de bg-life.js ni de otras zonas de la página.
  async function loadMusicPlaylist() {
    try {
      const res = await fetch('assets/music/manifest.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`manifest.json respondió ${res.status}`);

      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('manifest.json debe ser un arreglo');

      const fromManifest = data
        .map((entry) => {
          if (typeof entry === 'string') entry = { archivo: entry };
          if (!entry) return null;
          const archivo = entry.archivo || entry.file || entry.nombre || entry.src;
          if (!archivo) return null;
          const src = /^([a-z]+:)?\/\//i.test(archivo) || archivo.includes('/')
            ? archivo
            : `assets/music/${archivo}`;
          const titulo = entry.titulo || entry.title || tituloDesdeArchivo(archivo);
          return { src, titulo };
        })
        .filter(Boolean);

      // TODAS las canciones detectadas en el manifiesto quedan disponibles;
      // no se recorta el arreglo a ningún tamaño máximo.
      if (fromManifest.length) {
        musicPlaylist = fromManifest;
      }
    } catch (err) {
      // Sin manifest.json todavía (o con un error de formato): seguimos con
      // la lista de respaldo de content.js para no romper el reproductor.
      console.warn('[Música] Usando lista de respaldo (sin manifest.json todavía):', err.message);
    }
  }

  /* ---- 🌙 Identidad del reproductor "Amaris World" -------------------------
     Estos valores son lo ÚNICO que hay que tocar si algún día quieres
     cambiar el nombre, la dedicatoria o el archivo de la portada.

     La portada se busca en assets/ probando estas extensiones en orden; se
     usa la primera que exista realmente, así que basta con guardar la
     imagen de Felipe como assets/felipe.jpg (o .png / .webp). */

  const PLAYER_BRAND = 'Amaris World';
  const PLAYER_DEDICATION = 'Mi sueño feliz, Raulito 🌙✨🤍';
  const PLAYER_COVER_CANDIDATES = [
    'assets/felipe.jpg',
    'assets/felipe.jpeg',
    'assets/felipe.png',
    'assets/felipe.webp'
  ];

  // Clave de localStorage donde se recuerda la canción, la posición y el volumen.
  const MUSIC_STORAGE_KEY = 'amaris-world-player-v1';

  let playerCoverSrc = null;   // ruta real de la portada, una vez confirmada
  let pendingResumeTime = 0;   // segundos a restaurar en cuanto cargue el audio
  let lastStateSave = 0;
  let isScrubbingProgress = false; // true mientras el usuario arrastra la barra de progreso

  function getAudioEl() {
    return document.getElementById('bgAudio');
  }

  /* ---- Memoria del reproductor (localStorage, siempre a prueba de fallos) --- */

  function readMusicState() {
    try {
      const raw = window.localStorage.getItem(MUSIC_STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && typeof data === 'object' ? data : null;
    } catch (err) {
      return null; // modo privado / almacenamiento bloqueado: seguimos igual
    }
  }

  function saveMusicState(force) {
    const audio = getAudioEl();
    if (!audio) return;

    const now = Date.now();
    if (!force && now - lastStateSave < 2000) return; // no escribimos en cada tick
    lastStateSave = now;

    try {
      const track = musicPlaylist[currentTrackIndex];
      window.localStorage.setItem(
        MUSIC_STORAGE_KEY,
        JSON.stringify({
          index: currentTrackIndex,
          src: track ? track.src : null,
          titulo: track ? track.titulo : null,
          position: Number.isFinite(audio.currentTime) ? Math.max(0, Math.floor(audio.currentTime)) : 0,
          volume: Number.isFinite(audio.volume) ? audio.volume : 0.7,
          updatedAt: now
        })
      );
    } catch (err) {
      /* sin almacenamiento disponible: no pasa nada */
    }
  }

  /* ---- Portada (logo de Felipe) -------------------------------------------- */

  function resolvePlayerCover(callback) {
    let i = 0;
    (function tryNext() {
      if (i >= PLAYER_COVER_CANDIDATES.length) {
        callback(null); // no se encontró la imagen: el reproductor sigue funcionando
        return;
      }
      const candidate = PLAYER_COVER_CANDIDATES[i++];
      const probe = new Image();
      probe.onload = function () { callback(candidate); };
      probe.onerror = tryNext;
      probe.src = candidate;
    })();
  }

  function initPlayerCover() {
    const img = document.getElementById('miniPlayerCover');
    resolvePlayerCover(function (src) {
      if (!src) return;
      playerCoverSrc = src;
      if (img) {
        img.src = src;
        img.classList.add('is-loaded');
      }
      updateMediaSessionMetadata(); // ya con artwork real
    });
  }

  function absoluteUrl(path) {
    try {
      return new URL(path, window.location.href).href;
    } catch (err) {
      return path;
    }
  }

  /* ---- Media Session — reproductor del celular / pantalla bloqueada --------
     Solo se usa si el navegador la soporta; en los que no, todo lo demás
     funciona exactamente igual que antes. */

  function mediaSessionArtwork() {
    if (!playerCoverSrc) return [];
    const url = absoluteUrl(playerCoverSrc);
    const type = /\.png$/i.test(playerCoverSrc)
      ? 'image/png'
      : /\.webp$/i.test(playerCoverSrc)
        ? 'image/webp'
        : 'image/jpeg';
    // La misma imagen declarada en varios tamaños: Android/iOS eligen el que
    // necesiten sin tener que generar copias del archivo.
    return ['96x96', '128x128', '192x192', '256x256', '384x384', '512x512'].map(function (sizes) {
      return { src: url, sizes: sizes, type: type };
    });
  }

  function updateMediaSessionMetadata() {
    if (!('mediaSession' in navigator) || typeof window.MediaMetadata !== 'function') return;
    const track = musicPlaylist[currentTrackIndex];
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: PLAYER_BRAND,
        artist: PLAYER_DEDICATION,
        album: track ? track.titulo : PLAYER_BRAND,
        artwork: mediaSessionArtwork()
      });
    } catch (err) {
      /* metadata no soportada: se ignora */
    }
  }

  function setMediaSessionHandlers() {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setActionHandler) return;

    const handlers = {
      play: function () {
        const audio = getAudioEl();
        if (!audio) return;
        if (!audio.src) { loadTrack(currentTrackIndex, true); return; }
        audio.play().catch(syncMusicUI);
      },
      pause: function () {
        const audio = getAudioEl();
        if (audio) audio.pause();
      },
      previoustrack: function () { prevTrack(); },
      nexttrack: function () { nextTrack(true); },
      seekbackward: function (details) {
        const audio = getAudioEl();
        if (!audio) return;
        const offset = (details && details.seekOffset) || 10;
        audio.currentTime = Math.max(0, audio.currentTime - offset);
        updateMediaSessionPosition();
      },
      seekforward: function (details) {
        const audio = getAudioEl();
        if (!audio) return;
        const offset = (details && details.seekOffset) || 10;
        const max = Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + offset;
        audio.currentTime = Math.min(max, audio.currentTime + offset);
        updateMediaSessionPosition();
      },
      seekto: function (details) {
        const audio = getAudioEl();
        if (!audio || !details || details.seekTime == null) return;
        audio.currentTime = details.seekTime;
        updateMediaSessionPosition();
      },
      stop: function () {
        const audio = getAudioEl();
        if (audio) audio.pause();
      }
    };

    Object.keys(handlers).forEach(function (action) {
      try {
        navigator.mediaSession.setActionHandler(action, handlers[action]);
      } catch (err) {
        /* acción no soportada por este navegador: se omite sin romper nada */
      }
    });
  }

  function updateMediaSessionPosition() {
    if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return;
    const audio = getAudioEl();
    if (!audio) return;
    const duration = audio.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: audio.playbackRate > 0 ? audio.playbackRate : 1,
        position: Math.min(Math.max(audio.currentTime, 0), duration)
      });
    } catch (err) {
      /* posición no soportada: se ignora */
    }
  }

  // Se ejecuta UNA sola vez al cargar la página: engancha los botones fijos
  // de la barra inferior. No depende de cuántas canciones haya.
  function bindMiniPlayerControls() {
    const miniPlayBtn = document.getElementById('miniPlayBtn');
    const miniNextBtn = document.getElementById('miniNextBtn');
    const miniPrevBtn = document.getElementById('miniPrevBtn');
    if (miniPlayBtn) miniPlayBtn.addEventListener('click', playPauseToggle);
    if (miniNextBtn) miniNextBtn.addEventListener('click', () => nextTrack(true));
    if (miniPrevBtn) miniPrevBtn.addEventListener('click', prevTrack);
  }

  // Escribe PLAYER_BRAND / PLAYER_DEDICATION en el mini-player (los mismos
  // valores que ya se usaban solo para la pantalla de bloqueo). Se llama una
  // sola vez; el texto no cambia con la canción.
  function initPlayerIdentity() {
    const brandEl = document.querySelector('.mini-player-brand');
    const dedicationEl = document.querySelector('.mini-player-dedication');
    if (brandEl) brandEl.textContent = PLAYER_BRAND;
    if (dedicationEl) dedicationEl.textContent = PLAYER_DEDICATION;
  }

  // "125" -> "2:05". Usado por la barra de progreso de la Music Box.
  function formatPlayerTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const total = Math.floor(seconds);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  // Sincroniza la barra de progreso + los tiempos de la zona "Música".
  // No hace nada si esos elementos no están en el DOM en este momento
  // (por ejemplo, si el usuario está en otra zona) — mismo patrón
  // defensivo que ya usa syncMusicUI() con getElementById.
  function updateProgressUI() {
    const audio = getAudioEl();
    if (!audio) return;
    const range = document.getElementById('zoneProgressRange');
    const curEl = document.getElementById('zoneTimeCurrent');
    const totEl = document.getElementById('zoneTimeTotal');
    const duration = audio.duration;
    const hasDuration = Number.isFinite(duration) && duration > 0;

    if (range && !isScrubbingProgress) {
      range.value = hasDuration ? String((audio.currentTime / duration) * 100) : '0';
    }
    if (curEl) curEl.textContent = formatPlayerTime(audio.currentTime);
    if (totEl) totEl.textContent = hasDuration ? formatPlayerTime(duration) : '0:00';
  }

  // Barra de título estilo "ventana retro" para la Music Box. El botón "×"
  // reutiliza exitZone() (la misma función del botón "← VOLVER AL MUNDO"),
  // así que cerrar la ventana simplemente vuelve al mundo. "_" y "□" son
  // decorativos: no hay un gestor de ventanas real que minimizar/maximizar.
  function createMusicBoxTitlebar() {
    const titlebar = document.createElement('div');
    titlebar.className = 'music-box-titlebar';

    const icon = document.createElement('span');
    icon.className = 'music-box-titlebar-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '🎵';

    const text = document.createElement('span');
    text.className = 'music-box-titlebar-text';
    text.textContent = 'Music Box';

    const actions = document.createElement('span');
    actions.className = 'music-box-titlebar-actions';

    const minDot = document.createElement('span');
    minDot.className = 'music-box-dot';
    minDot.setAttribute('aria-hidden', 'true');
    minDot.textContent = '_';

    const maxDot = document.createElement('span');
    maxDot.className = 'music-box-dot';
    maxDot.setAttribute('aria-hidden', 'true');
    maxDot.textContent = '□';

    const closeDot = document.createElement('button');
    closeDot.type = 'button';
    closeDot.className = 'music-box-dot music-box-dot--close';
    closeDot.textContent = '×';
    closeDot.setAttribute('aria-label', 'Volver al mundo');
    closeDot.addEventListener('click', exitZone);

    actions.appendChild(minDot);
    actions.appendChild(maxDot);
    actions.appendChild(closeDot);

    titlebar.appendChild(icon);
    titlebar.appendChild(text);
    titlebar.appendChild(actions);
    return titlebar;
  }

  // Se ejecuta cuando la playlist (manifest.json o respaldo) ya está lista.
  function initMusicPlayer() {
    const audio = getAudioEl();
    if (!audio || !musicPlaylist.length) {
      markMusicReady();
      return;
    }

    const savedState = readMusicState();

    // Volumen recordado de la visita anterior (si lo hubiera).
    audio.volume =
      savedState && Number.isFinite(savedState.volume)
        ? Math.min(1, Math.max(0, savedState.volume))
        : 0.7;

    audio.addEventListener('play', syncMusicUI);
    audio.addEventListener('pause', syncMusicUI);
    audio.addEventListener('ended', () => nextTrack(true));

    // Al cargar la canción, retomamos la posición guardada (una sola vez).
    audio.addEventListener('loadedmetadata', () => {
      if (pendingResumeTime > 0 && Number.isFinite(audio.duration)) {
        try {
          audio.currentTime = Math.min(pendingResumeTime, Math.max(0, audio.duration - 1));
        } catch (err) {
          /* algunos navegadores no permiten buscar antes de reproducir */
        }
      }
      pendingResumeTime = 0;
      updateMediaSessionPosition();
      updateProgressUI();
    });

    // Guardado periódico de la posición + posición para la pantalla bloqueada
    // + barra de progreso de la Music Box (no hace nada si no está visible).
    audio.addEventListener('timeupdate', () => {
      saveMusicState(false);
      updateMediaSessionPosition();
      updateProgressUI();
    });
    audio.addEventListener('volumechange', () => saveMusicState(true));
    window.addEventListener('pagehide', () => saveMusicState(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') saveMusicState(true);
    });
    audio.addEventListener('error', () => {
      // Si una canción no carga, salta a la siguiente automáticamente.
      // El límite aquí es SOLO para no dar vueltas infinitas si faltan
      // todos los archivos de audio; se ajusta solo al tamaño real de la
      // playlist (musicPlaylist.length), sea cual sea ese tamaño.
      musicLoadErrors += 1;
      if (musicLoadErrors < musicPlaylist.length) {
        nextTrack(false);
      }
    });

    // Recuperamos la canción donde se quedó: primero se busca por ruta (por
    // si cambió el orden del manifiesto) y, si no aparece, por índice.
    let startIndex = 0;
    if (savedState) {
      const bySrc = musicPlaylist.findIndex((t) => t.src === savedState.src);
      if (bySrc >= 0) {
        startIndex = bySrc;
      } else if (Number.isInteger(savedState.index) && savedState.index >= 0 && savedState.index < musicPlaylist.length) {
        startIndex = savedState.index;
      }
      if (Number.isFinite(savedState.position) && savedState.position > 3) {
        pendingResumeTime = savedState.position;
      }
    }

    currentTrackIndex = startIndex;
    audio.src = musicPlaylist[currentTrackIndex].src;

    // IMPORTANTE: no se fuerza ningún autoplay aquí. La música solo arranca
    // con un gesto del usuario (botón ENTRAR o play), como exigen iOS/Android.

    setMediaSessionHandlers();
    updateMediaSessionMetadata();
    initPlayerCover();
    initPlayerIdentity();

    markMusicReady();
    syncMusicUI();
  }

  function showMiniPlayer() {
    // Si el manifiesto todavía se está leyendo, esperamos a que esté listo
    // antes de decidir si hay canciones que mostrar (onMusicReady ejecuta
    // de inmediato si ya está listo, así que en el caso normal no hay
    // ningún retraso perceptible).
    onMusicReady(() => {
      if (!musicPlaylist.length) return;
      const miniPlayer = document.getElementById('miniPlayer');
      if (!miniPlayer) return;
      miniPlayer.setAttribute('aria-hidden', 'false');
      miniPlayer.classList.add('is-visible');
      document.body.classList.add('has-mini-player');
    });
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

    updateMediaSessionMetadata();
    saveMusicState(true);
    syncMusicUI();
  }

  // Arranca la música justo al presionar "ENTRAR" (gesto del usuario),
  // que es el momento correcto para que Chrome/Safari permitan el autoplay
  // con sonido. Si por lo que sea el navegador la bloquea igual, no rompe
  // nada: el mini-player queda visible y listo para tocar play a mano.
  function startBackgroundMusic() {
    if (!musicReady) {
      // El manifiesto (o el respaldo) todavía se está leyendo: recordamos
      // que hay que reproducir en cuanto esté listo, en vez de perder el
      // gesto de clic del usuario (necesario para el autoplay con sonido).
      pendingAutoplay = true;
      return;
    }

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

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      } catch (err) {
        /* no soportado: se ignora */
      }
    }

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

    updateProgressUI();
  }

  function renderMusica(body) {
    const content = (window.AMARIS_CONTENT && window.AMARIS_CONTENT.musica) || {};
    body.classList.add('content-musica');

    const title = document.createElement('h2');
    title.className = 'zone-title';
    title.textContent = `🎵 ${content.titulo || 'Nuestra playlist'}`;
    body.appendChild(title);

    // "music-box" es la carcasa visual nueva (ventana retro pixel-art);
    // "music-player" se conserva por si algún estilo anterior lo usaba.
    const wrap = document.createElement('div');
    wrap.className = 'music-player music-box';
    wrap.appendChild(createMusicBoxTitlebar());

    if (!musicReady) {
      // El manifest.json (o el respaldo) todavía se está leyendo. En cuanto
      // esté listo, si el usuario sigue en esta misma zona, se vuelve a
      // dibujar automáticamente con la playlist completa.
      const screen = document.createElement('div');
      screen.className = 'music-box-screen';
      const loading = document.createElement('p');
      loading.className = 'music-hint';
      loading.textContent = 'Cargando canciones…';
      screen.appendChild(loading);
      wrap.appendChild(screen);
      body.appendChild(wrap);
      onMusicReady(() => {
        // Si el usuario ya cambió de zona, "wrap" fue eliminado del DOM al
        // vaciarse #zoneBody (populateZoneContent hace body.innerHTML = '').
        // Solo volvemos a dibujar si esta vista sigue siendo la visible.
        if (wrap.isConnected) {
          body.innerHTML = '';
          renderMusica(body);
        }
      });
      return;
    }

    if (!musicPlaylist.length) {
      const screen = document.createElement('div');
      screen.className = 'music-box-screen';
      const hint = document.createElement('p');
      hint.className = 'music-hint';
      hint.textContent =
        'No se encontraron canciones. Genera assets/music/manifest.json con generate-manifest.html (o agrega canciones en data/content.js como respaldo).';
      screen.appendChild(hint);
      wrap.appendChild(screen);
      body.appendChild(wrap);
      return;
    }

    // ---- "Pantalla" de la Music Box: tocadiscos + pista actual -------------
    const screen = document.createElement('div');
    screen.className = 'music-box-screen';

    const vinyl = document.createElement('div');
    vinyl.className = 'vinyl';
    vinyl.id = 'zoneVinyl';
    vinyl.setAttribute('aria-hidden', 'true');

    const nowPlayingWrap = document.createElement('div');
    nowPlayingWrap.className = 'music-box-nowplaying';

    const nowPlaying = document.createElement('p');
    nowPlaying.className = 'now-playing-title';
    nowPlaying.id = 'nowPlayingTitle';

    const nowArtist = document.createElement('p');
    nowArtist.className = 'now-playing-artist';
    nowArtist.id = 'nowPlayingArtist';
    nowArtist.textContent = PLAYER_BRAND;

    nowPlayingWrap.appendChild(nowPlaying);
    nowPlayingWrap.appendChild(nowArtist);
    screen.appendChild(vinyl);
    screen.appendChild(nowPlayingWrap);
    wrap.appendChild(screen);

    // ---- Barra de progreso (nueva) ------------------------------------------
    // Se guarda en porcentaje (0-100) para no depender de conocer la
    // duración por adelantado. "input" solo actualiza el número en
    // pantalla mientras se arrastra; "change" (al soltar) es lo que
    // realmente mueve audio.currentTime, para no perseguir cada pixel
    // mientras el usuario arrastra el dedo en móvil.
    const progressRow = document.createElement('div');
    progressRow.className = 'progress-row';

    const timeCurrent = document.createElement('span');
    timeCurrent.className = 'progress-time';
    timeCurrent.id = 'zoneTimeCurrent';
    timeCurrent.textContent = '0:00';

    const progressRange = document.createElement('input');
    progressRange.type = 'range';
    progressRange.className = 'progress-range';
    progressRange.id = 'zoneProgressRange';
    progressRange.min = '0';
    progressRange.max = '100';
    progressRange.step = '0.1';
    progressRange.value = '0';
    progressRange.setAttribute('aria-label', 'Progreso de la canción');

    const timeTotal = document.createElement('span');
    timeTotal.className = 'progress-time';
    timeTotal.id = 'zoneTimeTotal';
    timeTotal.textContent = '0:00';

    progressRange.addEventListener('input', () => {
      isScrubbingProgress = true;
      const audio = getAudioEl();
      if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
        timeCurrent.textContent = formatPlayerTime((Number(progressRange.value) / 100) * audio.duration);
      }
    });
    progressRange.addEventListener('change', () => {
      const audio = getAudioEl();
      if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = (Number(progressRange.value) / 100) * audio.duration;
        saveMusicState(true);
      }
      isScrubbingProgress = false;
    });

    progressRow.appendChild(timeCurrent);
    progressRow.appendChild(progressRange);
    progressRow.appendChild(timeTotal);
    wrap.appendChild(progressRow);

    // ---- Controles: anterior / play-pausa / siguiente (sin cambios) -------
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
    wrap.appendChild(controls);

    // ---- Volumen (misma lógica de antes, con icono) ------------------------
    const volumeRow = document.createElement('div');
    volumeRow.className = 'volume-row';

    const volumeIcon = document.createElement('span');
    volumeIcon.className = 'volume-icon';
    volumeIcon.setAttribute('aria-hidden', 'true');
    volumeIcon.textContent = '🔊';

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
      saveMusicState(true);
    });

    volumeRow.appendChild(volumeIcon);
    volumeRow.appendChild(volume);
    wrap.appendChild(volumeRow);

    // ---- Playlist (misma lógica de selección, + etiqueta de artista) ------
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

      const textWrap = document.createElement('span');
      textWrap.className = 'playlist-row-text';

      const label = document.createElement('span');
      label.className = 'playlist-row-title';
      label.textContent = track.titulo;

      const artistLabel = document.createElement('span');
      artistLabel.className = 'playlist-row-artist';
      artistLabel.textContent = PLAYER_BRAND;

      textWrap.appendChild(label);
      textWrap.appendChild(artistLabel);

      row.appendChild(icon);
      row.appendChild(textWrap);
      row.addEventListener('click', () => selectTrack(index));

      li.appendChild(row);
      list.appendChild(li);
    });

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

    // Los botones de la barra inferior se enganchan de inmediato; la
    // playlist (manifest.json o respaldo) se resuelve aparte, sin bloquear
    // el resto de la página.
    bindMiniPlayerControls();
    loadMusicPlaylist().then(() => {
      initMusicPlayer();
      if (pendingAutoplay) {
        pendingAutoplay = false;
        startBackgroundMusic();
      }
    });
  });
})();
