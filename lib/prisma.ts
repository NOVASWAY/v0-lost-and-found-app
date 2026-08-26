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

// --- Neon cold-start retry helper ---
// Neon Free plan scales compute to zero after 5 min idle. The first query after
// sleep takes 1-5s and may fail with connection errors. This helper retries
// transient failures with exponential backoff so the app stays resilient.

const RETRYABLE_ERROR_CODES = new Set([
  "P1001", // Can't reach database server
  "P1017", // Server has closed the connection unexpectedly
])

const RETRYABLE_MESSAGES = [
  "ECONNREFUSED",
  "ETIMEOUT",
  "ECONNRESET",
  "ETIMEDOUT",
  "Connection terminated unexpectedly",
  "server closed the connection unexpectedly",
]

function isRetryableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false

  const code = (error as { code?: string }).code
  if (code && RETRYABLE_ERROR_CODES.has(code)) return true

  const message = String((error as { message?: string }).message ?? "")
  return RETRYABLE_MESSAGES.some((m) => message.includes(m))
}

/**
 * Execute an async function with retry on transient database errors.
 * Retries up to `maxAttempts` times with exponential backoff.
 */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 200,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts && isRetryableError(error)) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
      } else {
        throw error
      }
    }
  }
  throw lastError
}
