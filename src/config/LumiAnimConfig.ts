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
export const LUMI_FRAME_COUNT: Record<string, number> = {
  idle: 3,
  sleep: 3,
  swim_right: 4,
  swim_up: 4,
  swim_diagonal: 2,
};

export const LUMI_FPS = 8; // pedido en el ejemplo de STYLE_GUIDE.md

export function framePath(folder: string, index: number): string {
  const n = String(index).padStart(2, "0");
  return `/characters/lumi/${folder}/${folder}_${n}.png`;
}

export function frameKey(folder: string, index: number): string {
  return `lumi_${folder}_${index}`;
}
