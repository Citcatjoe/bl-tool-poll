import { defineConfig } from "vite";

export default defineConfig({
  base: "./", // Remplace par '/ton-dossier/' si ton site est dans un sous-dossier
  build: {
    outDir: "dist",
    assetsDir: "assets", // Où les fichiers générés (CSS, JS) sont stockés
  },
});
