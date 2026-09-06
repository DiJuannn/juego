import Phaser from "phaser";
import { Shark } from "@/entities/Shark";
import {
  SHARK_CHASE_COOLDOWN_MS,
  SHARK_CHASE_COOLDOWN_MS_HARD,
  SHARK_CHASE_MIN_OFFSET,
  SHARK_CHASE_MIN_OFFSET_HARD,
  SHARK_CHASE_SPEED,
  SHARK_CHASE_SPEED_HARD,
  SHARK_MAX_GAP,
  SHARK_MIN_GAP,
  SHARK_PATROL_RANGE,
  SHARK_SCALE,
  START_Y,
} from "@/config/GameConfig";
import { isHazardAllowed } from "@/config/Zone1Segments";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
const WORLD_MARGIN_X = 80;

/**
 * Segundo enemigo: tiburones que patrullan de lado a lado. Igual patrón de
 * reciclado que JellyfishSpawner.
 */
export class SharkSpawner {
  readonly group: Phaser.Physics.Arcade.Group;
  private sharks: Shark[] = [];
  private highestY: number;

  constructor(
    private scene: Phaser.Scene,
    private worldWidth: number,
    startY: number,
    private readonly getLumiPosition: () => { x: number; y: number },
    private readonly isWithinCoralBand?: (y: number) => boolean,
  ) {
    this.group = scene.physics.add.group();
    this.highestY = startY;
  }

  private spawnAt(y: number) {
    // Pedido explícito: nunca dejar un tiburón patrullando justo en la
    // banda de un cúmulo de arrecife — mismo criterio que medusa/erizo.
    if (this.isWithinCoralBand?.(y)) return;
    // Progresión de Zona 1 en tramos (ver Zone1Segments).
    if (!isHazardAllowed(START_Y - y)) return;
    this.place(y);
  }

  /** Colocación exacta desde el nivel scripteado del Tramo 1 (ver
   * Zone1Level.ts) — sin la comprobación de descanso, que es solo para la
   * generación al azar de más arriba. `direction` opcional: pedido
   * explícito del usuario para poder forzar dos tiburones seguidos
   * patrullando en sentidos opuestos, en vez de dejarlo al azar. */
  spawnExact(y: number, x?: number, direction?: 1 | -1) {
    this.place(y, x, direction);
  }

  private place(y: number, x?: number, direction?: 1 | -1) {
    const scale = SHARK_SCALE * Phaser.Math.FloatBetween(0.9, 1.1);
    const finalX = x ?? Phaser.Math.Between(this.worldWidth * 0.3, this.worldWidth * 0.7);
    // Radio local alrededor del punto de aparición, recortado a los bordes
    // del mundo — así el vaivén se nota dentro del tiempo que Lumi lo tiene
    // a la vista, en vez de una sola pasada de un lado a otro de todo el
    // mundo.
    const minX = Math.max(WORLD_MARGIN_X, finalX - SHARK_PATROL_RANGE);
    const maxX = Math.min(this.worldWidth - WORLD_MARGIN_X, finalX + SHARK_PATROL_RANGE);
    // Progresión (pedido explícito): solo los tiburones que ya aparecen
    // cerca del final de la Zona 1 pueden perseguir — los primeros que ve
    // el jugador se quedan en patrulla simple. Pedido explícito de una
    // ronda posterior ("entre más arriba... para que sean más difíciles"):
    // pasado un segundo umbral, más arriba todavía, persiguen más rápido y
    // con más frecuencia (menos enfriamiento) en vez de con la misma
    // intensidad de siempre.
    const climbed = START_Y - y;
    const canChase = climbed >= SHARK_CHASE_MIN_OFFSET;
    const hardTier = climbed >= SHARK_CHASE_MIN_OFFSET_HARD;
    const chaseSpeed = hardTier ? SHARK_CHASE_SPEED_HARD : SHARK_CHASE_SPEED;
    const chaseCooldownMs = hardTier ? SHARK_CHASE_COOLDOWN_MS_HARD : SHARK_CHASE_COOLDOWN_MS;
    const shark = new Shark(
      this.scene,
      finalX,
      y,
      scale,
      minX,
      maxX,
      this.worldWidth,
      canChase,
      this.getLumiPosition,
      direction,
      chaseSpeed,
      chaseCooldownMs,
    );
    this.group.add(shark.sprite);
    this.sharks.push(shark);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(SHARK_MIN_GAP, SHARK_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.sharks = this.sharks.filter((shark) => {
      if (shark.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(shark.sprite, true, true);
        return false;
      }
      shark.update(time);
      return true;
    });
  }
}
