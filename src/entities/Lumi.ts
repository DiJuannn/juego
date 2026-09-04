import Phaser from "phaser";
import { LUMI_DRIFT_SPEED, LUMI_SCALE, LUMI_SWIM_SPEED, SWIM_SIDE_SCALE_CORRECTION } from "@/config/GameConfig";
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
// Pedido explícito: que el nenúfar impulse más hacia arriba.
const BOOST_SPEED = LUMI_SWIM_SPEED * 2.9;
// El boost cortaba en seco de velocidad máxima a velocidad normal en el
// último frame — se notaba raro. Los últimos BOOST_EASE_MS bajan la
// velocidad a la mitad de forma gradual, así el salto que queda al
// terminar de verdad es mucho más pequeño.
const BOOST_EASE_MS = 150;

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
  private knockbackRemainingMs = 0;
  private knockbackVX = 0;
  private knockbackVY = 0;

  // La pose diagonal solo tiene 2 frames (swim_diagonal_01/02) y el salto
  // duro de Phaser.Animation entre ellos se notaba mucho ("muy brusco").
  // En vez de generar más frames intermedios con Gemini, se resuelve igual
  // que el balanceo de las algas: dos imágenes superpuestas que funden
  // lentamente de una a otra, en vez de saltar en seco. Normalmente
  // invisibles; solo se muestran (y se ocultan `sprite`) mientras el estado
  // es alguna de las 4 diagonales.
  private readonly diagonalA: Phaser.GameObjects.Image;
  private readonly diagonalB: Phaser.GameObjects.Image;
  private readonly diagonalFade = { t: 0 };
  private diagonalTween?: Phaser.Tweens.Tween;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, frameKey("idle", 1));
    this.sprite.setScale(LUMI_SCALE);
    this.sprite.setCollideWorldBounds(true);
    // Por defecto el cuerpo físico ocupa el lienzo entero del frame (mucho
    // más grande que la silueta real de Lumi, que varía de pose a pose
    // pero siempre deja bastante margen vacío alrededor). Eso hacía que un
    // nenúfar se activara "desde lejos". Un cuerpo más ajustado al torso
    // (coordenadas en el espacio del frame sin escalar, 1047x1024) hace
    // que el contacto se sienta real.
    // Pedido explícito: seguía sintiéndose que "chocan las cosas sin
    // tocarlas" — se encoge más todavía, y más pequeña que la silueta
    // visible del personaje a propósito (mejor errar por ese lado que por
    // el de "me tocó y no debería haber pasado nada").
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(240, 320);
    body.setOffset(403, 370);
    this.sprite.play("idle");

    this.diagonalA = scene.add.image(x, y, frameKey("swim_diagonal", 1)).setScale(LUMI_SCALE).setVisible(false);
    this.diagonalB = scene.add.image(x, y, frameKey("swim_diagonal", 2)).setScale(LUMI_SCALE).setVisible(false);
  }

  /** Mismo depth para el sprite físico y las dos imágenes de fundido
   * diagonal — deben quedar siempre en la misma capa. */
  setDepth(depth: number) {
    this.sprite.setDepth(depth);
    this.diagonalA.setDepth(depth);
    this.diagonalB.setDepth(depth);
  }

  /** Impulso al tocar un nenúfar: un empujón hacia arriba, tipo "jump". */
  triggerBoost() {
    this.boostRemainingMs = BOOST_DURATION_MS;
  }

  /** Empujón involuntario (p.ej. el pez grande): anula el control del
   * jugador por un instante corto, igual que el boost del nenúfar — si no,
   * `update()` resetearía la velocidad al vector de input (0 si no se está
   * nadando) en el frame siguiente y el empujón nunca se notaría. */
  applyKnockback(vx: number, vy: number, durationMs: number) {
    this.knockbackRemainingMs = durationMs;
    this.knockbackVX = vx;
    this.knockbackVY = vy;
  }

  update(direction: DirectionVector, deltaMs: number) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (this.knockbackRemainingMs > 0) {
      this.knockbackRemainingMs -= deltaMs;
      body.setVelocity(this.knockbackVX, this.knockbackVY);
      return;
    }

    if (this.boostRemainingMs > 0) {
      this.boostRemainingMs -= deltaMs;
      const easeFactor =
        this.boostRemainingMs < BOOST_EASE_MS ? Math.max(this.boostRemainingMs, 0) / BOOST_EASE_MS : 1;
      const boostSpeed = BOOST_SPEED * (0.5 + 0.5 * easeFactor);
      // El empuje vertical del propulsor manda, pero el jugador sigue
      // pudiendo dirigirse a los lados mientras dura — no es una pérdida
      // de control, es un impulso hacia arriba con dirección libre.
      body.setVelocity(direction.x * LUMI_SWIM_SPEED, -boostSpeed);
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

    // Las dos imágenes del fundido diagonal no tienen cuerpo físico: hay
    // que llevarlas a mano a donde esté el sprite real cada frame. Barato
    // hacerlo siempre, aunque ahora mismo estén ocultas.
    this.diagonalA.setPosition(this.sprite.x, this.sprite.y);
    this.diagonalB.setPosition(this.sprite.x, this.sprite.y);
  }

  private static isDiagonal(state: LumiState): boolean {
    return state === "swim_up_right" || state === "swim_up_left" || state === "swim_down_right" || state === "swim_down_left";
  }

  private static isSideSwim(state: LumiState): boolean {
    return state === "swim_right" || state === "swim_left";
  }

  /** Arranca (una sola vez) el fundido cruzado infinito entre las dos
   * imágenes diagonales. Se queda corriendo de fondo aunque no se vea. */
  private ensureDiagonalFade() {
    if (this.diagonalTween) return;
    this.diagonalTween = this.scene.tweens.add({
      targets: this.diagonalFade,
      t: 1,
      duration: 450,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        this.diagonalA.setAlpha(1 - this.diagonalFade.t);
        this.diagonalB.setAlpha(this.diagonalFade.t);
      },
    });
  }

  private setDiagonalFlip(flipX: boolean, flipY: boolean) {
    this.ensureDiagonalFade();
    this.sprite.setVisible(false);
    this.diagonalA.setVisible(true).setFlip(flipX, flipY);
    this.diagonalB.setVisible(true).setFlip(flipX, flipY);
  }

  private setState(next: LumiState) {
    if (this.state === next) return;
    const wasDiagonal = Lumi.isDiagonal(this.state);
    this.state = next;

    if (!Lumi.isDiagonal(next) && wasDiagonal) {
      this.sprite.setVisible(true);
      this.diagonalA.setVisible(false);
      this.diagonalB.setVisible(false);
    }

    // El arte de swim_right/swim_left está dibujado sensiblemente más
    // grande que el resto de poses dentro del mismo lienzo (ver
    // SWIM_SIDE_SCALE_CORRECTION) — se compensa aquí, no es una elección de
    // diseño sino corregir una inconsistencia real del asset.
    this.sprite.setScale(Lumi.isSideSwim(next) ? LUMI_SCALE * SWIM_SIDE_SCALE_CORRECTION : LUMI_SCALE);

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
      // Las 4 diagonales combinan flips sobre las dos imágenes de fundido
      // (pose "swim_diagonal" orientada arriba-derecha), igual que
      // swim_down/swim_left combinan flips sobre swim_up/swim_right. Ya no
      // usan Phaser.Animation: el salto duro entre los 2 únicos frames se
      // notaba demasiado, así que se funden lentamente (ver
      // ensureDiagonalFade) en vez de saltar en seco.
      case "swim_up_right":
        this.setDiagonalFlip(false, false);
        break;
      case "swim_up_left":
        this.setDiagonalFlip(true, false);
        break;
      case "swim_down_right":
        this.setDiagonalFlip(false, true);
        break;
      case "swim_down_left":
        this.setDiagonalFlip(true, true);
        break;
    }
  }
}
