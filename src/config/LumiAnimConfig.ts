// Manifiesto de qué frames existen REALMENTE ahora mismo en
// /assets/characters/lumi/. Esto no es una lista deseada, es un reflejo
// exacto del contenido actual del disco — cuando se añadan más frames a
// una carpeta, solo hay que actualizar el número aquí, nunca inventar
// contenido en el código.
//
// swim_down y swim_left NO tienen carpeta propia: por decisión explícita
// del proyecto se derivan por código (flip) de swim_up y swim_right.
export const LUMI_FRAME_COUNT: Record<string, number> = {
  idle: 1,
  sleep: 1,
  swim_right: 1,
  swim_up: 2,
  boost: 1,
};

export const LUMI_FPS = 8; // pedido en el ejemplo de STYLE_GUIDE.md

export function framePath(folder: string, index: number): string {
  const n = String(index).padStart(2, "0");
  return `/characters/lumi/${folder}/${folder}_${n}.png`;
}

export function frameKey(folder: string, index: number): string {
  return `lumi_${folder}_${index}`;
}
