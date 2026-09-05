// GitHub Pages sirve el proyecto bajo /juego/, no en la raíz del dominio
// (ver vite.config.ts). Vite ya conoce ese prefijo en tiempo de build
// (import.meta.env.BASE_URL, fijado por `base`), pero solo lo aplica
// automáticamente a lo que él mismo procesa (imports de JS/CSS) — las
// rutas de carga de Phaser son strings sueltos en tiempo de ejecución, así
// que hay que anteponer el prefijo a mano con esta función en cualquier
// sitio que construya una ruta de asset para `this.load.image(...)`.
export function assetPath(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, "");
}
