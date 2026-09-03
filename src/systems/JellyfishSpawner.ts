import Phaser from "phaser";
import { Jellyfish } from "@/entities/Jellyfish";
import { JELLYFISH_MAX_GAP, JELLYFISH_MIN_GAP, JELLYFISH_SCALE } from "@/config/GameConfig";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
const MARGIN_X = 140;

/**
 * Primer enemigo del juego: medusas que hay que esquivar (tocarlas es game
 * over). Se generan mucho más espaciadas que los nenúfares — es una
 * introducción suave, "poco a poco", no una pared de peligros.
 */
export class JellyfishSpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private jellies: Jellyfish[] = [];
  private highestY: number;

  constructor(
    private scene: Phaser.Scene,
    private worldWidth: number,
    startY: number,
  ) {
    this.group = scene.physics.add.staticGroup();
    this.highestY = startY;
  }

  private spawnAt(y: number) {
    const x = Phaser.Math.Between(MARGIN_X, this.worldWidth - MARGIN_X);
    const scale = JELLYFISH_SCALE * Phaser.Math.FloatBetween(0.85, 1.15);
    const jelly = new Jellyfish(this.scene, x, y, scale);
    this.group.add(jelly.sprite);
    this.jellies.push(jelly);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(JELLYFISH_MIN_GAP, JELLYFISH_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.jellies = this.jellies.filter((jelly) => {
      if (jelly.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(jelly.sprite, true, true);
        return false;
      }
      jelly.update(time);
      return true;
    });
  }
}
