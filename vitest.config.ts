import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      environment: "node",
      globals: true,
      setupFiles: ["src/test/setup.ts"],
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov"],
        reportsDirectory: "coverage",
        thresholds: {
          // Baseline measured three times after F1A (2026-09-09). Keep the
          // ratchet just below the reproducible output to avoid rounding drift.
          statements: 23.9,
          branches: 56.0,
          functions: 43.7,
          lines: 23.9,
        },
      },
    },
  })
);
