/* ==========================================================================
   AMARIS WORLD — piano-game.js
   Minijuego de ritmo "AMARIS PIANO". Módulo 100% independiente:
   no lee ni modifica ninguna variable/función de script.js ni bg-life.js.
   Construye su propia capa (overlay) sobre <body> cuando se abre, y la
   oculta al cerrar — el mundo principal queda intacto debajo.

   API pública:
     window.AmarisPiano.open()   → abre el juego (pantalla de inicio)
     window.AmarisPiano.close()  → cierra el juego, vuelve al mundo
     window.AmarisPiano.start()  → comienza la partida
     window.AmarisPiano.reset()  → reinicia puntuación y vuelve a start()

   Extra (no rompe la API pedida, solo la complementa):
     window.AmarisPiano.setChart(chart) → usa un chart fijo en vez de
       generación automática. chart = [{ time, lane, friend }, ...]
       time en ms desde el inicio de la partida. Tiene prioridad sobre
       cualquier chart definido dentro de PIANO_SONGS (ver abajo).
     window.AmarisPiano.setSong(id) → cambia la canción activa antes de
       abrir/empezar la partida. id debe existir en PIANO_SONGS.

   PUNTO DE ENTRADA (SORPRESA):
     Este módulo también engancha, si existe en el DOM, el botón
     #surprisePianoBtn (la tarjeta "🎹 AMARIS PIANO" dentro de la
     pantalla #surpriseScreen de index.html) para abrir el juego. Si ese
     botón no existe todavía o cambia de id, esto simplemente no hace
     nada — no rompe el resto del módulo ni de la página.

   SISTEMA DE MÚSICA (assets/piano-music/):
     PIANO_SONGS define las canciones disponibles. Al comenzar una
     partida se selecciona la canción activa (por defecto la primera de
     la lista, o la fijada con setSong()), se carga y se reproduce con
     un <audio> propio e independiente del reproductor principal de
     Amaris World (#bgAudio). Si esa canción define su propio arreglo
     "chart", se usa automáticamente para sincronizar las notas; si no,
     se mantiene intacto el generador automático de notas ya existente.
     Si el archivo .mp3 todavía no existe (aún no lo copiaste a
     assets/piano-music/), el juego sigue funcionando igual, sin música
     y con generación automática — nunca se rompe ni se queda colgado.

     Para agregar una canción nueva, solo edita el arreglo PIANO_SONGS
     de más abajo, por ejemplo:
       { id: "cancion-amaris", name: "Canción de Amaris",
         file: "assets/piano-music/cancion-amaris.mp3" }

   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* 1) CONFIGURACIÓN — edita aquí para ajustar el juego                 */
  /* ------------------------------------------------------------------ */

  // 🧑‍🤝‍🧑 Agrega o quita amigos modificando SOLO este arreglo.
  // Las imágenes van en assets/friends/. Si una no carga, el juego usa
  // automáticamente un avatar de respaldo (inicial + color), sin romperse.
  // Cada amigo puede tener una "hitImage": la foto que reemplaza a la
  // normal justo cuando el jugador acierta esa nota. Es opcional — si un
  // amigo no tiene hitImage, su nota simplemente no cambia de imagen al
  // acertar (se comporta exactamente igual que antes).
  var FRIENDS = [
    { id: "amaris", name: "Amaris", image: "assets/friends/amaris.webp" },
    { id: "amigo1", name: "Amigo 1", image: "assets/friends/amigo1.webp", hitImage: "assets/friends/amigo1-hit.webp" },
    { id: "amigo2", name: "Amigo 2", image: "assets/friends/amigo2.webp" },
    { id: "amigo3", name: "Amigo 3", image: "assets/friends/amigo3.webp" },
    { id: "amigo4", name: "Amigo 4", image: "assets/friends/amigo4.webp" }
  ];

  // 🎵 Canciones del piano. Los archivos .mp3 van en assets/piano-music/
  // (tú los colocas manualmente ahí; el juego solo necesita la ruta).
  // Agregar una canción nueva = agregar un objeto más a este arreglo.
  //
  // "chart" es OPCIONAL por canción: si lo defines, esa canción usa esas
  // notas sincronizadas en vez de la generación automática. Formato
  // idéntico al de setChart(): [{ time, lane, friend }, ...] en ms desde
  // el inicio de la canción.
  var PIANO_SONGS = [
    { id: "piano-theme", name: "Piano Theme", file: "assets/piano-music/piano-theme.mp3" },
    { id: "song1", name: "Song 1", file: "assets/piano-music/song1.mp3" }
    // Ejemplo para agregar más:
    // { id: "cancion-amaris", name: "Canción de Amaris", file: "assets/piano-music/cancion-amaris.mp3" }
    // Ejemplo con chart sincronizado propio:
    // {
    //   id: "song2",
    //   name: "Song 2",
    //   file: "assets/piano-music/song2.mp3",
    //   chart: [
    //     { time: 1000, lane: 0, friend: 0 },
    //     { time: 1500, lane: 1, friend: 1 },
    //     { time: 2000, lane: 2, friend: 0 },
    //     { time: 2500, lane: 3, friend: 2 }
    //   ]
    // }
  ];

  // Canción usada por defecto al abrir una partida si nadie llamó a
  // AmarisPiano.setSong(). Cambia este id para cambiar la canción por
  // defecto sin tener que reordenar PIANO_SONGS.
  var DEFAULT_SONG_ID = PIANO_SONGS.length ? PIANO_SONGS[0].id : null;

  function getSongById(id) {
    for (var i = 0; i < PIANO_SONGS.length; i++) {
      if (PIANO_SONGS[i].id === id) return PIANO_SONGS[i];
    }
    return null;
  }

  var CONFIG = {
    lanes: 4,
    laneKeys: ["1", "2", "3", "4"],
    fallDuration: 2200, // ms que tarda una nota en caer desde arriba hasta la línea
    spawnInterval: { min: 650, max: 950 }, // ms entre notas cuando se auto-genera
    gameDuration: 45000, // ms de partida cuando se auto-genera (sin chart)
    hitWindow: { perfect: 70, great: 140 }, // ms, configurable
    scoring: { perfect: 100, great: 50 },
    // Frecuencias (Hz) por carril: C4 D4 E4 G4 — sonido simple de piano.
    noteFrequencies: [261.63, 293.66, 329.63, 392.0],
    friendAvatarColors: ["#ffb3d9", "#c9a6ff", "#ffe08a", "#8fd6ff", "#ff9a8a"]
  };

  /* ------------------------------------------------------------------ */
  /* 2) ESTADO INTERNO                                                    */
  /* ------------------------------------------------------------------ */

  var state = {
    built: false,
    screen: "start", // 'start' | 'playing' | 'end'
    audioCtx: null,
    rafId: null,
    gameStartTime: 0, // performance.now() al iniciar partida
    lastSpawnTime: 0,
    nextSpawnIn: 0,
    chart: null, // chart efectivo de la partida actual (externo, de la canción, o null = auto-generar)
    externalChart: null, // fijado SOLO por AmarisPiano.setChart(); tiene prioridad sobre el chart de la canción
    chartIndex: 0,
    notes: [], // notas activas en pantalla
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfectCount: 0,
    greatCount: 0,
    missCount: 0,
    laneMetrics: null, // { travelPx } recalculado por carril
    previousActiveElement: null,
    previousHtmlOverflow: "",

    // ---- Música de la partida (independiente del reproductor principal) --
    activeSongId: null, // fijado con AmarisPiano.setSong(); si es null, se usa DEFAULT_SONG_ID
    songAudio: null, // <audio> propio del piano, creado bajo demanda
    songAudioFailed: false, // true si la canción actual no pudo cargar/reproducirse
    mainAudioWasPlaying: false // si #bgAudio (Amaris World) sonaba antes de abrir el piano
  };

  var els = {}; // referencias DOM, pobladas en buildDOM()
  var noteIdSeq = 0;

  /* ------------------------------------------------------------------ */
  /* 3) AUDIO — Web Audio API, sin librerías externas                    */
  /* ------------------------------------------------------------------ */

  function ensureAudioContext() {
    if (state.audioCtx) return state.audioCtx;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    state.audioCtx = new Ctx();
    return state.audioCtx;
  }

  function resumeAudio() {
    var ctx = ensureAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(function () {
        /* silencioso: si el navegador bloquea, el juego sigue sin sonido */
      });
    }
  }

  function playPianoNote(lane) {
    var ctx = ensureAudioContext();
    if (!ctx) return;
    var freq = CONFIG.noteFrequencies[lane] || 329.63;
    var now = ctx.currentTime;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    // Envolvente simple tipo "pluck" de piano: ataque rápido, caída suave.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  /* ------------------------------------------------------------------ */
  /* 3.1) MÚSICA DE LA CANCIÓN — independiente del reproductor principal  */
  /* ------------------------------------------------------------------ */

  function getActiveSong() {
    return getSongById(state.activeSongId) || getSongById(DEFAULT_SONG_ID) || PIANO_SONGS[0] || null;
  }

  function ensureSongAudioEl() {
    if (state.songAudio) return state.songAudio;
    var audio = new Audio();
    audio.preload = "auto";
    audio.loop = false;
    // No usa Web Audio API a propósito: HTMLAudioElement es más simple y
    // suficiente para reproducir un mp3 de fondo, y no interfiere con el
    // AudioContext ya usado para el "ding" de cada nota (playPianoNote).
    state.songAudio = audio;
    return audio;
  }

  function stopSongAudio() {
    if (!state.songAudio) return;
    try {
      state.songAudio.pause();
      state.songAudio.currentTime = 0;
    } catch (e) {
      /* algunos navegadores lanzan si el audio nunca llegó a cargar; se ignora */
    }
  }

  // Selecciona la canción activa, la carga (si hace falta) y la reproduce.
  // Llama a callback() en cuanto la reproducción arranca de verdad — o, si
  // el archivo no existe/falla/tarda, a los 400ms como resguardo, para que
  // la partida NUNCA se quede esperando indefinidamente a un mp3 ausente.
  function startActiveSongAndThen(callback) {
    var song = getActiveSong();
    state.songAudioFailed = false;

    if (!song) {
      callback();
      return;
    }

    var audio = ensureSongAudioEl();
    var settled = false;
    var fallbackTimer = null;

    function finish() {
      if (settled) return;
      settled = true;
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("error", onError);
      window.clearTimeout(fallbackTimer);
      callback();
    }
    function onPlaying() {
      finish();
    }
    function onError() {
      state.songAudioFailed = true;
      finish();
    }

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("error", onError);

    if (audio.dataset.apLoadedSrc !== song.file) {
      audio.src = song.file;
      audio.dataset.apLoadedSrc = song.file;
    } else {
      try {
        audio.currentTime = 0;
      } catch (e) {
        /* ignorar: algunos navegadores no permiten reasignar currentTime antes de cargar */
      }
    }

    var playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        // Bloqueo de autoplay, archivo ausente, etc.: seguimos sin música.
        state.songAudioFailed = true;
        finish();
      });
    }

    fallbackTimer = window.setTimeout(finish, 400);
  }

  /* ------------------------------------------------------------------ */
  /* 3.2) COORDINACIÓN CON EL REPRODUCTOR PRINCIPAL DE AMARIS WORLD      */
  /* Usa únicamente el elemento público <audio id="bgAudio"> mediante su */
  /* API estándar (pause/play). script.js ya escucha los eventos nativos */
  /* "play"/"pause" de ese audio para refrescar el mini-player, así que  */
  /* NO hace falta tocar script.js: el ícono/estado del mini-player se   */
  /* actualiza solo. Esto es lo único que este módulo toca de fuera de   */
  /* su propio namespace .amaris-piano-* / #amarisPianoOverlay.          */
  /* ------------------------------------------------------------------ */

  function pauseMainWorldAudio() {
    var audio = document.getElementById("bgAudio");
    state.mainAudioWasPlaying = !!(audio && !audio.paused && !audio.ended);
    if (audio && state.mainAudioWasPlaying) {
      try {
        audio.pause();
      } catch (e) {
        /* ignorar */
      }
    }
  }

  function resumeMainWorldAudioIfNeeded() {
    var audio = document.getElementById("bgAudio");
    if (audio && state.mainAudioWasPlaying) {
      var p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(function () {
          /* si el navegador bloquea la reanudación automática, no pasa nada:
             el usuario puede volver a darle play desde el mini-player */
        });
      }
    }
    state.mainAudioWasPlaying = false;
  }

  /* ------------------------------------------------------------------ */
  /* 4) CONSTRUCCIÓN DEL DOM (overlay independiente sobre <body>)        */
  /* ------------------------------------------------------------------ */

  function buildDOM() {
    if (state.built) return;

    var overlay = document.createElement("div");
    overlay.className = "amaris-piano-overlay";
    overlay.id = "amarisPianoOverlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Amaris Piano");

    overlay.innerHTML =
      '<div class="amaris-piano-modal">' +
      '  <button type="button" class="amaris-piano-close" id="apCloseX" aria-label="Cerrar Amaris Piano">✕</button>' +
      '  <div class="amaris-piano-stars" aria-hidden="true"></div>' +

      // ---- Pantalla de inicio ----
      '  <section class="amaris-piano-screen amaris-piano-screen--start" id="apStartScreen">' +
      '    <p class="amaris-piano-eyebrow">🎹 AMARIS PIANO</p>' +
      '    <p class="amaris-piano-tagline">Toca las caras al ritmo</p>' +
      '    <p class="amaris-piano-subtagline">¡No las dejes pasar!</p>' +
      '    <button type="button" class="amaris-piano-btn" id="apStartBtn">COMENZAR</button>' +
      "  </section>" +

      // ---- Pantalla de juego ----
      '  <section class="amaris-piano-screen amaris-piano-screen--game" id="apGameScreen" hidden>' +
      '    <div class="amaris-piano-hud">' +
      '      <div class="amaris-piano-hud-block">' +
      '        <span class="amaris-piano-hud-label">SCORE</span>' +
      '        <span class="amaris-piano-hud-value" id="apScore">0</span>' +
      "      </div>" +
      '      <div class="amaris-piano-hud-block">' +
      '        <span class="amaris-piano-hud-label">COMBO</span>' +
      '        <span class="amaris-piano-hud-value" id="apCombo">x0</span>' +
      "      </div>" +
      "    </div>" +
      '    <div class="amaris-piano-feedback" id="apFeedback" aria-live="polite"></div>' +
      '    <div class="amaris-piano-lanes" id="apLanes">' +
      '      <div class="amaris-piano-lane" data-lane="0"><span class="amaris-piano-lane-glow"></span></div>' +
      '      <div class="amaris-piano-lane" data-lane="1"><span class="amaris-piano-lane-glow"></span></div>' +
      '      <div class="amaris-piano-lane" data-lane="2"><span class="amaris-piano-lane-glow"></span></div>' +
      '      <div class="amaris-piano-lane" data-lane="3"><span class="amaris-piano-lane-glow"></span></div>' +
      '      <div class="amaris-piano-hitline" aria-hidden="true"></div>' +
      "    </div>" +
      "  </section>" +

      // ---- Pantalla final ----
      '  <section class="amaris-piano-screen amaris-piano-screen--end" id="apEndScreen" hidden>' +
      '    <p class="amaris-piano-eyebrow">🎹 AMARIS PIANO</p>' +
      '    <p class="amaris-piano-tagline">¡Terminaste!</p>' +
      '    <div class="amaris-piano-results">' +
      '      <div class="amaris-piano-result-score">' +
      '        <span class="amaris-piano-hud-label">SCORE</span>' +
      '        <span class="amaris-piano-result-value" id="apFinalScore">0</span>' +
      "      </div>" +
      '      <div class="amaris-piano-result-grid">' +
      '        <div><span class="amaris-piano-hud-label">PERFECT</span><span id="apFinalPerfect">0</span></div>' +
      '        <div><span class="amaris-piano-hud-label">GREAT</span><span id="apFinalGreat">0</span></div>' +
      '        <div><span class="amaris-piano-hud-label">MISS</span><span id="apFinalMiss">0</span></div>' +
      '        <div><span class="amaris-piano-hud-label">COMBO MÁXIMO</span><span id="apFinalCombo">0</span></div>' +
      "      </div>" +
      "    </div>" +
      '    <div class="amaris-piano-end-actions">' +
      '      <button type="button" class="amaris-piano-btn" id="apReplayBtn">JUGAR OTRA VEZ</button>' +
      '      <button type="button" class="amaris-piano-btn amaris-piano-btn--ghost" id="apCloseBtn2">CERRAR</button>' +
      "    </div>" +
      "  </section>" +
      "</div>";

    document.body.appendChild(overlay);

    // Estrellas decorativas de fondo (puramente visuales, coherentes con el resto del sitio)
    var starsLayer = overlay.querySelector(".amaris-piano-stars");
    for (var i = 0; i < 24; i++) {
      var s = document.createElement("span");
      s.className = "amaris-piano-bgstar";
      s.style.left = (Math.random() * 100).toFixed(2) + "%";
      s.style.top = (Math.random() * 100).toFixed(2) + "%";
      s.style.setProperty("--dur", (Math.random() * 3 + 2.5).toFixed(2) + "s");
      s.style.setProperty("--delay", (Math.random() * 3).toFixed(2) + "s");
      starsLayer.appendChild(s);
    }

    els.overlay = overlay;
    els.modal = overlay.querySelector(".amaris-piano-modal");
    els.closeX = overlay.querySelector("#apCloseX");
    els.startScreen = overlay.querySelector("#apStartScreen");
    els.startBtn = overlay.querySelector("#apStartBtn");
    els.gameScreen = overlay.querySelector("#apGameScreen");
    els.endScreen = overlay.querySelector("#apEndScreen");
    els.score = overlay.querySelector("#apScore");
    els.combo = overlay.querySelector("#apCombo");
    els.feedback = overlay.querySelector("#apFeedback");
    els.lanesWrap = overlay.querySelector("#apLanes");
    els.lanes = Array.prototype.slice.call(overlay.querySelectorAll(".amaris-piano-lane"));
    els.hitline = overlay.querySelector(".amaris-piano-hitline");
    els.replayBtn = overlay.querySelector("#apReplayBtn");
    els.closeBtn2 = overlay.querySelector("#apCloseBtn2");
    els.finalScore = overlay.querySelector("#apFinalScore");
    els.finalPerfect = overlay.querySelector("#apFinalPerfect");
    els.finalGreat = overlay.querySelector("#apFinalGreat");
    els.finalMiss = overlay.querySelector("#apFinalMiss");
    els.finalCombo = overlay.querySelector("#apFinalCombo");

    bindStaticEvents();
    preloadHitImages();
    state.built = true;
  }

  // Precarga en segundo plano las imágenes de "acierto" de cada amigo, para
  // que el cambio de foto al acertar sea instantáneo (sin esperar a que la
  // imagen se descargue justo en el momento del golpe). Si una hitImage no
  // existe o falla, no rompe nada: simplemente no se precachea.
  function preloadHitImages() {
    FRIENDS.forEach(function (friend) {
      if (friend.hitImage) {
        var pre = new Image();
        pre.src = friend.hitImage;
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* 5) EVENTOS DE INTERFAZ (botones, teclado, carriles)                 */
  /* ------------------------------------------------------------------ */

  function bindStaticEvents() {
    els.closeX.addEventListener("click", closeGame);
    els.closeBtn2.addEventListener("click", closeGame);
    els.startBtn.addEventListener("click", function () {
      resumeAudio();
      startGame();
    });
    els.replayBtn.addEventListener("click", function () {
      resumeAudio();
      resetGame();
      startGame();
    });

    // Click en el fondo oscuro (fuera del modal) también cierra.
    els.overlay.addEventListener("click", function (event) {
      if (event.target === els.overlay) closeGame();
    });

    // Carriles: pointer events + touch-action:none (definido en CSS) para
    // que el toque no cause scroll y no requiera tocar exactamente la cara.
    els.lanes.forEach(function (laneEl) {
      laneEl.addEventListener("pointerdown", function (event) {
        event.preventDefault();
        var lane = Number(laneEl.dataset.lane);
        handleLaneHit(lane);
      });
    });
  }

  function onKeyDown(event) {
    if (state.screen === "playing") {
      var idx = CONFIG.laneKeys.indexOf(event.key);
      if (idx !== -1) {
        event.preventDefault();
        handleLaneHit(idx);
        return;
      }
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeGame();
    }
  }

  /* ------------------------------------------------------------------ */
  /* 6) CICLO DE JUEGO                                                    */
  /* ------------------------------------------------------------------ */

  function pickFriendIndex() {
    return Math.floor(Math.random() * FRIENDS.length);
  }

  function measureLaneMetrics() {
    var wrapRect = els.lanesWrap.getBoundingClientRect();
    var hitRect = els.hitline.getBoundingClientRect();
    var noteSize = 56; // debe coincidir con --ap-note-size en piano-game.css
    var travelPx = hitRect.top - wrapRect.top - noteSize * 0.5;
    if (travelPx < 40) travelPx = 40; // resguardo en pantallas muy pequeñas
    state.laneMetrics = { travelPx: travelPx };
  }

  function createNoteElement(friendIndex) {
    var friend = FRIENDS[friendIndex % FRIENDS.length] || { name: "?", image: "" };
    var wrap = document.createElement("div");
    wrap.className = "amaris-piano-note";

    // Trail sutil detrás de la nota mientras cae (puramente decorativo).
    var trail = document.createElement("span");
    trail.className = "amaris-piano-note-trail";
    wrap.appendChild(trail);

    var glow = document.createElement("span");
    glow.className = "amaris-piano-note-glow";
    wrap.appendChild(glow);

    // Anillo arcoíris rotatorio alrededor de la foto (puramente decorativo,
    // no interfiere con hit-testing: el toque sigue siendo por carril).
    var ring = document.createElement("span");
    ring.className = "amaris-piano-note-ring";
    wrap.appendChild(ring);

    var img = document.createElement("img");
    img.className = "amaris-piano-note-img";
    img.alt = "";
    img.draggable = false;
    img.src = friend.image;
    img.addEventListener("error", function () {
      // Si el error ocurre DESPUÉS de acertar (falló la hitImage, no la
      // imagen normal), no destruimos la nota con el avatar de iniciales:
      // simplemente nos quedamos mostrando la imagen normal, que ya se
      // había cargado bien.
      if (wrap.dataset.apHit === "1") {
        img.src = friend.image;
        return;
      }
      wrap.classList.add("amaris-piano-note--fallback");
      var colorIdx = Math.abs(hashString(friend.id || friend.name || "?")) % CONFIG.friendAvatarColors.length;
      wrap.style.setProperty("--ap-fallback-color", CONFIG.friendAvatarColors[colorIdx]);
      if (img.parentNode) wrap.removeChild(img);
      var initial = document.createElement("span");
      initial.className = "amaris-piano-note-initial";
      initial.textContent = (friend.name || "?").trim().charAt(0).toUpperCase();
      wrap.appendChild(initial);
    });
    wrap.appendChild(img);

    return wrap;
  }

  function hashString(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  function spawnNote(lane, friendIndex, spawnAtMs) {
    var friend = FRIENDS[friendIndex % FRIENDS.length] || null;
    var note = {
      id: ++noteIdSeq,
      lane: lane,
      friend: friend,
      spawnTime: spawnAtMs,
      hitTime: spawnAtMs + CONFIG.fallDuration,
      judged: false,
      el: createNoteElement(friendIndex)
    };
    els.lanes[lane].appendChild(note.el);
    state.notes.push(note);
  }

  function spawnFromAutoGenerator(nowMs) {
    if (state.chart) return; // si hay chart fijo, no se auto-genera
    if (nowMs - state.gameStartTime >= CONFIG.gameDuration) return; // ya no toca generar más

    if (nowMs >= state.lastSpawnTime + state.nextSpawnIn) {
      var lane = Math.floor(Math.random() * CONFIG.lanes);
      spawnNote(lane, pickFriendIndex(), nowMs);
      state.lastSpawnTime = nowMs;
      var range = CONFIG.spawnInterval.max - CONFIG.spawnInterval.min;
      state.nextSpawnIn = CONFIG.spawnInterval.min + Math.random() * range;
    }
  }

  function spawnFromChart(elapsedMs) {
    if (!state.chart) return;
    while (
      state.chartIndex < state.chart.length &&
      state.chart[state.chartIndex].time <= elapsedMs + CONFIG.fallDuration
    ) {
      var entry = state.chart[state.chartIndex];
      spawnNote(entry.lane, entry.friend || 0, state.gameStartTime + entry.time);
      state.chartIndex++;
    }
  }

  function updateHUD() {
    els.score.textContent = String(state.score);
    els.combo.textContent = "x" + state.combo;
  }

  function showFeedback(text, kind) {
    els.feedback.textContent = text;
    els.feedback.className = "amaris-piano-feedback amaris-piano-feedback--" + kind + " is-visible";
    window.clearTimeout(showFeedback._t);
    showFeedback._t = window.setTimeout(function () {
      els.feedback.classList.remove("is-visible");
    }, 500);
  }

  // Pequeña explosión de 6 partículas, cada una con un color distinto del
  // arcoíris, saliendo desde el punto de impacto. Mismo sitio/tiempo que
  // antes (420ms), solo más vistoso.
  var AP_RAINBOW = ["#ff6b6b", "#ffb35c", "#ffe066", "#7ee8a0", "#7fd9ff", "#c9a6ff"];

  function burstParticles(laneEl) {
    for (var i = 0; i < AP_RAINBOW.length; i++) {
      (function (index) {
        var particle = document.createElement("span");
        particle.className = "amaris-piano-burst";
        particle.style.bottom = "var(--ap-hitline-offset)";
        particle.style.setProperty("--ap-burst-color", AP_RAINBOW[index]);
        particle.style.setProperty("--ap-burst-angle", (index * (360 / AP_RAINBOW.length)) + "deg");
        particle.style.setProperty("--ap-burst-delay", (index * 12) + "ms");
        laneEl.appendChild(particle);
        window.setTimeout(function () {
          if (particle.parentNode) particle.parentNode.removeChild(particle);
        }, 460);
      })(i);
    }
  }

  // Pequeño "flash" arcoíris en la línea de golpe cuando el jugador acierta
  // (efecto puramente visual vía clase CSS, se auto-remueve solo).
  function flashHitline() {
    if (!els.hitline) return;
    els.hitline.classList.remove("is-flash");
    // Forzar reflow para poder reiniciar la animación si se acierta rápido.
    void els.hitline.offsetWidth;
    els.hitline.classList.add("is-flash");
    window.setTimeout(function () {
      els.hitline.classList.remove("is-flash");
    }, 360);
  }

  // Cambia la <img> de la nota a la foto de "acierto" del amigo, SIN crear
  // ni duplicar ningún elemento: es la misma nota, mismo <img>, solo cambia
  // su src. Si ese amigo no tiene hitImage configurada, no hace nada y la
  // nota conserva su imagen normal (comportamiento previo intacto).
  function showHitImage(note) {
    var friend = note.friend;
    if (!friend || !friend.hitImage) return;

    var img = note.el.querySelector(".amaris-piano-note-img");
    if (!img) return; // ya cayó al avatar de iniciales antes de acertar

    note.el.dataset.apHit = "1";
    img.src = friend.hitImage;
  }

  function judgeNote(note, kind) {
    note.judged = true;
    var laneEl = els.lanes[note.lane];

    if (kind === "perfect" || kind === "great") {
      showHitImage(note);
      note.el.classList.add("is-hit");
    }

    note.el.classList.add("is-judged", "is-" + kind);

    if (kind === "perfect" || kind === "great") {
      state.combo += 1;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      var points = kind === "perfect" ? CONFIG.scoring.perfect : CONFIG.scoring.great;
      state.score += points;
      if (kind === "perfect") state.perfectCount++;
      else state.greatCount++;

      showFeedback(kind === "perfect" ? "PERFECT +100" : "GREAT +50", kind);
      burstParticles(laneEl);
      flashHitline();
      playPianoNote(note.lane);
      if (navigator.vibrate) {
        try {
          navigator.vibrate(kind === "perfect" ? 12 : 8);
        } catch (e) {
          /* algunos navegadores lanzan si no hay permiso; se ignora */
        }
      }
    } else {
      state.combo = 0;
      state.missCount++;
      showFeedback("MISS", "miss");
    }

    updateHUD();

    window.setTimeout(function () {
      if (note.el.parentNode) note.el.parentNode.removeChild(note.el);
      var idx = state.notes.indexOf(note);
      if (idx !== -1) state.notes.splice(idx, 1);
    }, 180);
  }

  function handleLaneHit(lane) {
    if (state.screen !== "playing") return;
    var now = performance.now();
    var best = null;
    var bestDiff = Infinity;

    state.notes.forEach(function (note) {
      if (note.judged || note.lane !== lane) return;
      var diff = Math.abs(now - note.hitTime);
      if (diff <= CONFIG.hitWindow.great && diff < bestDiff) {
        best = note;
        bestDiff = diff;
      }
    });

    if (!best) return; // toque sin nota cercana: no penaliza, simplemente no pasa nada

    var kind = bestDiff <= CONFIG.hitWindow.perfect ? "perfect" : "great";
    judgeNote(best, kind);
  }

  function tick() {
    var now = performance.now();

    spawnFromChart(now - state.gameStartTime);
    spawnFromAutoGenerator(now);

    var travelPx = state.laneMetrics ? state.laneMetrics.travelPx : 300;
    var missCutoff = CONFIG.hitWindow.great;
    var allDone = true;

    state.notes.forEach(function (note) {
      if (note.judged) return;
      allDone = false;

      var progress = (now - note.spawnTime) / CONFIG.fallDuration;
      if (progress > 1) progress = 1 + (now - note.hitTime) / CONFIG.fallDuration;
      note.el.style.transform = "translateY(" + Math.max(0, progress) * travelPx + "px)";

      if (now - note.hitTime > missCutoff) {
        judgeNote(note, "miss");
      } else if (now >= note.hitTime - 120) {
        note.el.classList.add("is-near");
      }
    });

    var spawningDone = state.chart
      ? state.chartIndex >= state.chart.length
      : now - state.gameStartTime >= CONFIG.gameDuration;

    if (spawningDone && allDone && state.notes.length === 0) {
      endGame();
      return;
    }

    state.rafId = window.requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------ */
  /* 7) TRANSICIONES ENTRE PANTALLAS                                     */
  /* ------------------------------------------------------------------ */

  function showScreen(name) {
    state.screen = name;
    els.startScreen.hidden = name !== "start";
    els.gameScreen.hidden = name !== "playing";
    els.endScreen.hidden = name !== "end";
  }

  function startGame() {
    buildDOM();

    // 1) Mostrar la pantalla de juego PRIMERO. Medir el layout (paso 3)
    //    mientras la pantalla sigue con display:none siempre da 0 —
    //    por eso measureLaneMetrics() se movió después de showScreen().
    showScreen("playing");
    updateHUD();
    window.cancelAnimationFrame(state.rafId);

    // 2) Seleccionar + cargar + reproducir la canción de esta partida.
    //    startActiveSongAndThen() llama al callback en cuanto la música
    //    arranca de verdad (o a los 400ms si no hay/fallo el mp3), así el
    //    reloj de la partida queda sincronizado con el inicio real del audio.
    startActiveSongAndThen(function () {
      // 3) Esperar a que el navegador pinte el cambio de pantalla (un
      //    frame) antes de calcular dimensiones reales.
      window.requestAnimationFrame(function () {
        // 4) Calcular dimensiones reales / posición de la línea de precisión
        measureLaneMetrics();

        // 5) Inicializar el reloj de la partida y las notas
        state.gameStartTime = performance.now();
        state.lastSpawnTime = state.gameStartTime;
        state.nextSpawnIn = CONFIG.spawnInterval.min;
        state.chartIndex = 0;

        // Chart efectivo: el fijado explícitamente con setChart() manda
        // siempre; si no hay ninguno, se usa el de la canción activa (si
        // esta define uno); si tampoco hay, se mantiene la generación
        // automática de notas ya existente, sin cambios.
        var song = getActiveSong();
        var songChart = song && Array.isArray(song.chart) ? song.chart : null;
        state.chart = state.externalChart
          ? state.externalChart
          : songChart
          ? songChart.slice().sort(function (a, b) {
              return a.time - b.time;
            })
          : null;

        // 6) Iniciar requestAnimationFrame → 7) comienza el juego
        state.rafId = window.requestAnimationFrame(tick);
      });
    });
  }

  function endGame() {
    stopSongAudio();
    showScreen("end");
    els.finalScore.textContent = String(state.score);
    els.finalPerfect.textContent = String(state.perfectCount);
    els.finalGreat.textContent = String(state.greatCount);
    els.finalMiss.textContent = String(state.missCount);
    els.finalCombo.textContent = String(state.maxCombo);
  }

  function clearNotes() {
    state.notes.forEach(function (note) {
      if (note.el.parentNode) note.el.parentNode.removeChild(note.el);
    });
    state.notes = [];
  }

  function resetGame() {
    window.cancelAnimationFrame(state.rafId);
    stopSongAudio();
    clearNotes();
    state.score = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.perfectCount = 0;
    state.greatCount = 0;
    state.missCount = 0;
    state.chartIndex = 0;
    updateHUD();
    showScreen("start");
  }

  /* ------------------------------------------------------------------ */
  /* 7.1) AYUDAS PARA MÓVIL                                              */
  /* ------------------------------------------------------------------ */

  function handleOrientationChange() {
    // El viewport móvil tarda un instante en asentarse tras rotar; se
    // mide una vez de inmediato y otra vez un poco después, por si acaso.
    measureLaneMetrics();
    window.setTimeout(measureLaneMetrics, 250);
  }

  function preventBackgroundScroll(event) {
    // Solo bloquea el arrastre sobre el fondo oscuro del modal (fuera de
    // los carriles, que ya usan touch-action:none y necesitan sus propios
    // eventos de toque para jugar).
    if (event.target === els.overlay || event.target === els.modal) {
      event.preventDefault();
    }
  }

  /* ------------------------------------------------------------------ */
  /* 8) API PÚBLICA: open / close / start / reset                        */
  /* ------------------------------------------------------------------ */

  function openGame() {
    buildDOM();
    resumeAudio();

    // Evita que suenen dos músicas a la vez: si el reproductor principal
    // de Amaris World estaba sonando, se pausa (guardando que estaba
    // sonando) para restaurarlo tal cual al cerrar el piano.
    pauseMainWorldAudio();

    state.previousActiveElement = document.activeElement;
    state.previousHtmlOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    els.overlay.setAttribute("aria-hidden", "false");
    els.overlay.classList.add("is-open");
    showScreen("start");

    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", measureLaneMetrics);
    // orientationchange (girar el teléfono) no siempre dispara "resize" a
    // tiempo en todos los navegadores móviles; se recalcula aparte, con un
    // pequeño margen para que el viewport termine de asentarse.
    window.addEventListener("orientationchange", handleOrientationChange);
    // Evita que un arrastre sobre el fondo oscuro del modal "jale" y
    // rebote la página de Amaris World detrás (efecto rubber-band de
    // iOS Safari). Los carriles siguen recibiendo su propio touch-action.
    els.overlay.addEventListener("touchmove", preventBackgroundScroll, { passive: false });

    window.setTimeout(function () {
      els.startBtn.focus();
    }, 50);
  }

  function closeGame() {
    if (!state.built) return;

    window.cancelAnimationFrame(state.rafId);
    stopSongAudio();
    clearNotes();

    // Restaura el estado anterior de Amaris World: si su música sonaba
    // antes de abrir el piano, vuelve a sonar; si no sonaba, se queda en
    // silencio, tal como estaba.
    resumeMainWorldAudioIfNeeded();

    els.overlay.classList.remove("is-open");
    els.overlay.setAttribute("aria-hidden", "true");

    document.documentElement.style.overflow = state.previousHtmlOverflow || "";
    document.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("resize", measureLaneMetrics);
    window.removeEventListener("orientationchange", handleOrientationChange);
    els.overlay.removeEventListener("touchmove", preventBackgroundScroll);

    showScreen("start");

    // Devuelve el foco exactamente a donde estaba (la estrella del mundo),
    // así el usuario "regresa" de forma natural y accesible.
    if (state.previousActiveElement && typeof state.previousActiveElement.focus === "function") {
      state.previousActiveElement.focus();
    }
  }

  window.AmarisPiano = {
    open: openGame,
    close: closeGame,
    start: startGame,
    reset: resetGame,
    // Fija un chart fijo para TODAS las partidas, sin importar la canción
    // activa (tiene prioridad sobre cualquier "chart" definido dentro de
    // PIANO_SONGS). Pasa null para volver a dejar que cada canción (o el
    // generador automático) decida.
    setChart: function (chart) {
      state.externalChart = Array.isArray(chart)
        ? chart.slice().sort(function (a, b) {
            return a.time - b.time;
          })
        : null;
    },
    // Cambia la canción activa para la próxima partida (id de PIANO_SONGS).
    // Si el id no existe, no hace nada (se queda con la canción anterior).
    setSong: function (id) {
      if (getSongById(id)) state.activeSongId = id;
    }
  };

  // Ejemplo de chart (desactivado por defecto: se usa auto-generación).
  // Para sincronizar con una canción real, descomenta y ajusta tiempos:
  //
  // window.AmarisPiano.setChart([
  //   { time: 1000, lane: 0, friend: 0 },
  //   { time: 1500, lane: 1, friend: 1 },
  //   { time: 2000, lane: 2, friend: 2 },
  //   { time: 2500, lane: 3, friend: 3 }
  // ]);

  /* ------------------------------------------------------------------ */
  /* 9) PUNTO DE ENTRADA DESDE "SORPRESA"                                 */
  /* Engancha la tarjeta "🎹 AMARIS PIANO" (#surprisePianoBtn) que vive   */
  /* dentro de #surpriseScreen en index.html. Es independiente y          */
  /* defensivo: si el botón no existe (aún no se agregó al HTML, o        */
  /* cambió de id), simplemente no hace nada — no rompe nada más.         */
  /* ------------------------------------------------------------------ */

  function bindSurpriseLauncher() {
    var btn = document.getElementById("surprisePianoBtn");
    if (!btn || btn.dataset.apBound === "1") return; // ya enganchado o no existe
    btn.dataset.apBound = "1";
    btn.addEventListener("click", function () {
      openGame();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindSurpriseLauncher);
  } else {
    bindSurpriseLauncher();
  }
})();
