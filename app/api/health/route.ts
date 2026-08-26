import { NextResponse } from "next/server"
import { prisma, withDbRetry } from "@/lib/db"

// Public health check: reports service + database liveness without leaking data.
// Used by Vercel cron to keep Neon compute alive (prevents cold-start sleeps).
export async function GET() {
  try {
    await withDbRetry(() => prisma.$queryRaw`SELECT 1`)
    return NextResponse.json({
      status: "ok",
      db: "up",
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        db: "down",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}
