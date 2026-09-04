import Phaser from "phaser";

// Mismo criterio que el resto del HUD (Altura/zona): texto plano, sin arte
// nuevo — un corazón Unicode en el mismo tono lavanda/rosa de la paleta en
// vez de inventar un icono. Pedido explícito: discreto, no invasivo.
const HEART_GLYPH = "♥";
const HEART_FULL_COLOR = "#d97a9c";
const HEART_LOST_COLOR = "#d8cfe0";
const HEART_SIZE = "22px";
const HEART_GAP = 26;

/**
 * Sistema de vidas: 3 corazones discretos en el HUD (mismo estilo que
 * Altura/zona). Cada golpe peligroso resta una vida; al llegar a 0 el
 * juego termina de verdad (ver PondScene.takeDamage). Entre golpes hay una
 * breve invulnerabilidad para no perder las 3 de golpe por un único
 * solapamiento con el mismo peligro.
 */
export class LivesSystem {
  private lives: number;
  private readonly hearts: Phaser.GameObjects.Text[] = [];
  private invulnerableUntil = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly maxLives: number,
    depth: number,
  ) {
    this.lives = maxLives;
    for (let i = 0; i < maxLives; i++) {
      const heart = scene.add
        .text(x + i * HEART_GAP, y, HEART_GLYPH, {
          fontFamily: "system-ui, sans-serif",
          fontSize: HEART_SIZE,
          color: HEART_FULL_COLOR,
        })
        .setScrollFactor(0)
        .setDepth(depth);
      this.hearts.push(heart);
    }
  }

  get current() {
    return this.lives;
  }

  isInvulnerable(time: number): boolean {
    return time < this.invulnerableUntil;
  }

  grantInvulnerability(time: number, durationMs: number) {
    this.invulnerableUntil = time + durationMs;
  }

  /** Resta una vida y actualiza el HUD. Devuelve true si esa era la
   * última vida (muerte definitiva). */
  loseLife(): boolean {
    if (this.lives <= 0) return true;
    this.lives -= 1;
    this.hearts[this.lives].setColor(HEART_LOST_COLOR);
    return this.lives <= 0;
  }
}
