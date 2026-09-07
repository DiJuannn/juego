import Phaser from "phaser";
import { CoralTrap } from "@/entities/CoralTrap";
import { CORAL_TRAP_MAX_GAP, CORAL_TRAP_MIN_GAP, CORAL_TRAP_SCALE, START_Y } from "@/config/GameConfig";
import { isHazardAllowed } from "@/config/Zone1Segments";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;

/** Octavo enemigo: corales trampa, casi inmóviles como el erizo/la almeja,
 * pero con un "lunge" hacia Lumi cuando se acerca (ver entities/CoralTrap).
 * Mismo patrón de reciclado que UrchinSpawner/GiantClamSpawner. */
export class CoralTrapSpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private traps: CoralTrap[] = [];
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
    if (!isHazardAllowed(START_Y - y, "coraltrap")) return;
    this.place(y);
  }

  /** Colocación exacta desde el nivel scripteado del Tramo 1 (ver
   * Zone1Level.ts) — sin las comprobaciones de banda/descanso. */
  spawnExact(y: number, x?: number) {
    this.place(y, x);
  }

  private place(y: number, x?: number) {
    const finalX = x ?? Phaser.Math.Between(120, this.worldWidth - 120);
    const scale = CORAL_TRAP_SCALE * Phaser.Math.FloatBetween(0.9, 1.1);
    const trap = new CoralTrap(this.scene, finalX, y, scale, this.getLumiPosition);
    this.group.add(trap.sprite);
    this.traps.push(trap);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(CORAL_TRAP_MIN_GAP, CORAL_TRAP_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.traps = this.traps.filter((trap) => {
      if (trap.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(trap.sprite, true, true);
        return false;
      }
      trap.update(time);
      return true;
    });
  }
}
