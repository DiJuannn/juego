import Phaser from "phaser";
import { BlinkEyes } from "@/systems/BlinkEyes";

const DRIFT_SPEED = 40; // px/seg mientras flota
const DASH_SPEED = 260; // px/seg durante el impulso
const DASH_DURATION_MS = 280;
const DASH_MIN_INTERVAL_MS = 1400;
const DASH_MAX_INTERVAL_MS = 2600;
const BOB_AMPLITUDE = 10;
const BOB_SPEED = 0.7;

/**
 * Tercer enemigo: un calamar que flota a la deriva y de vez en cuando da un
 * impulso rápido (como un "jet" de verdad) en su dirección actual — un
 * patrón de movimiento distinto al vaivén de la medusa y a la patrulla
 * constante del tiburón, para que cada obstáculo se esquive de forma
 * distinta. Cuerpo físico dinámico, igual que el tiburón.
 */
export class Squid {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;
  private phase: number;
  private direction: 1 | -1;
  private dashingUntil = 0;
  private nextDashAt: number;
  private readonly blinkEyes: BlinkEyes;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    scale: number,
    private minX: number,
    private maxX: number,
  ) {
    this.sprite = scene.physics.add.image(x, y, "squid");
    this.sprite.setScale(scale);
    // Pedido explícito: todos los animales en la misma capa que Lumi, para
    // que se lean claramente como obstáculos y no como decoración de fondo.
    this.sprite.setDepth(5);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    this.baseY = y;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.nextDashAt = Phaser.Math.Between(DASH_MIN_INTERVAL_MS, DASH_MAX_INTERVAL_MS);
    this.sprite.setVelocityX(DRIFT_SPEED * this.direction);

    // Ojos medidos sobre squid.png (927x762, origen en el centro): centros
    // en (503.7, 389.5) y (680.4, 464.9) — asimétricos porque el dibujo está
    // en 3/4, no de frente.
    this.blinkEyes = new BlinkEyes(
      scene,
      this.sprite,
      [
        { x: 40.2, y: 8.5, radius: 28 },
        { x: 216.9, y: 83.9, radius: 30 },
      ],
      5.01,
    );
  }

  destroy() {
    this.blinkEyes.destroy();
  }

  update(time: number) {
    const t = time / 1000;

    if (this.sprite.x <= this.minX) this.direction = 1;
    else if (this.sprite.x >= this.maxX) this.direction = -1;

    const dashing = time < this.dashingUntil;
    if (!dashing && time >= this.nextDashAt) {
      this.dashingUntil = time + DASH_DURATION_MS;
      this.nextDashAt = this.dashingUntil + Phaser.Math.Between(DASH_MIN_INTERVAL_MS, DASH_MAX_INTERVAL_MS);
    }

    const speed = time < this.dashingUntil ? DASH_SPEED : DRIFT_SPEED;
    this.sprite.setVelocityX(speed * this.direction);
    this.sprite.y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
    this.blinkEyes.update(time);
  }
}
