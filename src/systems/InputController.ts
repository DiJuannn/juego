import Phaser from "phaser";
import { DASH_DOUBLE_TAP_WINDOW_MS } from "@/config/GameConfig";

export interface DirectionVector {
  x: number;
  y: number;
}

// Tercer intento de control táctil esta sesión: dial de 8 flechas → cruceta
// fija de 4 botones → joystick flotante (los dos últimos, aunque distintos
// problemas cada uno, seguían sin convencer del todo) → esto: deslizar
// para FIJAR una dirección, que se mantiene sola sin necesidad de seguir
// tocando, hasta el próximo deslizamiento que la cambie. Pedido explícito:
// "si deslizo una vez hacia arriba va hacia arriba siempre hasta que
// cambie de movimiento". No hay ningún widget permanente en pantalla — se
// acabó el problema de raíz de las dos rondas anteriores (algo fijo que
// competía por hueco con Lumi/los enemigos), Lumi solo cambia de
// dirección cuando el jugador decide deslizar de nuevo.
function dir(x: number, y: number, angle: number) {
  return { x, y, angle };
}
// Los 8 ángulos posibles, mismo criterio que el dial original: el
// deslizamiento se "engancha" a la más cercana de estas 8 direcciones, no
// a un ángulo libre — así siempre coincide con una de las 8 poses reales
// de Lumi (4 ejes + 4 diagonales), nunca un ángulo raro a medias.
const DIRECTIONS = [
  dir(0, -1, -Math.PI / 2), // arriba
  dir(1, -1, -Math.PI / 4), // arriba-derecha
  dir(1, 0, 0), // derecha
  dir(1, 1, Math.PI / 4), // abajo-derecha
  dir(0, 1, Math.PI / 2), // abajo
  dir(-1, 1, (3 * Math.PI) / 4), // abajo-izquierda
  dir(-1, 0, Math.PI), // izquierda
  dir(-1, -1, (-3 * Math.PI) / 4), // arriba-izquierda
];

// Un movimiento del dedo más corto que esto es un toque, no un
// deslizamiento — no cambia la dirección fijada (evita que un roce
// accidental altere el rumbo).
const MIN_SWIPE_DISTANCE = 28;
// Confirmación visual breve (una flecha que aparece y se desvanece) donde
// se detectó el deslizamiento — pura realimentación, no un control fijo:
// desaparece sola, nunca compite por espacio en pantalla.
const FLASH_DURATION_MS = 380;
const FLASH_COLOR = 0xffc9e6;
const FLASH_RING_COLOR = 0xe8defc;

function angleDiff(a: number, b: number): number {
  let diff = Math.abs(a - b) % (Math.PI * 2);
  if (diff > Math.PI) diff = Math.PI * 2 - diff;
  return diff;
}

function snapToDirection(dx: number, dy: number): DirectionVector {
  const angle = Math.atan2(dy, dx);
  let closest = DIRECTIONS[0];
  let closestDelta = Infinity;
  for (const dir of DIRECTIONS) {
    const delta = angleDiff(angle, dir.angle);
    if (delta < closestDelta) {
      closestDelta = delta;
      closest = dir;
    }
  }
  return { x: closest.x, y: closest.y };
}

interface Flash {
  x: number;
  y: number;
  angle: number;
  startMs: number;
}

/**
 * Entrada combinada: teclado (flechas/WASD, para desarrollo en escritorio,
 * comportamiento clásico de "mantener pulsado") + deslizamiento táctil que
 * FIJA una dirección continua (control real para móvil).
 */
export class InputController {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys | null;
  private readonly wasd: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key> | null;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private lockedDirection: DirectionVector = { x: 0, y: 0 };
  private touchId: number | null = null;
  private touchStart: { x: number; y: number } | null = null;
  /** Una vez que ESTE toque ya fijó una dirección, se ignora el resto de
   * su arrastre — hace falta soltar y volver a tocar para el siguiente
   * deslizamiento, así un arrastre curvo no cambia de rumbo varias veces
   * seguidas dentro del mismo gesto. */
  private resolvedThisTouch = false;
  private flash: Flash | null = null;

  // Dash (pedido explícito: "si haces dos veces una misma dirección hace
  // un Dash hacia esa dirección"). Se detecta por separado de
  // lockedDirection/getVector: aquí solo se registra CUÁNDO empezó cada
  // pulsación/deslizamiento nuevo (el flanco de bajada, no que se
  // mantenga pulsado) — si la misma dirección vuelve a empezar dentro de
  // DASH_DOUBLE_TAP_WINDOW_MS, es un doble toque. `dashRequest` queda a la
  // espera de ser consumido una vez por PondScene (ver consumeDash()).
  private readonly lastCardinalPressAt: Record<"up" | "down" | "left" | "right", number> = {
    up: -Infinity,
    down: -Infinity,
    left: -Infinity,
    right: -Infinity,
  };
  private lastSwipeDirection: DirectionVector | null = null;
  private lastSwipeAt = -Infinity;
  private dashRequest: DirectionVector | null = null;

  constructor(private readonly scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    this.cursors = keyboard ? keyboard.createCursorKeys() : null;
    this.wasd = keyboard
      ? (keyboard.addKeys("W,A,S,D") as Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>)
      : null;

    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(90);

    scene.input.on("pointerdown", this.handlePointerDown, this);
    scene.input.on("pointermove", this.handlePointerMove, this);
    scene.input.on("pointerup", this.handlePointerUp, this);
    scene.input.on("pointerupoutside", this.handlePointerUp, this);

    if (keyboard) {
      keyboard.on("keydown-UP", () => this.handleCardinalPress("up", 0, -1));
      keyboard.on("keydown-W", () => this.handleCardinalPress("up", 0, -1));
      keyboard.on("keydown-DOWN", () => this.handleCardinalPress("down", 0, 1));
      keyboard.on("keydown-S", () => this.handleCardinalPress("down", 0, 1));
      keyboard.on("keydown-LEFT", () => this.handleCardinalPress("left", -1, 0));
      keyboard.on("keydown-A", () => this.handleCardinalPress("left", -1, 0));
      keyboard.on("keydown-RIGHT", () => this.handleCardinalPress("right", 1, 0));
      keyboard.on("keydown-D", () => this.handleCardinalPress("right", 1, 0));
    }

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private handleCardinalPress(key: "up" | "down" | "left" | "right", x: number, y: number) {
    const now = this.scene.time.now;
    if (now - this.lastCardinalPressAt[key] <= DASH_DOUBLE_TAP_WINDOW_MS) {
      this.dashRequest = { x, y };
      this.lastCardinalPressAt[key] = -Infinity;
    } else {
      this.lastCardinalPressAt[key] = now;
    }
  }

  /** Consume la petición de Dash pendiente (si hay alguna) — se llama una
   * vez por frame desde PondScene, igual que getVector(). */
  consumeDash(): DirectionVector | null {
    const request = this.dashRequest;
    this.dashRequest = null;
    return request;
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (this.touchId !== null) return;
    this.touchId = pointer.id;
    this.touchStart = { x: pointer.x, y: pointer.y };
    this.resolvedThisTouch = false;
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (this.touchId !== pointer.id || this.resolvedThisTouch || !this.touchStart) return;
    const dx = pointer.x - this.touchStart.x;
    const dy = pointer.y - this.touchStart.y;
    if (Math.sqrt(dx * dx + dy * dy) < MIN_SWIPE_DISTANCE) return;

    this.lockedDirection = snapToDirection(dx, dy);
    this.resolvedThisTouch = true;
    this.flash = { x: pointer.x, y: pointer.y, angle: Math.atan2(dy, dx), startMs: this.scene.time.now };

    // Mismo criterio de doble toque que el teclado, pero aquí la "misma
    // dirección" es cualquiera de las 8 (el deslizamiento ya viene
    // enganchado a una de ellas) — dos deslizamientos seguidos hacia el
    // mismo lado dentro de la ventana cuentan como Dash.
    const now = this.scene.time.now;
    const same = this.lastSwipeDirection?.x === this.lockedDirection.x && this.lastSwipeDirection?.y === this.lockedDirection.y;
    if (same && now - this.lastSwipeAt <= DASH_DOUBLE_TAP_WINDOW_MS) {
      this.dashRequest = { ...this.lockedDirection };
      this.lastSwipeDirection = null;
      this.lastSwipeAt = -Infinity;
    } else {
      this.lastSwipeDirection = { ...this.lockedDirection };
      this.lastSwipeAt = now;
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (this.touchId !== pointer.id) return;
    this.touchId = null;
    this.touchStart = null;
    this.resolvedThisTouch = false;
  }

  private drawFlash() {
    this.graphics.clear();
    if (!this.flash) return;
    const age = this.scene.time.now - this.flash.startMs;
    if (age >= FLASH_DURATION_MS) {
      this.flash = null;
      return;
    }
    const t = age / FLASH_DURATION_MS;
    const alpha = 1 - t;
    const { x, y, angle } = this.flash;
    const tipR = 34 + t * 14;
    const baseR = 6;
    const halfWidth = 16 * (1 - t * 0.3);
    const tipX = x + Math.cos(angle) * tipR;
    const tipY = y + Math.sin(angle) * tipR;
    const baseCx = x + Math.cos(angle) * baseR;
    const baseCy = y + Math.sin(angle) * baseR;
    const perpX = Math.cos(angle + Math.PI / 2) * halfWidth;
    const perpY = Math.sin(angle + Math.PI / 2) * halfWidth;

    this.graphics.lineStyle(2, FLASH_RING_COLOR, alpha * 0.5);
    this.graphics.strokeTriangle(tipX, tipY, baseCx + perpX, baseCy + perpY, baseCx - perpX, baseCy - perpY);
    this.graphics.fillStyle(FLASH_COLOR, alpha * 0.75);
    this.graphics.fillTriangle(tipX, tipY, baseCx + perpX, baseCy + perpY, baseCx - perpX, baseCy - perpY);
  }

  getVector(): DirectionVector {
    let x = 0;
    let y = 0;
    if (this.cursors?.left.isDown || this.wasd?.A.isDown) x -= 1;
    if (this.cursors?.right.isDown || this.wasd?.D.isDown) x += 1;
    if (this.cursors?.up.isDown || this.wasd?.W.isDown) y -= 1;
    if (this.cursors?.down.isDown || this.wasd?.S.isDown) y += 1;

    this.drawFlash();

    // El teclado manda si se usa (solo pasa en pruebas de escritorio,
    // comportamiento clásico de "mantener pulsado"); si no hay tecla
    // pulsada, se usa la dirección fijada por el último deslizamiento.
    if (x !== 0 || y !== 0) return { x, y };
    return this.lockedDirection;
  }

  private destroy() {
    this.scene.input.off("pointerdown", this.handlePointerDown, this);
    this.scene.input.off("pointermove", this.handlePointerMove, this);
    this.scene.input.off("pointerup", this.handlePointerUp, this);
    this.scene.input.off("pointerupoutside", this.handlePointerUp, this);
    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      for (const key of ["UP", "W", "DOWN", "S", "LEFT", "A", "RIGHT", "D"]) {
        keyboard.off(`keydown-${key}`);
      }
    }
    this.graphics.destroy();
  }
}
