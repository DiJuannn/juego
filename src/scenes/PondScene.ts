import Phaser from "phaser";
import { WORLD_HEIGHT, WORLD_WIDTH } from "@/config/GameConfig";
import { Lumi } from "@/entities/Lumi";
import { InputController } from "@/systems/InputController";
import { ParallaxLayer } from "@/systems/ParallaxLayer";
import { pondLayerKey } from "./BootScene";

export class PondScene extends Phaser.Scene {
  private lumi!: Lumi;
  private inputController!: InputController;
  private layers: ParallaxLayer[] = [];

  constructor() {
    super("Pond");
  }

  create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Capas de fondo, de la más lejana (se mueve más despacio) a la más
    // cercana (se mueve más rápido) — velocidades de STYLE_GUIDE.md.
    // foreground_plants se dibuja repetida como una franja continua (ver
    // ParallaxLayer), así que si fuera delante de Lumi la taparía casi
    // todo el rato en vez de solo "pasar por delante" ocasionalmente —
    // por eso, de momento, también va detrás. Cuando el arte se coloque
    // como matas sueltas en vez de una franja repetida, tiene sentido
    // volver a ponerla por delante.
    this.layers = [
      new ParallaxLayer(this, pondLayerKey("background_far"), 0.15, 0),
      new ParallaxLayer(this, pondLayerKey("rocks_back"), 0.35, 1),
      new ParallaxLayer(this, pondLayerKey("distant_plants"), 0.55, 2),
      new ParallaxLayer(this, pondLayerKey("lily_pads"), 0.75, 3),
      new ParallaxLayer(this, pondLayerKey("foreground_plants"), 1.15, 4),
    ];

    this.lumi = new Lumi(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    this.lumi.sprite.setDepth(5);

    this.cameras.main.startFollow(this.lumi.sprite, true, 0.08, 0.08);

    this.inputController = new InputController(this);
  }

  update() {
    this.lumi.update(this.inputController.getVector());
    for (const layer of this.layers) layer.update(this.cameras.main);
  }
}
