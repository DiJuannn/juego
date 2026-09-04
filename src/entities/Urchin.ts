import Phaser from "phaser";

const BOB_AMPLITUDE = 5;
const BOB_SPEED = 0.35;

/**
 * Cuarto enemigo: un erizo de mar. A diferencia de la medusa (deriva) o el
 * tiburón (patrulla), el erizo casi no se mueve — es un obstáculo
 * "plantado" que hay que esquivar, no una criatura que persigue. Cuerpo
 * estático, igual que la medusa.
 */
export class Urchin {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;
  private phase: number;

  constructor(scene: Phaser.Scene, x: number, y: number, scale: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "urchin");
    this.sprite.setScale(scale);
    this.sprite.setDepth(4.75);
    this.sprite.refreshBody();

    this.baseY = y;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  update(time: number) {
    this.sprite.y = this.baseY + Math.sin((time / 1000) * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
  }
}
