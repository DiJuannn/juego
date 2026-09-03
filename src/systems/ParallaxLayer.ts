import Phaser from "phaser";

/**
 * Una capa de fondo fija a la cámara (scrollFactor 0) cuyo tilePosition se
 * desplaza manualmente según el scroll de la cámara multiplicado por un
 * factor (<1 = capa lejana, se mueve más despacio; >1 = capa cercana, se
 * mueve más rápido). Usar TileSprite en vez de una imagen estática evita
 * huecos en los bordes al mover la cámara por el mundo, sea cual sea el
 * factor — no requiere sobredimensionar el arte original.
 */
export class ParallaxLayer {
  private tile: Phaser.GameObjects.TileSprite;

  constructor(scene: Phaser.Scene, textureKey: string, private factor: number, depth: number) {
    this.tile = scene.add
      .tileSprite(0, 0, scene.scale.width, scene.scale.height, textureKey)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth);
  }

  update(camera: Phaser.Cameras.Scene2D.Camera) {
    this.tile.tilePositionX = camera.scrollX * this.factor;
    this.tile.tilePositionY = camera.scrollY * this.factor;
  }
}
