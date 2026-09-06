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

// Pedido explícito: "pones todos los obstaculos encima de otros todos
// juntos... no queda bonito asi todo apeñuzcado". Causa real (confirmada
// con capturas): las piezas viejas (branch_*) eran un brazo largo y
// DELGADO — poca "masa" pintada real por unidad de escala nominal. Las
// piezas nuevas (rediseñadas sin base, más las 4 nuevas) son cúmulos
// REDONDOS Y RELLENOS — a la misma escala nominal ocupan muchísimo más
// espacio en pantalla (confirmado: con el primer ajuste, ×0.8, una sola
// pieza de coral llegaba a ocupar más de media altura de pantalla). Bajado
// a ×0.5 — con esto una pieza "obstacle" mide ~110-150px de lado, similar
// al tamaño ya aceptado de un erizo/medusa (ver URCHIN_SCALE), en vez de
// dominar la composición ella sola.
const GLOBAL_PACK_SCALE = 0.5;

function jitterScale(base: number): number {
  return base * GLOBAL_PACK_SCALE * (1 + Phaser.Math.FloatBetween(-JITTER_SCALE, JITTER_SCALE));
}

function jitterRot(base: number): number {
  return base + Phaser.Math.FloatBetween(-JITTER_ROT, JITTER_ROT);
}

type PieceInput = Omit<ReefPieceSpec, "rotation" | "scale"> & { scale: number; rotation?: number };

function piece(p: PieceInput): ReefPieceSpec {
  return { ...p, scale: jitterScale(p.scale), rotation: jitterRot(p.rotation ?? 0) };
}

// Pedido explícito: "mejora la composición del nivel... créame un nivel
// espectacular". `ReefCluster` ya tenía un rol "background" (más atrás,
// sin colisión — ver DEPTH_BY_ROLE) pensado justo para sugerir que el
// arrecife sigue más allá del cúmulo jugable, pero ninguna plantilla lo
// usaba: las 4 solo colocaban piezas "obstacle". Cada plantilla suma ahora
// un único acento así — pequeño, semitransparente, en una esquina libre de
// su propia composición — que da profundidad sin añadir dificultad ni
// amontonar el primer plano (no colisiona, así que no compite con el hueco
// real de paso).
function bgAccent(key: string, x: number, y: number, scale: number): ReefPieceSpec {
  return piece({ key, x, y, scale, alpha: 0.4, role: "background" });
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
// La posición X real de estas piezas ya no se calcula aquí (antes con un
// inset en fracción de `worldWidth`, ajustado a ojo varias veces y nunca
// sin hueco visible) sino con `edgeFlush` — ver `ReefPieceSpec.edgeFlush`
// y `edgeFlushX` en ReefCluster.ts, que calculan la X exacta a partir de la
// geometría real (textura, hitbox, rotación y escala) para que el borde
// visible de la pieza quede a ras del límite del mundo, sin hueco.
function edgeRotation(side: Side): number {
  return side === "left" ? Math.PI / 2 : -Math.PI / 2;
}

// Pedido explícito: "crea diferentes estilos de rocas... de distintos
// tamaños, más largas tmb pueden ser y haz lo mismo con los corales" — la
// pieza pegada al borde ya no es SIEMPRE reef_boulder_rock: cada uso de
// `wallPiece()` elige al azar entre rocas (2 estilos nuevos, ver
// docs/style_anchors.md) y los 4 corales rama (mismo criterio de "base es
// la de abajo" que ya tenía la roca — edgeRotation gira el sprite entero,
// así que la base de fábrica de cualquier pieza queda contra el lateral,
// sin necesidad de flipX).
interface WallPieceOption {
  key: string;
  /** Multiplicador sobre el `scale` que pide cada plantilla — no todas las
   * texturas tienen la misma proporción nativa (medido en el PNG real), así
   * que un `scale` crudo compartido las dejaría de tamaños muy distintos.
   * `reef_rock_slab` es la excepción a propósito: su recorte real mide casi
   * el doble de ancho que el resto (1090px vs ~650-700px) — bajarlo del
   * todo a 1 la haría ocupar casi toda la banda vertical del cúmulo, así
   * que se reduce a 0.6 y aun así queda claramente más larga y baja que las
   * demás, la variedad "más larga" que pidió el usuario sin dominar la
   * composición. */
  sizeMul: number;
}

const WALL_PIECE_POOL: WallPieceOption[] = [
  { key: "reef_boulder_rock", sizeMul: 1 },
  { key: "reef_rock_smooth", sizeMul: 1.15 },
  { key: "reef_rock_slab", sizeMul: 0.6 },
  { key: "reef_rock_spikes", sizeMul: 1 },
  { key: "reef_coral_branch", sizeMul: 1 },
  { key: "reef_branch_straight", sizeMul: 0.85 },
  { key: "reef_branch_hook", sizeMul: 0.85 },
  { key: "reef_branch_short", sizeMul: 1 },
];

/** Pieza "de pared" pegada a ras del borde del mundo (ver `edgeFlush` en
 * ReefCluster.ts) — sustituye a los usos fijos de `reef_boulder_rock` en
 * las 4 plantillas, eligiendo al azar entre todo `WALL_PIECE_POOL` cada
 * vez que se llama. */
function wallPiece(side: Side, y: number, baseScale: number): ReefPieceSpec {
  const option = Phaser.Utils.Array.GetRandom(WALL_PIECE_POOL);
  return piece({
    key: option.key,
    x: 0,
    edgeFlush: side,
    y,
    scale: baseScale * option.sizeMul,
    rotation: edgeRotation(side),
    role: "obstacle",
  });
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
  const branchX = fromEdge(worldWidth, "left", 0.23);
  const pieces: ReefPieceSpec[] = [
    wallPiece("left", centerY + 160, 0.4),
    piece({
      key: branchKey1,
      x: branchX,
      y: centerY - 40,
      scale: branchScale(branchKey1, 0.5),
      rotation: -0.04,
      flipX: branchFlipX(branchKey1, towardsRightEdge(branchX, worldWidth)),
      role: "obstacle",
    }),
    // Pedido explícito: "no los acumules todos en un mismo sitio, piensa
    // dónde poner cada uno" (y, tras verla amontonada con la roca+rama en
    // la primera versión: "no queda bonito asi todo apeñuzcado") — la
    // anémona va arriba del todo, lejos de la roca (y+160) y la rama
    // (y-40), en vez de justo al lado.
    piece({ key: "anemone", x: fromEdge(worldWidth, "left", 0.14), y: centerY - 210, scale: 0.28, role: "obstacle" }),
    // Acento de fondo: lejos del lado abierto (derecha), sugiere que el
    // arrecife sigue más allá sin invadir el carril libre.
    bgAccent("reef_coral_branch", worldWidth * 0.93, centerY + 60, 0.16),
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
  const branchX = fromEdge(worldWidth, "right", 0.22);
  const pieces: ReefPieceSpec[] = [
    wallPiece("left", centerY + 50, 0.42),
    piece({
      key: branchKey1,
      x: branchX,
      y: centerY - 130,
      scale: branchScale(branchKey1, 0.36),
      rotation: 0.08,
      flipX: branchFlipX(branchKey1, towardsRightEdge(branchX, worldWidth)),
      role: "obstacle",
    }),
    // Piedra suelta a mitad de camino, como pequeño obstáculo puntual en
    // el tramo abierto (no pegado a ningún borde) — a diferencia de las
    // demás piezas de esta lista, deliberadamente NO está pegada a un
    // lateral: el hueco libre a su alrededor sigue siendo amplio de sobra.
    piece({ key: "decor_pebble", x: worldWidth * 0.5, y: centerY + 200, scale: 0.3, role: "obstacle" }),
    // Pieza nueva: concha bien arriba de la roca (y+50), lejos de la ruta
    // guía (serpentea por 0.3-0.68W) y sin pegarse al cúmulo de abajo.
    piece({ key: "decor_shell", x: fromEdge(worldWidth, "left", 0.06), y: centerY - 190, scale: 0.24, role: "obstacle" }),
    // Acento de fondo: esquina inferior derecha, la más despejada de esta
    // composición (la roca queda a la izquierda, la rama arriba a la
    // derecha).
    bgAccent("reef_branch_short", worldWidth * 0.88, centerY + 180, 0.14),
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
    wallPiece("left", topY, 0.38),

    // Banda media: entra por la derecha — espejada (ver BRANCH_VARIANTS),
    // para que la parte con coral quede pegada al borde.
    piece({
      key: sCurveBranchKey,
      x: fromEdge(worldWidth, "right", 0.2),
      y: midY - 30,
      scale: branchScale(sCurveBranchKey, 0.4),
      rotation: -0.1,
      flipX: branchFlipX(sCurveBranchKey, true),
      role: "obstacle",
    }),
    // Pedido explícito: "piensa dónde poner cada uno" — esponja pegada al
    // techo de la banda, lejos de la rama media (midY-30) y del cúmulo
    // superior (topY, lado contrario).
    piece({ key: "sponge", x: fromEdge(worldWidth, "right", 0.1), y: topY - 100, scale: 0.24, role: "obstacle" }),

    // Banda inferior: entra por la izquierda otra vez — el "distinto
    // alcance" respecto a la superior ahora lo da la decoración (la pieza
    // de pared en sí va pegada al borde en ambas, ver wallPiece/edgeFlush).
    wallPiece("left", bottomY, 0.34),
    // Balanos pegados al fondo de la banda — mismo lado que el cúmulo
    // inferior pero bien por debajo, no encima.
    piece({ key: "barnacle", x: fromEdge(worldWidth, "left", 0.3), y: bottomY + 110, scale: 0.22, role: "obstacle" }),
    // Acento de fondo: esquina inferior derecha, la única sin ninguna otra
    // pieza de esta banda (rock+barnacle quedan a la izquierda).
    bgAccent("decor_starfish", fromEdge(worldWidth, "right", 0.06), bottomY + 90, 0.14),
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
    // Pedido explícito del usuario: girar la pieza 90º según el lado para
    // que su base quede pegada al lateral, a ras del borde real sin hueco
    // (ver edgeFlushX en ReefCluster.ts) — y variedad de estilo/tamaño
    // entre rocas y corales (ver wallPiece/WALL_PIECE_POOL).
    wallPiece(side, centerY + 150, 0.46),
    // Pedido explícito del usuario: al salir por la derecha hay que
    // espejar la rama (flipX) para que la parte con coral quede pegada al
    // borde y la parte lisa apunte hacia el interior, igual que por la
    // izquierda sin espejar (ver BRANCH_VARIANTS para la convención).
    piece({
      key: wallBranchKey,
      x: fromEdge(worldWidth, side, 0.18),
      y: centerY - 60,
      scale: branchScale(wallBranchKey, 0.5),
      rotation: 0.02,
      flipX: branchFlipX(wallBranchKey, side === "right"),
      role: "obstacle",
    }),
    // Mismo criterio de reparto: abanico de coral (arriba del todo), almeja
    // gigante (justo debajo, separada de la rama en y-60) y estrella (abajo
    // del todo) — únicas en esta plantilla, con al menos ~150px libres
    // entre cada una para que no se amontonen.
    piece({ key: "coral_fan", x: fromEdge(worldWidth, side, 0.16), y: centerY - 260, scale: 0.22, role: "obstacle" }),
    piece({ key: "giant_clam", x: fromEdge(worldWidth, side, 0.3), y: centerY + 100, scale: 0.26, role: "obstacle" }),
    piece({ key: "decor_starfish", x: fromEdge(worldWidth, side, 0.13), y: centerY + 260, scale: 0.28, role: "obstacle" }),
    // Acento de fondo: en el lado abierto (el contrario a la pared), lejos
    // de la ruta guía que serpentea por `openCenterX` — sugiere más
    // arrecife sin invadir el carril libre.
    bgAccent(
      "reef_boulder_rock",
      side === "left" ? worldWidth * 0.94 : worldWidth * 0.06,
      centerY - 100,
      0.16,
    ),
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

/**
 * 5) Gauntlet gigante: pedido explícito del usuario — "uno que ocupe casi
 * todo el mapa también y ese se coloque solito, que dé el espacio justo
 * para que lumi tenga que recorrer un camino... como un pequeño recorrido
 * al entrar al obstáculo". A diferencia de las otras 4 plantillas (que
 * siempre dejan la mayor parte del ancho libre y solo acompañan con
 * peligros/piezas menores), esta es deliberadamente una excepción sola: 2
 * bloques gigantes, cada uno entrando por un lateral distinto y penetrando
 * muy adentro del carril (`GAUNTLET_REACH_PX`, bastante más que el
 * `reach` de cualquier pieza de `wallPiece`), dejando solo un hueco justo
 * al lado contrario — cruzarla obliga a un recorrido en diagonal real, no
 * un simple esquive.
 *
 * Solo piezas de roca (nunca corales/ramas, que respiran con un pulso de
 * escala — ver BREATHE_* en ReefCluster.ts): con un hueco ya de por sí
 * ajustado, una hitbox que cambia de tamaño en vivo podría, en el peor
 * caso, cerrar el paso. Usando solo piezas sin animación de escala el
 * hueco es SIEMPRE exactamente el calculado aquí, sin ninguna variable en
 * vivo de por medio.
 */
const GAUNTLET_POOL = ["reef_boulder_rock", "reef_rock_smooth", "reef_rock_spikes"];
// Pensado con margen real: aun en el peor caso (reef_boulder_rock, la
// pieza con más "ancho a lo largo de la pared" por unidad de penetración,
// y el jitter de reach al +5%) el hueco libre resultante nunca baja de
// ~215px — unas 3.7 veces el ancho real del hitbox de Lumi (~58px a
// LUMI_SCALE) — tenso mirado al lado del resto del arrecife, pero
// holgado de sobra para cruzarlo sin frustración.
const GAUNTLET_REACH_PX = 450;
// Separación entre las 2 bandas: tiene que ser mayor que la extensión a lo
// largo de la pared de la pieza más "alta" a la penetración máxima
// (reef_boulder_rock: ~655×472.5/512 ≈ 605px) para que la banda superior
// (bloquea la izquierda) e inferior (bloquea la derecha) nunca se pisen en
// vertical — si se pisaran, esa franja quedaría bloqueada por AMBOS lados
// a la vez y no habría paso posible.
const GAUNTLET_BAND_SPACING = 750;

function gauntletBlocker(side: Side, y: number, reachPx: number): ReefPieceSpec {
  const key = Phaser.Utils.Array.GetRandom(GAUNTLET_POOL);
  return piece({
    key,
    x: 0,
    edgeFlush: side,
    edgeReach: { side, reachPx },
    y,
    scale: 1, // ignorado: edgeReach decide la escala real (ver ReefCluster.ts)
    rotation: edgeRotation(side),
    role: "obstacle",
  });
}

function grandGauntlet(worldWidth: number, centerY: number): ReefClusterSpec {
  const topY = centerY - GAUNTLET_BAND_SPACING / 2;
  const bottomY = centerY + GAUNTLET_BAND_SPACING / 2;
  // Jitter pequeño e independiente por banda (en vez del jitter de escala
  // genérico de `piece()`, que `edgeReach` ignora a propósito) — variedad
  // sutil entre cúmulos sin arriesgar el margen de seguridad calculado
  // arriba.
  const reachTop = GAUNTLET_REACH_PX * (1 + Phaser.Math.FloatBetween(-0.05, 0.05));
  const reachBottom = GAUNTLET_REACH_PX * (1 + Phaser.Math.FloatBetween(-0.05, 0.05));

  const pieces: ReefPieceSpec[] = [
    // Banda superior: bloquea desde la izquierda, hueco libre a la derecha.
    gauntletBlocker("left", topY, reachTop),
    // Banda inferior: bloquea desde la derecha, hueco libre a la
    // izquierda — cruzar de un hueco al otro es el "pequeño recorrido".
    gauntletBlocker("right", bottomY, reachBottom),
    // Acento de fondo único (mismo criterio que las otras 4 plantillas):
    // pegado al mismo lado que la banda superior, sugiriendo que esa masa
    // sigue más allá del borde — nunca suelto en mitad del carril libre.
    bgAccent("reef_rock_spikes", worldWidth * 0.08, topY - 120, 0.16),
  ];

  const gapTopCenterX = (worldWidth + reachTop) / 2;
  const gapBottomCenterX = (worldWidth - reachBottom) / 2;

  const path = [
    { x: gapBottomCenterX, y: bottomY + 220 },
    { x: gapBottomCenterX, y: bottomY },
    { x: (gapBottomCenterX + gapTopCenterX) / 2, y: centerY },
    { x: gapTopCenterX, y: topY },
    { x: gapTopCenterX, y: topY - 220 },
  ];

  return { pieces, path, yTop: topY - 250, yBottom: bottomY + 250 };
}

export const REEF_TEMPLATES: ((worldWidth: number, centerY: number) => ReefClusterSpec)[] = [
  diagonalLeft,
  centerTwoPaths,
  sCurveEdges,
  lateralWall,
  grandGauntlet,
];
