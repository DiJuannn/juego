import Phaser from "phaser";
import { BoostPickup } from "@/entities/BoostPickup";
import { BOOST_PICKUP_MAX_GAP, BOOST_PICKUP_MIN_GAP } from "@/config/GameConfig";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
const MARGIN_X = 120;

/** Power-up de impulso: mismo patrón de reciclado que ShieldPickupSpawner. */
export class BoostPickupSpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private pickups: BoostPickup[] = [];
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
    const pickup = new BoostPickup(this.scene, x, y);
    this.group.add(pickup.sprite);
    this.pickups.push(pickup);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(BOOST_PICKUP_MIN_GAP, BOOST_PICKUP_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.pickups = this.pickups.filter((pickup) => {
      if (pickup.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(pickup.sprite, true, true);
        return false;
      }
      pickup.update(time);
      return true;
    });
  }

  consume(pickupSprite: Phaser.Physics.Arcade.Image) {
    const pickup = this.pickups.find((p) => p.sprite === pickupSprite);
    if (!pickup) return;
    this.group.remove(pickup.sprite, false, false);
    this.pickups = this.pickups.filter((p) => p !== pickup);
    pickup.playPickupAndDestroy(this.scene, () => {});
  }
}
