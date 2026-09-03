import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/config/GameConfig";
import { BootScene } from "@/scenes/BootScene";
import { PondScene } from "@/scenes/PondScene";

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
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PondScene],
});
