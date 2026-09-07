import Phaser from "phaser";
import { MantaRay } from "@/entities/MantaRay";
import { MANTA_RAY_MAX_GAP, MANTA_RAY_MIN_GAP, MANTA_RAY_SCALE, START_Y } from "@/config/GameConfig";
import { isHazardAllowed } from "@/config/Zone1Segments";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
const MARGIN_X = 140;

/** Undécimo enemigo: mantarrayas, que cruzan el mapa en diagonal con un
 * barrido tipo Lissajous (ver entities/MantaRay.ts). Mismo patrón de
 * reciclado que SeahorseSpawner. */
export class MantaRaySpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private rays: MantaRay[] = [];
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
    if (this.isWithinCoralBand?.(y)) return;
    if (!isHazardAllowed(START_Y - y, "mantaray")) return;
    this.place(y);
  }

  /** Colocación exacta desde el nivel scripteado (ver Zone1Level.ts). */
  spawnExact(y: number, x?: number) {
    this.place(y, x);
  }

  private place(y: number, x?: number) {
    const finalX = x ?? Phaser.Math.Between(MARGIN_X, this.worldWidth - MARGIN_X);
    const scale = MANTA_RAY_SCALE * Phaser.Math.FloatBetween(0.9, 1.1);
    const ray = new MantaRay(this.scene, finalX, y, scale, this.worldWidth);
    this.group.add(ray.sprite);
    this.rays.push(ray);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(MANTA_RAY_MIN_GAP, MANTA_RAY_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.rays = this.rays.filter((ray) => {
      if (ray.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(ray.sprite, true, true);
        return false;
      }
      ray.update(time);
      return true;
    });
  }
}
