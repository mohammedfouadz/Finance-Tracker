import { defineConfig } from "vitest/config";
import path from "path";

// Separate from vite.config.ts, whose root is client/, so tests under shared/
// and server/ are found.
export default defineConfig({
  resolve: {
    alias: {
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  test: {
    include: ["shared/**/*.test.ts", "server/**/*.test.ts"],
  },
});
