import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sanitizeSearchQuery } from "@/lib/security"
import { requireAdminOrVolunteer } from "@/lib/auth-middleware"
import { toProxiedMediaUrl } from "@/lib/media"

// GET all release logs
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminOrVolunteer(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const searchParams = request.nextUrl.searchParams
    const search = sanitizeSearchQuery(searchParams.get("search") || "")

    const where: Record<string, unknown> = {}

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

    const proxied = logs.map((log) => ({
      ...log,
      claim: log.claim
        ? {
            ...log.claim,
            item: log.claim.item
              ? {
                  ...log.claim.item,
                  imageUrl: toProxiedMediaUrl(log.claim.item.imageUrl),
                }
              : log.claim.item,
          }
        : log.claim,
    }))

    return NextResponse.json({ logs: proxied })
  } catch (error) {
    console.error("Get release logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
