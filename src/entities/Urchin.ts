import Phaser from "phaser";
import { BlinkEyes } from "@/systems/BlinkEyes";

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
  private readonly blinkEyes: BlinkEyes;

  constructor(scene: Phaser.Scene, x: number, y: number, scale: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "urchin");
    this.sprite.setScale(scale);
    this.sprite.setDepth(4.75);
    this.sprite.refreshBody();

    this.baseY = y;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);

    // Ojos medidos sobre urchin.png (846x680, origen en el centro): centros
    // en (202.8, 313.9) y (397.8, 341.1).
    this.blinkEyes = new BlinkEyes(
      scene,
      this.sprite,
      [
        { x: -220.2, y: -26.1, radius: 20 },
        { x: -25.2, y: 1.1, radius: 20 },
      ],
      4.76,
    );
  }

  destroy() {
    this.blinkEyes.destroy();
  }

  update(time: number) {
    this.sprite.y = this.baseY + Math.sin((time / 1000) * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
    this.blinkEyes.update(time);
  }
}
