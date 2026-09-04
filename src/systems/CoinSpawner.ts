import Phaser from "phaser";
import { CoinPickup } from "@/entities/CoinPickup";
import {
  COIN_GROUP_ARC_SPREAD,
  COIN_GROUP_MAX_GAP,
  COIN_GROUP_MIN_GAP,
  COIN_GROUP_SIZE_MAX,
  COIN_GROUP_SIZE_MIN,
  COIN_GROUP_SPACING,
  COIN_RISKY_GROUP_CHANCE,
} from "@/config/GameConfig";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
// Margen del centro "seguro": la mayoría de los grupos se colocan cerca del
// centro del mundo (ruta cómoda), como haría un trazado de monedas guía.
const SAFE_CENTER_MARGIN = 220;
// Un grupo "arriesgado" ocasional se desplaza hacia un lado, como
// recompensa por desviarse de la ruta cómoda (pedido explícito: las
// monedas deben sugerir rutas, no aparecer al azar).
const RISKY_SIDE_MARGIN = 90;

/**
 * Monedas: mismo patrón de reciclado que ShieldPickupSpawner, pero cada
 * evento de spawn coloca un GRUPO (arco/línea de 3-5) en vez de una moneda
 * suelta — para que el trazado de monedas funcione como guía visual de
 * ruta (ver GameConfig.COIN_* y la revisión de Zona 1 pedida).
 */
export class CoinSpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  private pickups: CoinPickup[] = [];
  private highestY: number;

  constructor(
    private scene: Phaser.Scene,
    private worldWidth: number,
    startY: number,
  ) {
    this.group = scene.physics.add.staticGroup();
    this.highestY = startY;
  }

  private spawnGroupAt(centerY: number) {
    const risky = Math.random() < COIN_RISKY_GROUP_CHANCE;
    let centerX: number;
    if (risky) {
      const side = Math.random() < 0.5 ? -1 : 1;
      centerX =
        side === -1
          ? Phaser.Math.Between(RISKY_SIDE_MARGIN, RISKY_SIDE_MARGIN + 80)
          : Phaser.Math.Between(this.worldWidth - RISKY_SIDE_MARGIN - 80, this.worldWidth - RISKY_SIDE_MARGIN);
    } else {
      centerX = this.worldWidth / 2 + Phaser.Math.Between(-SAFE_CENTER_MARGIN, SAFE_CENTER_MARGIN);
    }

    const size = Phaser.Math.Between(COIN_GROUP_SIZE_MIN, COIN_GROUP_SIZE_MAX);
    // Arco suave: la moneda del medio se desplaza más hacia un lado, las de
    // los extremos menos — un trazado curvo en vez de una línea recta rígida.
    const arcDirection = Math.random() < 0.5 ? 1 : -1;
    const startIndexOffset = (size - 1) / 2;

    for (let i = 0; i < size; i++) {
      const y = centerY - i * COIN_GROUP_SPACING;
      const distFromMiddle = Math.abs(i - startIndexOffset) / startIndexOffset || 0;
      const arcOffset = arcDirection * COIN_GROUP_ARC_SPREAD * (1 - distFromMiddle);
      const x = Phaser.Math.Clamp(centerX + arcOffset, 60, this.worldWidth - 60);
      const pickup = new CoinPickup(this.scene, x, y);
      this.group.add(pickup.sprite);
      this.pickups.push(pickup);
    }

    const groupTopY = centerY - (size - 1) * COIN_GROUP_SPACING;
    if (groupTopY < this.highestY) this.highestY = groupTopY;
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(COIN_GROUP_MIN_GAP, COIN_GROUP_MAX_GAP);
      this.spawnGroupAt(this.highestY);
    }

    this.pickups = this.pickups.filter((pickup) => {
      if (pickup.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.group.remove(pickup.sprite, true, true);
        return false;
      }
      pickup.update(time);
      return true;
    });
  }

  consume(pickupSprite: Phaser.Physics.Arcade.Image) {
    const pickup = this.pickups.find((p) => p.sprite === pickupSprite);
    if (!pickup) return;
    this.group.remove(pickup.sprite, false, false);
    this.pickups = this.pickups.filter((p) => p !== pickup);
    pickup.playPickupAndDestroy(this.scene, () => {});
  }
}
