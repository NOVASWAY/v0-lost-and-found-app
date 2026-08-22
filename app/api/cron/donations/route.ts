import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  // Verify this is a legitimate Vercel Cron request
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!prisma) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 })
  }

  try {
    // Find items that are still "available" but past their donation deadline.
    // These were never claimed or donated within the 30-day window.
    const now = new Date()
    const expiredItems = await prisma.item.findMany({
      where: {
        status: "available",
        donationDeadline: { lt: now },
      },
      select: { id: true, category: true },
    })

    if (expiredItems.length === 0) {
      return NextResponse.json({ expired: 0 })
    }

    // Mark expired items
    const ids = expiredItems.map((i) => i.id)
    await prisma.item.updateMany({
      where: { id: { in: ids } },
      data: { status: "expired" },
    })

    // Audit-log the bulk expiry
    await prisma.auditLog.create({
      data: {
        type: "donation_expired",
        action: "bulk_expiry",
        details: `${expiredItems.length} item(s) expired: ${expiredItems.map((i) => i.id).join(", ")}`,
        severity: "info",
      },
    })

    return NextResponse.json({ expired: expiredItems.length, ids })
  } catch (error) {
    console.error("[CRON] donation expiry failed:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
