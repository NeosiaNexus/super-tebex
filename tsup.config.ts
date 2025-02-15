import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"], // ✅ Générer CommonJS et ESM
  dts: {
    resolve: true, // ✅ Corrige la résolution des types
  },
  splitting: false,
  sourcemap: false,
  clean: true,
  shims: true, // ✅ Ajoute les shims pour la compatibilité des modules
});
