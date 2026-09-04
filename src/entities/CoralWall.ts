import Phaser from "phaser";
import { CORAL_CHUNK_SCALE, CORAL_GAP_WIDTH, CORAL_WALL_MARGIN_X } from "@/config/GameConfig";

type GapSide = "left" | "right";

// Ligero jitter vertical/de escala/rotación por trozo, para que la pared se
// lea como coral irregular de verdad y no como una fila de copias idénticas.
const CHUNK_Y_JITTER = 22;
const CHUNK_SCALE_JITTER = 0.18;
const CHUNK_ROTATION_JITTER = 0.12;
// Los trozos se solapan un poco entre sí (paso menor que su ancho) para que
// se lea como una pared continua, no como coral suelto espaciado.
const CHUNK_STEP_FACTOR = 0.62;

/**
 * Pared de coral: varios trozos del mismo arte (con jitter) colocados uno
 * junto a otro desde un borde del mundo hasta dejar un hueco de
 * CORAL_GAP_WIDTH en el lado contrario — ese hueco es el único carril por
 * el que Lumi puede pasar. Tocar cualquier trozo es game over (ver
 * PondScene.handleHazardHit, razón "coral").
 */
export class CoralWall {
  readonly sprites: Phaser.Physics.Arcade.Image[] = [];
  readonly safeLaneMinX: number;
  readonly safeLaneMaxX: number;
  readonly yTop: number;
  readonly yBottom: number;

  constructor(scene: Phaser.Scene, worldWidth: number, centerY: number, gapSide: GapSide) {
    const texture = scene.textures.get("coral").getSourceImage();
    const chunkWidth = texture.width * CORAL_CHUNK_SCALE;
    const chunkHeight = texture.height * CORAL_CHUNK_SCALE;

    if (gapSide === "left") {
      this.safeLaneMinX = CORAL_WALL_MARGIN_X;
      this.safeLaneMaxX = CORAL_WALL_MARGIN_X + CORAL_GAP_WIDTH;
    } else {
      this.safeLaneMaxX = worldWidth - CORAL_WALL_MARGIN_X;
      this.safeLaneMinX = this.safeLaneMaxX - CORAL_GAP_WIDTH;
    }

    const occupiedMinX = gapSide === "left" ? this.safeLaneMaxX : CORAL_WALL_MARGIN_X;
    const occupiedMaxX = gapSide === "left" ? worldWidth - CORAL_WALL_MARGIN_X : this.safeLaneMinX;

    let minChunkY = centerY;
    let maxChunkY = centerY;
    const step = chunkWidth * CHUNK_STEP_FACTOR;
    for (let x = occupiedMinX + chunkWidth / 2; x <= occupiedMaxX - chunkWidth / 2 + step * 0.5; x += step) {
      const clampedX = Math.min(x, occupiedMaxX - chunkWidth / 2);
      const y = centerY + Phaser.Math.FloatBetween(-CHUNK_Y_JITTER, CHUNK_Y_JITTER);
      const scale = CORAL_CHUNK_SCALE * Phaser.Math.FloatBetween(1 - CHUNK_SCALE_JITTER, 1 + CHUNK_SCALE_JITTER);
      const chunk = scene.physics.add.staticImage(clampedX, y, "coral");
      chunk.setScale(scale);
      chunk.setDepth(5);
      chunk.setRotation(Phaser.Math.FloatBetween(-CHUNK_ROTATION_JITTER, CHUNK_ROTATION_JITTER));
      if (Math.random() < 0.5) chunk.setFlipX(true);
      chunk.refreshBody();
      this.sprites.push(chunk);

      const halfH = (texture.height * scale) / 2;
      minChunkY = Math.min(minChunkY, y - halfH);
      maxChunkY = Math.max(maxChunkY, y + halfH);
    }

    this.yTop = minChunkY;
    this.yBottom = maxChunkY;
  }
}
