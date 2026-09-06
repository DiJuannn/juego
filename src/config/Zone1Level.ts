import type { UrchinVariant } from "@/entities/Urchin";

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
// grandMaze en offset 25600 ocupa el rango [25600-1760, 25600+1760] =
// [23840,27360] (recalculado tras cambiar su arte a un seto de hojas:
// GRAND_MAZE_BAND_SPACING subió de 820 a 1000, ver ReefTemplates.ts).
// Tramo 4 (pedido explícito de una ronda posterior: "crea más estilos de
// laberintos con otros diseños que aparezcan más arriba o diferentes
// combinaciones de los ya existentes") — "gran final" de 3 laberintos
// distintos seguidos, cada uno más arriba que el anterior: grandMaze (ya
// colocado arriba) → reefLabyrinth REPETIDO más arriba (índice 4, hasta
// ahora solo usado una vez, al principio de todo — "combinación de los ya
// existentes") → doubleZigzagMaze, el estilo nuevo (índice 7). reefLabyrinth
// centrado en 28710 ocupa [28710-950,28710+950]=[27760,29660] (margen de
// 400 tras el final de grandMaze en 27360); doubleZigzagMaze centrado en
// 31360 ocupa [31360-1300,31360+1300]=[30060,32660] (margen de 400 tras el
// final del laberinto anterior en 29660). El nivel scripteado ya no
// termina en 27360 sino después de esta banda + el mismo margen de
// siempre para que Lumi tenga agua abierta para recuperarse antes de que
// arranque la corriente (ver CURRENT_ZONE_START_OFFSET en GameConfig.ts,
// que se deriva de este valor).
export const ZONE1_LEVEL_END_OFFSET = 32660 + 800;

export type Zone1LevelEntryType =
  | "jellyfish"
  | "urchin"
  | "shark"
  | "squid"
  | "bigfish"
  | "reef"
  | "lilypad"
  | "crab"
  | "clam"
  | "coraltrap"
  | "seahorse"
  | "barnacle"
  | "mantaray"
  | "flyingfish";

export interface Zone1LevelEntry {
  type: Zone1LevelEntryType;
  /** Altura por encima de START_Y (mismo criterio que *_START_OFFSET). */
  offset: number;
  /** Posición X fija en el mundo — si se omite, el spawner elige una por
   * defecto igual que en su modo aleatorio. No aplica a "reef" (la
   * plantilla decide sus propias posiciones). */
  x?: number;
  /** Solo para "reef": índice en REEF_TEMPLATES (0=diagonalLeft,
   * 1=centerTwoPaths, 2=sCurveEdges, 3=lateralWall, 4=reefLabyrinth,
   * 5=miniLabyrinth, 6=grandMaze, 7=doubleZigzagMaze). */
  reefTemplate?: number;
  /** Solo para "shark": fuerza el sentido de patrulla en vez de tirarlo al
   * azar — pedido explícito: dos tiburones seguidos patrullando en
   * sentidos opuestos. */
  direction?: 1 | -1;
  /** Solo para "urchin": qué tipo visual usar (ver entities/Urchin.ts).
   * Por defecto el erizo original — pedido explícito ("haz más erizos de
   * otros tipos") para que una columna vertical de varios no se lea como
   * el mismo erizo repetido. */
  variant?: UrchinVariant;
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
  // como agua muerta. Pedido explícito de una ronda posterior: "al
  // principio puedes poner incluso más medusas que sean 3 o 4" — subido
  // de 2 a 4, escalonadas en Y y separadas en X para que se lean como un
  // grupo de verdad, no un muro (todas dentro del mismo hueco, nunca en
  // la banda del laberinto).
  { type: "jellyfish", offset: 2350, x: 150 },
  { type: "jellyfish", offset: 2500, x: 350 },
  { type: "jellyfish", offset: 2650, x: 550 },
  { type: "jellyfish", offset: 2850, x: 250 },

  // --- Tramo 1 (3200-14880) ---
  // Primer combo del nivel "clásico": ya hay algo que esquivar justo al
  // salir del laberinto.
  { type: "reef", offset: 3200, reefTemplate: 0 }, // diagonalLeft — banda ~[2950,3450]
  { type: "jellyfish", offset: 4320, x: 250 }, // justo tras salir del cúmulo 1
  // Pedido explícito ("GENÉRAME MUCHOS MÁS ANIMALES... rellenar el mapa
  // más con animales, hacer combinaciones"): caballito de mar en el mismo
  // punto, al otro lado — primera "combinación" de dos animales distintos
  // en el mismo respiro entre cúmulos.
  { type: "seahorse", offset: 3700, x: 430 },
  // Debut del pez volador (pedido explícito: "CREA MÁS ANIMALES MÁS
  // MÁS...con animación de que muevan por el mapa tmb o que tengan
  // dinámicas distintas") — primer animal con ritmo de reposo+salto en
  // vez de movimiento continuo, introducido pronto para que se note la
  // diferencia frente al resto.
  { type: "flyingfish", offset: 4200, x: 480 },
  // Coral trampa (animal disfrazado de obstáculo) en el hueco despejado
  // antes del siguiente cúmulo — se lee como parte del paisaje hasta que
  // Lumi se acerca.
  { type: "coraltrap", offset: 4800, x: 350 },

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

  // Pedido explícito: "mejores la primera zona que la veo muy suave" — este
  // hueco (6560-7450, entre el combo de erizos y el siguiente cúmulo)
  // estaba completamente vacío. Debut del cangrejo adelantado aquí (antes
  // solo aparecía en el Tramo 2, offset 20740) para que se vea variedad de
  // enemigos mucho antes — con 1 sola vida, la mayoría de intentos nunca
  // llegan tan lejos como para conocerlo.
  { type: "crab", offset: 7000, x: 350 },

  { type: "reef", offset: 7680, reefTemplate: 1 }, // centerTwoPaths — banda ~[7450,7910]
  // Hueco despejado (7910-9620) que antes solo tenía una medusa — pedido
  // explícito de rellenar más con animales.
  { type: "seahorse", offset: 8300, x: 300 },
  { type: "jellyfish", offset: 8800, x: 250 },
  { type: "coraltrap", offset: 9260, x: 450 },

  { type: "reef", offset: 9920, reefTemplate: 2 }, // sCurveEdges — banda ~[9620,10220]
  // Otro hueco vacío (10220-11040, entre este cúmulo y los tiburones) —
  // misma limpieza de "muy suave".
  { type: "coraltrap", offset: 10600, x: 250 },
  // Debut de la mantarraya (misma tanda que el pez volador) — cruza el
  // mapa en diagonal de verdad, primer animal que también recorre
  // distancia real en Y (no solo un bob local), combinado aquí con el
  // coral trampa de arriba.
  { type: "mantaray", offset: 10850, x: 450 },
  // Pedido explícito: "podemos poner dos tiburones seguidos en una zona con
  // pocos obstáculos y que los dos patrullen pero vayan a la inversa" —
  // este tramo (entre los cúmulos de 9920 y 12160) ya tenía un único
  // tiburón y ningún otro peligro, el hueco más despejado del Tramo 1.
  { type: "shark", offset: 11040, x: 200, direction: 1 },
  { type: "shark", offset: 11040, x: 480, direction: -1 },

  // Pedido explícito: "lo del inicio los laberintos la gracia es hacerlo
  // más veces pero estén más arriba pero estén más difíciles, que hayan
  // erizos o caballitos de mar etc" — primer "repetido" del laberinto
  // (antes diagonalLeft aquí), con 1 animal real dentro del hueco (ver
  // labyrinthAnimalTier en ReefTemplates.ts). Banda ~[11660,12660].
  { type: "reef", offset: 12160, reefTemplate: 5 }, // miniLabyrinth (tier 1)

  // Décimo enemigo (pedido explícito: "crea más animales si") — hueco
  // despejado entre el final de la banda del laberinto (12660) y el
  // combo denso de abajo (13440).
  { type: "barnacle", offset: 13050, x: 300 },

  // Tramo final (13440-14880): combo denso en zigzag, cierra el capítulo.
  { type: "bigfish", offset: 13440, x: 350 },
  { type: "urchin", offset: 13920, x: 150 },
  { type: "seahorse", offset: 14160, x: 400 },
  { type: "jellyfish", offset: 14400, x: 450 },
  { type: "urchin", offset: 14880, x: 250 },

  // --- Tramo 2 (14880-23040): debut del calamar, cierra con la corriente ---
  { type: "barnacle", offset: 15100, x: 450 },
  // Debut de la almeja gigante (hasta ahora solo aparecía por generación
  // al azar, nunca scripteada) — hueco despejado entre el final del
  // Tramo 1 y el primer cúmulo del Tramo 2.
  { type: "clam", offset: 15500, x: 350 },

  // Segundo repetido del laberinto (antes centerTwoPaths aquí), tier 1.
  { type: "reef", offset: 16320, reefTemplate: 5 }, // miniLabyrinth (tier 1) — banda ~[15820,16820]
  // Debut de la línea VERTICAL de erizos (pedido explícito: "haz más
  // erizos de otros tipos que se coloquen en vertical en línea") — hasta
  // ahora las líneas de erizo siempre eran horizontales (mismo offset,
  // distinta x). Aquí es al revés: misma x, offsets escalonados, así que
  // en vez de esquivar hacia un hueco lateral hay que esquivar la COLUMNA
  // entera pasando por un lado mientras se sube. Solo 2 (hueco corto entre
  // laberinto y calamar) — la versión larga de 3 en columna, y la versión
  // "en paralelo" con dos columnas, están más arriba en dificultad (ver
  // más abajo).
  { type: "urchin", offset: 16920, x: 350, variant: "default" },
  { type: "urchin", offset: 17120, x: 350, variant: "long" },
  { type: "squid", offset: 17280, x: 300 }, // debut del calamar
  // Pedido explícito: "entre más arriba más animales en combo colocados
  // estratégicamente" — este combo tenía 2 animales, ahora 4 (mantarraya
  // añadida en esta misma tanda de "MÁS MÁS animales").
  { type: "jellyfish", offset: 17550, x: 150 },
  { type: "seahorse", offset: 17800, x: 420 },
  { type: "mantaray", offset: 18050, x: 300 },

  { type: "reef", offset: 18560, reefTemplate: 2 }, // sCurveEdges — banda ~[18260,18860]
  // "Zona" de erizos EN PARALELO (pedido explícito: "en paralelo puede ser
  // una zona tmb") — dos columnas verticales a la vez, con un pasillo
  // limpio en medio (x≈230-460 libre, WORLD_WIDTH=690) para subir
  // esquivando ambas a la vez, no solo una. Más difícil que el debut de
  // arriba (2 columnas en vez de 1) y colocada más arriba en altura, tal
  // como se pidió ("cuando haya más dificultad aparezcan en vertical").
  // Cada fila mezcla tipos distintos entre las dos columnas para que
  // ninguna fila se lea repetida.
  { type: "urchin", offset: 18950, x: 140, variant: "round" },
  { type: "urchin", offset: 18950, x: 550, variant: "default" },
  { type: "urchin", offset: 19150, x: 140, variant: "default" },
  { type: "urchin", offset: 19150, x: 550, variant: "long" },
  { type: "urchin", offset: 19350, x: 140, variant: "long" },
  { type: "urchin", offset: 19350, x: 550, variant: "round" },
  // Misma idea que el combo de 3 erizos de más arriba, pero con 2 —
  // "dos erizos o tres en línea". Mismo ensanche de espaciado (ver el
  // combo de 3 erizos, offset 6560).
  { type: "urchin", offset: 19680, x: 200 },
  { type: "urchin", offset: 19680, x: 490 },
  { type: "lilypad", offset: 19590, x: 345 },
  { type: "squid", offset: 20320, x: 420 },
  // Mismo criterio: más arriba, más animales por combo.
  { type: "jellyfish", offset: 20500, x: 200 },
  { type: "crab", offset: 20740, x: 350 },

  // Tercer repetido del laberinto (antes lateralWall aquí), tier 2 (2
  // animales dentro) — el más difícil de los 3, más arriba que los otros
  // dos, tal como se pidió.
  { type: "reef", offset: 21440, reefTemplate: 5 }, // miniLabyrinth (tier 2) — banda ~[20940,21940]
  { type: "coraltrap", offset: 22100, x: 250 },

  // Gauntlet final antes de la corriente (23040).
  { type: "jellyfish", offset: 22560, x: 300 },
  { type: "bigfish", offset: 23040, x: 450 },
  // Combo final antes del segundo laberinto (pedido explícito: "rellenar
  // el mapa más con animales... hacer combinaciones") — el hueco entre el
  // gauntlet y la banda de entrada de grandMaze (23840) antes se dejaba
  // vacío del todo.
  { type: "seahorse", offset: 23300, x: 200 },
  { type: "coraltrap", offset: 23300, x: 350 },
  { type: "clam", offset: 23300, x: 470 },
  { type: "flyingfish", offset: 23550, x: 300 },

  // --- Tramo 3: segundo laberinto, más grande y distinto (pedido
  // explícito: "el que ya tenemos está súper [no se toca]... el que digo
  // yo es hacer otro pero diferente. Que sea más grande y mejor
  // diseñado... como de laberinto de verdad") — ver grandMaze en
  // ReefTemplates.ts (índice 6). Igual que reefLabyrinth en el Tramo 0,
  // se garantiza aquí en vez de dejarlo solo a la generación al azar de
  // después de ZONE1_LEVEL_END_OFFSET, para que el usuario lo encuentre
  // de verdad sin depender de una partida muy larga.
  { type: "reef", offset: 25600, reefTemplate: 6 }, // grandMaze — banda ~[23840,27360]

  // --- Tramo 4: "gran final" de laberintos (pedido explícito: "crea más
  // estilos de laberintos con otros diseños que aparezcan más arriba o
  // diferentes combinaciones de los ya existentes") — 2 laberintos más,
  // cada uno más arriba y distinto del anterior, cerrando el nivel
  // scripteado con el tramo más difícil de todos. El tiburón de aquí ya
  // cae en el segundo umbral de persecución (SHARK_CHASE_MIN_OFFSET_HARD
  // = 22000): persigue más rápido y con más frecuencia que los de más
  // abajo — pedido explícito ("entre más arriba los animales hagan
  // distintos movimientos... para que sean más difíciles").
  { type: "shark", offset: 27560, x: 350 },

  // reefLabyrinth REPETIDO (índice 4) — hasta ahora solo aparecía una vez,
  // al principio de todo (offset 1200): "diferentes combinaciones de los
  // ya existentes" es literalmente esto, el mismo diseño probado pero
  // mucho más arriba, con la cámara ya más rápida y el tiburón ya
  // agresivo alrededor. Banda [28710-950,28710+950]=[27760,29660].
  { type: "reef", offset: 28710, reefTemplate: 4 }, // reefLabyrinth — banda ~[27760,29660]
  { type: "flyingfish", offset: 29860, x: 300 },

  // doubleZigzagMaze, el estilo NUEVO (índice 7, ver ReefTemplates.ts) —
  // dos bandas seguidas pegadas al mismo lado antes de cruzar del todo,
  // en vez del zigzag de siempre. Cierra el nivel scripteado en el punto
  // más alto y más difícil. Banda [31360-1300,31360+1300]=[30060,32660].
  { type: "reef", offset: 31360, reefTemplate: 7 }, // doubleZigzagMaze — banda ~[30060,32660]
];
