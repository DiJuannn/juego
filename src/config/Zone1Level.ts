// Tramo 1 de la Zona 1, diseñado a mano (pedido explícito: "como si fuera
// el Mario Maker", nada de composición al azar). Sustituye a la generación
// procedural de medusa/erizo/tiburón/pez grande/ReefCluster SOLO en este
// tramo (0 a ZONE1_LEVEL_END_OFFSET) — a partir de ahí, esos mismos
// spawners retoman su cadencia aleatoria de siempre (ver PondScene.ts).
//
// Reglas de diseño de esta primera versión (pedido explícito del usuario
// tras rechazar el primer boceto):
// - Dificultad desde el minuto uno: el primer obstáculo aparece casi de
//   inmediato, nada de un tramo de agua vacía "de bienvenida".
// - Nunca un peligro solo: cada aparición está a menos de ~400px de otra
//   (otro peligro o un ReefCluster), nunca aislada en agua vacía.
// - El tramo 1 llega hasta la altura 4000 (antes eran ~2200-3600 según el
//   peligro) — es más largo de lo que se planteó al principio.
//
// Alturas de los ReefCluster calculadas para que sus bandas (yTop/yBottom,
// ±250/300px según plantilla) no se solapen entre sí: centros separados
// ~700px. Los peligros "compañeros" de cada ReefCluster se colocan justo
// fuera de esa banda (con margen de ~50-100px), nunca dentro — así nunca
// tapan sin querer el único carril seguro del cúmulo.
export const ZONE1_LEVEL_END_OFFSET = 4000;

export type Zone1LevelEntryType = "jellyfish" | "urchin" | "shark" | "bigfish" | "reef";

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
  // --- Primer combo: ya hay algo que esquivar desde el principio ---
  { type: "reef", offset: 300, reefTemplate: 0 }, // diagonalLeft — banda ~[0,600]
  { type: "jellyfish", offset: 650, x: 250 }, // justo tras salir del cúmulo 1

  { type: "reef", offset: 1000, reefTemplate: 3 }, // lateralWall — banda ~[700,1300]
  { type: "urchin", offset: 1350, x: 1050 },

  { type: "reef", offset: 1700, reefTemplate: 1 }, // centerTwoPaths — banda ~[1400,2000]
  { type: "jellyfish", offset: 2050, x: 250 },

  { type: "reef", offset: 2400, reefTemplate: 2 }, // sCurveEdges — banda ~[2100,2700]
  { type: "shark", offset: 2750, x: 700 },

  { type: "reef", offset: 3100, reefTemplate: 0 }, // diagonalLeft — banda ~[2800,3400]

  // --- Tramo final (3400-4000): combo denso, cierra el capítulo ---
  { type: "bigfish", offset: 3500, x: 700 },
  { type: "urchin", offset: 3650, x: 300 },
  { type: "jellyfish", offset: 3800, x: 1000 },
  { type: "urchin", offset: 3950, x: 600 },
];
