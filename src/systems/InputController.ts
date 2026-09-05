import Phaser from "phaser";

export interface DirectionVector {
  x: number;
  y: number;
}

interface DirDef {
  x: number;
  y: number;
  /** Ángulo en radianes, en coordenadas de pantalla (0 = derecha, sentido
   * horario porque +y es hacia abajo). */
  angle: number;
}

// Las 8 flechas del D-pad, en el orden en que se dibujan alrededor del
// círculo — pedido explícito: "arriba, abajo, izquierda, derecha y las
// diagonales", no un joystick de arrastre libre.
const DIRECTIONS: DirDef[] = [
  { x: 0, y: -1, angle: -Math.PI / 2 }, // arriba
  { x: 1, y: -1, angle: -Math.PI / 4 }, // arriba-derecha
  { x: 1, y: 0, angle: 0 }, // derecha
  { x: 1, y: 1, angle: Math.PI / 4 }, // abajo-derecha
  { x: 0, y: 1, angle: Math.PI / 2 }, // abajo
  { x: -1, y: 1, angle: (3 * Math.PI) / 4 }, // abajo-izquierda
  { x: -1, y: 0, angle: Math.PI }, // izquierda
  { x: -1, y: -1, angle: (-3 * Math.PI) / 4 }, // arriba-izquierda
];

// Pedido explícito del usuario: un D-pad FIJO en la misma esquina siempre
// (como un mando físico), no el joystick flotante anterior que aparecía
// donde tocaras el dedo. "Bonita, bien hecha, medio transparente" — un
// círculo base translúcido con 8 flechas triangulares alrededor, la que
// esté activa se resalta. Pura interfaz de control (Graphics), no arte
// del juego — no pasa por el flujo de Gemini/STYLE_BIBLE.md.
const PAD_OUTER_RADIUS = 78;
const PAD_INNER_RADIUS = 26;
const PAD_MARGIN_X = 104;
const PAD_MARGIN_Y = 130;
// Un dedo que se desliza más allá de esto suelta el control (como soltar
// un mando físico), en vez de quedarse pegado a una dirección lejana.
const PAD_CAPTURE_RADIUS = PAD_OUTER_RADIUS * 1.6;
const PAD_DEADZONE_RADIUS = PAD_INNER_RADIUS * 0.55;

const SHADOW_COLOR = 0x2a2145;
const RING_COLOR = 0xe8defc;
const ARROW_COLOR = 0xe8defc;
const ARROW_ACTIVE_COLOR = 0xffc9e6;
// Pedido explícito: "medio transparente" pero legible — contra un fondo
// tan variado como el del juego (agua clara, plantas densas, rocas) hace
// falta más contraste del que parecía a simple vista en el editor: una
// sombra oscura muy sutil debajo de todo ayuda a que se lea igual sobre
// cualquier fondo, sin dejar de ser translúcido.
const SHADOW_ALPHA = 0.16;
const BASE_FILL_ALPHA = 0.22;
const RING_ALPHA = 0.6;
const HUB_ALPHA = 0.3;
const ARROW_ALPHA = 0.55;
const ARROW_ACTIVE_ALPHA = 0.95;

function angleDiff(a: number, b: number): number {
  let diff = Math.abs(a - b) % (Math.PI * 2);
  if (diff > Math.PI) diff = Math.PI * 2 - diff;
  return diff;
}

/**
 * Entrada combinada: teclado (flechas/WASD, para desarrollo en escritorio)
 * + D-pad táctil fijo de 8 direcciones (control real para móvil).
 */
export class InputController {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys | null;
  private readonly wasd: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key> | null;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private activePointerId: number | null = null;
  private activeDirIndex: number | null = null;

  constructor(private readonly scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    this.cursors = keyboard ? keyboard.createCursorKeys() : null;
    this.wasd = keyboard
      ? (keyboard.addKeys("W,A,S,D") as Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>)
      : null;

    // Multi-touch no hace falta desactivarlo a nivel global: basta con
    // ignorar cualquier dedo que no sea el que ya está controlando (ver
    // handlePointerDown) para que un segundo toque accidental no interfiera.
    scene.input.addPointer(1);

    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(90);

    scene.input.on("pointerdown", this.handlePointerDown, this);
    scene.input.on("pointermove", this.handlePointerMove, this);
    scene.input.on("pointerup", this.handlePointerUp, this);
    scene.input.on("pointerupoutside", this.handlePointerUp, this);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /** Esquina inferior izquierda, con margen — recalculado cada vez a
   * partir de la cámara actual para seguir el resize (rotar el móvil,
   * redimensionar la ventana) sin lógica aparte. */
  private padCenter(): { x: number; y: number } {
    const cam = this.scene.cameras.main;
    return { x: PAD_MARGIN_X, y: cam.height - PAD_MARGIN_Y };
  }

  /** Distancia del punto al centro del pad — separado de `dirIndexFromPoint`
   * porque "está dentro del alcance del pad" (para capturar el dedo) y
   * "a qué dirección apunta" (que puede ser ninguna, en la zona muerta)
   * son dos preguntas distintas: un toque que empieza justo en el centro
   * (zona muerta) debe seguir capturado para que arrastrar el dedo hacia
   * fuera funcione, no solo un toque que ya empieza sobre una flecha. */
  private distanceToPad(px: number, py: number): number {
    const { x: cx, y: cy } = this.padCenter();
    return Phaser.Math.Distance.Between(px, py, cx, cy);
  }

  private dirIndexFromPoint(px: number, py: number): number | null {
    const { x: cx, y: cy } = this.padCenter();
    const dx = px - cx;
    const dy = py - cy;
    if (Math.sqrt(dx * dx + dy * dy) < PAD_DEADZONE_RADIUS) return null;
    const angle = Math.atan2(dy, dx);
    let closestIndex = 0;
    let closestDelta = Infinity;
    for (let i = 0; i < DIRECTIONS.length; i++) {
      const delta = angleDiff(angle, DIRECTIONS[i].angle);
      if (delta < closestDelta) {
        closestDelta = delta;
        closestIndex = i;
      }
    }
    return closestIndex;
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    // Un solo dedo controla el movimiento a la vez — si ya hay uno activo,
    // los demás toques (accidentales, o un futuro botón de UI) se ignoran
    // aquí.
    if (this.activePointerId !== null) return;
    if (this.distanceToPad(pointer.x, pointer.y) > PAD_CAPTURE_RADIUS) return;
    this.activePointerId = pointer.id;
    this.activeDirIndex = this.dirIndexFromPoint(pointer.x, pointer.y);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (this.activePointerId !== pointer.id) return;
    if (this.distanceToPad(pointer.x, pointer.y) > PAD_CAPTURE_RADIUS) {
      // El dedo se alejó demasiado del pad — soltar, como al levantar un
      // mando físico.
      this.activeDirIndex = null;
      return;
    }
    this.activeDirIndex = this.dirIndexFromPoint(pointer.x, pointer.y);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (this.activePointerId !== pointer.id) return;
    this.activePointerId = null;
    this.activeDirIndex = null;
  }

  private drawArrow(cx: number, cy: number, angle: number, active: boolean) {
    const tipR = PAD_OUTER_RADIUS * 0.92;
    const baseR = PAD_INNER_RADIUS * 1.2;
    const halfWidth = 13;
    const tipX = cx + Math.cos(angle) * tipR;
    const tipY = cy + Math.sin(angle) * tipR;
    const baseCx = cx + Math.cos(angle) * baseR;
    const baseCy = cy + Math.sin(angle) * baseR;
    const perpX = Math.cos(angle + Math.PI / 2) * halfWidth;
    const perpY = Math.sin(angle + Math.PI / 2) * halfWidth;

    // Contorno oscuro fino antes del relleno — mismo motivo que la sombra
    // del pad: que la flecha se lea sobre cualquier fondo, no solo agua
    // clara.
    this.graphics.lineStyle(2, SHADOW_COLOR, active ? 0.35 : 0.18);
    this.graphics.strokeTriangle(tipX, tipY, baseCx + perpX, baseCy + perpY, baseCx - perpX, baseCy - perpY);
    this.graphics.fillStyle(active ? ARROW_ACTIVE_COLOR : ARROW_COLOR, active ? ARROW_ACTIVE_ALPHA : ARROW_ALPHA);
    this.graphics.fillTriangle(tipX, tipY, baseCx + perpX, baseCy + perpY, baseCx - perpX, baseCy - perpY);
  }

  private drawPad() {
    this.graphics.clear();
    const { x: cx, y: cy } = this.padCenter();

    // Sombra sutil, un poco más grande que el pad — da contraste contra
    // fondos claros/desordenados sin que el pad deje de ser translúcido.
    this.graphics.fillStyle(SHADOW_COLOR, SHADOW_ALPHA);
    this.graphics.fillCircle(cx, cy, PAD_OUTER_RADIUS + 5);

    this.graphics.fillStyle(0xffffff, BASE_FILL_ALPHA);
    this.graphics.fillCircle(cx, cy, PAD_OUTER_RADIUS);
    this.graphics.lineStyle(2, RING_COLOR, RING_ALPHA);
    this.graphics.strokeCircle(cx, cy, PAD_OUTER_RADIUS);

    for (let i = 0; i < DIRECTIONS.length; i++) {
      this.drawArrow(cx, cy, DIRECTIONS[i].angle, this.activeDirIndex === i);
    }

    this.graphics.fillStyle(0xffffff, HUB_ALPHA);
    this.graphics.fillCircle(cx, cy, PAD_INNER_RADIUS);
    this.graphics.lineStyle(1.5, RING_COLOR, RING_ALPHA);
    this.graphics.strokeCircle(cx, cy, PAD_INNER_RADIUS);
  }

  getVector(): DirectionVector {
    let x = 0;
    let y = 0;
    if (this.cursors?.left.isDown || this.wasd?.A.isDown) x -= 1;
    if (this.cursors?.right.isDown || this.wasd?.D.isDown) x += 1;
    if (this.cursors?.up.isDown || this.wasd?.W.isDown) y -= 1;
    if (this.cursors?.down.isDown || this.wasd?.S.isDown) y += 1;

    this.drawPad();

    // El teclado manda si se usa (solo pasa en pruebas de escritorio); si
    // no hay tecla pulsada, se usa el D-pad táctil.
    if (x !== 0 || y !== 0) return { x, y };
    if (this.activeDirIndex !== null) {
      const dir = DIRECTIONS[this.activeDirIndex];
      return { x: dir.x, y: dir.y };
    }
    return { x: 0, y: 0 };
  }

  private destroy() {
    this.scene.input.off("pointerdown", this.handlePointerDown, this);
    this.scene.input.off("pointermove", this.handlePointerMove, this);
    this.scene.input.off("pointerup", this.handlePointerUp, this);
    this.scene.input.off("pointerupoutside", this.handlePointerUp, this);
    this.graphics.destroy();
  }
}
