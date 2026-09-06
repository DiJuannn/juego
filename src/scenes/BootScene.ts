import Phaser from "phaser";
import { assetPath } from "@/config/assetPath";
import { LUMI_FRAME_COUNT, frameKey, framePath } from "@/config/LumiAnimConfig";
import { registerLumiAnimations } from "@/systems/AnimationRegistry";
import { FISH_KEYS } from "@/systems/BackgroundFishField";

// Capas de fondo fijas (una sola imagen). water_overlay.png no se ha
// generado todavía — se omite y se reporta, no se inventa un reemplazo.
// lily_pads.png ya no se usa como capa fija: se sustituyó por el nenúfar
// interactivo (LilyPad), ver PondScene.
// background_shallow/mid/deep: rediseño del fondo de cielo/agua (pedido
// explícito del usuario: "reestructurémoslo todo... te dejo el control
// creativo a ti"). El anterior (background_far, un solo haz de luz bajando
// desde arriba) resistía el tileado vertical infinito por diseño — un
// degradado direccional no puede repetirse sin costura, por bien que se le
// ajusten los bordes (ver PROGRESS.md, ronda del "empalme"). Los tres
// nuevos son manchas de acuarela sin foco de luz ni horizonte (ver
// ParallaxLayer, que hace crossfade entre ellos según la altura).
// background_abyss: 4ª variante para las alturas nuevas (pedido explícito
// "hazas fondos para más arriba" tras extender mucho el recorrido
// escalable) — mismo estilo, más oscura, se cruza justo antes de la Zona 4
// "Aguas profundas" del tinte de ZoneConfig.
const POND_LAYERS = [
  "background_shallow",
  "background_mid",
  "background_deep",
  "background_abyss",
  "rocks_back",
];
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
  return assetPath(`/backgrounds/pond/${folder}/${folder}_${n}.png`);
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
      this.load.image(pondLayerKey(layer), assetPath(`/backgrounds/pond/${layer}.png`));
    }

    for (const [folder, count] of Object.entries(POND_PLANT_FRAME_COUNT)) {
      for (let i = 1; i <= count; i++) {
        this.load.image(pondPlantFrameKey(folder, i), pondPlantFramePath(folder, i));
      }
    }

    for (const particle of PARTICLES) {
      this.load.image(particle, assetPath(`/backgrounds/pond/particles/${particle}.png`));
    }

    for (const fishKey of FISH_KEYS) {
      this.load.image(fishKey, assetPath(`/objects/fish/${fishKey}.png`));
    }
    // Parpadeo del pez grande (reutiliza fish_05, ver BigFish): mismo
    // criterio que el resto de criaturas, arte de verdad, no Graphics.
    this.load.image("fish_05_blink", assetPath("/objects/fish/fish_05_blink.png"));

    this.load.image("lily_pad_01", assetPath("/objects/lily_pad/lily_pad_01.png"));

    this.load.image("decor_pebble", assetPath("/objects/decor/pebble.png"));
    this.load.image("decor_starfish", assetPath("/objects/decor/starfish.png"));
    // Pieza nueva de arrecife (pedido explícito): reutiliza un asset ya
    // aprobado en estilo que se había quedado sin usar (ver PROGRESS.md,
    // antes decoración ambiental aleatoria, ahora obstáculo real de nivel).
    this.load.image("decor_shell", assetPath("/objects/decor/shell.png"));

    this.load.image("jellyfish", assetPath("/objects/enemies/jellyfish.png"));
    this.load.image("shark", assetPath("/objects/enemies/shark.png"));
    this.load.image("squid", assetPath("/objects/enemies/squid.png"));
    this.load.image("urchin", assetPath("/objects/enemies/urchin.png"));
    // 2 tipos nuevos de erizo (pedido explícito: "haz más erizos de otros
    // tipos") pensados para colocarse en columna vertical — ver
    // entities/Urchin.ts.
    this.load.image("urchin_long", assetPath("/objects/enemies/urchin_long.png"));
    this.load.image("urchin_round", assetPath("/objects/enemies/urchin_round.png"));
    this.load.image("coral", assetPath("/objects/enemies/coral.png"));
    // Sexto enemigo (pedido explícito: "veas qué nuevos enemigos hacer"),
    // ver entities/Crab.ts.
    this.load.image("crab", assetPath("/objects/enemies/crab.png"));
    this.load.image("crab_blink", assetPath("/objects/enemies/crab_blink.png"));
    // Séptimo enemigo (pedido explícito: "crea más animales... la almeja
    // podrías crearle una animación y que te coma"), ver entities/GiantClam.ts.
    this.load.image("giant_clam", assetPath("/objects/enemies/giant_clam.png"));
    this.load.image("giant_clam_closed", assetPath("/objects/enemies/giant_clam_closed.png"));
    // Noveno enemigo (pedido explícito: "GENÉRAME MUCHOS MÁS ANIMALES"),
    // ver entities/Seahorse.ts.
    this.load.image("seahorse", assetPath("/objects/enemies/seahorse.png"));
    this.load.image("seahorse_blink", assetPath("/objects/enemies/seahorse_blink.png"));
    // Pedido explícito: "el caballito de mar... esté animado con Gemini" —
    // segunda pose real (no un blink, un frame de impulso de nado: cola
    // estirada en vez de enroscada, cuerpo inclinado) para alternar con la
    // pose base mientras gira en círculos, ver entities/Seahorse.ts.
    this.load.image("seahorse_swim", assetPath("/objects/enemies/seahorse_swim.png"));
    // Undécimo enemigo (pedido explícito: "CREA MÁS ANIMALES MÁS MÁS...con
    // animación de que muevan por el mapa"), ver entities/MantaRay.ts.
    this.load.image("mantaray", assetPath("/objects/enemies/mantaray.png"));
    // Duodécimo enemigo, mismo pedido — ver entities/FlyingFish.ts.
    this.load.image("flyingfish", assetPath("/objects/enemies/flyingfish.png"));
    // Decimotercer enemigo (pedido explícito, con dos correcciones: "un
    // dragón marino Largo que vaya... de lado a lado... que deje un hueco
    // justo para que pase Lumi por ahí" → "que sea horizontal" → "que
    // ESTE COMPLETO [no lo recortes]... QUE VAYA LATERALMENTE TAPANDO
    // TODO PERO SIEMPRE QUE DEJE UN ESPACIO POR DONDE PASAR") — UN solo
    // sprite con la ilustración entera, sin cortar en piezas, ver
    // entities/SeaDragon.ts.
    this.load.image("sea_dragon", assetPath("/objects/enemies/sea_dragon.png"));
    // Librería de piezas para ReefCluster (composiciones orgánicas de
    // obstáculos de Zona 1, ver systems/ReefCluster.ts). Tercera tanda,
    // generada directamente a partir de las 3 imágenes de referencia que
    // el usuario subió a /reference (rama de roca cubierta de coral de
    // colores + cúmulo de rocas redondeadas con musgo y acentos de coral)
    // — las dos tandas anteriores (salmón puro, luego roca oscura casi sin
    // coral) fueron rechazadas por no parecerse a esas referencias.
    this.load.image("reef_coral_branch", assetPath("/objects/reef/coral_branch.png"));
    this.load.image("reef_boulder_rock", assetPath("/objects/reef/boulder_rock.png"));
    // Familia de variantes de "repisa/rama" (mismo ancla de estilo que
    // reef_coral_branch, generadas a partir de ella) — pedido explícito
    // del usuario: muchas formas distintas de la misma idea, no repetir
    // siempre la misma silueta.
    this.load.image("reef_branch_straight", assetPath("/objects/reef/branch_straight.png"));
    // reef_branch_hook y anemone (más abajo) ya no se usan en ningún
    // ReefTemplates.ts — retiradas por pedido explícito ("no me convence
    // estos diseños"), pero se dejan cargadas por si hay que revertir.
    this.load.image("reef_branch_hook", assetPath("/objects/reef/branch_hook.png"));
    this.load.image("reef_branch_short", assetPath("/objects/reef/branch_short.png"));
    this.load.image("anemone", assetPath("/objects/reef/anemone.png"));
    // Ronda de "muchos más obstáculos" (pedido explícito): 4 piezas nuevas,
    // todas diseñadas sin base/silueta de "apoyado en el suelo" para que
    // se lean bien en cualquier lateral.
    this.load.image("coral_fan", assetPath("/objects/reef/coral_fan.png"));
    this.load.image("sponge", assetPath("/objects/reef/sponge.png"));
    this.load.image("barnacle", assetPath("/objects/reef/barnacle.png"));
    // Pedido explícito: "crea diferentes estilos de rocas... de distintos
    // tamaños, más largas tmb pueden ser" — más variedad para la pieza de
    // pared lateral (antes SIEMPRE reef_boulder_rock, ver ReefTemplates.ts
    // WALL_PIECE_POOL). Mismas anclas de estilo (boulder_rock + rocks_back)
    // para mantener la paleta piedra gris-lavanda + musgo + acento de coral.
    this.load.image("reef_rock_slab", assetPath("/objects/reef/rock_slab.png"));
    this.load.image("reef_rock_smooth", assetPath("/objects/reef/rock_boulder_smooth.png"));
    // Pieza exclusiva del segundo laberinto (grandMaze, ver
    // ReefTemplates.ts). Segunda versión (pedido explícito: "que no sean
    // rocas... como los laberintos reales pues de hojas, pero acuático"):
    // un seto denso de hojas/algas generado con Gemini a partir de las
    // mismas anclas de estilo que foreground_plants, no de las rocas.
    this.load.image("reef_maze_wall", assetPath("/objects/reef/maze_wall.png"));
    // 2 estilos de muro más (pedido explícito: "crea con Gemini distintos
    // laberintos... que sean así como los que tenemos pero diferentes") —
    // ver shellMaze/spongeMaze en ReefTemplates.ts.
    this.load.image("reef_maze_wall_shell", assetPath("/objects/reef/maze_wall_shell.png"));
    this.load.image("reef_maze_wall_sponge", assetPath("/objects/reef/maze_wall_sponge.png"));
    // Pedido explícito: "crea más rocas o pinchos en forma de obstáculo" —
    // cúmulo de rocas puntiagudas, silueta bien distinta de las otras 3
    // (redondeadas/planas) para que se note como una pieza nueva de verdad.
    this.load.image("reef_rock_spikes", assetPath("/objects/reef/rock_spikes.png"));
    // Pedido explícito: "en vez de esos obstáculos [ramas/coral] haya más
    // obstáculos de los pinchos de piedra que son más bonitos... crea
    // variaciones" — 2 siluetas nuevas del mismo pincho (picos altos y
    // torcidos / cresta baja y ancha), ver WALL_PIECE_POOL en
    // ReefTemplates.ts. rock_spikes_c (la cresta ancha) es solo para
    // WALL_PIECE_POOL, nunca para un corredor de laberinto — su proporción
    // tan ancha dispararía la extensión a lo largo de la pared muy por
    // encima del margen ya calculado (ver CORRIDOR_WALL_POOL).
    this.load.image("reef_rock_spikes_b", assetPath("/objects/reef/rock_spikes_b.png"));
    this.load.image("reef_rock_spikes_c", assetPath("/objects/reef/rock_spikes_c.png"));
    // Parpadeo: arte de verdad (ojos cerrados) generado con Gemini a partir
    // de cada sprite base, ver systems/BlinkTimer — nunca un Graphics
    // dibujado por código.
    this.load.image("jellyfish_blink", assetPath("/objects/enemies/jellyfish_blink.png"));
    this.load.image("shark_blink", assetPath("/objects/enemies/shark_blink.png"));
    this.load.image("squid_blink", assetPath("/objects/enemies/squid_blink.png"));
    this.load.image("urchin_blink", assetPath("/objects/enemies/urchin_blink.png"));
    this.load.image("shield_bubble", assetPath("/objects/powerups/shield_bubble.png"));
    this.load.image("coin", assetPath("/objects/powerups/coin.png"));
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
