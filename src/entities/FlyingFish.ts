import Phaser from "phaser";

// Duodécimo enemigo (segundo de la tanda "CREA MÁS ANIMALES MÁS MÁS...con
// animación de que muevan por el mapa tmb o que tengan dinámicas
// distintas"). Todos los animales anteriores se mueven de forma continua
// (patrulla, deriva, órbita, barrido). El pez volador es el primero con
// un ritmo genuinamente distinto: se queda quieto (reposando, con un
// ligero balanceo) durante un rato y luego, de golpe, hace un salto
// rápido en arco parabólico (sube y vuelve a bajar) hasta un nuevo punto
// antes de volver a reposar — imitando el salto real de un pez volador,
// no otro movimiento continuo más.
const REST_MIN_MS = 1700;
const REST_MAX_MS = 3200;
const LEAP_DURATION_MS = 700;
const LEAP_DISTANCE_MIN = 220;
const LEAP_DISTANCE_MAX = 420;
const LEAP_ARC_HEIGHT = 240;
const REST_BOB_AMPLITUDE = 6;
const REST_BOB_SPEED = 1.2;
const TILT_AMOUNT = 0.45;
const WORLD_MARGIN_X = 100;

export class FlyingFish {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private restX: number;
  private restY: number;
  private leapFromX = 0;
  private leapFromY = 0;
  private leapToX = 0;
  private leapToY = 0;
  private phaseStartMs: number | null = null;
  private phaseDurationMs: number;
  private isLeaping = false;
  private facingRight: boolean;
  private minX: number;
  private maxX: number;

  constructor(scene: Phaser.Scene, x: number, y: number, scale: number, worldWidth: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "flyingfish");
    this.sprite.setScale(scale);
    // Pedido explícito: todos los animales en la misma capa que Lumi.
    this.sprite.setDepth(5);
    this.sprite.refreshBody();
    // Hitbox casi a lienzo completo — las alas gigantes SON el cuerpo
    // real del animal (densidad de píxeles opacos alta en casi todo el
    // ancho), no un margen vacío: medido sobre flyingfish.png (1280x800).
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(1280 * scale, 610 * scale)
      .setOffset(0, 60 * scale);

    this.restX = x;
    this.restY = y;
    this.minX = WORLD_MARGIN_X;
    this.maxX = Math.max(this.minX, worldWidth - WORLD_MARGIN_X);
    this.facingRight = Math.random() < 0.5;
    this.phaseDurationMs = Phaser.Math.Between(REST_MIN_MS, REST_MAX_MS);
  }

  private startLeap(time: number) {
    const dir = Math.random() < 0.5 ? 1 : -1;
    const dist = Phaser.Math.Between(LEAP_DISTANCE_MIN, LEAP_DISTANCE_MAX);
    this.leapFromX = this.restX;
    this.leapFromY = this.restY;
    this.leapToX = Phaser.Math.Clamp(this.restX + dist * dir, this.minX, this.maxX);
    this.leapToY = this.restY;
    this.facingRight = this.leapToX >= this.leapFromX;
    this.isLeaping = true;
    this.phaseStartMs = time;
    this.phaseDurationMs = LEAP_DURATION_MS;
  }

  private startRest(time: number) {
    this.restX = this.leapToX;
    this.restY = this.leapToY;
    this.isLeaping = false;
    this.phaseStartMs = time;
    this.phaseDurationMs = Phaser.Math.Between(REST_MIN_MS, REST_MAX_MS);
  }

  update(time: number) {
    if (this.phaseStartMs === null) this.phaseStartMs = time;
    const elapsed = time - this.phaseStartMs;
    if (elapsed >= this.phaseDurationMs) {
      if (this.isLeaping) this.startRest(time);
      else this.startLeap(time);
    }

    let x: number;
    let y: number;
    let rotation: number;

    if (this.isLeaping) {
      const p = Phaser.Math.Clamp((time - (this.phaseStartMs ?? time)) / this.phaseDurationMs, 0, 1);
      x = Phaser.Math.Linear(this.leapFromX, this.leapToX, p);
      // Arco parabólico: sube y vuelve a bajar (seno de 0 a PI va 0→1→0).
      const arc = Math.sin(p * Math.PI) * LEAP_ARC_HEIGHT;
      y = Phaser.Math.Linear(this.leapFromY, this.leapToY, p) - arc;
      // Morro arriba al despegar, nivelado en el pico, morro abajo al
      // aterrizar — coseno de 0 a PI va 1→0→-1, justo esa curva.
      rotation = Math.cos(p * Math.PI) * TILT_AMOUNT * (this.facingRight ? -1 : 1);
    } else {
      const t = time / 1000;
      x = this.restX;
      y = this.restY + Math.sin(t * REST_BOB_SPEED) * REST_BOB_AMPLITUDE;
      rotation = 0;
    }

    // El arte mira hacia la izquierda por defecto (cabeza/ojo a la
    // izquierda, cola a la derecha).
    this.sprite.setFlipX(this.facingRight);
    this.sprite.rotation = rotation;
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody).reset(x, y);
  }
}
