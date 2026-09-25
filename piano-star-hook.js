/* ==========================================================================
   AMARIS WORLD — piano-star-hook.js
   Conecta la estrella dorada "SORPRESA" del mundo principal con
   window.AmarisPiano.open(), SIN modificar script.js ni bg-life.js.

   100% independiente: no lee ni toca ninguna variable interna de
   script.js. Si algo aquí fallara, el resto de la página sigue
   funcionando exactamente igual (la estrella simplemente seguiría
   abriendo la sorpresa, como hoy).

   CÓMO FUNCIONA:
   - La estrella (.zone-point[data-zone-id="sorpresa"]) es creada
     dinámicamente por renderWorld() en script.js, así que la esperamos
     con un MutationObserver.
   - script.js escucha los clics por DELEGACIÓN en #worldStage, en fase
     de burbuja (bubble). Para no editar ese archivo, enganchamos un
     listener propio directo sobre la estrella en fase de CAPTURA
     (captura ocurre antes que burbuja) y detenemos la propagación:
     así el clic nunca llega al listener de #worldStage y nunca se
     abre la pantalla de "Sorpresa" — solo se abre el piano.
   - Un solo listener de tipo "click" cubre mouse, touch/tap (los
     navegadores sintetizan "click" desde el toque) y teclado (Enter/
     Espacio disparan "click" de forma nativa en un <button>), así que
     no hay riesgo de apertura duplicada.
   ========================================================================== */

(function () {
  "use strict";

  var STAR_SELECTOR = '.zone-point[data-zone-id="sorpresa"]';
  var hookedStar = null; // referencia al elemento ya enganchado, evita listeners duplicados

  function openPiano(event) {
    // Evita que el clic llegue al listener de #worldStage (script.js),
    // así no se abre también la pantalla de "Sorpresa".
    event.stopPropagation();
    if (event.preventDefault) event.preventDefault();

    if (window.AmarisPiano && typeof window.AmarisPiano.open === "function") {
      window.AmarisPiano.open();
    } else {
      // Si el juego aún no cargó por alguna razón, no rompemos nada:
      // simplemente no pasa nada visible (evita un error en consola).
      console.warn("[piano-star-hook] window.AmarisPiano.open() no está disponible todavía.");
    }
  }

  function updateLabel(star) {
    // Cambia solo el texto debajo de la estrella. No toca el ícono
    // (.zone-badge), ni el brillo, ni la posición: el aspecto visual
    // de la estrella permanece igual.
    var label = star.querySelector(".zone-label");
    if (label) label.textContent = "🎹 PIANO";

    // Conserva accesibilidad existente; solo mejora el aria-label si
    // sigue diciendo lo anterior (p. ej. "SORPRESA").
    var currentAria = star.getAttribute("aria-label") || "";
    if (!/piano/i.test(currentAria)) {
      star.setAttribute("aria-label", "Abrir Amaris Piano");
    }
  }

  function hookStar(star) {
    if (!star || star === hookedStar) return; // ya está enganchada
    hookedStar = star;

    star.addEventListener("click", openPiano, true); // true = fase de captura

    updateLabel(star);
  }

  function tryHookNow() {
    var star = document.querySelector(STAR_SELECTOR);
    if (star) hookStar(star);
    return !!star;
  }

  function init() {
    if (tryHookNow()) return; // por si ya estuviera en el DOM

    var target =
      document.getElementById("worldStage") ||
      document.querySelector(".app") ||
      document.body;

    var observer = new MutationObserver(function () {
      if (tryHookNow()) {
        observer.disconnect();
      }
    });

    observer.observe(target, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
