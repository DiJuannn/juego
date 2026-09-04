import Phaser from "phaser";

/**
 * Corriente de agua: no es una criatura, es una franja horizontal de mundo
 * donde el agua empuja lateralmente a Lumi mientras esté dentro (ver
 * `pushAt`, que PondScene consulta cada frame). Se visualiza con una franja
 * de color translúcida más burbujas fluyendo en la dirección del empuje —
 * así se entiende por qué de repente cuesta más nadar hacia un lado, sin
 * necesitar un asset nuevo (reutiliza bubble_small).
 */
export class CurrentZone {
  readonly y: number;
  private band: Phaser.GameObjects.Rectangle;
  private particles: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(
    scene: Phaser.Scene,
    y: number,
    height: number,
    worldWidth: number,
    readonly direction: 1 | -1,
    readonly strength: number,
  ) {
    this.y = y;

    this.band = scene.add
      .rectangle(worldWidth / 2, y, worldWidth, height, 0x8fc9e0, 0.12)
      .setDepth(3.5);

    this.particles = scene.add
      .particles(0, y, "bubble_small", {
        x: { min: 0, max: worldWidth },
        y: { min: -height / 2, max: height / 2 },
        speedX: { min: direction * strength * 0.6, max: direction * strength * 1.1 },
        speedY: { min: -6, max: 6 },
        lifespan: 2200,
        quantity: 1,
        frequency: 220,
        alpha: { start: 0.5, end: 0 },
        scale: { start: 0.16, end: 0.09 },
        tint: 0x8fc9e0,
      })
      .setDepth(3.6);
  }

  /** Empuje lateral (px/seg) en esa altura Y, o 0 si está fuera de la
   * franja. */
  pushAt(targetY: number): number {
    if (Math.abs(targetY - this.y) > this.band.height / 2) return 0;
    return this.direction * this.strength;
  }

  destroy() {
    this.band.destroy();
    this.particles.destroy();
  }
}
