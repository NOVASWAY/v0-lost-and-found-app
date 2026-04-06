import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { Pool } from "@neondatabase/serverless"

// Create a single PrismaClient instance for the entire app
// This prevents multiple instances from being created during hot-reload in development
const globalForPrisma = global as unknown as { prisma: PrismaClient | null }

// Check if using mock mode (disconnected from database)
const USE_MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"
const HAS_DATABASE_URL = typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.length > 0

let prismaClient: PrismaClient | null = null

if (!USE_MOCK_MODE && HAS_DATABASE_URL) {
  try {
    const connectionString = process.env.DATABASE_URL

    prismaClient =
      globalForPrisma.prisma ||
      new PrismaClient({
        adapter: new PrismaNeon(
          new Pool({ connectionString } as any) as any
        ),
        log:
          process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
      })

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaClient
    }
  } catch (error) {
    console.error("[v0] Failed to initialize Prisma with Neon adapter:", error)
    // Fall back to null if initialization fails
    prismaClient = null
  }
}

// Flag to indicate if we're in mock mode
export const isMockMode = USE_MOCK_MODE || !HAS_DATABASE_URL

if (!isMockMode && !prismaClient) {
  throw new Error("Prisma client not initialized. Check DATABASE_URL and Neon adapter configuration.")
}

// `prismaClient` is only nullable when in mock mode / misconfiguration.
// For production builds we fail fast above so this cast is safe.
export const prisma = prismaClient as PrismaClient
