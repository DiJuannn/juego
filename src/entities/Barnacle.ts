import Phaser from "phaser";

const BREATHE_AMPLITUDE = 0.04;
const BREATHE_SPEED = 1.0;
// A diferencia del coral trampa (un solo "lunge" suave), el balano hace un
// doble chasquido rápido y seco cuando Lumi se acerca de verdad — muchas
// bocas pequeñas cerrándose de golpe, no una sola que se estira. Rango de
// disparo más corto que el coral trampa (los balanos son mucho más
// pequeños y no "alcanzan" tan lejos).
const SNAP_TRIGGER_RANGE = 150;
const SNAP_PULSE_MS = 110;
const SNAP_GAP_MS = 90;
const SNAP_COOLDOWN_MS = 1100;
const SNAP_AMOUNT = 0.22;

/**
 * Décimo enemigo (pedido explícito: "crea más animales si"). Reutiliza el
 * arte ya aprobado de `barnacle` (antes solo una pieza decorativa de fondo
 * en ReefCluster) — mismo criterio que la almeja gigante y el coral
 * trampa: se lee como parte del arrecife hasta que Lumi se acerca de
 * verdad, momento en el que "chasquea" dos veces seguidas y tocarlo cuenta
 * como golpe letal — ver DeathReason "balano" en PondScene.ts.
 */
export class Barnacle {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseScale: number;
  private phase: number;
  private snapStartMs = -Infinity;
  private nextSnapAllowedMs = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    scale: number,
    private readonly getLumiPosition: () => { x: number; y: number },
  ) {
    this.sprite = scene.physics.add.staticImage(x, y, "barnacle");
    this.sprite.setScale(scale);
    // Pedido explícito: todos los animales en la misma capa que Lumi.
    this.sprite.setDepth(5);
    this.sprite.refreshBody();
    // Hitbox ajustada al cúmulo real (no a las esquinas vacías del
    // lienzo) — medido sobre barnacle.png (1024x1024, frac
    // [0.202,0.22,0.805,0.785]).
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(617 * scale, 579 * scale)
      .setOffset(207 * scale, 225 * scale);

    this.baseScale = scale;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  update(time: number) {
    const t = time / 1000;
    const breathe = 1 + Math.sin(t * BREATHE_SPEED + this.phase) * BREATHE_AMPLITUDE;

    if (time > this.nextSnapAllowedMs) {
      const lumi = this.getLumiPosition();
      const dx = lumi.x - this.sprite.x;
      const dy = lumi.y - this.sprite.y;
      if (Math.hypot(dx, dy) < SNAP_TRIGGER_RANGE) {
        this.snapStartMs = time;
        this.nextSnapAllowedMs = time + SNAP_COOLDOWN_MS;
      }
    }

    const snapElapsed = time - this.snapStartMs;
    let snapFactor = 0;
    if (snapElapsed >= 0 && snapElapsed < SNAP_PULSE_MS) {
      snapFactor = Math.sin((snapElapsed / SNAP_PULSE_MS) * Math.PI);
    } else if (
      snapElapsed >= SNAP_PULSE_MS + SNAP_GAP_MS &&
      snapElapsed < SNAP_PULSE_MS * 2 + SNAP_GAP_MS
    ) {
      const p = (snapElapsed - SNAP_PULSE_MS - SNAP_GAP_MS) / SNAP_PULSE_MS;
      snapFactor = Math.sin(p * Math.PI);
    }

    const pulse = breathe + snapFactor * SNAP_AMOUNT;
    this.sprite.setScale(this.baseScale * pulse);

    const body = this.sprite.body as Phaser.Physics.Arcade.StaticBody;
    body
      .setSize(617 * this.baseScale * pulse, 579 * this.baseScale * pulse)
      .setOffset(207 * this.baseScale * pulse, 225 * this.baseScale * pulse);
    body.reset(this.sprite.x, this.sprite.y);
  }
}
