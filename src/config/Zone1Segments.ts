import Phaser from "phaser";
import { ZONE1_LEVEL_END_OFFSET } from "@/config/Zone1Level";

// Pedido explícito ("a los 5k se vuelve muy duro. Que se vaya poniendo
// difícil pero no tan duro... los enemigos que vayan apareciendo poco a
// poco, tipo primero las medusas luego caballitos, varios, y así"). Causa
// real encontrada: justo al pasar ZONE1_LEVEL_END_OFFSET, los ~13 spawners
// de peligro (medusa/erizo/tiburón/calamar/pez grande/cangrejo/almeja/
// coral trampa/caballito/balano/mantarraya/pez volador/dragón marino)
// retomaban TODOS su cadencia aleatoria a la vez, sin ningún tipo de
// introducción escalonada — con cada uno apareciendo cada pocos cientos de
// unidades de altura, la densidad combinada de los 13 a la vez se sentía
// como una pared, no como una subida de dificultad. Antes existía un
// intento de "banda de descanso" aquí (REST_BANDS en offset [4700,5000] y
// [5700,6000]) pero esos números quedaron obsoletos hace varias rondas —
// caen muy por debajo de ZONE1_LEVEL_END_OFFSET, así que en la práctica
// nunca se activaban para la zona aleatoria (solo importan ahí, ver
// Zone1Level.ts: el nivel scripteado usa spawnExact y no consulta esto).
//
// Reemplazo: cada tipo de peligro tiene su propia altura de desbloqueo
// (relativa al final del nivel scripteado) — antes de esa altura no
// aparece nunca en la zona aleatoria. Al desbloquearse, además, no salta
// directo a su cadencia completa: durante VENTANA_RAMPA unidades de altura
// aparece con una probabilidad que empieza baja y sube hasta el 100%, así
// que la transición se siente como "empieza a aparecer poco a poco" en vez
// de "de repente ya está aquí a cadencia normal".
export type HazardKind =
  | "jellyfish"
  | "seahorse"
  | "urchin"
  | "crab"
  | "shark"
  | "squid"
  | "coraltrap"
  | "barnacle"
  | "bigfish"
  | "clam"
  | "mantaray"
  | "flyingfish"
  | "seadragon"
  | "reef"
  | "coral";

// Oleadas de desbloqueo (pedido explícito: "primero las medusas luego
// caballitos, varios, y así"). "reef"/"coral" son obstáculos de arrecife,
// no criaturas nuevas que aprender — se quedan disponibles desde el
// principio de la zona aleatoria, igual que ya eran una presencia constante
// durante todo el nivel scripteado.
const UNLOCK_OFFSET: Record<HazardKind, number> = {
  reef: 0,
  coral: 0,
  jellyfish: 0,
  seahorse: 0,
  urchin: 2500,
  crab: 2500,
  shark: 5000,
  squid: 5000,
  coraltrap: 8000,
  barnacle: 8000,
  bigfish: 11000,
  clam: 11000,
  mantaray: 14000,
  flyingfish: 14000,
  seadragon: 18000,
};

// Cuánto tarda un tipo recién desbloqueado en llegar a su cadencia
// completa — ver isHazardAllowed.
const RAMP_WINDOW = 4000;
// Probabilidad mínima justo al desbloquearse (nunca 0: que se le vea el
// primero pronto, solo que sea raro al principio).
const RAMP_MIN_CHANCE = 0.2;

/** true si esa altura (offset por encima de START_Y) ya pasó la altura de
 * desbloqueo de este tipo de peligro — por debajo de eso, NUNCA aparece en
 * la zona aleatoria (aunque sí puede haber aparecido antes en el nivel
 * scripteado, que no consulta esto). */
function isUnlocked(offsetFromStart: number, kind: HazardKind): boolean {
  return offsetFromStart - ZONE1_LEVEL_END_OFFSET >= UNLOCK_OFFSET[kind];
}

/** Durante la ventana de rampa tras desbloquearse, no todo intento de
 * colocar este tipo tiene éxito — la probabilidad sube de forma lineal
 * desde RAMP_MIN_CHANCE hasta 1 a lo largo de RAMP_WINDOW. Esto es lo que
 * hace que un tipo nuevo se sienta "poco a poco" en vez de "ya está aquí a
 * cadencia normal desde su primer instante". */
function passesRamp(offsetFromStart: number, kind: HazardKind): boolean {
  const sinceUnlock = offsetFromStart - ZONE1_LEVEL_END_OFFSET - UNLOCK_OFFSET[kind];
  if (sinceUnlock >= RAMP_WINDOW) return true;
  const t = Math.max(0, sinceUnlock) / RAMP_WINDOW;
  const chance = Phaser.Math.Linear(RAMP_MIN_CHANCE, 1, t);
  return Math.random() < chance;
}

/** Cada spawner de peligro llama a esto antes de colocar una instancia
 * nueva en la zona aleatoria (después de ZONE1_LEVEL_END_OFFSET) — si el
 * tipo todavía no se desbloqueó a esta altura, o cae en su ventana de
 * rampa y "no le tocó" esta vez, no se coloca. */
export function isHazardAllowed(offsetFromStart: number, kind: HazardKind): boolean {
  if (!isUnlocked(offsetFromStart, kind)) return false;
  return passesRamp(offsetFromStart, kind);
}
