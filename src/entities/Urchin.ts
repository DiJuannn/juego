import Phaser from "phaser";
import { BlinkTimer } from "@/systems/BlinkTimer";

const BOB_AMPLITUDE = 5;
const BOB_SPEED = 0.35;
// Pedido explícito: "el erizo que tenga animación tmb" — el bamboleo de
// BOB_AMPLITUDE era casi imperceptible a este tamaño. Añade un pulso de
// escala leve (las púas "respiran") con el mismo criterio que la medusa/
// los corales: nunca mover el dibujo sin mover la hitbox con él.
const BREATHE_AMPLITUDE = 0.06;
const BREATHE_SPEED = 1.1;

export type UrchinVariant = "default" | "long" | "round";

interface VariantDef {
  texture: string;
  /** Solo el tipo original tiene pose de parpadeo generada con Gemini —
   * los 2 tipos nuevos (pedido explícito: "haz más erizos de otros
   * tipos") reutilizan el mismo criterio que Barnacle/CoralTrap: no todos
   * los animales necesitan parpadeo para leerse bien. */
  blinkTexture?: string;
  hitbox: { w: number; h: number; ox: number; oy: number };
}

// Hitbox de cada tipo ajustada al cuerpo real de púas, no a las esquinas
// vacías del lienzo (mismo criterio que el erizo original) — medido sobre
// cada PNG. "long" tiene púas MUY largas y finas (mayoría del lienzo es
// hueco entre púas), así que su hitbox usa solo la región de densidad real
// del cuerpo+base de las púas, no el lienzo completo. "round" es casi
// todo cuerpo compacto de punta a punta, así que su hitbox sí ocupa casi
// todo el lienzo.
const VARIANTS: Record<UrchinVariant, VariantDef> = {
  default: {
    texture: "urchin",
    blinkTexture: "urchin_blink",
    hitbox: { w: 406, h: 355, ox: 220, oy: 162 },
  },
  long: {
    texture: "urchin_long",
    hitbox: { w: 666, h: 521, ox: 231, oy: 231 },
  },
  round: {
    texture: "urchin_round",
    hitbox: { w: 1045, h: 883, ox: 22, oy: 22 },
  },
};

/**
 * Cuarto enemigo: un erizo de mar. A diferencia de la medusa (deriva) o el
 * tiburón (patrulla), el erizo casi no se mueve — es un obstáculo
 * "plantado" que hay que esquivar, no una criatura que persigue. Cuerpo
 * estático, igual que la medusa.
 *
 * Pedido explícito del usuario tras probar un giro continuo añadido en
 * una ronda anterior: "los erizos déjalos como estaban, la gracia de
 * ellos es que siempre están quietos" — NO añadir rotación ni ningún otro
 * movimiento más allá del bamboleo/respiración de aquí abajo, aunque siga
 * pareciendo el animal "más pasivo" del juego. Es un rasgo, no un bug.
 *
 * Pedido explícito de una ronda posterior ("haz más erizos de otros
 * tipos"): 2 variantes visuales nuevas (`long`/`round`, ver VARIANTS)
 * pensadas sobre todo para colocarse en columna vertical (ver
 * UrchinSpawner/Zone1Level.ts) — que una columna de 3-4 erizos no se lea
 * como el mismo erizo repetido.
 */
export class Urchin {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;
  private baseScale: number;
  private phase: number;
  private readonly blinkTimer = new BlinkTimer();
  private isBlinking = false;
  private readonly variant: VariantDef;

  constructor(scene: Phaser.Scene, x: number, y: number, scale: number, variant: UrchinVariant = "default") {
    this.variant = VARIANTS[variant];
    this.sprite = scene.physics.add.staticImage(x, y, this.variant.texture);
    this.sprite.setScale(scale);
    // Pedido explícito: todos los animales en la misma capa que Lumi, para
    // que se lean claramente como obstáculos y no como decoración de fondo.
    this.sprite.setDepth(5);
    this.sprite.refreshBody();
    // Multiplicado por `scale`: un StaticBody no escala el tamaño/offset
    // automáticamente con setScale() (confirmado con un probe en juego —
    // la hitbox se quedaba ~2.7x más grande que el dibujo visible).
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(this.variant.hitbox.w * scale, this.variant.hitbox.h * scale)
      .setOffset(this.variant.hitbox.ox * scale, this.variant.hitbox.oy * scale);

    this.baseY = y;
    this.baseScale = scale;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  /** Mismo motivo que Jellyfish.update(): un StaticBody no sigue sprite.x/y
   * asignado a mano, hay que reposicionar el body explícitamente con
   * reset() aunque aquí el bamboleo sea pequeño. El pulso de escala
   * también reescala el body en la misma proporción (igual que el
   * "respirar" de ReefCluster) para que la hitbox nunca se desincronice
   * del dibujo. */
  update(time: number) {
    const t = time / 1000;
    const y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
    const pulse = 1 + Math.sin(t * BREATHE_SPEED + this.phase) * BREATHE_AMPLITUDE;
    this.sprite.setScale(this.baseScale * pulse);

    const body = this.sprite.body as Phaser.Physics.Arcade.StaticBody;
    body
      .setSize(this.variant.hitbox.w * this.baseScale * pulse, this.variant.hitbox.h * this.baseScale * pulse)
      .setOffset(this.variant.hitbox.ox * this.baseScale * pulse, this.variant.hitbox.oy * this.baseScale * pulse);
    body.reset(this.sprite.x, y);

    // Parpadeo: arte de verdad (urchin_blink.png, generado con Gemini a
    // partir de este mismo sprite), no un Graphics dibujado por código.
    // Solo el tipo original tiene pose de parpadeo generada.
    if (!this.variant.blinkTexture) return;
    const blinking = this.blinkTimer.isBlinking(time);
    if (blinking !== this.isBlinking) {
      this.isBlinking = blinking;
      this.sprite.setTexture(blinking ? this.variant.blinkTexture : this.variant.texture);
    }
  }
}
