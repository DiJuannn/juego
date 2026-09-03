import Phaser from "phaser";
import { LUMI_SCALE, LUMI_SWIM_SPEED } from "@/config/GameConfig";
import { frameKey } from "@/config/LumiAnimConfig";
import type { DirectionVector } from "@/systems/InputController";

type LumiState = "idle" | "swim_up" | "swim_down" | "swim_left" | "swim_right";

/**
 * Envuelve el sprite físico de Lumi y decide qué animación reproducir
 * según el input. swim_down y swim_left no tienen asset propio: se
 * reproducen como swim_up/swim_right con flip (decisión explícita del
 * proyecto), nunca se genera un frame nuevo para ellas.
 */
export class Lumi {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private state: LumiState = "idle";

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, frameKey("idle", 1));
    this.sprite.setScale(LUMI_SCALE);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.play("idle");
  }

  update(direction: DirectionVector) {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const moving = direction.x !== 0 || direction.y !== 0;

    if (!moving) {
      body.setVelocity(0, 0);
      this.setState("idle");
      return;
    }

    const velocity = new Phaser.Math.Vector2(direction.x, direction.y).normalize().scale(LUMI_SWIM_SPEED);
    body.setVelocity(velocity.x, velocity.y);

    // Anima según el eje dominante del input (permite nadar en diagonal
    // mientras la animación muestra la dirección principal del movimiento).
    if (Math.abs(direction.y) > Math.abs(direction.x)) {
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
      case "swim_right":
        this.sprite.setFlip(false, false);
        this.sprite.play("swim_right");
        break;
      case "swim_left":
        this.sprite.setFlipX(true);
        this.sprite.setFlipY(false);
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
    }
  }
}
