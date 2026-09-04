import Phaser from "phaser";
import { CoinPickup } from "@/entities/CoinPickup";
import { ReefCluster } from "@/entities/ReefCluster";
import { REEF_CLUSTER_MAX_GAP, REEF_CLUSTER_MIN_GAP, REEF_COIN_SPACING, START_Y } from "@/config/GameConfig";
import { isHazardAllowed } from "@/config/Zone1Segments";
import { REEF_TEMPLATES } from "@/systems/ReefTemplates";

const SPAWN_LOOKAHEAD = 900;
const DESPAWN_MARGIN = 1200;
// Igual que CoralSpawner: margen extra alrededor de la banda de cada
// cúmulo para que medusa/erizo nunca aparezcan encima de la ruta segura.
const BAND_SAFETY_MARGIN = 60;

/**
 * Prototipo de obstáculo orgánico de Zona 1 (sustituye a CoralSpawner en
 * PondScene — ver ReefCluster/ReefTemplates). Recicla 3 composiciones
 * diseñadas a mano, nunca la misma dos veces seguidas, y coloca las
 * monedas siguiendo la ruta curva de cada una en vez de en línea recta.
 */
export class ReefClusterSpawner {
  readonly group: Phaser.Physics.Arcade.StaticGroup;
  readonly coinGroup: Phaser.Physics.Arcade.StaticGroup;
  private clusters: ReefCluster[] = [];
  private coins: CoinPickup[] = [];
  private highestY: number;
  private lastTemplateIndex = -1;

  constructor(
    private scene: Phaser.Scene,
    private worldWidth: number,
    startY: number,
  ) {
    this.group = scene.physics.add.staticGroup();
    this.coinGroup = scene.physics.add.staticGroup();
    this.highestY = startY;
  }

  private pickTemplateIndex(): number {
    let index = Phaser.Math.Between(0, REEF_TEMPLATES.length - 1);
    if (REEF_TEMPLATES.length > 1) {
      while (index === this.lastTemplateIndex) {
        index = Phaser.Math.Between(0, REEF_TEMPLATES.length - 1);
      }
    }
    this.lastTemplateIndex = index;
    return index;
  }

  private spawnCoinsAlongPath(path: { x: number; y: number }[]) {
    if (path.length < 2) return;
    let carry = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i];
      const b = path[i + 1];
      const segLen = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      if (segLen === 0) continue;
      let dist = REEF_COIN_SPACING - carry;
      while (dist < segLen) {
        const t = dist / segLen;
        const x = Phaser.Math.Linear(a.x, b.x, t);
        const y = Phaser.Math.Linear(a.y, b.y, t);
        const pickup = new CoinPickup(this.scene, x, y);
        this.coinGroup.add(pickup.sprite);
        this.coins.push(pickup);
        dist += REEF_COIN_SPACING;
      }
      carry = dist - segLen;
    }
  }

  private spawnAt(y: number) {
    // Progresión de Zona 1 en tramos (ver Zone1Segments) — mismo umbral
    // que usaba el coral estrecho antes.
    if (!isHazardAllowed(START_Y - y)) return;
    const template = REEF_TEMPLATES[this.pickTemplateIndex()];
    const spec = template(this.worldWidth, y);
    const cluster = new ReefCluster(this.scene, spec);
    for (const sprite of cluster.obstacleSprites) this.group.add(sprite);
    this.clusters.push(cluster);
    this.spawnCoinsAlongPath(spec.path);
    if (cluster.yTop < this.highestY) this.highestY = cluster.yTop;
  }

  /** Consultado por JellyfishSpawner/UrchinSpawner, igual que antes
   * isWithinAnyCoralBand: si es true, esa altura cae dentro de la banda de
   * un cúmulo y no deben colocar un animal estático ahí. */
  isWithinAnyClusterBand(y: number): boolean {
    return this.clusters.some(
      (cluster) => y >= cluster.yTop - BAND_SAFETY_MARGIN && y <= cluster.yBottom + BAND_SAFETY_MARGIN,
    );
  }

  update(cameraTopY: number, cameraBottomY: number, time: number) {
    while (this.highestY > cameraTopY - SPAWN_LOOKAHEAD) {
      this.highestY -= Phaser.Math.Between(REEF_CLUSTER_MIN_GAP, REEF_CLUSTER_MAX_GAP);
      this.spawnAt(this.highestY);
    }

    this.clusters = this.clusters.filter((cluster) => {
      if (cluster.yTop > cameraBottomY + DESPAWN_MARGIN) {
        cluster.destroy();
        return false;
      }
      return true;
    });

    this.coins = this.coins.filter((pickup) => {
      if (pickup.sprite.y > cameraBottomY + DESPAWN_MARGIN) {
        this.coinGroup.remove(pickup.sprite, true, true);
        return false;
      }
      pickup.update(time);
      return true;
    });
  }

  consumeCoin(pickupSprite: Phaser.Physics.Arcade.Image) {
    const pickup = this.coins.find((p) => p.sprite === pickupSprite);
    if (!pickup) return;
    this.coinGroup.remove(pickup.sprite, false, false);
    this.coins = this.coins.filter((p) => p !== pickup);
    pickup.playPickupAndDestroy(this.scene, () => {});
  }
}
