// Progresión de la Zona 1 (pedido explícito de la revisión de Zona 1):
// bandas de "descanso" garantizado repartidas por la altura, para que la
// dificultad suba con pausas reales entre grupos de peligros en vez de
// una densidad aleatoria constante. Cada peligro ya se introduce solo,
// poco a poco, gracias a su propio *_START_OFFSET en GameConfig (medusa
// 600, erizo 1500, coral 2200, tiburón 3000, pez grande 4000, calamar
// 5000) — estas bandas NO repiten esa lista blanca por tipo (se probó y
// recortaba demasiado la frecuencia de cada peligro, ver notas de diseño
// en el historial) sino que simplemente pausan TODOS los peligros por
// igual durante una ventana corta, colocada justo después de introducir
// uno nuevo y antes del siguiente — un respiro real sin dejar ningún
// peligro casi sin aparecer.
const REST_BANDS: Array<[number, number]> = [
  [900, 1200], // tras la medusa sola, antes del erizo
  [1900, 2200], // antes del primer coral
  [3300, 3600], // tras el primer tiburón, antes del pez grande
  [4700, 5000], // antes del calamar
  [5700, 6000], // antes del tramo final combinado (6000-6500) previo a la corriente
];

export type HazardKind = "medusa" | "erizo" | "tiburon" | "calamar" | "coral" | "pez_grande";

/** true si esa altura (offset por encima de START_Y) cae en un tramo de
 * descanso — se aplica igual a todos los peligros, así que solo hace
 * falta un parámetro de altura, no el tipo. */
export function isRestBand(offsetFromStart: number): boolean {
  return REST_BANDS.some(([start, end]) => offsetFromStart >= start && offsetFromStart < end);
}

/** Cada spawner de peligro (medusa/erizo/tiburón/calamar/coral/pez grande)
 * llama a esto antes de colocar una instancia nueva: si es un tramo de
 * descanso, no se coloca ahí — el tipo no importa, todos descansan igual. */
export function isHazardAllowed(offsetFromStart: number): boolean {
  return !isRestBand(offsetFromStart);
}
