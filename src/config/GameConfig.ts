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

// Pedido explícito: Lumi se sentía lenta. Subido desde 220.
export const LUMI_SWIM_SPEED = 260; // px/seg

// El arte de swim_right/swim_left está dibujado sensiblemente más grande
// que el de idle/swim_up/diagonal dentro del mismo lienzo (~57% más grande
// de cabeza a cabeza, medido) — no es una pose distinta, es una
// inconsistencia real del asset. Se corrige por código con un multiplicador
// extra solo en esos dos estados en vez de regenerar el arte.
export const SWIM_SIDE_SCALE_CORRECTION = 0.64;

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

// La cámara ya no espera solo a que Lumi suba: sube ella sola a este ritmo
// (px/seg) sin parar, mucho más despacio que nadar a tope, para que exista
// presión incluso si el jugador va despacio. Si Lumi sube más rápido que
// esto, manda su propia velocidad (ver PondScene.update). Pedido explícito:
// un poco más rápido que antes.
export const CAMERA_AUTO_RISE_SPEED = 30;

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

// Corriente de agua: no es una criatura, es una franja de mundo que empuja
// lateralmente mientras Lumi está dentro — el último obstáculo de la Zona
// 1 (altura ~650), justo antes de la Zona 2.
export const CURRENT_ZONE_START_OFFSET = 6500; // altura ~650
export const CURRENT_ZONE_MIN_GAP = 1600;
export const CURRENT_ZONE_MAX_GAP = 2600;
export const CURRENT_ZONE_HEIGHT = 260;
export const CURRENT_ZONE_STRENGTH = 85; // px/seg de empuje lateral

// Power-up: escudo de burbuja. Aparece pronto (antes que la propia medusa)
// y absorbe UN golpe de cualquier enemigo letal (medusa/tiburón/calamar/
// erizo) — no protege del empuje del pez grande ni de la corriente, esos
// no matan de todas formas.
export const SHIELD_START_OFFSET = 400; // altura ~40
export const SHIELD_MIN_GAP = 2200;
export const SHIELD_MAX_GAP = 3400;
export const SHIELD_PICKUP_SCALE = 0.22;
