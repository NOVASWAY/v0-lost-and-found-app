import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAdminOrVolunteer } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClaimSchema, validateAndSanitize } from "@/lib/validation"
import { sanitizeSearchQuery, validateRouteId, validateUrl } from "@/lib/security"

// GET all claims
export async function GET(request: NextRequest) {
  try {
    // Require admin or volunteer for viewing all claims
    const authResult = await requireAdminOrVolunteer(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = rateLimit(clientId, { windowMs: 60000, maxRequests: 100 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const claimantId = searchParams.get("claimantId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
    const skip = (page - 1) * limit

    const where: any = {}

    // Validate status enum
    const validStatuses = ["pending", "released", "rejected"]
    if (status && validStatuses.includes(status)) {
      where.status = status
    }

    // Validate claimantId to prevent path traversal
    if (claimantId) {
      const idValidation = validateRouteId(claimantId)
      if (!idValidation.valid) {
        return NextResponse.json({ error: "Invalid claimant ID format" }, { status: 400 })
      }
      where.claimantId = claimantId
    }

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
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
        skip,
        take: limit,
      }),
      prisma.claim.count({ where }),
    ])

    return NextResponse.json({
      claims,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get claims error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create new claim
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = rateLimit(clientId, { windowMs: 60000, maxRequests: 20 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const validation = validateAndSanitize(createClaimSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { itemId, proofImage, claimantId, notes } = validation.data

    // Validate proof image URL to prevent path traversal
    const urlValidation = validateUrl(proofImage)
    if (!urlValidation.valid) {
      return NextResponse.json({ error: urlValidation.error || "Invalid proof image URL" }, { status: 400 })
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

