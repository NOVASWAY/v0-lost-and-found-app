// Lazy initialization to avoid client-side issues
let _prisma: any = null

function getPrisma() {
  // Client-side: return null (should not be used)
  if (typeof window !== "undefined") {
    return null
  }

  // Server-side: initialize if not already done
  if (!_prisma) {
    const { PrismaClient } = require("@prisma/client")
    const { createClient } = require("@libsql/client")
    
    const libsql = createClient({
      url: process.env.DATABASE_URL || "file:./prisma/dev.db",
    })

    _prisma = new PrismaClient({
      adapter: {
        query: libsql.execute.bind(libsql),
        execute: libsql.execute.bind(libsql),
        transaction: libsql.transaction.bind(libsql),
      } as any,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    })
  }

  return _prisma
}

// Export a getter that lazily initializes
export const prisma = new Proxy({} as any, {
  get(_target, prop) {
    const instance = getPrisma()
    if (!instance) {
      throw new Error("Prisma Client cannot be used in the browser. Use API routes instead.")
    }
    return instance[prop]
  },
})

