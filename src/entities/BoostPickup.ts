import Phaser from "phaser";
import { BOOST_PICKUP_SCALE } from "@/config/GameConfig";

const BOB_AMPLITUDE = 10;
const BOB_SPEED = 1.6;
const DRIFT_AMPLITUDE = 4;
const DRIFT_SPEED = 0.8;

/**
 * Power-up de impulso vertical: distinto del nenúfar (ver GameConfig y
 * Lumi.triggerSuperBoost). Mismo patrón bob+pop que ShieldPickup/CoinPickup,
 * pero con un balanceo algo más "burbujeante" (también deriva un poco de
 * lado a lado) para diferenciarlo visualmente en movimiento.
 */
export class BoostPickup {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseX: number;
  private baseY: number;
  private phase: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "boost_bubble");
    this.sprite.setScale(BOOST_PICKUP_SCALE);
    this.sprite.setDepth(4.25);
    this.sprite.refreshBody();

    this.baseX = x;
    this.baseY = y;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  update(time: number) {
    const t = time / 1000;
    this.sprite.y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
    this.sprite.x = this.baseX + Math.sin(t * DRIFT_SPEED + this.phase) * DRIFT_AMPLITUDE;
  }

  playPickupAndDestroy(scene: Phaser.Scene, onComplete: () => void) {
    scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.8,
      scaleY: this.sprite.scaleY * 1.8,
      alpha: 0,
      duration: 240,
      ease: "Back.easeOut",
      onComplete: () => {
        this.sprite.destroy();
        onComplete();
      },
    });
  }
}
