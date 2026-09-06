import Phaser from "phaser";
import { BlinkTimer } from "@/systems/BlinkTimer";

// Patrón de deriva propio (ni vaivén de medusa ni casi-quieto de erizo):
// x e y avanzan a frecuencias distintas (1:2), trazando un "8" perezoso en
// vez de una órbita simple o un balanceo recto — como un caballito de mar
// de verdad, que se mantiene más o menos en el sitio pero nunca del todo
// quieto. La rotación sigue a la deriva horizontal (se inclina levemente
// hacia el lado al que se mueve).
const DRIFT_X_SPEED = 0.9;
const DRIFT_X_AMOUNT = 36;
const DRIFT_Y_SPEED = 1.8;
const DRIFT_Y_AMOUNT = 22;
const ROTATION_AMOUNT = 0.12;

/**
 * Noveno enemigo (pedido explícito: "GENÉRAME MUCHOS MÁS ANIMALES"). Flota
 * casi en el sitio con una deriva propia en forma de "8" — un peligro más
 * que esquivar, no un obstáculo estático.
 */
export class Seahorse {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseX: number;
  private baseY: number;
  private baseScale: number;
  private phase: number;
  private readonly blinkTimer = new BlinkTimer();
  private isBlinking = false;

  constructor(scene: Phaser.Scene, x: number, y: number, scale: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "seahorse");
    this.sprite.setScale(scale);
    // Pedido explícito: todos los animales en la misma capa que Lumi.
    this.sprite.setDepth(5);
    this.sprite.refreshBody();
    // Hitbox ajustada al cuerpo real (no a las esquinas vacías del
    // lienzo) — medido sobre seahorse.png (1024x1024, frac
    // [0.263,0.046,0.736,0.953]). Multiplicado por `scale`: un StaticBody
    // no escala tamaño/offset con setScale().
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(484 * scale, 929 * scale)
      .setOffset(269 * scale, 47 * scale);

    this.baseX = x;
    this.baseY = y;
    this.baseScale = scale;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  /** Mismo motivo que Jellyfish.update(): un StaticBody no sigue sprite.x/y
   * asignado a mano, hay que reposicionar el body explícitamente con
   * reset() para que la hitbox no se desincronice de la deriva visual. */
  update(time: number) {
    const t = time / 1000;
    const dx = Math.sin(t * DRIFT_X_SPEED + this.phase) * DRIFT_X_AMOUNT;
    const dy = Math.sin(t * DRIFT_Y_SPEED + this.phase) * DRIFT_Y_AMOUNT;
    const x = this.baseX + dx;
    const y = this.baseY + dy;

    this.sprite.setScale(this.baseScale);
    this.sprite.rotation = Math.cos(t * DRIFT_X_SPEED + this.phase) * ROTATION_AMOUNT;
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody).reset(x, y);

    // Parpadeo: arte de verdad (seahorse_blink.png, generado con Gemini a
    // partir de este mismo sprite), no un Graphics dibujado por código.
    const blinking = this.blinkTimer.isBlinking(time);
    if (blinking !== this.isBlinking) {
      this.isBlinking = blinking;
      this.sprite.setTexture(blinking ? "seahorse_blink" : "seahorse");
    }
  }
}
