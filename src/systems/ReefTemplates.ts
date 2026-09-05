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
 * Piezas: `reef_coral_branch`/`reef_boulder_rock` son la TERCERA tanda,
 * generada directamente a partir de las 3 imágenes de referencia que el
 * usuario subió a `/reference` — las dos tandas anteriores (coral salmón
 * sin roca base, luego roca oscura casi sin coral) fueron rechazadas por
 * no parecerse a esas referencias. Regla del usuario para esta tanda:
 * los obstáculos entran desde un lateral (izquierda/derecha) hacia
 * dentro, pero SIEMPRE dejando espacio de sobra para que Lumi pase.
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
 * Familia de "repisa/rama" (mismo ancla de estilo, generadas a partir de
 * `reef_coral_branch`) — pedido explícito del usuario: "necesito que
 * hagas muchos [obstáculos] e irlos poniendo de distintas formas". Cada
 * plantilla que usa una rama como columna vertebral elige una al azar en
 * vez de repetir siempre `reef_coral_branch`. Todas comparten la misma
 * convención: el coral está concentrado en su lado IZQUIERDO de fábrica,
 * así que al usarlas entrando por la derecha hay que espejarlas (flipX) —
 * salvo `reef_branch_straight`, que va exactamente al revés (ver
 * INVERT_FLIP_KEYS más abajo).
 */
const BRANCH_VARIANTS = ["reef_coral_branch", "reef_branch_straight", "reef_branch_hook", "reef_branch_short"];

function pickBranch(): string {
  return Phaser.Utils.Array.GetRandom(BRANCH_VARIANTS);
}

// Las ramas "largas" dejan menos hueco libre que las demás piezas a igual
// `scale` nominal — pedido explícito del usuario: "las que son largas que
// sea un poco más pequeño para que dé más espacio". reef_coral_branch
// queda fuera a propósito: "el de coral... ese así grandote me gustaba"
// (pedido explícito de mantenerlo en su tamaño grande original tras ver
// las 4 ya reducidas). branch_short ya es compacta de por sí.
const LONG_BRANCH_KEYS = new Set(["reef_branch_straight", "reef_branch_hook"]);

function branchScale(key: string, base: number): number {
  return LONG_BRANCH_KEYS.has(key) ? base * 0.85 : base;
}

// reef_branch_straight es la excepción a "el coral está a la izquierda de
// fábrica, espejar para el lado derecho": va EXACTAMENTE AL REVÉS —
// pedido explícito del usuario viendo un par real en el juego (uno en
// contexto izquierda, otro en contexto derecha): "DERECHA BIEN, izquierda
// poner espejo. SOLO ESO" — o sea, sin espejar cuando el contexto general
// pediría espejo (derecha) y espejada cuando el contexto general NO
// pediría espejo (izquierda). reef_branch_hook y reef_branch_short se
// probaron con la versión "nunca espejar" y se revirtieron (el usuario
// indicó que no eran esos) — se quedan con la convención normal.
const INVERT_FLIP_KEYS = new Set(["reef_branch_straight"]);

function branchFlipX(key: string, wantFlip: boolean): boolean {
  return INVERT_FLIP_KEYS.has(key) ? !wantFlip : wantFlip;
}

type Side = "left" | "right";

// Pedido explícito: "las rocas esas solo que salgan en los laterales...
// y volteadas 90 grados" — reef_boulder_rock nunca debe quedar flotando
// suelta en agua abierta (como pasaba en diagonalLeft/centerTwoPaths/
// sCurveEdges, a un 12-47% del ancho del mundo): en las 4 plantillas sale
// pegada a un borde de verdad, girada 90º para que su parte plana quede
// contra el lateral — mismo criterio que ya tenía `lateralWall` (ver
// ReefCluster.ts para el ajuste de hitbox que acompaña a esta rotación).
function edgeX(worldWidth: number, side: Side): number {
  return side === "left" ? -0.02 * worldWidth : 1.02 * worldWidth;
}

function edgeRotation(side: Side): number {
  return side === "left" ? Math.PI / 2 : -Math.PI / 2;
}

// Convierte una posición relativa a un borde (0 = pegado al borde, hacia
// dentro conforme crece el valor) a coordenada absoluta de mundo, según el
// lado — pedido explícito del usuario: "LOS OBSTACULOS DE LOS LATERALES
// TIENEN QUE IR PEGADOS AL LIMITE. PARA QUE NAZCAN DESDE AHI". Con el mundo
// mucho más angosto (ver WORLD_WIDTH), una pieza colocada a una fracción
// "media" del mundo (ej. 0.28-0.72, pensadas para el ancho viejo de
// 1376px) ya no se lee como "pegada a un lado": queda flotando cerca del
// centro de la pantalla. Toda pieza con role:"obstacle" debe usar esto (o
// edgeX, su caso límite en 0) en vez de `worldWidth * fracción` a secas.
function fromEdge(worldWidth: number, side: Side, relX: number): number {
  return side === "left" ? relX * worldWidth : worldWidth - relX * worldWidth;
}

// Para una rama pegada a un borde, el mismo criterio de "coral pegado al
// lado, parte lisa hacia el interior" se traduce en: coral apuntando hacia
// el borde al que está pegada.
function towardsRightEdge(x: number, worldWidth: number): boolean {
  return x >= worldWidth / 2;
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
  const branchKey1 = pickBranch();
  const branchX = fromEdge(worldWidth, "left", 0.15);
  const pieces: ReefPieceSpec[] = [
    piece({
      key: "reef_boulder_rock",
      x: edgeX(worldWidth, "left"),
      y: centerY + 160,
      scale: 0.4,
      rotation: edgeRotation("left"),
      role: "obstacle",
    }),
    piece({
      key: branchKey1,
      x: branchX,
      y: centerY - 40,
      scale: branchScale(branchKey1, 0.5),
      rotation: -0.04,
      flipX: branchFlipX(branchKey1, towardsRightEdge(branchX, worldWidth)),
      role: "obstacle",
    }),
    // Decoración: crece pegada a los obstáculos, sin colisión.
    piece({ key: "decor_starfish", x: fromEdge(worldWidth, "left", 0.09), y: centerY - 30, scale: 0.28, role: "decoration" }),
    piece({ key: "decor_pebble", x: fromEdge(worldWidth, "left", 0.04), y: centerY + 200, scale: 0.32, role: "decoration" }),
    piece({ key: "decor_shell", x: fromEdge(worldWidth, "left", 0.19), y: centerY - 175, scale: 0.26, role: "decoration" }),
    // Fondo: un eco pequeño y difuminado del arrecife más allá del hueco,
    // para dar profundidad sin ocupar la ruta.
    piece({ key: "reef_boulder_rock", x: fromEdge(worldWidth, "right", 0.08), y: centerY - 30, scale: 0.09, role: "background", alpha: 0.4 }),
  ];

  const path = [
    { x: worldWidth * 0.63, y: centerY + 185 },
    { x: worldWidth * 0.73, y: centerY },
    { x: worldWidth * 0.69, y: centerY - 185 },
  ];

  return { pieces, path, yTop: centerY - 250, yBottom: centerY + 250 };
}

/**
 * 2) Dos masas en bordes opuestos, en bandas de altura distinta: una pegada
 * a la izquierda más abajo, otra pegada a la derecha más arriba — la ruta
 * serpentea por el centro, abierto de sobra en todo momento porque ningún
 * obstáculo invade más allá de su propio lateral. Antes esto era una única
 * masa "central" (con el hueco a los lados) pero con el mundo mucho más
 * angosto (ver WORLD_WIDTH) un obstáculo a mitad de mapa ya no se lee como
 * "en un lado", se lee como bloqueando el paso entero — pedido explícito
 * del usuario: los obstáculos laterales van pegados al límite.
 */
function centerTwoPaths(worldWidth: number, centerY: number): ReefClusterSpec {
  const branchKey1 = pickBranch();
  const branchX = fromEdge(worldWidth, "right", 0.14);
  const pieces: ReefPieceSpec[] = [
    piece({
      key: "reef_boulder_rock",
      x: edgeX(worldWidth, "left"),
      y: centerY + 50,
      scale: 0.42,
      rotation: edgeRotation("left"),
      role: "obstacle",
    }),
    piece({
      key: branchKey1,
      x: branchX,
      y: centerY - 130,
      scale: branchScale(branchKey1, 0.36),
      rotation: 0.08,
      flipX: branchFlipX(branchKey1, towardsRightEdge(branchX, worldWidth)),
      role: "obstacle",
    }),
    piece({ key: "decor_starfish", x: fromEdge(worldWidth, "left", 0.14), y: centerY + 95, scale: 0.3, role: "decoration" }),
    piece({ key: "decor_shell", x: fromEdge(worldWidth, "right", 0.09), y: centerY - 100, scale: 0.3, role: "decoration" }),
    piece({ key: "decor_pebble", x: worldWidth * 0.5, y: centerY + 200, scale: 0.3, role: "decoration" }),
    piece({ key: "reef_boulder_rock", x: fromEdge(worldWidth, "left", 0.1), y: centerY - 10, scale: 0.08, role: "background", alpha: 0.35 }),
  ];

  // Serpentea por el centro: abajo se aparta hacia la derecha (huyendo de
  // la roca de la izquierda), arriba hacia la izquierda (huyendo de la
  // rama de la derecha).
  const path = [
    { x: worldWidth * 0.68, y: centerY + 185 },
    { x: worldWidth * 0.52, y: centerY },
    { x: worldWidth * 0.3, y: centerY - 185 },
  ];

  return { pieces, path, yTop: centerY - 230, yBottom: centerY + 230 };
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
  const sCurveBranchKey = pickBranch();

  const pieces: ReefPieceSpec[] = [
    // Banda superior: entra por la izquierda.
    piece({
      key: "reef_boulder_rock",
      x: edgeX(worldWidth, "left"),
      y: topY,
      scale: 0.38,
      rotation: edgeRotation("left"),
      role: "obstacle",
    }),
    piece({ key: "decor_shell", x: fromEdge(worldWidth, "left", 0.16), y: topY + 90, scale: 0.28, role: "decoration" }),

    // Banda media: entra por la derecha — espejada (ver BRANCH_VARIANTS),
    // para que la parte con coral quede pegada al borde.
    piece({
      key: sCurveBranchKey,
      x: fromEdge(worldWidth, "right", 0.12),
      y: midY - 30,
      scale: branchScale(sCurveBranchKey, 0.4),
      rotation: -0.1,
      flipX: branchFlipX(sCurveBranchKey, true),
      role: "obstacle",
    }),
    piece({ key: "decor_starfish", x: fromEdge(worldWidth, "right", 0.06), y: midY - 100, scale: 0.3, role: "decoration" }),

    // Banda inferior: entra por la izquierda otra vez — el "distinto
    // alcance" respecto a la superior ahora lo da la decoración (la roca
    // en sí va pegada al borde en ambas, ver edgeX).
    piece({
      key: "reef_boulder_rock",
      x: edgeX(worldWidth, "left"),
      y: bottomY,
      scale: 0.34,
      rotation: edgeRotation("left"),
      role: "obstacle",
    }),
    piece({ key: "decor_pebble", x: fromEdge(worldWidth, "left", 0.18), y: bottomY - 90, scale: 0.3, role: "decoration" }),
  ];

  // La ruta serpentea: derecha (abajo) -> izquierda (medio) -> derecha
  // (arriba), pasando bien lejos de la masa de la banda media (que ocupa
  // hasta ~0.6W) en los tramos de transición, no cortando por encima.
  const path = [
    { x: worldWidth * 0.82, y: bottomY + 20 },
    { x: worldWidth * 0.6, y: bottomY - 100 },
    { x: worldWidth * 0.35, y: midY },
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
 * usuario: "que salgan de la derecha o izquierda hacia dentro pero
 * siempre que deje el espacio suficiente para que pase el ajolote". El
 * lado contrario queda totalmente abierto, con margen generoso.
 */
function lateralWall(worldWidth: number, centerY: number): ReefClusterSpec {
  const side: "left" | "right" = Math.random() < 0.5 ? "left" : "right";
  const wallBranchKey = pickBranch();

  const pieces: ReefPieceSpec[] = [
    // La pieza más cercana al borde se centra casi en el borde mismo (y un
    // poco más allá, x negativa o > worldWidth es inofensivo: la cámara
    // nunca llega ahí) — el resto de la masa "sigue" fuera de pantalla.
    // Pedido explícito del usuario: girar la roca 90º según el lado para
    // que su parte plana quede pegada al lateral (ver ReefCluster.ts para
    // el ajuste de hitbox que acompaña a esta rotación).
    piece({
      key: "reef_boulder_rock",
      x: fromEdge(worldWidth, side, -0.02),
      y: centerY + 150,
      scale: 0.46,
      rotation: side === "left" ? Math.PI / 2 : -Math.PI / 2,
      role: "obstacle",
    }),
    // Pedido explícito del usuario: al salir por la derecha hay que
    // espejar la rama (flipX) para que la parte con coral quede pegada al
    // borde y la parte lisa apunte hacia el interior, igual que por la
    // izquierda sin espejar (ver BRANCH_VARIANTS para la convención).
    piece({
      key: wallBranchKey,
      x: fromEdge(worldWidth, side, 0.1),
      y: centerY - 60,
      scale: branchScale(wallBranchKey, 0.5),
      rotation: 0.02,
      flipX: branchFlipX(wallBranchKey, side === "right"),
      role: "obstacle",
    }),
    piece({ key: "decor_starfish", x: fromEdge(worldWidth, side, 0.2), y: centerY + 30, scale: 0.3, role: "decoration" }),
    piece({ key: "decor_shell", x: fromEdge(worldWidth, side, 0.28), y: centerY + 220, scale: 0.28, role: "decoration" }),
    piece({ key: "decor_pebble", x: fromEdge(worldWidth, side, 0.05), y: centerY + 250, scale: 0.3, role: "decoration" }),
    // Fondo: un eco pequeño y difuminado del lado abierto, para que no se
    // sienta completamente vacío sin invadir la ruta.
    piece({ key: "reef_boulder_rock", x: fromEdge(worldWidth, side, 0.85), y: centerY + 10, scale: 0.09, role: "background", alpha: 0.35 }),
  ];

  // El carril libre queda en el lado contrario a la masa, con margen
  // amplio (la masa solo ocupa ~35% del ancho del mundo) — la ruta guía
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
