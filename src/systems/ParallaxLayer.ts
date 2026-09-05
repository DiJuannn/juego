import Phaser from "phaser";

export interface ParallaxVariant {
  textureKey: string;
  /** Offset de mundo (positivo, restado a START_Y) donde esta variante
   * alcanza opacidad total — mismo criterio que el resto de offsets de
   * Zone1Level.ts/GameConfig.ts. Debe venir en orden ascendente. */
  startOffset: number;
}

/** Ancho de la banda de transición (en unidades de offset de mundo) durante
 * la cual dos variantes consecutivas se funden — mismo espíritu que
 * TRANSITION_HALF_WIDTH de ZoneConfig, pero en píxeles de mundo en vez de
 * unidades de Altura. */
const TRANSITION_WIDTH = 2000;

/**
 * Una capa de fondo fija a la cámara (scrollFactor 0) cuyo tilePosition se
 * desplaza manualmente según el scroll de la cámara multiplicado por un
 * factor (<1 = capa lejana, se mueve más despacio; >1 = capa cercana, se
 * mueve más rápido). Usar TileSprite en vez de una imagen estática evita
 * huecos en los bordes al mover la cámara por el mundo, sea cual sea el
 * factor — no requiere sobredimensionar el arte original.
 *
 * Soporta varias variantes de textura (`variants`) que se funden entre sí
 * (crossfade de alpha) según la altura alcanzada — pedido explícito del
 * usuario tras el rediseño del fondo: en vez de un único patrón repetido
 * para siempre, el agua "avanza" de una paleta a otra (más cálida cerca de
 * la salida, más profunda según se sube), dando sensación de progresión
 * real en vez de solo textura infinita.
 */
export class ParallaxLayer {
  private tiles: Phaser.GameObjects.TileSprite[];

  constructor(scene: Phaser.Scene, private variants: ParallaxVariant[], private factor: number, depth: number) {
    this.tiles = variants.map((v, i) =>
      scene.add
        .tileSprite(0, 0, scene.scale.width, scene.scale.height, v.textureKey)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(depth)
        .setAlpha(i === 0 ? 1 : 0),
    );
  }

  update(camera: Phaser.Cameras.Scene2D.Camera, startY: number) {
    // Reafirmar el tamaño cada frame (barato): al construirse en create(),
    // scene.scale.width/height a veces aún no reflejaba el tamaño real del
    // contenedor (layout del navegador todavía sin asentar), dejando esta
    // franja más pequeña que la pantalla real — se veía como un
    // rectángulo del color de fondo del canvas asomando en una esquina.
    const worldOffset = startY - camera.scrollY;

    // Cada variante se funde IN al acercarse a su propio startOffset (desde
    // startOffset-TRANSITION_WIDTH hasta startOffset) y se funde OUT al
    // acercarse al startOffset de la siguiente — así dos variantes vecinas
    // siempre suman ~1 de opacidad durante la transición, sin huecos ni
    // superposición doble.
    for (let i = 0; i < this.tiles.length; i++) {
      const tile = this.tiles[i];
      tile.setSize(camera.width, camera.height);
      tile.tilePositionX = camera.scrollX * this.factor;
      tile.tilePositionY = camera.scrollY * this.factor;

      let alpha = 1;
      if (i > 0) {
        const fadeInStart = this.variants[i].startOffset - TRANSITION_WIDTH;
        alpha *= Phaser.Math.Clamp((worldOffset - fadeInStart) / TRANSITION_WIDTH, 0, 1);
      }
      const next = this.variants[i + 1];
      if (next) {
        const fadeOutStart = next.startOffset - TRANSITION_WIDTH;
        alpha *= 1 - Phaser.Math.Clamp((worldOffset - fadeOutStart) / TRANSITION_WIDTH, 0, 1);
      }
      tile.setAlpha(alpha);
    }
  }

  /** Al cambiar el tamaño del canvas (p.ej. rotar el móvil) hay que
   * redimensionar la franja para que siga cubriendo toda la pantalla. */
  resize(width: number, height: number) {
    for (const tile of this.tiles) tile.setSize(width, height);
  }
}
