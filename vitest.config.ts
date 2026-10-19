import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    // Migrates one throwaway database and dumps it, so no test pays migration cost.
    globalSetup: ["tests/global-setup.ts"],
  },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  // PGlite ships WASM; pre-bundling it breaks the worker resolution under Vitest.
  optimizeDeps: { exclude: ["@electric-sql/pglite"] },
});
