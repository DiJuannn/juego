import Phaser from "phaser";
import { LUMI_FPS, LUMI_FRAME_COUNT, frameKey } from "@/config/LumiAnimConfig";

/**
 * Crea una Phaser.Animation por cada carpeta de /assets/characters/lumi/
 * listada en el manifiesto (LUMI_FRAME_COUNT), usando exactamente los
 * frames que existen ahora mismo — ni uno más.
 *
 * swim_down y swim_left no tienen animación propia: se reproducen como
 * swim_up/swim_right con flip, ver Lumi.ts.
 */
export function registerLumiAnimations(scene: Phaser.Scene) {
  for (const [folder, count] of Object.entries(LUMI_FRAME_COUNT)) {
    if (scene.anims.exists(folder)) continue;
    const frames = Array.from({ length: count }, (_, i) => ({ key: frameKey(folder, i + 1) }));
    scene.anims.create({
      key: folder,
      frames,
      frameRate: LUMI_FPS,
      repeat: -1,
    });
  }

  // Nado en diagonal: reutiliza swim_up_02 (la pose ya inclinada hacia un
  // lado) como única pose base para las 4 diagonales, combinando flips en
  // Lumi.ts — mismo criterio que swim_down/swim_left, ningún frame nuevo.
  if (!scene.anims.exists("swim_diagonal")) {
    scene.anims.create({
      key: "swim_diagonal",
      frames: [{ key: frameKey("swim_up", 2) }],
      frameRate: LUMI_FPS,
      repeat: -1,
    });
  }
}
