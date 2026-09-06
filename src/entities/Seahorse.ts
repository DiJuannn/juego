import Phaser from "phaser";
import { BlinkTimer } from "@/systems/BlinkTimer";

// Pedido explícito ("el caballito de mar que gire en círculos") + la
// aclaración posterior ("que se mueva en el mapa me refería tmb"): no
// basta con girar sobre su propio punto de aparición — tiene que
// recorrer de verdad el ancho del mundo, como una patrulla (mismo
// espíritu que Shark), pero en vez de un rebote recto de lado a lado, el
// CENTRO de su órbita circular es el que viaja en un barrido suave
// (seno, con aceleración/desaceleración natural en los extremos, no un
// rebote brusco) — el resultado se lee como un nado en bucles mientras
// atraviesa el mapa, no como un simple vaivén.
const PATROL_MARGIN = 90;
const PATROL_SPEED = 0.22; // rad/s — barrido completo (ida) en ~14s
const ORBIT_SPEED = 0.7; // rad/s
const ORBIT_RADIUS = 34;
const ROTATION_AMOUNT = 0.16;

/**
 * Noveno enemigo (pedido explícito: "GENÉRAME MUCHOS MÁS ANIMALES"). Ya no
 * se queda flotando cerca de su punto de aparición: patrulla de un lado a
 * otro del mapa mientras da vueltas en bucle, un peligro que hay que
 * rastrear en vez de un obstáculo fijo. Segunda pose real generada con
 * Gemini (`seahorse_swim`, cola estirada en pleno impulso) alterna con la
 * base según la fase del giro, sincronizada con el propio movimiento
 * circular (pedido explícito: "esté animado con Gemini", no solo
 * parpadeo).
 */
export class Seahorse {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;
  private baseScale: number;
  private phase: number;
  private patrolMinX: number;
  private patrolMaxX: number;
  private readonly blinkTimer = new BlinkTimer();
  private isBlinking = false;
  private isSwimPose = false;
  private facingRight = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    scale: number,
    worldWidth: number,
    // Pedido explícito de patrullar el mapa — pero un caballito colocado
    // como `animalHint` DENTRO del hueco seguro de un laberinto (ver
    // ReefTemplates.ts) tiene que quedarse ahí: si patrullara el mundo
    // entero se saldría del hueco casi al instante y el "esquívalo dentro
    // del pasillo" dejaría de tener sentido. Con `patrolRadius` se
    // confina a un vaivén corto alrededor de su punto de aparición en vez
    // del ancho completo del mundo.
    patrolRadius?: number,
  ) {
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

    // Patrulla centrada en el punto de aparición, recortada a los bordes
    // reales del mundo (mismo criterio que Shark.minX/maxX) — así un
    // caballito que aparece cerca de un lateral no intenta salirse del
    // mundo, solo cubre lo que le cabe desde ahí. Con `patrolRadius` (ver
    // arriba) el rango se confina alrededor de `x` en vez de usar el
    // mundo entero.
    if (patrolRadius !== undefined) {
      this.patrolMinX = Math.max(PATROL_MARGIN, x - patrolRadius);
      this.patrolMaxX = Math.min(worldWidth - PATROL_MARGIN, x + patrolRadius);
    } else {
      this.patrolMinX = PATROL_MARGIN;
      this.patrolMaxX = worldWidth - PATROL_MARGIN;
    }

    this.baseY = y;
    this.baseScale = scale;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  /** Mismo motivo que Jellyfish.update(): un StaticBody no sigue sprite.x/y
   * asignado a mano, hay que reposicionar el body explícitamente con
   * reset() para que la hitbox no se desincronice de la deriva visual. */
  update(time: number) {
    const t = time / 1000;

    // Barrido de ida y vuelta por todo el rango de patrulla — un seno
    // mapeado a [patrolMinX, patrolMaxX] en vez de un simple offset
    // alrededor de un punto, para que de verdad recorra el mapa.
    const patrolPhaseAngle = t * PATROL_SPEED + this.phase;
    const patrolT = (Math.sin(patrolPhaseAngle) + 1) / 2; // 0..1
    const centerX = this.patrolMinX + (this.patrolMaxX - this.patrolMinX) * patrolT;
    // Signo de la derivada del barrido: hacia dónde viaja el centro AHORA
    // MISMO, para decidir el flip — no la órbita pequeña (eso se vería
    // como un tembleque, cambia de signo demasiado rápido).
    this.facingRight = Math.cos(patrolPhaseAngle) >= 0;

    const orbitAngle = t * ORBIT_SPEED + this.phase;
    const x = centerX + Math.cos(orbitAngle) * ORBIT_RADIUS;
    const y = this.baseY + Math.sin(orbitAngle) * ORBIT_RADIUS;

    this.sprite.setScale(this.baseScale);
    this.sprite.setFlipX(!this.facingRight);
    this.sprite.rotation = Math.sin(orbitAngle) * ROTATION_AMOUNT;
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody).reset(x, y);

    // Parpadeo: arte de verdad (seahorse_blink.png), tiene prioridad
    // visual sobre la pose de nado mientras dura (igual criterio que el
    // resto de criaturas: el parpadeo nunca compite con otra animación).
    const blinking = this.blinkTimer.isBlinking(time);
    // Alterna pose base/nado dos veces por vuelta de la órbita pequeña —
    // sincronizado con el propio giro, no un temporizador aparte, para
    // que se lea como el impulso real de nadar en bucles.
    const swimPose = Math.cos(orbitAngle) < 0;
    if (blinking !== this.isBlinking || swimPose !== this.isSwimPose) {
      this.isBlinking = blinking;
      this.isSwimPose = swimPose;
      this.sprite.setTexture(blinking ? "seahorse_blink" : swimPose ? "seahorse_swim" : "seahorse");
    }
  }
}
