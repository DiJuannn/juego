import Phaser from "phaser";

/**
 * Peces de fondo puramente decorativos, muy detrás de Lumi (parallax lento,
 * escala pequeña). El arte (16 peces) lo subió el usuario ya recortado con
 * matting ML; aquí solo se anima su nado (movimiento + balanceo), que es
 * lógica de juego, no arte nuevo.
 */
// fish_14 y fish_16 se descartaron: su aleta dorsal queda cortada en seco
// (el dibujo original se sale del recuadro de su celda en la hoja de
// referencia), no es un artefacto de recorte que se pueda arreglar sin
// inventar el trozo que falta.
const EXCLUDED_FISH = new Set([14, 16]);
export const FISH_KEYS = Array.from({ length: 16 }, (_, i) => i + 1)
  .filter((n) => !EXCLUDED_FISH.has(n))
  .map((n) => `fish_${String(n).padStart(2, "0")}`);

interface FishState {
  sprite: Phaser.GameObjects.Image;
  speed: number;
  direction: 1 | -1;
  baseY: number;
  bobPhase: number;
  bobSpeed: number;
  bobAmplitude: number;
  wagPhase: number;
  wagSpeed: number;
}

export class BackgroundFishField {
  private fish: FishState[] = [];
  private worldWidth: number;
  private scrollFactor: number;

  constructor(
    scene: Phaser.Scene,
    worldWidth: number,
    initialViewHeight: number,
    depth: number,
    scrollFactor: number,
    count = 10,
  ) {
    this.worldWidth = worldWidth;
    this.scrollFactor = scrollFactor;

    for (let i = 0; i < count; i++) {
      const key = Phaser.Utils.Array.GetRandom(FISH_KEYS);
      const direction: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      const x = Phaser.Math.Between(0, worldWidth);
      const baseY = Phaser.Math.Between(initialViewHeight * 0.15, initialViewHeight * 0.85);
      const scale = Phaser.Math.FloatBetween(0.12, 0.22);

      const sprite = scene.add
        .image(x, baseY, key)
        .setScale(scale)
        .setScrollFactor(scrollFactor)
        .setDepth(depth)
        .setAlpha(0.8)
        .setTint(0xcfe6ff);
      // El arte original mira a la derecha; si nada a la izquierda se voltea.
      sprite.setFlipX(direction === -1);

      this.fish.push({
        sprite,
        speed: Phaser.Math.FloatBetween(12, 28),
        direction,
        baseY,
        bobPhase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        bobSpeed: Phaser.Math.FloatBetween(0.6, 1.1),
        bobAmplitude: Phaser.Math.FloatBetween(6, 14),
        wagPhase: Phaser.Math.FloatBetween(0, Math.PI * 2),
        wagSpeed: Phaser.Math.FloatBetween(2.5, 4),
      });
    }
  }

  update(time: number, delta: number, cameraScrollY: number, viewHeight: number) {
    const margin = 150;
    for (const f of this.fish) {
      f.sprite.x += f.speed * f.direction * (delta / 1000);

      if (f.direction === 1 && f.sprite.x > this.worldWidth + margin) {
        f.sprite.x = -margin;
      } else if (f.direction === -1 && f.sprite.x < -margin) {
        f.sprite.x = this.worldWidth + margin;
      }

      // La cámara solo sube y esta capa tiene scrollFactor < 1, así que con
      // el tiempo se queda "atrás" y cae por debajo de la pantalla. Cuando
      // eso pasa, se recoloca justo por encima de la vista actual — igual
      // que reciclar una capa de parallax infinita.
      const screenY = f.baseY - cameraScrollY * this.scrollFactor;
      if (screenY > viewHeight + margin) {
        f.baseY = cameraScrollY * this.scrollFactor - Phaser.Math.Between(20, 200);
        f.sprite.x = Phaser.Math.Between(0, this.worldWidth);
      }

      f.sprite.y = f.baseY + Math.sin(time / 1000 * f.bobSpeed + f.bobPhase) * f.bobAmplitude;

      // Balanceo leve del cuerpo (rotación) para dar sensación de nado sin
      // necesitar frames nuevos: solo transforma la imagen existente.
      f.sprite.rotation = Math.sin(time / 1000 * f.wagSpeed + f.wagPhase) * 0.09;
    }
  }

  destroy() {
    for (const f of this.fish) f.sprite.destroy();
    this.fish = [];
  }
}
