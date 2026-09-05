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
};

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
          const tex = scene.textures.get(piece.key).getSourceImage();
          const [fx0, fy0, fx1, fy1] = frac;
          // Phaser NO escala el tamaño/offset del body con el scale del
          // sprite (confirmado con un probe en juego: un body creado con
          // valores en píxeles nativos se queda en esos píxeles tal cual,
          // sin multiplicar por setScale) — hay que aplicar piece.scale a
          // mano aquí, si no la hitbox queda mucho más grande que el
          // dibujo visible (mismo bug que tenían Jellyfish/Urchin/Shark/
          // Squid/BigFish, arreglado en el mismo cambio).
          const w = tex.width * (fx1 - fx0) * piece.scale;
          const h = tex.height * (fy1 - fy0) * piece.scale;
          (sprite.body as Phaser.Physics.Arcade.StaticBody)
            .setSize(w, h)
            .setOffset(tex.width * fx0 * piece.scale, tex.height * fy0 * piece.scale);
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
