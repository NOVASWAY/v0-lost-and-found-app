import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { refreshUserRanks } from "@/lib/ranking"
import { awardPoints } from "@/lib/points"
import { CLAIM_STATUSES } from "@/lib/domain"
import { createClaimSchema, validateAndSanitize } from "@/lib/validation"
import { assertSameOrigin, parsePagination, readJsonBody, validateRouteId } from "@/lib/security"
import { isOwnPrivateBlobUrl, safePrivateBlobDisplayUrl } from "@/lib/private-blob"

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
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 20, maxLimit: 100 })

    const where: Prisma.ClaimWhereInput = {}

    // Validate status enum
    if (status && !CLAIM_STATUSES.includes(status as (typeof CLAIM_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid claim status filter" }, { status: 400 })
    }
    if (status) where.status = status

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

    const visibleClaims = claims.map((claim) => ({
      ...claim,
      claimantEmail: undefined,
      proofImage: safePrivateBlobDisplayUrl(claim.proofImage),
      itemImage: safePrivateBlobDisplayUrl(claim.itemImage),
      item: { ...claim.item, imageUrl: safePrivateBlobDisplayUrl(claim.item.imageUrl) },
    }))

    return NextResponse.json(
      {
        claims: visibleClaims,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
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

    if (!assertSameOrigin(request)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
    }

    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 20 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const jsonBody = await readJsonBody(request)
    if (!jsonBody.ok) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const body = jsonBody.data
    const validation = validateAndSanitize(createClaimSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { itemId, proofImage } = validation.data
    const claimantId = authResult.user.id

    if (!isOwnPrivateBlobUrl(proofImage, claimantId, "claim-proof")) {
      return NextResponse.json({ error: "Claim proof must be an upload owned by the current user" }, { status: 400 })
    }

    // Item validation, claim creation, stats, points, and the audit record commit together.
    const { claim, pointsAwarded } = await prisma.$transaction(async (tx) => {
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
          claimantEmail: "",
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
        data: { claimsSubmitted: { increment: 1 } },
      })

      const pointResult = await awardPoints({
        tx,
        userId: claimantId,
        action: "claim_submitted",
        referenceId: created.id,
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

      return { claim: created, pointsAwarded: pointResult.awarded }
    })

    if (pointsAwarded) await refreshUserRanks()

    const claimWithoutSyntheticEmail = { ...claim, claimantEmail: undefined }
    const safeClaim = {
      ...claimWithoutSyntheticEmail,
      proofImage: safePrivateBlobDisplayUrl(claim.proofImage),
      itemImage: safePrivateBlobDisplayUrl(claim.itemImage),
      item: { ...claim.item, imageUrl: safePrivateBlobDisplayUrl(claim.item.imageUrl) },
    }
    const visibleClaim = authResult.user.role === "user"
      ? { ...safeClaim, item: { ...safeClaim.item, uniqueMarkings: undefined } }
      : safeClaim

    return NextResponse.json(
      { claim: visibleClaim, message: "Claim created successfully" },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
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
