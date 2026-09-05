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
// Tramo 1 (0-12640): el original de la primera versión, con las X ya
// corregidas. Tramo 2 (12640-20800): introduce el calamar y cierra con un
// gauntlet justo antes de la corriente de agua (ver
// CURRENT_ZONE_START_OFFSET) — mismo criterio de densidad y descansos que
// el Tramo 1, pero con datos (huecos deliberados) en vez de las bandas de
// descanso en tiempo real de Zone1Segments (que ya no se usan por debajo
// de ZONE1_LEVEL_END_OFFSET: todo este tramo es guion, no generación al
// azar).
//
// Pedido explícito: "reestructuremos el nivel... hay que darle espacio a
// las cosas, que todo esté mucho más separado, está todo muy pegado", y
// tras una primera pasada (×1.6): "hazlo mucho mucho más separado" — ×2
// adicional sobre eso (×3.2 acumulado desde el valor original). Los
// huecos se diseñaron cuando Lumi nadaba más despacio (220-310px/seg); al
// subir LUMI_SWIM_SPEED a 403 sin re-tocar las distancias, el mismo hueco
// en píxeles se cruzaba mucho más rápido — de ahí que se sintiera
// "pegado" aunque los números en sí no habían cambiado. Las X laterales
// NO se tocan (siguen dentro de los límites reales del mundo, eso no
// depende de la velocidad de Lumi ni del espaciado vertical).
//
// Alturas de los ReefCluster calculadas para que sus bandas (yTop/yBottom,
// ±230/250/300px según plantilla, un valor FIJO que no escala con lo
// anterior) no se solapen entre sí — con los huecos ×3.2 el margen libre
// entre cúmulos es ahora mucho mayor que antes, no menor. Los peligros
// "compañeros" de cada ReefCluster se colocan justo fuera de esa banda,
// nunca dentro — así nunca tapan sin querer el único carril seguro del
// cúmulo.
export const ZONE1_LEVEL_END_OFFSET = 6500 * 1.6 * 2;

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
  // --- Tramo 1 (0-12640) ---
  // Primer combo: ya hay algo que esquivar desde el principio.
  { type: "reef", offset: 960, reefTemplate: 0 }, // diagonalLeft — banda ~[710,1210]
  { type: "jellyfish", offset: 2080, x: 250 }, // justo tras salir del cúmulo 1

  { type: "reef", offset: 3200, reefTemplate: 3 }, // lateralWall — banda ~[2900,3500]
  { type: "urchin", offset: 4320, x: 300 },

  { type: "reef", offset: 5440, reefTemplate: 1 }, // centerTwoPaths — banda ~[5210,5670]
  { type: "jellyfish", offset: 6560, x: 250 },

  { type: "reef", offset: 7680, reefTemplate: 2 }, // sCurveEdges — banda ~[7380,7980]
  { type: "shark", offset: 8800, x: 300 },

  { type: "reef", offset: 9920, reefTemplate: 0 }, // diagonalLeft — banda ~[9670,10170]

  // Tramo final (11200-12640): combo denso en zigzag, cierra el capítulo.
  { type: "bigfish", offset: 11200, x: 350 },
  { type: "urchin", offset: 11680, x: 150 },
  { type: "jellyfish", offset: 12160, x: 450 },
  { type: "urchin", offset: 12640, x: 250 },

  // --- Tramo 2 (12640-20800): debut del calamar, cierra con la corriente ---
  { type: "reef", offset: 14080, reefTemplate: 1 }, // centerTwoPaths — banda ~[13850,14310]
  { type: "squid", offset: 15040, x: 300 }, // debut del calamar

  { type: "reef", offset: 16320, reefTemplate: 2 }, // sCurveEdges — banda ~[16020,16620]
  { type: "urchin", offset: 17440, x: 200 },
  { type: "squid", offset: 18080, x: 420 },

  { type: "reef", offset: 19200, reefTemplate: 3 }, // lateralWall — banda ~[18900,19500]

  // Gauntlet final antes de la corriente (20800).
  { type: "jellyfish", offset: 20320, x: 300 },
  { type: "bigfish", offset: 20800, x: 450 },
];
