import Phaser from "phaser";

/**
 * Decoración puramente ambiental (sin colisión, sin recompensa) que rellena
 * los tramos largos entre cúmulos de arrecife/peligros — pedido explícito
 * pendiente desde hace rondas: "la decoración (rocas/coral) se concentra en
 * una franja y deja un tramo largo vacío antes de repetirse, así que no se
 * lee como infinito con decoración continua". Reutiliza EXACTAMENTE los
 * mismos assets ya usados como obstáculos en ReefTemplates (ninguna imagen
 * nueva, cero arte generado) pero pegados de verdad al borde del mundo, muy
 * pequeños y a baja opacidad — nunca invaden el carril de juego ni se leen
 * como un obstáculo real.
 */
const KEYS = ["reef_boulder_rock", "decor_pebble", "decor_starfish"];
const MIN_GAP = 1100;
const MAX_GAP = 1900;
const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
// Muy pegado al borde (0 = borde exacto) — mucho más afuera que
// EDGE_INSET (0.18) de los obstáculos reales de ReefTemplates, para que
// nunca se confunda con un obstáculo ni estreche el hueco de paso.
const EDGE_RANGE = [0.0, 0.05];

export class AmbientDecorSpawner {
  private images: Phaser.GameObjects.Image[] = [];
  private highestY: number;

  constructor(private scene: Phaser.Scene, private worldWidth: number, startY: number) {
    this.highestY = startY;
  }

  private spawnAt(y: number) {
    const side: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
    const rel = Phaser.Math.FloatBetween(EDGE_RANGE[0], EDGE_RANGE[1]);
    const x = side === -1 ? rel * this.worldWidth : this.worldWidth - rel * this.worldWidth;
    const key = Phaser.Utils.Array.GetRandom(KEYS);

    const img = this.scene.add
      .image(x, y, key)
      .setScale(Phaser.Math.FloatBetween(0.07, 0.11))
      .setAlpha(Phaser.Math.FloatBetween(0.3, 0.45))
      .setRotation(Phaser.Math.FloatBetween(-0.2, 0.2))
      .setFlipX(side === 1)
      .setDepth(1.5);

    this.images.push(img);
  }

  update(cameraTopY: number, cameraBottomY: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(MIN_GAP, MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.images = this.images.filter((img) => {
      if (img.y > cameraBottomY + DESPAWN_MARGIN) {
        img.destroy();
        return false;
      }
      return true;
    });
  }
}
