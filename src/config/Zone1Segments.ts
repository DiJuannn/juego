// Progresión de la Zona 1 (pedido explícito de la revisión de Zona 1):
// bandas de "descanso" garantizado repartidas por la altura, para que la
// dificultad suba con pausas reales entre grupos de peligros en vez de
// una densidad aleatoria constante. Solo aplican a partir de
// ZONE1_LEVEL_END_OFFSET (4000): por debajo de eso la progresión (y sus
// propios respiros) la decide el nivel scripteado a mano del Tramo 1, ver
// Zone1Level.ts — estas bandas pausan TODOS los peligros por igual durante
// una ventana corta, colocada justo después de introducir uno nuevo y
// antes del siguiente.
const REST_BANDS: Array<[number, number]> = [
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
