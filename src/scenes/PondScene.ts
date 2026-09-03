import Phaser from "phaser";
import { WORLD_HEIGHT, WORLD_WIDTH } from "@/config/GameConfig";
import { Lumi } from "@/entities/Lumi";
import { InputController } from "@/systems/InputController";
import { ParallaxLayer } from "@/systems/ParallaxLayer";
import { pondLayerKey } from "./BootScene";

export class PondScene extends Phaser.Scene {
  private lumi!: Lumi;
  private inputController!: InputController;
  private skyLayer!: ParallaxLayer;

  constructor() {
    super("Pond");
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // El cielo/agua de fondo es un degradado continuo: tilearlo cubre
    // cualquier tamaño de mundo sin huecos ni costuras visibles.
    this.skyLayer = new ParallaxLayer(this, pondLayerKey("background_far"), 0.15, 0);

    // El resto de capas son ilustraciones de una escena concreta (un
    // grupo de rocas, unos nenúfares…), no texturas repetibles. Se
    // colocan UNA vez, a su resolución real (WORLD_WIDTH coincide con el
    // ancho nativo del PNG), como decorado — nada de mosaico ni estirado.
    // scrollFactor < 1 en un objeto de Phaser ya produce parallax real
    // sin necesitar ningún truco manual.
    this.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT - 150, pondLayerKey("rocks_back"))
      .setOrigin(0.5, 1)
      .setScrollFactor(0.35)
      .setDepth(1);

    this.add
      .image(WORLD_WIDTH / 2, 420, pondLayerKey("lily_pads"))
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0.6)
      .setDepth(2);

    this.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT, pondLayerKey("distant_plants"))
      .setOrigin(0.5, 1)
      .setScrollFactor(0.55)
      .setDepth(3);

    this.lumi = new Lumi(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.lumi.sprite.setDepth(5);

    // foreground_plants queda detrás de Lumi por ahora: es una franja
    // continua de un borde a otro del mundo, así que delante la taparía
    // casi todo el rato en vez de solo "pasar por delante" ocasionalmente.
    this.add
      .image(WORLD_WIDTH / 2, WORLD_HEIGHT, pondLayerKey("foreground_plants"))
      .setOrigin(0.5, 1)
      .setScrollFactor(1)
      .setDepth(4);

    this.cameras.main.startFollow(this.lumi.sprite, true, 0.08, 0.08);

    this.inputController = new InputController(this);

    // Con Scale.RESIZE el canvas cambia de tamaño (p.ej. al rotar el
    // móvil): la cámara y la franja de cielo tienen que seguirle el paso.
    this.scale.on(Phaser.Scale.Events.RESIZE, (gameSize: Phaser.Structs.Size) => {
      this.cameras.main.setSize(gameSize.width, gameSize.height);
      this.skyLayer.resize(gameSize.width, gameSize.height);
    });
  }

  update() {
    this.lumi.update(this.inputController.getVector());
    this.skyLayer.update(this.cameras.main);
  }
}
