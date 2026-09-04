import Phaser from "phaser";
import { BlinkEyes } from "@/systems/BlinkEyes";

const BOB_AMPLITUDE = 10;
const BOB_SPEED = 0.7;

/**
 * 3 patrones de patrulla distintos (pedido explícito: variedad de
 * movimiento) — cada instancia elige uno al azar en el constructor. Todos
 * comparten el mismo "lenguaje" (deriva + impulso tipo jet), lo que cambia
 * es el ritmo y la fuerza del impulso:
 *   - deriva_impulsos: el original — deriva calmada, impulsos moderados
 *     a intervalos regulares.
 *   - zigzag_rapido: cambia de dirección con cada impulso (no solo al
 *     llegar al borde de su rango), impulsos cortos y frecuentes — se
 *     esquiva distinto porque la dirección es impredecible.
 *   - acecho_quieto: casi inmóvil la mayor parte del tiempo, luego un
 *     único impulso largo y mucho más rápido — un "ataque" puntual en vez
 *     de un vaivén constante.
 */
type SquidPatrolType = "deriva_impulsos" | "zigzag_rapido" | "acecho_quieto";

const PATROL_TUNING: Record<
  SquidPatrolType,
  {
    driftSpeed: number;
    dashSpeed: number;
    dashDurationMs: number;
    dashMinIntervalMs: number;
    dashMaxIntervalMs: number;
    randomizeDirectionOnDash: boolean;
  }
> = {
  deriva_impulsos: {
    driftSpeed: 40,
    dashSpeed: 260,
    dashDurationMs: 280,
    dashMinIntervalMs: 1400,
    dashMaxIntervalMs: 2600,
    randomizeDirectionOnDash: false,
  },
  zigzag_rapido: {
    driftSpeed: 30,
    dashSpeed: 220,
    dashDurationMs: 200,
    dashMinIntervalMs: 700,
    dashMaxIntervalMs: 1200,
    randomizeDirectionOnDash: true,
  },
  acecho_quieto: {
    driftSpeed: 12,
    dashSpeed: 360,
    dashDurationMs: 380,
    dashMinIntervalMs: 2600,
    dashMaxIntervalMs: 4200,
    randomizeDirectionOnDash: true,
  },
};

/**
 * Tercer enemigo: un calamar que flota a la deriva y de vez en cuando da un
 * impulso rápido (como un "jet" de verdad) — un patrón de movimiento
 * distinto al vaivén de la medusa y a la patrulla constante del tiburón,
 * para que cada obstáculo se esquive de forma distinta. Cuerpo físico
 * dinámico, igual que el tiburón.
 */
export class Squid {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;
  private phase: number;
  private direction: 1 | -1;
  private dashingUntil = 0;
  private nextDashAt: number;
  private readonly patrolType: SquidPatrolType;
  private readonly tuning: (typeof PATROL_TUNING)[SquidPatrolType];
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
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    // Pedido explícito: hitbox ajustada al manto/cabeza real, no a los
    // tentáculos sueltos ni al hueco alrededor — medido sobre squid.png
    // (927x762).
    body.setSize(453, 407).setOffset(226, 166);

    this.baseY = y;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.patrolType = Phaser.Utils.Array.GetRandom(Object.keys(PATROL_TUNING) as SquidPatrolType[]);
    this.tuning = PATROL_TUNING[this.patrolType];
    this.nextDashAt = Phaser.Math.Between(this.tuning.dashMinIntervalMs, this.tuning.dashMaxIntervalMs);
    this.sprite.setVelocityX(this.tuning.driftSpeed * this.direction);

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
    const { driftSpeed, dashSpeed, dashDurationMs, dashMinIntervalMs, dashMaxIntervalMs, randomizeDirectionOnDash } =
      this.tuning;

    if (this.sprite.x <= this.minX) this.direction = 1;
    else if (this.sprite.x >= this.maxX) this.direction = -1;

    const dashing = time < this.dashingUntil;
    if (!dashing && time >= this.nextDashAt) {
      if (randomizeDirectionOnDash) this.direction = Math.random() < 0.5 ? 1 : -1;
      this.dashingUntil = time + dashDurationMs;
      this.nextDashAt = this.dashingUntil + Phaser.Math.Between(dashMinIntervalMs, dashMaxIntervalMs);
    }

    const speed = time < this.dashingUntil ? dashSpeed : driftSpeed;
    this.sprite.setVelocityX(speed * this.direction);
    this.sprite.y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
    this.blinkEyes.update(time);
  }
}
