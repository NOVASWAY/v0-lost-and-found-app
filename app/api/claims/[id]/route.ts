import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { assertSameOrigin, readJsonBody, validateRouteId } from "@/lib/security"
import { requireAdminOrVolunteer, requireAuth } from "@/lib/auth-middleware"
import { updateClaimSchema, validateAndSanitize } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { refreshUserRanks } from "@/lib/ranking"
import { awardPoints } from "@/lib/points"
import { canTransitionClaimStatus, isClaimStatus } from "@/lib/domain"

class ClaimUpdateError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

// GET claim by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id } = await params
    
    // Validate ID to prevent path traversal
    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        item: true,
        claimant: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        releaseLog: true,
      },
    })

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    // Admin/Volunteer can view any claim; regular users can only view their own.
    if (authResult.user.role === "user" && claim.claimantId !== authResult.user.id) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    const { claimantEmail: _claimantEmail, ...visibleClaim } = claim
    const claimForViewer = authResult.user.role === "user"
      ? {
          ...visibleClaim,
          item: (({ uniqueMarkings: _uniqueMarkings, ...item }) => item)(claim.item),
        }
      : visibleClaim

    return NextResponse.json(
      { claim: claimForViewer },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
  } catch (error) {
    console.error("Get claim error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH update claim (for releasing)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdminOrVolunteer(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!assertSameOrigin(request)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
    }

    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 20 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    const { id } = await params

    // Validate ID to prevent path traversal
    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }

    const jsonBody = await readJsonBody(request)
    if (!jsonBody.ok) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const data = jsonBody.data
    const validation = validateAndSanitize(updateClaimSchema, data)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const actorId = authResult.user.id
    const { status, releaseNotes } = validation.data

    const { updatedClaim, pointsAwarded } = await prisma.$transaction(async (tx) => {
      const claim = await tx.claim.findUnique({ where: { id }, include: { item: true } })
      if (!claim) throw new ClaimUpdateError("Claim not found", 404)

      if (status && (!isClaimStatus(claim.status) || !canTransitionClaimStatus(claim.status, status))) {
        throw new ClaimUpdateError(
          `Cannot transition claim from "${claim.status}" to "${status}"`,
          400,
        )
      }

      const updateData: Prisma.ClaimUpdateManyMutationInput = {}
      if (status) updateData.status = status
      if (releaseNotes !== undefined) updateData.releaseNotes = releaseNotes
      if (status === "released") {
        updateData.releasedBy = actorId
        updateData.releasedAt = new Date()
      }

      if (status === "approved") {
        const existingApproved = await tx.claim.findFirst({
          where: { itemId: claim.itemId, status: "approved", id: { not: id } },
          select: { id: true },
        })
        if (existingApproved) {
          throw new ClaimUpdateError("Another claim on this item is already approved", 409)
        }

        const itemLock = await tx.item.updateMany({
          where: { id: claim.itemId, status: "available" },
          data: { status: "claimed" },
        })
        if (itemLock.count !== 1) {
          throw new ClaimUpdateError("Item is no longer available", 409)
        }
      }

      if (status === "rejected" && claim.status === "approved") {
        const itemRelease = await tx.item.updateMany({
          where: { id: claim.itemId, status: "claimed" },
          data: { status: "available" },
        })
        if (itemRelease.count !== 1) {
          throw new ClaimUpdateError("Item state changed before the claim could be rejected", 409)
        }
      }

      const claimUpdate = await tx.claim.updateMany({
        where: { id, status: claim.status },
        data: updateData,
      })
      if (claimUpdate.count !== 1) {
        throw new ClaimUpdateError("Claim changed before the update could be applied", 409)
      }

      let pointsAwarded = false
      if (status === "released") {
        const itemRelease = await tx.item.updateMany({
          where: { id: claim.itemId, status: "claimed" },
          data: { status: "released" },
        })
        if (itemRelease.count !== 1) {
          throw new ClaimUpdateError("Item state changed before release", 409)
        }

        await tx.releaseLog.create({
          data: {
            itemId: claim.itemId,
            itemName: claim.itemName,
            claimantName: claim.claimantName,
            volunteerName: authResult.user.name,
            notes: releaseNotes?.trim() || "Item released to claimant",
            claimId: claim.id,
            volunteerId: actorId,
          },
        })

        const pointResult = await awardPoints({
          tx,
          userId: claim.claimantId,
          action: "item_released",
          referenceId: claim.id,
        })
        pointsAwarded = pointResult.awarded

        await tx.auditLog.create({
          data: {
            type: "item_released",
            action: "Item released",
            details: `${claim.itemName} released to ${claim.claimantName}`,
            severity: "info",
            userId: actorId,
          },
        })
      }

      const updatedClaim = await tx.claim.findUnique({
        where: { id },
        include: { item: true, claimant: { select: { id: true, name: true, username: true } } },
      })
      if (!updatedClaim) throw new ClaimUpdateError("Claim not found", 404)

      return { updatedClaim, pointsAwarded }
    })

    if (pointsAwarded) await refreshUserRanks()

    const { claimantEmail: _claimantEmail, ...visibleClaim } = updatedClaim
    return NextResponse.json(
      { claim: visibleClaim, message: "Claim updated successfully" },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
  } catch (error) {
    if (error instanceof ClaimUpdateError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Release has already been recorded" }, { status: 409 })
    }
    console.error("Update claim error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
