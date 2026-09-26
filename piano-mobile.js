/* ==========================================================================
   AMARIS WORLD — piano-mobile.js
   CAPA DE ADAPTACIÓN MÓVIL para Amaris Piano.

   ARQUITECTURA (ver respuesta del chat para el detalle completo):

     GAME CORE  (piano-game.js)  →  score, combo, judge, notas, charts,
                                     audio, hitImage, HOLD, TAP — TODO
                                     esto es UN SOLO camino de código,
                                     compartido por PC y por móvil.

     PC INPUT   (dentro de piano-game.js) → mouse + teclado, ya
                                     enganchados sobre el mismo
                                     pointerdown/up/cancel de siempre.

     MOBILE INPUT → en realidad NO EXISTE como código aparte: los
                    carriles y las notas en piano-game.js usan Pointer
                    Events (pointerdown/pointerup/pointercancel), que el
                    propio navegador unifica para mouse, lápiz, touch y
                    multitouch en el MISMO listener. Por eso este archivo
                    no define ningún manejador de toque nuevo — hacerlo
                    sería crear un segundo sistema de input, justo lo que
                    se pidió evitar.

     Lo que SÍ hace este archivo es la parte de PRESENTACIÓN + fiabilidad
     de resize que es genuinamente distinta en un teléfono:

       1) detectar capacidades táctiles (no User-Agent);
       2) marcar el overlay del juego con una clase CSS para que
          piano-mobile.css pueda ajustar tamaños/espacios SOLO ahí;
       3) usar window.visualViewport (cuando existe) para recalcular el
          layout de forma más fiable que "resize" cuando aparece/
          desaparece la barra de direcciones del navegador móvil,
          llamando a AmarisPiano.recalcLayout() — que es la MISMA
          measureLaneMetrics() interna que ya usa el juego en PC;
       4) mostrar una pantalla simple "GIRA TU TELÉFONO" cuando el juego
          está abierto en un dispositivo táctil y el teléfono está en
          horizontal, sin pausar ni reiniciar música/score/combo/notas:
          el GAME CORE sigue corriendo exactamente igual debajo, así que
          al volver a vertical la partida continúa donde iba.

   NO SE TOCA (y no hace falta): audio/AudioContext (ya se reanuda con
   resumeAudio() en el propio botón "COMENZAR" del GAME CORE, que ya es
   una interacción real del usuario), charts, hitTime, duration,
   spawnTime, velocidad de caída ni holdLengthMultiplier — son
   exactamente los mismos en PC y en móvil.

   Depende de 4 métodos que piano-game.js expone en window.AmarisPiano
   SOLO para este archivo: recalcLayout(), isOpen(), isPlaying() y
   getOverlayElement(). Si por alguna razón no existieran (versión vieja
   de piano-game.js), este archivo se desactiva solo, sin romper nada.

   Se carga DESPUÉS de piano-game.js?v=3 en index.html.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* 1) DETECCIÓN POR CAPACIDADES (punto 3 del pedido)                    */
  /* No es User-Agent: una laptop con pantalla táctil sigue funcionando   */
  /* con mouse/teclado con total normalidad, ambos caminos conviven.      */
  /* ------------------------------------------------------------------ */
  var isTouchDevice =
    (typeof navigator.maxTouchPoints === "number" && navigator.maxTouchPoints > 0) ||
    (typeof navigator.msMaxTouchPoints === "number" && navigator.msMaxTouchPoints > 0) ||
    "ontouchstart" in window;

  var overlayEl = null; // referencia una vez que piano-game.js la construye
  var rotateEl = null; // pantalla "GIRA TU TELÉFONO", creada bajo demanda
  var recalcTimer = null;

  function getApi() {
    var api = window.AmarisPiano;
    return api && typeof api.getOverlayElement === "function" ? api : null;
  }

  /* ------------------------------------------------------------------ */
  /* 2) ENGANCHAR EL OVERLAY EN CUANTO EXISTE                             */
  /* buildDOM() dentro de piano-game.js crea el overlay la primera vez    */
  /* que se llama a AmarisPiano.open(). Se usa un MutationObserver, igual */
  /* que en piano-star-hook.js, para no depender del orden de apertura    */
  /* ni tocar piano-game.js más allá de los 4 métodos ya expuestos.       */
  /* ------------------------------------------------------------------ */
  function ensureOverlayHook() {
    if (overlayEl) return true;
    var api = getApi();
    var el = api ? api.getOverlayElement() : null;
    if (!el) return false;

    overlayEl = el;

    // Clase puramente de PRESENTACIÓN (piano-mobile.css la usa para
    // ajustar tamaños/espacios SOLO en táctil). No coincide con ninguna
    // clase que ya use piano-game.js/css (is-open, is-holding, is-hit,
    // is-judged...), así que no hay riesgo de choque ni de romper nada.
    if (isTouchDevice) overlayEl.classList.add("is-touch-device");

    createRotatePrompt();

    // Detecta cuándo el juego se abre/cierra observando el cambio de la
    // clase "is-open" que ya pone/quita openGame()/closeGame(), sin
    // necesidad de modificar esas funciones.
    var openStateObserver = new MutationObserver(updateRotatePrompt);
    openStateObserver.observe(overlayEl, { attributes: true, attributeFilter: ["class"] });
    updateRotatePrompt();

    return true;
  }

  function watchForOverlay() {
    if (ensureOverlayHook()) return;
    var target = document.body;
    var observer = new MutationObserver(function () {
      if (ensureOverlayHook()) observer.disconnect();
    });
    observer.observe(target, { childList: true });
  }

  /* ------------------------------------------------------------------ */
  /* 3) PANTALLA "GIRA TU TELÉFONO" (punto 17 del pedido)                 */
  /* Solo aparece si: dispositivo táctil + overlay abierto (is-open) +    */
  /* teléfono en horizontal. Es un elemento puramente visual POR ENCIMA   */
  /* del juego — la música, el score, el combo y las notas del GAME CORE  */
  /* siguen corriendo exactamente igual detrás. Al volver a vertical la   */
  /* partida continúa donde iba, sin reiniciar nada.                      */
  /* ------------------------------------------------------------------ */
  function createRotatePrompt() {
    if (rotateEl || !overlayEl) return;
    rotateEl = document.createElement("div");
    rotateEl.className = "amaris-mobile-rotate";
    rotateEl.setAttribute("aria-hidden", "true");
    rotateEl.innerHTML =
      '<div class="amaris-mobile-rotate-icon">↕</div>' +
      '<p class="amaris-mobile-rotate-text">GIRA TU TELÉFONO</p>' +
      '<p class="amaris-mobile-rotate-sub">Amaris Piano se juega en vertical</p>';
    overlayEl.appendChild(rotateEl);
  }

  function isLandscape() {
    if (window.matchMedia) return window.matchMedia("(orientation: landscape)").matches;
    return window.innerWidth > window.innerHeight;
  }

  function updateRotatePrompt() {
    if (!isTouchDevice || !overlayEl || !rotateEl) return;
    var api = getApi();
    var open = api ? api.isOpen() : overlayEl.classList.contains("is-open");
    rotateEl.classList.toggle("is-visible", !!open && isLandscape());
  }

  /* ------------------------------------------------------------------ */
  /* 4) RESIZE MÓVIL FIABLE (punto 16 del pedido)                         */
  /* window.visualViewport reacciona mejor que "resize" cuando aparece/  */
  /* desaparece la barra de direcciones en Safari/Chrome móvil. Si el     */
  /* navegador no lo soporta, no pasa nada: piano-game.js YA escucha      */
  /* "resize"/"orientationchange" como red de seguridad de siempre, esto  */
  /* solo AÑADE fiabilidad extra en móvil, nunca resta nada en PC.        */
  /* recalcLayout() es la MISMA measureLaneMetrics() del GAME CORE — no   */
  /* es un segundo cálculo de layout ni reinicia música/score/notas.      */
  /* ------------------------------------------------------------------ */
  function scheduleRecalc() {
    window.clearTimeout(recalcTimer);
    recalcTimer = window.setTimeout(function () {
      updateRotatePrompt();
      var api = getApi();
      if (api && typeof api.recalcLayout === "function") api.recalcLayout();
    }, 120);
  }

  function bindViewportEvents() {
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", scheduleRecalc);
      window.visualViewport.addEventListener("scroll", scheduleRecalc);
    }
    // Fallback adicional (no sustituto) para navegadores donde
    // visualViewport no dispara a tiempo tras rotar.
    window.addEventListener("orientationchange", scheduleRecalc);
    if (window.matchMedia) {
      var mq = window.matchMedia("(orientation: landscape)");
      if (mq.addEventListener) mq.addEventListener("change", scheduleRecalc);
      else if (mq.addListener) mq.addListener(scheduleRecalc); // Safari antiguo
    }
  }

  /* ------------------------------------------------------------------ */
  /* Arranque. Si piano-game.js aún no expone la API esperada (por        */
  /* ejemplo, una versión anterior sin recalcLayout/isOpen/etc.), esta    */
  /* capa simplemente no hace nada — nunca rompe el resto del juego.      */
  /* ------------------------------------------------------------------ */
  function init() {
    watchForOverlay();
    bindViewportEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
