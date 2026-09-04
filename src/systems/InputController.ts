import Phaser from "phaser";

export interface DirectionVector {
  x: number;
  y: number;
}

// El juego está pensado para jugarse en móvil: el control principal es un
// joystick virtual que aparece donde el jugador apoya el dedo (no un botón
// fijo en una esquina, que en pantallas de distinto tamaño/mano puede
// quedar incómodo) y sigue el arrastre desde ese punto. El teclado se deja
// activo en paralelo solo porque es útil para probar en escritorio durante
// el desarrollo — en el juego final la mayoría de partidas se juegan con el
// dedo.
const JOYSTICK_RADIUS = 60;
const JOYSTICK_DEADZONE = 6;
const BASE_ALPHA = 0.16;
const RING_ALPHA = 0.32;
const KNOB_ALPHA = 0.4;

/**
 * Entrada combinada: teclado (flechas/WASD, para desarrollo en escritorio)
 * + joystick virtual táctil (control real para móvil). El dibujo del
 * joystick es una interfaz de control (dos círculos translúcidos), no arte
 * del juego — no pasa por el flujo de Gemini de assets/STYLE_BIBLE.md.
 */
export class InputController {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys | null;
  private readonly wasd: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key> | null;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private touchOrigin: { x: number; y: number } | null = null;
  private touchVector: DirectionVector = { x: 0, y: 0 };
  private activePointerId: number | null = null;

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

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    // Un solo dedo controla el movimiento a la vez — si ya hay uno activo,
    // los demás toques (accidentales, o un futuro botón de UI) se ignoran
    // aquí.
    if (this.activePointerId !== null) return;
    this.activePointerId = pointer.id;
    this.touchOrigin = { x: pointer.x, y: pointer.y };
    this.touchVector = { x: 0, y: 0 };
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (this.activePointerId !== pointer.id || !this.touchOrigin) return;
    const dx = pointer.x - this.touchOrigin.x;
    const dy = pointer.y - this.touchOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < JOYSTICK_DEADZONE) {
      this.touchVector = { x: 0, y: 0 };
      return;
    }
    // Magnitud clampeada al radio del joystick solo para el dibujo del
    // "nudo" — Lumi.update ya normaliza la dirección que recibe, así que
    // aquí solo importa el signo/ángulo, no lo fuerte que se haya arrastrado.
    this.touchVector = { x: dx / dist, y: dy / dist };
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer) {
    if (this.activePointerId !== pointer.id) return;
    this.activePointerId = null;
    this.touchOrigin = null;
    this.touchVector = { x: 0, y: 0 };
  }

  private drawJoystick() {
    this.graphics.clear();
    if (!this.touchOrigin) return;
    const knobX = this.touchOrigin.x + this.touchVector.x * JOYSTICK_RADIUS * 0.6;
    const knobY = this.touchOrigin.y + this.touchVector.y * JOYSTICK_RADIUS * 0.6;
    this.graphics.fillStyle(0xffffff, BASE_ALPHA);
    this.graphics.fillCircle(this.touchOrigin.x, this.touchOrigin.y, JOYSTICK_RADIUS);
    this.graphics.lineStyle(2, 0xffffff, RING_ALPHA);
    this.graphics.strokeCircle(this.touchOrigin.x, this.touchOrigin.y, JOYSTICK_RADIUS);
    this.graphics.fillStyle(0xffffff, KNOB_ALPHA);
    this.graphics.fillCircle(knobX, knobY, JOYSTICK_RADIUS * 0.4);
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
    // no hay tecla pulsada, se usa el joystick táctil.
    if (x !== 0 || y !== 0) return { x, y };
    return this.touchVector;
  }

  private destroy() {
    this.scene.input.off("pointerdown", this.handlePointerDown, this);
    this.scene.input.off("pointermove", this.handlePointerMove, this);
    this.scene.input.off("pointerup", this.handlePointerUp, this);
    this.scene.input.off("pointerupoutside", this.handlePointerUp, this);
    this.graphics.destroy();
  }
}
