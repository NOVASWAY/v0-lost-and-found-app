import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createClaimSchema, validateAndSanitize } from "@/lib/validation"
import { sanitizeSearchQuery, validateRouteId, validateUrl } from "@/lib/security"

class ClaimError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

// GET all claims
export async function GET(request: NextRequest) {
  try {
    // Regular users may only ever see their own claims; staff see all claims
    // (optionally filtered by claimant).
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 100 })
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
    const validStatuses = ["pending", "approved", "released", "rejected"]
    if (status && validStatuses.includes(status)) {
      where.status = status
    }

    const isStaff = authResult.user.role === "admin" || authResult.user.role === "volunteer"
    // Users can only query their own claims; a supplied claimantId is ignored
    // for non-staff so PII can't be enumerated.
    const effectiveClaimantId = isStaff ? claimantId : authResult.user.id

    if (effectiveClaimantId) {
      const idValidation = validateRouteId(effectiveClaimantId)
      if (!idValidation.valid) {
        return NextResponse.json({ error: "Invalid claimant ID format" }, { status: 400 })
      }
      where.claimantId = effectiveClaimantId
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
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    if (authResult.user.role === "admin") {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 20 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const validation = validateAndSanitize(createClaimSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { itemId, proofImage, notes } = validation.data
    const claimantId = authResult.user.id

    // Validate proof image URL to prevent path traversal
    const urlValidation = validateUrl(proofImage)
    if (!urlValidation.valid) {
      return NextResponse.json({ error: urlValidation.error || "Invalid proof image URL" }, { status: 400 })
    }

    // Atomic transaction: check item status + create claim + update stats.
    // The Claim model has @@unique([itemId, claimantId]) so duplicate claims
    // are rejected at the DB level even if two concurrent requests pass the
    // status check.
    const claim = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id: itemId } })
      if (!item) throw new ClaimError("Item not found", 404)
      if (item.status !== "available") throw new ClaimError("Item is not available for claiming", 400)
      if (item.uploadedById === claimantId) throw new ClaimError("You cannot claim an item you uploaded", 400)

      const claimant = await tx.user.findUnique({ where: { id: claimantId } })
      if (!claimant) throw new ClaimError("Claimant not found", 404)

      const created = await tx.claim.create({
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
          claimant: { select: { id: true, name: true, username: true } },
        },
      })

      await tx.user.update({
        where: { id: claimantId },
        data: { claimsSubmitted: { increment: 1 }, vaultPoints: { increment: 25 } },
      })

      await tx.auditLog.create({
        data: {
          type: "item_claimed",
          action: "Item claimed",
          details: `Claim submitted for ${item.category}`,
          severity: "info",
          userId: claimantId,
        },
      })

      return created
    })

    return NextResponse.json({ claim, message: "Claim created successfully" })
  } catch (error) {
    if (error instanceof ClaimError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "You have already submitted a claim for this item" }, { status: 409 })
    }
    console.error("Create claim error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
