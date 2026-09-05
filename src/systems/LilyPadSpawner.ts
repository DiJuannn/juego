import Phaser from "phaser";
import { CoinPickup } from "@/entities/CoinPickup";
import { LilyPad } from "@/entities/LilyPad";
import {
  LILY_PAD_BOOST_DISTANCE,
  LILY_PAD_MAX_GAP,
  LILY_PAD_MIN_GAP,
  REEF_COIN_SPACING,
} from "@/config/GameConfig";

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
  readonly coinGroup: Phaser.Physics.Arcade.StaticGroup;
  private pads: LilyPad[] = [];
  private coins: CoinPickup[] = [];
  private highestY: number;

  constructor(
    private scene: Phaser.Scene,
    private worldWidth: number,
    startX: number,
    startY: number,
  ) {
    this.group = scene.physics.add.staticGroup();
    this.coinGroup = scene.physics.add.staticGroup();
    this.highestY = startY;
    this.spawnAt(startX, startY);
  }

  /** Colocación exacta desde el nivel scripteado (ver Zone1Level.ts) —
   * por ejemplo, el nenúfar que marca el hueco pequeño de un combo de
   * erizos en línea. Mismo criterio de nombre que el resto de spawners. */
  spawnExact(y: number, x: number) {
    this.spawnAt(x, y);
  }

  private spawnAt(x: number, y: number) {
    const pad = new LilyPad(this.scene, x, y);
    this.group.add(pad.sprite);
    this.pads.push(pad);
    if (y < this.highestY) this.highestY = y;

    // Pedido explícito: "encima de cada nenúfar pondría monedas hasta
    // donde propulse" — un camino de monedas en la misma X, desde justo
    // encima del nenúfar hasta la distancia real que recorre su impulso
    // (ver LILY_PAD_BOOST_DISTANCE, calculada a partir de la velocidad/
    // duración reales del boost, no a ojo).
    for (let dy = REEF_COIN_SPACING; dy <= LILY_PAD_BOOST_DISTANCE; dy += REEF_COIN_SPACING) {
      const coin = new CoinPickup(this.scene, x, y - dy);
      this.coinGroup.add(coin.sprite);
      this.coins.push(coin);
    }
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

    this.coins = this.coins.filter((coin) => {
      if (coin.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.coinGroup.remove(coin.sprite, true, true);
        return false;
      }
      coin.update(time);
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

  consumeCoin(pickupSprite: Phaser.Physics.Arcade.Image) {
    const coin = this.coins.find((c) => c.sprite === pickupSprite);
    if (!coin) return;
    this.coinGroup.remove(coin.sprite, false, false);
    this.coins = this.coins.filter((c) => c !== coin);
    coin.playPickupAndDestroy(this.scene, () => {});
  }
}
