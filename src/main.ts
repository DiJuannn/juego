import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/config/GameConfig";
import { BootScene } from "@/scenes/BootScene";
import { PondScene } from "@/scenes/PondScene";

// RESIZE (en vez de FIT) hace que el canvas ocupe siempre el contenedor
// entero, sea cual sea su proporción — con FIT, una pantalla de móvil en
// vertical dejaba franjas vacías arriba y abajo porque forzaba mantener
// la proporción 960:640 pensada para escritorio.
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#dff1f7",
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: "100%",
    height: "100%",
  },
  scene: [BootScene, PondScene],
});
