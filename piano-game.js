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
       generación automática. chart = [{ time, lane, friend, type,
       duration }, ...], time en ms desde el inicio de LA CANCIÓN (no de
       la partida: el reloj de juego usa audio.currentTime como
       referencia mientras la música suena). type es "tap" (por defecto,
       basta un toque) o "hold" (hay que mantener presionado "duration"
       ms). Tiene prioridad sobre cualquier chart definido dentro de
       PIANO_SONGS (ver abajo). Ejemplo:
         [{ time: 800, lane: 0, friend: 0, type: "tap" },
          { time: 1600, lane: 2, friend: 1, type: "hold", duration: 1000 }]
     window.AmarisPiano.setSong(id) → cambia la canción activa antes de
       abrir/empezar la partida. id debe existir en PIANO_SONGS. También
       hay un pequeño selector de canciones en la pantalla de inicio
       (si hay más de una en PIANO_SONGS) que llama a esto mismo.

     ---- AÑADIDO (mejora de HOLD/imágenes/música/sonido, sin tocar nada
     de lo anterior) ----

     window.AmarisPiano.addSong(song) → registra una canción MÁS, además
       de las ya definidas en PIANO_SONGS, sin tocar ese arreglo. Pensado
       para que piano-music-loader.js (opcional, ver ese archivo) pueda
       agregar canciones descubiertas en assets/piano-songs/music.json sin
       tener que editar este archivo. song = { id, name, file, chart?,
       cover?, sfx? }. No hace nada si el id ya existe (evita duplicados).

     window.AmarisPiano.setSongChart(id, chart) → reemplaza el chart de
       una canción YA registrada (útil cuando el chart.json de esa
       canción se cargó de forma asíncrona, después de addSong()).

     window.AmarisPiano.setVolume({ music, sfx }) → ajusta CONFIG.musicVolume
       / CONFIG.sfxVolume (0 a 1) en caliente. Ninguno de los dos afecta la
       lógica de juego, solo el volumen de reproducción.

     Cada nota de un chart (setChart(), el "chart" de una canción en
     PIANO_SONGS, o un chart.json cargado por piano-music-loader.js) ahora
     acepta, además de { time, lane, friend, type, duration } de siempre:
       "image"    → ruta de imagen que reemplaza la foto del "friend" para
                    ESA nota puntual (opcional).
       "hitImage" → ruta de imagen que reemplaza a "image" justo cuando el
                    jugador acierta esa nota puntual (opcional). Sin ella,
                    se usa el hitImage del "friend" si tiene uno; sin
                    ninguno de los dos, la nota no cambia de imagen al
                    acertar (comportamiento de siempre).
     Ninguno de los dos campos es obligatorio ni rompe charts existentes.

     Sonido de resultado (PERFECT/GREAT/MISS/HOLD completado): se resuelve
     con prioridad (1) sonido de la canción activa (song.sfx.<kind>), (2)
     sonido global (GLOBAL_SFX.<kind>, más abajo), (3) el sonido sintetizado
     de siempre (playPianoNote / un "thud" simple para MISS). Nunca truena
     si falta un archivo: cae al siguiente nivel en silencio.

   TOQUE / TAP / HOLD:
     Cada nota tiene su propio pointerdown/up/cancel (mouse, touch,
     stylus, y teclado 1-4), enganchado directamente sobre su elemento
     (bindNoteEvents) desde el instante en que se crea — es decir, desde
     que aparece arriba de la pantalla. El toque se ACEPTA de inmediato,
     en cualquier punto de la caída (arriba, en medio o cerca de la
     línea): ya no existe ninguna ventana que rechace un toque por
     "demasiado pronto". El "diff" contra el hitTime de la nota solo se
     usa DESPUÉS de aceptar el toque, para matizar el puntaje entre
     PERFECT y GREAT — nunca para decidir si el toque cuenta. Como
     respaldo, el propio carril también busca la nota activa más cercana
     en el tiempo si el toque cae justo al lado de la tecla (handleLaneHit),
     pero la tecla tocada directamente siempre tiene prioridad. Las notas
     "hold" se inician al tocar y se completan manteniendo el dedo/tecla
     hasta el final de su duración; soltar antes de tiempo cuenta MISS.
     Varios dedos pueden sostener/tocar notas distintas a la vez gracias a
     un registro pointerId → nota (state.activeHolds).

   PUNTO DE ENTRADA (SORPRESA):
     Este módulo también engancha, si existe en el DOM, el botón
     #surprisePianoBtn (la tarjeta "🎹 AMARIS PIANO" dentro de la
     pantalla #surpriseScreen de index.html) para abrir el juego. Si ese
     botón no existe todavía o cambia de id, esto simplemente no hace
     nada — no rompe el resto del módulo ni de la página.

   SISTEMA DE MÚSICA (assets/piano-songs/):
     PIANO_SONGS define las canciones disponibles. Se deja VACÍO a
     propósito: las canciones reales de Amaris Piano viven en
     assets/piano-songs/ (su propia carpeta, separada del reproductor
     principal de Amaris World) y se registran en caliente por
     piano-music-loader.js, que lee assets/piano-songs/music.json y
     llama a AmarisPiano.addSong() por cada una — sin tocar este
     arreglo ni este archivo. Al comenzar una partida se selecciona la
     canción activa (por defecto la primera registrada, o la fijada con
     setSong()), se carga y se reproduce con un <audio> propio e
     independiente del reproductor principal de Amaris World (#bgAudio).
     Si esa canción define su propio arreglo "chart", se usa
     automáticamente para sincronizar las notas; si no, se mantiene
     intacto el generador automático de notas ya existente. Si el
     archivo .mp3 no existe o falla, el juego sigue funcionando igual,
     sin música y con generación automática — nunca se rompe ni se
     queda colgado.

     También se puede seguir agregando una canción manualmente aquí, en
     PIANO_SONGS, con el mismo formato que usa addSong(), por ejemplo:
       { id: "cancion-amaris", name: "Canción de Amaris",
         file: "assets/piano-songs/cancion-amaris/song.mp3" }

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

  // 🎵 Canciones del piano. VACÍO A PROPÓSITO: las canciones reales se
  // registran solas al cargar la página, leídas desde
  // assets/piano-songs/music.json por piano-music-loader.js (que llama a
  // AmarisPiano.addSong() por cada una — ver ese archivo). Este arreglo
  // ya no depende de archivos fijos como "piano-theme.mp3" o "song1.mp3":
  // si no existen, ya no se intentan reproducir.
  //
  // También puedes seguir agregando canciones a mano aquí mismo, con el
  // mismo formato que usa addSong() — útil solo si prefieres no usar
  // music.json:
  //   { id: "cancion-amaris", name: "Canción de Amaris",
  //     file: "assets/piano-songs/cancion-amaris/song.mp3" }
  //
  // "chart" es OPCIONAL por canción: si lo defines, esa canción usa esas
  // notas sincronizadas en vez de la generación automática. Formato
  // idéntico al de setChart(): [{ time, lane, friend, type, duration }, ...]
  // en ms desde el inicio de la canción. "type" es opcional ("tap" por
  // defecto); "duration" (ms) solo aplica a type:"hold". Sin chart, el
  // juego sigue generando notas automáticamente como antes.
  var PIANO_SONGS = [];

  // Canción usada por defecto al abrir una partida si nadie llamó a
  // AmarisPiano.setSong(). Cambia este id para cambiar la canción por
  // defecto sin tener que reordenar PIANO_SONGS.
  var DEFAULT_SONG_ID = PIANO_SONGS.length ? PIANO_SONGS[0].id : null;

  // 🔊 Sonidos de resultado GLOBALES (punto 13 del pedido: nivel 2 de la
  // prioridad, entre el sonido propio de la canción y el sintetizado de
  // respaldo). Completamente opcional: si estos archivos no existen, el
  // juego jamás truena — simplemente sigue usando el sonido sintetizado
  // de siempre. Coloca los .mp3 en assets/piano-songs/sfx/ si quieres
  // usarlos como sonido de respaldo para TODAS las canciones; si no,
  // deja esto vacío y no pasa nada (cada canción puede además traer su
  // propio sfx.<kind>, que tiene prioridad sobre este).
  var GLOBAL_SFX = {
    // perfect: "assets/piano-songs/sfx/perfect.mp3",
    // excellent: "assets/piano-songs/sfx/excellent.mp3",
    // great: "assets/piano-songs/sfx/great.mp3",
    // good: "assets/piano-songs/sfx/good.mp3",
    // miss: "assets/piano-songs/sfx/miss.mp3",
    // hold: "assets/piano-songs/sfx/hold.mp3"
  };

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
    // Ventana temporal para juzgar un toque, medida contra hitTime (el
    // "momento musical" de la nota) sin importar en qué punto de su
    // caída se encuentre visualmente la nota en pantalla.
    hitWindow: { perfect: 100, great: 200 },
    scoring: { perfect: 100, great: 50 },
    // Frecuencias (Hz) por carril: C4 D4 E4 G4 — sonido simple de piano.
    noteFrequencies: [261.63, 293.66, 329.63, 392.0],
    friendAvatarColors: ["#ffb3d9", "#c9a6ff", "#ffe08a", "#8fd6ff", "#ff9a8a"],

    // 🐢➜🐇 LONGITUD VISUAL DE LOS HOLD (independiente de su duración
    // musical, que NUNCA se toca). Un HOLD con duration:3000 ya no se
    // dibuja gigante durante 3s completos: su ALTURA en pantalla se
    // multiplica por este valor. Bájalo (0.5) para HOLD más cortos/
    // rápidos visualmente; súbelo (1.0) para HOLD más largos. No afecta
    // en absoluto cuánto hay que sostener la tecla ni la puntuación.
    holdLengthMultiplier: 0.65,

    // 🔊 Volumen (punto 15 del pedido). 1.0 = volumen completo, 0 = mudo.
    // No afecta a ningún otro sistema; ajustable en caliente con
    // AmarisPiano.setVolume({ music, sfx }).
    musicVolume: 1.0,
    sfxVolume: 0.7
  };

  /* ------------------------------------------------------------------ */
  /* 2) ESTADO INTERNO                                                    */
  /* ------------------------------------------------------------------ */

  var state = {
    built: false,
    screen: "start", // 'start' | 'playing' | 'end'
    // 🔒 BUG FIX (punto 27 del pedido: "audio duplicado", "dos canciones
    // reproduciéndose simultáneamente"): true desde que se pulsa
    // COMENZAR/JUGAR OTRA VEZ hasta que la partida realmente arrancó
    // (primer requestAnimationFrame de tick()). Un doble tap/clic rápido
    // sobre esos botones, antes de esta corrección, podía disparar
    // startGame() dos veces mientras la primera llamada seguía esperando
    // a que el audio confirmara su reproducción: la segunda llamada volvía
    // a enganchar audio.play() + sus listeners "playing"/"error" y, al
    // resolver ambas, terminaba con DOS bucles tick() (rAF) corriendo a la
    // vez → notas dobles, score doble, dos canciones superpuestas. Con
    // este guardado, cualquier llamada a startGame() mientras ya hay una
    // en curso simplemente no hace nada.
    isStarting: false,
    // 🔎 Logs de diagnóstico (punto 31 del pedido). Los eventos de baja
    // frecuencia (canción elegida, fuente de audio, audio cargado/
    // reproduciéndose, chart cargado) SIEMPRE se registran, sea cual sea
    // este valor — son baratos y justo lo que se pide poder verificar. Los
    // de ALTA frecuencia (cada TAP/HOLD, el currentTime en cada frame) solo
    // se registran cuando debug=true, y el de currentTime además se limita
    // a 1 vez por segundo, para que dejarlo encendido no cueste rendimiento
    // ni inunde la consola ("modo debug controlado", punto 31). Cambiar en
    // caliente con AmarisPiano.setDebug(true/false).
    debug: true,
    lastDebugLogAt: 0,
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
    laneMetrics: null, // { travelBase, tapHeightPx, pxPerMs } recalculado por carril
    previousActiveElement: null,
    previousHtmlOverflow: "",
    pressedKeys: {}, // lane(idx) -> bool, evita que el auto-repeat de keydown re-dispare el toque

    // pointerId (o "key0".."key3") -> nota HOLD que ese dedo/tecla sostiene
    // ahora mismo. Reemplaza cualquier bandera global tipo isHolding=true,
    // así varios dedos pueden sostener/tocar notas distintas a la vez.
    activeHolds: new Map(),

    // ---- Música de la partida (independiente del reproductor principal) --
    activeSongId: null, // fijado con AmarisPiano.setSong(); si es null, se usa DEFAULT_SONG_ID
    songAudio: null, // <audio> propio del piano, creado bajo demanda
    songAudioFailed: false, // true si la canción actual no pudo cargar/reproducirse
    mainAudioWasPlaying: false, // si #bgAudio (Amaris World) sonaba antes de abrir el piano

    // ---- Análisis de energía del audio (SOLO para modular la generación
    // automática cuando una canción no trae "chart"). Si el navegador no
    // lo soporta o falla (p. ej. CORS en file://), simplemente se ignora
    // y el auto-generador sigue funcionando igual que antes.
    songAnalyser: null,
    songAnalyserData: null
  };

  var els = {}; // referencias DOM, pobladas en buildDOM()
  var noteIdSeq = 0;

  /* ------------------------------------------------------------------ */
  /* 1.1) LOGS DE DIAGNÓSTICO (punto 31 del pedido)                       */
  /* logAlways(): eventos de baja frecuencia (canción elegida, fuente de  */
  /* audio, audio cargado/reproduciéndose, chart cargado) — siempre       */
  /* visibles, sirven para verificar rápido en consola qué está pasando.  */
  /* logDebug(): eventos de alta frecuencia (cada TAP/HOLD) — solo si     */
  /* state.debug === true, para no ensuciar la consola en uso normal.     */
  /* ------------------------------------------------------------------ */
  function logAlways() {
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(console, args);
  }
  function logDebug() {
    if (!state.debug) return;
    var args = Array.prototype.slice.call(arguments);
    console.log.apply(console, args);
  }

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
    // El pico se escala por CONFIG.sfxVolume (punto 15); Math.max evita
    // pasarle 0 a exponentialRampToValueAtTime, que no acepta 0 exacto.
    var peak = Math.max(0.0001, 0.35 * CONFIG.sfxVolume);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Sonido sintetizado de respaldo para MISS (nivel 3 de la prioridad, punto
  // 13): un "thud" grave y corto, bien distinto del "ding" de acierto, para
  // que un MISS sin sonido personalizado siga sonando a fallo y no a acierto.
  // Nunca existió antes un sonido de MISS; esto es puramente aditivo.
  function playMissThud() {
    var ctx = ensureAudioContext();
    if (!ctx) return;
    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);
    var peak = Math.max(0.0001, 0.22 * CONFIG.sfxVolume);
    gain.gain.setValueAtTime(peak, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
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
    audio.volume = CONFIG.musicVolume; // 🔊 punto 15, ajustable con setVolume()
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

  // Reloj UNIFICADO de la partida: mientras la canción de esta partida
  // esté sonando, el audio ES el reloj (audio.currentTime), tal como pide
  // el punto 11 — así las notas (definidas en ms desde el inicio de la
  // canción) quedan siempre sincronizadas con lo que se escucha, incluso
  // si el audio se atrasa/adelanta un poco por buffering. Si no hay
  // canción activa o falló, se usa performance.now() como respaldo (el
  // comportamiento de siempre), para que el juego NUNCA se quede
  // congelado por falta de audio.
  function getElapsedMs() {
    if (state.songAudio && !state.songAudioFailed && !state.songAudio.paused) {
      var t = state.songAudio.currentTime;
      if (!isNaN(t)) return t * 1000;
    }
    return performance.now() - state.gameStartTime;
  }

  // Engancha un AnalyserNode al <audio> de la canción para poder leer su
  // energía en tiempo real (0..1) y usarla SOLO para modular el generador
  // automático de notas (más energía → notas un poco más seguidas / más
  // holds). No sustituye al chart manual, que siempre tiene prioridad.
  // Totalmente opcional y defensivo: createMediaElementSource() solo se
  // puede llamar UNA vez por <audio>, y puede fallar por CORS si el mp3
  // se sirve desde file:// — en ambos casos simplemente se desactiva.
  function ensureSongAnalyser() {
    if (state.songAnalyser) return state.songAnalyser;
    if (!state.songAudio) return null;
    if (state.songAudio.dataset.apAnalyserAttached === "1") return null; // ya se intentó antes, no reintentar
    var ctx = ensureAudioContext();
    if (!ctx) return null;
    try {
      var source = ctx.createMediaElementSource(state.songAudio);
      var analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(ctx.destination); // sin esto, el audio se silenciaría
      state.songAnalyser = analyser;
      state.songAnalyserData = new Uint8Array(analyser.frequencyBinCount);
    } catch (e) {
      state.songAnalyser = null; // p. ej. CORS: seguimos sin análisis, sin romper nada
    }
    state.songAudio.dataset.apAnalyserAttached = "1";
    return state.songAnalyser;
  }

  // Energía promedio actual (0..1) o null si el análisis no está disponible.
  function getAudioEnergy() {
    if (!state.songAnalyser || !state.songAnalyserData) return null;
    state.songAnalyser.getByteFrequencyData(state.songAnalyserData);
    var sum = 0;
    for (var i = 0; i < state.songAnalyserData.length; i++) sum += state.songAnalyserData[i];
    return sum / state.songAnalyserData.length / 255;
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

    function describeAudioError() {
      var mediaError = audio.error; // MediaError o null
      return {
        code: mediaError ? mediaError.code : null,
        message: mediaError ? mediaError.message : null,
        src: audio.currentSrc || audio.src,
        networkState: audio.networkState,
        readyState: audio.readyState
      };
    }

    function removeDebugListeners() {
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("loadeddata", onLoadedData);
      audio.removeEventListener("pause", onPause);
    }

    function finish() {
      if (settled) return;
      settled = true;
      removeDebugListeners();
      window.clearTimeout(fallbackTimer);
      callback();
    }
    function onPlaying() {
      logAlways("[AMARIS PIANO] Audio playing");
      finish();
    }
    function onError() {
      state.songAudioFailed = true;
      console.warn("[AMARIS PIANO] ERROR al reproducir:", describeAudioError());
      finish();
    }
    // Listeners puramente de DIAGNÓSTICO (no deciden nada por sí mismos,
    // solo dejan rastro en consola de en qué punto se atoró la carga si
    // algo falla). Se quitan junto con los demás en finish()/removeDebugListeners().
    function onCanPlay() {
      logDebug("[AMARIS PIANO] canplay — el navegador ya puede reproducir el audio.");
    }
    function onLoadedData() {
      logAlways("[AMARIS PIANO] Audio loaded");
    }
    function onPause() {
      logDebug("[AMARIS PIANO] pause — el audio se pausó.");
    }

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("error", onError);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("loadeddata", onLoadedData);
    audio.addEventListener("pause", onPause);

    logAlways("[AMARIS PIANO] Song selected: " + (song.name || song.id));

    // Si preloadSongAudio() (punto 18) ya dejó este MISMO archivo cargado
    // en el <audio>, no se vuelve a asignar "src" (evita re-descargarlo
    // desde cero): solo se rebobina a 0. Si es una canción distinta (o aún
    // no se precargó por algún motivo), se asigna aquí igual que antes.
    if (audio.dataset.apLoadedSrc !== song.file) {
      logAlways("[AMARIS PIANO] Audio source: " + song.file);
      audio.src = song.file;
      audio.dataset.apLoadedSrc = song.file;
    } else {
      try {
        audio.currentTime = 0;
      } catch (e) {
        /* ignorar: algunos navegadores no permiten reasignar currentTime antes de cargar */
      }
    }

    // audio.currentTime = 0; audio.volume = CONFIG.musicVolume; await audio.play();
    // (punto 7 del pedido) — en ese orden exacto, y SOLO después de esto
    // arranca la sincronización de notas (ver startGame(): el rAF de
    // tick() no se lanza hasta que este callback llama a finish()).
    audio.volume = CONFIG.musicVolume;

    logDebug("[AMARIS PIANO] Intentando reproducir audio...");
    var playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function (err) {
        // Bloqueo de autoplay, archivo ausente, etc.: seguimos sin música,
        // pero el error se muestra completo en consola (nunca se silencia).
        state.songAudioFailed = true;
        var info = describeAudioError();
        info.playRejection = err && (err.message || String(err));
        console.warn("[AMARIS PIANO] ERROR al reproducir:", info);
        finish();
      });
    }

    fallbackTimer = window.setTimeout(finish, 400);
  }

  /* ------------------------------------------------------------------ */
  /* 3.1b) SONIDOS DE RESULTADO PERSONALIZADOS (puntos 12-15 del pedido) */
  /* Prioridad: 1) sonido de la canción activa (song.sfx.<kind>); 2)      */
  /* sonido global (GLOBAL_SFX.<kind>); 3) sonido sintetizado del juego   */
  /* (playPianoNote para aciertos/hold, playMissThud para fallos), que    */
  /* SIEMPRE existe, así que nunca hay silencio ni error por archivo      */
  /* faltante. IMPORTANTE: esto NO es un nuevo nivel de puntuación — el   */
  /* sistema de PUNTUACIÓN sigue exactamente igual (judgeNote decide solo */
  /* entre "perfect"/"great"/"miss", ver sección 6). "kind" aquí es SOLO  */
  /* una etiqueta de qué archivo de sonido buscar; "hold" se usa nada más */
  /* para el HOLD que se completa correctamente (que sigue puntuando      */
  /* como "perfect"), para poder darle su propio audio distinto si se     */
  /* quiere (p. ej. hold.mp3), sin tocar el puntaje.                      */
  /* ------------------------------------------------------------------ */

  var sfxCache = {}; // "songId:kind" -> HTMLAudioElement resuelto, o null si no existe

  function resolveResultSoundForSong(song, kind) {
    var cacheKey = (song ? song.id : "_") + ":" + kind;
    if (Object.prototype.hasOwnProperty.call(sfxCache, cacheKey)) return sfxCache[cacheKey];

    var path = (song && song.sfx && song.sfx[kind]) || (GLOBAL_SFX && GLOBAL_SFX[kind]) || null;
    if (!path) {
      sfxCache[cacheKey] = null;
      return null;
    }
    var audio = new Audio();
    audio.preload = "auto";
    audio.src = path;
    // Si el archivo no existe/falla, se recuerda como "no disponible" para
    // no reintentar cargar en cada golpe; playResultSound() ya cae sola al
    // sonido sintetizado en ese mismo golpe (no espera a este evento).
    audio.addEventListener(
      "error",
      function () {
        sfxCache[cacheKey] = null;
      },
      { once: true }
    );
    sfxCache[cacheKey] = audio;
    return audio;
  }

  function resolveResultSound(kind) {
    return resolveResultSoundForSong(getActiveSong(), kind);
  }

  // fallbackFn es el sonido sintetizado a usar si no hay archivo personalizado
  // (o si falla al reproducirse en este instante concreto).
  function playResultSound(kind, fallbackFn) {
    var fallback = typeof fallbackFn === "function" ? fallbackFn : function () {};
    var audio = resolveResultSound(kind);
    if (!audio) {
      fallback();
      return;
    }
    try {
      // cloneNode permite golpes seguidos (p. ej. combo rápido) sin cortar
      // el sonido del golpe anterior, que seguirá sonando su propia copia.
      var instance = audio.cloneNode(true);
      instance.volume = CONFIG.sfxVolume;
      var p = instance.play();
      if (p && typeof p.catch === "function") p.catch(fallback);
    } catch (e) {
      fallback();
    }
  }

  // Precarga (punto 16) SOLO los recursos de la canción indicada: su
  // portada, las imágenes/hitImages que use su chart (si trae uno propio) y
  // sus sonidos de resultado. Nunca precarga las demás canciones. Es segura
  // de llamar varias veces (el navegador cachea by URL) y jamás truena si
  // falta un archivo (Image()/Audio() fallan en silencio, igual que
  // preloadHitImages() ya hacía para los amigos).
  // 🎵 Precarga el MP3 en cuanto se selecciona la canción (punto 18 del
  // pedido), SIN reproducirlo: solo prepara el <audio> y le pide al
  // navegador que empiece a descargar/bufferear el archivo (load()), igual
  // que ya se hace con la portada/imágenes/sfx más abajo. startActiveSongAndThen()
  // (llamado al pulsar COMENZAR) ya comprueba `audio.dataset.apLoadedSrc`
  // antes de reasignar "src", así que si esta precarga ya puso el mismo
  // archivo, COMENZAR NO vuelve a descargarlo desde cero: solo hace
  // audio.currentTime = 0 y audio.play() — arranque más rápido y sin doble
  // descarga.
  function preloadSongAudio(song) {
    if (!song || !song.file) return;
    var audio = ensureSongAudioEl();
    if (audio.dataset.apLoadedSrc === song.file) return; // ya precargada
    audio.src = song.file;
    audio.dataset.apLoadedSrc = song.file;
    try {
      audio.load();
    } catch (e) {
      /* algunos navegadores lanzan si se llama load() en un estado raro; se ignora */
    }
    logAlways("[AMARIS PIANO] Audio source: " + song.file);

    var loggedOnce = false;
    function onLoadedOnce() {
      if (loggedOnce) return;
      loggedOnce = true;
      logAlways("[AMARIS PIANO] Audio loaded");
      audio.removeEventListener("canplaythrough", onLoadedOnce);
      audio.removeEventListener("loadeddata", onLoadedOnce);
    }
    audio.addEventListener("canplaythrough", onLoadedOnce, { once: true });
    audio.addEventListener("loadeddata", onLoadedOnce, { once: true });
  }

  function preloadSongAssets(song) {
    if (!song) return;
    preloadSongAudio(song); // 🎵 MP3 (punto 18) — nunca reproduce, solo precarga
    if (song.cover) {
      var coverImg = new Image();
      coverImg.src = song.cover;
    }
    if (Array.isArray(song.chart)) {
      song.chart.forEach(function (entry) {
        if (entry.image) {
          var i1 = new Image();
          i1.src = entry.image;
        }
        if (entry.hitImage) {
          var i2 = new Image();
          i2.src = entry.hitImage;
        }
      });
    }
    if (song.sfx) {
      Object.keys(song.sfx).forEach(function (kind) {
        resolveResultSoundForSong(song, kind);
      });
    }
  }

  function preloadGlobalSfx() {
    Object.keys(GLOBAL_SFX).forEach(function (kind) {
      resolveResultSoundForSong(null, kind);
    });
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
      '    <div class="amaris-piano-songlist" id="apSongList" hidden aria-label="Elegir canción"></div>' +
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
    els.songList = overlay.querySelector("#apSongList");
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
    preloadGlobalSfx();
    preloadSongAssets(getActiveSong());
    logSongSelected(getActiveSong());
    renderSongList();
    state.built = true;
  }

  // 🎵 Selector de canciones en la pantalla de inicio. Se muestra en
  // cuanto haya al menos una canción registrada (una sola canción se
  // muestra igual, ya marcada como activa; con ninguna registrada
  // todavía, se mantiene oculto). Elegir una llama internamente a la
  // misma AmarisPiano.setSong() ya existente, así que setSong() sigue
  // funcionando igual para quien la use desde fuera.
  // Log de diagnóstico (pedido explícito): cada vez que una canción queda
  // seleccionada como activa —al construir el juego por primera vez o al
  // tocarla en el selector— se informa cuál es y qué ruta de audio usará,
  // ANTES de que el jugador pulse COMENZAR.
  function logSongSelected(song) {
    if (!song) return;
    logAlways("[AMARIS PIANO] Song selected: " + (song.name || song.id));
    // "Audio source" se loguea desde preloadSongAudio() (llamado siempre
    // junto a esta función vía preloadSongAssets()), y SOLO la primera vez
    // que se asigna ese archivo — así no se duplica el mensaje cada vez
    // que se re-selecciona la misma canción.
  }

  function renderSongList() {
    if (!els.songList) return;
    if (PIANO_SONGS.length < 1) {
      els.songList.hidden = true;
      return;
    }
    els.songList.hidden = false;
    els.songList.innerHTML = "";
    var activeId = state.activeSongId || DEFAULT_SONG_ID;
    PIANO_SONGS.forEach(function (song) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "amaris-piano-song-btn";
      if (song.id === activeId) btn.classList.add("is-active");
      btn.textContent = song.name || song.id;
      btn.addEventListener("click", function () {
        state.activeSongId = song.id;
        preloadSongAssets(song); // punto 16: precargar justo al elegirla
        logSongSelected(song);
        renderSongList();
      });
      els.songList.appendChild(btn);
    });
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

    // El juego debe sentirse como una app: sin menú contextual, sin
    // selección de texto ni arrastre de imágenes al mantener presionado.
    // Se aplica SOLO al overlay del piano, nunca al resto de la página.
    els.overlay.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });
    els.overlay.addEventListener("selectstart", function (event) {
      event.preventDefault();
    });
    els.overlay.addEventListener("dragstart", function (event) {
      event.preventDefault();
    });

    // Carriles: Pointer Events completos (no solo "click"/pointerdown),
    // para soportar TAP y HOLD con varios dedos a la vez. Cada carril
    // captura su propio pointerId al bajar el dedo (setPointerCapture),
    // así el pointerup/pointercancel de ESE dedo sigue llegando a este
    // mismo carril aunque el dedo se mueva un poco fuera de él — clave
    // para que un HOLD no se pierda por un pequeño deslizamiento.
    els.lanes.forEach(function (laneEl) {
      laneEl.addEventListener("pointerdown", function (event) {
        event.preventDefault();
        try {
          laneEl.setPointerCapture(event.pointerId);
        } catch (e) {
          /* algunos navegadores/tipos de puntero no soportan capture; se ignora */
        }
        var lane = Number(laneEl.dataset.lane);
        handleLaneHit(lane, event.pointerId);
      });
      laneEl.addEventListener("pointerup", function (event) {
        event.preventDefault();
        releaseHold(event.pointerId, false);
      });
      laneEl.addEventListener("pointercancel", function (event) {
        releaseHold(event.pointerId, true);
      });
      // Resguardo extra para navegadores donde pointer capture no evita
      // el "pointerleave": releaseHold() es idempotente (no pasa nada si
      // ese pointerId no estaba sosteniendo ningún HOLD), así que no hay
      // riesgo de cortar un HOLD válido por accidente.
      laneEl.addEventListener("pointerleave", function (event) {
        releaseHold(event.pointerId, true);
      });
    });
  }

  function onKeyDown(event) {
    if (state.screen === "playing") {
      var idx = CONFIG.laneKeys.indexOf(event.key);
      if (idx !== -1) {
        event.preventDefault();
        // Evita que el auto-repeat de keydown (tecla mantenida) dispare
        // handleLaneHit() una y otra vez — un HOLD ya en curso se
        // mantiene con la propia tecla física presionada, no repitiendo.
        if (!state.pressedKeys[idx]) {
          state.pressedKeys[idx] = true;
          handleLaneHit(idx, "key" + idx);
        }
        return;
      }
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeGame();
    }
  }

  function onKeyUp(event) {
    var idx = CONFIG.laneKeys.indexOf(event.key);
    if (idx !== -1) {
      state.pressedKeys[idx] = false;
      releaseHold("key" + idx, false);
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
    // Distancia base del contenedor de carriles hasta la línea de golpe.
    // Cada nota calcula su propio recorrido a partir de esto y de su
    // propia altura (las HOLD son más altas que las TAP), para que el
    // borde inferior de CUALQUIER tecla llegue exactamente a la línea en
    // su hitTime, sin importar cuánto mida.
    var travelBase = hitRect.top - wrapRect.top;
    if (travelBase < 80) travelBase = 80; // resguardo en pantallas muy pequeñas
    var tapHeightPx = parseFloat(getComputedStyle(els.lanesWrap).getPropertyValue("--ap-note-height"));
    if (!tapHeightPx || isNaN(tapHeightPx)) tapHeightPx = 95; // resguardo si el navegador no expone la variable
    state.laneMetrics = {
      travelBase: travelBase,
      tapHeightPx: tapHeightPx,
      pxPerMs: travelBase / CONFIG.fallDuration
    };
  }

  // imageOverride/hitImageOverride (opcionales, punto 7-9 del pedido):
  // permiten que UNA nota puntual del chart use su propia imagen en vez de
  // la del "friend" que le tocó — sin afectar a ninguna otra nota ni a la
  // lógica de amigos/avatares, que sigue funcionando exactamente igual
  // cuando no se pasan.
  function createNoteElement(friendIndex, type, imageOverride, hitImageOverride) {
    var friend = FRIENDS[friendIndex % FRIENDS.length] || { name: "?", image: "" };
    var imgSrc = imageOverride || friend.image;
    var wrap = document.createElement("div");
    wrap.className = "amaris-piano-note " + (type === "hold" ? "amaris-piano-note--hold" : "amaris-piano-note--tap");

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

    // Indicador de progreso mientras se sostiene un HOLD (punto 7 del
    // pedido): una barra que se rellena de abajo hacia arriba conforme
    // avanza la duración musical. Solo existe en notas HOLD; no toca ni
    // afecta a las TAP en absoluto.
    if (type === "hold") {
      var fill = document.createElement("span");
      fill.className = "amaris-piano-note-holdfill";
      wrap.appendChild(fill);

      // 🕐 Indicador CIRCULAR de progreso (puntos 1-2 del pedido). Su
      // relleno se controla ÚNICAMENTE con la variable CSS
      // --ap-hold-progress (0 a 100), actualizada en tick() reutilizando
      // el MISMO cálculo que ya alimenta la barra lineal de arriba
      // (holdProgress) — nunca un segundo temporizador independiente que
      // pudiera desincronizarse. El estilo vive en hold-effects.css.
      var ringProgress = document.createElement("span");
      ringProgress.className = "amaris-piano-note-holdring";
      ringProgress.style.setProperty("--ap-hold-progress", "0");
      wrap.appendChild(ringProgress);

      // 🌈 Aura de energía (puntos 4-6): anillo de color que rota
      // alrededor de la tecla SOLO mientras se sostiene (ver .is-holding
      // en hold-effects.css). Puramente decorativo, no afecta hit-testing.
      var aura = document.createElement("span");
      aura.className = "amaris-piano-note-aura";
      wrap.appendChild(aura);
    }

    var img = document.createElement("img");
    img.className = "amaris-piano-note-img";
    img.alt = "";
    img.draggable = false;
    img.src = imgSrc;
    img.addEventListener("error", function () {
      // Si el error ocurre DESPUÉS de acertar (falló la hitImage, no la
      // imagen normal), no destruimos la nota con el avatar de iniciales:
      // simplemente nos quedamos mostrando la imagen normal, que ya se
      // había cargado bien.
      if (wrap.dataset.apHit === "1") {
        img.src = imgSrc;
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

  // hitAtMs es el "momento musical" de la nota (mismo dominio que
  // audio.currentTime*1000, o que el reloj de respaldo si no hay canción).
  // spawnTime se deriva de ahí (punto 16): la nota simplemente aparece
  // "fallDuration" ms antes de su hitTime.
  //
  // type: "tap" (por defecto) o "hold". Para "hold", durationMs es cuánto
  // hay que mantener presionado; la tecla se dibuja más larga en
  // proporción a esa duración (misma velocidad de caída que las TAP, así
  // nunca se desincroniza del audio: no es una animación CSS aparte).
  // imageOverride/hitImageOverride (opcionales, puntos 7-9 del pedido):
  // imagen específica de ESTA nota puntual, tal como puede venir de un
  // chart.json ({ "image": "...", "hitImage": "..." }). Sin ellas, el
  // comportamiento es IDÉNTICO al de siempre (imagen del "friend").
  function spawnNote(lane, friendIndex, hitAtMs, type, durationMs, imageOverride, hitImageOverride) {
    type = type === "hold" ? "hold" : "tap";
    durationMs = type === "hold" ? Math.max(300, durationMs || 0) : 0;

    var friend = FRIENDS[friendIndex % FRIENDS.length] || null;
    var metrics = state.laneMetrics || { travelBase: 300, tapHeightPx: 95, pxPerMs: 300 / CONFIG.fallDuration };

    // LONGITUD VISUAL vs DURACIÓN MUSICAL (punto 6 del pedido): "durationMs"
    // sigue siendo exactamente lo que decide cuánto hay que sostener la
    // tecla (holdDeadline, más abajo) y nunca se modifica. Lo único que
    // cambia con holdLengthMultiplier es la ALTURA con la que se dibuja
    // el bloque, para que un HOLD largo no se sienta eterno en pantalla.
    var visualDurationMs = type === "hold" ? durationMs * CONFIG.holdLengthMultiplier : 0;
    var heightPx = type === "hold" ? Math.max(metrics.tapHeightPx, visualDurationMs * metrics.pxPerMs) : metrics.tapHeightPx;
    var travelPx = Math.max(40, metrics.travelBase - heightPx);

    var el = createNoteElement(friendIndex, type, imageOverride, hitImageOverride);
    if (type === "hold") el.style.height = heightPx.toFixed(1) + "px";

    var note = {
      id: ++noteIdSeq,
      lane: lane,
      friend: friend,
      type: type,
      duration: durationMs, // duración MUSICAL real, intacta
      spawnTime: hitAtMs - CONFIG.fallDuration,
      hitTime: hitAtMs,
      judged: false,
      holdActive: false, // true mientras algún dedo/tecla sostiene esta nota HOLD
      holdPointerId: null, // pointerId (o "key0".."key3") que la está sosteniendo
      holdDeadline: hitAtMs + durationMs,
      travelPx: travelPx,
      // Imagen a mostrar al acertar (puntos 7-9): la de la nota si se dio
      // una, si no la del "friend" si tiene una, si no ninguna (se
      // mantiene la imagen normal, comportamiento de siempre).
      hitImageSrc: hitImageOverride || (friend && friend.hitImage) || null,
      // Referencias directas a la barra/anillo de progreso (o null en TAP),
      // guardadas una sola vez aquí para no tener que buscarlas con
      // querySelector en cada frame de tick() — importante para mantener
      // 60 FPS en móvil.
      fillEl: type === "hold" ? el.querySelector(".amaris-piano-note-holdfill") : null,
      circleEl: type === "hold" ? el.querySelector(".amaris-piano-note-holdring") : null,
      el: el
    };
    bindNoteEvents(note);
    els.lanes[lane].appendChild(el);
    state.notes.push(note);
  }

  function spawnFromAutoGenerator(elapsedMs) {
    if (state.chart) return; // si hay chart fijo, no se auto-genera
    if (elapsedMs >= CONFIG.gameDuration) return; // ya no toca generar más

    if (elapsedMs >= state.lastSpawnTime + state.nextSpawnIn) {
      var lane = Math.floor(Math.random() * CONFIG.lanes);
      // Si hay análisis de audio disponible, la energía actual modula:
      // (a) qué tan seguido caen notas, y (b) la probabilidad de que sea
      // un HOLD en vez de un TAP — así la generación automática "seguirá"
      // un poco la música en vez de ser puramente aleatoria (punto 13).
      // Si no hay análisis (o falló), se comporta exactamente como antes.
      var energy = getAudioEnergy();
      var isHold = Math.random() < (energy !== null && energy > 0.55 ? 0.32 : 0.16);
      var duration = isHold ? 500 + Math.floor(Math.random() * 900) : 0;

      spawnNote(lane, pickFriendIndex(), elapsedMs + CONFIG.fallDuration, isHold ? "hold" : "tap", duration);
      state.lastSpawnTime = elapsedMs;

      var range = CONFIG.spawnInterval.max - CONFIG.spawnInterval.min;
      var base = CONFIG.spawnInterval.min + Math.random() * range;
      state.nextSpawnIn = energy !== null ? base * (1 - energy * 0.35) : base;
    }
  }

  function spawnFromChart(elapsedMs) {
    if (!state.chart) return;
    while (
      state.chartIndex < state.chart.length &&
      state.chart[state.chartIndex].time <= elapsedMs + CONFIG.fallDuration
    ) {
      var entry = state.chart[state.chartIndex];
      spawnNote(entry.lane, entry.friend || 0, entry.time, entry.type, entry.duration, entry.image, entry.hitImage);
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
    var src = note.hitImageSrc;
    if (!src) return;

    var img = note.el.querySelector(".amaris-piano-note-img");
    if (!img) return; // ya cayó al avatar de iniciales antes de acertar

    note.el.dataset.apHit = "1";
    img.src = src;
  }

  function judgeNote(note, kind) {
    note.judged = true;
    note.holdActive = false;
    note.el.classList.remove("is-holding");
    if (note.holdPointerId !== null && note.holdPointerId !== undefined) {
      state.activeHolds.delete(note.holdPointerId);
    }
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
      // Un HOLD completado sigue puntuando como "perfect" (sin cambios),
      // pero puede tener su PROPIO sonido ("hold") en vez del de un tap
      // perfecto — es solo una etiqueta de sonido, no un nuevo puntaje.
      var soundKind = note.type === "hold" ? "hold" : kind;
      var lane = note.lane;
      playResultSound(soundKind, function () {
        playPianoNote(lane);
      });
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
      playResultSound("miss", playMissThud);
    }

    updateHUD();

    window.setTimeout(function () {
      if (note.el.parentNode) note.el.parentNode.removeChild(note.el);
      var idx = state.notes.indexOf(note);
      if (idx !== -1) state.notes.splice(idx, 1);
    }, 180);
  }

  // Busca, dentro de un carril, la nota activa (visible y sin juzgar) más
  // cercana en el tiempo a "ahora" — sin importar en qué punto de su
  // caída esté visualmente. Es lo que permite tocar una nota apenas
  // aparece, no solo cuando llega a la línea (puntos 1 y 6).
  function findActiveNoteInLane(lane, elapsedMs) {
    var best = null;
    var bestAbsDiff = Infinity;
    state.notes.forEach(function (note) {
      if (note.judged || note.lane !== lane) return;
      if (note.type === "hold" && note.holdActive) return; // ya la está sosteniendo otro dedo/tecla
      if (elapsedMs < note.spawnTime) return; // todavía no aparece en pantalla
      var absDiff = Math.abs(elapsedMs - note.hitTime);
      if (absDiff < bestAbsDiff) {
        best = note;
        bestAbsDiff = absDiff;
      }
    });
    return best;
  }

  // ÚNICO punto de entrada que decide qué pasa cuando el jugador "activa"
  // una nota concreta — sin importar si el pointerdown ocurrió
  // directamente sobre la tecla (prioridad 1, ver bindNoteEvents) o llegó
  // como respaldo desde el carril (prioridad 2, ver handleLaneHit).
  //
  // REGLA CLAVE (punto 14 del pedido): la posición/tiempo de la nota
  // NUNCA decide si el toque se recibe. PRIMERO se recibe el input y se
  // activa la nota; el "diff" contra hitTime se usa ÚNICAMENTE para
  // matizar el puntaje (PERFECT si el toque cae cerca del tiempo musical,
  // GREAT en cualquier otro caso). Ya no existe una ventana que rechace
  // el toque por "demasiado pronto": eso era, en la práctica, lo que
  // hacía que la tecla solo respondiera cerca de la línea inferior,
  // porque el tiempo de vuelo de una nota está perfectamente sincronizado
  // con su posición vertical.
  function handleNoteHit(note, pointerId) {
    if (note.judged) return;

    // 🔊 Red de seguridad barata (punto 27: "audio que se detiene"): si el
    // AudioContext compartido (usado por playPianoNote() y, cuando no hay
    // chart, por el analizador de energía) llegara a suspenderse solo por
    // políticas del navegador móvil, cualquier toque lo reanuda al vuelo.
    // resumeAudio() ya comprueba internamente si hace falta, así que
    // llamarlo aquí en cada toque no tiene costo perceptible.
    resumeAudio();

    var elapsed = getElapsedMs();
    var diff = elapsed - note.hitTime;

    if (note.type === "hold") {
      if (note.holdActive) return; // ya la está sosteniendo otro dedo/tecla
      logDebug("[AMARIS PIANO] Input: HOLD (lane " + note.lane + ")");
      note.holdActive = true;
      note.holdPointerId = pointerId;
      state.activeHolds.set(pointerId, note);
      showHitImage(note);
      note.el.classList.add("is-holding", "is-hit");
      flashHitline();
      // Ráfaga de partículas de "energía" al EMPEZAR a sostener (punto 3):
      // es un único evento (no continuo), así que no afecta el rendimiento.
      burstParticles(els.lanes[note.lane]);
      playPianoNote(note.lane);
      if (navigator.vibrate) {
        try {
          navigator.vibrate(10);
        } catch (e) {
          /* se ignora si el navegador no da permiso */
        }
      }
      return;
    }

    logDebug("[AMARIS PIANO] Input: TAP (lane " + note.lane + ")");
    var kind = Math.abs(diff) <= CONFIG.hitWindow.perfect ? "perfect" : "great";
    judgeNote(note, kind);
  }

  // RESPALDO (prioridad 2, punto 15): solo se usa cuando el toque llegó al
  // carril pero no directamente sobre ninguna tecla (p. ej. el pequeño
  // margen alrededor de una nota angosta). Nunca "roba" el toque de otra
  // nota ya manejada por su propio listener (ver bindNoteEvents, que
  // detiene la propagación), y nunca mira en qué carril NO fue el toque.
  function handleLaneHit(lane, pointerId) {
    if (state.screen !== "playing") return;
    var elapsed = getElapsedMs();
    var best = findActiveNoteInLane(lane, elapsed);
    if (!best) return; // toque sin nota activa en este carril: no penaliza, no pasa nada
    handleNoteHit(best, pointerId);
  }

  // Enlaza pointerdown/pointerup/pointercancel DIRECTAMENTE sobre el
  // elemento de la nota (punto 3 y 8 del pedido): así el jugador toca la
  // propia tecla, en cualquier parte de su superficie, no solo el carril.
  // Cada nota se cierra sobre su propio objeto "note" (closure), así que
  // no hace falta ninguna búsqueda: el pointerdown activa ESA nota, ya.
  function bindNoteEvents(note) {
    var el = note.el;

    el.addEventListener("pointerdown", function (event) {
      if (state.screen !== "playing" || note.judged) return;
      if (note.type === "hold" && note.holdActive) return;
      event.preventDefault();
      // Detiene la propagación al carril: la tecla tocada directamente
      // tiene prioridad absoluta sobre la búsqueda de respaldo del carril.
      event.stopPropagation();
      try {
        el.setPointerCapture(event.pointerId);
      } catch (e) {
        /* algunos navegadores/tipos de puntero no soportan capture; se ignora */
      }
      handleNoteHit(note, event.pointerId);
    });

    el.addEventListener("pointerup", function (event) {
      event.preventDefault();
      event.stopPropagation();
      releaseHold(event.pointerId, false);
    });

    el.addEventListener("pointercancel", function (event) {
      event.stopPropagation();
      releaseHold(event.pointerId, true);
    });
  }

  // Soltar el dedo/tecla que sostenía un HOLD. Usa el Map activeHolds
  // (pointerId → nota), así varios dedos pueden sostener HOLDs distintos
  // sin pisarse entre sí (punto 7). Si se suelta demasiado pronto (antes
  // de holdDeadline, con un pequeño margen de tolerancia), el HOLD falla
  // como MISS; si se sostuvo lo suficiente, se completa como acierto. Es
  // idempotente: si ese pointerId no estaba sosteniendo nada (o la nota
  // ya fue juzgada, p. ej. porque tick() ya la completó por tiempo),
  // simplemente no hace nada — seguro de llamar desde varios listeners
  // distintos (pointerup/cancel/leave, tanto de la nota como del carril).
  function releaseHold(pointerId, isCancel) {
    var note = state.activeHolds.get(pointerId);
    if (!note) return;
    state.activeHolds.delete(pointerId);
    if (note.judged || !note.holdActive) return;

    var elapsed = getElapsedMs();
    note.holdActive = false;

    if (isCancel || elapsed < note.holdDeadline - CONFIG.hitWindow.great) {
      judgeNote(note, "miss");
    } else {
      judgeNote(note, "perfect");
    }
  }

  function tick() {
    var elapsed = getElapsedMs();

    // Log de sincronización (punto 31), limitado a 1 vez por segundo: tick()
    // corre a 60fps vía requestAnimationFrame, así que loguear esto en cada
    // frame inundaría la consola y costaría rendimiento en móvil — por eso
    // se limita aquí, y además solo se emite con debug=true.
    if (state.debug && elapsed - state.lastDebugLogAt >= 1000) {
      state.lastDebugLogAt = elapsed;
      logDebug("[AMARIS PIANO] Audio currentTime: " + (elapsed / 1000).toFixed(2) + "s");
    }

    spawnFromChart(elapsed);
    spawnFromAutoGenerator(elapsed);

    var missCutoff = CONFIG.hitWindow.great;
    var allDone = true;

    state.notes.forEach(function (note) {
      if (note.judged) return;
      allDone = false;

      // Misma velocidad de caída siempre (sin acelerar tras la línea).
      // BUG FIX: el progreso se limita a 1 (nunca pasa de la línea): antes,
      // un HOLD largo sostenido más allá de "fallDuration" seguía
      // deslizándose hacia abajo indefinidamente, saliéndose del tablero.
      // Ahora el bloque queda fijo justo en la línea mientras se sostiene,
      // como en un juego de ritmo real. translate3d en vez de translateY
      // para que el navegador use aceleración por GPU (mejor rendimiento
      // en teléfonos).
      var progress = (elapsed - note.spawnTime) / CONFIG.fallDuration;
      if (progress > 1) progress = 1;
      if (progress < 0) progress = 0;
      note.el.style.transform = "translate3d(0, " + (progress * note.travelPx).toFixed(1) + "px, 0)";

      if (note.type === "hold" && note.holdActive) {
        // Barra de progreso del HOLD (punto 7): se rellena de 0% a 100%
        // conforme avanza la duración MUSICAL real (note.duration), sin
        // relación con la altura visual reducida por holdLengthMultiplier.
        if (note.duration > 0) {
          var holdProgress = (elapsed - note.hitTime) / note.duration;
          if (holdProgress < 0) holdProgress = 0;
          if (holdProgress > 1) holdProgress = 1;
          if (note.fillEl) note.fillEl.style.height = (holdProgress * 100).toFixed(1) + "%";
          // Indicador circular (puntos 1-2): MISMO holdProgress de arriba,
          // nunca un segundo cálculo — así nunca puede desincronizarse del
          // tiempo real que falta para terminar el HOLD.
          if (note.circleEl) note.circleEl.style.setProperty("--ap-hold-progress", (holdProgress * 100).toFixed(1));
        }
        // Mientras se sostiene, no aplica el corte de MISS por tiempo:
        // solo importa si se llegó a la duración completa.
        if (elapsed >= note.holdDeadline) {
          note.holdActive = false;
          judgeNote(note, "perfect");
        }
        return;
      }

      if (elapsed - note.hitTime > missCutoff) {
        judgeNote(note, "miss");
      } else if (elapsed >= note.hitTime - 120) {
        note.el.classList.add("is-near");
      }
    });

    var spawningDone = state.chart ? state.chartIndex >= state.chart.length : elapsed >= CONFIG.gameDuration;

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
    // Refresca el resaltado del selector por si setSong() se llamó desde
    // fuera (API pública) mientras el juego estaba en otra pantalla.
    if (name === "start") renderSongList();
  }

  function startGame() {
    // 🔒 BUG FIX (punto 27: doble tap en COMENZAR/JUGAR OTRA VEZ). Si ya
    // hay una partida en curso, o ya se pulsó COMENZAR y todavía se está
    // esperando la confirmación del audio, ignorar esta llamada extra —
    // evita dos bucles tick() (rAF) y dos <audio>.play() superpuestos.
    if (state.isStarting || state.screen === "playing") return;
    state.isStarting = true;

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

        // 5) Inicializar el reloj de la partida y las notas. gameStartTime
        //    sigue existiendo como respaldo (getElapsedMs() lo usa si no
        //    hay canción sonando); lastSpawnTime/nextSpawnIn ahora viven
        //    en el mismo dominio "ms transcurridos" que usa getElapsedMs(),
        //    así que empiezan en 0, no en performance.now().
        state.gameStartTime = performance.now();
        state.lastSpawnTime = 0;
        state.nextSpawnIn = CONFIG.spawnInterval.min;
        state.lastDebugLogAt = 0;
        state.chartIndex = 0;
        state.pressedKeys = {};
        state.activeHolds.clear();

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

        if (state.chart) {
          logAlways("[AMARIS PIANO] Chart loaded: " + state.chart.length + " notas (" +
            (state.externalChart ? "chart externo" : "chart de " + (song ? song.name || song.id : "canción")) + ")");
        } else {
          logAlways("[AMARIS PIANO] Chart loaded: ninguno — generación automática de notas");
        }

        // Análisis de energía del audio (opcional, ver getAudioEnergy):
        // SOLO tiene efecto y SOLO se conecta cuando NO hay chart, para
        // modular el generador automático. 🐛 BUG FIX (audio que se
        // detiene / se silencia sin razón aparente): createMediaElementSource()
        // engancha el <audio> de la canción al grafo de Web Audio API de
        // forma IRREVERSIBLE — a partir de ahí, si ese AudioContext se
        // suspende (algo que Safari/Chrome móvil pueden hacer solos, p. ej.
        // al bloquear pantalla), el audio se queda mudo aunque siga
        // "reproduciéndose" (audio.paused sigue en false y currentTime
        // sigue avanzando). Antes se conectaba SIEMPRE, incluso cuando la
        // canción ya traía su propio chart y el análisis de energía no se
        // iba a usar para nada — un riesgo innecesario justo para el caso
        // real de este proyecto (canción con chart.json). Si falla o no es
        // soportado, no pasa nada: el generador automático sigue igual.
        if (!state.chart) {
          try {
            ensureSongAnalyser();
          } catch (e) {
            /* se ignora: el juego sigue funcionando sin análisis de energía */
          }
        }

        // 6) Iniciar requestAnimationFrame → 7) comienza el juego
        state.isStarting = false; // la partida ya arrancó de verdad
        state.rafId = window.requestAnimationFrame(tick);
      });
    });
  }

  function endGame() {
    state.isStarting = false;
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
    state.isStarting = false;
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
    state.pressedKeys = {};
    state.activeHolds.clear();
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

  // 🔊 BUG FIX (punto 27: "audio que se detiene" en móvil). Algunos
  // navegadores móviles (sobre todo Safari/iOS) suspenden el AudioContext
  // compartido al bloquear la pantalla o cambiar de app, y no siempre lo
  // reanudan solos al volver — aunque el propio <audio> de la canción siga
  // "reproduciéndose" técnicamente. Escuchar "visibilitychange" mientras el
  // piano está abierto y reanudar el contexto en cuanto la pestaña vuelve a
  // ser visible es la red de seguridad estándar para este problema.
  function handleVisibilityChange() {
    if (document.visibilityState === "visible") resumeAudio();
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

    state.pressedKeys = {};
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", measureLaneMetrics);
    // orientationchange (girar el teléfono) no siempre dispara "resize" a
    // tiempo en todos los navegadores móviles; se recalcula aparte, con un
    // pequeño margen para que el viewport termine de asentarse.
    window.addEventListener("orientationchange", handleOrientationChange);
    // Evita que un arrastre sobre el fondo oscuro del modal "jale" y
    // rebote la página de Amaris World detrás (efecto rubber-band de
    // iOS Safari). Los carriles siguen recibiendo su propio touch-action.
    els.overlay.addEventListener("touchmove", preventBackgroundScroll, { passive: false });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    window.setTimeout(function () {
      els.startBtn.focus();
    }, 50);
  }

  function closeGame() {
    if (!state.built) return;

    state.isStarting = false;
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
    document.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("resize", measureLaneMetrics);
    window.removeEventListener("orientationchange", handleOrientationChange);
    els.overlay.removeEventListener("touchmove", preventBackgroundScroll);
    document.removeEventListener("visibilitychange", handleVisibilityChange);

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
      var song = getSongById(id);
      if (song) {
        state.activeSongId = id;
        logSongSelected(song);
        preloadSongAssets(song); // punto 16/18
      }
    },

    // ---- Añadido para música/imágenes/sonido personalizados (puntos 10-16)
    // Registra una canción MÁS sin tocar el arreglo PIANO_SONGS. Pensado
    // para piano-music-loader.js (opcional); también se puede llamar a
    // mano. No hace nada si el id ya existe (evita duplicados). Devuelve
    // true/false para saber si se registró.
    addSong: function (song) {
      if (!song || !song.id || !song.file) return false;
      if (getSongById(song.id)) return false;
      PIANO_SONGS.push(song);

      // 🐛 BUG FIX (selector que no selecciona la canción correcta, punto
      // 27): PIANO_SONGS empieza VACÍO a propósito (ver comentario junto a
      // su declaración), así que DEFAULT_SONG_ID se calculaba UNA sola vez
      // al cargar el archivo y quedaba en null para siempre — incluso
      // después de registrar canciones con addSong(). getActiveSong() ya
      // caía de respaldo en PIANO_SONGS[0], así que la canción SÍ sonaba
      // bien con una sola canción registrada, pero el selector nunca la
      // marcaba visualmente como activa (".is-active") hasta que el
      // jugador la tocaba a mano. Aquí se fija explícitamente la PRIMERA
      // canción registrada como activa de verdad — y se precarga su MP3
      // de inmediato (punto 18), sin esperar a que se abra el juego.
      if (!state.activeSongId) {
        state.activeSongId = song.id;
        logSongSelected(song);
        preloadSongAssets(song);
      }

      renderSongList(); // refresca el selector si el juego ya construyó su DOM
      return true;
    },

    // Reemplaza el chart de una canción YA registrada (para cuando su
    // chart.json se carga de forma asíncrona, después de addSong()).
    setSongChart: function (id, chart) {
      var song = getSongById(id);
      if (!song || !Array.isArray(chart)) return false;
      song.chart = chart.slice().sort(function (a, b) {
        return a.time - b.time;
      });
      logAlways("[AMARIS PIANO] Chart loaded: " + song.chart.length + " notas (" + (song.name || song.id) + ")");
      return true;
    },

    // Ajusta el volumen de música/sonidos en caliente (punto 15). Ambos
    // parámetros son opcionales y van de 0 (mudo) a 1 (volumen completo).
    setVolume: function (opts) {
      opts = opts || {};
      if (typeof opts.music === "number") {
        CONFIG.musicVolume = Math.max(0, Math.min(1, opts.music));
        if (state.songAudio) state.songAudio.volume = CONFIG.musicVolume;
      }
      if (typeof opts.sfx === "number") {
        CONFIG.sfxVolume = Math.max(0, Math.min(1, opts.sfx));
      }
    },

    // ---- Añadido SOLO para piano-mobile.js (capa de adaptación móvil) --
    // Ninguno de estos 4 métodos cambia, duplica ni reemplaza nada del
    // GAME CORE: son accesos de lectura/utilidad para que el adaptador
    // móvil pueda reaccionar (recalcular tamaños, saber si el juego está
    // abierto/jugando) sin tocar el estado interno directamente.
    recalcLayout: function () {
      // Misma measureLaneMetrics() que ya usa el juego en PC al abrir,
      // redimensionar o rotar — no es un segundo cálculo de layout.
      if (state.built && state.screen === "playing") measureLaneMetrics();
    },
    isOpen: function () {
      return !!(els.overlay && els.overlay.classList.contains("is-open"));
    },
    isPlaying: function () {
      return state.screen === "playing";
    },
    getOverlayElement: function () {
      return els.overlay || null;
    },

    // 🔎 Punto 31 del pedido: "modo debug controlado". Los logs de baja
    // frecuencia (canción, fuente de audio, cargado/reproduciéndose, chart)
    // siempre se muestran; esto solo enciende/apaga los de ALTA frecuencia
    // (cada TAP/HOLD, el currentTime cada segundo). Por defecto están
    // encendidos (state.debug = true) para poder verificar todo desde el
    // primer momento; llama a AmarisPiano.setDebug(false) para silenciarlos
    // una vez comprobado que todo funciona.
    setDebug: function (enabled) {
      state.debug = !!enabled;
    }
  };

  // Ejemplo de chart (desactivado por defecto: se usa auto-generación).
  // Para sincronizar con una canción real, descomenta y ajusta tiempos.
  // "time" es en ms desde el INICIO DE LA CANCIÓN. type es opcional
  // ("tap" por defecto); duration solo aplica a type:"hold".
  //
  // window.AmarisPiano.setChart([
  //   { time: 1000, lane: 0, friend: 0, type: "tap" },
  //   { time: 1500, lane: 1, friend: 1, type: "tap" },
  //   { time: 2000, lane: 2, friend: 2, type: "hold", duration: 1000 },
  //   { time: 3200, lane: 3, friend: 3, type: "tap" }
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
