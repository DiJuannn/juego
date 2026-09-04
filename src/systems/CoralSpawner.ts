import Phaser from "phaser";
import { CoralWall } from "@/entities/CoralWall";
import { CORAL_MAX_GAP, CORAL_MIN_GAP } from "@/config/GameConfig";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
// Margen extra alrededor de la banda de altura de cada pared: los spawners
// de medusa/erizo (animales estáticos) lo consultan antes de colocar uno
// nuevo para no dejar nunca un animal parado justo en el carril libre.
const BAND_SAFETY_MARGIN = 60;

/**
 * Coral estrecho: paredes que solo dejan pasar a Lumi por un lado. Mismo
 * patrón de reciclado que el resto de spawners, pero cada "entidad" es en
 * realidad un grupo de varios trozos (ver CoralWall).
 */
export class CoralSpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private walls: CoralWall[] = [];
  private highestY: number;

  constructor(
    private scene: Phaser.Scene,
    private worldWidth: number,
    startY: number,
  ) {
    this.group = scene.physics.add.staticGroup();
    this.highestY = startY;
  }

  private spawnAt(y: number) {
    const gapSide = Math.random() < 0.5 ? "left" : "right";
    const wall = new CoralWall(this.scene, this.worldWidth, y, gapSide);
    for (const chunk of wall.sprites) this.group.add(chunk);
    this.walls.push(wall);
    if (y < this.highestY) this.highestY = y;
  }

  /** Consultado por JellyfishSpawner/UrchinSpawner: si es true, esa altura
   * cae dentro de la banda de una pared de coral y NO deben colocar un
   * animal ahí (ni en el carril libre ni en ningún otro punto de la banda)
   * — más simple y a prueba de errores que intentar esquivar solo el
   * carril exacto. */
  isWithinAnyCoralBand(y: number): boolean {
    return this.walls.some((wall) => y >= wall.yTop - BAND_SAFETY_MARGIN && y <= wall.yBottom + BAND_SAFETY_MARGIN);
  }

  update(cameraTopY: number, cameraBottomY: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(CORAL_MIN_GAP, CORAL_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.walls = this.walls.filter((wall) => {
      if (wall.yTop > cameraBottomY + DESPAWN_MARGIN) {
        for (const chunk of wall.sprites) this.group.remove(chunk, true, true);
        return false;
      }
      return true;
    });
  }
}
