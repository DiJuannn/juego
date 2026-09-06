import Phaser from "phaser";

const BOB_AMPLITUDE = 6;
const BOB_SPEED = 0.3;
const BREATHE_AMPLITUDE = 0.05;
const BREATHE_SPEED = 1.3;
// Pedido explícito: "mejora el movimiento que sea más elaborado de los
// que ya tenemos" — un balanceo angular sutil (como una concha asentada
// meciéndose un poco con la corriente), además del bob/respiración que ya
// tenía. Ángulo pequeño a propósito: el hitbox de la almeja es un
// rectángulo fijo centrado casi exactamente en el sprite (ver el ajuste
// de tamaño/offset más abajo), así que un balanceo de pocos grados no lo
// desincroniza de forma perceptible.
const ROCK_AMPLITUDE = 0.05; // rad
const ROCK_SPEED = 0.4;

// Secuencia de mordisco (pedido explícito: "no parece que haga la
// animación... al tocarla se cierre y coma a lumi"). Antes el cambio a
// `giant_clam_closed` era un setTexture instantáneo — con la boca apenas
// entreabierta de antes, ese salto casi no se notaba. Ahora que
// `giant_clam` está mucho más abierta (arte regenerado con Gemini), la
// mordida es una mini-secuencia de 3 fases: anticipación (se abre un
// pelín más) → cierre de golpe con "squash" al mismo tiempo que cambia de
// textura → asentamiento.
//
// Implementado con Phaser.Tweens (no con matemática manual en update()):
// PondScene.update() deja de llamarse por completo en cuanto empieza la
// secuencia de muerte (`isDying`, ver startDeathSequence/handleHazardHit),
// así que cualquier lógica que dependiera de recibir update(time) después
// de ese punto nunca se ejecutaría — confirmado con un test real en el
// motor (la textura nunca llegaba a "giant_clam_closed"). Los tweens del
// TweenManager de Phaser, en cambio, siguen avanzando aunque la escena dej
// de llamar a su propio update() — es el mismo motivo por el que el
// hundimiento/encogido de Lumi (con su propio this.tweens.add en
// PondScene) sí se ve completo.
const BITE_ANTICIPATION_MS = 150;
const BITE_SNAP_MS = 120;
const BITE_SETTLE_MS = 250;
const BITE_ANTICIPATION_PULSE = 0.06;
const BITE_SNAP_SCALE_X = 1.12;
const BITE_SNAP_SCALE_Y = 0.82;

/**
 * Séptimo enemigo (pedido explícito: "crea más animales... la almeja
 * podrías crearle una animación y que te coma"). Antes era solo una pieza
 * decorativa estática de `ReefCluster` (`lateralWall`, sin colisión de
 * verdad como peligro) — ahora es un animal real: queda con la boca muy
 * abierta y quieta (con un ligero balanceo, igual criterio que Urchin)
 * hasta que Lumi la toca, momento en el que `triggerBite()` dispara la
 * secuencia de mordisco (ver arriba) como parte de la secuencia de muerte
 * — ver `startDeathSequence` en PondScene.ts, que además tira de Lumi
 * hacia el centro de la almeja en vez del hundimiento genérico, para que
 * se lea claramente como "la almeja se la comió".
 */
export class GiantClam {
  readonly sprite: Phaser.Physics.Arcade.Image;
  private baseY: number;
  private baseScale: number;
  private phase: number;
  private biting = false;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
    scale: number,
  ) {
    this.sprite = scene.physics.add.staticImage(x, y, "giant_clam");
    this.sprite.setScale(scale);
    // Pedido explícito: todos los animales en la misma capa que Lumi, para
    // que se lean claramente como obstáculos y no como decoración de fondo.
    this.sprite.setDepth(5);
    this.sprite.refreshBody();
    // Hitbox ajustada a la concha real (no a las esquinas vacías del
    // lienzo) — remedido tras regenerar giant_clam.png con la boca mucho
    // más abierta (bbox [0.189,0.174,0.845,0.816] sobre 1024x1024, en
    // píxeles nativos). Multiplicado por `scale`: un StaticBody no escala
    // el tamaño/offset automáticamente con setScale().
    (this.sprite.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(671 * scale, 658 * scale)
      .setOffset(194 * scale, 178 * scale);

    this.baseY = y;
    this.baseScale = scale;
    this.phase = Phaser.Math.FloatBetween(0, Math.PI * 2);
  }

  /** Dispara la secuencia de mordisco (llamar una sola vez, al momento del
   * golpe letal) — ver el comentario junto a BITE_ANTICIPATION_MS sobre
   * por qué esto son tweens de verdad y no un cálculo dentro de update().
   * Idempotente: una segunda llamada no reinicia la secuencia. La hitbox
   * no se toca aquí a propósito: para cuando esto se dispara, el body de
   * Lumi ya está deshabilitado (ver startDeathSequence) y el juego termina
   * a los pocos cientos de ms, así que ya no hay ninguna colisión que
   * comprobar. */
  triggerBite() {
    if (this.biting) return;
    this.biting = true;

    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.baseScale * (1 + BITE_ANTICIPATION_PULSE),
      scaleY: this.baseScale * (1 + BITE_ANTICIPATION_PULSE),
      duration: BITE_ANTICIPATION_MS,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.sprite.setTexture("giant_clam_closed");
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: this.baseScale * BITE_SNAP_SCALE_X,
          scaleY: this.baseScale * BITE_SNAP_SCALE_Y,
          duration: BITE_SNAP_MS,
          ease: "Cubic.easeOut",
          onComplete: () => {
            this.scene.tweens.add({
              targets: this.sprite,
              scaleX: this.baseScale,
              scaleY: this.baseScale,
              duration: BITE_SETTLE_MS,
              ease: "Back.easeOut",
            });
          },
        });
      },
    });
  }

  /** Mismo motivo que Jellyfish/Urchin: un StaticBody no sigue sprite.x/y
   * asignado a mano, ni escala su tamaño con setScale() — hay que
   * reposicionar y reescalar el body a mano cada frame. Deja de llamarse
   * en cuanto `triggerBite()` dispara la secuencia de muerte (ver arriba),
   * así que no necesita saber nada sobre el estado de mordisco. */
  update(time: number) {
    const t = time / 1000;
    const y = this.baseY + Math.sin(t * BOB_SPEED + this.phase) * BOB_AMPLITUDE;
    const pulse = 1 + Math.sin(t * BREATHE_SPEED + this.phase) * BREATHE_AMPLITUDE;
    this.sprite.setScale(this.baseScale * pulse);
    this.sprite.setRotation(Math.sin(t * ROCK_SPEED + this.phase) * ROCK_AMPLITUDE);

    const body = this.sprite.body as Phaser.Physics.Arcade.StaticBody;
    body
      .setSize(671 * this.baseScale * pulse, 658 * this.baseScale * pulse)
      .setOffset(194 * this.baseScale * pulse, 178 * this.baseScale * pulse);
    body.reset(this.sprite.x, y);
  }
}
