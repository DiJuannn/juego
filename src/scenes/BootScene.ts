import Phaser from "phaser";
import { LUMI_FRAME_COUNT, frameKey, framePath } from "@/config/LumiAnimConfig";
import { registerLumiAnimations } from "@/systems/AnimationRegistry";

// Capas de fondo que existen ahora mismo en /assets/backgrounds/pond/.
// water_overlay.png no se ha generado todavía — se omite y se reporta,
// no se inventa un reemplazo.
const POND_LAYERS = ["background_far", "rocks_back", "distant_plants", "lily_pads", "foreground_plants"];
const MISSING_POND_LAYERS = ["water_overlay"];

// Recortes de las burbujas ya dibujadas en idle_01.png (mismo arte, no
// asset nuevo) para la animación ambiental de burbujas.
const PARTICLES = ["bubble_big", "bubble_small"];

export function pondLayerKey(name: string) {
  return `pond_${name}`;
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    for (const [folder, count] of Object.entries(LUMI_FRAME_COUNT)) {
      for (let i = 1; i <= count; i++) {
        this.load.image(frameKey(folder, i), framePath(folder, i));
      }
    }

    for (const layer of POND_LAYERS) {
      this.load.image(pondLayerKey(layer), `/backgrounds/pond/${layer}.png`);
    }

    for (const particle of PARTICLES) {
      this.load.image(particle, `/backgrounds/pond/particles/${particle}.png`);
    }
  }

  create() {
    for (const missing of MISSING_POND_LAYERS) {
      // eslint-disable-next-line no-console
      console.warn(`MISSING asset: /assets/backgrounds/pond/${missing}.png (reportado, no se genera un reemplazo)`);
    }

    registerLumiAnimations(this);
    this.scene.start("Pond");
  }
}
