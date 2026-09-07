import Phaser from "phaser";
import { Jellyfish } from "@/entities/Jellyfish";
import { JELLYFISH_MAX_GAP, JELLYFISH_MIN_GAP, JELLYFISH_SCALE, START_Y } from "@/config/GameConfig";
import { isHazardAllowed } from "@/config/Zone1Segments";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
const MARGIN_X = 140;
// Pedido explícito: "más animales... puedes poner más animales juntos" —
// en la cadencia al azar (nunca en el nivel scripteado de Zone1Level, que
// ya compone sus propios grupos a mano), a veces aparece una segunda
// medusa cerca de la primera en vez de siempre una sola y sola. Offset en
// Y pequeño (no exactamente la misma altura, para que no se lean como un
// "sprite duplicado") y separación en X generosa para que sigan dejando
// hueco de sobra para pasar entre las dos.
const BUDDY_CHANCE = 0.3;
const BUDDY_Y_OFFSET_MIN = 60;
const BUDDY_Y_OFFSET_MAX = 140;
const BUDDY_X_OFFSET_MIN = 180;
const BUDDY_X_OFFSET_MAX = 320;

/**
 * Primer enemigo del juego: medusas que hay que esquivar (tocarlas es game
 * over). Se generan mucho más espaciadas que los nenúfares — es una
 * introducción suave, "poco a poco", no una pared de peligros.
 */
export class JellyfishSpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private jellies: Jellyfish[] = [];
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
    // Pedido explícito: nunca dejar una medusa parada justo en la banda de
    // un coral estrecho — ahí el carril libre tiene que quedar garantizado
    // sin ningún animal encima.
    if (this.isWithinCoralBand?.(y)) return;
    // Progresión de Zona 1 en tramos (ver Zone1Segments): la medusa no
    // aparece en los tramos de descanso ni antes de su propia introducción.
    if (!isHazardAllowed(START_Y - y, "jellyfish")) return;
    const x = Phaser.Math.Between(MARGIN_X, this.worldWidth - MARGIN_X);
    this.place(y, x);

    if (Phaser.Math.FloatBetween(0, 1) < BUDDY_CHANCE) {
      const buddyY = y - Phaser.Math.Between(BUDDY_Y_OFFSET_MIN, BUDDY_Y_OFFSET_MAX);
      const xOffset = Phaser.Math.Between(BUDDY_X_OFFSET_MIN, BUDDY_X_OFFSET_MAX);
      const buddyX = Phaser.Math.Clamp(
        x + (Math.random() < 0.5 ? -xOffset : xOffset),
        MARGIN_X,
        this.worldWidth - MARGIN_X,
      );
      if (!this.isWithinCoralBand?.(buddyY) && isHazardAllowed(START_Y - buddyY, "jellyfish")) {
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
    const finalX = x ?? Phaser.Math.Between(MARGIN_X, this.worldWidth - MARGIN_X);
    const scale = JELLYFISH_SCALE * Phaser.Math.FloatBetween(0.85, 1.15);
    const jelly = new Jellyfish(this.scene, finalX, y, scale);
    this.group.add(jelly.sprite);
    this.jellies.push(jelly);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(JELLYFISH_MIN_GAP, JELLYFISH_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.jellies = this.jellies.filter((jelly) => {
      if (jelly.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(jelly.sprite, true, true);
        jelly.destroy();
        return false;
      }
      jelly.update(time);
      return true;
    });
  }
}
