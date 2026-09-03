import Phaser from "phaser";
import { LILY_PAD_SCALE } from "@/config/GameConfig";

const BOB_AMPLITUDE = 6;
const BOB_SPEED = 1.4;

/**
 * Nenúfar interactivo: cuerpo estático que, al tocarlo Lumi, dispara un
 * impulso hacia arriba (ver Lumi.triggerBoost). Es una pequeña ayuda para
 * ganar altura más rápido, no un objeto protagonista — va detrás de Lumi,
 * pequeño, flotando siempre recto (sin girar), solo con un balanceo
 * vertical suave para sentirse vivo en el agua.
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
   * posición nominal para el overlap): solo sube y baja, nunca gira. */
  update(time: number) {
    this.sprite.y = this.baseY + Math.sin(time / 1000 * BOB_SPEED + this.bobPhase) * BOB_AMPLITUDE;
  }

  /** Al usarlo: un pequeño "achuchón" (se aplasta como si lo pisaran) y
   * luego un pop rápido que se hunde y desaparece, en vez del fundido
   * lento de antes. */
  playUseAnimationAndDestroy(scene: Phaser.Scene, onComplete: () => void) {
    const baseScale = this.sprite.scale;
    scene.tweens.add({
      targets: this.sprite,
      scaleX: baseScale * 1.25,
      scaleY: baseScale * 0.75,
      duration: 90,
      ease: "Sine.easeOut",
      onComplete: () => {
        scene.tweens.add({
          targets: this.sprite,
          scaleX: 0,
          scaleY: 0,
          y: this.sprite.y + 14,
          alpha: 0,
          duration: 200,
          ease: "Back.easeIn",
          onComplete: () => {
            this.sprite.destroy();
            onComplete();
          },
        });
      },
    });
  }
}
