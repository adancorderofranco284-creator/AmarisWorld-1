/* ==========================================================================
   AMARIS WORLD — bg-life.js
   Capa de vida sutil sobre el fondo real del mundo (#pixelScene).
   100% independiente de script.js: no lee ni modifica ninguna variable,
   función o estado del resto del proyecto. Si algo aquí fallara, el resto
   de la página sigue funcionando exactamente igual.

   QUÉ HACE:
   - Agrega 3 tipos de puntos decorativos sobre la imagen de fondo:
       luces (velas/faroles/ventanas), agua (reflejo/brillo) y vegetación
       (destello suave simulando brisa entre hojas).
   - Todo vive dentro de #pixelScene, detrás de #worldStage, con
     pointer-events:none, así que nunca bloquea clics ni tapa la interfaz.

   CÓMO CALIBRAR LAS POSICIONES A TU IMAGEN:
   1. Abre la página, entra al mundo y ejecuta en la consola:
        bgLifeDebug(true)
      Esto dibuja un contorno punteado alrededor de cada punto y pausa su
      animación, para que puedas ver exactamente dónde cae cada efecto
      sobre tu imagen real.
   2. Ajusta los números del objeto BG_LIFE_CONFIG de abajo (son
      porcentajes del tamaño de la escena: x/y = posición, 0% es
      arriba-izquierda, 100% es abajo-derecha).
   3. Guarda, recarga, repite. Cuando estén bien puestos, ejecuta
      bgLifeDebug(false) o simplemente recarga la página.
   4. Si tu fondo NO tiene agua (o no quieres ese efecto), deja el arreglo
      "water" vacío: water: []
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* CONFIGURACIÓN — edita solo estos números para ajustar a tu imagen   */
  /* ------------------------------------------------------------------ */

  var BG_LIFE_CONFIG = {
    // Luces: velas, faroles, ventanas encendidas. "x"/"y" en % de la escena.
    lights: [
      // Coincide con el farol ya insinuado en el CSS existente (63%, 82%).
      { x: 63, y: 82, size: 12, color: "#ffe6a8", duration: 3.2, delay: 0,   opacity: 0.85 },
      { x: 22, y: 34, size: 7,  color: "#ffe6a8", duration: 4.1, delay: 1.1, opacity: 0.6  },
      { x: 78, y: 30, size: 7,  color: "#f2cf94", duration: 3.7, delay: 0.5, opacity: 0.55 }
    ],

    // Agua: banda de reflejo/brillo que se desliza muy despacio.
    // Déjalo en [] si tu imagen no tiene lago/agua.
    water: [
      { x: 50, y: 78, width: 46, height: 9, duration: 10, delay: 0, opacity: 0.5 }
    ],

    // Vegetación: destello suave tipo luz-entre-hojas (no mueve la imagen).
    foliage: [
      { x: 10, y: 55, size: 90, duration: 6.5, delay: 0.3 },
      { x: 90, y: 50, size: 80, duration: 7.2, delay: 1.4 }
    ]
  };

  /* ------------------------------------------------------------------ */
  /* Implementación — normalmente no necesitas tocar nada de aquí abajo  */
  /* ------------------------------------------------------------------ */

  function buildLayer() {
    var scene = document.getElementById("pixelScene");
    if (!scene) return; // el mundo aún no está en el DOM; no hacemos nada

    if (document.getElementById("bgLifeLayer")) return; // evita duplicados

    var layer = document.createElement("div");
    layer.className = "life-layer";
    layer.id = "bgLifeLayer";
    layer.setAttribute("aria-hidden", "true");

    BG_LIFE_CONFIG.water.forEach(function (w) {
      var el = document.createElement("div");
      el.className = "water-shimmer";
      el.style.setProperty("--wx", w.x + "%");
      el.style.setProperty("--wy", w.y + "%");
      el.style.setProperty("--ww", w.width + "%");
      el.style.setProperty("--wh", w.height + "%");
      el.style.setProperty("--wdur", w.duration + "s");
      el.style.setProperty("--wdelay", (w.delay || 0) + "s");
      el.style.setProperty("--wop", w.opacity != null ? w.opacity : 0.55);
      layer.appendChild(el);
    });

    BG_LIFE_CONFIG.lights.forEach(function (l) {
      var el = document.createElement("div");
      el.className = "light-flicker";
      el.style.setProperty("--lx", l.x + "%");
      el.style.setProperty("--ly", l.y + "%");
      el.style.setProperty("--lsize", l.size + "px");
      el.style.setProperty("--lcolor", l.color || "#ffe6a8");
      el.style.setProperty("--ldur", l.duration + "s");
      el.style.setProperty("--ldelay", (l.delay || 0) + "s");
      el.style.setProperty("--lop", l.opacity != null ? l.opacity : 0.8);
      layer.appendChild(el);
    });

    BG_LIFE_CONFIG.foliage.forEach(function (f) {
      var el = document.createElement("div");
      el.className = "foliage-breeze";
      el.style.setProperty("--fx", f.x + "%");
      el.style.setProperty("--fy", f.y + "%");
      el.style.setProperty("--fsize", f.size + "px");
      el.style.setProperty("--fdur", f.duration + "s");
      el.style.setProperty("--fdelay", (f.delay || 0) + "s");
      layer.appendChild(el);
    });

    // #pixelScene (z-index 1) y #worldStage (z-index 2) son hermanos dentro
    // de #worldScreen, así que basta con agregar la capa dentro de
    // #pixelScene para que quede siempre detrás de los puntos interactivos.
    scene.appendChild(layer);
  }

  // Utilidades públicas, expuestas por si quieres controlarlas desde la
  // consola o desde tu propio script.js más adelante.

  window.toggleBgLife = function (on) {
    document.body.classList.toggle("bg-life-off", on === false);
  };

  window.setBgLifeIntensity = function (value) {
    document.documentElement.style.setProperty("--bg-life-intensity", String(value));
  };

  window.bgLifeDebug = function (on) {
    var layer = document.getElementById("bgLifeLayer");
    if (layer) layer.classList.toggle("is-debug", on !== false);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildLayer);
  } else {
    buildLayer();
  }
})();
