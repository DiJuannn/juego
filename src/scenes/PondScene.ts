import Phaser from "phaser";
import { GAME_OVER_MARGIN, START_Y, WORLD_HEIGHT, WORLD_WIDTH } from "@/config/GameConfig";
import { Lumi } from "@/entities/Lumi";
import { BackgroundFishField } from "@/systems/BackgroundFishField";
import { BubbleField } from "@/systems/BubbleField";
import { InputController } from "@/systems/InputController";
import { LilyPadSpawner } from "@/systems/LilyPadSpawner";
import { LumiBubbleTrail } from "@/systems/LumiBubbleTrail";
import { ParallaxLayer } from "@/systems/ParallaxLayer";
import { pondLayerKey } from "./BootScene";

/**
 * Escalada infinita: la cámara solo sube (nunca retrocede) siguiendo a
 * Lumi, los nenúfares se generan sin parar por delante y dan un boost al
 * tocarlos, y quedarse atrás (caer por debajo de la cámara) es game over.
 */
export class PondScene extends Phaser.Scene {
  private lumi!: Lumi;
  private inputController!: InputController;
  private skyLayer!: ParallaxLayer;
  private fishField!: BackgroundFishField;
  private lilyPadSpawner!: LilyPadSpawner;
  private scoreText!: Phaser.GameObjects.Text;
  private gameOverText!: Phaser.GameObjects.Text;
  private bestHeight = 0;
  private isGameOver = false;

  constructor() {
    super("Pond");
  }

  create() {
    this.isGameOver = false;
    this.bestHeight = 0;

    // El mundo no es infinito de verdad (evitamos rehacer coordenadas),
    // pero el margen hacia arriba es tan grande que a efectos de juego se
    // comporta igual. Hacia abajo basta con un poco más del punto de
    // partida: el game over llega mucho antes de tocar ese límite.
    this.physics.world.setBounds(0, -WORLD_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT + START_Y + 2000);

    const cam = this.cameras.main;

    // El cielo/agua de fondo es un degradado continuo: tilearlo cubre
    // cualquier tamaño de mundo sin huecos ni costuras visibles.
    this.skyLayer = new ParallaxLayer(this, pondLayerKey("background_far"), 0.15, 0);

    // Peces de fondo, muy detrás de las rocas/plantas (parallax lento,
    // escala pequeña, teñido suave) para dar sensación de profundidad sin
    // competir visualmente con Lumi. Se reciclan con la cámara (ver
    // BackgroundFishField.update), no dependen de una altura de mundo fija.
    this.fishField = new BackgroundFishField(this, WORLD_WIDTH, cam.height, 0.5, 0.25);

    // Rocas/plantas son decoración de la zona de salida: se ven al empezar
    // y quedan atrás para siempre al subir (como el suelo en Doodle Jump),
    // ya no se anclan al fondo de un mundo ahora gigante.
    this.add
      .image(WORLD_WIDTH / 2, START_Y + 550, pondLayerKey("rocks_back"))
      .setOrigin(0.5, 1)
      .setScrollFactor(0.35)
      .setDepth(1);

    this.add
      .image(WORLD_WIDTH / 2, START_Y + 700, pondLayerKey("distant_plants"))
      .setOrigin(0.5, 1)
      .setScrollFactor(0.55)
      .setDepth(3);

    this.lumi = new Lumi(this, WORLD_WIDTH / 2, START_Y);
    this.lumi.sprite.setDepth(5);
    new LumiBubbleTrail(this, this.lumi.sprite, 4.6);

    // Nenúfares: uno de salida en la misma posición de siempre, y el resto
    // se generan sin parar según Lumi sube. Tocar cualquiera da un boost.
    this.lilyPadSpawner = new LilyPadSpawner(this, WORLD_WIDTH, 562, START_Y - 158);
    this.physics.add.overlap(this.lumi.sprite, this.lilyPadSpawner.group, () => {
      this.lumi.triggerBoost();
    });

    // foreground_plants queda detrás de Lumi por ahora: es una franja
    // continua de un borde a otro del mundo, así que delante la taparía
    // casi todo el rato en vez de solo "pasar por delante" ocasionalmente.
    this.add
      .image(WORLD_WIDTH / 2, START_Y + 700, pondLayerKey("foreground_plants"))
      .setOrigin(0.5, 1)
      .setScrollFactor(1)
      .setDepth(4);

    new BubbleField(this, cam.width, cam.height, 4.5, this.lumi.sprite);

    this.inputController = new InputController(this);

    // Posición inicial de cámara (la cámara nunca usa startFollow: la
    // gestionamos a mano en update() para que solo pueda subir, nunca
    // retroceder — ver el comentario ahí).
    cam.scrollX = this.clampScrollX(cam);
    cam.scrollY = START_Y - cam.height * 0.6;

    this.scoreText = this.add
      .text(16, 16, "Altura: 0", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "22px",
        color: "#3a3a5a",
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.gameOverText = this.add
      .text(cam.width / 2, cam.height / 2, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        color: "#3a3a5a",
        align: "center",
        backgroundColor: "#ffffffcc",
        padding: { x: 24, y: 18 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101)
      .setVisible(false);

    this.input.on("pointerdown", () => {
      if (this.isGameOver) this.scene.restart();
    });
    this.input.keyboard?.on("keydown-SPACE", () => {
      if (this.isGameOver) this.scene.restart();
    });

    // Con Scale.RESIZE el canvas cambia de tamaño (p.ej. al rotar el
    // móvil): la cámara y la franja de cielo tienen que seguirle el paso.
    this.scale.on(Phaser.Scale.Events.RESIZE, (gameSize: Phaser.Structs.Size) => {
      cam.setSize(gameSize.width, gameSize.height);
      this.skyLayer.resize(gameSize.width, gameSize.height);
      this.gameOverText.setPosition(gameSize.width / 2, gameSize.height / 2);
    });
  }

  private clampScrollX(cam: Phaser.Cameras.Scene2D.Camera): number {
    return Phaser.Math.Clamp(this.lumi.sprite.x - cam.width / 2, 0, Math.max(0, WORLD_WIDTH - cam.width));
  }

  private triggerGameOver() {
    this.isGameOver = true;
    this.physics.pause();
    const altura = Math.round(this.bestHeight / 10);
    this.gameOverText.setText(`Te has quedado atrás...\n\nAltura: ${altura}\n\nToca la pantalla para volver a intentarlo`);
    this.gameOverText.setVisible(true);
  }

  update(time: number, delta: number) {
    if (this.isGameOver) return;

    this.lumi.update(this.inputController.getVector(), delta);

    const cam = this.cameras.main;

    // La cámara solo puede subir (scrollY solo puede bajar de valor):
    // quedarse atrás no se perdona dejando que la cámara "espere" — es
    // justo lo que crea la presión de un juego de escalada infinita.
    const desiredScrollY = this.lumi.sprite.y - cam.height * 0.6;
    cam.scrollY = Math.min(cam.scrollY, desiredScrollY);
    cam.scrollX = this.clampScrollX(cam);

    this.skyLayer.update(cam);
    this.fishField.update(time, delta, cam.scrollY, cam.height);
    this.lilyPadSpawner.update(cam.scrollY, cam.scrollY + cam.height);

    this.bestHeight = Math.max(this.bestHeight, START_Y - this.lumi.sprite.y);
    this.scoreText.setText(`Altura: ${Math.round(this.bestHeight / 10)}`);

    if (this.lumi.sprite.y > cam.scrollY + cam.height + GAME_OVER_MARGIN) {
      this.triggerGameOver();
    }
  }
}
