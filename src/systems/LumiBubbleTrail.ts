import Phaser from "phaser";

/**
 * Burbujas que sigue a Lumi como partículas de verdad (posición, subida y
 * desvanecido animados por código), en vez de depender de burbujas fijas
 * dibujadas dentro de los propios frames del sprite — así no dan saltos al
 * cambiar de frame de animación.
 */
export class LumiBubbleTrail {
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, target: Phaser.GameObjects.Sprite, depth: number) {
    this.emitter = scene.add.particles(0, 0, "bubble_small", {
      lifespan: { min: 1200, max: 2000 },
      speedY: { min: -40, max: -70 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.18, end: 0.05 },
      alpha: { start: 0.8, end: 0 },
      frequency: 220,
      quantity: 1,
    });
    this.emitter.setDepth(depth);
    this.emitter.startFollow(target, 0, 10);
  }

  destroy() {
    this.emitter.destroy();
  }
}
