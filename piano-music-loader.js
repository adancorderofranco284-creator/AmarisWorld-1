/* ==========================================================================
   AMARIS WORLD — piano-music-loader.js
   Sistema de MÚSICA PERSONALIZADA para Amaris Piano (puntos 10-16 del
   pedido de mejora). 100% OPCIONAL y aditivo: no modifica PIANO_SONGS ni
   ninguna función interna de piano-game.js. Se limita a LEER un
   manifiesto opcional en assets/music/music.json y, por cada canción que
   encuentre, registrarla con window.AmarisPiano.addSong() / setSongChart()
   — dos métodos públicos añadidos a piano-game.js pensados exactamente
   para esto.

   Si assets/music/music.json no existe, está vacío, o falla la carga (por
   ejemplo al abrir el proyecto con file:// sin servidor, donde fetch()
   puede fallar por CORS), este archivo simplemente no hace nada: el juego
   sigue funcionando igual, con las canciones ya definidas dentro de
   PIANO_SONGS (piano-game.js). Nunca produce un error visible ni bloquea
   nada — exactamente como pide el punto 13 ("nunca producir error si
   falta un archivo").

   Ver GUIA-musica-personalizada.md (junto a este archivo) para el detalle
   completo del formato, con ejemplos listos para copiar y pegar.

   RESUMEN DE LA ESTRUCTURA (ver la guía para el detalle):

     assets/music/
     ├── music.json                  ← manifiesto: arreglo de canciones
     ├── mi-cancion/
     │   ├── song.mp3
     │   ├── chart.json              ← notas sincronizadas (opcional)
     │   ├── cover.jpg                (opcional)
     │   ├── note1.jpg
     │   ├── note1-hit.jpg
     │   └── sfx/
     │       ├── perfect.mp3
     │       ├── great.mp3
     │       ├── miss.mp3
     │       └── hold.mp3
     └── otra-cancion/
         ├── song.mp3
         └── chart.json

   music.json — arreglo de objetos:
     {
       "id": "mi-cancion",           // único, sin espacios
       "name": "Mi Canción",         // se muestra en el selector
       "folder": "assets/music/mi-cancion",
       "chart": "chart.json",        // ruta relativa a "folder" — o ARREGLO inline
       "cover": "cover.jpg",         // relativo a "folder" (opcional, no usado aún por la UI)
       "sfx": {                     // relativo a "folder" (opcional, todos opcionales)
         "perfect": "sfx/perfect.mp3",
         "great": "sfx/great.mp3",
         "miss": "sfx/miss.mp3",
         "hold": "sfx/hold.mp3"
       }
     }

   chart.json (o el arreglo inline de "chart"): MISMO formato que ya usa
   AmarisPiano.setChart(), con "image"/"hitImage" opcionales por nota (ver
   piano-game.js, sección "6) CICLO DE JUEGO" y el encabezado del archivo):
     [
       { "time": 1000, "lane": 0, "type": "tap",  "image": "note1.jpg" },
       { "time": 2000, "lane": 1, "type": "tap",  "image": "note1.jpg", "hitImage": "note1-hit.jpg" },
       { "time": 3000, "lane": 2, "type": "hold", "duration": 1200, "image": "note2.jpg" }
     ]

   Las rutas de "image"/"hitImage"/"sfx.*" son relativas a la carpeta de la
   canción ("folder"). Si una ruta YA contiene "/" (por ejemplo para
   compartir una imagen entre varias canciones desde assets/friends/), se
   usa tal cual, sin anteponerle la carpeta.
   ========================================================================== */

(function () {
  "use strict";

  var MANIFEST_URL = "assets/music/music.json";

  function joinPath(base, rel) {
    if (!rel) return rel;
    if (rel.indexOf("/") !== -1 || /^https?:/i.test(rel)) return rel; // ruta ya completa/compartida
    return base.replace(/\/+$/, "") + "/" + rel;
  }

  function resolveChartPaths(chart, folder) {
    if (!Array.isArray(chart)) return chart;
    return chart.map(function (entry) {
      var copy = {};
      for (var key in entry) {
        if (Object.prototype.hasOwnProperty.call(entry, key)) copy[key] = entry[key];
      }
      if (copy.image) copy.image = joinPath(folder, copy.image);
      if (copy.hitImage) copy.hitImage = joinPath(folder, copy.hitImage);
      return copy;
    });
  }

  function resolveSfxPaths(sfx, folder) {
    if (!sfx || typeof sfx !== "object") return null;
    var out = {};
    var any = false;
    ["perfect", "excellent", "great", "good", "miss", "hold"].forEach(function (kind) {
      if (sfx[kind]) {
        out[kind] = joinPath(folder, sfx[kind]);
        any = true;
      }
    });
    return any ? out : null;
  }

  function registerSong(entry) {
    if (!window.AmarisPiano || typeof window.AmarisPiano.addSong !== "function") return;
    if (!entry || !entry.id || !entry.name || !entry.folder) return; // entrada mal formada: se ignora, sin romper el resto del manifiesto

    var folder = entry.folder.replace(/\/+$/, "");
    var song = {
      id: entry.id,
      name: entry.name,
      file: joinPath(folder, "song.mp3"),
      cover: entry.cover ? joinPath(folder, entry.cover) : null,
      sfx: resolveSfxPaths(entry.sfx, folder)
    };

    if (Array.isArray(entry.chart)) {
      // Chart ya viene inline dentro del manifiesto: se registra completo.
      song.chart = resolveChartPaths(entry.chart, folder);
      window.AmarisPiano.addSong(song);
    } else if (typeof entry.chart === "string") {
      // Chart en un archivo aparte (lo más cómodo para no editar JSON
      // gigante a mano): se registra la canción YA (sin chart todavía, así
      // que mientras carga usa el generador automático de notas, como
      // cualquier canción sin chart) y se actualiza en cuanto llega.
      window.AmarisPiano.addSong(song);
      fetch(joinPath(folder, entry.chart))
        .then(function (res) {
          if (!res.ok) throw new Error("chart.json no encontrado: " + song.id);
          return res.json();
        })
        .then(function (chart) {
          window.AmarisPiano.setSongChart(song.id, resolveChartPaths(chart, folder));
        })
        .catch(function () {
          /* Sin chart.json: la canción se queda con generación automática
             de notas, el juego nunca se rompe ni se queda esperando. */
        });
    } else {
      // Sin "chart" en absoluto: canción válida, generación automática.
      window.AmarisPiano.addSong(song);
    }
  }

  function init() {
    // Si piano-game.js es una versión anterior sin addSong(), esta capa se
    // desactiva sola — nunca rompe el resto del juego.
    if (!window.AmarisPiano || typeof window.AmarisPiano.addSong !== "function") return;

    fetch(MANIFEST_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("music.json no encontrado");
        return res.json();
      })
      .then(function (list) {
        if (!Array.isArray(list)) return;
        list.forEach(registerSong);
      })
      .catch(function () {
        /* Sin manifiesto (o falló, p. ej. al abrir con file:// sin
           servidor): el juego sigue exactamente igual, solo con las
           canciones ya definidas dentro de PIANO_SONGS en piano-game.js. */
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
