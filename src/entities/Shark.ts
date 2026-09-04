import Phaser from "phaser";
import {
  SHARK_CHASE_DURATION_MS,
  SHARK_CHASE_SPEED,
  SHARK_CHASE_TRIGGER_RANGE_X,
  SHARK_CHASE_TRIGGER_RANGE_Y,
  SHARK_PATROL_RANGE,
  SHARK_PATROL_SPEED,
} from "@/config/GameConfig";
import { BlinkTimer } from "@/systems/BlinkTimer";

const BOB_AMPLITUDE = 14;
const BOB_SPEED = 0.5;
const TILT_AMOUNT = 0.09;
// "Coletazo": un pulso rápido de escala a lo largo del cuerpo, más rápido
// que el vaivén de arriba/abajo — es lo que hace que se lea como que está
// nadando activamente y no solo flotando de lado a lado.
const TAIL_PULSE_AMOUNT = 0.05;
const TAIL_PULSE_SPEED = 3.2;
const WORLD_MARGIN_X = 80;

/**
 * Segundo enemigo: un tiburón que patrulla de un lado a otro dentro de un
 * radio local alrededor de su punto de aparición (a diferencia de la
 * medusa, que solo deriva un poco). Usa cuerpo físico DINÁMICO (no
 * estático como la medusa/nenúfar): recorre demasiada distancia como para
 * que un cuerpo estático fijo en el punto de aparición siga sirviendo de
 * hitbox. El radio es local (no todo el ancho del mundo) para que el
 * vaivén se note claramente mientras Lumi lo tiene a la vista.
 *
 * Progresión (pedido explícito): los tiburones marcados `canChase` (ver
 * SharkSpawner — solo los que aparecen ya cerca del final de la Zona 1)
 * pueden lanzarse UNA vez, si Lumi pasa cerca, en una persecución corta a
 * mayor velocidad antes de volver a su patrulla normal — nunca de forma
 * permanente.
 */
export class Shark {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;
  private baseScaleX: number;
  private baseScaleY: number;
  private phase: number;
  private direction: 1 | -1;
  private readonly blinkTimer = new BlinkTimer();
  private isBlinking = false;
  private hasChased = false;
  private chasingUntil = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    scale: number,
    private minX: number,
    private maxX: number,
    private readonly worldWidth: number,
    private readonly canChase: boolean,
    private readonly getLumiPosition: () => { x: number; y: number },
  ) {
    this.sprite = scene.physics.add.image(x, y, "shark");
    this.sprite.setScale(scale);
    // Pedido explícito: todos los animales en la misma capa que Lumi, para
    // que se lean claramente como obstáculos y no como decoración de fondo.
    this.sprite.setDepth(5);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    // Pedido explícito: hitbox ajustada al cuerpo real (no a las aletas ni
    // al hueco por encima/debajo) — medido sobre shark.png (1191x697), casi
    // centrado en x así que el flip al patrullar no lo desalinea.
    body.setSize(574, 359).setOffset(309, 168);

    this.baseY = y;
    this.baseScaleX = scale;
    this.baseScaleY = scale;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    // El arte mira hacia la izquierda por defecto: moverse a la derecha
    // necesita flip.
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.sprite.setFlipX(this.direction === 1);
    this.sprite.setVelocityX(SHARK_PATROL_SPEED * this.direction);
  }

  private maybeStartChase(time: number) {
    if (!this.canChase || this.hasChased) return;
    const lumi = this.getLumiPosition();
    const closeEnough =
      Math.abs(lumi.x - this.sprite.x) < SHARK_CHASE_TRIGGER_RANGE_X &&
      Math.abs(lumi.y - this.sprite.y) < SHARK_CHASE_TRIGGER_RANGE_Y;
    if (!closeEnough) return;
    this.hasChased = true;
    this.chasingUntil = time + SHARK_CHASE_DURATION_MS;
  }

  update(time: number) {
    const t = time / 1000;

    this.maybeStartChase(time);
    const chasing = time < this.chasingUntil;

    if (chasing) {
      const lumi = this.getLumiPosition();
      this.direction = lumi.x >= this.sprite.x ? 1 : -1;
      this.sprite.setFlipX(this.direction === 1);
      this.sprite.setVelocityX(SHARK_CHASE_SPEED * this.direction);
    } else {
      if (this.hasChased && this.chasingUntil !== 0) {
        // La persecución acaba de terminar: recentra el radio de patrulla
        // alrededor de donde quedó, recortado a los bordes del mundo, para
        // no dejarlo "colgado" fuera de su rango original de vaivén.
        this.minX = Math.max(WORLD_MARGIN_X, this.sprite.x - SHARK_PATROL_RANGE);
        this.maxX = Math.min(this.worldWidth - WORLD_MARGIN_X, this.sprite.x + SHARK_PATROL_RANGE);
        this.chasingUntil = 0;
      }

      if (this.sprite.x >= this.maxX && this.direction === 1) {
        this.direction = -1;
        this.sprite.setFlipX(false);
      } else if (this.sprite.x <= this.minX && this.direction === -1) {
        this.direction = 1;
        this.sprite.setFlipX(true);
      }
      // Reafirmar la velocidad TODOS los frames, no solo al girar: al añadir
      // el sprite al grupo físico de Phaser (ver SharkSpawner), el grupo
      // resetea la velocidad a 0 justo después de que el constructor la fija
      // — sin esto el tiburón se quedaba parado para siempre (nunca llegaba a
      // un borde para volver a fijarla).
      this.sprite.setVelocityX(SHARK_PATROL_SPEED * this.direction);
    }

    this.sprite.y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
    this.sprite.rotation = Math.sin(t * BOB_SPEED + this.phase) * TILT_AMOUNT * this.direction;

    const pulse = Math.sin(t * TAIL_PULSE_SPEED + this.phase);
    this.sprite.setScale(
      this.baseScaleX * (1 + pulse * TAIL_PULSE_AMOUNT),
      this.baseScaleY * (1 - pulse * TAIL_PULSE_AMOUNT * 0.5),
    );

    // Parpadeo: arte de verdad (shark_blink.png, generado con Gemini a
    // partir de este mismo sprite), no un Graphics dibujado por código.
    const blinking = this.blinkTimer.isBlinking(time);
    if (blinking !== this.isBlinking) {
      this.isBlinking = blinking;
      this.sprite.setTexture(blinking ? "shark_blink" : "shark");
    }
  }
}
