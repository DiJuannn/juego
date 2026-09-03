import Phaser from "phaser";

/**
 * Peces de fondo puramente decorativos, muy detrás de Lumi (parallax lento,
 * escala pequeña). El arte (16 peces) lo subió el usuario ya recortado con
 * matting ML; aquí solo se anima su nado (movimiento + balanceo), que es
 * lógica de juego, no arte nuevo.
 */
export const FISH_KEYS = Array.from({ length: 16 }, (_, i) => `fish_${String(i + 1).padStart(2, "0")}`);

interface FishState {
  sprite: Phaser.GameObjects.Image;
  speed: number;
  direction: 1 | -1;
  baseY: number;
  bobPhase: number;
  bobSpeed: number;
  bobAmplitude: number;
}

export class BackgroundFishField {
  private fish: FishState[] = [];
  private worldWidth: number;

  constructor(
    scene: Phaser.Scene,
    worldWidth: number,
    worldHeight: number,
    depth: number,
    scrollFactor: number,
    count = 10,
  ) {
    this.worldWidth = worldWidth;

    for (let i = 0; i < count; i++) {
      const key = Phaser.Utils.Array.GetRandom(FISH_KEYS);
      const direction: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      const x = Phaser.Math.Between(0, worldWidth);
      const baseY = Phaser.Math.Between(worldHeight * 0.15, worldHeight * 0.75);
      const scale = Phaser.Math.FloatBetween(0.12, 0.22);

      const sprite = scene.add
        .image(x, baseY, key)
        .setScale(scale)
        .setScrollFactor(scrollFactor)
        .setDepth(depth)
        .setAlpha(0.8)
        .setTint(0xcfe6ff);
      // El arte original mira a la derecha; si nada a la izquierda se voltea.
      sprite.setFlipX(direction === -1);

      this.fish.push({
        sprite,
        speed: Phaser.Math.FloatBetween(12, 28),
        direction,
        baseY,
        bobPhase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        bobSpeed: Phaser.Math.FloatBetween(0.6, 1.1),
        bobAmplitude: Phaser.Math.FloatBetween(6, 14),
      });
    }
  }

  update(time: number, delta: number) {
    const margin = 150;
    for (const f of this.fish) {
      f.sprite.x += f.speed * f.direction * (delta / 1000);

      if (f.direction === 1 && f.sprite.x > this.worldWidth + margin) {
        f.sprite.x = -margin;
      } else if (f.direction === -1 && f.sprite.x < -margin) {
        f.sprite.x = this.worldWidth + margin;
      }

      f.sprite.y = f.baseY + Math.sin(time / 1000 * f.bobSpeed + f.bobPhase) * f.bobAmplitude;
    }
  }

  destroy() {
    for (const f of this.fish) f.sprite.destroy();
    this.fish = [];
  }
}
