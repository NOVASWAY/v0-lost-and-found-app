import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET all release logs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""

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

