// Constantes de tuning del juego. Nada de esto es arte: son números que
// controlan cámara, velocidad y tamaño en pantalla.

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

// El mundo (estanque) es más grande que la pantalla para que tenga sentido
// el parallax al moverse la cámara siguiendo a Lumi. El ancho coincide
// EXACTAMENTE con el de los PNG de fondo (1376px) para poder colocarlos
// una sola vez, a su resolución real, sin estirarlos ni repetirlos en
// mosaico (eso fue lo que se veía mal antes).
export const WORLD_WIDTH = 1376;
export const WORLD_HEIGHT = 1400;

// STYLE_GUIDE.md: "Lumi ocupa aproximadamente 10-15% de la pantalla".
// Los frames fuente son de 1047x1024px; con este factor de escala Lumi
// mide ~77px de alto en un canvas de 640px de alto (~12%).
export const LUMI_SCALE = 0.075;

export const LUMI_SWIM_SPEED = 220; // px/seg
