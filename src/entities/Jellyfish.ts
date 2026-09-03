import Phaser from "phaser";

const BOB_AMPLITUDE = 10;
const BOB_SPEED = 0.55;
const DRIFT_AMPLITUDE = 35;
const DRIFT_SPEED = 0.35;
const PULSE_AMOUNT = 0.06;
const PULSE_SPEED = 1.1;

/**
 * Primer enemigo: una medusa que flota con un vaivén suave (arriba/abajo,
 * deriva lateral, un pulso leve de "nado") — hay que esquivarla, tocarla es
 * game over.
 */
export class Jellyfish {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseX: number;
  private baseY: number;
  private baseScale: number;
  private phase: number;

  constructor(scene: Phaser.Scene, x: number, y: number, scale: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "jellyfish");
    this.sprite.setScale(scale);
    this.sprite.setDepth(4.8);
    this.sprite.refreshBody();

    this.baseX = x;
    this.baseY = y;
    this.baseScale = scale;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  /** Movimiento puramente visual: el cuerpo físico se queda en su posición
   * nominal, el vaivén es pequeño y no afecta al overlap de forma notable. */
  update(time: number) {
    const t = time / 1000;
    this.sprite.y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
    this.sprite.x = this.baseX + Math.sin(t * DRIFT_SPEED + this.phase) * DRIFT_AMPLITUDE;
    const pulse = 1 + Math.sin(t * PULSE_SPEED + this.phase) * PULSE_AMOUNT;
    this.sprite.setScale(this.baseScale * pulse);
  }
}
