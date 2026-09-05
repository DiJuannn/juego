// Zona 1, diseñada a mano (pedido explícito: "como si fuera el Mario
// Maker", nada de composición al azar). Sustituye a la generación
// procedural de medusa/erizo/tiburón/calamar/pez grande/ReefCluster desde
// el arranque hasta ZONE1_LEVEL_END_OFFSET — a partir de ahí, esos mismos
// spawners retoman su cadencia aleatoria de siempre (ver PondScene.ts).
//
// Reglas de diseño (pedido explícito del usuario tras rechazar el primer
// boceto, y de nuevo tras la ronda de "reestructurar, más orden"):
// - Dificultad desde el minuto uno: el primer obstáculo aparece casi de
//   inmediato, nada de un tramo de agua vacía "de bienvenida".
// - Nunca un peligro solo: cada aparición está a menos de ~400px de otra
//   (otro peligro o un ReefCluster), nunca aislada en agua vacía.
// - Todas las X están pensadas para WORLD_WIDTH=600 (mundo angosto) — un
//   error de la ronda anterior dejó varias X heredadas del mundo viejo de
//   1376px (700/1000/1050), fuera de los límites físicos del mundo actual
//   (Lumi no puede cruzar x=0/600, ver physics.world.setBounds en
//   PondScene): esos peligros quedaban en el aire, inalcanzables. Todas
//   las X de aquí en adelante caen dentro de [~110,490], con margen real
//   respecto a ambos bordes.
//
// Tramo 1 (0-6320): el original de la primera versión, con las X ya
// corregidas. Tramo 2 (6320-10400): introduce el calamar y cierra con un
// gauntlet justo antes de la corriente de agua (ver
// CURRENT_ZONE_START_OFFSET) — mismo criterio de densidad y descansos que
// el Tramo 1, pero con datos (huecos deliberados) en vez de las bandas de
// descanso en tiempo real de Zone1Segments (que ya no se usan por debajo
// de ZONE1_LEVEL_END_OFFSET: todo este tramo es guion, no generación al
// azar).
//
// Pedido explícito: "reestructuremos el nivel... hay que darle espacio a
// las cosas, que todo esté mucho más separado, está todo muy pegado".
// Todos los offsets de abajo (y el propio ZONE1_LEVEL_END_OFFSET) están
// multiplicados ×1.6 respecto a la versión anterior: los huecos se
// diseñaron cuando Lumi nadaba más despacio (220-310px/seg); al subir
// LUMI_SWIM_SPEED a 403 sin re-tocar las distancias, el mismo hueco en
// píxeles se cruzaba mucho más rápido — de ahí que se sintiera "pegado"
// aunque los números en sí no habían cambiado. Las X laterales NO se
// tocan (siguen dentro de los límites reales del mundo, eso no depende de
// la velocidad de Lumi).
//
// Alturas de los ReefCluster calculadas para que sus bandas (yTop/yBottom,
// ±230/250/300px según plantilla, un valor FIJO que no escala con lo
// anterior) no se solapen entre sí — con los huecos ×1.6 el margen libre
// entre cúmulos es ahora mayor que antes, no menor. Los peligros
// "compañeros" de cada ReefCluster se colocan justo fuera de esa banda,
// nunca dentro — así nunca tapan sin querer el único carril seguro del
// cúmulo.
export const ZONE1_LEVEL_END_OFFSET = 6500 * 1.6;

export type Zone1LevelEntryType = "jellyfish" | "urchin" | "shark" | "squid" | "bigfish" | "reef";

export interface Zone1LevelEntry {
  type: Zone1LevelEntryType;
  /** Altura por encima de START_Y (mismo criterio que *_START_OFFSET). */
  offset: number;
  /** Posición X fija en el mundo — si se omite, el spawner elige una por
   * defecto igual que en su modo aleatorio. No aplica a "reef" (la
   * plantilla decide sus propias posiciones). */
  x?: number;
  /** Solo para "reef": índice en REEF_TEMPLATES (0=diagonalLeft,
   * 1=centerTwoPaths, 2=sCurveEdges, 3=lateralWall). */
  reefTemplate?: number;
}

export const ZONE1_LEVEL_ENTRIES: Zone1LevelEntry[] = [
  // --- Tramo 1 (0-6320) ---
  // Primer combo: ya hay algo que esquivar desde el principio.
  { type: "reef", offset: 480, reefTemplate: 0 }, // diagonalLeft — banda ~[230,730]
  { type: "jellyfish", offset: 1040, x: 250 }, // justo tras salir del cúmulo 1

  { type: "reef", offset: 1600, reefTemplate: 3 }, // lateralWall — banda ~[1300,1900]
  { type: "urchin", offset: 2160, x: 300 },

  { type: "reef", offset: 2720, reefTemplate: 1 }, // centerTwoPaths — banda ~[2490,2950]
  { type: "jellyfish", offset: 3280, x: 250 },

  { type: "reef", offset: 3840, reefTemplate: 2 }, // sCurveEdges — banda ~[3540,4140]
  { type: "shark", offset: 4400, x: 300 },

  { type: "reef", offset: 4960, reefTemplate: 0 }, // diagonalLeft — banda ~[4710,5210]

  // Tramo final (5600-6320): combo denso en zigzag, cierra el capítulo.
  { type: "bigfish", offset: 5600, x: 350 },
  { type: "urchin", offset: 5840, x: 150 },
  { type: "jellyfish", offset: 6080, x: 450 },
  { type: "urchin", offset: 6320, x: 250 },

  // --- Tramo 2 (6320-10400): debut del calamar, cierra con la corriente ---
  { type: "reef", offset: 7040, reefTemplate: 1 }, // centerTwoPaths — banda ~[6810,7270]
  { type: "squid", offset: 7520, x: 300 }, // debut del calamar

  { type: "reef", offset: 8160, reefTemplate: 2 }, // sCurveEdges — banda ~[7860,8460]
  { type: "urchin", offset: 8720, x: 200 },
  { type: "squid", offset: 9040, x: 420 },

  { type: "reef", offset: 9600, reefTemplate: 3 }, // lateralWall — banda ~[9300,9900]

  // Gauntlet final antes de la corriente (10400).
  { type: "jellyfish", offset: 10160, x: 300 },
  { type: "bigfish", offset: 10400, x: 450 },
];
