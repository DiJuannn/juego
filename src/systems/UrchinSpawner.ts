import Phaser from "phaser";
import { Urchin } from "@/entities/Urchin";
import { URCHIN_MAX_GAP, URCHIN_MIN_GAP, URCHIN_SCALE } from "@/config/GameConfig";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;

/** Cuarto enemigo: erizos, casi inmóviles. Mismo patrón de reciclado que
 * JellyfishSpawner. */
export class UrchinSpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private urchins: Urchin[] = [];
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
    const x = Phaser.Math.Between(120, this.worldWidth - 120);
    const scale = URCHIN_SCALE * Phaser.Math.FloatBetween(0.9, 1.1);
    const urchin = new Urchin(this.scene, x, y, scale);
    this.group.add(urchin.sprite);
    this.urchins.push(urchin);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(URCHIN_MIN_GAP, URCHIN_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.urchins = this.urchins.filter((urchin) => {
      if (urchin.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(urchin.sprite, true, true);
        return false;
      }
      urchin.update(time);
      return true;
    });
  }
}
