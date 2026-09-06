import { assetPath } from "@/config/assetPath";

// Manifiesto de qué frames existen REALMENTE ahora mismo en
// /assets/characters/lumi/. Esto no es una lista deseada, es un reflejo
// exacto del contenido actual del disco — cuando se añadan más frames a
// una carpeta, solo hay que actualizar el número aquí, nunca inventar
// contenido en el código.
//
// swim_down y swim_left NO tienen carpeta propia: por decisión explícita
// del proyecto se derivan por código (flip) de swim_up y swim_right. Las
// diagonales usan su propia carpeta swim_diagonal (pose dedicada, ya no un
// flip reciclado de swim_up), y también se derivan entre sí por flip.
//
// boost/ ya no se usa: la pose dedicada no convencía, el impulso del
// nenúfar ahora reutiliza la animación swim_up (ver Lumi.ts). El archivo
// se queda en disco por si se retoma más adelante, solo se quitó de aquí.
//
// idle bajó de 4 a 3: el idle_02 original tenía la cola completamente hacia
// el lado izquierdo (asimétrica respecto a los otros 3, que la llevan más
// centrada) y se veía raro en el ciclo — se quitó del todo y se
// renumeraron los que quedaban (el antiguo idle_03 pasó a ser idle_02, etc).
//
// swim_diagonal subió de 2 a 4: con solo 2 frames (que apenas variaban la
// cola) el crossfade entre ellos se notaba como un "salto" pese al fundido
// de alpha — pedido explícito de más animación de BRAZOS. Los 2 frames
// nuevos (ahora _02 y _04) alternan brazos adelante/atrás en un ciclo de
// brazada; el antiguo _02 pasó a ser _03.
//
// idle/swim_right/swim_up/swim_diagonal llegaron a duplicar su número de
// frames en una ronda posterior (interpolación con Gemini para un
// movimiento más fluido), pero el usuario pidió revertirlo explícitamente
// ("El de estado base déjalo igual que estaba antes... Los frames de
// LUMI. ASÍ ESTABAN PERFECTOS DÉJALO TODO COMO ANTES") — así que estas 4
// animaciones están de vuelta en su número de frames original.
//
// dash: pedido explícito ("si haces dos veces una misma dirección hace un
// Dash... hay que agregarle como un Sprite animado de él haciendo el
// Dash"), y el único añadido de esa ronda que SÍ se queda ("el Dash si me
// gustó déjalo"). Pose nueva (no interpolada de ninguna existente): Lumi
// estirada como una flecha/torpedo, brazos pegados al cuerpo, cola recta y
// rígida, con líneas de velocidad — vista diagonal desde atrás, mismo
// ángulo de cámara que swim_up para que la rotación por código (ver
// Lumi.ts) quede coherente en las 8 direcciones. 3 frames (vibración sutil
// de cola/estela por la velocidad, no una brazada completa) a un
// framerate más vivo que el resto, ver LUMI_ANIM_FPS.
export const LUMI_FRAME_COUNT: Record<string, number> = {
  idle: 3,
  sleep: 3,
  swim_right: 4,
  swim_up: 4,
  swim_diagonal: 4,
  dash: 3,
  // Un solo frame: la pose de muerte (ojos en X, generada con Gemini, ver
  // lumi-asset-gen) no es una animación en bucle — se pone como textura
  // fija justo al empezar el giro/hundimiento (ver Lumi.showDeathFace).
  death: 1,
  // Igual que death: un solo frame fijo, expresión de susto/sorpresa
  // (ojos muy abiertos, boca en O, bracitos encogidos) generada con Gemini
  // para el momento exacto en que la almeja gigante la atrapa — pedido
  // explícito: "lumi haz otro Sprite de siendo comido por la almeja, que
  // tenga relación" (no reutilizar el sprite de muerte genérico de ojos en
  // X para este caso). Ver Lumi.prepareForDeath y PondScene.startDeathSequence.
  eaten: 1,
};

export const LUMI_FPS = 8; // pedido en el ejemplo de STYLE_GUIDE.md

// Excepción por animación al LUMI_FPS por defecto — solo "dash" la usa
// (ver comentario de LUMI_FRAME_COUNT); idle/swim_* volvieron a LUMI_FPS
// sin excepción tras revertir el intento de duplicar sus frames.
export const LUMI_ANIM_FPS: Partial<Record<string, number>> = {
  dash: 20,
};

export function framePath(folder: string, index: number): string {
  const n = String(index).padStart(2, "0");
  return assetPath(`/characters/lumi/${folder}/${folder}_${n}.png`);
}

export function frameKey(folder: string, index: number): string {
  return `lumi_${folder}_${index}`;
}
