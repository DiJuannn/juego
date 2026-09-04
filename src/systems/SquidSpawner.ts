import Phaser from "phaser";
import { Squid } from "@/entities/Squid";
import { SQUID_MAX_GAP, SQUID_MIN_GAP, SQUID_SCALE, START_Y } from "@/config/GameConfig";
import { isHazardAllowed } from "@/config/Zone1Segments";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
const RANGE_MARGIN_X = 80;

/** Tercer enemigo: calamares con impulsos de "jet". Igual patrón de
 * reciclado que JellyfishSpawner/SharkSpawner. */
export class SquidSpawner {
  readonly group: Phaser.Physics.Arcade.Group;
  private squids: Squid[] = [];
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
    const scale = SQUID_SCALE * Phaser.Math.FloatBetween(0.9, 1.1);
    const x = Phaser.Math.Between(this.worldWidth * 0.3, this.worldWidth * 0.7);
    const squid = new Squid(this.scene, x, y, scale, RANGE_MARGIN_X, this.worldWidth - RANGE_MARGIN_X);
    this.group.add(squid.sprite);
    this.squids.push(squid);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(SQUID_MIN_GAP, SQUID_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.squids = this.squids.filter((squid) => {
      if (squid.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(squid.sprite, true, true);
        return false;
      }
      squid.update(time);
      return true;
    });
  }
}
