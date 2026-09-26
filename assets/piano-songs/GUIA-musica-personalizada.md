# Amaris Piano — guía de las mejoras nuevas

Esta guía explica **solo lo que se agregó**. El juego, su lógica de TAP/HOLD,
su puntuación y su velocidad de notas siguen exactamente igual que antes.

Archivos nuevos:
- `hold-effects.css` — el temporizador circular y la aura de energía del HOLD.
- `piano-music-loader.js` — carga canciones extra desde `assets/music/` (opcional).
- `assets/music/music.json` — manifiesto de esas canciones extra (vacío por defecto: `[]`).

Archivos editados (solo se **añadió** código, nada existente se quitó ni se reescribió):
- `piano-game.js`
- `piano-mobile.css` (dos reglas nuevas, para abaratar el efecto en táctil)
- `index.html` (dos `<link>`/`<script>` nuevos)

---

## 1. El temporizador circular del HOLD

Ya no hace falta tocar nada para verlo: **toda** nota HOLD ahora dibuja, además
de la barra lineal que ya existía, un pequeño anillo circular (◔ ◑ ◕ ●) que se
rellena con el tiempo **real** que falta para terminar el HOLD. Se calcula en
`tick()` reutilizando el mismo número que ya usaba la barra lineal — nunca hay
un segundo reloj, así que nunca se puede desincronizar.

Mientras se sostiene la tecla, además: el brillo interno se intensifica, y un
anillo de color (morado/azul/cian/rosa/violeta) rota alrededor del contorno
("aura de energía"). Al soltar:
- si se completó → pequeña explosión de luz en el anillo (~260ms) y sonido de HOLD.
- si se soltó antes de tiempo → la energía desaparece de inmediato (MISS de siempre).

Todo esto vive en `hold-effects.css`; **no** se tocó ni una línea de
`piano-game.css`.

## 2. Imagen personalizada por nota (no solo por amigo)

Antes, la foto de una nota dependía únicamente del amigo (`friend`) que le
tocara. Ahora, **cualquier nota de un chart** puede traer su propia imagen:

```json
{ "time": 2000, "lane": 1, "type": "tap", "image": "foto1.jpg" }
```

Y su propia imagen de "acierto":

```json
{ "time": 2000, "lane": 1, "type": "tap", "image": "normal.jpg", "hitImage": "presionada.jpg" }
```

Sin `hitImage`, la nota no cambia de foto al acertar (como siempre). Sin
`image`, se sigue usando la foto del `friend` de esa nota (comportamiento
100% intacto para cualquier chart que ya tengas). Esto funciona en:
`AmarisPiano.setChart(...)`, el `chart` de una canción dentro de `PIANO_SONGS`,
y en cualquier `chart.json` cargado por `piano-music-loader.js`.

## 3. Música personalizada sin tocar código (`assets/music/`)

Para agregar una canción **sin editar `piano-game.js`**, crea una carpeta y
súmala a `assets/music/music.json`:

```
assets/music/
├── music.json
└── mi-cancion/
    ├── song.mp3
    ├── chart.json          (opcional; sin él, se auto-generan las notas)
    ├── note1.jpg
    ├── note1-hit.jpg
    └── sfx/
        ├── perfect.mp3
        ├── great.mp3
        ├── miss.mp3
        └── hold.mp3
```

`music.json`:

```json
[
  {
    "id": "mi-cancion",
    "name": "Mi Canción",
    "folder": "assets/music/mi-cancion",
    "chart": "chart.json",
    "sfx": {
      "perfect": "sfx/perfect.mp3",
      "great": "sfx/great.mp3",
      "miss": "sfx/miss.mp3",
      "hold": "sfx/hold.mp3"
    }
  }
]
```

`mi-cancion/chart.json` usa el mismo formato de siempre, con `image`/`hitImage`
opcionales (ver punto 2):

```json
[
  { "time": 1000, "lane": 0, "type": "tap", "image": "note1.jpg" },
  { "time": 2000, "lane": 1, "type": "tap", "image": "note1.jpg", "hitImage": "note1-hit.jpg" },
  { "time": 3000, "lane": 2, "type": "hold", "duration": 1200, "image": "note1.jpg" }
]
```

Las rutas de `image`/`hitImage`/`sfx.*` son relativas a `folder`. Si prefieres
compartir una imagen entre varias canciones, usa una ruta con `/`
(por ejemplo `"assets/friends/amaris.webp"`) y se usará tal cual.

Si `assets/music/music.json` no existe (o el navegador no puede leerlo, como
al abrir el proyecto con doble clic en vez de un servidor local), el juego
sigue funcionando exactamente igual, solo con las canciones que ya estaban
escritas dentro de `PIANO_SONGS` en `piano-game.js`. **Nunca se rompe nada.**

⚠️ Nota técnica: `fetch()` (usado para leer `music.json`/`chart.json`) no
funciona al abrir `index.html` directamente desde el disco en algunos
navegadores (Chrome bloquea `fetch` sobre `file://` por CORS). Si notas que
tus canciones de `assets/music/` no aparecen, prueba sirviendo la carpeta con
un servidor local simple (por ejemplo `python3 -m http.server`) en vez de
abrir el archivo directamente. Esto no afecta a las canciones de
`PIANO_SONGS`, que siempre funcionan igual.

## 4. Sonidos de resultado personalizados, con respaldo

Prioridad al elegir qué archivo suena en cada PERFECT / GREAT / MISS / HOLD
completado:

1. El de la canción activa (`song.sfx.<tipo>`, si viene de `assets/music/`).
2. Un sonido global opcional (`GLOBAL_SFX` dentro de `piano-game.js` —
   comentado por defecto; descomenta las líneas que quieras usar).
3. El sonido sintetizado del propio juego (el "ding" de siempre para
   aciertos y HOLD; un "thud" grave nuevo para MISS, que antes no sonaba).

Nunca truena por un archivo faltante: si un `.mp3` no existe, cae en
silencio al siguiente nivel.

**Importante:** esto es solo *qué archivo suena*, no cambia el sistema de
puntuación. Un HOLD completado sigue puntuando exactamente como un PERFECT
de siempre; solo puede tener su propio audio (`hold.mp3`) si quieres
distinguirlo al oído. El juego actual solo distingue dos aciertos
(`perfect`/`great`) y `miss` — por eso están listos los "ganchos" de sonido
para `excellent`/`good` en `GLOBAL_SFX`/`sfx`, pero hoy no se disparan,
porque el pedido explícito fue no tocar el sistema de puntuación.

## 5. Volumen

```js
AmarisPiano.setVolume({ music: 1.0, sfx: 0.7 }); // ambos de 0 a 1, ambos opcionales
```

También puedes editar los valores por defecto directamente en `CONFIG` dentro
de `piano-game.js` (`musicVolume`, `sfxVolume`).

## 6. Precarga

Al abrir el juego (o al elegir una canción en el selector) se precargan
**solo** los recursos de esa canción: su portada, las imágenes/hitImages que
use su chart, y sus sonidos de resultado propios. Nunca se precargan las
demás canciones.

## 7. Qué probar

- PC: TAP, HOLD (mantener mouse y soltar), teclado 1-4, PERFECT/GREAT/MISS,
  música y selector de canciones — todo debería sentirse idéntico a antes.
- Móvil: lo mismo con el dedo, más multitouch (dos HOLDs a la vez con dos
  dedos) y girar el teléfono durante una partida.
- HOLD: que aparezca el anillo circular, que avance en tiempo real, que la
  aura de color solo se vea mientras se sostiene, que el sonido de HOLD
  completado se escuche, y que nada se quede "atascado" si sueltas justo en
  el límite.
