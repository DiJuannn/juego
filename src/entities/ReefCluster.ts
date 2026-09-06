import Phaser from "phaser";

/**
 * Prototipo de obstáculo orgánico de Zona 1 (sustituye a CoralWall en la
 * instanciación real — ver ReefClusterSpawner y PondScene. CoralWall no se
 * borra, solo deja de usarse, por si hay que revertir).
 *
 * Pedido explícito del usuario: nada de una pared de un único asset
 * repetido en línea recta. Cada cúmulo combina varias piezas (coral/roca/
 * alga) a distinta profundidad — el fondo/la decoración no colisionan,
 * solo el "núcleo" del obstáculo, y una pieza de primer plano puede pasar
 * parcialmente por delante de Lumi sin tapar la lectura del nivel.
 */
export type ReefDepthRole = "background" | "decoration" | "obstacle" | "foreground";

const DEPTH_BY_ROLE: Record<ReefDepthRole, number> = {
  // Muy detrás, pequeño y desaturado (ver alpha en ReefTemplates) — solo
  // sugiere "hay más arrecife más allá", nunca compite con el hueco real.
  background: 2.2,
  // Por debajo de Lumi/obstáculos (5) pero por encima de los power-ups —
  // acompaña al cúmulo sin quitar protagonismo al carril libre.
  decoration: 4.8,
  // Misma capa que Lumi y el resto de peligros — mismo criterio que
  // Urchin/Jellyfish/Shark/Squid: todo lo que colisiona se lee igual.
  obstacle: 5,
  // El proyecto ya decidió antes (ver foreground_plants en PondScene) que
  // una capa por delante de TODO escondía burbujeo/animales y se sentía
  // mal. Aquí se usa con cuidado: solo puntas pequeñas y finas, nunca la
  // pieza entera, y ligeramente por delante de Lumi (5.3), no muy por
  // delante de toda la escena.
  foreground: 5.3,
};

/** Caja de colisión como fracción [x0,y0,x1,y1] (0..1) del tamaño nativo de
 * la textura — mismo criterio que Urchin ("cuerpos físicos ajustados a la
 * silueta real"), pero en fracción en vez de píxeles fijos para que sirva
 * con cualquier escala/reutilización. Aproximado a ojo sobre cada asset. */
const HITBOX_FRACTION: Record<string, [number, number, number, number]> = {
  // Rediseñado (pedido explícito: "ponle una base o sin base para que en
  // el lado que estén no queden mal puestos") — cúmulo redondeado
  // omnidireccional en vez de un montículo con base plana, se lee bien
  // rotado 90º en cualquier dirección. bbox medido sobre el nuevo PNG.
  reef_boulder_rock: [0.18, 0.28, 0.82, 0.78],
  // Familia "rama" rediseñada por completo (pedido explícito: "REDISEÑA
  // TODOS LOS CORALES... QUE NO IMPORTA COMO SE PONGAN QUEDEN BIEN"): los
  // 4 eran un brazo largo y direccional con coral solo en una punta (el
  // mismo problema que tenía boulder_rock) — ahora son cúmulos compactos
  // de coral, cada uno omnidireccional, bbox medido sobre el PNG nuevo.
  reef_coral_branch: [0.176, 0.268, 0.853, 0.738],
  reef_branch_straight: [0.177, 0.188, 0.819, 0.8],
  reef_branch_hook: [0.152, 0.225, 0.843, 0.76],
  reef_branch_short: [0.153, 0.19, 0.834, 0.817],
  // Estrella/piedra pasaron de decoración a obstáculo real (pedido
  // explícito del usuario) — necesitan su propia caja de colisión, igual
  // que el resto de piezas de esta tabla.
  decor_starfish: [0.05, 0.05, 0.95, 0.95],
  decor_pebble: [0.03, 0.05, 0.97, 0.95],
  // Piezas nuevas (pedido explícito: "añade 1-2 piezas nuevas de
  // decoración/obstáculo"). decor_shell reutiliza un asset ya existente
  // (aprobado en estilo, solo estaba sin usar); anemone es arte nuevo.
  decor_shell: [0.02, 0.02, 0.98, 0.98],
  anemone: [0.2, 0.14, 0.83, 0.87],
  // Ronda de "muchos más obstáculos" (pedido explícito) — 4 piezas nuevas
  // más, todas medidas sobre su propio PNG.
  coral_fan: [0.14, 0.19, 0.87, 0.78],
  sponge: [0.17, 0.22, 0.84, 0.79],
  barnacle: [0.2, 0.22, 0.81, 0.79],
  // giant_clam ya no es una pieza estática de ReefCluster (ver
  // entities/GiantClam.ts, que reutiliza esta misma bbox [0.13,0.21,0.87,0.8]
  // directamente en su propio StaticBody).
  // Pedido explícito: "crea diferentes estilos de rocas... de distintos
  // tamaños, más largas tmb pueden ser" — 2 estilos nuevos para variar la
  // pieza de pared lateral (ver WALL_PIECE_POOL en ReefTemplates.ts), bbox
  // medido programáticamente sobre alpha del PNG (no a ojo).
  reef_rock_slab: [0.098, 0.374, 0.909, 0.706],
  reef_rock_smooth: [0.297, 0.302, 0.679, 0.791],
  // Pedido explícito: "más rocas o pinchos en forma de obstáculo" — cúmulo
  // de rocas puntiagudas, bbox medido programáticamente igual que las
  // otras dos rocas nuevas.
  reef_rock_spikes: [0.198, 0.222, 0.794, 0.793],
};

/**
 * Calcula el tamaño/offset de body que hace que un `StaticBody` (rectángulo
 * SIN rotar) coincida con la silueta de un sprite YA GIRADO por `rotation`
 * — pedido explícito del usuario: girar `boulder_rock` 90º según el lado
 * para que su parte plana quede pegada al lateral.
 *
 * Ojo, esto NO es tan simple como "Phaser no rota el body": para un
 * `StaticBody`, `refreshBody()` internamente llama a `sprite.getTopLeft()`,
 * que SÍ tiene en cuenta la rotación — pero solo rota la POSICIÓN de la
 * esquina superior-izquierda "de fábrica" (un único punto, girado alrededor
 * del centro del sprite), sin rotar ni intercambiar el ancho/alto del
 * rectángulo (que se quedan en `displayWidth/displayHeight`, siempre sin
 * rotar). El resultado es un rectángulo desplazado a un punto girado pero
 * con la forma sin girar — no coincide con la silueta real (confirmado con
 * un probe: con `frac` de boulder_rock y 90º, el body por defecto salía
 * centrado lejos del dibujo). Y `body.setOffset(x,y)` no coloca el body en
 * `(x,y)` a secas: internamente hace `position -= offsetAnterior; position
 * += offsetNuevo`, es decir, el offset se suma sobre esa posición base ya
 * desplazada por `getTopLeft()`, no sobre la esquina sin rotar.
 *
 * Por eso aquí se calcula todo a mano: se giran los 4 vértices del recorte
 * (`frac`) alrededor del centro para obtener su caja delimitadora (AABB)
 * ya en coordenadas de mundo reales, y se le resta esa misma posición base
 * de `getTopLeft()` (replicada aquí, girando el punto
 * `(-displayWidth/2, -displayHeight/2)`) para obtener el offset que hay que
 * pasarle a `setOffset` para que el resultado final caiga exactamente en el
 * AABB deseado. Exacto para cualquier ángulo cuando el recorte ya es un
 * rectángulo alineado a ejes (como estos), incluido el jitter de rotación
 * de unos pocos grados que ya llevan casi todas las piezas.
 */
/** AABB del recorte `frac` de una textura, ya escalado y girado, en
 * coordenadas centradas en el sprite (su pivote de rotación, origen 0.5/0.5
 * por defecto) — la pieza compartida que necesitan tanto el cálculo del
 * body (`rotatedFractionalBody`) como el de posición a ras de borde
 * (`edgeFlushX`), para no repetir la trigonometría en dos sitios. */
function rotatedAABB(
  tex: HTMLImageElement,
  frac: [number, number, number, number],
  rotation: number,
  scale: number,
): { xmin: number; xmax: number; ymin: number; ymax: number; dW: number; dH: number } {
  const [fx0, fy0, fx1, fy1] = frac;
  const dW = tex.width * scale;
  const dH = tex.height * scale;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const rotate = (x: number, y: number): [number, number] => [x * cos - y * sin, x * sin + y * cos];

  const a = (fx0 - 0.5) * dW;
  const b = (fx1 - 0.5) * dW;
  const c = (fy0 - 0.5) * dH;
  const d = (fy1 - 0.5) * dH;
  const corners = [rotate(a, c), rotate(b, c), rotate(a, d), rotate(b, d)];
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);

  return { xmin: Math.min(...xs), xmax: Math.max(...xs), ymin: Math.min(...ys), ymax: Math.max(...ys), dW, dH };
}

function rotatedFractionalBody(
  tex: HTMLImageElement,
  frac: [number, number, number, number],
  rotation: number,
  scale: number,
): { w: number; h: number; offsetX: number; offsetY: number } {
  const { xmin, xmax, ymin, ymax, dW, dH } = rotatedAABB(tex, frac, rotation, scale);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const rotate = (x: number, y: number): [number, number] => [x * cos - y * sin, x * sin + y * cos];

  // Posición base que `refreshBody()` ya deja en el body (su
  // `getTopLeft()`, ver comentario arriba): la esquina sin rotar
  // (-dW/2,-dH/2) girada alrededor del centro.
  const [baseX, baseY] = rotate(-0.5 * dW, -0.5 * dH);

  return {
    w: xmax - xmin,
    h: ymax - ymin,
    offsetX: xmin - baseX,
    offsetY: ymin - baseY,
  };
}

// Pedido explícito del usuario tras varias rondas subiendo EDGE_INSET a
// ciegas (0.02→0.07→0.18) sin acertar: "A MI NO ME IMPORTA QUE TENGAN BASE
// Y SEAN LARGOS. LO QUE ME IMPORTABA ERA... QUE NO HAYA ESPACIOS VISIBLES
// SI TIENEN BASES ENTRE LA BASE Y EL LATERAL DE LA PANTALLA". Medido con
// `body.position` en juego: con EDGE_INSET=0.18 y el tamaño de pieza actual
// quedaba un hueco real de ~67px entre la roca y el borde del mundo — una
// fracción fija nunca da con el valor exacto porque depende del tamaño real
// de cada pieza (que cambia con `scale`, con el jitter de escala, y con la
// rotación). En vez de seguir ajustando una constante a ojo, esto calcula
// la posición EXACTA para que el borde visible de la pieza (ya rotada y
// escalada) toque el borde real del mundo, con un pequeño solape
// `OVERLAP_PX` a propósito para garantizar cero hueco incluso con el jitter
// de escala (ese solape queda fuera del mundo, invisible).
const EDGE_FLUSH_OVERLAP_PX = 10;

function edgeFlushX(
  tex: HTMLImageElement,
  frac: [number, number, number, number],
  rotation: number,
  scale: number,
  worldWidth: number,
  side: "left" | "right",
): number {
  const { xmin, xmax } = rotatedAABB(tex, frac, rotation, scale);
  return side === "left" ? -EDGE_FLUSH_OVERLAP_PX - xmin : worldWidth + EDGE_FLUSH_OVERLAP_PX - xmax;
}

export interface ReefPieceSpec {
  key: string;
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  flipX?: boolean;
  role: ReefDepthRole;
  alpha?: number;
  /** Si se da, IGNORA `x` y coloca la pieza a ras del borde del mundo (con
   * el solape de `EDGE_FLUSH_OVERLAP_PX` para garantizar cero hueco) en vez
   * de a una fracción fija de `worldWidth` — ver comentario de
   * `edgeFlushX`. Solo tiene efecto en piezas `role:"obstacle"` (necesita
   * la textura real cargada). */
  edgeFlush?: "left" | "right";
  /** Complemento de `edgeFlush` (pedido explícito: un obstáculo "que ocupe
   * casi todo el mapa" con un hueco justo para pasar) — en vez de fijar la
   * escala e IGNORAR cuánto invade el carril libre, esto IGNORA `scale` y
   * calcula la escala exacta para que la pieza penetre `reachPx` desde el
   * borde `side`, sea cual sea la textura/proporción real que le toque
   * (pensado para usarse con un pool de piezas de tamaño variable, ver
   * `WALL_PIECE_POOL`/`GAUNTLET_POOL` en ReefTemplates.ts). `side` debe
   * coincidir con el de `edgeFlush` en la misma pieza. */
  edgeReach?: { side: "left" | "right"; reachPx: number };
}

export interface ReefClusterSpec {
  pieces: ReefPieceSpec[];
  /** Ruta segura de abajo hacia arriba, en coordenadas de mundo absolutas
   * — la usa ReefClusterSpawner para trazar las monedas guía. */
  path: { x: number; y: number }[];
  /** Extensión vertical del cúmulo, con margen — para
   * isWithinAnyClusterBand (mismo propósito que isWithinAnyCoralBand). */
  yTop: number;
  yBottom: number;
}

// Pedido explícito del usuario: "me gustaría que los que algunos tengan
// animación. LAS ROCAS NO. pero corales y tal estaria bien que tuvieran una
// leve animacion bonita". Solo las piezas tipo roca (el "boulder" grande y
// el guijarro, que se leen como objeto inerte) quedan fuera; el resto
// (ramas de coral, anémona, abanico, esponja, balano, almeja, estrella,
// concha) respira con un pulso de escala muy sutil.
const NO_BREATHE_KEYS = new Set([
  "reef_boulder_rock",
  "decor_pebble",
  "reef_rock_slab",
  "reef_rock_smooth",
  "reef_rock_spikes",
]);

// Amplitud/periodo pensados para que se note como un detalle vivo, no como
// un parpadeo — ±4% de escala, ciclo de 2.6-4.2s, con fase aleatoria por
// pieza para que no respiren todas a la vez (mismo criterio que el jitter
// de JITTER_SCALE/JITTER_ROT en ReefTemplates: variación sutil pieza a
// pieza, nunca sincronizada).
const BREATHE_AMPLITUDE = 0.04;
const BREATHE_PERIOD_MIN = 2600;
const BREATHE_PERIOD_MAX = 4200;

// Pedido explícito con captura real: "se ven feos esos dos [anémona y
// coral_fan]... que no parezcan dos pngs ahí pegados quietos" — ya
// respiraban (no estaban en NO_BREATHE_KEYS), pero ±4% es demasiado sutil
// para leerse como "vivo" en piezas con formas orgánicas tan reconocibles
// (tentáculos/lóbulos). Amplitud propia, más del doble, solo para estas
// dos — el resto de piezas que respiran (ramas, esponja, balano...) se
// quedan con la amplitud genérica de siempre.
const BREATHE_AMPLITUDE_OVERRIDE: Record<string, number> = {
  anemone: 0.11,
  coral_fan: 0.09,
};

interface BreathingObstacle {
  sprite: Phaser.Physics.Arcade.Image;
  baseScale: number;
  amplitude: number;
  periodMs: number;
  phase: number;
  // Tamaño/offset de body "base" (al pulso=1, ver rotatedFractionalBody) —
  // solo existen si la pieza tiene HITBOX_FRACTION. Como esos valores son
  // proporcionales a `scale` (con la rotación fija), re-escalarlos por el
  // pulso actual mantiene el body exactamente sincronizado con el dibujo
  // sin repetir la trigonometría cada frame (mismo bug que Jellyfish/Urchin
  // en su día: la hitbox debe seguir el sway visual, no quedarse fija).
  body?: { w: number; h: number; offsetX: number; offsetY: number };
}

export class ReefCluster {
  readonly obstacleSprites: Phaser.Physics.Arcade.Image[] = [];
  private readonly decorSprites: Phaser.GameObjects.Image[] = [];
  private readonly breathingObstacles: BreathingObstacle[] = [];
  readonly yTop: number;
  readonly yBottom: number;

  constructor(scene: Phaser.Scene, spec: ReefClusterSpec, worldWidth: number) {
    this.yTop = spec.yTop;
    this.yBottom = spec.yBottom;

    for (const piece of spec.pieces) {
      if (piece.role === "obstacle") {
        const frac = HITBOX_FRACTION[piece.key];

        // `edgeReach` IGNORA piece.scale y lo recalcula: se busca la escala
        // que hace que la pieza, YA ROTADA, penetre exactamente `reachPx`
        // desde su borde — igual que `edgeFlushX` calcula X a partir de un
        // scale dado, esto calcula el scale a partir de un reach dado.
        // Como rotatedAABB es lineal en `scale` (confirmado: dW/dH y sus
        // rotaciones son proporcionales, sin término constante), basta con
        // medir el ancho de penetración a escala 1 y dividir.
        let scale = piece.scale;
        let x = piece.x;
        if (frac) {
          const tex = scene.textures.get(piece.key).getSourceImage() as HTMLImageElement;
          if (piece.edgeReach) {
            const aabbAt1 = rotatedAABB(tex, frac, piece.rotation ?? 0, 1);
            const reachAt1 = aabbAt1.xmax - aabbAt1.xmin;
            scale = piece.edgeReach.reachPx / reachAt1;
          }
          if (piece.edgeFlush) {
            x = edgeFlushX(tex, frac, piece.rotation ?? 0, scale, worldWidth, piece.edgeFlush);
          }
        }

        const sprite = scene.physics.add.staticImage(x, piece.y, piece.key);
        sprite.setScale(scale);
        sprite.setDepth(DEPTH_BY_ROLE.obstacle);
        if (piece.rotation) sprite.setRotation(piece.rotation);
        if (piece.flipX) sprite.setFlipX(true);
        sprite.refreshBody();

        let baseBody: { w: number; h: number; offsetX: number; offsetY: number } | undefined;
        if (frac) {
          // Phaser NO escala el tamaño/offset del body con el scale del
          // sprite (confirmado con un probe en juego: un body creado con
          // valores en píxeles nativos se queda en esos píxeles tal cual,
          // sin multiplicar por setScale) — hay que aplicar `scale` a mano
          // aquí, si no la hitbox queda mucho más grande que el dibujo
          // visible (mismo bug que tenían Jellyfish/Urchin/Shark/Squid/
          // BigFish, arreglado en el mismo cambio). Tampoco rota el body
          // con sprite.rotation, ver rotatedFractionalBody arriba.
          const tex = scene.textures.get(piece.key).getSourceImage() as HTMLImageElement;
          const { w, h, offsetX, offsetY } = rotatedFractionalBody(tex, frac, piece.rotation ?? 0, scale);
          (sprite.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h).setOffset(offsetX, offsetY);
          baseBody = { w, h, offsetX, offsetY };
        }

        this.obstacleSprites.push(sprite);

        if (!NO_BREATHE_KEYS.has(piece.key)) {
          this.breathingObstacles.push({
            sprite,
            baseScale: scale,
            amplitude: BREATHE_AMPLITUDE_OVERRIDE[piece.key] ?? BREATHE_AMPLITUDE,
            periodMs: Phaser.Math.FloatBetween(BREATHE_PERIOD_MIN, BREATHE_PERIOD_MAX),
            phase: Phaser.Math.FloatBetween(0, Math.PI * 2),
            body: baseBody,
          });
        }
      } else {
        const img = scene.add.image(piece.x, piece.y, piece.key);
        img.setScale(piece.scale);
        img.setDepth(DEPTH_BY_ROLE[piece.role]);
        if (piece.rotation) img.setRotation(piece.rotation);
        if (piece.flipX) img.setFlipX(true);
        if (piece.alpha !== undefined) img.setAlpha(piece.alpha);
        this.decorSprites.push(img);
      }
    }
  }

  update(time: number) {
    for (const obstacle of this.breathingObstacles) {
      const pulse = 1 + obstacle.amplitude * Math.sin((time / obstacle.periodMs) * Math.PI * 2 + obstacle.phase);
      obstacle.sprite.setScale(obstacle.baseScale * pulse);
      if (obstacle.body) {
        const { w, h, offsetX, offsetY } = obstacle.body;
        (obstacle.sprite.body as Phaser.Physics.Arcade.StaticBody).setSize(w * pulse, h * pulse).setOffset(offsetX * pulse, offsetY * pulse);
      }
    }
  }

  destroy() {
    for (const sprite of this.obstacleSprites) sprite.destroy();
    for (const sprite of this.decorSprites) sprite.destroy();
  }
}
