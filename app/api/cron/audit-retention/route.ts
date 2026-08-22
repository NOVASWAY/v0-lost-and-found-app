import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const RETENTION_DAYS = 90

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 })
  }

  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)

    const { count } = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })

    return NextResponse.json({ deleted: count, retentionDays: RETENTION_DAYS })
  } catch (error) {
    console.error("[CRON] audit-log retention failed:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
