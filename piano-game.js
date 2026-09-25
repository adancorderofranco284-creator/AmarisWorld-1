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
       time en ms desde el inicio de la partida.

   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* 1) CONFIGURACIÓN — edita aquí para ajustar el juego                 */
  /* ------------------------------------------------------------------ */

  // 🧑‍🤝‍🧑 Agrega o quita amigos modificando SOLO este arreglo.
  // Las imágenes van en assets/friends/. Si una no carga, el juego usa
  // automáticamente un avatar de respaldo (inicial + color), sin romperse.
  var FRIENDS = [
    { id: "amaris", name: "Amaris", image: "assets/friends/amaris.webp" },
    { id: "amigo1", name: "Amigo 1", image: "assets/friends/amigo1.webp" },
    { id: "amigo2", name: "Amigo 2", image: "assets/friends/amigo2.webp" },
    { id: "amigo3", name: "Amigo 3", image: "assets/friends/amigo3.webp" },
    { id: "amigo4", name: "Amigo 4", image: "assets/friends/amigo4.webp" }
  ];

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
    chart: null, // si se define con setChart(), se usa en vez de auto-generar
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
    previousHtmlOverflow: ""
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
    state.built = true;
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

    var glow = document.createElement("span");
    glow.className = "amaris-piano-note-glow";
    wrap.appendChild(glow);

    var img = document.createElement("img");
    img.className = "amaris-piano-note-img";
    img.alt = "";
    img.draggable = false;
    img.src = friend.image;
    img.addEventListener("error", function () {
      wrap.classList.add("amaris-piano-note--fallback");
      var colorIdx = Math.abs(hashString(friend.id || friend.name || "?")) % CONFIG.friendAvatarColors.length;
      wrap.style.setProperty("--ap-fallback-color", CONFIG.friendAvatarColors[colorIdx]);
      wrap.removeChild(img);
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
    var note = {
      id: ++noteIdSeq,
      lane: lane,
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

  function burstParticles(laneEl) {
    var burst = document.createElement("span");
    burst.className = "amaris-piano-burst";
    burst.style.bottom = "var(--ap-hitline-offset)";
    laneEl.appendChild(burst);
    window.setTimeout(function () {
      if (burst.parentNode) burst.parentNode.removeChild(burst);
    }, 420);
  }

  function judgeNote(note, kind) {
    note.judged = true;
    note.el.classList.add("is-judged", "is-" + kind);
    var laneEl = els.lanes[note.lane];

    if (kind === "perfect" || kind === "great") {
      state.combo += 1;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      var points = kind === "perfect" ? CONFIG.scoring.perfect : CONFIG.scoring.great;
      state.score += points;
      if (kind === "perfect") state.perfectCount++;
      else state.greatCount++;

      showFeedback(kind === "perfect" ? "PERFECT +100" : "GREAT +50", kind);
      burstParticles(laneEl);
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

    // 2) Esperar a que el navegador pinte ese cambio (un frame) antes de
    //    calcular dimensiones reales.
    window.cancelAnimationFrame(state.rafId);
    window.requestAnimationFrame(function () {
      // 3) Calcular dimensiones reales / 4) posición de la línea de precisión
      measureLaneMetrics();

      // 5) Inicializar el reloj de la partida y las notas
      state.gameStartTime = performance.now();
      state.lastSpawnTime = state.gameStartTime;
      state.nextSpawnIn = CONFIG.spawnInterval.min;
      state.chartIndex = 0;

      // 6) Iniciar requestAnimationFrame → 7) comienza el juego
      state.rafId = window.requestAnimationFrame(tick);
    });
  }

  function endGame() {
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
    clearNotes();

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
    setChart: function (chart) {
      state.chart = Array.isArray(chart) ? chart.slice().sort(function (a, b) {
        return a.time - b.time;
      }) : null;
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
})();
