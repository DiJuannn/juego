import Phaser from "phaser";
import { BigFish } from "@/entities/BigFish";
import { BIG_FISH_MAX_GAP, BIG_FISH_MIN_GAP, BIG_FISH_SCALE, START_Y } from "@/config/GameConfig";
import { isHazardAllowed } from "@/config/Zone1Segments";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
const PATROL_MARGIN_X = 100;

/** Quinto obstáculo: peces grandes que empujan en vez de matar. Mismo
 * patrón de reciclado que SharkSpawner. */
export class BigFishSpawner {
  readonly group: Phaser.Physics.Arcade.Group;
  private fish: BigFish[] = [];
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
    // Progresión de Zona 1 en tramos (ver Zone1Segments).
    if (!isHazardAllowed(START_Y - y)) return;
    const scale = BIG_FISH_SCALE * Phaser.Math.FloatBetween(0.9, 1.1);
    const x = Phaser.Math.Between(this.worldWidth * 0.3, this.worldWidth * 0.7);
    const fish = new BigFish(this.scene, x, y, scale, PATROL_MARGIN_X, this.worldWidth - PATROL_MARGIN_X);
    this.group.add(fish.sprite);
    this.fish.push(fish);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(BIG_FISH_MIN_GAP, BIG_FISH_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.fish = this.fish.filter((fish) => {
      if (fish.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(fish.sprite, true, true);
        return false;
      }
      fish.update(time);
      return true;
    });
  }
}
