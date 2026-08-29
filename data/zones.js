/* ==========================================================================
   AMARIS WORLD — PUNTOS INTERACTIVOS DEL LOBBY
   Script plano (sin módulos ES), coherente con el resto del proyecto.
   Expone window.AMARIS_ZONES para que script.js lo consuma.

   Cada punto:
     id       → identificador único ('carta' | 'recuerdos' | 'regalo' | 'musica' | 'sorpresa')
     name     → nombre visible bajo el ícono
     icon     → emoji mostrado dentro de la insignia pixel-art
     position → { x, y } en porcentaje respecto al escenario del mundo
     unlocked → si es false, el punto no se renderiza
   ========================================================================== */

window.AMARIS_ZONES = [
  { id: 'carta',     name: 'Carta',     icon: '💌', position: { x: 18, y: 32 }, unlocked: true },
  { id: 'recuerdos', name: 'Recuerdos', icon: '📸', position: { x: 40, y: 66 }, unlocked: true },
  { id: 'regalo',    name: 'Regalo',    icon: '🎁', position: { x: 63, y: 28 }, unlocked: true },
  { id: 'musica',    name: 'Música',    icon: '🎵', position: { x: 82, y: 60 }, unlocked: true },
  { id: 'sorpresa',  name: 'Sorpresa',  icon: '⭐', position: { x: 50, y: 14 }, unlocked: true }
];
