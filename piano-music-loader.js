/* ==========================================================================
   AMARIS WORLD — piano-music-loader.js
   Sistema de MÚSICA PERSONALIZADA para Amaris Piano. 100% OPCIONAL y
   aditivo: no modifica PIANO_SONGS a mano ni ninguna función interna de
   piano-game.js. Se limita a LEER el manifiesto de Amaris Piano en
   assets/piano-songs/music.json y, por cada canción que encuentre,
   registrarla con window.AmarisPiano.addSong() / setSongChart() — dos
   métodos públicos que piano-game.js ya expone exactamente para esto.

   IMPORTANTE — separación de sistemas (no tocar el reproductor principal):
     - assets/music/            → reproductor principal de Amaris World
                                   (manifest.json, script.js, #bgAudio).
                                   Este archivo NUNCA lee ni escribe ahí.
     - assets/piano-songs/      → ÚNICA carpeta que usa AMARIS PIANO. Este
                                   archivo SOLO lee de aquí.

   Si assets/piano-songs/music.json no existe, está vacío, o falla la
   carga (por ejemplo al abrir el proyecto con file:// sin servidor, donde
   fetch() puede fallar por CORS), este archivo simplemente no hace nada:
   el juego sigue funcionando igual, con generación automática de notas y
   sin música personalizada. Nunca produce un error que rompa el juego.

   ESTRUCTURA ESPERADA (ver GUIA-musica-personalizada.md para el detalle):

     assets/piano-songs/
     ├── music.json                  ← manifiesto: arreglo de canciones
     ├── GUIA-musica-personalizada.md
     ├── sfx/                        ← sfx de respaldo compartidos (opcional)
     └── mi-cancion/
         ├── Morning_in_the_Cr....mp3   ← el nombre EXACTO va en "file"
         ├── chart.json                 (opcional)
         ├── cover.jpg                  (opcional)
         └── sfx/                       (opcional, todos los archivos opcionales)
             ├── perfect.mp3
             ├── excellent.mp3
             ├── great.mp3
             ├── good.mp3
             ├── miss.mp3
             └── hold.mp3

   music.json — arreglo de objetos:
     {
       "id": "mi-cancion",                       // único, sin espacios
       "name": "Morning in the Clouds",          // se muestra en el selector
       "folder": "assets/piano-songs/mi-cancion",
       "file": "Morning_in_the_Cr....mp3",       // nombre REAL del archivo,
                                                  // respetando mayúsculas/
                                                  // minúsculas/espacios/
                                                  // guiones/extensión
       "chart": "chart.json",                    // opcional: ruta relativa
                                                  // a "folder", o ARREGLO
                                                  // inline con el mismo
                                                  // formato de setChart()
       "cover": "cover.jpg",                     // opcional, relativo a "folder"
       "sfx": {                                  // opcional, relativo a "folder"
         "perfect": "sfx/perfect.mp3",
         "great": "sfx/great.mp3",
         "miss": "sfx/miss.mp3"
       }
     }

   Si "cover" o "sfx" no se especifican, el loader asume por convención
   "cover.jpg" y "sfx/<tipo>.mp3" dentro de la propia carpeta de la
   canción; si esos archivos no existen de verdad, el juego los ignora en
   silencio (nunca truena por un archivo faltante — igual que siempre).

   Las rutas de "image"/"hitImage" dentro de un chart son relativas a la
   carpeta de la canción ("folder"). Si una ruta YA contiene "/" (por
   ejemplo para compartir una imagen entre varias canciones), se usa tal
   cual, sin anteponerle la carpeta.
   ========================================================================== */

(function () {
  "use strict";

  var LOG_PREFIX = "[AMARIS PIANO]";
  // Única fuente de canciones de Amaris Piano. NO assets/music/music.json
  // (ese pertenece al reproductor principal de Amaris World).
  var MANIFEST_URL = "assets/piano-songs/music.json";

  function joinPath(base, rel) {
    if (!rel) return rel;
    if (rel.indexOf("/") !== -1 || /^https?:/i.test(rel)) return rel; // ruta ya completa/compartida
    return base.replace(/\/+$/, "") + "/" + rel;
  }

  // 🖼️ Carpeta de imágenes de la canción: SIEMPRE
  // assets/piano-songs/<carpeta-de-la-cancion>/images/ — nunca hay que
  // escribirla a mano en el chart. El nombre del archivo dentro de
  // "image"/"hitImage" puede ser CUALQUIERA (Amaris_normal.png,
  // foto_favorita.jpg, imagen_arcoiris.webp...), no se modifica ni se
  // le fuerza una extensión: se usa tal cual, tal como está escrito.
  function imagesFolder(folder) {
    return folder.replace(/\/+$/, "") + "/images";
  }

  function resolveChartPaths(chart, folder) {
    if (!Array.isArray(chart)) return chart;
    var imgFolder = imagesFolder(folder);
    return chart.map(function (entry) {
      var copy = {};
      for (var key in entry) {
        if (Object.prototype.hasOwnProperty.call(entry, key)) copy[key] = entry[key];
      }
      // Si el valor ya es una ruta completa (contiene "/") o una URL, se
      // respeta tal cual (permite compartir una imagen entre canciones o
      // usar una fuera de images/); si es solo un nombre de archivo, se
      // busca dentro de la carpeta images/ de ESTA canción.
      if (copy.image) copy.image = joinPath(imgFolder, copy.image);
      if (copy.hitImage) copy.hitImage = joinPath(imgFolder, copy.hitImage);
      return copy;
    });
  }

  // 📋 Manifiesto OPCIONAL images.json dentro de la carpeta de la canción.
  // No es necesario para que "image"/"hitImage" en chart.json funcionen
  // (esos ya buscan directo en images/ con el nombre que se les dé); este
  // manifiesto sirve solo para PRECARGAR de antemano todas las imágenes
  // que declares ahí (cualquier cantidad, con el nombre de propiedad que
  // quieras), así llegan a la pantalla ya en caché la primera vez que se
  // usan. Si el archivo no existe, no pasa nada: no es obligatorio.
  //
  // Acepta dos formas:
  //   { "normal": "Amaris_normal.png", "pressed": "Amaris_presionada.png" }
  //   { "images": { "normal": "...", "rainbow": "imagen_arcoiris.webp" } }
  function preloadImagesManifest(folder) {
    var imgFolder = imagesFolder(folder);
    var manifestUrl = joinPath(folder, "images.json");
    fetch(manifestUrl)
      .then(function (res) {
        if (!res.ok) throw new Error("sin images.json");
        return res.json();
      })
      .then(function (manifest) {
        var map = manifest && typeof manifest.images === "object" ? manifest.images : manifest;
        if (!map || typeof map !== "object") return;
        var count = 0;
        Object.keys(map).forEach(function (key) {
          var filename = map[key];
          if (typeof filename !== "string" || !filename) return;
          var img = new Image();
          img.src = joinPath(imgFolder, filename);
          count++;
        });
        if (count > 0) {
          console.log(LOG_PREFIX + " images.json: " + count + " imagen(es) precargadas de " + folder + "/images/");
        }
      })
      .catch(function () {
        // Sin images.json (opcional) o falló la carga: no es un error,
        // las imágenes referenciadas directamente en chart.json siguen
        // funcionando igual, solo no llegan pre-cacheadas de antemano.
      });
  }

  // Si la canción no especifica "sfx" en el manifiesto, se asumen por
  // convención los nombres de siempre dentro de <folder>/sfx/. No pasa
  // nada si alguno (o todos) no existen de verdad: piano-game.js ya los
  // ignora en silencio al reproducirlos (punto 12 del pedido).
  var SFX_KINDS = ["perfect", "excellent", "great", "good", "miss", "hold"];

  function resolveSfxPaths(sfx, folder) {
    var out = {};
    var any = false;
    if (sfx && typeof sfx === "object") {
      SFX_KINDS.forEach(function (kind) {
        if (sfx[kind]) {
          out[kind] = joinPath(folder, sfx[kind]);
          any = true;
        }
      });
    } else {
      SFX_KINDS.forEach(function (kind) {
        out[kind] = joinPath(folder, "sfx/" + kind + ".mp3");
        any = true;
      });
    }
    return any ? out : null;
  }

  // Comprobación best-effort (punto 9 del pedido): intenta confirmar que
  // el archivo exista, solo para dejar un diagnóstico claro en consola.
  // NUNCA bloquea ni impide registrar la canción — si falla (por CORS, por
  // abrir con file://, o porque el archivo de verdad no existe), el juego
  // sigue igual: piano-game.js ya maneja en silencio un audio.src ausente.
  function checkFileExists(path) {
    fetch(path, { method: "HEAD" })
      .then(function (res) {
        if (!res.ok) {
          console.warn(LOG_PREFIX + " No se encontró la canción:\n" + path);
        }
      })
      .catch(function () {
        // No se pudo verificar (CORS, file://, etc.): no es un error del
        // sistema de canciones, así que no se reporta como tal.
      });
  }

  function registerSong(entry) {
    if (!window.AmarisPiano || typeof window.AmarisPiano.addSong !== "function") return;
    if (!entry || !entry.id || !entry.name || !entry.folder) {
      console.warn(LOG_PREFIX + " Entrada inválida en music.json (faltan id/name/folder), se omite:", entry);
      return;
    }

    var folder = entry.folder.replace(/\/+$/, "");
    // Compatibilidad: si el manifiesto no trae "file" (formato antiguo),
    // se asume "song.mp3" dentro de la carpeta. Si SÍ trae "file", se usa
    // ese nombre EXACTO — nunca se fuerza "song.mp3" por encima de él.
    var filePath = joinPath(folder, entry.file || "song.mp3");
    var coverPath = joinPath(folder, entry.cover || "cover.jpg");

    console.log(LOG_PREFIX + " Registrando:\n" + entry.name);
    console.log(LOG_PREFIX + " Archivo:\n" + filePath);
    checkFileExists(filePath);
    preloadImagesManifest(folder); // opcional (punto: images.json), nunca bloquea el registro

    var song = {
      id: entry.id,
      name: entry.name,
      file: filePath,
      cover: coverPath,
      sfx: resolveSfxPaths(entry.sfx, folder)
    };

    if (Array.isArray(entry.chart)) {
      // Chart ya viene inline dentro del manifiesto: se registra completo.
      song.chart = resolveChartPaths(entry.chart, folder);
      window.AmarisPiano.addSong(song);
      console.log(LOG_PREFIX + " Canción cargada correctamente");
    } else if (typeof entry.chart === "string") {
      // Chart en un archivo aparte: se registra la canción YA (sin chart
      // todavía, así que mientras carga usa el generador automático de
      // notas, como cualquier canción sin chart) y se actualiza en cuanto
      // llega (punto 10-11 del pedido).
      window.AmarisPiano.addSong(song);
      console.log(LOG_PREFIX + " Canción cargada correctamente");
      var chartPath = joinPath(folder, entry.chart);
      fetch(chartPath)
        .then(function (res) {
          if (!res.ok) throw new Error("chart.json no encontrado: " + song.id);
          return res.json();
        })
        .then(function (chart) {
          window.AmarisPiano.setSongChart(song.id, resolveChartPaths(chart, folder));
        })
        .catch(function () {
          // Sin chart.json real: la canción se queda con generación
          // automática de notas (punto 11: NO impide reproducir la canción).
        });
    } else {
      // Sin "chart" en absoluto: canción válida, generación automática.
      window.AmarisPiano.addSong(song);
      console.log(LOG_PREFIX + " Canción cargada correctamente");
    }
  }

  function init() {
    // Si piano-game.js es una versión anterior sin addSong(), esta capa se
    // desactiva sola — nunca rompe el resto del juego.
    if (!window.AmarisPiano || typeof window.AmarisPiano.addSong !== "function") return;

    console.log(LOG_PREFIX + " Cargando music.json...");

    fetch(MANIFEST_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("music.json no encontrado");
        return res.json();
      })
      .then(function (list) {
        if (!Array.isArray(list)) {
          console.warn(LOG_PREFIX + " music.json no contiene un arreglo, se ignora.");
          return;
        }
        console.log(LOG_PREFIX + " Canciones encontradas: " + list.length);
        list.forEach(registerSong);
      })
      .catch(function () {
        // Sin manifiesto (o falló, p. ej. al abrir con file:// sin
        // servidor): el juego sigue exactamente igual, con generación
        // automática de notas y sin música personalizada.
        console.warn(LOG_PREFIX + " No se pudo leer " + MANIFEST_URL + " (¿no existe o no hay servidor local?). El minijuego sigue funcionando sin música personalizada.");
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
