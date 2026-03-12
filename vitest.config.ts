import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    globalSetup: ["./src/__tests__/global-setup.ts"],
    setupFiles: ["./src/__tests__/setup.ts"],
    testTimeout: 30000,
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
