// Constantes de tuning del juego. Nada de esto es arte: son números que
// controlan cámara, velocidad y tamaño en pantalla.

import { ZONE1_LEVEL_END_OFFSET } from "@/config/Zone1Level";

// Pedido explícito: el juego está diseñado para jugarse en móvil, siempre
// en vertical — estas medidas son solo el tamaño inicial antes de que el
// modo RESIZE de Phaser (ver main.ts) lo ajuste al contenedor real; se
// declaran en proporción de teléfono (9:16) para que ese primer frame ya
// sea vertical y no un parpadeo de horizontal a vertical al cargar.
export const GAME_WIDTH = 405;
export const GAME_HEIGHT = 720;

// Antes coincidía con el ancho nativo del fondo (1376px), pero eso dejaba
// muchísimo margen para desplazarse de lado a lado antes de llegar a
// cualquier obstáculo lateral — pedido explícito del usuario: un mundo
// mucho más angosto, para que los obstáculos que "salen de los laterales"
// (ver ReefTemplates.ts) estén realmente cerca sea cual sea el lado en el
// que esté Lumi. background_far.png ya no depende de este valor (es un
// TileSprite anclado a la cámara, no al mundo, ver ParallaxLayer) —
// rocks_back.png sí se ancla a WORLD_WIDTH/2, pero al ser una sola imagen
// centrada, un mundo más estrecho solo la recoloca, no la rompe. Pedido
// explícito posterior: "un 15% más ancho" — 600 * 1.15.
export const WORLD_WIDTH = 600 * 1.15;

// Juego de escalada infinita: no hay un "final" del mundo hacia arriba, así
// que el límite de físicas es simplemente muy alto — nadie llega tan lejos
// en una partida. No es infinito de verdad (evita rehacer todas las
// coordenadas), pero a efectos de juego se comporta igual.
export const WORLD_HEIGHT = 2_000_000;

// Punto de partida de Lumi y de la decoración de fondo (rocas/plantas),
// que ya no se ancla al fondo del mundo (ahora gigante) sino a este punto:
// se ven al empezar y quedan atrás para siempre al subir, como en Doodle
// Jump.
export const START_Y = 700;

// Pedido explícito del usuario: tamaño final, un 20% más sobre el "mucho
// más grande" anterior (0.075*3), y luego un 10% menos ("empequeñar a
// lumi un 10%"). Una subida posterior a este mismo valor fue un
// malentendido del usuario ("me confundí, quería decir que lo hicieras
// más rápido") — revertida, la lentitud se arregla con LUMI_SWIM_SPEED,
// no con el tamaño. Supera bastante el "10-15% de la pantalla" de
// STYLE_GUIDE.md — avisado, no es un descuido.
export const LUMI_SCALE = 0.075 * 3 * 1.2 * 0.9;

// Pedido explícito: Lumi se sentía lenta. Subido de 220 a 260, luego a
// 310, y de nuevo un 30% más (310 -> 403) tras probarlo en el móvil real.
export const LUMI_SWIM_SPEED = 310 * 1.3; // px/seg

// El arte de swim_right/swim_left está dibujado algo más grande que el de
// idle/swim_up/diagonal dentro del mismo lienzo. La corrección de 0.64 fue
// pedido explícito de bajarla: se notaba demasiado el cambio de tamaño al
// pasar a nadar de lado y se veía mal. Se deja solo un ajuste leve del 15%.
export const SWIM_SIDE_SCALE_CORRECTION = 0.85;

// Hundimiento suave cuando Lumi no nada activamente: sin esto no habría
// tensión ninguna en un juego de escalada (podrías quedarte quieta para
// siempre). Notablemente más lento que nadar, para que sea evitable pero
// real.
export const LUMI_DRIFT_SPEED = 55; // px/seg, hacia abajo

// Fracción de la altura de cámara a la que se ancla Lumi en pantalla
// (0 = arriba del todo, 1 = abajo del todo) — antes 0.6, fijo sin
// importar el tamaño de pantalla real. Bug real encontrado probando en
// un iPhone real: con la cruceta táctil fija cerca del borde inferior
// (ver InputController.ts), Lumi (a 0.6 de una pantalla de móvil típica,
// 650-850px de alto) quedaba literalmente DEBAJO del botón "arriba" de
// la cruceta — el solapamiento no era un caso raro, pasaba siempre, en
// cualquier pantalla de móvil real. Bajado a 0.48 para dejar hueco real
// entre Lumi y la cruceta.
export const LUMI_SCREEN_ANCHOR_Y = 0.48;

// Nenúfares: separación vertical entre uno y el siguiente al generarlos
// según Lumi sube. Pedido explícito: que no salgan tan seguido. Pedido
// posterior: "bajaría un 50% su spawn" — el doble de separación es la
// mitad de frecuencia.
export const LILY_PAD_MIN_GAP = 320 * 2;
export const LILY_PAD_MAX_GAP = 520 * 2;

// Pedido explícito: 70% más pequeños que el tamaño nativo del recorte.
export const LILY_PAD_SCALE = 0.3;

// Velocidad/duración base del impulso del nenúfar (Lumi.triggerBoost, con
// LILY_PAD_BOOST_MULT abajo) — moved aquí desde Lumi.ts (antes locales
// sin exportar) porque LILY_PAD_BOOST_DISTANCE, más abajo, necesita
// calcular con ellas cuánto avanza el impulso en píxeles. (El power-up de
// boost aparte, que también las usaba con su propio multiplicador, se
// retiró del todo — ver el aviso más abajo, cerca de donde vivían sus
// constantes.)
export const BOOST_BASE_SPEED = LUMI_SWIM_SPEED * 2.9;
export const BOOST_DURATION_MS = 550;
// Últimos BOOST_EASE_MS del impulso: la velocidad baja de forma gradual
// de 100% a 50% en vez de cortar en seco a la velocidad normal.
export const BOOST_EASE_MS = 150;

// Pedido explícito: "el propulsor del nenúfar bájale un 20%", y una
// ronda después "le bajaría un 20% más su propulsor" — 0.8 y luego
// 0.8*0.8.
export const LILY_PAD_BOOST_MULT = 0.8 * 0.8;

// Pedido explícito: "encima de cada nenúfar pondría monedas hasta donde
// propulse" — distancia que de verdad recorre Lumi durante el impulso
// del nenúfar, para trazar un camino de monedas hasta ahí (ver
// LilyPadSpawner.spawnAt). Calculada a partir de las constantes de
// arriba en vez de puesta a mano, para que si se vuelve a tocar la
// velocidad/duración del impulso esta distancia seguga siendo la real:
// velocidad plena durante (BOOST_DURATION_MS - BOOST_EASE_MS), luego
// velocidad media (75% de la plena) durante los BOOST_EASE_MS de bajada
// lineal de 100% a 50%.
const LILY_PAD_BOOST_FULL_SPEED = BOOST_BASE_SPEED * LILY_PAD_BOOST_MULT;
export const LILY_PAD_BOOST_DISTANCE =
  LILY_PAD_BOOST_FULL_SPEED * ((BOOST_DURATION_MS - BOOST_EASE_MS) / 1000) +
  LILY_PAD_BOOST_FULL_SPEED * 0.75 * (BOOST_EASE_MS / 1000);

// Si Lumi cae más allá de esto por debajo del borde inferior de la
// cámara, se considera que ha caído del todo: game over.
export const GAME_OVER_MARGIN = 200;

// Medusas: primer enemigo, introducido "poco a poco" — mucho más
// espaciadas que los nenúfares para que sea una amenaza ocasional, no una
// pared de peligros.
// Pedido explícito: "reestructuremos el nivel, hay que darle espacio a
// las cosas... está todo muy pegado". Los huecos de Zone1Level.ts (y
// estos MIN/MAX_GAP, que rigen la cadencia aleatoria después del tramo
// scripteado) se pensaron cuando LUMI_SWIM_SPEED era más baja (220-310);
// tras subirla a 403 sin re-tocar las distancias, el mismo hueco en
// píxeles se cruza mucho más rápido — de ahí la sensación de "pegado"
// aunque los números no habían cambiado. Todos los *_MIN_GAP/*_MAX_GAP de
// peligros de esta sección, más los offsets de Zone1Level.ts, suben
// ×1.6 (factor único, ver también CAMERA_RISE_RAMP_ALTITUDE/
// CURRENT_ZONE_START_OFFSET/SHARK_CHASE_MIN_OFFSET más abajo, reescalados
// igual para no romper su relación con el final de la Zona 1). Pedido
// explícito posterior, tras probar esa ronda: "hazlo mucho mucho más
// separado" — ×2 adicional sobre lo anterior (×3.2 acumulado desde el
// valor original).
export const JELLYFISH_MIN_GAP = 700 * 1.6 * 2;
export const JELLYFISH_MAX_GAP = 1300 * 1.6 * 2;
export const JELLYFISH_SCALE = 0.16;

// La cámara ya no espera solo a que Lumi suba: sube ella sola sin parar,
// mucho más despacio que nadar a tope, para que exista presión incluso si
// el jugador va despacio. Si Lumi sube más rápido que esto, manda su propia
// velocidad (ver PondScene.update).
//
// Pedido explícito: la velocidad no debe ser un valor fijo — debe empezar
// tranquila (para aprender) y subir progresivamente con la altura, sin
// saltos bruscos, hasta un tope razonable un 80% más rápido que el valor
// anterior (42 -> 76). CAMERA_RISE_RAMP_ALTITUDE es la altura (misma escala
// que ZoneConfig, START/10 por segundo) a la que se alcanza ese tope —
// coincide con el final de la Zona 1 (ver ZoneConfig.ts).
// Pedido explícito: "la velocidad de la cámara un poco más rápida" — un
// empujón modesto (+15%), no otro salto grande como el de rondas
// anteriores.
export const CAMERA_RISE_SPEED_START = 42 * 1.15;
export const CAMERA_RISE_SPEED_MAX = 76 * 1.15;
// Antes en 10000 — calculado para una partida completa de las 8 zonas
// (10000 es literalmente el altitudeStart de la Zona 8 "Superficie" en
// ZoneConfig.ts). Pero solo existe contenido jugable hasta la Zona 1
// (Tramo 1+2 llega a altura 650, ver ZONE1_LEVEL_END_OFFSET) — las Zonas
// 2-8 todavía no tienen arte ni diseño propio. Con el valor viejo, la
// cámara pasaba TODO el juego actualmente jugable dentro del primer 6.5%
// de esa rampa, apenas subiendo de 42 a ~44px/s — nunca llegaba a
// sentirse más urgente ("se ve lento" pese a que Lumi ya nada rápido).
// Bajado a 650 para que la presión suba de verdad a lo largo de todo el
// contenido que existe hoy. Si/cuando se construyan las Zonas 2-8, este
// valor debería revisarse otra vez para que la rampa cubra todo el juego
// más largo, no solo la Zona 1. Reescalado ×1.6, y de nuevo ×2 sobre eso
// ("mucho mucho más separado") junto con el resto de distancias — el
// final de la Zona 1 se movió otra vez (ver ZONE1_LEVEL_END_OFFSET), así
// que la rampa tiene que llegar igual de lejos que antes.
export const CAMERA_RISE_RAMP_ALTITUDE = 650 * 1.6 * 2;

// Tiburones: segundo enemigo, "poco a poco" tras la medusa — patrullan de
// lado a lado en vez de solo derivar como la medusa. Patrullan un radio
// local (no todo el ancho del mundo) para que el vaivén se note dentro del
// tiempo que dura el encuentro, no una sola pasada en una dirección. Su
// primera aparición ya no es un *_START_OFFSET fijo: la decide el nivel
// scripteado del Tramo 1 (ver Zone1Level.ts) — estos valores solo rigen
// su cadencia aleatoria a partir de ahí.
export const SHARK_MIN_GAP = 1200 * 1.6 * 2;
export const SHARK_MAX_GAP = 2000 * 1.6 * 2;
// Pedido explícito: "los animales un 20% más pequeños todos menos el
// erizo y la medusa" — tiburón, calamar y pez grande sí, erizo/medusa no
// se tocan (ver URCHIN_SCALE/JELLYFISH_SCALE).
export const SHARK_SCALE = 0.22 * 0.8;
export const SHARK_PATROL_SPEED = 130;
// Pedido explícito: "que recorra todo el tramo" — antes (260px a cada
// lado) el radio quedaba muy recortado por WORLD_MARGIN_X en la mayoría de
// puntos de aparición (spawnea entre 0.3-0.7 de WORLD_WIDTH), así que en la
// práctica solo cubría ~55% del ancho del mundo, se leía como un vaivén
// corto en el centro. Con un radio mayor que el propio ancho del mundo, el
// recorte a los márgenes (ver Shark.place/maybeStartChase) garantiza que
// SIEMPRE patrulla de punta a punta, sea cual sea su x de spawn.
export const SHARK_PATROL_RANGE = 1000; // px a cada lado del punto de aparición (recortado a los márgenes del mundo)

// Progresión del tiburón: los que aparecen ya cerca del final de la Zona 1
// pueden, una única vez cada uno (nunca de forma permanente), lanzarse en
// una persecución corta hacia Lumi si pasa cerca — un evento puntual que
// culmina la progresión del enemigo, no un comportamiento nuevo constante.
export const SHARK_CHASE_MIN_OFFSET = 5000 * 1.6 * 2; // reescalado con el resto de la Zona 1 (ver arriba)
export const SHARK_CHASE_TRIGGER_RANGE_X = 260;
export const SHARK_CHASE_TRIGGER_RANGE_Y = 240;
export const SHARK_CHASE_SPEED = 240;
export const SHARK_CHASE_DURATION_MS = 2200;

// Calamares: tercer enemigo — impulsos rápidos en vez de patrulla
// constante, para que cada peligro se esquive de forma distinta. Su debut
// ya no es un *_START_OFFSET propio: lo decide el nivel scripteado del
// Tramo 2 (ver Zone1Level.ts), igual que el resto; estos valores solo
// rigen su cadencia aleatoria a partir de ahí.
export const SQUID_MIN_GAP = 1100 * 1.6 * 2;
export const SQUID_MAX_GAP = 1900 * 1.6 * 2;
export const SQUID_SCALE = 0.18 * 0.8; // -20%, ver SHARK_SCALE

// Erizos: cuarto enemigo — casi no se mueven, son un obstáculo "plantado"
// a esquivar, no una criatura que persigue. Su primera aparición la decide
// el nivel scripteado del Tramo 1 (ver Zone1Level.ts), igual que el
// tiburón; estos valores solo rigen su cadencia aleatoria a partir de ahí.
// Pedido explícito: "los pinchos un poco más separados".
export const URCHIN_MIN_GAP = 900 * 1.6 * 2 * 1.4;
export const URCHIN_MAX_GAP = 1500 * 1.6 * 2 * 1.4;
export const URCHIN_SCALE = 0.17;

// Pez grande: reutiliza el arte de pez ya existente (fish_05) a mayor
// escala — a diferencia del resto, tocarlo NO es game over, solo empuja a
// Lumi lejos (un obstáculo que estorba, no que mata). Su primera aparición
// la decide el nivel scripteado del Tramo 1 (ver Zone1Level.ts); estos
// valores solo rigen su cadencia aleatoria a partir de ahí.
export const BIG_FISH_MIN_GAP = 1300 * 1.6 * 2;
export const BIG_FISH_MAX_GAP = 2100 * 1.6 * 2;

// Cangrejo: sexto enemigo (pedido explícito: "veas qué nuevos enemigos
// hacer"). Se mueve a trompicones — quieto una pausa, ráfaga corta y
// rápida, quieto otra vez — un "lenguaje" de movimiento distinto a los 5
// peligros ya existentes. Ver entities/Crab.ts.
export const CRAB_MIN_GAP = 3500;
export const CRAB_MAX_GAP = 5500;
export const CRAB_SCALE = 0.14;
export const CRAB_DASH_SPEED = 230;
export const CRAB_DASH_DURATION_MS = 220;
export const CRAB_PAUSE_MIN_MS = 500;
export const CRAB_PAUSE_MAX_MS = 1100;
export const BIG_FISH_SCALE = 0.5 * 0.8; // -20%, ver SHARK_SCALE

// Almeja gigante: séptimo enemigo (pedido explícito: "crea más animales...
// la almeja podrías crearle una animación y que te coma"). Antes era una
// pieza decorativa de ReefCluster sin colisión real; ahora es un animal de
// verdad — igual de quieta que el erizo (una trampa "plantada", no una
// criatura que persigue), pero al tocarla se cierra de golpe como parte de
// la secuencia de muerte (ver GiantClam.ts y playClamBite en PondScene.ts).
// Gap parecido al del cangrejo (encuentro poco frecuente, no un peligro
// constante) — es más un "susto" puntual que una amenaza habitual.
export const GIANT_CLAM_MIN_GAP = 3800;
export const GIANT_CLAM_MAX_GAP = 6000;
export const GIANT_CLAM_SCALE = 0.24;
export const BIG_FISH_PATROL_SPEED = 60;
export const BIG_FISH_PUSH_STRENGTH = 300;
export const BIG_FISH_PUSH_COOLDOWN_MS = 500;

// Coral estrecho: pedido explícito — un obstáculo plantado que solo deja
// pasar a Lumi por UN lado (izquierda o derecha al azar), con el lado
// contrario completamente bloqueado. El carril libre queda garantizado sin
// ningún animal estático (medusa/erizo) encima — ver CoralSpawner e
// isWithinAnyCoralBand, consultado por esos spawners antes de colocar uno
// nuevo — para que cruzarlo no sea nunca una muerte 100% inevitable.
export const CORAL_START_OFFSET = 2200; // altura ~220
export const CORAL_MIN_GAP = 2000;
export const CORAL_MAX_GAP = 3200;
export const CORAL_GAP_WIDTH = 230; // ancho del carril libre garantizado
export const CORAL_WALL_MARGIN_X = 40; // margen respecto al borde del mundo
export const CORAL_CHUNK_SCALE = 0.32;

// ReefCluster: prototipo de obstáculo orgánico que sustituye a
// CoralWall/CoralSpawner en la instanciación real (ver PondScene y
// entities/ReefCluster.ts) — pedido explícito del usuario: nada de una
// pared de un único asset repetido en línea recta, cada cúmulo combina
// varias piezas (coral/roca/alga) en una composición diseñada a mano, con
// una ruta curva propia en vez de un simple hueco recto. CoralWall/
// CoralSpawner no se borran, solo dejan de usarse, por si hay que
// revertir. Sus primeras apariciones (Tramo 1) las decide el nivel
// scripteado (ver Zone1Level.ts); estos valores solo rigen su cadencia
// aleatoria a partir de ahí.
// Pedido explícito: "los objetos del lateral... crea más" — más
// presencia de cúmulos de arrecife que el resto de peligros, así que su
// hueco baja un 40% respecto al valor ×3.2 de la ronda anterior (en vez
// de deshacer del todo esa separación, que sí aplicaba al resto de
// peligros).
export const REEF_CLUSTER_MIN_GAP = 2000 * 1.6 * 2 * 0.6;
export const REEF_CLUSTER_MAX_GAP = 3200 * 1.6 * 2 * 0.6;
export const REEF_COIN_SPACING = 90; // separación entre monedas a lo largo de la ruta guía

// Corriente de agua: no es una criatura, es una franja de mundo que empuja
// lateralmente mientras Lumi está dentro — el último obstáculo de la Zona
// 1, justo antes de la Zona 2. Antes era una fórmula duplicada e
// independiente de ZONE1_LEVEL_END_OFFSET (mismos números, "6500*1.6*2",
// mantenidos a mano en dos sitios) — se desincronizaron de verdad al
// insertar el laberinto de bienvenida en Zone1Level.ts (esa ronda solo
// tocó ZONE1_LEVEL_END_OFFSET, dejando la corriente arrancando ANTES de
// que terminara el gauntlet final scripteado). Derivado directamente de
// ZONE1_LEVEL_END_OFFSET para que ya no puedan volver a desincronizarse.
export const CURRENT_ZONE_START_OFFSET = ZONE1_LEVEL_END_OFFSET;
export const CURRENT_ZONE_MIN_GAP = 1600;
export const CURRENT_ZONE_MAX_GAP = 2600;
export const CURRENT_ZONE_HEIGHT = 260;
export const CURRENT_ZONE_STRENGTH = 85; // px/seg de empuje lateral

// Sistema de vidas: 3 golpes peligrosos antes del game over de verdad (ver
// PondScene.takeDamage), con una invulnerabilidad breve tras cada golpe no
// letal para no perder varias vidas de golpe por el mismo peligro.
export const LUMI_LIVES_START = 3;
export const LUMI_INVULNERABILITY_MS = 1400;
export const LUMI_HIT_KNOCKBACK_STRENGTH = 220;

// Power-up: escudo de burbuja. Aparece pronto (antes que la propia medusa)
// y absorbe UN golpe de cualquier enemigo letal (medusa/tiburón/calamar/
// erizo) — no protege del empuje del pez grande ni de la corriente, esos
// no matan de todas formas.
export const SHIELD_START_OFFSET = 400; // altura ~40
export const SHIELD_MIN_GAP = 2200;
export const SHIELD_MAX_GAP = 3400;
export const SHIELD_PICKUP_SCALE = 0.22;
export const SHIELD_AURA_SCALE = 0.55;
export const SHIELD_AURA_ALPHA = 0.55;

// Monedas: recompensa + guía visual de ruta. Se generan en pequeños grupos
// (arco/línea, ver CoinSpawner) en vez de puntos sueltos al azar, para que
// su trazado sugiera por dónde conviene pasar — la mayoría en el centro
// "seguro", algún grupo ocasional más al lado como recompensa de riesgo.
// Pedido explícito: eran demasiado grandes (a 0.11 sobre la textura vieja
// de 791px medían ~87px, más que COIN_GROUP_SPACING=70 — se solapaban
// entre sí dentro del mismo grupo). La textura nueva (508px) a 0.08 mide
// ~41px, con margen de sobra respecto al espaciado del grupo.
// Pedido explícito del usuario: "las monedas tienen que salir de forma
// ordenada y que tengan la misma distancia de separación una de otra y en
// fila o diagonal" — el arco curvo anterior (COIN_GROUP_ARC_SPREAD, cada
// moneda desplazada según su distancia al centro del grupo) se veía
// desordenado. Ahora cada grupo es una línea recta de verdad: recta
// vertical (misma X) o diagonal con el mismo paso de X entre moneda y
// moneda — en ambos casos la distancia moneda-a-moneda es constante.
export const COIN_SCALE = 0.08;
export const COIN_GROUP_MIN_GAP = 500;
export const COIN_GROUP_MAX_GAP = 850;
export const COIN_GROUP_SIZE_MIN = 3;
export const COIN_GROUP_SIZE_MAX = 5;
export const COIN_GROUP_SPACING = 70; // separación vertical entre monedas de un mismo grupo
export const COIN_GROUP_DIAGONAL_STEP = 45; // paso horizontal constante por moneda en un grupo diagonal
export const COIN_RISKY_GROUP_CHANCE = 0.25;

// El power-up de impulso vertical (burbuja pequeña independiente del
// nenúfar) se retiró del todo — pedido explícito: "QUITA LAS BURBUJAS QUE
// SON PEQUEÑITAS que aún está ese power up, no lo quiero". Ver
// BoostPickupSpawner.ts/BoostPickup.ts, borrados; Lumi.triggerSuperBoost,
// borrado.
