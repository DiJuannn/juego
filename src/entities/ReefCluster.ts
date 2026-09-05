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
  reef_coral_branch: [0.0, 0.0, 0.95, 0.9],
  reef_boulder_rock: [0.02, 0.05, 0.98, 1.0],
  reef_branch_straight: [0.0, 0.05, 0.98, 0.95],
  reef_branch_hook: [0.0, 0.0, 0.95, 0.95],
  reef_branch_short: [0.0, 0.0, 0.95, 0.95],
  // Estrella/piedra pasaron de decoración a obstáculo real (pedido
  // explícito del usuario) — necesitan su propia caja de colisión, igual
  // que el resto de piezas de esta tabla.
  decor_starfish: [0.05, 0.05, 0.95, 0.95],
  decor_pebble: [0.03, 0.05, 0.97, 0.95],
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
function rotatedFractionalBody(
  tex: HTMLImageElement,
  frac: [number, number, number, number],
  rotation: number,
  scale: number,
): { w: number; h: number; offsetX: number; offsetY: number } {
  const [fx0, fy0, fx1, fy1] = frac;
  const dW = tex.width * scale;
  const dH = tex.height * scale;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const rotate = (x: number, y: number): [number, number] => [x * cos - y * sin, x * sin + y * cos];

  // AABB del recorte ya girado, en coordenadas de mundo centradas en el
  // sprite (su pivote de rotación, el origen 0.5/0.5 por defecto).
  const a = (fx0 - 0.5) * dW;
  const b = (fx1 - 0.5) * dW;
  const c = (fy0 - 0.5) * dH;
  const d = (fy1 - 0.5) * dH;
  const corners = [rotate(a, c), rotate(b, c), rotate(a, d), rotate(b, d)];
  const xs = corners.map(([x]) => x);
  const ys = corners.map(([, y]) => y);
  const xmin = Math.min(...xs);
  const ymin = Math.min(...ys);

  // Posición base que `refreshBody()` ya deja en el body (su
  // `getTopLeft()`, ver comentario arriba): la esquina sin rotar
  // (-dW/2,-dH/2) girada alrededor del centro.
  const [baseX, baseY] = rotate(-0.5 * dW, -0.5 * dH);

  return {
    w: Math.max(...xs) - xmin,
    h: Math.max(...ys) - ymin,
    offsetX: xmin - baseX,
    offsetY: ymin - baseY,
  };
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

export class ReefCluster {
  readonly obstacleSprites: Phaser.Physics.Arcade.Image[] = [];
  private readonly decorSprites: Phaser.GameObjects.Image[] = [];
  readonly yTop: number;
  readonly yBottom: number;

  constructor(scene: Phaser.Scene, spec: ReefClusterSpec) {
    this.yTop = spec.yTop;
    this.yBottom = spec.yBottom;

    for (const piece of spec.pieces) {
      if (piece.role === "obstacle") {
        const sprite = scene.physics.add.staticImage(piece.x, piece.y, piece.key);
        sprite.setScale(piece.scale);
        sprite.setDepth(DEPTH_BY_ROLE.obstacle);
        if (piece.rotation) sprite.setRotation(piece.rotation);
        if (piece.flipX) sprite.setFlipX(true);
        sprite.refreshBody();

        const frac = HITBOX_FRACTION[piece.key];
        if (frac) {
          // Phaser NO escala el tamaño/offset del body con el scale del
          // sprite (confirmado con un probe en juego: un body creado con
          // valores en píxeles nativos se queda en esos píxeles tal cual,
          // sin multiplicar por setScale) — hay que aplicar piece.scale a
          // mano aquí, si no la hitbox queda mucho más grande que el
          // dibujo visible (mismo bug que tenían Jellyfish/Urchin/Shark/
          // Squid/BigFish, arreglado en el mismo cambio). Tampoco rota el
          // body con sprite.rotation, ver rotatedFractionalBody arriba.
          const tex = scene.textures.get(piece.key).getSourceImage() as HTMLImageElement;
          const { w, h, offsetX, offsetY } = rotatedFractionalBody(tex, frac, piece.rotation ?? 0, piece.scale);
          (sprite.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h).setOffset(offsetX, offsetY);
        }

        this.obstacleSprites.push(sprite);
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

  destroy() {
    for (const sprite of this.obstacleSprites) sprite.destroy();
    for (const sprite of this.decorSprites) sprite.destroy();
  }
}
