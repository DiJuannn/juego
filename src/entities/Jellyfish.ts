import Phaser from "phaser";
import { BlinkTimer } from "@/systems/BlinkTimer";

// La campana "respira": se estrecha en horizontal justo cuando se estira en
// vertical (y viceversa), como el pulso real de nado de una medusa, en vez
// de un escalado uniforme que se siente más como un simple latido. Igual
// en los 4 tipos de movimiento — lo que cambia entre ellos es solo el
// desplazamiento (deriva), no el "aliento" de la campana.
const PULSE_AMOUNT = 0.09;
const PULSE_SPEED = 1.1;
// Balanceo de rotación leve: da sensación de ir a la deriva, no clavada en
// el sitio. Igual en los 4 tipos.
const ROTATION_AMOUNT = 0.05;
const ROTATION_SPEED = 0.4;

/**
 * 4 patrones de deriva distintos (pedido explícito: variedad de
 * movimiento, no todas las medusas iguales) — cada instancia elige uno al
 * azar en el constructor. El cuerpo físico (estático) se queda en su
 * posición nominal de spawn: el vaivén es puramente visual, igual que
 * antes (ver comentario en update()).
 */
type JellyfishMovementType = "deriva_calma" | "deriva_amplia" | "pulso_vertical" | "orbita_lenta";
const MOVEMENT_TYPES: JellyfishMovementType[] = ["deriva_calma", "deriva_amplia", "pulso_vertical", "orbita_lenta"];

/**
 * Primer enemigo: una medusa que flota con un vaivén suave — hay que
 * esquivarla, tocarla es game over.
 */
export class Jellyfish {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseX: number;
  private baseY: number;
  private baseScale: number;
  private phase: number;
  private readonly movementType: JellyfishMovementType;
  private readonly blinkTimer = new BlinkTimer();
  private isBlinking = false;

  constructor(scene: Phaser.Scene, x: number, y: number, scale: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "jellyfish");
    this.sprite.setScale(scale);
    // Pedido explícito: todos los animales en la misma capa que Lumi, para
    // que se lean claramente como obstáculos y no como decoración de fondo.
    this.sprite.setDepth(5);
    this.sprite.refreshBody();
    // Pedido explícito: la hitbox se sentía "cuadrada", con esquinas que
    // chocaban sin tocar el dibujo. Se ajusta al cuerpo/campana real (no a
    // las esquinas del lienzo, que incluyen tentáculos finos y huecos
    // vacíos) — medido sobre jellyfish.png (431x604).
    // Phaser NO escala el tamaño/offset del body con setScale() en un
    // StaticBody (confirmado con un probe en juego: se quedaba fijo en
    // los píxeles nativos aunque el sprite estuviera a escala ~0.16, una
    // hitbox 3 veces más grande que el dibujo — bug real que mataba desde
    // muy lejos). Hay que multiplicar por `scale` a mano.
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(209 * scale, 325 * scale)
      .setOffset(112 * scale, 140 * scale);

    this.baseX = x;
    this.baseY = y;
    this.baseScale = scale;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.movementType = Phaser.Utils.Array.GetRandom(MOVEMENT_TYPES);
  }

  /** Cada tipo mueve x/y con una fórmula distinta a partir del mismo reloj
   * (t + this.phase), para que el patrón se note claro de un vistazo. */
  private computeOffset(t: number): { dx: number; dy: number } {
    switch (this.movementType) {
      case "deriva_calma":
        // El original: vaivén suave, más horizontal que vertical.
        return {
          dx: Math.sin(t * 0.35 + this.phase) * 35,
          dy: Math.sin(t * 0.55 + this.phase) * 10,
        };
      case "deriva_amplia":
        // Recorrido lateral mucho más amplio y lento, como una patrulla de
        // lado a lado en vez de un simple balanceo en el sitio.
        return {
          dx: Math.sin(t * 0.2 + this.phase) * 95,
          dy: Math.sin(t * 0.4 + this.phase) * 8,
        };
      case "pulso_vertical":
        // Sube y baja marcado, casi sin desviarse de lado — se "respira"
        // verticalmente en vez de derivar.
        return {
          dx: Math.sin(t * 0.3 + this.phase) * 12,
          dy: Math.sin(t * 0.5 + this.phase) * 48,
        };
      case "orbita_lenta":
        // Único patrón realmente circular: x e y comparten fase (seno y
        // coseno), trazando una órbita perezosa en vez de un vaivén recto.
        return {
          dx: Math.cos(t * 0.28 + this.phase) * 42,
          dy: Math.sin(t * 0.28 + this.phase) * 24,
        };
    }
  }

  /** Movimiento puramente visual: el cuerpo físico se queda en su posición
   * nominal, el vaivén es pequeño y no afecta al overlap de forma notable. */
  update(time: number) {
    const t = time / 1000;
    const { dx, dy } = this.computeOffset(t);
    this.sprite.x = this.baseX + dx;
    this.sprite.y = this.baseY + dy;

    const pulse = Math.sin(t * PULSE_SPEED + this.phase);
    this.sprite.setScale(
      this.baseScale * (1 + pulse * PULSE_AMOUNT),
      this.baseScale * (1 - pulse * PULSE_AMOUNT * 0.6),
    );
    this.sprite.rotation = Math.sin(t * ROTATION_SPEED + this.phase) * ROTATION_AMOUNT;

    // Parpadeo: arte de verdad (jellyfish_blink.png, generado con Gemini a
    // partir de este mismo sprite), no un Graphics dibujado por código —
    // solo se cambia la textura durante la breve ventana que marca
    // BlinkTimer.
    const blinking = this.blinkTimer.isBlinking(time);
    if (blinking !== this.isBlinking) {
      this.isBlinking = blinking;
      this.sprite.setTexture(blinking ? "jellyfish_blink" : "jellyfish");
    }
  }
}
