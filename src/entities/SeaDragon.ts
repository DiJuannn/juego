import Phaser from "phaser";
import { SEA_DRAGON_GAP_HEIGHT, SEA_DRAGON_SPEED } from "@/config/GameConfig";

// Bbox real medido sobre cada PNG (canvas 768 de ancho en ambos, mismo
// dibujo cortado por la mitad — ver docs de generación en PROGRESS.md):
// head 768x580, contenido x:[205,566] y:[40,580] (toca el borde inferior,
// que es el corte); tail 768x764, contenido x:[231,610] y:[0,727] (toca
// el borde superior, el mismo corte).
const HEAD_BBOX = { x0: 205, y0: 40, x1: 566, y1: 580 };
const TAIL_BBOX = { x0: 231, y0: 0, x1: 610, y1: 727 };

/**
 * Decimotercer enemigo (pedido explícito, con captura/descripción del
 * usuario: "un dragón marino Largo que vaya en vertical de lado a lado,
 * pero que salga del mapa y reaparezca la otra parte en el otro lateral
 * ... que deje un hueco justo para que pase Lumi por ahí"). Dos mitades
 * del mismo dibujo (cabeza+cuello arriba, cuerpo+cola abajo) que SIEMPRE
 * comparten la misma X — se deslizan juntas sin parar de un lateral al
 * otro del MUNDO (no solo de la cámara visible), nunca rebotan: al salir
 * por completo de un lado, la posición envuelve y reaparecen entrando por
 * el lado contrario, como un bucle infinito cruzando el mapa. El hueco
 * entre las dos mitades queda FIJO en Y (relativo al centro de spawn) —
 * la única forma de pasar es que Lumi esté a esa altura cuando el dragón
 * llegue a su X.
 */
export class SeaDragon {
  readonly headSprite: Phaser.Physics.Arcade.Image;
  readonly tailSprite: Phaser.Physics.Arcade.Image;
  private readonly direction: 1 | -1;
  private readonly halfSpan: number;
  private readonly totalRange: number;
  private readonly phaseDistance: number;

  constructor(scene: Phaser.Scene, startX: number, centerY: number, scale: number, worldWidth: number) {
    this.direction = Math.random() < 0.5 ? 1 : -1;

    const headY = centerY - SEA_DRAGON_GAP_HEIGHT / 2;
    const tailY = centerY + SEA_DRAGON_GAP_HEIGHT / 2;

    // Arte mirando a la izquierda por defecto (mismo criterio que
    // Shark/Seahorse/MantaRay) — flip si el dragón viaja hacia la derecha.
    const flip = this.direction === 1;

    this.headSprite = scene.physics.add.staticImage(startX, headY, "sea_dragon_head");
    this.headSprite.setOrigin(0.5, 1).setScale(scale).setFlipX(flip).setDepth(5);
    this.headSprite.refreshBody();
    this.applyBody(this.headSprite, HEAD_BBOX, scale, flip);

    this.tailSprite = scene.physics.add.staticImage(startX, tailY, "sea_dragon_tail");
    this.tailSprite.setOrigin(0.5, 0).setScale(scale).setFlipX(flip).setDepth(5);
    this.tailSprite.refreshBody();
    this.applyBody(this.tailSprite, TAIL_BBOX, scale, flip);

    this.halfSpan = (this.headSprite.displayWidth / 2) + 40;
    this.totalRange = worldWidth + this.halfSpan * 2;
    this.phaseDistance = Phaser.Math.FloatBetween(0, this.totalRange);

    this.setX(startX);
  }

  /** Body en fracción del bbox real (no rota, así que no hace falta la
   * trigonometría de ReefCluster.ts) — origin no rotado no afecta a
   * setSize/setOffset, que trabajan en coordenadas locales del frame. Si
   * `flip` está activo, el offset X se espeja porque Phaser NO ajusta el
   * body automáticamente al voltear un sprite. */
  private applyBody(
    sprite: Phaser.Physics.Arcade.Image,
    bbox: { x0: number; y0: number; x1: number; y1: number },
    scale: number,
    flip: boolean,
  ) {
    const w = (bbox.x1 - bbox.x0) * scale;
    const h = (bbox.y1 - bbox.y0) * scale;
    const texW = sprite.width;
    const offsetX = flip ? (texW - bbox.x1) * scale : bbox.x0 * scale;
    const offsetY = bbox.y0 * scale;
    (sprite.body as Phaser.Physics.Arcade.StaticBody).setSize(w, h).setOffset(offsetX, offsetY);
  }

  private setX(x: number) {
    this.headSprite.x = x;
    this.tailSprite.x = x;
    (this.headSprite.body as Phaser.Physics.Arcade.StaticBody).reset(x, this.headSprite.y);
    (this.tailSprite.body as Phaser.Physics.Arcade.StaticBody).reset(x, this.tailSprite.y);
  }

  update(time: number) {
    const t = time / 1000;
    const progress = (t * SEA_DRAGON_SPEED + this.phaseDistance) % this.totalRange;
    const x = this.direction === 1 ? -this.halfSpan + progress : this.totalRange - this.halfSpan - progress;
    this.setX(x);
  }

  destroy() {
    this.headSprite.destroy();
    this.tailSprite.destroy();
  }
}
