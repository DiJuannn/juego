import Phaser from "phaser";
import { CurrentZone } from "@/entities/CurrentZone";
import {
  CURRENT_ZONE_HEIGHT,
  CURRENT_ZONE_MAX_GAP,
  CURRENT_ZONE_MIN_GAP,
  CURRENT_ZONE_STRENGTH,
} from "@/config/GameConfig";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;

/** Último obstáculo de la Zona 1: franjas de corriente que empujan
 * lateralmente. Mismo patrón de reciclado que los demás spawners, pero sin
 * overlap físico — PondScene consulta `pushAt` cada frame en vez de un
 * evento de colisión. */
export class CurrentZoneSpawner {
  private zones: CurrentZone[] = [];
  private highestY: number;

  constructor(
    private scene: Phaser.Scene,
    private worldWidth: number,
    startY: number,
  ) {
    this.highestY = startY;
  }

  private spawnAt(y: number) {
    const direction = Math.random() < 0.5 ? 1 : -1;
    const zone = new CurrentZone(this.scene, y, CURRENT_ZONE_HEIGHT, this.worldWidth, direction, CURRENT_ZONE_STRENGTH);
    this.zones.push(zone);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(CURRENT_ZONE_MIN_GAP, CURRENT_ZONE_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.zones = this.zones.filter((zone) => {
      if (zone.y > cameraBottomY + DESPAWN_MARGIN) {
        zone.destroy();
        return false;
      }
      return true;
    });
  }

  /** Suma el empuje de todas las franjas activas en esa altura Y (0 si
   * ninguna la cubre). */
  pushAt(y: number): number {
    let total = 0;
    for (const zone of this.zones) total += zone.pushAt(y);
    return total;
  }
}
