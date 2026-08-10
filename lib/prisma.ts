import { PrismaClient } from "@prisma/client"
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3"
import { PrismaPg } from "@prisma/adapter-pg"

// Provider is inferred from the DATABASE_URL scheme (overridable via
// DATABASE_PROVIDER) and MUST match the schema the client was generated from:
// sqlite schema -> better-sqlite3 adapter, postgresql schema -> pg adapter.
// `prisma generate` picks the schema from the same env in prisma.config.ts, so
// keep the two in sync (CI smoke test covers the postgres path).
const url = process.env.DATABASE_URL ?? ""
const isPostgres =
  process.env.DATABASE_PROVIDER === "postgresql" ||
  url.startsWith("postgresql://") ||
  url.startsWith("postgres://")

const globalForPrisma = global as unknown as { prisma: PrismaClient | null }

function createPrismaClient() {
  const adapter = isPostgres
    ? new PrismaPg({ connectionString: url })
    : new PrismaBetterSqlite3({ url })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
