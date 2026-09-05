import Phaser from "phaser";

export interface DirectionVector {
  x: number;
  y: number;
}

type Dir = "up" | "down" | "left" | "right";

interface DirDef {
  dir: Dir;
  x: number;
  y: number;
  /** Ángulo en radianes, en coordenadas de pantalla (0 = derecha, sentido
   * horario porque +y es hacia abajo). */
  angle: number;
}

// Pedido explícito del usuario: nada de dial circular de 8 direcciones —
// una cruceta TRADICIONAL, solo arriba/abajo/izquierda/derecha como botones
// independientes. Las diagonales salen solas de presionar dos a la vez
// (ver getVector, mismo criterio aditivo que ya usa el teclado).
const DIRECTIONS: DirDef[] = [
  { dir: "up", x: 0, y: -1, angle: -Math.PI / 2 },
  { dir: "right", x: 1, y: 0, angle: 0 },
  { dir: "down", x: 0, y: 1, angle: Math.PI / 2 },
  { dir: "left", x: -1, y: 0, angle: Math.PI },
];

// Pedido explícito: la cruceta FIJA, centrada abajo en la pantalla (antes
// estaba en la esquina inferior izquierda) — como un mando físico de
// verdad, cuatro botones independientes alrededor de un hub central, no un
// círculo con 8 flechas.
const BUTTON_SIZE = 60;
const BUTTON_GAP = 5;
// Distancia del centro de la cruceta al centro de cada botón.
const OFFSET = BUTTON_SIZE + BUTTON_GAP;
const HUB_SIZE = BUTTON_SIZE * 0.62;
const CORNER_RADIUS = 12;
const PAD_MARGIN_Y = 130;
// Margen de tolerancia por fuera de cada botón — un dedo que cae un poco
// fuera del cuadrado exacto igual debe registrar esa dirección.
const HIT_MARGIN = 10;
// Un dedo que se aleja más allá de esto (midiendo desde el hub) suelta el
// control, en vez de quedarse pegado a un botón lejano.
const CAPTURE_RADIUS = OFFSET + BUTTON_SIZE / 2 + 46;

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
const BASE_FILL_ACTIVE_ALPHA = 0.4;
const RING_ALPHA = 0.6;
const HUB_ALPHA = 0.3;
const ARROW_ALPHA = 0.55;
const ARROW_ACTIVE_ALPHA = 0.95;

/**
 * Entrada combinada: teclado (flechas/WASD, para desarrollo en escritorio)
 * + cruceta táctil fija de 4 direcciones (control real para móvil). Cada
 * botón es un dedo independiente — dos dedos a la vez en dos botones
 * adyacentes producen una diagonal, igual que dos flechas del teclado.
 */
export class InputController {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys | null;
  private readonly wasd: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key> | null;
  private readonly graphics: Phaser.GameObjects.Graphics;
  /** pointer.id -> dirección que ese dedo está presionando ahora mismo
   * (null si el dedo sigue capturado pero no cae sobre ningún botón, ej.
   * en el hueco entre botones). */
  private readonly activeTouches = new Map<number, Dir | null>();

  constructor(private readonly scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    this.cursors = keyboard ? keyboard.createCursorKeys() : null;
    this.wasd = keyboard
      ? (keyboard.addKeys("W,A,S,D") as Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>)
      : null;

    // Hacen falta al menos 2 dedos a la vez para una diagonal (ej. arriba +
    // derecha) — un margen extra de sobra por si hay un tercer toque
    // accidental.
    scene.input.addPointer(2);

    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(90);

    scene.input.on("pointerdown", this.handlePointerDown, this);
    scene.input.on("pointermove", this.handlePointerMove, this);
    scene.input.on("pointerup", this.handlePointerUp, this);
    scene.input.on("pointerupoutside", this.handlePointerUp, this);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /** Centrada abajo en la pantalla — recalculado cada vez a partir de la
   * cámara actual para seguir el resize (rotar el móvil, redimensionar la
   * ventana) sin lógica aparte. */
  private padCenter(): { x: number; y: number } {
    const cam = this.scene.cameras.main;
    return { x: cam.width / 2, y: cam.height - PAD_MARGIN_Y };
  }

  private buttonCenter(dir: DirDef, hub: { x: number; y: number }): { x: number; y: number } {
    return { x: hub.x + dir.x * OFFSET, y: hub.y + dir.y * OFFSET };
  }

  private distanceToPad(px: number, py: number): number {
    const { x: cx, y: cy } = this.padCenter();
    return Phaser.Math.Distance.Between(px, py, cx, cy);
  }

  /** Qué botón (si alguno) cae bajo el punto — cada botón es un cuadrado
   * independiente, con un pequeño margen de tolerancia. */
  private dirFromPoint(px: number, py: number): Dir | null {
    const hub = this.padCenter();
    const half = BUTTON_SIZE / 2 + HIT_MARGIN;
    for (const d of DIRECTIONS) {
      const { x: bx, y: by } = this.buttonCenter(d, hub);
      if (Math.abs(px - bx) <= half && Math.abs(py - by) <= half) return d.dir;
    }
    return null;
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (this.activeTouches.has(pointer.id)) return;
    if (this.distanceToPad(pointer.x, pointer.y) > CAPTURE_RADIUS) return;
    this.activeTouches.set(pointer.id, this.dirFromPoint(pointer.x, pointer.y));
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.activeTouches.has(pointer.id)) return;
    if (this.distanceToPad(pointer.x, pointer.y) > CAPTURE_RADIUS) {
      // El dedo se alejó demasiado del pad — soltar, como al levantar un
      // mando físico.
      this.activeTouches.delete(pointer.id);
      return;
    }
    this.activeTouches.set(pointer.id, this.dirFromPoint(pointer.x, pointer.y));
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer) {
    this.activeTouches.delete(pointer.id);
  }

  private isDirActive(dir: Dir): boolean {
    for (const d of this.activeTouches.values()) {
      if (d === dir) return true;
    }
    return false;
  }

  private drawArrow(cx: number, cy: number, angle: number, active: boolean) {
    const tipR = BUTTON_SIZE * 0.34;
    const baseR = BUTTON_SIZE * 0.06;
    const halfWidth = 12;
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

  private drawButton(cx: number, cy: number, active: boolean) {
    const half = BUTTON_SIZE / 2;
    this.graphics.fillStyle(SHADOW_COLOR, SHADOW_ALPHA);
    this.graphics.fillRoundedRect(cx - half - 3, cy - half - 3, BUTTON_SIZE + 6, BUTTON_SIZE + 6, CORNER_RADIUS);

    this.graphics.fillStyle(0xffffff, active ? BASE_FILL_ACTIVE_ALPHA : BASE_FILL_ALPHA);
    this.graphics.fillRoundedRect(cx - half, cy - half, BUTTON_SIZE, BUTTON_SIZE, CORNER_RADIUS);
    this.graphics.lineStyle(2, RING_COLOR, RING_ALPHA);
    this.graphics.strokeRoundedRect(cx - half, cy - half, BUTTON_SIZE, BUTTON_SIZE, CORNER_RADIUS);
  }

  private drawPad() {
    this.graphics.clear();
    const hub = this.padCenter();

    for (const d of DIRECTIONS) {
      const active = this.isDirActive(d.dir);
      const { x: bx, y: by } = this.buttonCenter(d, hub);
      this.drawButton(bx, by, active);
      this.drawArrow(bx, by, d.angle, active);
    }

    // Hub central decorativo — solo para que se lea como una cruceta de
    // verdad (las 4 direcciones "nacen" de un mismo centro), no interactivo.
    this.graphics.fillStyle(0xffffff, HUB_ALPHA);
    this.graphics.fillRoundedRect(hub.x - HUB_SIZE / 2, hub.y - HUB_SIZE / 2, HUB_SIZE, HUB_SIZE, CORNER_RADIUS * 0.7);
    this.graphics.lineStyle(1.5, RING_COLOR, RING_ALPHA);
    this.graphics.strokeRoundedRect(hub.x - HUB_SIZE / 2, hub.y - HUB_SIZE / 2, HUB_SIZE, HUB_SIZE, CORNER_RADIUS * 0.7);
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
    // no hay tecla pulsada, se usa la cruceta táctil — sumando cada botón
    // presionado (dos a la vez, ej. arriba+derecha, da la diagonal).
    if (x !== 0 || y !== 0) return { x, y };

    let tx = 0;
    let ty = 0;
    if (this.isDirActive("left")) tx -= 1;
    if (this.isDirActive("right")) tx += 1;
    if (this.isDirActive("up")) ty -= 1;
    if (this.isDirActive("down")) ty += 1;
    return { x: tx, y: ty };
  }

  private destroy() {
    this.scene.input.off("pointerdown", this.handlePointerDown, this);
    this.scene.input.off("pointermove", this.handlePointerMove, this);
    this.scene.input.off("pointerup", this.handlePointerUp, this);
    this.scene.input.off("pointerupoutside", this.handlePointerUp, this);
    this.graphics.destroy();
  }
}
