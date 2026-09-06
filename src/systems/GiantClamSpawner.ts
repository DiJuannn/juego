import Phaser from "phaser";
import { GiantClam } from "@/entities/GiantClam";
import { GIANT_CLAM_MAX_GAP, GIANT_CLAM_MIN_GAP, GIANT_CLAM_SCALE, START_Y } from "@/config/GameConfig";
import { isHazardAllowed } from "@/config/Zone1Segments";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;

/** Séptimo enemigo: almejas gigantes, casi inmóviles como el erizo. Mismo
 * patrón de reciclado que UrchinSpawner/JellyfishSpawner. */
export class GiantClamSpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private clams: GiantClam[] = [];
  private highestY: number;

  constructor(
    private scene: Phaser.Scene,
    private worldWidth: number,
    startY: number,
    private readonly isWithinCoralBand?: (y: number) => boolean,
  ) {
    this.group = scene.physics.add.staticGroup();
    this.highestY = startY;
  }

  private spawnAt(y: number) {
    // Pedido explícito: nunca dejar un animal parado justo en la banda de
    // un cúmulo de arrecife — ahí el carril libre tiene que quedar
    // garantizado sin nada encima.
    if (this.isWithinCoralBand?.(y)) return;
    if (!isHazardAllowed(START_Y - y)) return;
    this.place(y);
  }

  /** Colocación exacta desde el nivel scripteado del Tramo 1 (ver
   * Zone1Level.ts) — sin las comprobaciones de banda/descanso, que son
   * solo para la generación al azar de más arriba. */
  spawnExact(y: number, x?: number) {
    this.place(y, x);
  }

  private place(y: number, x?: number) {
    const finalX = x ?? Phaser.Math.Between(120, this.worldWidth - 120);
    const scale = GIANT_CLAM_SCALE * Phaser.Math.FloatBetween(0.9, 1.1);
    const clam = new GiantClam(this.scene, finalX, y, scale);
    this.group.add(clam.sprite);
    this.clams.push(clam);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(GIANT_CLAM_MIN_GAP, GIANT_CLAM_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.clams = this.clams.filter((clam) => {
      if (clam.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(clam.sprite, true, true);
        return false;
      }
      clam.update(time);
      return true;
    });
  }
}
