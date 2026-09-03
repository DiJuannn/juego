import Phaser from "phaser";

export const DECOR_KEYS = ["decor_pebble", "decor_shell", "decor_starfish"];

const MIN_GAP = 260;
const MAX_GAP = 520;
const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;

/**
 * Objetos de fondo puramente decorativos (piedras, conchas, estrellas):
 * sin física, sin colisión, solo para que el camino hacia arriba no se
 * sienta vacío. Se generan y reciclan igual que los nenúfares.
 */
export class BackgroundDecorSpawner {
  private items: Phaser.GameObjects.Image[] = [];
  private highestY: number;

  constructor(
    private scene: Phaser.Scene,
    private worldWidth: number,
    startY: number,
    private depth: number,
    private scrollFactor: number,
  ) {
    this.highestY = startY;
  }

  private spawnAt(y: number) {
    const key = Phaser.Utils.Array.GetRandom(DECOR_KEYS);
    const x = Phaser.Math.Between(60, this.worldWidth - 60);
    const scale = Phaser.Math.FloatBetween(0.12, 0.22);
    const item = this.scene.add
      .image(x, y, key)
      .setScale(scale)
      .setScrollFactor(this.scrollFactor)
      .setDepth(this.depth)
      .setAlpha(0.9)
      .setAngle(Phaser.Math.Between(-15, 15))
      .setFlipX(Math.random() < 0.5);
    this.items.push(item);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(MIN_GAP, MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.items = this.items.filter((item) => {
      if (item.y <= cameraBottomY + DESPAWN_MARGIN) return true;
      item.destroy();
      return false;
    });
  }
}
