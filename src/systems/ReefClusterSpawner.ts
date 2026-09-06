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
// Pedido explícito del usuario, con captura real: un calamar apareció tan
// pegado al borde de un cúmulo que su sprite se leía fusionado con una
// pieza de coral ("estas cosas ahí flotando me parecen feas") — 60px era
// menos que la altura típica de un sprite de animal (~110-150px a esta
// escala), así que un spawn "seguro" por poco podía terminar solapando
// visualmente el borde del cúmulo de todos modos. Subido a 170px, más que
// esa altura típica, para que quede un hueco de agua limpia de verdad
// entre cualquier animal y el cúmulo más cercano.
const BAND_SAFETY_MARGIN = 170;

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
    // Pedido explícito: "que hayan erizos o caballitos de mar etc" dentro
    // de los laberintos — ReefClusterSpawner no conoce Urchin/Seahorse
    // (viven en sus propios spawners), así que PondScene le pasa cómo
    // colocarlos exactamente igual que ya hace con spawnExact() de cada
    // spawner real.
    private readonly spawnUrchin?: (y: number, x?: number) => void,
    private readonly spawnSeahorse?: (y: number, x?: number) => void,
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
    this.place(y, this.pickTemplateIndex());
  }

  /** Colocación exacta desde el nivel scripteado del Tramo 1 (ver
   * Zone1Level.ts) — plantilla elegida a mano, sin la comprobación de
   * descanso (solo aplica a la generación al azar de más arriba). */
  spawnExact(y: number, templateIndex: number) {
    this.lastTemplateIndex = templateIndex;
    this.place(y, templateIndex);
  }

  private place(y: number, templateIndex: number) {
    const template = REEF_TEMPLATES[templateIndex];
    const spec = template(this.worldWidth, y);
    const cluster = new ReefCluster(this.scene, spec, this.worldWidth);
    for (const sprite of cluster.obstacleSprites) this.group.add(sprite);
    this.clusters.push(cluster);
    this.spawnCoinsAlongPath(spec.path);
    for (const hint of spec.animalHints ?? []) {
      if (hint.type === "urchin") this.spawnUrchin?.(hint.y, hint.x);
      else this.spawnSeahorse?.(hint.y, hint.x);
    }
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
      cluster.update(time);
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
