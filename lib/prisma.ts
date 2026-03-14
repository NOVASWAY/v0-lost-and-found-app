import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { Pool } from "@neondatabase/serverless"

// Create a single PrismaClient instance for the entire app
// This prevents multiple instances from being created during hot-reload in development
const globalForPrisma = global as unknown as { prisma: PrismaClient | null }

// Check if using mock mode (disconnected from database)
const USE_MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

let prismaClient: PrismaClient | null = null

if (!USE_MOCK_MODE && process.env.DATABASE_URL) {
  const connectionString = process.env.DATABASE_URL || ""

  prismaClient =
    globalForPrisma.prisma ||
    new PrismaClient({
      adapter: new PrismaNeon(
        new Pool({ connectionString: connectionString as string })
      ),
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    })

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaClient
}

export const prisma = prismaClient as any

// Flag to indicate if we're in mock mode
export const isMockMode = USE_MOCK_MODE || !process.env.DATABASE_URL
