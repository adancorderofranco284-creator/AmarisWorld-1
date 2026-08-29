/* ==========================================================================
   AMARIS WORLD — CONTENIDO EDITABLE
   Script plano (sin módulos ES). Expone window.AMARIS_CONTENT.

   ✏️  EDITA AQUÍ los textos, el nombre y las rutas de fotos/música.
       No necesitas tocar script.js ni style.css para cambiar esto.
   ========================================================================== */

window.AMARIS_CONTENT = {

  // Nombre que aparece en la escena final de sorpresa.
  nombre: 'Amaris',

  // ---- 💌 CARTA -----------------------------------------------------------
  carta: {
    titulo: 'Para Amaris ✨',
    // Usa \n\n para separar párrafos.
    texto:
      'Feliz cumpleaños, Amaris.\n\n' +
      'Hoy, 29 de agosto, cumples 17 años, y quería regalarte algo un poco diferente.\n\n' +
      'Sé que con el tiempo muchas fotografías pueden perderse. Algunas pueden desaparecer de un celular, ' +
      'quedarse olvidadas en algún lugar o simplemente dejar de estar donde antes las encontrábamos.\n\n' +
      'Pero que una fotografía desaparezca no significa que el recuerdo también lo haga.\n\n' +
      'Por eso hice este pequeño lugar para ti.\n\n' +
      'Aquí reuní algunos momentos, lugares, fotografías y pequeñas cosas que, aunque quizá ya no estén en ' +
      'tu celular como antes, siguen estando presentes de alguna manera.\n\n' +
      'Cada recuerdo que encuentres aquí representa un momento que merecía no ser olvidado.\n\n' +
      'Quiero que recorras este pequeño mundo con calma, descubras cada rincón y vuelvas a mirar algunos de ' +
      'esos momentos desde otra perspectiva.\n\n' +
      'También hay algunas sorpresas que preparé especialmente para ti. 🐾✨\n\n' +
      'Espero que este nuevo año de tu vida esté lleno de momentos que algún día quieras recordar, de personas ' +
      'que hagan tus días más bonitos, de lugares nuevos y de muchas razones para sonreír.\n\n' +
      'Feliz cumpleaños, Amaris.\n\n' +
      'Que cumplas muchos, muchísimos años más.\n\n' +
      'Y que, incluso cuando algunas cosas se pierdan con el tiempo, siempre queden recuerdos que nos hagan ' +
      'volver a sonreír.',
    firma: 'Con cariño,\nAdan'
  },

  // ---- 📸 RECUERDOS --------------------------------------------------------
  // Agrega tus fotos dentro de assets/recuerdos/ con estos nombres
  // (1.jpg, 2.jpg, 3.jpg...) y agrega/quita rutas aquí. Acepta .jpg/.JPG,
  // .jpeg/.JPEG, .png/.PNG, .webp/.WEBP (respeta mayúsculas/minúsculas tal
  // cual estén guardados los archivos). Si un archivo no existe todavía, la
  // galería lo omite automáticamente.
  //
  // Lista generada automáticamente a partir de las fotos encontradas en
  // assets/recuerdos/ (1.jpg … 122.jpg, respetando la extensión real de cada
  // una). No hace falta que la mantengas al día a mano: script.js también
  // detecta solo, en tiempo real, cualquier foto numerada nueva que agregues
  // después de la 122 (123.jpg, 124.jpg...) sin que tengas que tocar este
  // archivo — ver "auto-detección" en script.js. Esta lista solo sirve para
  // poder personalizar el texto (caption) de cada foto si quieres.
  galeria: [
    { src: 'assets/recuerdos/1.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/2.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/3.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/4.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/5.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/6.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/7.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/8.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/9.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/10.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/11.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/12.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/13.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/14.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/15.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/16.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/17.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/18.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/19.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/20.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/21.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/22.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/23.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/24.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/25.PNG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/26.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/27.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/28.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/29.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/30.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/31.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/32.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/33.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/34.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/35.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/36.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/37.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/38.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/39.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/40.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/41.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/42.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/43.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/44.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/45.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/46.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/47.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/48.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/49.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/50.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/51.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/52.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/53.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/54.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/55.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/56.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/57.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/58.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/59.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/60.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/61.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/62.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/63.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/64.PNG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/65.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/66.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/67.JPG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/68.PNG', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/69.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/70.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/71.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/72.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/73.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/74.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/75.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/76.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/77.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/78.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/79.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/80.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/81.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/82.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/83.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/84.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/85.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/86.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/87.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/88.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/89.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/90.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/91.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/92.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/93.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/94.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/95.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/96.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/97.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/98.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/99.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/100.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/101.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/102.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/103.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/104.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/105.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/106.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/107.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/108.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/109.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/110.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/111.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/112.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/113.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/114.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/115.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/116.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/117.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/118.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/119.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/120.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/121.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' },
    { src: 'assets/recuerdos/122.jpg', caption: 'Escribe aquí el recuerdo de esta foto ✨' }
  ],

  // ---- 🎁 REGALO -----------------------------------------------------------
  regalo: {
    mensaje: 'Sorpresa 🎉 Aquí puedes escribir el mensaje o el regalo real que quieras revelar.'
  },

  // ---- 🎵 MÚSICA -----------------------------------------------------------
  // Agrega o quita canciones editando esta lista. Cada canción va en
  // assets/music/ y necesita un "src" (la ruta al archivo) y un "titulo"
  // (lo que se muestra en la barra de reproducción y en la lista).
  musica: {
    titulo: 'Nuestra playlist',
    playlist: [
      { titulo: 'CORTIS - FaSHioN', src: 'assets/music/cortis-fashion.mp3' },
      { titulo: 'ROSÉ - 3am', src: 'assets/music/rose-3am.mp3' },
      { titulo: "ROSÉ - Don't Look Back In Anger (Live Cover)", src: 'assets/music/rose-dont-look-back-in-anger-cover.mp3' },
      { titulo: 'ROSÉ - Until I Found You (Cover)', src: 'assets/music/rose-until-i-found-you-cover.mp3' },
      { titulo: 'ROSÉ - Call It the End', src: 'assets/music/rose-call-it-the-end.mp3' },
      { titulo: 'ROSÉ - Dance All Night', src: 'assets/music/rose-dance-all-night.mp3' },
      { titulo: 'ROSÉ - Drinks or Coffee', src: 'assets/music/rose-drinks-or-coffee.mp3' },
      { titulo: 'ROSÉ - Gameboy', src: 'assets/music/rose-gameboy.mp3' },
      { titulo: 'ROSÉ - Not the Same', src: 'assets/music/rose-not-the-same.mp3' },
      { titulo: 'ROSÉ - Too Bad for Us', src: 'assets/music/rose-too-bad-for-us.mp3' },
      { titulo: 'ROSÉ - Two Years', src: 'assets/music/rose-two-years.mp3' },
      { titulo: 'ROSÉ & Bruno Mars - APT.', src: 'assets/music/rose-bruno-mars-apt.mp3' },
      { titulo: 'ROSÉ - 3am (Live Performance)', src: 'assets/music/rose-3am-live.mp3' },
      { titulo: 'ROSÉ - Stay a Little Longer', src: 'assets/music/rose-stay-a-little-longer.mp3' },
      { titulo: 'APT. (Live at the Grammy Awards)', src: 'assets/music/apt-live-grammy-awards.mp3' },
      { titulo: 'Toxic Till the End (Behind the Scenes)', src: 'assets/music/toxic-till-the-end-bts.mp3' }
    ]
  },

  // ---- ⭐ SORPRESA FINAL -----------------------------------------------------
  sorpresa: {
    mensaje: 'Espero que este pequeño mundo te haga sonreír ❤️'
  }
};
