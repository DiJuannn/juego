import Phaser from "phaser";
import { Barnacle } from "@/entities/Barnacle";
import { BARNACLE_MAX_GAP, BARNACLE_MIN_GAP, BARNACLE_SCALE, START_Y } from "@/config/GameConfig";
import { isHazardAllowed } from "@/config/Zone1Segments";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;

/** Décimo enemigo: balanos, inmóviles como el erizo, con un doble
 * chasquido hacia Lumi cuando se acerca (ver entities/Barnacle). Mismo
 * patrón de reciclado que UrchinSpawner/CoralTrapSpawner. */
export class BarnacleSpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private barnacles: Barnacle[] = [];
  private highestY: number;

  constructor(
    private scene: Phaser.Scene,
    private worldWidth: number,
    startY: number,
    private readonly getLumiPosition: () => { x: number; y: number },
    private readonly isWithinCoralBand?: (y: number) => boolean,
  ) {
    this.group = scene.physics.add.staticGroup();
    this.highestY = startY;
  }

  private spawnAt(y: number) {
    if (this.isWithinCoralBand?.(y)) return;
    if (!isHazardAllowed(START_Y - y, "barnacle")) return;
    this.place(y);
  }

  /** Colocación exacta desde el nivel scripteado del Tramo 1 (ver
   * Zone1Level.ts) — sin las comprobaciones de banda/descanso. */
  spawnExact(y: number, x?: number) {
    this.place(y, x);
  }

  private place(y: number, x?: number) {
    const finalX = x ?? Phaser.Math.Between(120, this.worldWidth - 120);
    const scale = BARNACLE_SCALE * Phaser.Math.FloatBetween(0.9, 1.1);
    const barnacle = new Barnacle(this.scene, finalX, y, scale, this.getLumiPosition);
    this.group.add(barnacle.sprite);
    this.barnacles.push(barnacle);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(BARNACLE_MIN_GAP, BARNACLE_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.barnacles = this.barnacles.filter((barnacle) => {
      if (barnacle.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(barnacle.sprite, true, true);
        return false;
      }
      barnacle.update(time);
      return true;
    });
  }
}
