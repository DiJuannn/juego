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

  constructor(
    scene: Phaser.Scene,
    viewWidth: number,
    viewHeight: number,
    depth: number,
    followTarget: Phaser.GameObjects.Sprite,
  ) {
    // El mundo de un juego de escalada infinita no tiene una altura fija:
    // en vez de repartir burbujas en un rango absoluto (que dejaría de
    // tener sentido en cuanto Lumi suba), el emisor sigue a Lumi y las
    // posiciones son un desplazamiento relativo del tamaño de la pantalla,
    // así siempre hay burbujas cerca sea cual sea la altura alcanzada.
    const baseConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      x: { min: -viewWidth / 2, max: viewWidth / 2 },
      y: { min: -viewHeight, max: viewHeight * 0.6 },
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

    for (const emitter of this.emitters) {
      emitter.setDepth(depth);
      emitter.startFollow(followTarget);
    }
  }

  destroy() {
    for (const emitter of this.emitters) emitter.destroy();
  }
}
