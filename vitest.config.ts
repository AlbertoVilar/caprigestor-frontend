import { readFileSync } from "node:fs";
import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

const coverageTypeOnlyFiles = JSON.parse(
  readFileSync(
    new URL("./coverage.type-only.json", import.meta.url),
    "utf8"
  )
) as string[];

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
        include: ["src/**/*.{ts,tsx}"],
        exclude: [
          "src/**/*.{test,spec}.{ts,tsx}",
          "src/test/setup.ts",
          ...coverageTypeOnlyFiles,
        ],
        reporter: ["text", "lcov"],
        reportsDirectory: "coverage",
        thresholds: {
          // Baseline re-established after the Vitest 4 V8 AST remapping migration
          // (2026-09-30), measured across three reproducible runs over the same
          // 252 runtime source files. Keep the ratchet just below verified output.
          statements: 35.5,
          branches: 33.9,
          functions: 34.6,
          lines: 36.3,
        },
      },
    },
  })
);
