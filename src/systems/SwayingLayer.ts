import Phaser from "phaser";

/**
 * Balanceo suave de una capa de fondo (algas) como si la moviera la
 * corriente: una rotación pequeña alrededor de su base (origin 0.5,1), no
 * un asset nuevo — solo transforma la imagen ya existente.
 */
export class SwayingLayer {
  private phase: number;

  constructor(
    private image: Phaser.GameObjects.Image,
    private amplitudeDeg: number,
    private speed: number,
  ) {
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  update(time: number) {
    const amplitudeRad = Phaser.Math.DegToRad(this.amplitudeDeg);
    this.image.rotation = Math.sin((time / 1000) * this.speed + this.phase) * amplitudeRad;
  }
}
