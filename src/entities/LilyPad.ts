import Phaser from "phaser";
import { LILY_PAD_SCALE } from "@/config/GameConfig";

/**
 * Nenúfar interactivo: un cuerpo estático que, al tocarlo Lumi, dispara un
 * impulso hacia arriba (ver Lumi.triggerBoost). El overlap se registra
 * desde PondScene, aquí solo se coloca el sprite. Va delante de todo lo
 * demás (incluida Lumi): es un objeto de juego (un propulsor), no
 * decoración de fondo.
 */
export class LilyPad {
  readonly sprite: Phaser.Physics.Arcade.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "lily_pad_01");
    this.sprite.setScale(LILY_PAD_SCALE);
    this.sprite.setDepth(7);
    // Los cuerpos estáticos no recalculan su hitbox solos al escalar.
    this.sprite.refreshBody();
  }
}
