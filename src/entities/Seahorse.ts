import Phaser from "phaser";
import { BlinkTimer } from "@/systems/BlinkTimer";

// Pedido explícito: "el caballito de mar que gire en círculos" — antes
// trazaba un "8" perezoso (dx/dy a frecuencias distintas); ahora es una
// órbita circular de verdad alrededor de su punto base, a velocidad
// constante. La rotación acompaña la dirección del giro (se inclina hacia
// el lado al que apunta el movimiento en cada instante), como si estuviera
// dando vueltas nadando.
const ORBIT_SPEED = 0.7; // rad/s
const ORBIT_RADIUS = 38;
const ROTATION_AMOUNT = 0.16;

/**
 * Noveno enemigo (pedido explícito: "GENÉRAME MUCHOS MÁS ANIMALES"). Flota
 * dando vueltas en círculo — un peligro más que esquivar, no un obstáculo
 * estático. Segunda pose real generada con Gemini (`seahorse_swim`, cola
 * estirada en pleno impulso en vez de enroscada) alterna con la base según
 * la fase del giro, sincronizada con el propio movimiento circular (pedido
 * explícito: "esté animado con Gemini", no solo parpadeo).
 */
export class Seahorse {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseX: number;
  private baseY: number;
  private baseScale: number;
  private phase: number;
  private readonly blinkTimer = new BlinkTimer();
  private isBlinking = false;
  private isSwimPose = false;

  constructor(scene: Phaser.Scene, x: number, y: number, scale: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "seahorse");
    this.sprite.setScale(scale);
    // Pedido explícito: todos los animales en la misma capa que Lumi.
    this.sprite.setDepth(5);
    this.sprite.refreshBody();
    // Hitbox ajustada al cuerpo real (no a las esquinas vacías del
    // lienzo) — medido sobre seahorse.png (1024x1024, frac
    // [0.263,0.046,0.736,0.953]). Multiplicado por `scale`: un StaticBody
    // no escala tamaño/offset con setScale(). Se queda fija aunque
    // alterne a la pose de nado (silueta distinta pero igual de "grande"
    // en el lienzo) — mismo criterio que el parpadeo, que tampoco
    // reajusta la hitbox por cambiar de textura.
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(484 * scale, 929 * scale)
      .setOffset(269 * scale, 47 * scale);

    this.baseX = x;
    this.baseY = y;
    this.baseScale = scale;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  /** Mismo motivo que Jellyfish.update(): un StaticBody no sigue sprite.x/y
   * asignado a mano, hay que reposicionar el body explícitamente con
   * reset() para que la hitbox no se desincronice de la deriva visual. */
  update(time: number) {
    const t = time / 1000;
    const angle = t * ORBIT_SPEED + this.phase;
    const x = this.baseX + Math.cos(angle) * ORBIT_RADIUS;
    const y = this.baseY + Math.sin(angle) * ORBIT_RADIUS;

    this.sprite.setScale(this.baseScale);
    this.sprite.rotation = Math.sin(angle) * ROTATION_AMOUNT;
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody).reset(x, y);

    // Parpadeo: arte de verdad (seahorse_blink.png), tiene prioridad
    // visual sobre la pose de nado mientras dura (igual criterio que el
    // resto de criaturas: el parpadeo nunca compite con otra animación).
    const blinking = this.blinkTimer.isBlinking(time);
    // Alterna pose base/nado dos veces por vuelta (cos(angle) cambia de
    // signo cada media vuelta) — sincronizado con el propio giro, no un
    // temporizador aparte, para que se lea como el impulso real de nadar
    // en círculos y no como un parpadeo de textura desconectado.
    const swimPose = Math.cos(angle) < 0;
    if (blinking !== this.isBlinking || swimPose !== this.isSwimPose) {
      this.isBlinking = blinking;
      this.isSwimPose = swimPose;
      this.sprite.setTexture(blinking ? "seahorse_blink" : swimPose ? "seahorse_swim" : "seahorse");
    }
  }
}
