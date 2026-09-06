import Phaser from "phaser";
import { BlinkTimer } from "@/systems/BlinkTimer";

const BOB_AMPLITUDE = 5;
const BOB_SPEED = 0.35;
// Pedido explícito: "el erizo que tenga animación tmb" — el bamboleo de
// BOB_AMPLITUDE era casi imperceptible a este tamaño. Añade un pulso de
// escala leve (las púas "respiran") con el mismo criterio que la medusa/
// los corales: nunca mover el dibujo sin mover la hitbox con él.
const BREATHE_AMPLITUDE = 0.06;
const BREATHE_SPEED = 1.1;
// Pedido explícito: "mejora el movimiento que sea más elaborado de los
// que ya tenemos" — el erizo era el más pasivo (solo bamboleo+respiración
// en el mismo sitio). Un giro lento y continuo (como una bola de púas
// rodando muy despacio en el sitio) añade vida sin inventar un
// comportamiento nuevo — el contorno del erizo es casi circular, así que
// puede rotar sin que su hitbox rectangular (fija, nunca rota con el
// sprite — ver comentario de más abajo) deje de cubrirlo bien.
const SPIN_SPEED = 0.35; // rad/s, dirección aleatoria por instancia

/**
 * Cuarto enemigo: un erizo de mar. A diferencia de la medusa (deriva) o el
 * tiburón (patrulla), el erizo casi no se mueve — es un obstáculo
 * "plantado" que hay que esquivar, no una criatura que persigue. Cuerpo
 * estático, igual que la medusa.
 */
export class Urchin {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;
  private baseScale: number;
  private phase: number;
  private readonly spinDirection: 1 | -1;
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
    this.baseScale = scale;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.spinDirection = Math.random() < 0.5 ? 1 : -1;
  }

  /** Mismo motivo que Jellyfish.update(): un StaticBody no sigue sprite.x/y
   * asignado a mano, hay que reposicionar el body explícitamente con
   * reset() aunque aquí el bamboleo sea pequeño. El pulso de escala
   * también reescala el body en la misma proporción (igual que el
   * "respirar" de ReefCluster) para que la hitbox nunca se desincronice
   * del dibujo. */
  update(time: number) {
    const t = time / 1000;
    const y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
    const pulse = 1 + Math.sin(t * BREATHE_SPEED + this.phase) * BREATHE_AMPLITUDE;
    this.sprite.setScale(this.baseScale * pulse);
    this.sprite.setRotation(t * SPIN_SPEED * this.spinDirection + this.phase);

    const body = this.sprite.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(406 * this.baseScale * pulse, 355 * this.baseScale * pulse).setOffset(
      220 * this.baseScale * pulse,
      162 * this.baseScale * pulse,
    );
    body.reset(this.sprite.x, y);

    // Parpadeo: arte de verdad (urchin_blink.png, generado con Gemini a
    // partir de este mismo sprite), no un Graphics dibujado por código.
    const blinking = this.blinkTimer.isBlinking(time);
    if (blinking !== this.isBlinking) {
      this.isBlinking = blinking;
      this.sprite.setTexture(blinking ? "urchin_blink" : "urchin");
    }
  }
}
