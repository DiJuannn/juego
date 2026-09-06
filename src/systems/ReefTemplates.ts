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
 *
 * `reef_branch_hook` retirada del pool (pedido explícito, con captura
 * real: "esto mejor quitarlo no me convence estos diseños, elimina esos
 * dos obstáculos" — el diseño "coral cerebro" de rayas onduladas no
 * convenció). `reef_coral_branch` retirada en la misma limpieza de una
 * ronda posterior ("quita tmb... este tmb", con captura real del cúmulo
 * de coral rosa redondo — "vamos a hacer limpieza de obstáculos que no
 * quedan bien solos"). Ambas siguen cargadas en BootScene.ts y con su
 * bbox en ReefCluster.ts por si hay que revertir, pero ya no se eligen en
 * ningún lado (ni aquí ni en WALL_PIECE_POOL).
 */
const BRANCH_VARIANTS = ["reef_branch_straight", "reef_branch_short"];

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
  { key: "reef_branch_straight", sizeMul: 0.85 },
  // reef_branch_hook y reef_coral_branch retiradas (pedido explícito,
  // "no me convence este diseño" — ver comentario junto a BRANCH_VARIANTS).
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
    // La anémona que iba aquí se retiró (pedido explícito, con captura
    // real: "esto mejor quitarlo no me convence estos diseños, elimina
    // esos dos obstáculos" — la combinación anémona+reef_branch_hook no
    // convenció). Sigue cargada en BootScene.ts por si hay que revertir.
    // Acento de fondo: lejos del lado abierto (derecha), sugiere que el
    // arrecife sigue más allá sin invadir el carril libre.
    bgAccent("reef_boulder_rock", worldWidth * 0.93, centerY + 60, 0.16),
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
    // La concha (decor_shell) que iba aquí se retiró (pedido explícito:
    // "quita tmb todos los caracoles, no me gustan").
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
    // El abanico de coral (coral_fan) que iba aquí se retiró como pieza
    // estática: ahora es un animal real (ver entities/CoralTrap.ts,
    // pedido explícito de "animales que parezcan obstáculos como la
    // concha" — el mismo criterio que ya se usó con la almeja gigante).
    piece({ key: "decor_starfish", x: fromEdge(worldWidth, side, 0.13), y: centerY + 210, scale: 0.28, role: "obstacle" }),
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
 * 5) Pasillo/laberinto de arrecife: pedido explícito del usuario, en
 * corrección a un primer intento ("no sea un obstáculo en sí, sino como
 * una especie de pasillos diseñados de manera igual bonita, que tenga que
 * ir para al lado y luego arriba y luego lado otra vez y ya ahí salir...
 * como un laberinto o algo así pero bien diseñado"). El primer intento
 * (2 bandas, un único cruce en diagonal) se leía como "dos rocas enormes
 * que esquivar" — esto en cambio son 3 bandas alternando de lado
 * (izquierda/derecha/izquierda o al revés, al azar), cada una penetrando
 * muy adentro del carril, con espaciado vertical generoso entre bandas
 * para que cada tramo se sienta como un desplazamiento real, no un giro
 * instantáneo: lado (hueco de la banda 1) → arriba y al otro lado (hueco
 * de la banda 2, en el lado contrario) → arriba y de vuelta (hueco de la
 * banda 3, otra vez del lado de la 1) → salir. Pequeños acentos de
 * decoración junto a cada hueco (sin colisión) para que se lea como un
 * pasadizo cuidado, no como piedras sueltas.
 *
 * Solo piezas de roca en las 3 bandas (nunca corales/ramas, que respiran
 * con un pulso de escala — ver BREATHE_* en ReefCluster.ts): una hitbox
 * que cambia de tamaño en vivo podría, en el peor caso, cerrar el paso.
 * Usando solo piezas sin animación de escala el hueco de cada banda es
 * SIEMPRE exactamente el calculado aquí.
 */
const CORRIDOR_WALL_POOL = ["reef_boulder_rock", "reef_rock_smooth", "reef_rock_spikes"];
// Con margen real: aun en el peor caso (reef_boulder_rock, la pieza con
// más "ancho a lo largo de la pared" por unidad de penetración, y el
// jitter de reach al +5%) el hueco libre de cada banda nunca baja de
// ~270px — unas 4.6 veces el ancho real del hitbox de Lumi (~58px a
// LUMI_SCALE), holgado de sobra: aquí el reto es el recorrido en sí
// (varios tramos, tres cambios de lado), no la precisión del hueco.
const CORRIDOR_REACH_PX = 400;
// Separación entre bandas consecutivas: tiene que ser mayor que la
// extensión a lo largo de la pared de la pieza más "alta" a la
// penetración máxima (reef_boulder_rock: ~655×420/512 ≈ 537px, mitad
// ~269px) para que dos bandas vecinas nunca se pisen en vertical — si se
// pisaran, esa franja quedaría bloqueada por los dos lados a la vez y no
// habría paso posible. De paso, deja sitio real para el tramo "ir arriba"
// entre cada cambio de lado.
const CORRIDOR_BAND_SPACING = 700;

function corridorWall(side: Side, y: number, reachPx: number, pool: string[] = CORRIDOR_WALL_POOL): ReefPieceSpec {
  const key = Phaser.Utils.Array.GetRandom(pool);
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

function otherSide(side: Side): Side {
  return side === "left" ? "right" : "left";
}

/** Hueco libre (centro en X) que deja una pared con este `side`/`reachPx`. */
function corridorGapCenterX(worldWidth: number, side: Side, reachPx: number): number {
  return side === "left" ? (worldWidth + reachPx) / 2 : (worldWidth - reachPx) / 2;
}

function reefLabyrinth(worldWidth: number, centerY: number): ReefClusterSpec {
  const bottomY = centerY + CORRIDOR_BAND_SPACING;
  const midY = centerY;
  const topY = centerY - CORRIDOR_BAND_SPACING;

  // Lado de la banda inferior al azar — las otras dos se derivan para que
  // el zigzag (lado/lado contrario/lado) quede garantizado sin importar
  // cuál toque primero.
  const sideBottom: Side = Math.random() < 0.5 ? "left" : "right";
  const sideMid = otherSide(sideBottom);
  const sideTop = sideBottom;

  const jitterReach = () => CORRIDOR_REACH_PX * (1 + Phaser.Math.FloatBetween(-0.05, 0.05));
  const reachBottom = jitterReach();
  const reachMid = jitterReach();
  const reachTop = jitterReach();

  const gapBottom = corridorGapCenterX(worldWidth, sideBottom, reachBottom);
  const gapMid = corridorGapCenterX(worldWidth, sideMid, reachMid);
  const gapTop = corridorGapCenterX(worldWidth, sideTop, reachTop);

  // Acentos junto a cada hueco (sin colisión, role:"decoration") — pegados
  // a la punta de la pared, nunca dentro del carril libre, para que el
  // paso se lea como un pasadizo cuidado en vez de piedras sueltas.
  const wallTipBottom = sideBottom === "left" ? reachBottom : worldWidth - reachBottom;
  const wallTipMid = sideMid === "left" ? reachMid : worldWidth - reachMid;
  const wallTipTop = sideTop === "left" ? reachTop : worldWidth - reachTop;
  const inward = (side: Side) => (side === "left" ? 1 : -1);

  const pieces: ReefPieceSpec[] = [
    corridorWall(sideBottom, bottomY, reachBottom),
    corridorWall(sideMid, midY, reachMid),
    corridorWall(sideTop, topY, reachTop),
    piece({
      key: "decor_starfish",
      x: wallTipBottom + inward(sideBottom) * 35,
      y: bottomY - 70,
      scale: 0.22,
      role: "decoration",
    }),
    // coral_fan y decor_shell (junto a las bandas media/superior) se
    // retiraron en la limpieza de obstáculos sueltos (pedido explícito:
    // "quita tmb todos los caracoles... este tmb") — sustituidas por
    // esponja/balano, ya aprobados, sin tocar el mecanismo del laberinto
    // en sí (el usuario pidió explícitamente no tocar este diseño).
    piece({
      key: "sponge",
      x: wallTipMid + inward(sideMid) * 35,
      y: midY + 70,
      scale: 0.2,
      role: "decoration",
    }),
    piece({
      key: "barnacle",
      x: wallTipTop + inward(sideTop) * 35,
      y: topY + 70,
      scale: 0.2,
      role: "decoration",
    }),
    // Acento de fondo único (mismo criterio que las otras 4 plantillas):
    // pegado al mismo lado que la banda superior, sugiriendo que esa masa
    // sigue más allá del borde — nunca suelto en mitad del carril libre.
    bgAccent(
      "reef_rock_spikes",
      sideTop === "left" ? worldWidth * 0.08 : worldWidth * 0.92,
      topY - 150,
      0.16,
    ),
  ];

  // El camino traza los 3 cambios de lado con un punto intermedio en cada
  // tramo (mismo criterio que sCurveEdges) para que la curva se sienta
  // como un desplazamiento continuo, no un giro en seco.
  const path = [
    { x: gapBottom, y: bottomY + 200 },
    { x: gapBottom, y: bottomY },
    { x: (gapBottom + gapMid) / 2, y: (bottomY + midY) / 2 },
    { x: gapMid, y: midY },
    { x: (gapMid + gapTop) / 2, y: (midY + topY) / 2 },
    { x: gapTop, y: topY },
    { x: gapTop, y: topY - 200 },
  ];

  return { pieces, path, yTop: topY - 250, yBottom: bottomY + 250 };
}

/**
 * 6) Mini laberinto: pedido explícito del usuario tras ver `reefLabyrinth`
 * ("me gusta ese tipo de obstáculos son los que quería... ahora puedes
 * hacer uno tipo que no sea un obstáculo en sí en solitario, sino pasillos
 * diseñados... tipo mini laberinto") — la misma idea (3 bandas alternando
 * de lado, penetración profunda, nunca una pieza suelta flotando sola) a
 * escala reducida, pensada para la ROTACIÓN NORMAL de `REEF_TEMPLATES` en
 * vez de ser una excepción scripteada como el laberinto grande. Mismo
 * mecanismo (`corridorWall`/`edgeReach`), solo con menos penetración y
 * bandas más juntas para que la altura total del cúmulo quede en el mismo
 * orden que las otras 5 plantillas (~1000px, frente a los ~1900px del
 * laberinto grande) — pedido explícito de reducir el peso de los
 * obstáculos "flotando solos": esta plantilla reemplaza parte de esa
 * rotación con algo que se lee como un pasadizo diseñado, no una roca
 * suelta.
 */
const MINI_CORRIDOR_REACH_PX = 200;
// Con margen real (mismo criterio que CORRIDOR_BAND_SPACING, recalculado
// para este reach menor): en el peor caso (reef_boulder_rock, +5% de
// jitter) la extensión a lo largo de la pared llega a ~269px, así que
// 350px de separación entre bandas deja de sobra para que dos bandas
// vecinas nunca se pisen en vertical.
const MINI_CORRIDOR_BAND_SPACING = 350;

function miniLabyrinth(worldWidth: number, centerY: number): ReefClusterSpec {
  const bottomY = centerY + MINI_CORRIDOR_BAND_SPACING;
  const midY = centerY;
  const topY = centerY - MINI_CORRIDOR_BAND_SPACING;

  const sideBottom: Side = Math.random() < 0.5 ? "left" : "right";
  const sideMid = otherSide(sideBottom);
  const sideTop = sideBottom;

  const jitterReach = () => MINI_CORRIDOR_REACH_PX * (1 + Phaser.Math.FloatBetween(-0.05, 0.05));
  const reachBottom = jitterReach();
  const reachMid = jitterReach();
  const reachTop = jitterReach();

  const gapBottom = corridorGapCenterX(worldWidth, sideBottom, reachBottom);
  const gapMid = corridorGapCenterX(worldWidth, sideMid, reachMid);
  const gapTop = corridorGapCenterX(worldWidth, sideTop, reachTop);

  const wallTipBottom = sideBottom === "left" ? reachBottom : worldWidth - reachBottom;
  const wallTipTop = sideTop === "left" ? reachTop : worldWidth - reachTop;
  const inward = (side: Side) => (side === "left" ? 1 : -1);

  const pieces: ReefPieceSpec[] = [
    corridorWall(sideBottom, bottomY, reachBottom),
    corridorWall(sideMid, midY, reachMid),
    corridorWall(sideTop, topY, reachTop),
    // Un único acento por punta (vs. 3 en el laberinto grande) — a esta
    // escala más chica, más decoración se vería apeñuzcada.
    piece({
      key: "decor_starfish",
      x: wallTipBottom + inward(sideBottom) * 30,
      y: bottomY - 60,
      scale: 0.2,
      role: "decoration",
    }),
    piece({
      key: "barnacle",
      x: wallTipTop + inward(sideTop) * 30,
      y: topY + 60,
      scale: 0.18,
      role: "decoration",
    }),
    bgAccent(
      "reef_rock_spikes",
      sideTop === "left" ? worldWidth * 0.1 : worldWidth * 0.9,
      topY - 100,
      0.14,
    ),
  ];

  const path = [
    { x: gapBottom, y: bottomY + 130 },
    { x: gapBottom, y: bottomY },
    { x: (gapBottom + gapMid) / 2, y: (bottomY + midY) / 2 },
    { x: gapMid, y: midY },
    { x: (gapMid + gapTop) / 2, y: (midY + topY) / 2 },
    { x: gapTop, y: topY },
    { x: gapTop, y: topY - 130 },
  ];

  return { pieces, path, yTop: topY - 150, yBottom: bottomY + 150 };
}

/**
 * 7) Gran laberinto submarino: pedido explícito del usuario, distinto del
 * ya construido — "el que ya tenemos está súper [no se toca]... pero el
 * que digo yo es hacer otro pero diferente. Que sea más grande y mejor
 * diseñado... hueco de entrada y correr hacia al lado y luego hacia el
 * frente y otra vez hacia al lado y por último hacia arriba, pero que
 * tenga un diseño como de laberinto de verdad". 4 bandas (una más que
 * `reefLabyrinth`) con más penetración y más separación vertical — más
 * grande de verdad, no solo un reescalado — y un tipo de paso que ningún
 * otro laberinto tiene: una "puerta" con pared a AMBOS lados (hay que
 * cruzar recto por el centro, no esquivar hacia un lado), intercalada
 * entre los corredores de un solo lado de siempre. Esa mezcla de dos
 * "idiomas" de paso distintos dentro del mismo cúmulo es lo que lo hace
 * sentir como un laberinto real y no una repetición del mismo patrón:
 * entrada (lado) → puerta (recto) → corredor (lado contrario) → salida
 * (lado, hueco más generoso). Además, una hornacina decorativa sin
 * colisión junto a la puerta — un "camino falso" que no lleva a ningún
 * sitio, como en un laberinto de verdad, sin ningún riesgo real ya que no
 * colisiona.
 *
 * Misma garantía de seguridad que los otros dos laberintos: solo piezas
 * de roca (sin animación de escala en vivo) en las 4 bandas y en la
 * puerta, así que cada hueco es siempre exactamente el calculado aquí,
 * nunca varía en vivo.
 *
 * Arte nuevo generado con Gemini, EXCLUSIVO de este laberinto (nunca se
 * mezcla en `CORRIDOR_WALL_POOL`, que es el que usan `reefLabyrinth`/
 * `miniLabyrinth` — esos "no se tocan", pedido explícito). Segunda
 * versión de esa pieza: la primera ("estilo laberinto grande cozy", un
 * cúmulo de rocas) no convenció — pedido explícito de la ronda siguiente:
 * "la nueva pieza me la imagino totalmente diferente que no sean rocas.
 * Que sea como los laberintos reales pues de hojas, pero acuático".
 * `reef_maze_wall` es ahora un seto denso de hojas/algas (mismas anclas
 * de estilo que `foreground_plants`), y `GRAND_MAZE_WALL_POOL` ya NO
 * mezcla rocas clásicas — todo el laberinto es de un único lenguaje
 * visual (hojas), como pidió el usuario.
 *
 * Esta pieza es mucho más "ancha que alta" en su lienzo nativo (1344x768,
 * casi a sangre completa) que las rocas del pool clásico, así que su
 * extensión a lo largo de la pared una vez rotada 90º es bastante mayor
 * a igual `reachPx` — `GRAND_MAZE_BAND_SPACING` se subió de 700 a 1000
 * exactamente por esto (ver el comentario junto a esa constante).
 */
const GRAND_MAZE_WALL_POOL = ["reef_maze_wall"];
const GRAND_MAZE_REACH_PX = 430;
const GRAND_MAZE_EXIT_REACH_PX = 380;
// Hueco centrado de la "puerta" (pared a ambos lados) — igual de holgado
// que el resto (WORLD_WIDTH=690, así que quedan ~185px de penetración por
// lado, generoso de sobra para que la variedad de tamaño de
// CORRIDOR_WALL_POOL nunca lo achique en la práctica).
const GRAND_MAZE_GATE_GAP_PX = 320;
// Espaciado entre bandas: mayor que el de reefLabyrinth (700). Con la
// pieza de rocas original (más "redonda") 820px bastaba; con el seto de
// hojas (lienzo 1344x768, casi a sangre completa) la extensión a lo largo
// de la pared una vez rotado 90º es mucho mayor a igual reach — medido
// con el bbox real: a reach=430 (+5% de jitter) la extensión ronda 794px,
// mitad ~397px; el par más exigente es corredor-salida (397+351≈748px).
// Subido a 1000px para dejar ~250px de margen real, mismo criterio de
// sobra que el resto de laberintos.
const GRAND_MAZE_BAND_SPACING = 1000;

function mazeGate(y: number, gapPx: number, worldWidth: number): { pieces: ReefPieceSpec[]; reachEach: number } {
  const reachEach = (worldWidth - gapPx) / 2;
  return {
    pieces: [
      corridorWall("left", y, reachEach, GRAND_MAZE_WALL_POOL),
      corridorWall("right", y, reachEach, GRAND_MAZE_WALL_POOL),
    ],
    reachEach,
  };
}

function grandMaze(worldWidth: number, centerY: number): ReefClusterSpec {
  const yEntrance = centerY + GRAND_MAZE_BAND_SPACING * 1.5;
  const yGate = centerY + GRAND_MAZE_BAND_SPACING * 0.5;
  const yCorridor = centerY - GRAND_MAZE_BAND_SPACING * 0.5;
  const yExit = centerY - GRAND_MAZE_BAND_SPACING * 1.5;

  const sideEntrance: Side = Math.random() < 0.5 ? "left" : "right";
  const sideCorridor = otherSide(sideEntrance);
  const sideExit: Side = Math.random() < 0.5 ? "left" : "right";

  const jitterReach = (base: number) => base * (1 + Phaser.Math.FloatBetween(-0.05, 0.05));
  const reachEntrance = jitterReach(GRAND_MAZE_REACH_PX);
  const reachCorridor = jitterReach(GRAND_MAZE_REACH_PX);
  const reachExit = jitterReach(GRAND_MAZE_EXIT_REACH_PX);

  const gapEntrance = corridorGapCenterX(worldWidth, sideEntrance, reachEntrance);
  const gapCorridor = corridorGapCenterX(worldWidth, sideCorridor, reachCorridor);
  const gapExit = corridorGapCenterX(worldWidth, sideExit, reachExit);

  const inward = (side: Side) => (side === "left" ? 1 : -1);
  const wallTipEntrance = sideEntrance === "left" ? reachEntrance : worldWidth - reachEntrance;
  const wallTipCorridor = sideCorridor === "left" ? reachCorridor : worldWidth - reachCorridor;
  const wallTipExit = sideExit === "left" ? reachExit : worldWidth - reachExit;

  const gate = mazeGate(yGate, GRAND_MAZE_GATE_GAP_PX, worldWidth);
  // Hornacina decorativa junto a la puerta: un "camino falso" que no lleva
  // a ningún sitio (role: "background", sin colisión) — pegada al lado
  // opuesto al de la pared de entrada, para que se lea como una rama del
  // recorrido real y no como parte obvia de la puerta.
  const nookSide: Side = otherSide(sideEntrance);
  const nookX = nookSide === "left" ? worldWidth * 0.1 : worldWidth * 0.9;

  const pieces: ReefPieceSpec[] = [
    corridorWall(sideEntrance, yEntrance, reachEntrance, GRAND_MAZE_WALL_POOL),
    piece({
      key: "decor_starfish",
      x: wallTipEntrance + inward(sideEntrance) * 35,
      y: yEntrance - 80,
      scale: 0.24,
      role: "decoration",
    }),

    ...gate.pieces,
    // reef_coral_branch y coral_fan/decor_shell (más abajo) retirados en
    // la limpieza de obstáculos sueltos (pedido explícito: "quita
    // tmb... este tmb") — sustituidos por esponja/balano/guijarro, ya
    // aprobados, sin tocar el mecanismo del laberinto en sí.
    piece({ key: "sponge", x: nookX, y: yGate + 60, scale: 0.16, alpha: 0.55, role: "background" }),
    piece({ key: "barnacle", x: nookX, y: yGate - 40, scale: 0.14, alpha: 0.55, role: "background" }),

    corridorWall(sideCorridor, yCorridor, reachCorridor, GRAND_MAZE_WALL_POOL),
    piece({
      key: "barnacle",
      x: wallTipCorridor + inward(sideCorridor) * 35,
      y: yCorridor + 80,
      scale: 0.22,
      role: "decoration",
    }),

    corridorWall(sideExit, yExit, reachExit, GRAND_MAZE_WALL_POOL),
    piece({
      key: "decor_pebble",
      x: wallTipExit + inward(sideExit) * 35,
      y: yExit + 80,
      scale: 0.22,
      role: "decoration",
    }),

    bgAccent(
      "reef_maze_wall",
      sideExit === "left" ? worldWidth * 0.92 : worldWidth * 0.08,
      yExit - 160,
      0.14,
    ),
  ];

  const path = [
    { x: gapEntrance, y: yEntrance + 220 },
    { x: gapEntrance, y: yEntrance },
    { x: (gapEntrance + worldWidth / 2) / 2, y: (yEntrance + yGate) / 2 },
    { x: worldWidth / 2, y: yGate },
    { x: (worldWidth / 2 + gapCorridor) / 2, y: (yGate + yCorridor) / 2 },
    { x: gapCorridor, y: yCorridor },
    { x: (gapCorridor + gapExit) / 2, y: (yCorridor + yExit) / 2 },
    { x: gapExit, y: yExit },
    { x: gapExit, y: yExit - 220 },
  ];

  return { pieces, path, yTop: yExit - 260, yBottom: yEntrance + 260 };
}

export const REEF_TEMPLATES: ((worldWidth: number, centerY: number) => ReefClusterSpec)[] = [
  diagonalLeft,
  centerTwoPaths,
  sCurveEdges,
  lateralWall,
  reefLabyrinth,
  miniLabyrinth,
  grandMaze,
];
