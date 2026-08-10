import "dotenv/config"
import { defineConfig } from "prisma/config"

// Select the datasource provider from the DATABASE_URL scheme, overridable via
// DATABASE_PROVIDER. This is what lets the same schema files drive SQLite dev
// and Postgres production with separate migration histories.
const url = process.env.DATABASE_URL ?? ""
const provider =
  process.env.DATABASE_PROVIDER === "postgresql" ||
  url.startsWith("postgresql://") ||
  url.startsWith("postgres://")
    ? "postgresql"
    : "sqlite"

const isPostgres = provider === "postgresql"

export default defineConfig({
  schema: isPostgres ? "prisma/schema.postgresql.prisma" : "prisma/schema.prisma",
  migrations: {
    path: isPostgres ? "prisma/migrations-postgresql" : "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url,
  },
})
