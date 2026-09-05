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
    private readonly isWithinCoralBand?: (y: number) => boolean,
  ) {
    this.group = scene.physics.add.group();
    this.highestY = startY;
  }

  private spawnAt(y: number) {
    // Pedido explícito: nunca dejar un calamar parado justo en la banda de
    // un cúmulo de arrecife — mismo criterio que medusa/erizo.
    if (this.isWithinCoralBand?.(y)) return;
    // Progresión de Zona 1 en tramos (ver Zone1Segments).
    if (!isHazardAllowed(START_Y - y)) return;
    this.place(y);
  }

  /** Colocación exacta desde el nivel scripteado del Tramo 2 (ver
   * Zone1Level.ts) — sin las comprobaciones de banda/descanso, que son
   * solo para la generación al azar de más arriba. */
  spawnExact(y: number, x?: number) {
    this.place(y, x);
  }

  private place(y: number, x?: number) {
    const scale = SQUID_SCALE * Phaser.Math.FloatBetween(0.9, 1.1);
    const finalX = x ?? Phaser.Math.Between(this.worldWidth * 0.3, this.worldWidth * 0.7);
    const squid = new Squid(this.scene, finalX, y, scale, RANGE_MARGIN_X, this.worldWidth - RANGE_MARGIN_X);
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
