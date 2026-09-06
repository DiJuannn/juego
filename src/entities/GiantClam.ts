import Phaser from "phaser";

const BOB_AMPLITUDE = 6;
const BOB_SPEED = 0.3;
const BREATHE_AMPLITUDE = 0.05;
const BREATHE_SPEED = 1.3;
// Pedido explícito: "mejora el movimiento que sea más elaborado de los
// que ya tenemos" — un balanceo angular sutil (como una concha asentada
// meciéndose un poco con la corriente), además del bob/respiración que ya
// tenía. Ángulo pequeño a propósito: el hitbox de la almeja es un
// rectángulo fijo centrado casi exactamente en el sprite (ver el ajuste
// de tamaño/offset más abajo), así que un balanceo de pocos grados no lo
// desincroniza de forma perceptible.
const ROCK_AMPLITUDE = 0.05; // rad
const ROCK_SPEED = 0.4;

/**
 * Séptimo enemigo (pedido explícito: "crea más animales... la almeja
 * podrías crearle una animación y que te coma"). Antes era solo una pieza
 * decorativa estática de `ReefCluster` (`lateralWall`, sin colisión de
 * verdad como peligro) — ahora es un animal real: queda abierta y quieta
 * (con un ligero balanceo, igual criterio que Urchin) hasta que Lumi la
 * toca, momento en el que PondScene la cierra de golpe
 * (`giant_clam_closed`) como parte de la secuencia de muerte — ver
 * `startDeathSequence`/`playClamBite` en PondScene.ts, que además tira de
 * Lumi hacia el centro de la almeja en vez del hundimiento genérico, para
 * que se lea claramente como "la almeja se la comió".
 */
export class GiantClam {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;
  private baseScale: number;
  private phase: number;

  constructor(scene: Phaser.Scene, x: number, y: number, scale: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "giant_clam");
    this.sprite.setScale(scale);
    // Pedido explícito: todos los animales en la misma capa que Lumi, para
    // que se lean claramente como obstáculos y no como decoración de fondo.
    this.sprite.setDepth(5);
    this.sprite.refreshBody();
    // Hitbox ajustada a la concha real (no a las esquinas vacías del
    // lienzo) — mismo bbox que ya se usaba cuando era pieza de
    // ReefCluster ([0.13,0.21,0.87,0.8] sobre 1024x1024), en píxeles
    // nativos. Multiplicado por `scale`: un StaticBody no escala el
    // tamaño/offset automáticamente con setScale().
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(757.76 * scale, 604.16 * scale)
      .setOffset(133.12 * scale, 215.04 * scale);

    this.baseY = y;
    this.baseScale = scale;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  /** Mismo motivo que Jellyfish/Urchin: un StaticBody no sigue sprite.x/y
   * asignado a mano, ni escala su tamaño con setScale() — hay que
   * reposicionar y reescalar el body a mano cada frame. */
  update(time: number) {
    const t = time / 1000;
    const y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
    const pulse = 1 + Math.sin(t * BREATHE_SPEED + this.phase) * BREATHE_AMPLITUDE;
    this.sprite.setScale(this.baseScale * pulse);
    this.sprite.setRotation(Math.sin(t * ROCK_SPEED + this.phase) * ROCK_AMPLITUDE);

    const body = this.sprite.body as Phaser.Physics.Arcade.StaticBody;
    body
      .setSize(757.76 * this.baseScale * pulse, 604.16 * this.baseScale * pulse)
      .setOffset(133.12 * this.baseScale * pulse, 215.04 * this.baseScale * pulse);
    body.reset(this.sprite.x, y);
  }
}
