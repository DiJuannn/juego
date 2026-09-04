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
    // Reafirmar el tamaño cada frame (barato): al construirse en create(),
    // scene.scale.width/height a veces aún no reflejaba el tamaño real del
    // contenedor (layout del navegador todavía sin asentar), dejando esta
    // franja más pequeña que la pantalla real — se veía como un
    // rectángulo del color de fondo del canvas asomando en una esquina.
    this.tile.setSize(camera.width, camera.height);
    this.tile.tilePositionX = camera.scrollX * this.factor;
    this.tile.tilePositionY = camera.scrollY * this.factor;
  }

  /** Al cambiar el tamaño del canvas (p.ej. rotar el móvil) hay que
   * redimensionar la franja para que siga cubriendo toda la pantalla. */
  resize(width: number, height: number) {
    this.tile.setSize(width, height);
  }
}
