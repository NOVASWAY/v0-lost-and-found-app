import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Public health check: reports service + database liveness without leaking data.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
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
