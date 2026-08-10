import { defineConfig } from "vitest/config"
import path from "node:path"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["vitest.setup.ts"],
    // Integration tests share the SQLite dev.db; run files sequentially to avoid
    // concurrent-write lock contention.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      include: ["lib/**/*.{ts,tsx}"],
      // Mock/legacy layers and client-only code are excluded: the coverage gate
      // targets the server-side security libs that guard the API.
      exclude: [
        "lib/api-client.ts",
        "lib/audit-logger.ts",
        "lib/auth-context.tsx",
        "lib/client-security.ts",
      ],
      reporter: ["text", "html"],
      thresholds: {
        statements: 85,
        lines: 85,
        branches: 80,
        functions: 75,
      },
    },
  },
})
