import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { sanitizeSearchQuery } from "@/lib/security"
import { requireAdminOrVolunteer } from "@/lib/auth-middleware"
import { safePrivateBlobDisplayUrl } from "@/lib/private-blob"

// GET all release logs
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminOrVolunteer(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const searchParams = request.nextUrl.searchParams
    const search = sanitizeSearchQuery(searchParams.get("search") || "")

    const where: Prisma.ReleaseLogWhereInput = {}

    if (search) {
      where.OR = [
        { itemName: { contains: search } },
        { volunteerName: { contains: search } },
        { claimantName: { contains: search } },
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

    const visibleLogs = logs.map((log) => {
      if (!log.claim) return log
      const claim = { ...log.claim, claimantEmail: undefined }
      return {
        ...log,
        claim: {
          ...claim,
          proofImage: safePrivateBlobDisplayUrl(claim.proofImage),
          itemImage: safePrivateBlobDisplayUrl(claim.itemImage),
          item: { ...claim.item, imageUrl: safePrivateBlobDisplayUrl(claim.item.imageUrl) },
        },
      }
    })
    return NextResponse.json(
      { logs: visibleLogs },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
  } catch (error) {
    console.error("Get release logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
