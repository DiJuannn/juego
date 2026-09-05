import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "@/config/GameConfig";
import { BootScene } from "@/scenes/BootScene";
import { PondScene } from "@/scenes/PondScene";

// RESIZE (en vez de FIT) hace que el canvas ocupe siempre el contenedor
// entero, sea cual sea su proporción — con FIT, una pantalla de móvil en
// vertical dejaba franjas vacías arriba y abajo porque forzaba mantener
// la proporción 960:640 pensada para escritorio.
const game = new Phaser.Game({
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

// Bug real visto en un iPhone de verdad: Phaser.Scale.RESIZE solo escucha
// el evento "resize" de window, pero Safari en iOS no siempre lo dispara
// cuando su propia barra de herramientas aparece/desaparece o cambia de
// alto (el viewport visual cambia sin que window.innerHeight avise) — el
// canvas se quedaba con una medida vieja, dejando una franja en blanco
// entre el juego y el borde real de la pantalla. window.visualViewport sí
// se entera de estos cambios; forzar un refresh ahí es la solución
// estándar para este caso concreto de Phaser + Safari móvil.
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => game.scale.refresh());
}
