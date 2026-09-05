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
// Tramo 1 (0-4000): el original de la primera versión, con las X ya
// corregidas. Tramo 2 (4000-6500): nuevo, introduce el calamar y cierra
// con un gauntlet justo antes de la corriente de agua (6500, ver
// CURRENT_ZONE_START_OFFSET) — mismo criterio de densidad y descansos que
// el Tramo 1, pero con datos (huecos deliberados) en vez de las bandas de
// descanso en tiempo real de Zone1Segments (que ya no se usan por debajo
// de 6500: todo este tramo es guion, no generación al azar).
//
// Alturas de los ReefCluster calculadas para que sus bandas (yTop/yBottom,
// ±230/250/300px según plantilla) no se solapen entre sí. Los peligros
// "compañeros" de cada ReefCluster se colocan justo fuera de esa banda
// (con margen de ~50-100px), nunca dentro — así nunca tapan sin querer el
// único carril seguro del cúmulo.
export const ZONE1_LEVEL_END_OFFSET = 6500;

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
  // --- Tramo 1 (0-4000) ---
  // Primer combo: ya hay algo que esquivar desde el principio.
  { type: "reef", offset: 300, reefTemplate: 0 }, // diagonalLeft — banda ~[50,550]
  { type: "jellyfish", offset: 650, x: 250 }, // justo tras salir del cúmulo 1

  { type: "reef", offset: 1000, reefTemplate: 3 }, // lateralWall — banda ~[700,1300]
  { type: "urchin", offset: 1350, x: 300 },

  { type: "reef", offset: 1700, reefTemplate: 1 }, // centerTwoPaths — banda ~[1470,1930]
  { type: "jellyfish", offset: 2050, x: 250 },

  { type: "reef", offset: 2400, reefTemplate: 2 }, // sCurveEdges — banda ~[2100,2700]
  { type: "shark", offset: 2750, x: 300 },

  { type: "reef", offset: 3100, reefTemplate: 0 }, // diagonalLeft — banda ~[2850,3350]

  // Tramo final (3400-4000): combo denso en zigzag, cierra el capítulo.
  { type: "bigfish", offset: 3500, x: 350 },
  { type: "urchin", offset: 3650, x: 150 },
  { type: "jellyfish", offset: 3800, x: 450 },
  { type: "urchin", offset: 3950, x: 250 },

  // --- Tramo 2 (4000-6500): debut del calamar, cierra con la corriente ---
  { type: "reef", offset: 4400, reefTemplate: 1 }, // centerTwoPaths — banda ~[4170,4630]
  { type: "squid", offset: 4700, x: 300 }, // debut del calamar

  { type: "reef", offset: 5100, reefTemplate: 2 }, // sCurveEdges — banda ~[4800,5400]
  { type: "urchin", offset: 5450, x: 200 },
  { type: "squid", offset: 5650, x: 420 },

  { type: "reef", offset: 6000, reefTemplate: 3 }, // lateralWall — banda ~[5700,6300]

  // Gauntlet final antes de la corriente (6500).
  { type: "jellyfish", offset: 6350, x: 300 },
  { type: "bigfish", offset: 6500, x: 450 },
];
