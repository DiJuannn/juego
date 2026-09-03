import path from "node:path";
import { defineConfig } from "vite";

const rootDir = import.meta.dirname;

// El proyecto guarda el arte en /assets (no /public) para respetar la
// estructura de carpetas de STYLE_GUIDE.md. Le decimos a Vite que sirva
// ese directorio como raíz pública: un archivo en
// /assets/characters/lumi/idle/idle_01.png queda disponible en
// /characters/lumi/idle/idle_01.png tanto en dev como en el build final.
export default defineConfig({
  publicDir: "assets",
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
});
