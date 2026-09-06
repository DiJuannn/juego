import Phaser from "phaser";
import { Seahorse } from "@/entities/Seahorse";
import { SEAHORSE_MAX_GAP, SEAHORSE_MIN_GAP, SEAHORSE_SCALE, START_Y } from "@/config/GameConfig";
import { isHazardAllowed } from "@/config/Zone1Segments";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
const MARGIN_X = 140;

/** Noveno enemigo: caballitos de mar, que patrullan de un lado a otro del
 * mapa dando vueltas en bucle (ver entities/Seahorse.ts). Mismo patrón de
 * reciclado que JellyfishSpawner. */
export class SeahorseSpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private seahorses: Seahorse[] = [];
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
    if (!isHazardAllowed(START_Y - y)) return;
    this.place(y);
  }

  /** Colocación exacta desde el nivel scripteado del Tramo 1 (ver
   * Zone1Level.ts) — sin las comprobaciones de banda/descanso. */
  spawnExact(y: number, x?: number) {
    this.place(y, x);
  }

  /** Colocación dentro del hueco seguro de un laberinto (ver
   * `animalHints` en ReefTemplates.ts) — confinado a un vaivén corto
   * alrededor de `x` en vez de patrullar el mundo entero, si no se saldría
   * del hueco casi al instante. */
  spawnConfined(y: number, x: number, patrolRadius: number) {
    this.place(y, x, patrolRadius);
  }

  private place(y: number, x?: number, patrolRadius?: number) {
    const finalX = x ?? Phaser.Math.Between(MARGIN_X, this.worldWidth - MARGIN_X);
    const scale = SEAHORSE_SCALE * Phaser.Math.FloatBetween(0.9, 1.1);
    const seahorse = new Seahorse(this.scene, finalX, y, scale, this.worldWidth, patrolRadius);
    this.group.add(seahorse.sprite);
    this.seahorses.push(seahorse);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(SEAHORSE_MIN_GAP, SEAHORSE_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.seahorses = this.seahorses.filter((seahorse) => {
      if (seahorse.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(seahorse.sprite, true, true);
        return false;
      }
      seahorse.update(time);
      return true;
    });
  }
}
