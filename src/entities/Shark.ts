import Phaser from "phaser";
import { SHARK_PATROL_SPEED } from "@/config/GameConfig";
import { BlinkEyes } from "@/systems/BlinkEyes";

const BOB_AMPLITUDE = 14;
const BOB_SPEED = 0.5;
const TILT_AMOUNT = 0.09;
// "Coletazo": un pulso rápido de escala a lo largo del cuerpo, más rápido
// que el vaivén de arriba/abajo — es lo que hace que se lea como que está
// nadando activamente y no solo flotando de lado a lado.
const TAIL_PULSE_AMOUNT = 0.05;
const TAIL_PULSE_SPEED = 3.2;

/**
 * Segundo enemigo: un tiburón que patrulla de un lado a otro dentro de un
 * radio local alrededor de su punto de aparición (a diferencia de la
 * medusa, que solo deriva un poco). Usa cuerpo físico DINÁMICO (no
 * estático como la medusa/nenúfar): recorre demasiada distancia como para
 * que un cuerpo estático fijo en el punto de aparición siga sirviendo de
 * hitbox. El radio es local (no todo el ancho del mundo) para que el
 * vaivén se note claramente mientras Lumi lo tiene a la vista.
 */
export class Shark {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;
  private baseScaleX: number;
  private baseScaleY: number;
  private phase: number;
  private direction: 1 | -1;
  private readonly blinkEyes: BlinkEyes;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    scale: number,
    private minX: number,
    private maxX: number,
  ) {
    this.sprite = scene.physics.add.image(x, y, "shark");
    this.sprite.setScale(scale);
    this.sprite.setDepth(4.85);
    (this.sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    this.baseY = y;
    this.baseScaleX = scale;
    this.baseScaleY = scale;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    // El arte mira hacia la izquierda por defecto: moverse a la derecha
    // necesita flip.
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.sprite.setFlipX(this.direction === 1);
    this.sprite.setVelocityX(SHARK_PATROL_SPEED * this.direction);

    // Ojo único (dibujo de perfil), medido sobre shark.png (1191x697,
    // origen en el centro): centro en (290.7, 395.9).
    this.blinkEyes = new BlinkEyes(scene, this.sprite, [{ x: -304.8, y: 47.4, radius: 25 }], 4.86);
  }

  destroy() {
    this.blinkEyes.destroy();
  }

  update(time: number) {
    const t = time / 1000;

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

    this.sprite.y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
    this.sprite.rotation = Math.sin(t * BOB_SPEED + this.phase) * TILT_AMOUNT * this.direction;

    const pulse = Math.sin(t * TAIL_PULSE_SPEED + this.phase);
    this.sprite.setScale(
      this.baseScaleX * (1 + pulse * TAIL_PULSE_AMOUNT),
      this.baseScaleY * (1 - pulse * TAIL_PULSE_AMOUNT * 0.5),
    );
    this.blinkEyes.update(time);
  }
}
