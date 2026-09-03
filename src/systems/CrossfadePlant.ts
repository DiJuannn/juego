import Phaser from "phaser";

/**
 * Balanceo natural de las algas: en vez de saltar de un frame a otro de
 * golpe (Phaser.Animation cambia de textura en seco), esto funde
 * lentamente de una imagen a la siguiente — el cambio entre hojas con
 * posiciones distintas se nota mucho menos así.
 */
export class CrossfadePlant {
  private images: Phaser.GameObjects.Image[];
  private currentIndex = 0;

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    textureKeys: string[],
    origin: { x: number; y: number },
    scrollFactor: number,
    depth: number,
    private holdMs: number,
    private fadeMs: number,
  ) {
    this.images = textureKeys.map((key, i) =>
      scene.add
        .image(x, y, key)
        .setOrigin(origin.x, origin.y)
        .setScrollFactor(scrollFactor)
        .setDepth(depth)
        .setAlpha(i === 0 ? 1 : 0),
    );
    this.scheduleNext();
  }

  private scheduleNext() {
    this.scene.time.delayedCall(this.holdMs, () => {
      const next = (this.currentIndex + 1) % this.images.length;
      this.scene.tweens.add({
        targets: this.images[this.currentIndex],
        alpha: 0,
        duration: this.fadeMs,
        ease: "Sine.easeInOut",
      });
      this.scene.tweens.add({
        targets: this.images[next],
        alpha: 1,
        duration: this.fadeMs,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.currentIndex = next;
          this.scheduleNext();
        },
      });
    });
  }
}
