import Phaser from "phaser";
import { FlyingFish } from "@/entities/FlyingFish";
import { FLYING_FISH_MAX_GAP, FLYING_FISH_MIN_GAP, FLYING_FISH_SCALE, START_Y } from "@/config/GameConfig";
import { isHazardAllowed } from "@/config/Zone1Segments";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
const MARGIN_X = 140;
// Pedido explícito ("mejorar su animación, que esté más arriba"): antes
// reposaba exactamente en el mismo carril que el resto de peligros
// flotantes — se sentía como si saliera de la nada justo en el camino de
// Lumi. Ahora su punto de reposo real queda un poco más arriba (Y menor)
// que la altura que le asigna el spawner (scripteada o aleatoria), dando
// más margen real de reacción antes de que el aviso/salto lleguen a la
// altura donde nada Lumi.
const REST_Y_LIFT = 55;

/** Duodécimo enemigo: peces voladores, reposo+salto en arco en vez de
 * movimiento continuo (ver entities/FlyingFish.ts). Mismo patrón de
 * reciclado que SeahorseSpawner/MantaRaySpawner. */
export class FlyingFishSpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private fishes: FlyingFish[] = [];
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
    if (!isHazardAllowed(START_Y - y, "flyingfish")) return;
    this.place(y);
  }

  /** Colocación exacta desde el nivel scripteado (ver Zone1Level.ts). */
  spawnExact(y: number, x?: number) {
    this.place(y, x);
  }

  private place(y: number, x?: number) {
    const finalX = x ?? Phaser.Math.Between(MARGIN_X, this.worldWidth - MARGIN_X);
    const scale = FLYING_FISH_SCALE * Phaser.Math.FloatBetween(0.9, 1.1);
    const fish = new FlyingFish(this.scene, finalX, y - REST_Y_LIFT, scale, this.worldWidth);
    this.group.add(fish.sprite);
    this.fishes.push(fish);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(FLYING_FISH_MIN_GAP, FLYING_FISH_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.fishes = this.fishes.filter((fish) => {
      if (fish.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(fish.sprite, true, true);
        fish.destroy();
        return false;
      }
      fish.update(time);
      return true;
    });
  }
}
