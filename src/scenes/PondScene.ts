import Phaser from "phaser";
import { GAME_OVER_MARGIN, START_Y, WORLD_HEIGHT, WORLD_WIDTH } from "@/config/GameConfig";
import { Lumi } from "@/entities/Lumi";
import { BackgroundDecorSpawner } from "@/systems/BackgroundDecorSpawner";
import { BackgroundFishField } from "@/systems/BackgroundFishField";
import { BubbleField } from "@/systems/BubbleField";
import { InputController } from "@/systems/InputController";
import { JellyfishSpawner } from "@/systems/JellyfishSpawner";
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
  private jellyfishSpawner!: JellyfishSpawner;
  private decorSpawner!: BackgroundDecorSpawner;
  private boostBurst!: Phaser.GameObjects.Particles.ParticleEmitter;
  private boostBurstSmall!: Phaser.GameObjects.Particles.ParticleEmitter;
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

    // El PNG de background_far no está pensado para repetirse verticalmente
    // sin fin (tiene una única fuente de luz arriba): al tilearlo tal cual
    // se nota mucho la costura entre una copia y la siguiente. Se
    // construye una textura "espejada" (original + copia volteada debajo)
    // una sola vez: al repetir ESA textura, el borde de una copia siempre
    // conecta con su propio reflejo, así que no hay corte visible en
    // ningún punto de la repetición.
    const bgKey = pondLayerKey("background_far");
    const seamlessKey = "background_far_seamless";
    if (!this.textures.exists(seamlessKey)) {
      const bgImg = this.textures.get(bgKey).getSourceImage() as HTMLImageElement;
      const w = bgImg.width;
      const h = bgImg.height;
      const canvasTex = this.textures.createCanvas(seamlessKey, w, h * 2)!;
      const ctx = canvasTex.getContext();
      ctx.drawImage(bgImg, 0, 0);
      ctx.save();
      ctx.translate(0, h * 2);
      ctx.scale(1, -1);
      ctx.drawImage(bgImg, 0, 0);
      ctx.restore();
      canvasTex.refresh();
    }

    // El cielo/agua de fondo es un degradado continuo: tilearlo cubre
    // cualquier tamaño de mundo sin huecos ni costuras visibles.
    this.skyLayer = new ParallaxLayer(this, seamlessKey, 0.15, 0);

    // Peces de fondo, muy detrás de las rocas/plantas (parallax lento,
    // escala pequeña, teñido suave) para dar sensación de profundidad sin
    // competir visualmente con Lumi. Se reciclan con la cámara (ver
    // BackgroundFishField.update), no dependen de una altura de mundo fija.
    this.fishField = new BackgroundFishField(this, WORLD_WIDTH, cam.height, 0.5, 0.25);

    // Objetos de fondo (piedras, conchas, estrellas): decoración pura, sin
    // colisión, para que la subida no se sienta tan vacía entre nenúfares.
    this.decorSpawner = new BackgroundDecorSpawner(this, WORLD_WIDTH, START_Y, 1.8, 0.4);

    // Rocas/plantas son decoración de la zona de salida — el "fondo del
    // estanque" de verdad. Se anclan cerca de START_Y (no del viejo fondo
    // de un mundo ahora gigante) para que se vean desde el primer
    // fotograma: la partida arranca literalmente en el fondo del
    // estanque, y esa decoración queda atrás para siempre al subir (como
    // el suelo en Doodle Jump).
    this.add
      .image(WORLD_WIDTH / 2, START_Y + cam.height * 0.3, pondLayerKey("rocks_back"))
      .setOrigin(0.5, 1)
      .setScrollFactor(0.35)
      .setDepth(1);

    this.add
      .image(WORLD_WIDTH / 2, START_Y + cam.height * 0.38, pondLayerKey("distant_plants"))
      .setOrigin(0.5, 1)
      .setScrollFactor(0.55)
      .setDepth(3);

    this.lumi = new Lumi(this, WORLD_WIDTH / 2, START_Y);
    this.lumi.sprite.setDepth(5);
    new LumiBubbleTrail(this, this.lumi.sprite, 4.6);

    // Explosión de burbujas al tocar un nenúfar: vende el impulso mucho
    // mejor que una pose nueva. "emitting: false" porque solo se disparan
    // a mano (explode) en el momento del boost, no de forma continua.
    const burstConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
      speed: { min: 90, max: 240 },
      angle: { min: 200, max: 340 },
      lifespan: { min: 350, max: 700 },
      alpha: { start: 0.9, end: 0 },
      emitting: false,
    };
    this.boostBurst = this.add
      .particles(0, 0, "bubble_big", { ...burstConfig, scale: { start: 0.4, end: 0.05 } })
      .setDepth(4.7);
    this.boostBurstSmall = this.add
      .particles(0, 0, "bubble_small", { ...burstConfig, scale: { start: 0.35, end: 0.05 } })
      .setDepth(4.7);

    // Nenúfares: uno de salida en la misma posición de siempre, y el resto
    // se generan sin parar según Lumi sube. Tocar cualquiera da un boost.
    this.lilyPadSpawner = new LilyPadSpawner(this, WORLD_WIDTH, 562, START_Y - 158);
    this.physics.add.overlap(
      this.lumi.sprite,
      this.lilyPadSpawner.group,
      (_lumiObj, padObj) => {
        this.lumi.triggerBoost();
        this.boostBurst.explode(6, this.lumi.sprite.x, this.lumi.sprite.y);
        this.boostBurstSmall.explode(9, this.lumi.sprite.x, this.lumi.sprite.y);
        this.lilyPadSpawner.consume(padObj as Phaser.Physics.Arcade.Image);
      },
    );

    // Medusas: primer enemigo. Empiezan a aparecer algo por encima de la
    // salida (no justo donde arranca la partida) y tocarlas es game over.
    this.jellyfishSpawner = new JellyfishSpawner(this, WORLD_WIDTH, START_Y - 600);
    this.physics.add.overlap(this.lumi.sprite, this.jellyfishSpawner.group, () => {
      this.triggerGameOver("medusa");
    });

    // foreground_plants es la capa más cercana a cámara: va delante de
    // Lumi (como su nombre indica), no detrás.
    this.add
      .image(WORLD_WIDTH / 2, START_Y + cam.height * 0.42, pondLayerKey("foreground_plants"))
      .setOrigin(0.5, 1)
      .setScrollFactor(1)
      .setDepth(6);

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

  private triggerGameOver(reason: "atras" | "medusa" = "atras") {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.physics.pause();
    const altura = Math.round(this.bestHeight / 10);
    const motivo = reason === "medusa" ? "Te ha tocado una medusa..." : "Te has quedado atrás...";
    this.gameOverText.setText(`${motivo}\n\nAltura: ${altura}\n\nToca la pantalla para volver a intentarlo`);
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
    this.lilyPadSpawner.update(cam.scrollY, cam.scrollY + cam.height, time);
    this.jellyfishSpawner.update(cam.scrollY, cam.scrollY + cam.height, time);
    this.decorSpawner.update(cam.scrollY, cam.scrollY + cam.height);

    this.bestHeight = Math.max(this.bestHeight, START_Y - this.lumi.sprite.y);
    this.scoreText.setText(`Altura: ${Math.round(this.bestHeight / 10)}`);

    if (this.lumi.sprite.y > cam.scrollY + cam.height + GAME_OVER_MARGIN) {
      this.triggerGameOver();
    }
  }
}
