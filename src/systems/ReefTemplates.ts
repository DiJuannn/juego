import Phaser from "phaser";
import type { ReefClusterSpec, ReefPieceSpec } from "@/entities/ReefCluster";

/**
 * Prototipo (pedido explícito): solo 2-3 composiciones DISEÑADAS a mano
 * antes de tocar el resto de la Zona 1 — nada de "repartir coral cada X
 * píxeles". Cada plantilla fija qué pieza va dónde y por qué queda un
 * hueco ahí; solo la escala/rotación de cada pieza tiene un jitter
 * pequeño (ver JITTER_*) para que dos usos de la misma plantilla no sean
 * pixel-idénticos, sin cambiar la composición en sí.
 *
 * Piezas: `reef_dark_rock_branch`/`reef_dark_rock_plain`/
 * `reef_dark_rock_tall` son la SEGUNDA tanda — la primera (coral_mass/
 * rock_formation/kelp_frond/coral_mound, tonos salmón/coral) fue
 * rechazada por el usuario: "elimina todos esos objetos de piedra,
 * corales, etc." Pidió rocas oscuras que combinen con el tono azul/
 * pizarra del fondo ya existente (mismo lenguaje que los arcos de piedra
 * de `background_far.png`), con solo acentos MENORES de coral de color —
 * nunca coral como protagonista ("no solo corales").
 */

const JITTER_SCALE = 0.06;
const JITTER_ROT = 0.05;

function jitterScale(base: number): number {
  return base * (1 + Phaser.Math.FloatBetween(-JITTER_SCALE, JITTER_SCALE));
}

function jitterRot(base: number): number {
  return base + Phaser.Math.FloatBetween(-JITTER_ROT, JITTER_ROT);
}

type PieceInput = Omit<ReefPieceSpec, "rotation" | "scale"> & { scale: number; rotation?: number };

function piece(p: PieceInput): ReefPieceSpec {
  return { ...p, scale: jitterScale(p.scale), rotation: jitterRot(p.rotation ?? 0) };
}

/**
 * 1) Diagonal desde la izquierda: la masa de obstáculo crece en diagonal
 * de abajo-izquierda a arriba-derecha, dejando todo el lado derecho
 * abierto — pero la ruta guía traza una curva suave (no una línea recta)
 * para que cruzarla se sienta como una deriva continua, no un salto de
 * carril. Ver brief del usuario, ejemplo 3 ("apertura diagonal"). La
 * pieza "branch" (ya diagonal de por sí) hace de columna vertebral.
 */
function diagonalLeft(worldWidth: number, centerY: number): ReefClusterSpec {
  const pieces: ReefPieceSpec[] = [
    piece({ key: "reef_dark_rock_plain", x: worldWidth * 0.12, y: centerY + 160, scale: 0.38, rotation: -0.02, role: "obstacle" }),
    piece({ key: "reef_dark_rock_branch", x: worldWidth * 0.26, y: centerY - 10, scale: 0.42, rotation: -0.06, role: "obstacle" }),
    piece({ key: "reef_dark_rock_tall", x: worldWidth * 0.35, y: centerY - 180, scale: 0.32, rotation: 0.03, role: "obstacle" }),
    // Decoración: crece pegada a los obstáculos, sin colisión.
    piece({ key: "decor_starfish", x: worldWidth * 0.19, y: centerY - 30, scale: 0.28, role: "decoration" }),
    piece({ key: "decor_pebble", x: worldWidth * 0.1, y: centerY + 200, scale: 0.32, role: "decoration" }),
    piece({ key: "decor_shell", x: worldWidth * 0.32, y: centerY - 145, scale: 0.26, role: "decoration" }),
    // Fondo: un eco pequeño y difuminado del arrecife más allá del hueco,
    // para dar profundidad sin ocupar la ruta.
    piece({ key: "reef_dark_rock_plain", x: worldWidth * 0.87, y: centerY - 30, scale: 0.09, role: "background", alpha: 0.4 }),
  ];

  const path = [
    { x: worldWidth * 0.63, y: centerY + 185 },
    { x: worldWidth * 0.73, y: centerY },
    { x: worldWidth * 0.69, y: centerY - 185 },
  ];

  return { pieces, path, yTop: centerY - 250, yBottom: centerY + 250 };
}

/**
 * 2) Masa central con dos caminos: un cúmulo en el centro deja pasar por
 * los dos lados, pero de ancho distinto (nunca simétrico) — la ruta guía
 * de monedas traza el lado más cómodo, y un par de monedas sueltas marcan
 * el lado estrecho como recompensa de riesgo (mismo criterio que
 * CoinSpawner con sus grupos "arriesgados"). Ver brief, ejemplo 2.
 */
function centerTwoPaths(worldWidth: number, centerY: number): ReefClusterSpec {
  const pieces: ReefPieceSpec[] = [
    piece({ key: "reef_dark_rock_plain", x: worldWidth * 0.44, y: centerY + 60, scale: 0.36, rotation: -0.02, role: "obstacle" }),
    piece({ key: "reef_dark_rock_tall", x: worldWidth * 0.55, y: centerY - 90, scale: 0.34, rotation: 0.02, role: "obstacle" }),
    piece({ key: "reef_dark_rock_branch", x: worldWidth * 0.5, y: centerY + 180, scale: 0.28, rotation: 0.1, role: "obstacle" }),
    piece({ key: "decor_starfish", x: worldWidth * 0.37, y: centerY + 95, scale: 0.3, role: "decoration" }),
    piece({ key: "decor_shell", x: worldWidth * 0.64, y: centerY - 100, scale: 0.3, role: "decoration" }),
    piece({ key: "decor_pebble", x: worldWidth * 0.5, y: centerY - 220, scale: 0.3, role: "decoration" }),
    piece({ key: "reef_dark_rock_tall", x: worldWidth * 0.12, y: centerY - 10, scale: 0.08, role: "background", alpha: 0.35 }),
  ];

  // Camino "cómodo": el canal derecho, más ancho.
  const path = [
    { x: worldWidth * 0.81, y: centerY + 185 },
    { x: worldWidth * 0.84, y: centerY },
    { x: worldWidth * 0.8, y: centerY - 185 },
  ];

  // Un par de monedas sueltas en el canal izquierdo (más estrecho) — no un
  // trazado completo, solo la recompensa puntual de arriesgarse por ahí.
  const riskyBonus = [
    { x: worldWidth * 0.18, y: centerY + 65 },
    { x: worldWidth * 0.21, y: centerY - 65 },
  ];

  return { pieces, path: [...path, ...riskyBonus], yTop: centerY - 230, yBottom: centerY + 230 };
}

/**
 * 3) Curva en S entrando por los bordes: tres bandas dentro del mismo
 * cúmulo, cada una entra por un lado alterno (izquierda/derecha/
 * izquierda) — obliga a un recorrido en zigzag continuo, no un simple
 * salto de carril. Ver brief, ejemplo 6.
 */
function sCurveEdges(worldWidth: number, centerY: number): ReefClusterSpec {
  const topY = centerY - 170;
  const midY = centerY;
  const bottomY = centerY + 170;

  const pieces: ReefPieceSpec[] = [
    // Banda superior: entra por la izquierda.
    piece({ key: "reef_dark_rock_plain", x: worldWidth * 0.14, y: topY, scale: 0.36, rotation: -0.02, role: "obstacle" }),
    piece({ key: "reef_dark_rock_tall", x: worldWidth * 0.28, y: topY - 40, scale: 0.28, rotation: 0.03, role: "obstacle" }),
    piece({ key: "decor_shell", x: worldWidth * 0.22, y: topY + 80, scale: 0.28, role: "decoration" }),

    // Banda media: entra por la derecha.
    piece({ key: "reef_dark_rock_branch", x: worldWidth * 0.66, y: midY, scale: 0.36, rotation: 0.08, role: "obstacle" }),
    piece({ key: "reef_dark_rock_plain", x: worldWidth * 0.86, y: midY + 20, scale: 0.3, rotation: 0.02, role: "obstacle" }),
    piece({ key: "decor_starfish", x: worldWidth * 0.77, y: midY - 80, scale: 0.3, role: "decoration" }),

    // Banda inferior: entra por la izquierda otra vez, con distinto
    // alcance que la superior (para que no se lea como un espejo).
    piece({ key: "reef_dark_rock_tall", x: worldWidth * 0.17, y: bottomY, scale: 0.3, rotation: -0.02, role: "obstacle" }),
    piece({ key: "reef_dark_rock_plain", x: worldWidth * 0.33, y: bottomY + 30, scale: 0.34, rotation: 0.03, role: "obstacle" }),
    piece({ key: "decor_pebble", x: worldWidth * 0.26, y: bottomY - 80, scale: 0.3, role: "decoration" }),
  ];

  // La ruta serpentea: derecha (abajo) -> izquierda (medio) -> derecha
  // (arriba), pasando bien lejos de la masa de la banda media (que ocupa
  // hasta ~0.6W) en los tramos de transición, no cortando por encima.
  const path = [
    { x: worldWidth * 0.82, y: bottomY + 20 },
    { x: worldWidth * 0.6, y: bottomY - 100 },
    { x: worldWidth * 0.32, y: midY },
    { x: worldWidth * 0.6, y: topY + 100 },
    { x: worldWidth * 0.84, y: topY - 30 },
  ];

  return { pieces, path, yTop: centerY - 300, yBottom: centerY + 300 };
}

/**
 * 4) Pared lateral: una masa que crece desde UN borde del mundo (al azar,
 * izquierda o derecha) hacia dentro, pegada al borde de verdad (la
 * primera pieza empieza casi en x=0/worldWidth, algo se sale incluso) para
 * que se lea como "la punta de algo mucho más grande que sigue fuera de
 * pantalla", no como un objeto suelto colocado ahí — pedido explícito del
 * usuario: "objetos que salen por la izquierda o laterales que
 * complementen al fondo... haciendo que el ajolote tenga que cambiar de
 * ruta". El lado contrario queda totalmente abierto. La pieza "branch" es
 * la columna vertebral natural aquí (ya es una repisa alargada).
 */
function lateralWall(worldWidth: number, centerY: number): ReefClusterSpec {
  const side: "left" | "right" = Math.random() < 0.5 ? "left" : "right";
  // Convierte una posición relativa al borde (0 = pegado al borde, hacia
  // dentro conforme crece) a coordenada absoluta de mundo, según el lado.
  const fromEdge = (relX: number) => (side === "left" ? relX * worldWidth : worldWidth - relX * worldWidth);

  const pieces: ReefPieceSpec[] = [
    // La pieza más cercana al borde se centra casi en el borde mismo (y un
    // poco más allá, x negativa o > worldWidth es inofensivo: la cámara
    // nunca llega ahí) — el resto de la masa "sigue" fuera de pantalla.
    piece({ key: "reef_dark_rock_plain", x: fromEdge(-0.02), y: centerY + 150, scale: 0.44, rotation: 0, role: "obstacle" }),
    piece({ key: "reef_dark_rock_branch", x: fromEdge(0.16), y: centerY - 30, scale: 0.46, rotation: 0.02, role: "obstacle" }),
    piece({ key: "reef_dark_rock_tall", x: fromEdge(0.3), y: centerY + 170, scale: 0.34, rotation: -0.02, role: "obstacle" }),
    piece({ key: "reef_dark_rock_tall", x: fromEdge(0.05), y: centerY - 200, scale: 0.28, rotation: 0.03, role: "obstacle" }),
    piece({ key: "decor_starfish", x: fromEdge(0.2), y: centerY + 30, scale: 0.3, role: "decoration" }),
    piece({ key: "decor_shell", x: fromEdge(0.32), y: centerY + 220, scale: 0.28, role: "decoration" }),
    piece({ key: "decor_pebble", x: fromEdge(0.05), y: centerY + 250, scale: 0.3, role: "decoration" }),
    // Fondo: un eco pequeño y difuminado del lado abierto, para que no se
    // sienta completamente vacío sin invadir la ruta.
    piece({ key: "reef_dark_rock_plain", x: fromEdge(0.85), y: centerY + 10, scale: 0.09, role: "background", alpha: 0.35 }),
  ];

  // El carril libre queda en el lado contrario a la masa, con margen
  // amplio (la masa solo ocupa ~40% del ancho del mundo) — la ruta guía
  // serpentea dentro de ese espacio abierto, nunca pegada al borde
  // opuesto ni en línea recta.
  const openCenterX = side === "left" ? worldWidth * 0.72 : worldWidth * 0.28;
  const path = [
    { x: openCenterX - 40, y: centerY + 200 },
    { x: openCenterX + 35, y: centerY + 20 },
    { x: openCenterX - 25, y: centerY - 150 },
    { x: openCenterX + 20, y: centerY - 260 },
  ];

  return { pieces, path, yTop: centerY - 300, yBottom: centerY + 300 };
}

export const REEF_TEMPLATES: ((worldWidth: number, centerY: number) => ReefClusterSpec)[] = [
  diagonalLeft,
  centerTwoPaths,
  sCurveEdges,
  lateralWall,
];
