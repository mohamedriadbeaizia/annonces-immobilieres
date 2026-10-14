import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Même alias que tsconfig.json : "@/lib/..." → "src/lib/..."
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["./tests/global-setup.ts"],
    setupFiles: ["./tests/setup.ts"],
    // Tous les fichiers de test partagent la même base : on les exécute l'un après l'autre,
    // sinon un fichier pourrait vider la base pendant qu'un autre l'utilise.
    fileParallelism: false,
  },
});