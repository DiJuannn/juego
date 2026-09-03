import Phaser from "phaser";

/**
 * Escena de arranque: comprueba que el pipeline de /assets funciona de
 * extremo a extremo (Vite sirve el archivo, Phaser lo carga y lo pinta).
 *
 * A propósito NO reproduce ninguna animación todavía — eso es la siguiente
 * tarea del roadmap ("cargar y reproducir animación idle"). Aquí solo se
 * muestra un frame real y estático tal cual viene del asset.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    this.load.image("lumi_idle_01", "/characters/lumi/idle/idle_01.png");
  }

  create() {
    this.add.image(this.scale.width / 2, this.scale.height / 2, "lumi_idle_01");
  }
}
