import Phaser from "phaser";
import { COIN_SCALE } from "@/config/GameConfig";

const BOB_AMPLITUDE = 6;
const BOB_SPEED = 1.4;
const SPIN_SPEED = 0.9;

/**
 * Moneda: recompensa + guía visual de ruta (ver CoinSpawner, que las coloca
 * en grupos, no sueltas). Mismo patrón que ShieldPickup: bob suave + un pop
 * al recogerla, cuerpo estático.
 */
export class CoinPickup {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;
  private phase: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "coin");
    this.sprite.setScale(COIN_SCALE);
    this.sprite.setDepth(4.2);
    this.sprite.refreshBody();

    this.baseY = y;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  /** Balanceo vertical + un leve "destello" de giro (escala X oscilando),
   * para que se note interactiva sin necesitar un sprite animado nuevo. */
  update(time: number) {
    const t = time / 1000;
    this.sprite.y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
    this.sprite.setScale(COIN_SCALE * (0.85 + 0.15 * Math.cos(t * SPIN_SPEED + this.phase)), COIN_SCALE);
  }

  playPickupAndDestroy(scene: Phaser.Scene, onComplete: () => void) {
    scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.7,
      scaleY: this.sprite.scaleY * 1.7,
      alpha: 0,
      duration: 220,
      ease: "Back.easeOut",
      onComplete: () => {
        this.sprite.destroy();
        onComplete();
      },
    });
  }
}
