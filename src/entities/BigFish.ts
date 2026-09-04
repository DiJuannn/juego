import Phaser from "phaser";
import { BIG_FISH_PATROL_SPEED } from "@/config/GameConfig";
import { BlinkTimer } from "@/systems/BlinkTimer";

const BOB_AMPLITUDE = 12;
const BOB_SPEED = 0.45;
const BOUNCE_DURATION_MS = 160;
const BOUNCE_SQUASH = 0.22;
// Al chocar, un pequeño retroceso en su propia velocidad de patrulla (se
// frena/retrocede un instante), para que el "bote" se sienta en los dos
// lados del choque, no solo en Lumi.
const BOUNCE_RECOIL_SPEED_MULT = 0.6;

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
  private readonly blinkTimer = new BlinkTimer();
  private isBlinking = false;
  private readonly baseScale: number;
  private bounceUntil = 0;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    scale: number,
    private minX: number,
    private maxX: number,
  ) {
    this.sprite = scene.physics.add.image(x, y, "fish_05");
    this.sprite.setScale(scale);
    this.baseScale = scale;
    // Permite a PondScene recuperar esta instancia a partir del sprite que
    // recibe el callback de overlap (que solo conoce el GameObject físico).
    this.sprite.setData("entity", this);
    // Pedido explícito: todos los animales en la misma capa que Lumi, para
    // que se lean claramente como obstáculos y no como decoración de fondo.
    this.sprite.setDepth(5);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    // Pedido explícito: hitbox ajustada al cuerpo real, no a las aletas —
    // medido sobre fish_05.png (323x230).
    body.setSize(154, 118).setOffset(84, 55);

    this.baseY = y;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    // El arte de los peces mira a la derecha por defecto (ver
    // BackgroundFishField): moverse a la izquierda necesita flip.
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.sprite.setFlipX(this.direction === -1);
    this.sprite.setVelocityX(BIG_FISH_PATROL_SPEED * this.direction);
  }

  /** Pedido explícito: el pez debería "botar" al empujar a Lumi, no
   * quedarse igual como si nada. Un squash/stretch rápido (mismo tipo de
   * animación que el nenúfar al usarse) más un frenazo/retroceso breve en
   * su propia velocidad de patrulla — el bote se nota en los dos lados del
   * choque. */
  bounce(time: number) {
    this.bounceUntil = time + BOUNCE_DURATION_MS;
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.baseScale * (1 - BOUNCE_SQUASH),
      scaleY: this.baseScale * (1 + BOUNCE_SQUASH),
      duration: BOUNCE_DURATION_MS * 0.4,
      yoyo: true,
      ease: "Sine.easeOut",
    });
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
    const recoiling = time < this.bounceUntil;
    this.sprite.setVelocityX(BIG_FISH_PATROL_SPEED * this.direction * (recoiling ? -BOUNCE_RECOIL_SPEED_MULT : 1));

    this.sprite.y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;

    // Parpadeo: arte de verdad (fish_05_blink.png, generado con Gemini a
    // partir de este mismo sprite), no un Graphics dibujado por código.
    const blinking = this.blinkTimer.isBlinking(time);
    if (blinking !== this.isBlinking) {
      this.isBlinking = blinking;
      this.sprite.setTexture(blinking ? "fish_05_blink" : "fish_05");
    }
  }
}
