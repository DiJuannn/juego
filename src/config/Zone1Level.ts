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
// Tramo 0 (0-3200): pedido explícito del usuario — quería ver el
// "laberinto" (ReefTemplates.reefLabyrinth, plantilla 4: 3 bandas
// alternando de lado en zigzag, penetrando muy adentro del carril)
// garantizado nada más empezar, en vez de dejarlo solo a la generación al
// azar de después de ZONE1_LEVEL_END_OFFSET — con la Zona 1 completa
// scripteada, la única forma de verlo pronto de verdad es colocarlo aquí.
// Todo el Tramo 1 original (antes empezaba en offset 960) se desplazó
// +2240 para hacerle sitio, con el mismo margen (~800px libres entre
// bandas) que ya usaba el resto del nivel entre cúmulos — ver el cálculo
// de bandas en cada comentario de abajo.
//
// Tramo 1 (3200-14880): el original de la primera versión, con las X ya
// corregidas y todos los offsets +2240 (ver Tramo 0). Tramo 2
// (14880-23040): introduce el calamar y cierra con un gauntlet justo
// antes de la corriente de agua (ver CURRENT_ZONE_START_OFFSET, derivado
// de ZONE1_LEVEL_END_OFFSET para que los dos no se puedan desincronizar) —
// mismo criterio de densidad y descansos que el Tramo 1, pero con datos
// (huecos deliberados) en vez de las bandas de descanso en tiempo real de
// Zone1Segments (que ya no se usan por debajo de ZONE1_LEVEL_END_OFFSET:
// todo este tramo es guion, no generación al azar).
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
// ±230/250/300px según plantilla, ±950px para el laberinto — un valor FIJO
// que no escala con lo anterior) no se solapen entre sí — con los huecos
// ×3.2 el margen libre entre cúmulos es ahora mucho mayor que antes, no
// menor. Los peligros "compañeros" de cada ReefCluster se colocan justo
// fuera de esa banda, nunca dentro — así nunca tapan sin querer el único
// carril seguro del cúmulo.
// Tramo 3 (pedido explícito, segundo laberinto — ver el final del array):
// grandMaze ocupa el rango [25330-1490, 25330+1490] = [23840,26820], así
// que el nivel scripteado ya no termina en 23040 sino después de esa
// banda + un margen para que Lumi tenga agua abierta para recuperarse
// antes de que arranque la corriente (ver CURRENT_ZONE_START_OFFSET en
// GameConfig.ts, que se deriva de este valor).
export const ZONE1_LEVEL_END_OFFSET = 26820 + 800;

export type Zone1LevelEntryType = "jellyfish" | "urchin" | "shark" | "squid" | "bigfish" | "reef" | "lilypad" | "crab";

export interface Zone1LevelEntry {
  type: Zone1LevelEntryType;
  /** Altura por encima de START_Y (mismo criterio que *_START_OFFSET). */
  offset: number;
  /** Posición X fija en el mundo — si se omite, el spawner elige una por
   * defecto igual que en su modo aleatorio. No aplica a "reef" (la
   * plantilla decide sus propias posiciones). */
  x?: number;
  /** Solo para "reef": índice en REEF_TEMPLATES (0=diagonalLeft,
   * 1=centerTwoPaths, 2=sCurveEdges, 3=lateralWall, 4=reefLabyrinth). */
  reefTemplate?: number;
  /** Solo para "shark": fuerza el sentido de patrulla en vez de tirarlo al
   * azar — pedido explícito: dos tiburones seguidos patrullando en
   * sentidos opuestos. */
  direction?: 1 | -1;
}

export const ZONE1_LEVEL_ENTRIES: Zone1LevelEntry[] = [
  // --- Tramo 0: laberinto de bienvenida (pedido explícito) ---
  // reefLabyrinth — banda ~[250,2150]. Nada dentro de la propia banda a
  // propósito: el laberinto ya es "difícil desde el minuto uno" y ya trae
  // su propia ruta de monedas, amontonarle otro peligro encima solo lo
  // ensuciaría.
  { type: "reef", offset: 1200, reefTemplate: 4 },
  // Pedido explícito: "justo después de eso está muy vacío, dejemos
  // medusas cerca de ahí" — el hueco entre el final de la banda del
  // laberinto (2150) y el primer cúmulo del Tramo 1 (2950) se sentía
  // como agua muerta. 2 medusas dentro de ese hueco, no en la banda misma.
  { type: "jellyfish", offset: 2400, x: 250 },
  { type: "jellyfish", offset: 2750, x: 450 },

  // --- Tramo 1 (3200-14880) ---
  // Primer combo del nivel "clásico": ya hay algo que esquivar justo al
  // salir del laberinto.
  { type: "reef", offset: 3200, reefTemplate: 0 }, // diagonalLeft — banda ~[2950,3450]
  { type: "jellyfish", offset: 4320, x: 250 }, // justo tras salir del cúmulo 1

  { type: "reef", offset: 5440, reefTemplate: 3 }, // lateralWall — banda ~[5140,5740]
  // Pedido explícito: "una zona donde haya dos erizos o tres en línea y
  // solo haya como un hueco pequeño y ese hueco abajo un nenúfar" — 3
  // erizos en línea, hueco pequeño entre el 1º y 2º, nenúfar justo antes
  // (más abajo) marcando ese hueco. Espaciado ampliado de nuevo (pedido
  // explícito: "el erizo... ponerlo un poco más separado del otro cuando
  // están en línea que siguen muy juntos") — con el x=120/290/460 anterior
  // (gap de 170px) el borde visible de un erizo llegaba a ~26px del
  // siguiente a URCHIN_SCALE=0.17; con 100/300/500 (gap 200px) ese margen
  // sube a ~56px, más lectura de "hueco real" y no un muro continuo.
  { type: "urchin", offset: 6560, x: 100 },
  { type: "urchin", offset: 6560, x: 300 },
  { type: "urchin", offset: 6560, x: 500 },
  { type: "lilypad", offset: 6470, x: 200 },

  { type: "reef", offset: 7680, reefTemplate: 1 }, // centerTwoPaths — banda ~[7450,7910]
  { type: "jellyfish", offset: 8800, x: 250 },

  { type: "reef", offset: 9920, reefTemplate: 2 }, // sCurveEdges — banda ~[9620,10220]
  // Pedido explícito: "podemos poner dos tiburones seguidos en una zona con
  // pocos obstáculos y que los dos patrullen pero vayan a la inversa" —
  // este tramo (entre los cúmulos de 9920 y 12160) ya tenía un único
  // tiburón y ningún otro peligro, el hueco más despejado del Tramo 1.
  { type: "shark", offset: 11040, x: 200, direction: 1 },
  { type: "shark", offset: 11040, x: 480, direction: -1 },

  { type: "reef", offset: 12160, reefTemplate: 0 }, // diagonalLeft — banda ~[11910,12410]

  // Tramo final (13440-14880): combo denso en zigzag, cierra el capítulo.
  { type: "bigfish", offset: 13440, x: 350 },
  { type: "urchin", offset: 13920, x: 150 },
  { type: "jellyfish", offset: 14400, x: 450 },
  { type: "urchin", offset: 14880, x: 250 },

  // --- Tramo 2 (14880-23040): debut del calamar, cierra con la corriente ---
  { type: "reef", offset: 16320, reefTemplate: 1 }, // centerTwoPaths — banda ~[16090,16550]
  { type: "squid", offset: 17280, x: 300 }, // debut del calamar

  { type: "reef", offset: 18560, reefTemplate: 2 }, // sCurveEdges — banda ~[18260,18860]
  // Misma idea que el combo de 3 erizos de más arriba, pero con 2 —
  // "dos erizos o tres en línea". Mismo ensanche de espaciado (ver el
  // combo de 3 erizos, offset 6560).
  { type: "urchin", offset: 19680, x: 200 },
  { type: "urchin", offset: 19680, x: 490 },
  { type: "lilypad", offset: 19590, x: 345 },
  { type: "squid", offset: 20320, x: 420 },
  { type: "crab", offset: 20740, x: 350 }, // debut del cangrejo

  { type: "reef", offset: 21440, reefTemplate: 3 }, // lateralWall — banda ~[21140,21740]

  // Gauntlet final antes de la corriente (23040).
  { type: "jellyfish", offset: 22560, x: 300 },
  { type: "bigfish", offset: 23040, x: 450 },

  // --- Tramo 3: segundo laberinto, más grande y distinto (pedido
  // explícito: "el que ya tenemos está súper [no se toca]... el que digo
  // yo es hacer otro pero diferente. Que sea más grande y mejor
  // diseñado... como de laberinto de verdad") — ver grandMaze en
  // ReefTemplates.ts (índice 6). Igual que reefLabyrinth en el Tramo 0,
  // se garantiza aquí en vez de dejarlo solo a la generación al azar de
  // después de ZONE1_LEVEL_END_OFFSET, para que el usuario lo encuentre
  // de verdad sin depender de una partida muy larga.
  { type: "reef", offset: 25330, reefTemplate: 6 }, // grandMaze — banda ~[23840,26820]
];
