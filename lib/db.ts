import { prisma } from "./prisma"

export { prisma, withDbRetry } from "./prisma"

// Helper functions for common database operations
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import("bcryptjs")
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcryptjs")
  return bcrypt.compare(password, hash)
}
