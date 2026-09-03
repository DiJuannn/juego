import Phaser from "phaser";
import { LILY_PAD_SCALE } from "@/config/GameConfig";

const BOB_AMPLITUDE = 6;
const BOB_SPEED = 1.4;
const SPIN_SPEED = 0.4; // rad/seg, muy lento — "levitar sobre su eje"

/**
 * Nenúfar interactivo: cuerpo estático que, al tocarlo Lumi, dispara un
 * impulso hacia arriba (ver Lumi.triggerBoost). Es una pequeña ayuda para
 * ganar altura más rápido, no un objeto protagonista — va detrás de Lumi,
 * pequeño, con un balanceo/giro suave sobre su propio eje para sentirse
 * vivo flotando en el agua.
 */
export class LilyPad {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;
  private bobPhase: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "lily_pad_01");
    this.sprite.setScale(LILY_PAD_SCALE);
    this.sprite.setDepth(2.5);
    // Los cuerpos estáticos no recalculan su hitbox solos al escalar.
    this.sprite.refreshBody();

    this.baseY = y;
    this.bobPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  /** Balanceo puramente visual (no toca el cuerpo físico, sigue en su
   * posición nominal para el overlap) — un vaivén suave + giro lento. */
  update(time: number) {
    this.sprite.y = this.baseY + Math.sin(time / 1000 * BOB_SPEED + this.bobPhase) * BOB_AMPLITUDE;
    this.sprite.rotation += SPIN_SPEED * 0.001 * 16.6; // aprox. por frame a 60fps
  }

  /** Al usarlo: un pop de "consumido" y desaparece, en vez de quedarse ahí
   * para siempre. */
  playUseAnimationAndDestroy(scene: Phaser.Scene, onComplete: () => void) {
    scene.tweens.add({
      targets: this.sprite,
      scale: { from: this.sprite.scale, to: this.sprite.scale * 1.35 },
      alpha: { from: 1, to: 0 },
      duration: 260,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.sprite.destroy();
        onComplete();
      },
    });
  }
}
