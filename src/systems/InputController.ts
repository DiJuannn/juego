import Phaser from "phaser";

export interface DirectionVector {
  x: number;
  y: number;
}

// Historial de esta ronda: joystick flotante (v1, sin pulir) → cruceta
// fija de 4 botones en el centro inferior (pedido explícito: "una cruceta
// FIJA... no el joystick flotante") → probada en un iPhone real, la
// cruceta fija quedaba solapada con Lumi/los enemigos en cualquier
// pantalla de móvil real (ver LUMI_SCREEN_ANCHOR_Y en GameConfig) y,
// aparte de eso, tampoco convencía como sensación de control — pedido
// explícito de nuevo: "ni el joystick ni la cruceta... cómo harías tú".
// Vuelta a un joystick flotante, esta vez pulido: aparece centrado justo
// donde cae el dedo (nunca en un punto fijo de la pantalla, así nunca
// puede volver a solaparse con Lumi de forma sistemática) y desaparece al
// soltar. Un solo dedo basta para cualquier dirección — a diferencia de
// la cruceta de 4 botones, no hace falta "presionar dos a la vez" para
// una diagonal, el ángulo del arrastre ya la da directamente.
const JOY_RADIUS = 62;
const JOY_KNOB_RADIUS = 30;
// Un arrastre más corto que esto se ignora — evita que un toque casi
// quieto (temblor de dedo) dispare una dirección por accidente.
const JOY_DEADZONE = 10;

const SHADOW_COLOR = 0x2a2145;
const RING_COLOR = 0xe8defc;
const KNOB_COLOR = 0xffc9e6;
// Pedido explícito de rondas anteriores: "medio transparente" pero
// legible contra un fondo tan variado como el del juego (agua clara,
// plantas densas, rocas) — misma paleta que ya se usó para la cruceta.
const SHADOW_ALPHA = 0.16;
const BASE_FILL_ALPHA = 0.22;
const RING_ALPHA = 0.6;
const KNOB_ALPHA = 0.85;

interface Point {
  x: number;
  y: number;
}

/**
 * Entrada combinada: teclado (flechas/WASD, para desarrollo en escritorio)
 * + joystick táctil flotante (control real para móvil).
 */
export class InputController {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys | null;
  private readonly wasd: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key> | null;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private activePointerId: number | null = null;
  private origin: Point | null = null;
  private current: Point | null = null;

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

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    // Un solo dedo controla el movimiento a la vez — un segundo toque
    // accidental no interfiere con el joystick ya activo.
    if (this.activePointerId !== null) return;
    this.activePointerId = pointer.id;
    this.origin = { x: pointer.x, y: pointer.y };
    this.current = { x: pointer.x, y: pointer.y };
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (this.activePointerId !== pointer.id) return;
    this.current = { x: pointer.x, y: pointer.y };
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (this.activePointerId !== pointer.id) return;
    this.activePointerId = null;
    this.origin = null;
    this.current = null;
  }

  /** Desplazamiento del dedo respecto al origen, recortado a JOY_RADIUS —
   * el "knob" nunca se dibuja (ni se lee como dirección) más lejos que
   * eso, como cualquier joystick virtual de verdad. */
  private knobOffset(): { x: number; y: number; dist: number } {
    if (!this.origin || !this.current) return { x: 0, y: 0, dist: 0 };
    const dx = this.current.x - this.origin.x;
    const dy = this.current.y - this.origin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= JOY_RADIUS || dist === 0) return { x: dx, y: dy, dist };
    const scale = JOY_RADIUS / dist;
    return { x: dx * scale, y: dy * scale, dist: JOY_RADIUS };
  }

  private drawJoystick() {
    this.graphics.clear();
    if (!this.origin) return;
    const { x: dx, y: dy } = this.knobOffset();
    const { x: ox, y: oy } = this.origin;

    // Base: sombra sutil + círculo translúcido + aro, igual criterio que
    // la cruceta de rondas anteriores (contraste sin dejar de ser
    // translúcido).
    this.graphics.fillStyle(SHADOW_COLOR, SHADOW_ALPHA);
    this.graphics.fillCircle(ox, oy, JOY_RADIUS + 6);
    this.graphics.fillStyle(0xffffff, BASE_FILL_ALPHA);
    this.graphics.fillCircle(ox, oy, JOY_RADIUS);
    this.graphics.lineStyle(2, RING_COLOR, RING_ALPHA);
    this.graphics.strokeCircle(ox, oy, JOY_RADIUS);

    // Knob: sigue al dedo, recortado al radio de la base.
    const kx = ox + dx;
    const ky = oy + dy;
    this.graphics.fillStyle(SHADOW_COLOR, 0.2);
    this.graphics.fillCircle(kx, ky, JOY_KNOB_RADIUS + 3);
    this.graphics.fillStyle(KNOB_COLOR, KNOB_ALPHA);
    this.graphics.fillCircle(kx, ky, JOY_KNOB_RADIUS);
    this.graphics.lineStyle(1.5, RING_COLOR, RING_ALPHA);
    this.graphics.strokeCircle(kx, ky, JOY_KNOB_RADIUS);
  }

  getVector(): DirectionVector {
    let x = 0;
    let y = 0;
    if (this.cursors?.left.isDown || this.wasd?.A.isDown) x -= 1;
    if (this.cursors?.right.isDown || this.wasd?.D.isDown) x += 1;
    if (this.cursors?.up.isDown || this.wasd?.W.isDown) y -= 1;
    if (this.cursors?.down.isDown || this.wasd?.S.isDown) y += 1;

    this.drawJoystick();

    // El teclado manda si se usa (solo pasa en pruebas de escritorio); si
    // no hay tecla pulsada, se usa el joystick táctil. Lumi normaliza el
    // vector igualmente (ver Lumi.update), así que no hace falta que esté
    // normalizado aquí — solo que el signo/ángulo sea el correcto.
    if (x !== 0 || y !== 0) return { x, y };

    const { x: dx, y: dy, dist } = this.knobOffset();
    if (dist < JOY_DEADZONE) return { x: 0, y: 0 };
    return { x: dx, y: dy };
  }

  private destroy() {
    this.scene.input.off("pointerdown", this.handlePointerDown, this);
    this.scene.input.off("pointermove", this.handlePointerMove, this);
    this.scene.input.off("pointerup", this.handlePointerUp, this);
    this.scene.input.off("pointerupoutside", this.handlePointerUp, this);
    this.graphics.destroy();
  }
}
