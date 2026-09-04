import Phaser from "phaser";
import type { ReefClusterSpec, ReefPieceSpec } from "@/entities/ReefCluster";

/**
 * Prototipo (pedido explícito): solo 2-3 composiciones DISEÑADAS a mano
 * antes de tocar el resto de la Zona 1 — nada de "repartir coral cada X
 * píxeles". Cada plantilla fija qué pieza va dónde y por qué queda un
 * hueco ahí; solo la escala/rotación de cada pieza tiene un jitter
 * pequeño (ver JITTER_*) para que dos usos de la misma plantilla no sean
 * pixel-idénticos, sin cambiar la composición en sí.
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
 * carril. Ver brief del usuario, ejemplo 3 ("apertura diagonal").
 */
function diagonalLeft(worldWidth: number, centerY: number): ReefClusterSpec {
  const pieces: ReefPieceSpec[] = [
    piece({ key: "reef_rock_cluster", x: worldWidth * 0.14, y: centerY + 150, scale: 0.34, rotation: -0.04, role: "obstacle" }),
    piece({ key: "coral", x: worldWidth * 0.23, y: centerY + 45, scale: 0.55, rotation: 0.08, role: "obstacle" }),
    piece({
      key: "reef_coral_fan",
      x: worldWidth * 0.31,
      y: centerY - 70,
      scale: 0.32,
      rotation: -0.03,
      role: "obstacle",
      flipX: Math.random() < 0.5,
    }),
    piece({ key: "reef_rock_cluster", x: worldWidth * 0.37, y: centerY - 175, scale: 0.22, rotation: 0.05, role: "obstacle" }),
    // Decoración: crece pegada a los obstáculos, sin colisión.
    piece({ key: "decor_starfish", x: worldWidth * 0.2, y: centerY + 5, scale: 0.3, role: "decoration" }),
    piece({ key: "decor_pebble", x: worldWidth * 0.11, y: centerY + 195, scale: 0.35, role: "decoration" }),
    piece({ key: "decor_shell", x: worldWidth * 0.34, y: centerY - 130, scale: 0.28, role: "decoration" }),
    // Fondo: un eco pequeño y difuminado del arrecife más allá del hueco,
    // para dar profundidad sin ocupar la ruta.
    piece({ key: "reef_coral_fan", x: worldWidth * 0.86, y: centerY - 30, scale: 0.12, role: "background", alpha: 0.5 }),
    // Primer plano: una punta pequeña justo al borde del carril libre.
    piece({ key: "decor_pebble", x: worldWidth * 0.44, y: centerY + 165, scale: 0.16, role: "foreground", alpha: 0.9 }),
  ];

  const path = [
    { x: worldWidth * 0.62, y: centerY + 175 },
    { x: worldWidth * 0.72, y: centerY },
    { x: worldWidth * 0.68, y: centerY - 175 },
  ];

  return { pieces, path, yTop: centerY - 230, yBottom: centerY + 230 };
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
    piece({ key: "reef_rock_cluster", x: worldWidth * 0.45, y: centerY + 40, scale: 0.36, rotation: -0.02, role: "obstacle" }),
    piece({
      key: "reef_coral_fan",
      x: worldWidth * 0.54,
      y: centerY - 65,
      scale: 0.3,
      rotation: 0.03,
      role: "obstacle",
      flipX: true,
    }),
    piece({ key: "coral", x: worldWidth * 0.59, y: centerY + 125, scale: 0.42, rotation: -0.06, role: "obstacle" }),
    piece({ key: "decor_starfish", x: worldWidth * 0.38, y: centerY + 90, scale: 0.3, role: "decoration" }),
    piece({ key: "decor_shell", x: worldWidth * 0.63, y: centerY - 110, scale: 0.3, role: "decoration" }),
    piece({ key: "decor_pebble", x: worldWidth * 0.5, y: centerY + 180, scale: 0.3, role: "decoration" }),
    piece({ key: "reef_rock_cluster", x: worldWidth * 0.12, y: centerY - 10, scale: 0.1, role: "background", alpha: 0.45 }),
  ];

  // Camino "cómodo": el canal derecho, más ancho.
  const path = [
    { x: worldWidth * 0.8, y: centerY + 175 },
    { x: worldWidth * 0.83, y: centerY },
    { x: worldWidth * 0.79, y: centerY - 175 },
  ];

  // Un par de monedas sueltas en el canal izquierdo (más estrecho) — no un
  // trazado completo, solo la recompensa puntual de arriesgarse por ahí.
  const riskyBonus = [
    { x: worldWidth * 0.19, y: centerY + 60 },
    { x: worldWidth * 0.22, y: centerY - 60 },
  ];

  return { pieces, path: [...path, ...riskyBonus.map((p) => ({ ...p, y: p.y }))], yTop: centerY - 220, yBottom: centerY + 220 };
}

/**
 * 3) Curva en S entrando por los bordes: tres bandas dentro del mismo
 * cúmulo, cada una entra por un lado alterno (izquierda/derecha/
 * izquierda) — obliga a un recorrido en zigzag continuo, no un simple
 * salto de carril. Ver brief, ejemplo 6.
 */
function sCurveEdges(worldWidth: number, centerY: number): ReefClusterSpec {
  const topY = centerY - 160;
  const midY = centerY;
  const bottomY = centerY + 160;

  const pieces: ReefPieceSpec[] = [
    // Banda superior: entra por la izquierda.
    piece({ key: "reef_rock_cluster", x: worldWidth * 0.15, y: topY, scale: 0.4, rotation: -0.03, role: "obstacle" }),
    piece({ key: "reef_coral_fan", x: worldWidth * 0.32, y: topY - 20, scale: 0.28, rotation: -0.05, role: "obstacle" }),
    piece({ key: "decor_shell", x: worldWidth * 0.24, y: topY + 60, scale: 0.28, role: "decoration" }),

    // Banda media: entra por la derecha.
    piece({ key: "coral", x: worldWidth * 0.68, y: midY, scale: 0.5, rotation: 0.05, role: "obstacle" }),
    piece({ key: "reef_rock_cluster", x: worldWidth * 0.85, y: midY + 10, scale: 0.28, rotation: 0.02, role: "obstacle" }),
    piece({ key: "decor_starfish", x: worldWidth * 0.75, y: midY - 70, scale: 0.3, role: "decoration" }),

    // Banda inferior: entra por la izquierda otra vez, con distinto
    // alcance que la superior (para que no se lea como un espejo).
    piece({ key: "reef_coral_fan", x: worldWidth * 0.19, y: bottomY, scale: 0.3, rotation: 0.04, role: "obstacle" }),
    piece({ key: "coral", x: worldWidth * 0.33, y: bottomY + 15, scale: 0.4, rotation: -0.03, role: "obstacle" }),
    piece({ key: "decor_pebble", x: worldWidth * 0.27, y: bottomY - 70, scale: 0.3, role: "decoration" }),
  ];

  // La ruta serpentea: derecha (abajo) -> izquierda (medio) -> derecha (arriba).
  const path = [
    { x: worldWidth * 0.76, y: bottomY + 15 },
    { x: worldWidth * 0.52, y: bottomY - 90 },
    { x: worldWidth * 0.35, y: midY },
    { x: worldWidth * 0.55, y: topY + 90 },
    { x: worldWidth * 0.78, y: topY - 20 },
  ];

  return { pieces, path, yTop: centerY - 280, yBottom: centerY + 280 };
}

export const REEF_TEMPLATES: ((worldWidth: number, centerY: number) => ReefClusterSpec)[] = [
  diagonalLeft,
  centerTwoPaths,
  sCurveEdges,
];
