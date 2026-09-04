// Constantes de tuning del juego. Nada de esto es arte: son números que
// controlan cámara, velocidad y tamaño en pantalla.

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

// El ancho coincide EXACTAMENTE con el de los PNG de fondo (1376px) para
// poder colocarlos una sola vez, a su resolución real, sin estirarlos ni
// repetirlos en mosaico (eso fue lo que se veía mal antes).
export const WORLD_WIDTH = 1376;

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
// más grande" anterior (0.075*3). Supera bastante el "10-15% de la
// pantalla" de STYLE_GUIDE.md — avisado, no es un descuido.
export const LUMI_SCALE = 0.075 * 3 * 1.2;

// Pedido explícito: Lumi se sentía lenta. Subido de 220 a 260, y de nuevo
// tras seguir sintiéndose lenta a 310.
export const LUMI_SWIM_SPEED = 310; // px/seg

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

// Nenúfares: separación vertical entre uno y el siguiente al generarlos
// según Lumi sube. Pedido explícito: que no salgan tan seguido.
export const LILY_PAD_MIN_GAP = 320;
export const LILY_PAD_MAX_GAP = 520;

// Pedido explícito: 70% más pequeños que el tamaño nativo del recorte.
export const LILY_PAD_SCALE = 0.3;

// Si Lumi cae más allá de esto por debajo del borde inferior de la
// cámara, se considera que ha caído del todo: game over.
export const GAME_OVER_MARGIN = 200;

// Medusas: primer enemigo, introducido "poco a poco" — mucho más
// espaciadas que los nenúfares para que sea una amenaza ocasional, no una
// pared de peligros.
export const JELLYFISH_MIN_GAP = 700;
export const JELLYFISH_MAX_GAP = 1300;
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
export const CAMERA_RISE_SPEED_START = 42;
export const CAMERA_RISE_SPEED_MAX = 76;
export const CAMERA_RISE_RAMP_ALTITUDE = 10000;

// Tiburones: segundo enemigo, "poco a poco" tras la medusa — empiezan a
// aparecer más arriba (altura ~300, dentro de la Zona 1) y patrullan de
// lado a lado en vez de solo derivar como la medusa. Patrullan un radio
// local (no todo el ancho del mundo) para que el vaivén se note dentro del
// tiempo que dura el encuentro, no una sola pasada en una dirección.
export const SHARK_START_OFFSET = 3000; // px por encima de START_Y (altura ~300)
export const SHARK_MIN_GAP = 1200;
export const SHARK_MAX_GAP = 2000;
export const SHARK_SCALE = 0.22;
export const SHARK_PATROL_SPEED = 130;
export const SHARK_PATROL_RANGE = 260; // px a cada lado del punto de aparición

// Progresión del tiburón: los que aparecen ya cerca del final de la Zona 1
// pueden, una única vez cada uno (nunca de forma permanente), lanzarse en
// una persecución corta hacia Lumi si pasa cerca — un evento puntual que
// culmina la progresión del enemigo, no un comportamiento nuevo constante.
export const SHARK_CHASE_MIN_OFFSET = 5000; // altura ~500: solo tiburones a partir de aquí pueden perseguir
export const SHARK_CHASE_TRIGGER_RANGE_X = 260;
export const SHARK_CHASE_TRIGGER_RANGE_Y = 240;
export const SHARK_CHASE_SPEED = 240;
export const SHARK_CHASE_DURATION_MS = 2200;

// Calamares: tercer enemigo, más arriba todavía (altura ~500) — impulsos
// rápidos en vez de patrulla constante, para que cada peligro se esquive
// de forma distinta.
export const SQUID_START_OFFSET = 5000; // px por encima de START_Y (altura ~500)
export const SQUID_MIN_GAP = 1100;
export const SQUID_MAX_GAP = 1900;
export const SQUID_SCALE = 0.18;

// Erizos: cuarto enemigo, entre la medusa y el tiburón (altura ~150) — casi
// no se mueven, son un obstáculo "plantado" a esquivar, no una criatura que
// persigue.
export const URCHIN_START_OFFSET = 1500; // altura ~150
export const URCHIN_MIN_GAP = 900;
export const URCHIN_MAX_GAP = 1500;
export const URCHIN_SCALE = 0.17;

// Pez grande: reutiliza el arte de pez ya existente (fish_05) a mayor
// escala — a diferencia del resto, tocarlo NO es game over, solo empuja a
// Lumi lejos (un obstáculo que estorba, no que mata).
export const BIG_FISH_START_OFFSET = 4000; // altura ~400
export const BIG_FISH_MIN_GAP = 1300;
export const BIG_FISH_MAX_GAP = 2100;
export const BIG_FISH_SCALE = 0.5;
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

// Corriente de agua: no es una criatura, es una franja de mundo que empuja
// lateralmente mientras Lumi está dentro — el último obstáculo de la Zona
// 1 (altura ~650), justo antes de la Zona 2.
export const CURRENT_ZONE_START_OFFSET = 6500; // altura ~650
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
export const COIN_SCALE = 0.11;
export const COIN_GROUP_MIN_GAP = 500;
export const COIN_GROUP_MAX_GAP = 850;
export const COIN_GROUP_SIZE_MIN = 3;
export const COIN_GROUP_SIZE_MAX = 5;
export const COIN_GROUP_SPACING = 70; // separación vertical entre monedas de un mismo grupo
export const COIN_GROUP_ARC_SPREAD = 90; // desplazamiento horizontal máx. dentro del arco del grupo
export const COIN_RISKY_GROUP_CHANCE = 0.25;

// Power-up de impulso vertical: distinto del nenúfar (que está siempre
// disponible como parte del terreno) — este es un power-up que se recoge
// como el escudo/las monedas, más escaso, y da un empujón notablemente más
// fuerte y largo (recompensa puntual, no una ayuda constante). Arte propio
// (remolino de burbujas ascendiendo) para que se distinga a simple vista
// del nenúfar (hoja verde) y del escudo (esfera translúcida).
export const BOOST_PICKUP_SCALE = 0.16;
export const BOOST_PICKUP_START_OFFSET = 1100; // altura ~110
export const BOOST_PICKUP_MIN_GAP = 2400;
export const BOOST_PICKUP_MAX_GAP = 3600;
export const SUPER_BOOST_DURATION_MS = 950;
export const SUPER_BOOST_SPEED_MULT = 1.5; // sobre BOOST_SPEED del nenúfar
