import Phaser from "phaser";

const BOB_AMPLITUDE = 14;
const BOB_SPEED = 0.5;
const TILT_AMOUNT = 0.06;
const PATROL_SPEED = 70; // px/seg

/**
 * Segundo enemigo: un tiburón que patrulla de un lado a otro de una franja
 * horizontal (a diferencia de la medusa, que solo deriva un poco). Usa
 * cuerpo físico DINÁMICO (no estático como la medusa/nenúfar): recorre
 * demasiada distancia como para que un cuerpo estático fijo en el punto de
 * aparición siga sirviendo de hitbox.
 */
export class Shark {
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
    this.sprite = scene.physics.add.image(x, y, "shark");
    this.sprite.setScale(scale);
    this.sprite.setDepth(4.85);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    this.baseY = y;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    // El arte mira hacia la izquierda por defecto: moverse a la derecha
    // necesita flip.
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.sprite.setFlipX(this.direction === 1);
    this.sprite.setVelocityX(PATROL_SPEED * this.direction);
  }

  update(time: number) {
    const t = time / 1000;

    if (this.sprite.x >= this.maxX && this.direction === 1) {
      this.direction = -1;
      this.sprite.setFlipX(false);
      this.sprite.setVelocityX(PATROL_SPEED * this.direction);
    } else if (this.sprite.x <= this.minX && this.direction === -1) {
      this.direction = 1;
      this.sprite.setFlipX(true);
      this.sprite.setVelocityX(PATROL_SPEED * this.direction);
    }

    this.sprite.y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
    this.sprite.rotation = Math.sin(t * BOB_SPEED + this.phase) * TILT_AMOUNT * this.direction;
  }
}
