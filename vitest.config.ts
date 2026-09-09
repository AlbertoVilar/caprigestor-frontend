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
          // Baseline measured three times after F1C (2026-09-09). Keep the
          // ratchet just below the reproducible output to avoid rounding drift.
          statements: 25.3,
          branches: 59.1,
          functions: 48.1,
          lines: 25.3,
        },
      },
    },
  })
);
