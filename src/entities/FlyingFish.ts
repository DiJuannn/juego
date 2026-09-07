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
//
// Pedido explícito de una ronda posterior ("el pez volador es muy duro,
// habría que poner como una flecha por donde va a saltar y mejorar su
// animación, que esté más arriba"): el salto salía sin ningún aviso
// (dirección y distancia se decidían justo al empezar el salto), así que
// no había forma real de anticiparlo. Ahora la dirección/distancia del
// PRÓXIMO salto se sortean en cuanto empieza el reposo (rollNextLeap), no
// cuando el salto arranca — eso permite mostrar una flecha real que
// telegrafía hacia dónde va a saltar durante el tramo final del reposo,
// en vez de solo un aviso genérico. La reubicación "más arriba" (lejos del
// carril de nado habitual, más margen de reacción) la aplica el spawner
// (ver FLYING_FISH_REST_LIFT en FlyingFishSpawner.ts), no esta clase.
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

// Cuánto dura el aviso antes de saltar (fracción final del reposo) y su
// aspecto — pastel, contorno lavanda (nunca negro), mismo lenguaje visual
// que el resto del juego (ver STYLE_BIBLE.md), no un HUD ajeno al mundo.
const WARN_MS = 500;
const ARROW_FILL = 0xfff6d8;
const ARROW_STROKE = 0xb9a7e0;
const ARROW_OFFSET_Y = -70;
const ARROW_PULSE_SPEED = 6;
const ARROW_PULSE_AMOUNT = 0.18;

// Aleteo sutil durante el reposo (mejora de animación pedida junto al
// aviso) — oscilación de escala horizontal, como un pez respirando/
// aleteando las aletas pectorales, no una brazada completa.
const WING_FLUTTER_SPEED = 5;
const WING_FLUTTER_AMOUNT = 0.06;
// Estiramiento/achatamiento durante el salto: se alarga al despegar (fase
// inicial, subiendo) y se achata al aterrizar (fase final, bajando) — un
// squash&stretch simple que refuerza la sensación de impulso real.
const LEAP_STRETCH_AMOUNT = 0.12;

export class FlyingFish {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private readonly arrow: Phaser.GameObjects.Triangle;
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
  private readonly baseScaleX: number;
  private readonly baseScaleY: number;
  // Dirección/distancia YA decididas para el próximo salto — se sortean al
  // empezar cada reposo (ver rollNextLeap) para que la flecha de aviso
  // pueda mostrar el salto real, no una dirección aleatoria sin relación.
  private pendingDir = 1;
  private pendingDist = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, scale: number, worldWidth: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "flyingfish");
    this.sprite.setScale(scale);
    this.baseScaleX = scale;
    this.baseScaleY = scale;
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
    this.rollNextLeap();

    // Flecha de aviso: triángulo simple (nunca arte de personaje/criatura,
    // es una señal de juego, como el aura del escudo) apuntando hacia el
    // lado por el que va a saltar. Oculta hasta el tramo final del reposo.
    this.arrow = scene.add.triangle(x, y + ARROW_OFFSET_Y, -9, -12, -9, 12, 14, 0, ARROW_FILL);
    this.arrow.setStrokeStyle(3, ARROW_STROKE, 0.9);
    this.arrow.setDepth(6);
    this.arrow.setVisible(false);
  }

  private rollNextLeap() {
    this.pendingDir = Math.random() < 0.5 ? 1 : -1;
    this.pendingDist = Phaser.Math.Between(LEAP_DISTANCE_MIN, LEAP_DISTANCE_MAX);
  }

  private startLeap(time: number) {
    const dir = this.pendingDir;
    const dist = this.pendingDist;
    this.leapFromX = this.restX;
    this.leapFromY = this.restY;
    this.leapToX = Phaser.Math.Clamp(this.restX + dist * dir, this.minX, this.maxX);
    this.leapToY = this.restY;
    this.facingRight = this.leapToX >= this.leapFromX;
    this.isLeaping = true;
    this.phaseStartMs = time;
    this.phaseDurationMs = LEAP_DURATION_MS;
    this.arrow.setVisible(false);
  }

  private startRest(time: number) {
    this.restX = this.leapToX;
    this.restY = this.leapToY;
    this.isLeaping = false;
    this.phaseStartMs = time;
    this.phaseDurationMs = Phaser.Math.Between(REST_MIN_MS, REST_MAX_MS);
    // El PRÓXIMO salto se sortea ya aquí, no al arrancarlo — así la flecha
    // de aviso puede telegrafiarlo con tiempo real durante este reposo.
    this.rollNextLeap();
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
    let scaleX = this.baseScaleX;
    let scaleY = this.baseScaleY;

    if (this.isLeaping) {
      const p = Phaser.Math.Clamp((time - (this.phaseStartMs ?? time)) / this.phaseDurationMs, 0, 1);
      x = Phaser.Math.Linear(this.leapFromX, this.leapToX, p);
      // Arco parabólico: sube y vuelve a bajar (seno de 0 a PI va 0→1→0).
      const arc = Math.sin(p * Math.PI) * LEAP_ARC_HEIGHT;
      y = Phaser.Math.Linear(this.leapFromY, this.leapToY, p) - arc;
      // Morro arriba al despegar, nivelado en el pico, morro abajo al
      // aterrizar — coseno de 0 a PI va 1→0→-1, justo esa curva.
      rotation = Math.cos(p * Math.PI) * TILT_AMOUNT * (this.facingRight ? -1 : 1);
      // Squash & stretch: estirado (más alto, más fino) subiendo, achatado
      // (más ancho, más bajo) al aterrizar — mismo seno que el arco, con
      // signo invertido en la segunda mitad del salto.
      const stretch = Math.sin(p * Math.PI) * LEAP_STRETCH_AMOUNT * (p < 0.5 ? 1 : -1);
      scaleY = this.baseScaleY * (1 + stretch);
      scaleX = this.baseScaleX * (1 - stretch * 0.6);
    } else {
      const t = time / 1000;
      x = this.restX;
      y = this.restY + Math.sin(t * REST_BOB_SPEED) * REST_BOB_AMPLITUDE;
      rotation = 0;
      // Aleteo sutil (mejora de animación pedida): oscilación de escala
      // horizontal, un aleteo/respiración, no una brazada completa.
      scaleX = this.baseScaleX * (1 + Math.sin(t * WING_FLUTTER_SPEED) * WING_FLUTTER_AMOUNT);

      // Aviso de salto: visible solo en el tramo final del reposo, con
      // fundido de entrada y un pulso sutil de escala — apunta hacia el
      // lado por el que YA se decidió que va a saltar (ver rollNextLeap).
      const timeLeftInRest = this.phaseDurationMs - elapsed;
      if (timeLeftInRest <= WARN_MS) {
        const warnT = Phaser.Math.Clamp(1 - timeLeftInRest / WARN_MS, 0, 1);
        this.arrow.setVisible(true);
        this.arrow.setPosition(x, y + ARROW_OFFSET_Y);
        this.arrow.setRotation(this.pendingDir > 0 ? 0 : Math.PI);
        this.arrow.setAlpha(warnT);
        const pulse = 1 + Math.sin(t * ARROW_PULSE_SPEED) * ARROW_PULSE_AMOUNT * warnT;
        this.arrow.setScale(pulse);
      } else {
        this.arrow.setVisible(false);
      }
    }

    // El arte mira hacia la izquierda por defecto (cabeza/ojo a la
    // izquierda, cola a la derecha).
    this.sprite.setFlipX(this.facingRight);
    this.sprite.rotation = rotation;
    this.sprite.setScale(scaleX, scaleY);
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody).reset(x, y);
  }

  destroy() {
    this.arrow.destroy();
  }
}
