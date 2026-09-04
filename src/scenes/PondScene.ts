import Phaser from "phaser";
import {
  BIG_FISH_PUSH_COOLDOWN_MS,
  BIG_FISH_PUSH_STRENGTH,
  BIG_FISH_START_OFFSET,
  CAMERA_AUTO_RISE_SPEED,
  CURRENT_ZONE_START_OFFSET,
  GAME_OVER_MARGIN,
  SHARK_START_OFFSET,
  SHIELD_START_OFFSET,
  SQUID_START_OFFSET,
  START_Y,
  URCHIN_START_OFFSET,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "@/config/GameConfig";
import { Lumi } from "@/entities/Lumi";
import { BackgroundDecorSpawner } from "@/systems/BackgroundDecorSpawner";
import { BackgroundFishField } from "@/systems/BackgroundFishField";
import { BigFishSpawner } from "@/systems/BigFishSpawner";
import { BubbleField } from "@/systems/BubbleField";
import { CrossfadePlant } from "@/systems/CrossfadePlant";
import { CurrentZoneSpawner } from "@/systems/CurrentZoneSpawner";
import { InputController } from "@/systems/InputController";
import { JellyfishSpawner } from "@/systems/JellyfishSpawner";
import { LilyPadSpawner } from "@/systems/LilyPadSpawner";
import { LumiBubbleTrail } from "@/systems/LumiBubbleTrail";
import { ParallaxLayer } from "@/systems/ParallaxLayer";
import { SharkSpawner } from "@/systems/SharkSpawner";
import { ShieldPickupSpawner } from "@/systems/ShieldPickupSpawner";
import { SquidSpawner } from "@/systems/SquidSpawner";
import { UrchinSpawner } from "@/systems/UrchinSpawner";
import { ZoneManager } from "@/systems/ZoneManager";
import { pondLayerKey, pondPlantFrameKey } from "./BootScene";

type DeathReason = "atras" | "medusa" | "tiburon" | "calamar" | "erizo";

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
  private sharkSpawner!: SharkSpawner;
  private squidSpawner!: SquidSpawner;
  private urchinSpawner!: UrchinSpawner;
  private bigFishSpawner!: BigFishSpawner;
  private currentZoneSpawner!: CurrentZoneSpawner;
  private shieldPickupSpawner!: ShieldPickupSpawner;
  private decorSpawner!: BackgroundDecorSpawner;
  private zoneManager!: ZoneManager;
  private zoneText!: Phaser.GameObjects.Text;
  private boostBurst!: Phaser.GameObjects.Particles.ParticleEmitter;
  private boostBurstSmall!: Phaser.GameObjects.Particles.ParticleEmitter;
  private scoreText!: Phaser.GameObjects.Text;
  private gameOverText!: Phaser.GameObjects.Text;
  private bestHeight = 0;
  private isGameOver = false;
  private isDying = false;
  private hasShield = false;
  private shieldAura!: Phaser.GameObjects.Image;
  private bigFishPushCooldownUntil = 0;
  /** Tras absorber un golpe, un respiro corto en el que ningún otro peligro
   * puede matar — sin esto, dos peligros solapados con Lumi en el MISMO
   * frame disparan el overlap dos veces: el primero consume el escudo, y
   * el segundo ya lo encuentra desactivado y mata igual. */
  private shieldGraceUntil = 0;
  /** Techo que la cámara persigue: solo puede bajar de valor (=subir en
   * pantalla), nunca sube. Se mueve sola a CAMERA_AUTO_RISE_SPEED y además
   * sigue a Lumi si ella sube más rápido — ver update(). */
  private cameraCeiling = 0;

  constructor() {
    super("Pond");
  }

  create() {
    this.isGameOver = false;
    this.isDying = false;
    this.bestHeight = 0;
    this.hasShield = false;
    this.bigFishPushCooldownUntil = 0;

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

    // Balanceo real: cada hoja se mueve de forma independiente entre
    // frames (generados con Gemini a partir del mismo dibujo), fundiendo
    // muy lento de uno a otro — nada de saltar de golpe entre poses, que
    // se veía artificial y brusco.
    new CrossfadePlant(
      this,
      WORLD_WIDTH / 2,
      START_Y + cam.height * 0.38,
      [pondPlantFrameKey("distant_plants", 1), pondPlantFrameKey("distant_plants", 2)],
      { x: 0.5, y: 1 },
      0.55,
      3,
      4000,
      4500,
    );

    this.lumi = new Lumi(this, WORLD_WIDTH / 2, START_Y);
    this.lumi.setDepth(5);
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

    // Power-up de escudo: aparece antes que la propia medusa. Absorbe UN
    // golpe letal (ver consumeShield) — se recoge igual que un nenúfar.
    this.shieldPickupSpawner = new ShieldPickupSpawner(this, WORLD_WIDTH, START_Y - SHIELD_START_OFFSET);
    this.physics.add.overlap(this.lumi.sprite, this.shieldPickupSpawner.group, (_lumiObj, shieldObj) => {
      this.hasShield = true;
      this.shieldAura.setVisible(true);
      this.shieldPickupSpawner.consume(shieldObj as Phaser.Physics.Arcade.Image);
    });

    // Aura visual del escudo: sigue a Lumi cada frame (ver update()),
    // invisible hasta que se recoge el power-up.
    this.shieldAura = this.add
      .image(this.lumi.sprite.x, this.lumi.sprite.y, "shield_bubble")
      .setScale(0.55)
      .setAlpha(0.55)
      .setDepth(5.2)
      .setVisible(false);

    // Medusas: primer enemigo. Empiezan a aparecer algo por encima de la
    // salida (no justo donde arranca la partida) y tocarlas es game over
    // (salvo que el escudo la absorba).
    this.jellyfishSpawner = new JellyfishSpawner(this, WORLD_WIDTH, START_Y - 600);
    this.physics.add.overlap(this.lumi.sprite, this.jellyfishSpawner.group, (_lumiObj, jellyObj) => {
      this.handleHazardHit("medusa", jellyObj as Phaser.Physics.Arcade.Image);
    });

    // Erizos: cuarto enemigo, entre la medusa y el tiburón. Casi no se
    // mueven, son un obstáculo a esquivar, no una criatura que persigue.
    this.urchinSpawner = new UrchinSpawner(this, WORLD_WIDTH, START_Y - URCHIN_START_OFFSET);
    this.physics.add.overlap(this.lumi.sprite, this.urchinSpawner.group, () => {
      this.handleHazardHit("erizo");
    });

    // Tiburones: segundo enemigo, más arriba que la medusa. Patrullan de
    // lado a lado en vez de solo derivar.
    this.sharkSpawner = new SharkSpawner(this, WORLD_WIDTH, START_Y - SHARK_START_OFFSET);
    this.physics.add.overlap(this.lumi.sprite, this.sharkSpawner.group, () => {
      this.handleHazardHit("tiburon");
    });

    // Pez grande: NO mata, solo empuja lejos a Lumi — un estorbo, no un
    // peligro letal. Reutiliza el arte de pez decorativo a mayor escala.
    this.bigFishSpawner = new BigFishSpawner(this, WORLD_WIDTH, START_Y - BIG_FISH_START_OFFSET);
    this.physics.add.overlap(this.lumi.sprite, this.bigFishSpawner.group, (_lumiObj, fishObj) => {
      this.pushLumiAway(fishObj as Phaser.Physics.Arcade.Image);
    });

    // Calamares: tercer enemigo, todavía más arriba. Dan impulsos rápidos.
    this.squidSpawner = new SquidSpawner(this, WORLD_WIDTH, START_Y - SQUID_START_OFFSET);
    this.physics.add.overlap(this.lumi.sprite, this.squidSpawner.group, () => {
      this.handleHazardHit("calamar");
    });

    // Corriente de agua: último obstáculo de la Zona 1. No es un overlap:
    // PondScene consulta su empuje cada frame (ver update()).
    this.currentZoneSpawner = new CurrentZoneSpawner(this, WORLD_WIDTH, START_Y - CURRENT_ZONE_START_OFFSET);

    // foreground_plants es la capa más cercana a cámara: va delante de
    // Lumi (como su nombre indica), no detrás. Mismo balanceo por fundido
    // que distant_plants.
    new CrossfadePlant(
      this,
      WORLD_WIDTH / 2,
      START_Y + cam.height * 0.42,
      [
        pondPlantFrameKey("foreground_plants", 1),
        pondPlantFrameKey("foreground_plants", 2),
        pondPlantFrameKey("foreground_plants", 3),
      ],
      { x: 0.5, y: 1 },
      1,
      6,
      3500,
      4000,
    );

    new BubbleField(this, cam.width, cam.height, 4.5, this.lumi.sprite);

    this.inputController = new InputController(this);

    // Posición inicial de cámara (la cámara nunca usa startFollow: la
    // gestionamos a mano en update() para que solo pueda subir, nunca
    // retroceder — ver el comentario ahí).
    cam.scrollX = this.clampScrollX(cam);
    cam.scrollY = START_Y - cam.height * 0.6;
    this.cameraCeiling = cam.scrollY;

    // Tinte de profundidad a pantalla completa: por debajo de la UI (100+)
    // pero por encima de todo lo demás, para oscurecer/aclarar la escena
    // entera según la zona sin repintar ningún asset.
    this.zoneManager = new ZoneManager(this, 50);

    this.scoreText = this.add
      .text(16, 16, "Altura: 0", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "22px",
        color: "#3a3a5a",
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.zoneText = this.add
      .text(16, 44, "Estanque", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "15px",
        color: "#5a5a7a",
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
      this.zoneManager.resize(gameSize.width, gameSize.height);
      this.gameOverText.setPosition(gameSize.width / 2, gameSize.height / 2);
    });
  }

  private clampScrollX(cam: Phaser.Cameras.Scene2D.Camera): number {
    return Phaser.Math.Clamp(this.lumi.sprite.x - cam.width / 2, 0, Math.max(0, WORLD_WIDTH - cam.width));
  }

  private static readonly DEATH_MESSAGES: Record<DeathReason, string> = {
    atras: "Te has quedado atrás...",
    medusa: "Te ha tocado una medusa...",
    tiburon: "Te ha mordido un tiburón...",
    calamar: "Un calamar te ha atrapado...",
    erizo: "Te has pinchado con un erizo...",
  };

  /** Punto de entrada de los 4 peligros letales (medusa/tiburón/calamar/
   * erizo): si hay escudo activo, lo consume y no pasa nada más; si no,
   * sigue la secuencia de muerte normal. El pez grande y la corriente NO
   * pasan por aquí — no son letales de por sí. */
  private handleHazardHit(reason: DeathReason, sourceSprite?: Phaser.GameObjects.Components.Transform) {
    if (this.isDying || this.isGameOver) return;
    if (this.time.now < this.shieldGraceUntil) return;
    if (this.hasShield) {
      this.consumeShield();
      return;
    }
    this.startDeathSequence(reason, sourceSprite);
  }

  /** El escudo absorbe un golpe: un pequeño estallido de burbujas donde
   * estaba el aura y una breve invulnerabilidad visual, pero el juego
   * sigue — no hay secuencia de muerte. */
  private consumeShield() {
    this.hasShield = false;
    this.shieldGraceUntil = this.time.now + 400;
    this.shieldAura.setVisible(false);
    this.boostBurst.explode(10, this.lumi.sprite.x, this.lumi.sprite.y);
    this.boostBurstSmall.explode(14, this.lumi.sprite.x, this.lumi.sprite.y);
  }

  /** El pez grande no mata: solo aparta a Lumi de un empujón. Un cooldown
   * corto evita que el empuje se reaplique todos los frames mientras los
   * cuerpos siguen solapados. */
  private pushLumiAway(fishSprite: Phaser.Physics.Arcade.Image) {
    if (this.isDying || this.isGameOver) return;
    if (this.time.now < this.bigFishPushCooldownUntil) return;
    this.bigFishPushCooldownUntil = this.time.now + BIG_FISH_PUSH_COOLDOWN_MS;

    const dx = this.lumi.sprite.x - fishSprite.x;
    const direction = dx === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(dx);
    this.lumi.applyKnockback(direction * BIG_FISH_PUSH_STRENGTH, -60, BIG_FISH_PUSH_COOLDOWN_MS * 0.6);
  }

  /** Antes de mostrar la pantalla de "has perdido", una animación breve de
   * Lumi (gira y se hunde encogiéndose) para que el golpe se sienta, en vez
   * de cortar directo al texto de game over. Si es una medusa, además un
   * chispazo eléctrico (rayo + parpadeo) justo al contacto — es lo que
   * distingue a la medusa de las demás causas de muerte. */
  private startDeathSequence(reason: DeathReason, sourceSprite?: Phaser.GameObjects.Components.Transform) {
    if (this.isDying || this.isGameOver) return;
    this.isDying = true;

    const sprite = this.lumi.sprite;
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);
    body.enable = false;

    if (reason === "medusa" && sourceSprite) {
      this.playElectricShock(sourceSprite.x, sourceSprite.y, sprite.x, sprite.y);
    }

    this.tweens.add({
      targets: sprite,
      angle: sprite.flipX ? -360 : 360,
      scaleX: sprite.scaleX * 0.15,
      scaleY: sprite.scaleY * 0.15,
      y: sprite.y + 40,
      alpha: 0,
      duration: 700,
      ease: "Cubic.easeIn",
      onComplete: () => this.triggerGameOver(reason),
    });
  }

  /** Rayo en zigzag entre la medusa y Lumi (Graphics, no un asset — es un
   * efecto abstracto, no arte del mundo) + un parpadeo de tinte
   * amarillo-blanco eléctrico sobre Lumi. Todo dura ~250ms, mucho menos que
   * el hundimiento que viene justo después. */
  private playElectricShock(fromX: number, fromY: number, toX: number, toY: number) {
    const graphics = this.add.graphics().setDepth(5.5);
    const segments = 6;
    const draw = () => {
      graphics.clear();
      graphics.lineStyle(6, 0xcbb8f0, 0.55);
      this.drawJaggedBolt(graphics, fromX, fromY, toX, toY, segments);
      graphics.lineStyle(3, 0xfff2a8, 0.95);
      this.drawJaggedBolt(graphics, fromX, fromY, toX, toY, segments);
    };
    draw();

    const flicker = this.time.addEvent({
      delay: 40,
      repeat: 5,
      callback: () => {
        graphics.setVisible(!graphics.visible);
        if (graphics.visible) draw();
      },
    });

    const sprite = this.lumi.sprite;
    const originalTint = sprite.tintTopLeft;
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 220,
      repeat: 2,
      yoyo: true,
      onUpdate: (tween) => {
        const v = tween.getValue() ?? 0;
        sprite.setTint(v > 0.5 ? 0xfff2a8 : originalTint);
      },
      onComplete: () => sprite.clearTint(),
    });

    this.time.delayedCall(260, () => {
      flicker.remove();
      graphics.destroy();
    });
  }

  private drawJaggedBolt(
    graphics: Phaser.GameObjects.Graphics,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    segments: number,
  ) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const length = Math.hypot(dx, dy) || 1;
    const perpX = -dy / length;
    const perpY = dx / length;

    graphics.beginPath();
    graphics.moveTo(fromX, fromY);
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const wobble = Phaser.Math.FloatBetween(-14, 14);
      graphics.lineTo(fromX + dx * t + perpX * wobble, fromY + dy * t + perpY * wobble);
    }
    graphics.lineTo(toX, toY);
    graphics.strokePath();
  }

  private triggerGameOver(reason: DeathReason = "atras") {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.physics.pause();
    const altura = Math.round(this.bestHeight / 10);
    const motivo = PondScene.DEATH_MESSAGES[reason];
    this.gameOverText.setText(`${motivo}\n\nAltura: ${altura}\n\nToca la pantalla para volver a intentarlo`);
    this.gameOverText.setVisible(true);
  }

  update(time: number, delta: number) {
    if (this.isGameOver || this.isDying) return;

    this.lumi.update(this.inputController.getVector(), delta);

    const cam = this.cameras.main;

    // El techo de cámara sube solo (a CAMERA_AUTO_RISE_SPEED) y además
    // sigue a Lumi si ella sube más rápido — lo que vaya "más arriba" (más
    // negativo) manda. La cámara solo puede subir (scrollY solo baja de
    // valor): quedarse atrás no se perdona dejando que la cámara "espere",
    // es justo lo que crea la presión de un juego de escalada infinita.
    this.cameraCeiling -= CAMERA_AUTO_RISE_SPEED * (delta / 1000);
    const desiredScrollY = this.lumi.sprite.y - cam.height * 0.6;
    this.cameraCeiling = Math.min(this.cameraCeiling, desiredScrollY);
    cam.scrollY = Math.min(cam.scrollY, this.cameraCeiling);
    cam.scrollX = this.clampScrollX(cam);

    this.skyLayer.update(cam);
    this.fishField.update(time, delta, cam.scrollY, cam.height);
    this.lilyPadSpawner.update(cam.scrollY, cam.scrollY + cam.height, time);
    this.shieldPickupSpawner.update(cam.scrollY, cam.scrollY + cam.height, time);
    this.jellyfishSpawner.update(cam.scrollY, cam.scrollY + cam.height, time);
    this.urchinSpawner.update(cam.scrollY, cam.scrollY + cam.height, time);
    this.sharkSpawner.update(cam.scrollY, cam.scrollY + cam.height, time);
    this.bigFishSpawner.update(cam.scrollY, cam.scrollY + cam.height, time);
    this.squidSpawner.update(cam.scrollY, cam.scrollY + cam.height, time);
    this.currentZoneSpawner.update(cam.scrollY, cam.scrollY + cam.height);
    this.decorSpawner.update(cam.scrollY, cam.scrollY + cam.height);

    // Corriente de agua: empuje lateral aplicado DESPUÉS del movimiento
    // propio de Lumi, así se suma a lo que el jugador ya hace en vez de
    // sustituirlo — se puede contrarrestar nadando en contra.
    const currentPush = this.currentZoneSpawner.pushAt(this.lumi.sprite.y);
    if (currentPush !== 0) {
      const body = this.lumi.sprite.body as Phaser.Physics.Arcade.Body;
      body.velocity.x += currentPush;
    }

    this.shieldAura.setPosition(this.lumi.sprite.x, this.lumi.sprite.y);

    this.bestHeight = Math.max(this.bestHeight, START_Y - this.lumi.sprite.y);
    this.scoreText.setText(`Altura: ${Math.round(this.bestHeight / 10)}`);

    const zoneBlend = this.zoneManager.update(this.lumi.sprite.y);
    this.zoneText.setText(
      zoneBlend.next ? `${zoneBlend.current.name} → ${zoneBlend.next.name}` : zoneBlend.current.name,
    );

    if (this.lumi.sprite.y > cam.scrollY + cam.height + GAME_OVER_MARGIN) {
      this.triggerGameOver();
    }
  }
}
