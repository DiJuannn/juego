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

export const LUMI_SWIM_SPEED = 220; // px/seg

// Hundimiento suave cuando Lumi no nada activamente: sin esto no habría
// tensión ninguna en un juego de escalada (podrías quedarte quieta para
// siempre). Notablemente más lento que nadar, para que sea evitable pero
// real.
export const LUMI_DRIFT_SPEED = 55; // px/seg, hacia abajo

// Nenúfares: separación vertical entre uno y el siguiente al generarlos
// según Lumi sube.
export const LILY_PAD_MIN_GAP = 180;
export const LILY_PAD_MAX_GAP = 320;

// Si Lumi cae más allá de esto por debajo del borde inferior de la
// cámara, se considera que ha caído del todo: game over.
export const GAME_OVER_MARGIN = 200;
