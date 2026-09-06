import Phaser from "phaser";

// Undécimo enemigo (pedido explícito: "CREA MÁS ANIMALES MÁS MÁS...con
// animación de que muevan por el mapa tmb o que tengan dinámicas
// distintas"). A diferencia de cualquier otro animal existente hasta
// ahora — el tiburón solo patrulla en X con un leve bob en Y fijo; el
// caballito de mar gira en bucle mientras su centro barre en X — la
// mantarraya recorre el mapa en diagonal de VERDAD: su X y su Y son dos
// barridos seno independientes con periodos distintos (patrón tipo
// Lissajous), así que cruza la pantalla en ángulos que van cambiando con
// el tiempo en vez de seguir siempre la misma línea recta o el mismo
// rango vertical. Se inclina (banking) según hacia dónde se mueve en
// vertical, como si estuviera planeando de verdad, y aletea suavemente
// (pulso de escala) para no leerse como una traslación rígida.
const SWEEP_X_SPEED = 0.15; // rad/s
const SWEEP_Y_SPEED = 0.23; // rad/s — distinto a X a propósito: nunca repite el mismo trayecto
const VERTICAL_RANGE = 360; // px de amplitud vertical del barrido
const WORLD_MARGIN_X = 110;
const BANK_AMOUNT = 0.32;
const FLAP_AMOUNT = 0.05;
const FLAP_SPEED = 1.6;

export class MantaRay {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseScale: number;
  private phaseX: number;
  private phaseY: number;
  private minX: number;
  private maxX: number;
  private baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, scale: number, worldWidth: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "mantaray");
    this.sprite.setScale(scale);
    // Pedido explícito: todos los animales en la misma capa que Lumi.
    this.sprite.setDepth(5);
    this.sprite.refreshBody();
    // Hitbox ajustada al cuerpo principal romboidal, excluyendo la
    // cola-látigo muy fina (apenas ~20px de densidad real) — medido sobre
    // mantaray.png (1120x928, cuerpo denso en x∈[44,990], y∈[100,835]).
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(946 * scale, 735 * scale)
      .setOffset(44 * scale, 100 * scale);

    this.baseScale = scale;
    this.minX = WORLD_MARGIN_X;
    this.maxX = Math.max(this.minX, worldWidth - WORLD_MARGIN_X);
    this.baseY = y;
    this.phaseX = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.phaseY = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  update(time: number) {
    const t = time / 1000;

    const angleX = t * SWEEP_X_SPEED + this.phaseX;
    const angleY = t * SWEEP_Y_SPEED + this.phaseY;
    const x = this.minX + (this.maxX - this.minX) * ((Math.sin(angleX) + 1) / 2);
    const y = this.baseY + Math.sin(angleY) * VERTICAL_RANGE;

    // El arte mira hacia la izquierda por defecto (ojos/boca en el lado
    // izquierdo del dibujo) — flip cuando el barrido va hacia la derecha,
    // mismo criterio que Shark/Seahorse.
    const movingRight = Math.cos(angleX) >= 0;
    this.sprite.setFlipX(movingRight);
    // Inclinación según la componente vertical del movimiento (positiva =
    // subiendo, negativa = bajando) — se lee como un planeo real.
    this.sprite.rotation = Math.cos(angleY) * BANK_AMOUNT;

    const flap = 1 + Math.sin(t * FLAP_SPEED + this.phaseX) * FLAP_AMOUNT;
    this.sprite.setScale(this.baseScale * flap);

    const body = this.sprite.body as Phaser.Physics.Arcade.StaticBody;
    body
      .setSize(946 * this.baseScale * flap, 735 * this.baseScale * flap)
      .setOffset(44 * this.baseScale * flap, 100 * this.baseScale * flap);
    body.reset(x, y);
  }
}
