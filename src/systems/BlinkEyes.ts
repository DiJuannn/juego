import Phaser from "phaser";

const BLINK_DURATION_MS = 120;
const BLINK_MIN_INTERVAL_MS = 2200;
const BLINK_MAX_INTERVAL_MS = 5200;

// Mismo tono morado oscuro que los ojos de cada criatura (medido sobre los
// PNG reales: shark/squid/jellyfish/urchin/fish_05 rondan todos rgb
// ~105-115, 85-108, 127-150) — el "párpado" usa este color, no inventa uno
// nuevo.
const LID_COLOR = 0x6e5a82;

export interface EyeOffset {
  x: number;
  y: number;
  /** Radio del ojo en el PNG nativo (antes de escalar) — controla el ancho
   * del "párpado" dibujado encima. */
  radius: number;
}

type BlinkableSprite = Phaser.GameObjects.Components.Transform & {
  flipX?: boolean;
};

/**
 * Pestañeo ligero y periódico para una criatura: un Graphics aparte
 * (ninguna imagen nueva) que se queda invisible casi todo el tiempo y, cada
 * pocos segundos, dibuja un óvalo delgado del mismo color que el propio ojo
 * justo encima de él durante un instante muy breve — se lee como un
 * parpadeo sin tocar el asset. Sigue posición/rotación/escala/flip del
 * sprite cada frame en el que está activo, igual que los ojos en cruz de la
 * muerte de Lumi (ver PondScene.drawDeathEyes).
 */
export class BlinkEyes {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private nextBlinkAt: number;
  private blinkUntil = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly sprite: BlinkableSprite,
    private readonly eyes: EyeOffset[],
    depth: number,
  ) {
    this.graphics = scene.add.graphics().setDepth(depth);
    this.nextBlinkAt = Phaser.Math.Between(BLINK_MIN_INTERVAL_MS, BLINK_MAX_INTERVAL_MS);
  }

  update(time: number) {
    if (this.blinkUntil === 0 && time >= this.nextBlinkAt) {
      this.blinkUntil = time + BLINK_DURATION_MS;
    }

    if (this.blinkUntil !== 0 && time >= this.blinkUntil) {
      this.blinkUntil = 0;
      this.nextBlinkAt = time + Phaser.Math.Between(BLINK_MIN_INTERVAL_MS, BLINK_MAX_INTERVAL_MS);
      this.graphics.clear();
      return;
    }

    if (this.blinkUntil === 0) return;

    const g = this.graphics;
    g.clear();

    // Coordenadas en espacio del mundo calculadas a mano (rotación +
    // escala + flip), igual que los ojos en cruz de la muerte de Lumi —
    // nada de translateCanvas/scaleCanvas: combinados con el scroll de
    // cámara de un Graphics normal (scrollFactor 1) no daban la posición
    // correcta en pantalla.
    const rot = "rotation" in this.sprite ? (this.sprite.rotation as number) : 0;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const scaleX = this.sprite.scaleX * (this.sprite.flipX ? -1 : 1);
    const scaleY = this.sprite.scaleY;

    g.fillStyle(LID_COLOR, 1);
    for (const eye of this.eyes) {
      const cx = this.sprite.x + (eye.x * scaleX * cos - eye.y * scaleY * sin);
      const cy = this.sprite.y + (eye.x * scaleX * sin + eye.y * scaleY * cos);
      const hw = eye.radius * Math.abs(scaleX);
      const hh = eye.radius * 0.325 * Math.abs(scaleY);
      // Rectángulo delgado (el "párpado") rotado igual que el sprite.
      const corners: Array<[number, number]> = [
        [-hw, -hh],
        [hw, -hh],
        [hw, hh],
        [-hw, hh],
      ];
      const points = corners.map(
        ([px, py]) => new Phaser.Geom.Point(cx + px * cos - py * sin, cy + px * sin + py * cos),
      );
      g.fillPoints(points, true);
    }
  }

  destroy() {
    this.graphics.destroy();
  }
}
