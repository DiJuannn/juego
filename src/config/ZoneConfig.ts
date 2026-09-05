import { FISH_KEYS } from "@/systems/BackgroundFishField";
import { START_Y } from "./GameConfig";

/**
 * Las 8 zonas del mundo, definidas en unidades de "Altura" (el mismo número
 * que ya se muestra en pantalla: `bestHeight / 10`) para que sean fáciles de
 * ajustar jugando, sin tener que pensar en píxeles de mundo.
 *
 * IMPORTANTE: de momento zonas 2-8 son solo DATOS de progresión (tinte de
 * profundidad + nombre), reutilizando el arte de la Zona 1 (fishKeys). Esto
 * es intencional: el refactor de esta tarea no genera arte nuevo, solo deja
 * el sistema listo para que cada zona reciba su propio arte (tarea "Zona 2:
 * Arrecife" y siguientes) sin tocar el motor otra vez. Sustituir fishKeys
 * por un set propio de cada zona cuando ese arte exista.
 */
export interface ZoneDefinition {
  id: number;
  name: string;
  /** Unidades de "Altura" (score en pantalla) donde empieza esta zona. */
  altitudeStart: number;
  /** Tinte de profundidad: color hex + opacidad máxima alcanzada dentro de
   * la zona (no en la transición). 0 = sin tinte (Zona 1, look actual). */
  tint: { color: number; alpha: number };
  fishKeys: string[];
}

/** Medio ancho de la banda de transición (en unidades de Altura) a cada
 * lado del límite entre dos zonas, durante la cual se mezclan tinte y pools
 * de las dos zonas de forma gradual. */
export const TRANSITION_HALF_WIDTH = 200;

// Pedido explícito del usuario: primero se alargaron mucho (última zona en
// 20000), pero se sintió que tardaba demasiado en notarse el cambio de
// zona. Se acortan a la mitad aproximadamente — siguen siendo más largas
// que el original (4500 en total) pero los cambios llegan antes.
export const ZONES: ZoneDefinition[] = [
  {
    id: 1,
    name: "Estanque",
    altitudeStart: 0,
    tint: { color: 0x000000, alpha: 0 },
    fishKeys: FISH_KEYS,
  },
  {
    id: 2,
    name: "Arrecife",
    altitudeStart: 750,
    tint: { color: 0x000000, alpha: 0 }, // TODO: sin arte propio todavía
    fishKeys: FISH_KEYS,
  },
  {
    id: 3,
    name: "Océano abierto",
    altitudeStart: 2000,
    tint: { color: 0x3a6fa8, alpha: 0.08 },
    fishKeys: FISH_KEYS,
  },
  {
    id: 4,
    name: "Aguas profundas",
    altitudeStart: 3750,
    tint: { color: 0x2d4f8a, alpha: 0.18 },
    fishKeys: FISH_KEYS,
  },
  {
    id: 5,
    name: "Abismo",
    altitudeStart: 5500,
    tint: { color: 0x1c2f5e, alpha: 0.32 },
    fishKeys: FISH_KEYS,
  },
  {
    id: 6,
    name: "Bosque bioluminiscente",
    altitudeStart: 7000,
    tint: { color: 0x24205c, alpha: 0.3 },
    fishKeys: FISH_KEYS,
  },
  {
    id: 7,
    name: "Ascenso",
    altitudeStart: 8500,
    tint: { color: 0x3a6fa8, alpha: 0.1 },
    fishKeys: FISH_KEYS,
  },
  {
    id: 8,
    name: "Superficie",
    altitudeStart: 10000,
    tint: { color: 0xfff2c4, alpha: 0.1 },
    fishKeys: FISH_KEYS,
  },
];

/** Misma fórmula que `bestHeight` en PondScene: cuánto ha subido Lumi desde
 * el punto de partida, en unidades de Altura (score en pantalla). */
export function altitudeFromWorldY(y: number): number {
  return (START_Y - y) / 10;
}
