import path from "node:path";
import { defineConfig } from "vite";

const rootDir = import.meta.dirname;

// El proyecto guarda el arte en /assets (no /public) para respetar la
// estructura de carpetas de STYLE_GUIDE.md. Le decimos a Vite que sirva
// ese directorio como raíz pública: un archivo en
// /assets/characters/lumi/idle/idle_01.png queda disponible en
// /characters/lumi/idle/idle_01.png tanto en dev como en el build final.
// GitHub Pages sirve el proyecto bajo /juego/ (no en la raíz del
// dominio), así que las rutas de assets/JS necesitan ese prefijo — pero
// SOLO ahí: en local (npm run dev/preview) o en cualquier otro hosting
// que sirva desde la raíz, base debe seguir siendo "/". El workflow de
// deploy (.github/workflows/deploy-pages.yml) es el único que define
// GITHUB_PAGES=true al compilar.
const base = process.env.GITHUB_PAGES ? "/juego/" : "/";

export default defineConfig({
  base,
  publicDir: "assets",
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
});
