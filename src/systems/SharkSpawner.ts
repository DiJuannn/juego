import Phaser from "phaser";
import { Shark } from "@/entities/Shark";
import { SHARK_MAX_GAP, SHARK_MIN_GAP, SHARK_SCALE } from "@/config/GameConfig";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
const PATROL_MARGIN_X = 80;

/**
 * Segundo enemigo: tiburones que patrullan de lado a lado. Igual patrón de
 * reciclado que JellyfishSpawner.
 */
export class SharkSpawner {
  readonly group: Phaser.Physics.Arcade.Group;
  private sharks: Shark[] = [];
  private highestY: number;

  constructor(
    private scene: Phaser.Scene,
    private worldWidth: number,
    startY: number,
  ) {
    this.group = scene.physics.add.group();
    this.highestY = startY;
  }

  private spawnAt(y: number) {
    const scale = SHARK_SCALE * Phaser.Math.FloatBetween(0.9, 1.1);
    const x = Phaser.Math.Between(this.worldWidth * 0.3, this.worldWidth * 0.7);
    const shark = new Shark(this.scene, x, y, scale, PATROL_MARGIN_X, this.worldWidth - PATROL_MARGIN_X);
    this.group.add(shark.sprite);
    this.sharks.push(shark);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(SHARK_MIN_GAP, SHARK_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.sharks = this.sharks.filter((shark) => {
      if (shark.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(shark.sprite, true, true);
        return false;
      }
      shark.update(time);
      return true;
    });
  }
}
