import Phaser from "phaser";
import { BIG_FISH_PATROL_SPEED } from "@/config/GameConfig";

const BOB_AMPLITUDE = 12;
const BOB_SPEED = 0.45;

/**
 * Quinto obstáculo: un pez mucho más grande que los decorativos de fondo
 * (mismo arte, "fish_05", solo que a mayor escala — no hace falta arte
 * nuevo). A diferencia de medusa/tiburón/calamar/erizo, tocarlo NO es game
 * over: solo empuja a Lumi (ver PondScene, que aplica el empujón en el
 * overlap). Patrulla como el tiburón, cuerpo dinámico.
 */
export class BigFish {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;
  private phase: number;
  private direction: 1 | -1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    scale: number,
    private minX: number,
    private maxX: number,
  ) {
    this.sprite = scene.physics.add.image(x, y, "fish_05");
    this.sprite.setScale(scale);
    this.sprite.setDepth(4.6);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    this.baseY = y;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    // El arte de los peces mira a la derecha por defecto (ver
    // BackgroundFishField): moverse a la izquierda necesita flip.
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.sprite.setFlipX(this.direction === -1);
    this.sprite.setVelocityX(BIG_FISH_PATROL_SPEED * this.direction);
  }

  update(time: number) {
    const t = time / 1000;

    if (this.sprite.x >= this.maxX && this.direction === 1) {
      this.direction = -1;
      this.sprite.setFlipX(true);
    } else if (this.sprite.x <= this.minX && this.direction === -1) {
      this.direction = 1;
      this.sprite.setFlipX(false);
    }
    // Igual que el tiburón: reafirmar cada frame, no solo al girar — el
    // grupo físico resetea la velocidad a 0 justo después de que el
    // constructor la fija (ver BigFishSpawner), si no el pez se queda
    // parado para siempre.
    this.sprite.setVelocityX(BIG_FISH_PATROL_SPEED * this.direction);

    this.sprite.y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
  }
}
