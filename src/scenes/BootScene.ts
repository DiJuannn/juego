import Phaser from "phaser";
import { LUMI_FRAME_COUNT, frameKey, framePath } from "@/config/LumiAnimConfig";
import { registerLumiAnimations } from "@/systems/AnimationRegistry";
import { FISH_KEYS } from "@/systems/BackgroundFishField";
import { DECOR_KEYS } from "@/systems/BackgroundDecorSpawner";

// Capas de fondo fijas (una sola imagen). water_overlay.png no se ha
// generado todavía — se omite y se reporta, no se inventa un reemplazo.
// lily_pads.png ya no se usa como capa fija: se sustituyó por el nenúfar
// interactivo (LilyPad), ver PondScene.
const POND_LAYERS = ["background_far", "rocks_back"];
const MISSING_POND_LAYERS = ["water_overlay"];

// Algas con balanceo real: varios frames que muestran cada hoja moviéndose
// de forma independiente (no toda la imagen rotando de golpe, que se veía
// artificial). Mismo patrón de carpetas/numeración que las animaciones de
// Lumi.
export const POND_PLANT_FRAME_COUNT: Record<string, number> = {
  distant_plants: 2,
  foreground_plants: 3,
};

// Recortes de las burbujas ya dibujadas en idle_01.png (mismo arte, no
// asset nuevo) para la animación ambiental de burbujas.
const PARTICLES = ["bubble_big", "bubble_small"];

export function pondLayerKey(name: string) {
  return `pond_${name}`;
}

export function pondPlantFrameKey(folder: string, index: number) {
  return `pond_${folder}_${index}`;
}

function pondPlantFramePath(folder: string, index: number) {
  const n = String(index).padStart(2, "0");
  return `/backgrounds/pond/${folder}/${folder}_${n}.png`;
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

    for (const [folder, count] of Object.entries(POND_PLANT_FRAME_COUNT)) {
      for (let i = 1; i <= count; i++) {
        this.load.image(pondPlantFrameKey(folder, i), pondPlantFramePath(folder, i));
      }
    }

    for (const particle of PARTICLES) {
      this.load.image(particle, `/backgrounds/pond/particles/${particle}.png`);
    }

    for (const fishKey of FISH_KEYS) {
      this.load.image(fishKey, `/objects/fish/${fishKey}.png`);
    }

    this.load.image("lily_pad_01", "/objects/lily_pad/lily_pad_01.png");

    this.load.image("decor_pebble", "/objects/decor/pebble.png");
    this.load.image("decor_shell", "/objects/decor/shell.png");
    this.load.image("decor_starfish", "/objects/decor/starfish.png");

    this.load.image("jellyfish", "/objects/enemies/jellyfish.png");
    this.load.image("shark", "/objects/enemies/shark.png");
    this.load.image("squid", "/objects/enemies/squid.png");
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
