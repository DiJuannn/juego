import Phaser from "phaser";
import { BlinkTimer } from "@/systems/BlinkTimer";

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
  private readonly blinkTimer = new BlinkTimer();
  private isBlinking = false;

  constructor(scene: Phaser.Scene, x: number, y: number, scale: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "urchin");
    this.sprite.setScale(scale);
    // Pedido explícito: todos los animales en la misma capa que Lumi, para
    // que se lean claramente como obstáculos y no como decoración de fondo.
    this.sprite.setDepth(5);
    this.sprite.refreshBody();
    // Pedido explícito: hitbox ajustada al cuerpo real de púas, no a las
    // esquinas vacías del lienzo — medido sobre urchin.png (846x680).
    // Multiplicado por `scale`: un StaticBody no escala el tamaño/offset
    // automáticamente con setScale() (confirmado con un probe en juego —
    // la hitbox se quedaba ~2.7x más grande que el dibujo visible).
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(406 * scale, 355 * scale)
      .setOffset(220 * scale, 162 * scale);

    this.baseY = y;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  update(time: number) {
    this.sprite.y = this.baseY + Math.sin((time / 1000) * BOB_SPEED + this.phase) * BOB_AMPLITUDE;

    // Parpadeo: arte de verdad (urchin_blink.png, generado con Gemini a
    // partir de este mismo sprite), no un Graphics dibujado por código.
    const blinking = this.blinkTimer.isBlinking(time);
    if (blinking !== this.isBlinking) {
      this.isBlinking = blinking;
      this.sprite.setTexture(blinking ? "urchin_blink" : "urchin");
    }
  }
}
