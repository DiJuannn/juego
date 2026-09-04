import Phaser from "phaser";
import { BlinkEyes } from "@/systems/BlinkEyes";

const BOB_AMPLITUDE = 10;
const BOB_SPEED = 0.55;
const DRIFT_AMPLITUDE = 35;
const DRIFT_SPEED = 0.35;
// La campana "respira": se estrecha en horizontal justo cuando se estira en
// vertical (y viceversa), como el pulso real de nado de una medusa, en vez
// de un escalado uniforme que se siente más como un simple latido.
const PULSE_AMOUNT = 0.09;
const PULSE_SPEED = 1.1;
// Balanceo de rotación leve: da sensación de ir a la deriva, no clavada en
// el sitio.
const ROTATION_AMOUNT = 0.05;
const ROTATION_SPEED = 0.4;

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
  private readonly blinkEyes: BlinkEyes;

  constructor(scene: Phaser.Scene, x: number, y: number, scale: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "jellyfish");
    this.sprite.setScale(scale);
    // Pedido explícito: todos los animales en la misma capa que Lumi, para
    // que se lean claramente como obstáculos y no como decoración de fondo.
    this.sprite.setDepth(5);
    this.sprite.refreshBody();

    this.baseX = x;
    this.baseY = y;
    this.baseScale = scale;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);

    // Posiciones medidas directamente sobre jellyfish.png (431x604, origen
    // en el centro): los dos ojos están en (129, 168) y (298, 166).
    this.blinkEyes = new BlinkEyes(
      scene,
      this.sprite,
      [
        { x: -86.5, y: -134.3, radius: 15 },
        { x: 82.5, y: -135.9, radius: 15 },
      ],
      5.01,
    );
  }

  destroy() {
    this.blinkEyes.destroy();
  }

  /** Movimiento puramente visual: el cuerpo físico se queda en su posición
   * nominal, el vaivén es pequeño y no afecta al overlap de forma notable. */
  update(time: number) {
    const t = time / 1000;
    this.sprite.y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
    this.sprite.x = this.baseX + Math.sin(t * DRIFT_SPEED + this.phase) * DRIFT_AMPLITUDE;

    const pulse = Math.sin(t * PULSE_SPEED + this.phase);
    this.sprite.setScale(
      this.baseScale * (1 + pulse * PULSE_AMOUNT),
      this.baseScale * (1 - pulse * PULSE_AMOUNT * 0.6),
    );
    this.sprite.rotation = Math.sin(t * ROTATION_SPEED + this.phase) * ROTATION_AMOUNT;
    this.blinkEyes.update(time);
  }
}
