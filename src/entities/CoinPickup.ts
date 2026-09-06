import Phaser from "phaser";
import { COIN_SCALE } from "@/config/GameConfig";

const BOB_AMPLITUDE = 6;
const BOB_SPEED = 1.4;

/**
 * Moneda: recompensa + guía visual de ruta (ver CoinSpawner, que las coloca
 * en grupos, no sueltas). Mismo patrón que ShieldPickup: bob suave + un pop
 * al recogerla, cuerpo estático.
 */
export class CoinPickup {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.staticImage(x, y, "coin");
    this.sprite.setScale(COIN_SCALE);
    this.sprite.setDepth(4.2);
    this.sprite.refreshBody();

    this.baseY = y;
  }

  /** Solo balanceo vertical — pedido explícito: "que sean todas del mismo
   * tamaño". El "destello" de giro anterior escalaba solo el eje X para
   * simular un spin, pero eso hacía que dos monedas vistas en el mismo
   * instante (cada una con su propia fase aleatoria) se leyeran de
   * tamaño distinto. Todas quedan siempre a COIN_SCALE fijo.
   *
   * Pedido explícito, segunda vuelta: "tienen que estar separadas todas
   * la misma distancia... matemáticamente la misma". El balanceo SÍ tenía
   * una fase aleatoria por instancia — eso no cambia dónde SPAWNEAN (ya
   * eran matemáticamente exactas), pero hacía que en cualquier captura
   * congelada cada moneda estuviera en un punto distinto de su propio
   * vaivén, así que la distancia visible entre dos monedas vecinas
   * parecía variar de un instante a otro. Sin fase (todas comparten
   * exactamente el mismo `sin(t)`), se mueven en bloque: la distancia
   * entre cualquier par de monedas es constante en todo momento, no solo
   * en su posición base. */
  update(time: number) {
    const t = time / 1000;
    this.sprite.y = this.baseY + Math.sin(t * BOB_SPEED) * BOB_AMPLITUDE;
  }

  playPickupAndDestroy(scene: Phaser.Scene, onComplete: () => void) {
    scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.7,
      scaleY: this.sprite.scaleY * 1.7,
      alpha: 0,
      duration: 220,
      ease: "Back.easeOut",
      onComplete: () => {
        this.sprite.destroy();
        onComplete();
      },
    });
  }
}
