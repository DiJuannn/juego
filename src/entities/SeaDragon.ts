import Phaser from "phaser";
import {
  SEA_DRAGON_BODY_SWAY_AMPLITUDE,
  SEA_DRAGON_BODY_SWAY_PERIOD_MS,
  SEA_DRAGON_GAP_WIDTH,
  SEA_DRAGON_SPEED,
  SEA_DRAGON_TAIL_WAG_AMPLITUDE,
  SEA_DRAGON_TAIL_WAG_PERIOD_MS,
} from "@/config/GameConfig";

// Bbox real medido sobre cada PNG, en FRACCIÓN del lienzo (no en píxeles
// fijos, porque aquí el lienzo entra en la trigonometría de rotación) —
// ver docs de generación en PROGRESS.md. body: cuerpo entero sin cortar
// (cabeza+cuello+torso), canvas 768x970, toca el borde INFERIOR (ahí es
// donde se cose la cola). tail: solo la cola, canvas 768x374, toca el
// borde SUPERIOR (el lado que se cose al cuerpo).
const BODY_FRAC = { x0: 205 / 768, y0: 40 / 970, x1: 610 / 768, y1: 969 / 970 };
const TAIL_FRAC = { x0: 252 / 768, y0: 0, x1: 530 / 768, y1: 337 / 374 };

function rotatePoint(x: number, y: number, angle: number): { x: number; y: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: x * cos - y * sin, y: x * sin + y * cos };
}

/** AABB (relativo al CENTRO del sprite, origin 0.5/0.5) de un recorte
 * fraccional ya rotado — misma trigonometría que ReefCluster.ts, pero
 * aislada aquí porque esta pieza gira de verdad cada frame (ondulación/
 * latigazo), no es un ángulo fijo con jitter mínimo. */
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

/** Offset de mundo (relativo al CENTRO del sprite, origin 0.5/0.5) del
 * punto de "costura" — borde inferior del cuerpo, o superior de la cola —
 * para el ángulo actual. Con origin 0.5/0.5 ese punto recorre un pequeño
 * arco alrededor del centro conforme el ángulo oscila (ondulación/
 * latigazo), así que hay que recalcularlo cada frame: `center = costura -
 * offset`. `edgeSign` es +1 para el borde inferior (cuerpo) o -1 para el
 * superior (cola). */
function seamOffset(texH: number, scale: number, angle: number, edgeSign: 1 | -1): { x: number; y: number } {
  return rotatePoint(0, (edgeSign * texH * scale) / 2, angle);
}

/**
 * Decimotercer enemigo (pedido explícito, con corrección: "un dragón
 * marino Largo que vaya... de lado a lado, pero que salga del mapa y
 * reaparezca la otra parte en el otro lateral... que deje un hueco justo
 * para que pase Lumi por ahí" — "me confundí, que sea horizontal. Y la
 * separación sea de la cola nomas, no lo partas. Y hazlo animado bien
 * bueno"). El cuerpo entero (cabeza+cuello+torso, SIN cortar) nada
 * tumbado en horizontal con una ondulación suave; la cola es una pieza
 * aparte que cuelga del hueco y azota con un latigazo mucho más marcado,
 * como si tirara de verdad desde su propio punto de unión. Ambas piezas
 * comparten la misma coordenada de "costura" (recalculada cada frame
 * según el ángulo actual de cada una) separada por `SEA_DRAGON_GAP_WIDTH`
 * — el hueco por el que Lumi tiene que colarse. Se deslizan juntas en X
 * sin parar: al salir del todo por un lado del MUNDO la posición envuelve
 * y reaparecen entrando por el lado contrario.
 */
export class SeaDragon {
  readonly bodySprite: Phaser.Physics.Arcade.Image;
  readonly tailSprite: Phaser.Physics.Arcade.Image;
  private readonly direction: 1 | -1;
  private readonly baseAngle: number;
  private readonly centerY: number;
  private readonly halfSpan: number;
  private readonly totalRange: number;
  private readonly phaseDistance: number;
  private readonly bodyPhase: number;
  private readonly tailPhase: number;
  private readonly scale: number;

  constructor(scene: Phaser.Scene, startX: number, centerY: number, scale: number, worldWidth: number) {
    this.direction = Math.random() < 0.5 ? 1 : -1;
    // Cabeza siempre por delante en la dirección del viaje: +90° cuando
    // avanza a la derecha, -90° cuando avanza a la izquierda — con el
    // arte apuntando "hacia arriba local" desde la cabeza, +90° (giro
    // horario) deja la cabeza mirando a la derecha y -90° mirando a la
    // izquierda (verificado en juego, ver PROGRESS.md).
    this.baseAngle = this.direction === 1 ? Math.PI / 2 : -Math.PI / 2;
    this.centerY = centerY;
    this.scale = scale;
    this.bodyPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.tailPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);

    this.bodySprite = scene.physics.add.staticImage(startX, centerY, "sea_dragon_body");
    this.bodySprite.setScale(scale).setDepth(5);
    this.bodySprite.refreshBody();
    // Body de colisión fijo, calculado UNA vez sobre el ángulo base (no
    // el ángulo con ondulación/latigazo de cada frame) — mismo criterio
    // que la mayoría de animales del juego (Seahorse, Shark...): la
    // hitbox no persigue cada detalle de una animación sutil, solo su
    // CENTRO sigue la posición visual real cada frame (ver update()).
    // Intentar re-triangular la AABB rotada en vivo cada frame añadía
    // riesgo real de una hitbox rota sin ganar nada perceptible.
    this.applyFixedBody(this.bodySprite, BODY_FRAC, this.baseAngle);

    this.tailSprite = scene.physics.add.staticImage(startX, centerY, "sea_dragon_tail");
    this.tailSprite.setScale(scale).setDepth(5);
    this.tailSprite.refreshBody();
    this.applyFixedBody(this.tailSprite, TAIL_FRAC, this.baseAngle);

    // Envergadura total generosa (cuerpo + cola + hueco, con margen) para
    // garantizar que salga del todo del mundo antes de envolver.
    this.halfSpan = this.bodySprite.displayHeight + this.tailSprite.displayHeight + SEA_DRAGON_GAP_WIDTH;
    this.totalRange = worldWidth + this.halfSpan * 2;
    this.phaseDistance = Phaser.Math.FloatBetween(0, this.totalRange);

    this.update(0);
  }

  /** Igual que `rotatedFractionalBody` de ReefCluster.ts: `refreshBody()`
   * deja el body en `sprite.getTopLeft()`, que SÍ rota la posición de la
   * esquina sin rotar el rectángulo — así que el offset que hay que
   * pasarle a `setOffset` es la diferencia entre el AABB real (ya girado)
   * y esa esquina de referencia, no el AABB a secas. */
  private applyFixedBody(sprite: Phaser.Physics.Arcade.Image, frac: { x0: number; y0: number; x1: number; y1: number }, angle: number) {
    const dW = sprite.width * this.scale;
    const dH = sprite.height * this.scale;
    const aabb = rotatedAabb(frac, sprite.width, sprite.height, this.scale, angle);
    const base = rotatePoint(-dW / 2, -dH / 2, angle);
    (sprite.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(aabb.xmax - aabb.xmin, aabb.ymax - aabb.ymin)
      .setOffset(aabb.xmin - base.x, aabb.ymin - base.y);
  }

  update(time: number) {
    const t = time / 1000;

    // Deslizamiento sin parar + envoltura: una sola fórmula de módulo, sin
    // guardar de qué lado toca reaparecer.
    const progress = (t * SEA_DRAGON_SPEED + this.phaseDistance) % this.totalRange;
    const seamX = this.direction === 1 ? -this.halfSpan + progress : this.totalRange - this.halfSpan - progress;

    // Ondulación del torso (suave) y latigazo de la cola (marcado) —
    // ambos oscilan alrededor del mismo ángulo base, cada uno con su
    // propia amplitud/velocidad/fase, ver "hazlo animado bien bueno".
    const bodyAngle =
      this.baseAngle +
      SEA_DRAGON_BODY_SWAY_AMPLITUDE * Math.sin((time * Math.PI * 2) / SEA_DRAGON_BODY_SWAY_PERIOD_MS + this.bodyPhase);
    const tailAngle =
      this.baseAngle +
      SEA_DRAGON_TAIL_WAG_AMPLITUDE * Math.sin((time * Math.PI * 2) / SEA_DRAGON_TAIL_WAG_PERIOD_MS + this.tailPhase);

    // La cola vive del lado "de atrás" de la costura respecto a la
    // dirección de viaje — arrastra detrás de la cabeza, nunca por
    // delante.
    const tailSeamX = seamX - this.direction * SEA_DRAGON_GAP_WIDTH;

    const bodySeam = seamOffset(this.bodySprite.height, this.scale, bodyAngle, 1);
    const tailSeam = seamOffset(this.tailSprite.height, this.scale, tailAngle, -1);

    this.bodySprite.setRotation(bodyAngle);
    this.tailSprite.setRotation(tailAngle);
    this.bodySprite.setPosition(seamX - bodySeam.x, this.centerY - bodySeam.y);
    this.tailSprite.setPosition(tailSeamX - tailSeam.x, this.centerY - tailSeam.y);

    (this.bodySprite.body as Phaser.Physics.Arcade.StaticBody).reset(this.bodySprite.x, this.bodySprite.y);
    (this.tailSprite.body as Phaser.Physics.Arcade.StaticBody).reset(this.tailSprite.x, this.tailSprite.y);
  }

  destroy() {
    this.bodySprite.destroy();
    this.tailSprite.destroy();
  }
}
