// Load .env so DB-touching tests resolve DATABASE_URL exactly like Next does
// in dev (mirrors prisma/seed.ts which imports "dotenv/config").
import "dotenv/config"
