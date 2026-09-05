import Phaser from "phaser";
import { CRAB_DASH_DURATION_MS, CRAB_DASH_SPEED, CRAB_PAUSE_MAX_MS, CRAB_PAUSE_MIN_MS } from "@/config/GameConfig";
import { BlinkTimer } from "@/systems/BlinkTimer";

const BOB_AMPLITUDE = 4;
const BOB_SPEED = 6;
// "Achuchón" al arrancar cada ráfaga: un squash/stretch rápido, para que se
// lea como un impulso de patitas en vez de un simple deslizarse.
const DASH_SQUASH = 0.12;
const WORLD_MARGIN_X = 80;

/**
 * Sexto enemigo (pedido explícito del usuario: "veas qué nuevos enemigos
 * hacer"). A diferencia del resto —la medusa deriva, el tiburón patrulla
 * liso, el calamar da impulsos sobre una deriva continua, el erizo no se
 * mueve— el cangrejo se desplaza a "trompicones": quieto una pausa breve,
 * luego una ráfaga corta y rápida (su "correteo" de lado), y vuelta a
 * quedarse quieto. Cuerpo físico dinámico, igual que tiburón/calamar.
 */
export class Crab {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;
  private phase: number;
  private direction: 1 | -1;
  private isDashing = false;
  private nextStateChangeAt = 0;
  private readonly blinkTimer = new BlinkTimer();
  private isBlinking = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    scale: number,
    private minX: number,
    private maxX: number,
  ) {
    this.sprite = scene.physics.add.image(x, y, "crab");
    this.sprite.setScale(scale);
    // Pedido explícito: todos los animales en la misma capa que Lumi, para
    // que se lean claramente como obstáculos y no como decoración de fondo.
    this.sprite.setDepth(5);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    // Hitbox ajustada al caparazón/cuerpo real, no a las pinzas ni patas
    // sueltas que sobresalen a los lados — medido sobre crab.png (864x1184).
    // NUNCA multiplicar por `scale` aquí: un body dinámico ya sincroniza
    // width/height/offset con el scale actual del sprite cada frame (ver
    // Shark.ts para el detalle) — pre-multiplicar deja el resultado al
    // cuadrado del scale desde el segundo frame en adelante.
    body.setSize(440, 290).setOffset(230, 390);

    this.baseY = y;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.direction = Math.random() < 0.5 ? 1 : -1;
    // El arte mira hacia la izquierda por defecto (la pinza grande queda a
    // la derecha del dibujo): moverse a la derecha necesita flip, igual
    // criterio que el resto de criaturas con arte no simétrico.
    this.sprite.setFlipX(this.direction === 1);
    this.nextStateChangeAt = Phaser.Math.Between(CRAB_PAUSE_MIN_MS, CRAB_PAUSE_MAX_MS);
  }

  update(time: number) {
    if (time >= this.nextStateChangeAt) {
      this.isDashing = !this.isDashing;
      if (this.isDashing) {
        this.nextStateChangeAt = time + CRAB_DASH_DURATION_MS;
        this.sprite.setVelocityX(CRAB_DASH_SPEED * this.direction);
        this.scene.tweens.killTweensOf(this.sprite);
        const baseScaleX = this.sprite.scaleX;
        const baseScaleY = this.sprite.scaleY;
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: baseScaleX * (1 + DASH_SQUASH),
          scaleY: baseScaleY * (1 - DASH_SQUASH),
          duration: CRAB_DASH_DURATION_MS * 0.4,
          yoyo: true,
          ease: "Sine.easeOut",
        });
      } else {
        this.nextStateChangeAt = time + Phaser.Math.Between(CRAB_PAUSE_MIN_MS, CRAB_PAUSE_MAX_MS);
        this.sprite.setVelocityX(0);
      }
    }

    if (this.sprite.x >= this.maxX && this.direction === 1) {
      this.direction = -1;
      this.sprite.setFlipX(false);
      if (this.isDashing) this.sprite.setVelocityX(CRAB_DASH_SPEED * this.direction);
    } else if (this.sprite.x <= this.minX && this.direction === -1) {
      this.direction = 1;
      this.sprite.setFlipX(true);
      if (this.isDashing) this.sprite.setVelocityX(CRAB_DASH_SPEED * this.direction);
    }

    // Igual que el resto de criaturas con body dinámico: reafirmar la
    // velocidad cada frame, el grupo físico la resetea a 0 al añadir el
    // sprite (ver CrabSpawner).
    if (this.isDashing) this.sprite.setVelocityX(CRAB_DASH_SPEED * this.direction);

    // Bamboleo pequeño: más marcado mientras corretea, casi quieto en la
    // pausa (se lee como que está "al acecho", no dormido).
    const bobAmount = this.isDashing ? BOB_AMPLITUDE : BOB_AMPLITUDE * 0.3;
    this.sprite.y = this.baseY + Math.sin((time / 1000) * BOB_SPEED + this.phase) * bobAmount;

    const blinking = this.blinkTimer.isBlinking(time);
    if (blinking !== this.isBlinking) {
      this.isBlinking = blinking;
      this.sprite.setTexture(blinking ? "crab_blink" : "crab");
    }
  }

  private get scene(): Phaser.Scene {
    return this.sprite.scene;
  }
}
