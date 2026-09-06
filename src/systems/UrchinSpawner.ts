import Phaser from "phaser";
import { Urchin } from "@/entities/Urchin";
import { URCHIN_MAX_GAP, URCHIN_MIN_GAP, URCHIN_SCALE, START_Y } from "@/config/GameConfig";
import { isHazardAllowed } from "@/config/Zone1Segments";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
// Pedido explícito: "más animales... puedes poner más animales juntos" —
// mismo mecanismo que JellyfishSpawner (ver ahí el razonamiento completo):
// a veces un segundo erizo cerca del primero en la cadencia al azar.
const BUDDY_CHANCE = 0.3;
const BUDDY_Y_OFFSET_MIN = 50;
const BUDDY_Y_OFFSET_MAX = 110;
const BUDDY_X_OFFSET_MIN = 150;
const BUDDY_X_OFFSET_MAX = 280;

/** Cuarto enemigo: erizos, casi inmóviles. Mismo patrón de reciclado que
 * JellyfishSpawner. */
export class UrchinSpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private urchins: Urchin[] = [];
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
    // Pedido explícito: nunca dejar un erizo parado justo en la banda de un
    // coral estrecho — ahí el carril libre tiene que quedar garantizado sin
    // ningún animal encima.
    if (this.isWithinCoralBand?.(y)) return;
    // Progresión de Zona 1 en tramos (ver Zone1Segments).
    if (!isHazardAllowed(START_Y - y)) return;
    const x = Phaser.Math.Between(120, this.worldWidth - 120);
    this.place(y, x);

    if (Phaser.Math.FloatBetween(0, 1) < BUDDY_CHANCE) {
      const buddyY = y - Phaser.Math.Between(BUDDY_Y_OFFSET_MIN, BUDDY_Y_OFFSET_MAX);
      const xOffset = Phaser.Math.Between(BUDDY_X_OFFSET_MIN, BUDDY_X_OFFSET_MAX);
      const buddyX = Phaser.Math.Clamp(x + (Math.random() < 0.5 ? -xOffset : xOffset), 120, this.worldWidth - 120);
      if (!this.isWithinCoralBand?.(buddyY) && isHazardAllowed(START_Y - buddyY)) {
        this.place(buddyY, buddyX);
      }
    }
  }

  /** Colocación exacta desde el nivel scripteado del Tramo 1 (ver
   * Zone1Level.ts) — sin las comprobaciones de banda/descanso, que son
   * solo para la generación al azar de más arriba. */
  spawnExact(y: number, x?: number) {
    this.place(y, x);
  }

  private place(y: number, x?: number) {
    const finalX = x ?? Phaser.Math.Between(120, this.worldWidth - 120);
    const scale = URCHIN_SCALE * Phaser.Math.FloatBetween(0.9, 1.1);
    const urchin = new Urchin(this.scene, finalX, y, scale);
    this.group.add(urchin.sprite);
    this.urchins.push(urchin);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(URCHIN_MIN_GAP, URCHIN_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.urchins = this.urchins.filter((urchin) => {
      if (urchin.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(urchin.sprite, true, true);
        return false;
      }
      urchin.update(time);
      return true;
    });
  }
}
