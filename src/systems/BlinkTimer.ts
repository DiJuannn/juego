import Phaser from "phaser";

const BLINK_DURATION_MS = 120;
const BLINK_MIN_INTERVAL_MS = 2200;
const BLINK_MAX_INTERVAL_MS = 5200;

/**
 * Reloj de parpadeo: decide CUÁNDO una criatura debe mostrar su textura de
 * "ojos cerrados" en vez de la normal. El parpadeo en sí es arte de verdad
 * generado con Gemini a partir del propio sprite (ver <criatura>_blink.png
 * y lumi-asset-gen) — esta clase no dibuja nada, solo lleva el temporizador
 * de cuándo tocar el cambio de textura (reemplaza al Graphics dibujado a
 * mano que había antes, que violaba la regla de "Claude no dibuja arte").
 */
export class BlinkTimer {
  private nextBlinkAt: number;
  private blinkUntil = 0;

  constructor() {
    this.nextBlinkAt = Phaser.Math.Between(BLINK_MIN_INTERVAL_MS, BLINK_MAX_INTERVAL_MS);
  }

  isBlinking(time: number): boolean {
    if (this.blinkUntil === 0 && time >= this.nextBlinkAt) {
      this.blinkUntil = time + BLINK_DURATION_MS;
    }
    if (this.blinkUntil !== 0 && time >= this.blinkUntil) {
      this.blinkUntil = 0;
      this.nextBlinkAt = time + Phaser.Math.Between(BLINK_MIN_INTERVAL_MS, BLINK_MAX_INTERVAL_MS);
      return false;
    }
    return this.blinkUntil !== 0;
  }
}
