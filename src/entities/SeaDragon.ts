import Phaser from "phaser";
import {
  SEA_DRAGON_BOB_AMPLITUDE,
  SEA_DRAGON_BOB_PERIOD_MS,
  SEA_DRAGON_SPEED,
  SEA_DRAGON_SWAY_AMPLITUDE,
  SEA_DRAGON_SWAY_PERIOD_MS,
} from "@/config/GameConfig";

// Bbox real medido sobre sea_dragon.png (la ilustración COMPLETA, cabeza a
// punta de cola, sin ningún recorte — ver docs de generación en
// PROGRESS.md), en FRACCIÓN del lienzo (768x1344) porque el lienzo entra
// en la trigonometría de rotación.
const BODY_FRAC = { x0: 203 / 768, y0: 38 / 1344, x1: 612 / 768, y1: 1309 / 1344 };

function rotatePoint(x: number, y: number, angle: number): { x: number; y: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
}

/** AABB (relativo al CENTRO del sprite, origin 0.5/0.5) de un recorte
 * fraccional ya rotado — misma trigonometría que ReefCluster.ts. */
function rotatedAabb(
  frac: { x0: number; y0: number; x1: number; y1: number },
  texW: number,
  texH: number,
  scale: number,
  angle: number,
) {
  const dW = texW * scale;
  const dH = texH * scale;
  const a = (frac.x0 - 0.5) * dW;
  const b = (frac.x1 - 0.5) * dW;
  const c = (frac.y0 - 0.5) * dH;
  const d = (frac.y1 - 0.5) * dH;
  const corners = [rotatePoint(a, c, angle), rotatePoint(b, c, angle), rotatePoint(a, d, angle), rotatePoint(b, d, angle)];
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  return { xmin: Math.min(...xs), xmax: Math.max(...xs), ymin: Math.min(...ys), ymax: Math.max(...ys) };
}

/**
 * Decimotercer enemigo (pedido explícito, con DOS correcciones: "un dragón
 * marino Largo que vaya... de lado a lado... que deje un hueco justo para
 * que pase Lumi por ahí" → "que sea horizontal" → "que ESTE COMPLETO [no
 * lo recortes] y el nado sea muy fluido. QUE VAYA LATERALMENTE TAPANDO
 * TODO PERO SIEMPRE QUE DEJE UN ESPACIO POR DONDE PASAR"). Un único
 * sprite con la ilustración ENTERA (cabeza a punta de cola, sin cortar en
 * dos piezas como en el intento anterior) tumbado en horizontal, con la
 * cabeza siempre por delante en la dirección de avance. Se desliza en X
 * sin parar y envuelve de un lateral al otro del MUNDO (misma fórmula de
 * módulo que el resto de patrullas). El "espacio para pasar" no es un
 * recorte del propio dragón — sale de que su longitud renderizada es
 * menor que WORLD_WIDTH (ver SEA_DRAGON_SCALE en GameConfig.ts), así que
 * siempre queda un tramo libre en alguno de los dos lados mientras
 * transita. La fluidez del nado combina un vaivén de rotación con un
 * balanceo vertical a otra frecuencia (ver constantes SEA_DRAGON_SWAY y
 * SEA_DRAGON_BOB en GameConfig.ts) — dos oscilaciones simples desfasadas
 * leen como un movimiento mucho más orgánico que una sola.
 */
export class SeaDragon {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private readonly direction: 1 | -1;
  private readonly baseAngle: number;
  private readonly centerY: number;
  private readonly halfSpan: number;
  private readonly totalRange: number;
  private readonly phaseDistance: number;
  private readonly swayPhase: number;
  private readonly bobPhase: number;
  private readonly scale: number;

  constructor(scene: Phaser.Scene, startX: number, centerY: number, scale: number, worldWidth: number) {
    this.direction = Math.random() < 0.5 ? 1 : -1;
    // Cabeza siempre por delante en la dirección del viaje: +90° cuando
    // avanza a la derecha, -90° cuando avanza a la izquierda — con el
    // arte apuntando "hacia arriba local" desde la cabeza, +90° (giro
    // horario) deja la cabeza mirando a la derecha y -90° mirando a la
    // izquierda (mismo criterio verificado en la versión anterior).
    this.baseAngle = this.direction === 1 ? Math.PI / 2 : -Math.PI / 2;
    this.centerY = centerY;
    this.scale = scale;
    this.swayPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.bobPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);

    this.sprite = scene.physics.add.staticImage(startX, centerY, "sea_dragon");
    this.sprite.setScale(scale).setDepth(5);
    this.sprite.refreshBody();
    // Body de colisión fijo, calculado UNA vez sobre el ángulo base (no
    // el ángulo con vaivén de cada frame) — mismo criterio que la mayoría
    // de animales del juego: la hitbox no persigue cada detalle de una
    // animación sutil, solo su CENTRO sigue la posición visual real cada
    // frame (ver update()).
    this.applyFixedBody();

    // Envergadura total generosa (longitud del dragón + margen) para
    // garantizar que salga del todo del mundo antes de envolver.
    this.halfSpan = this.sprite.displayHeight;
    this.totalRange = worldWidth + this.halfSpan * 2;
    this.phaseDistance = Phaser.Math.FloatBetween(0, this.totalRange);

    this.update(0);
  }

  /** Igual que `rotatedFractionalBody` de ReefCluster.ts: `refreshBody()`
   * deja el body en `sprite.getTopLeft()`, que SÍ rota la posición de la
   * esquina sin rotar el rectángulo — así que el offset que hay que
   * pasarle a `setOffset` es la diferencia entre el AABB real (ya girado)
   * y esa esquina de referencia, no el AABB a secas. */
  private applyFixedBody() {
    const dW = this.sprite.width * this.scale;
    const dH = this.sprite.height * this.scale;
    const aabb = rotatedAabb(BODY_FRAC, this.sprite.width, this.sprite.height, this.scale, this.baseAngle);
    const base = rotatePoint(-dW / 2, -dH / 2, this.baseAngle);
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(aabb.xmax - aabb.xmin, aabb.ymax - aabb.ymin)
      .setOffset(aabb.xmin - base.x, aabb.ymin - base.y);
  }

  update(time: number) {
    const t = time / 1000;

    // Deslizamiento sin parar + envoltura: una sola fórmula de módulo, sin
    // guardar de qué lado toca reaparecer.
    const progress = (t * SEA_DRAGON_SPEED + this.phaseDistance) % this.totalRange;
    const centerX = this.direction === 1 ? -this.halfSpan + progress : this.totalRange - this.halfSpan - progress;

    // Vaivén de rotación + balanceo vertical a otra frecuencia — dos
    // oscilaciones simples desfasadas, ver "el nado sea muy fluido".
    const angle =
      this.baseAngle + SEA_DRAGON_SWAY_AMPLITUDE * Math.sin((time * Math.PI * 2) / SEA_DRAGON_SWAY_PERIOD_MS + this.swayPhase);
    const bobY = SEA_DRAGON_BOB_AMPLITUDE * Math.sin((time * Math.PI * 2) / SEA_DRAGON_BOB_PERIOD_MS + this.bobPhase);

    this.sprite.setRotation(angle);
    this.sprite.setPosition(centerX, this.centerY + bobY);

    (this.sprite.body as Phaser.Physics.Arcade.StaticBody).reset(this.sprite.x, this.sprite.y);
  }

  destroy() {
    this.sprite.destroy();
  }
}
