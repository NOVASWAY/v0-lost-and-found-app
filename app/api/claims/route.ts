import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET all claims
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const claimantId = searchParams.get("claimantId")

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (claimantId) {
      where.claimantId = claimantId
    }

    const claims = await prisma.claim.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            category: true,
            imageUrl: true,
            location: true,
            dateFounded: true,
          },
        },
        claimant: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { claimedAt: "desc" },
    })

    return NextResponse.json({ claims })
  } catch (error) {
    console.error("Get claims error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create new claim
export async function POST(request: NextRequest) {
  try {
    const { itemId, proofImage, claimantId, notes } = await request.json()

    if (!itemId || !proofImage || !claimantId) {
      return NextResponse.json({ error: "Required fields are missing" }, { status: 400 })
    }

    // Check if item exists and is available
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    if (item.status !== "available") {
      return NextResponse.json({ error: "Item is not available for claiming" }, { status: 400 })
    }

    // Get claimant info
    const claimant = await prisma.user.findUnique({
      where: { id: claimantId },
    })

    if (!claimant) {
      return NextResponse.json({ error: "Claimant not found" }, { status: 404 })
    }

    // Create claim
    const claim = await prisma.claim.create({
      data: {
        itemId,
        itemName: item.category,
        itemImage: item.imageUrl,
        proofImage,
        claimantName: claimant.name,
        claimantEmail: `${claimant.username}@vault.church`,
        claimantId,
        status: "pending",
      },
      include: {
        item: true,
        claimant: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    })

    // Update item status
    await prisma.item.update({
      where: { id: itemId },
      data: { status: "claimed" },
    })

    // Update user stats
    await prisma.user.update({
      where: { id: claimantId },
      data: {
        claimsSubmitted: { increment: 1 },
        vaultPoints: { increment: 25 },
      },
    })

    // Add audit log
    await prisma.auditLog.create({
      data: {
        type: "item_claimed",
        action: "Item claimed",
        details: `Claim submitted for ${item.category}`,
        severity: "info",
        userId: claimantId,
      },
    })

    return NextResponse.json({ claim, message: "Claim created successfully" })
  } catch (error) {
    console.error("Create claim error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

