import Phaser from "phaser";
import { LilyPad } from "@/entities/LilyPad";
import { LILY_PAD_MAX_GAP, LILY_PAD_MIN_GAP } from "@/config/GameConfig";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
const PAD_MARGIN_X = 120;

/**
 * Genera nenúfares sin parar por encima de Lumi según la cámara sube (nunca
 * de golpe: solo cuando hace falta, mirando un poco por delante), y destruye
 * los que quedan muy por debajo de la vista para no acumular objetos para
 * siempre.
 */
export class LilyPadSpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private pads: LilyPad[] = [];
  private highestY: number;

  constructor(
    private scene: Phaser.Scene,
    private worldWidth: number,
    startX: number,
    startY: number,
  ) {
    this.group = scene.physics.add.staticGroup();
    this.highestY = startY;
    this.spawnAt(startX, startY);
  }

  private spawnAt(x: number, y: number) {
    const pad = new LilyPad(this.scene, x, y);
    this.group.add(pad.sprite);
    this.pads.push(pad);
    if (y < this.highestY) this.highestY = y;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(LILY_PAD_MIN_GAP, LILY_PAD_MAX_GAP);
      const x = Phaser.Math.Between(PAD_MARGIN_X, this.worldWidth - PAD_MARGIN_X);
      this.spawnAt(x, this.highestY);
    }

    this.pads = this.pads.filter((pad) => {
      if (pad.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(pad.sprite, true, true);
        return false;
      }
      pad.update(time);
      return true;
    });
  }

  /** Al usarlo, el nenúfar hace un pop y desaparece en vez de quedarse ahí
   * para siempre — se retira del grupo de físicas de inmediato para que no
   * pueda volver a disparar el boost mientras se anima. */
  consume(padSprite: Phaser.Physics.Arcade.Image) {
    const pad = this.pads.find((p) => p.sprite === padSprite);
    if (!pad) return;
    this.group.remove(pad.sprite, false, false);
    this.pads = this.pads.filter((p) => p !== pad);
    pad.playUseAnimationAndDestroy(this.scene, () => {});
  }
}
