import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET all audit logs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type")
    const severity = searchParams.get("severity")
    const limit = parseInt(searchParams.get("limit") || "100")

    const where: any = {}

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    if (type) {
      where.type = type
    }

    if (severity) {
      where.severity = severity
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Get audit logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

