import Phaser from "phaser";
import { altitudeFromWorldY, TRANSITION_HALF_WIDTH, ZONES, type ZoneDefinition } from "@/config/ZoneConfig";

/** Resultado de evaluar la zona actual: la zona "de base", la siguiente (si
 * estamos dentro de una banda de transición) y cuánto se ha avanzado hacia
 * ella (0 = todavía 100% zona actual, 1 = ya 100% zona siguiente). */
export interface ZoneBlend {
  current: ZoneDefinition;
  next: ZoneDefinition | null;
  /** 0-1: progreso dentro de la banda de transición hacia `next`. */
  t: number;
}

/**
 * Traduce la altura de Lumi a "en qué zona estamos, y cuánto nos hemos
 * mezclado con la siguiente" — la única pieza nueva de lógica de este
 * refactor. No dibuja nada por sí mismo: PondScene usa esto para pintar el
 * tinte de profundidad y, más adelante, para elegir de qué pool sacan los
 * spawners.
 */
export class ZoneManager {
  private tintRect: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, depth: number) {
    this.tintRect = scene.add
      .rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(depth);
  }

  resolve(worldY: number): ZoneBlend {
    const altitude = altitudeFromWorldY(worldY);

    // Recorre los límites entre zonas de más bajo a más alto. Es
    // importante NO decidir "zona actual" por un simple umbral de
    // altitudeStart: eso haría que, justo al cruzar un límite, la zona
    // "actual" saltara a la siguiente antes de que su propia mezcla
    // hubiera terminado, y el tinte pegaría un salto en vez de ser
    // continuo. En cambio, cada banda [límite-ancho, límite+ancho] mezcla
    // SIEMPRE desde la zona anterior a la posterior, y solo cuando t llega
    // a 1 (fin de banda) la zona "estable" pasa a ser la siguiente.
    for (let i = 0; i < ZONES.length - 1; i++) {
      const current = ZONES[i];
      const next = ZONES[i + 1];
      const bandStart = next.altitudeStart - TRANSITION_HALF_WIDTH;
      const bandEnd = next.altitudeStart + TRANSITION_HALF_WIDTH;

      if (altitude < bandStart) return { current, next: null, t: 0 };
      if (altitude <= bandEnd) {
        const t = (altitude - bandStart) / (bandEnd - bandStart);
        return { current, next, t };
      }
      // Esta banda ya quedó completamente atrás: la zona `next` pasa a ser
      // la base de comparación para el siguiente límite del bucle.
    }
    return { current: ZONES[ZONES.length - 1], next: null, t: 0 };
  }

  /** Actualiza el rectángulo de tinte de profundidad a pantalla completa
   * interpolando color+alpha entre la zona actual y la siguiente según el
   * progreso de la transición. */
  update(worldY: number, cam: Phaser.Cameras.Scene2D.Camera): ZoneBlend {
    // Reafirmar el tamaño cada frame (barato) en vez de fiarse solo del
    // evento RESIZE: al construirse en create(), scene.scale.width/height
    // a veces aún no reflejaba el tamaño real del contenedor (todavía sin
    // asentar el layout del navegador), dejando el rectángulo más pequeño
    // que la pantalla real — eso se veía como "un rectángulo de otro
    // color" en la esquina no cubierta durante las transiciones de zona.
    this.tintRect.setSize(cam.width, cam.height);

    const blend = this.resolve(worldY);
    const { current, next, t } = blend;

    const toColor = next ?? current;
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(current.tint.color),
      Phaser.Display.Color.ValueToColor(toColor.tint.color),
      100,
      Math.round(t * 100),
    );
    const alpha = Phaser.Math.Linear(current.tint.alpha, toColor.tint.alpha, t);

    this.tintRect.setFillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), alpha);
    return blend;
  }

  resize(width: number, height: number) {
    this.tintRect.setSize(width, height);
  }
}
