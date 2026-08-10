import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // The codebase intentionally uses `any` in its client data layer (v0-generated).
      // Keep visibility via warning; converting to strict types is tracked separately.
      "@typescript-eslint/no-explicit-any": "warn",
      // The app hydrates state from localStorage inside effects. The correct fix is
      // the server-component rewrite (tracked); warn meanwhile instead of failing CI.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "node_modules/**",
    "next-env.d.ts",
    "public/**",
    "prisma/**",
    "scripts/**",
    "*.config.{js,mjs,ts}",
    "postcss.config.mjs",
  ]),
])

export default eslintConfig
