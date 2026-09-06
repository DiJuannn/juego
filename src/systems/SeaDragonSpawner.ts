import Phaser from "phaser";
import { SeaDragon } from "@/entities/SeaDragon";
import { SEA_DRAGON_MAX_GAP, SEA_DRAGON_MIN_GAP, SEA_DRAGON_SCALE, START_Y } from "@/config/GameConfig";
import { isHazardAllowed } from "@/config/Zone1Segments";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;

/**
 * Decimotercer enemigo (ver entities/SeaDragon.ts para el historial de
 * correcciones). Mismo patrón de reciclado que el resto de spawners de
 * animal — ahora cada instancia es UN solo sprite (la ilustración
 * completa, sin cortar).
 */
export class SeaDragonSpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private dragons: SeaDragon[] = [];
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

  /** Colocación exacta desde el nivel scripteado (ver Zone1Level.ts). */
  spawnExact(y: number) {
    this.place(y);
  }

  private place(y: number) {
    // Arranca ya deslizándose en un punto al azar de su propio ciclo (ver
    // phaseDistance en SeaDragon) — el startX real es irrelevante, update()
    // lo recalcula desde el primer frame.
    const dragon = new SeaDragon(this.scene, this.worldWidth / 2, y, SEA_DRAGON_SCALE, this.worldWidth);
    this.group.add(dragon.sprite);
    this.dragons.push(dragon);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(SEA_DRAGON_MIN_GAP, SEA_DRAGON_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.dragons = this.dragons.filter((dragon) => {
      if (dragon.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(dragon.sprite, false, false);
        dragon.destroy();
        return false;
      }
      dragon.update(time);
      return true;
    });
  }
}
