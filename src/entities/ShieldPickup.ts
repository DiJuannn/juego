import Phaser from "phaser";
import { SHIELD_PICKUP_SCALE } from "@/config/GameConfig";

const BOB_AMPLITUDE = 8;
const BOB_SPEED = 1.1;
const SPIN_AMOUNT = 0.18;
const SPIN_SPEED = 0.6;

/**
 * Power-up: escudo de burbuja. Se recoge como un nenúfar (bob + un pop al
 * usarse), pero en vez de dar un impulso, activa un escudo que absorbe UN
 * golpe letal (ver PondScene.consumeShield).
 */
export class ShieldPickup {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;
  private phase: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "shield_bubble");
    this.sprite.setScale(SHIELD_PICKUP_SCALE);
    this.sprite.setDepth(4.3);
    this.sprite.refreshBody();

    this.baseY = y;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  /** Balanceo vertical + una leve rotación (para que se note "especial",
   * distinto de una burbuja ambiental que no gira). */
  update(time: number) {
    const t = time / 1000;
    this.sprite.y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
    this.sprite.rotation = Math.sin(t * SPIN_SPEED + this.phase) * SPIN_AMOUNT;
  }

  playPickupAndDestroy(scene: Phaser.Scene, onComplete: () => void) {
    scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.6,
      scaleY: this.sprite.scaleY * 1.6,
      alpha: 0,
      duration: 260,
      ease: "Back.easeOut",
      onComplete: () => {
        this.sprite.destroy();
        onComplete();
      },
    });
  }
}
