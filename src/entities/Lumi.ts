import Phaser from "phaser";
import { LUMI_DRIFT_SPEED, LUMI_SCALE, LUMI_SWIM_SPEED } from "@/config/GameConfig";
import { frameKey } from "@/config/LumiAnimConfig";
import type { DirectionVector } from "@/systems/InputController";

type LumiState =
  | "idle"
  | "swim_up"
  | "swim_down"
  | "swim_left"
  | "swim_right"
  | "swim_up_right"
  | "swim_up_left"
  | "swim_down_right"
  | "swim_down_left";

const BOOST_DURATION_MS = 550;
const BOOST_SPEED = LUMI_SWIM_SPEED * 2.2;

/**
 * Envuelve el sprite físico de Lumi y decide qué animación reproducir
 * según el input. swim_down y swim_left no tienen asset propio: se
 * reproducen como swim_up/swim_right con flip (decisión explícita del
 * proyecto). Las 4 diagonales usan su propia pose ("swim_diagonal",
 * orientada hacia arriba-derecha) combinando flips para cubrir las otras 3.
 */
export class Lumi {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private state: LumiState = "idle";
  private boostRemainingMs = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, frameKey("idle", 1));
    this.sprite.setScale(LUMI_SCALE);
    this.sprite.setCollideWorldBounds(true);
    // Por defecto el cuerpo físico ocupa el lienzo entero del frame (mucho
    // más grande que la silueta real de Lumi, que varía de pose a pose
    // pero siempre deja bastante margen vacío alrededor). Eso hacía que un
    // nenúfar se activara "desde lejos". Un cuerpo más ajustado al torso
    // (coordenadas en el espacio del frame sin escalar, 1047x1024) hace
    // que el contacto se sienta real.
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(360, 460);
    body.setOffset(343, 300);
    this.sprite.play("idle");
  }

  /** Impulso al tocar un nenúfar: un empujón hacia arriba, tipo "jump". */
  triggerBoost() {
    this.boostRemainingMs = BOOST_DURATION_MS;
  }

  update(direction: DirectionVector, deltaMs: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (this.boostRemainingMs > 0) {
      this.boostRemainingMs -= deltaMs;
      // El empuje vertical del propulsor manda, pero el jugador sigue
      // pudiendo dirigirse a los lados mientras dura — no es una pérdida
      // de control, es un impulso hacia arriba con dirección libre.
      body.setVelocity(direction.x * LUMI_SWIM_SPEED, -BOOST_SPEED);
      // La pose "boost" dedicada no convencía visualmente: el impulso
      // reutiliza la propia animación de nadar hacia arriba (más partículas
      // de por medio, ver PondScene), no un pose nuevo.
      this.setState("swim_up");
      return;
    }

    const moving = direction.x !== 0 || direction.y !== 0;

    if (!moving) {
      // Hundimiento suave: en un juego de escalada infinita, quedarse
      // quieta no puede ser gratis o no habría ninguna presión para seguir
      // subiendo.
      body.setVelocity(0, LUMI_DRIFT_SPEED);
      this.setState("idle");
      return;
    }

    const velocity = new Phaser.Math.Vector2(direction.x, direction.y).normalize().scale(LUMI_SWIM_SPEED);
    body.setVelocity(velocity.x, velocity.y);

    // Con teclado, una diagonal real (dos flechas a la vez) da x e y no
    // nulos simultáneamente: se anima con la pose diagonal. Si solo hay
    // una flecha pulsada, es un eje puro (arriba/abajo/izq/dcha).
    if (direction.x !== 0 && direction.y !== 0) {
      if (direction.y < 0) {
        this.setState(direction.x > 0 ? "swim_up_right" : "swim_up_left");
      } else {
        this.setState(direction.x > 0 ? "swim_down_right" : "swim_down_left");
      }
    } else if (direction.y !== 0) {
      this.setState(direction.y < 0 ? "swim_up" : "swim_down");
    } else {
      this.setState(direction.x < 0 ? "swim_left" : "swim_right");
    }
  }

  private setState(next: LumiState) {
    if (this.state === next) return;
    this.state = next;

    switch (next) {
      case "idle":
        this.sprite.setFlip(false, false);
        this.sprite.play("idle");
        break;
      // El arte de swim_right_01 mira hacia la izquierda por defecto, así
      // que es swim_right quien necesita el flip, no swim_left.
      case "swim_right":
        this.sprite.setFlipX(true);
        this.sprite.setFlipY(false);
        this.sprite.play("swim_right");
        break;
      case "swim_left":
        this.sprite.setFlip(false, false);
        this.sprite.play("swim_right");
        break;
      case "swim_up":
        this.sprite.setFlip(false, false);
        this.sprite.play("swim_up");
        break;
      case "swim_down":
        this.sprite.setFlipY(true);
        this.sprite.setFlipX(false);
        this.sprite.play("swim_up");
        break;
      // Las 4 diagonales combinan flips sobre "swim_diagonal" (pose propia
      // orientada arriba-derecha), igual que swim_down/swim_left combinan
      // flips sobre swim_up/swim_right.
      case "swim_up_right":
        this.sprite.setFlip(false, false);
        this.sprite.play("swim_diagonal");
        break;
      case "swim_up_left":
        this.sprite.setFlip(true, false);
        this.sprite.play("swim_diagonal");
        break;
      case "swim_down_right":
        this.sprite.setFlip(false, true);
        this.sprite.play("swim_diagonal");
        break;
      case "swim_down_left":
        this.sprite.setFlip(true, true);
        this.sprite.play("swim_diagonal");
        break;
    }
  }
}
