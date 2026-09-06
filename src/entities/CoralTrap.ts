import Phaser from "phaser";

const BREATHE_AMPLITUDE = 0.05;
const BREATHE_SPEED = 1.2;
// "Lunge": cuando Lumi se acerca, el coral se estira hacia ella (un pulso
// de escala extra, no un movimiento de posición) antes de volver a su
// tamaño normal — sin arte nuevo, solo transformando el mismo sprite.
const LUNGE_TRIGGER_RANGE = 220;
const LUNGE_DURATION_MS = 350;
const LUNGE_COOLDOWN_MS = 1200;
const LUNGE_AMOUNT = 0.35;

/**
 * Octavo enemigo (pedido explícito: "GENÉRAME MUCHOS MÁS ANIMALES... hacer
 * combinaciones, animales que parezcan obstáculos como la concha etc.") —
 * reutiliza el arte ya aprobado de `coral_fan` (antes una pieza decorativa
 * estática de ReefCluster, sin peligro real). Igual que la almeja gigante,
 * se queda quieto y se lee como parte del arrecife hasta que Lumi se
 * acerca: entonces "se estira" hacia ella (lunge) y tocarlo cuenta como
 * golpe letal — ver DeathReason "coral" en PondScene.ts.
 */
export class CoralTrap {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseScale: number;
  private phase: number;
  private lungeStartMs = -Infinity;
  private nextLungeAllowedMs = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    scale: number,
    private readonly getLumiPosition: () => { x: number; y: number },
  ) {
    this.sprite = scene.physics.add.staticImage(x, y, "coral_fan");
    this.sprite.setScale(scale);
    // Pedido explícito: todos los animales en la misma capa que Lumi.
    this.sprite.setDepth(5);
    this.sprite.refreshBody();
    // Hitbox ajustada al abanico real (no a las esquinas vacías del
    // lienzo) — medido sobre coral_fan.png (1024x1024, frac
    // [0.136,0.187,0.867,0.783]).
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(749 * scale, 610 * scale)
      .setOffset(139 * scale, 191 * scale);

    this.baseScale = scale;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  update(time: number) {
    const t = time / 1000;
    const breathe = 1 + Math.sin(t * BREATHE_SPEED + this.phase) * BREATHE_AMPLITUDE;

    if (time > this.nextLungeAllowedMs) {
      const lumi = this.getLumiPosition();
      const dx = lumi.x - this.sprite.x;
      const dy = lumi.y - this.sprite.y;
      if (Math.hypot(dx, dy) < LUNGE_TRIGGER_RANGE) {
        this.lungeStartMs = time;
        this.nextLungeAllowedMs = time + LUNGE_COOLDOWN_MS;
      }
    }

    const lungeElapsed = time - this.lungeStartMs;
    const lungeFactor =
      lungeElapsed >= 0 && lungeElapsed < LUNGE_DURATION_MS
        ? Math.sin((lungeElapsed / LUNGE_DURATION_MS) * Math.PI)
        : 0;

    const pulse = breathe + lungeFactor * LUNGE_AMOUNT;
    this.sprite.setScale(this.baseScale * pulse);

    const body = this.sprite.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(749 * this.baseScale * pulse, 610 * this.baseScale * pulse).setOffset(
      139 * this.baseScale * pulse,
      191 * this.baseScale * pulse,
    );
    body.reset(this.sprite.x, this.sprite.y);
  }
}
