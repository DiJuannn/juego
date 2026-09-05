import Phaser from "phaser";
import { Crab } from "@/entities/Crab";
import { CRAB_MAX_GAP, CRAB_MIN_GAP, CRAB_SCALE, START_Y } from "@/config/GameConfig";
import { isHazardAllowed } from "@/config/Zone1Segments";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
const RANGE_MARGIN_X = 80;

/** Sexto enemigo: cangrejos que corretean a trompicones. Igual patrón de
 * reciclado que el resto de spawners de animales. */
export class CrabSpawner {
  readonly group: Phaser.Physics.Arcade.Group;
  private crabs: Crab[] = [];
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
    // Pedido explícito: nunca dejar un animal parado justo en la banda de
    // un cúmulo de arrecife — mismo criterio que el resto de peligros.
    if (this.isWithinCoralBand?.(y)) return;
    if (!isHazardAllowed(START_Y - y)) return;
    this.place(y);
  }

  /** Colocación exacta desde el nivel scripteado (ver Zone1Level.ts). */
  spawnExact(y: number, x?: number) {
    this.place(y, x);
  }

  private place(y: number, x?: number) {
    const scale = CRAB_SCALE * Phaser.Math.FloatBetween(0.9, 1.1);
    const finalX = x ?? Phaser.Math.Between(this.worldWidth * 0.3, this.worldWidth * 0.7);
    const crab = new Crab(this.scene, finalX, y, scale, RANGE_MARGIN_X, this.worldWidth - RANGE_MARGIN_X);
    this.group.add(crab.sprite);
    this.crabs.push(crab);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(CRAB_MIN_GAP, CRAB_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.crabs = this.crabs.filter((crab) => {
      if (crab.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(crab.sprite, true, true);
        return false;
      }
      crab.update(time);
      return true;
    });
  }
}
