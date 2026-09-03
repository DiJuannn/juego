import Phaser from "phaser";

/**
 * Burbujas ambientales flotando hacia arriba por todo el estanque.
 *
 * Los sprites (bubble_big/bubble_small) no son arte nuevo: son un
 * recorte de las burbujas ya dibujadas junto a Lumi en idle_01.png,
 * reutilizadas tal cual. Aquí solo se anima su movimiento (partículas),
 * que es lógica de juego.
 */
export class BubbleField {
  private emitters: Phaser.GameObjects.Particles.ParticleEmitter[];

  constructor(scene: Phaser.Scene, worldWidth: number, worldHeight: number, depth: number) {
    const baseConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x: { min: 0, max: worldWidth },
      // Se reparten por toda la columna de agua (no solo desde el fondo)
      // para que siempre haya alguna burbuja visible cerca de Lumi, esté
      // donde esté nadando, en vez de tardar en "llegar" desde abajo.
      y: { min: 0, max: worldHeight },
      lifespan: { min: 9000, max: 16000 },
      speedY: { min: -35, max: -75 },
      speedX: { min: -12, max: 12 },
      alpha: { start: 0.85, end: 0.15 },
    };

    this.emitters = [
      scene.add.particles(0, 0, "bubble_big", {
        ...baseConfig,
        scale: { min: 0.3, max: 0.55 },
        frequency: 450,
      }),
      scene.add.particles(0, 0, "bubble_small", {
        ...baseConfig,
        scale: { min: 0.25, max: 0.45 },
        frequency: 380,
      }),
    ];

    for (const emitter of this.emitters) emitter.setDepth(depth);
  }

  destroy() {
    for (const emitter of this.emitters) emitter.destroy();
  }
}
