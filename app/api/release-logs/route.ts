import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sanitizeSearchQuery } from "@/lib/security"
import { requireAdminOrVolunteer } from "@/lib/auth-middleware"

// GET all release logs
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminOrVolunteer(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const searchParams = request.nextUrl.searchParams
    const search = sanitizeSearchQuery(searchParams.get("search") || "")

    const where: any = {}

    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: "insensitive" } },
        { volunteerName: { contains: search, mode: "insensitive" } },
        { claimantName: { contains: search, mode: "insensitive" } },
      ]
    }

    const logs = await prisma.releaseLog.findMany({
      where,
      include: {
        volunteer: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        claim: {
          include: {
            item: {
              select: {
                id: true,
                category: true,
                imageUrl: true,
              },
            },
          },
        },
      },
      orderBy: { timestamp: "desc" },
    })

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Get release logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
