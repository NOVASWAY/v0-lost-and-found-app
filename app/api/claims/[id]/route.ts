import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { validateRouteId } from "@/lib/security"
import { requireAdminOrVolunteer, requireAuth } from "@/lib/auth-middleware"
import { updateClaimSchema, validateAndSanitize } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

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

    return NextResponse.json({ claim })
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

    const data = await request.json()
    const validation = validateAndSanitize(updateClaimSchema, data)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const actorId = authResult.user.id
    const actorRole = authResult.user.role
    const { status, releaseNotes } = validation.data

    if (actorRole !== "admin" && status === "pending") {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    // Valid status transitions
    const VALID_TRANSITIONS: Record<string, string[]> = {
      pending: ["approved", "rejected"],
      approved: ["released", "rejected"],
      released: [],
      rejected: [],
    }

    const updatedClaim = await prisma.$transaction(async (tx) => {
      // Fresh read inside transaction — concurrent modifications are serialized
      const claim = await tx.claim.findUnique({
        where: { id },
        include: { item: true, claimant: true },
      })

      if (!claim) throw new ClaimUpdateError("Claim not found", 404)

      // Validate status transition
      if (status) {
        const allowed = VALID_TRANSITIONS[claim.status] || []
        if (!allowed.includes(status)) {
          throw new ClaimUpdateError(
            `Cannot transition claim from "${claim.status}" to "${status}"`,
            400,
          )
        }
      }

      const updateData: Record<string, unknown> = {}
      if (status) updateData.status = status
      if (releaseNotes) updateData.releaseNotes = releaseNotes
      updateData.releasedBy = actorId
      if (status === "released") updateData.releasedAt = new Date()

      // Approve: lock the item, but only if no other approved claim exists
      if (status === "approved") {
        const existingApproved = await tx.claim.findFirst({
          where: {
            itemId: claim.itemId,
            status: "approved",
            id: { not: id },
          },
        })
        if (existingApproved) {
          throw new ClaimUpdateError("Another claim on this item is already approved", 409)
        }
        await tx.item.update({ where: { id: claim.itemId }, data: { status: "claimed" } })
      }

      // Reject a previously approved claim: free the item
      if (status === "rejected" && claim.status === "approved") {
        await tx.item.update({ where: { id: claim.itemId }, data: { status: "available" } })
      }

      const updated = await tx.claim.update({
        where: { id },
        data: updateData,
        include: { item: true, claimant: true },
      })

      // Release: update item, create release log, award points
      if (status === "released") {
        await tx.item.update({ where: { id: claim.itemId }, data: { status: "released" } })

        const volunteer = await tx.user.findUnique({ where: { id: actorId } })
        if (volunteer) {
          await tx.releaseLog.create({
            data: {
              itemId: claim.itemId,
              itemName: claim.itemName,
              claimantName: claim.claimantName,
              volunteerName: volunteer.name,
              notes: releaseNotes || "Item released to claimant",
              claimId: claim.id,
              volunteerId: actorId,
            },
          })

          await tx.user.update({
            where: { id: claim.claimantId },
            data: { vaultPoints: { increment: 100 } },
          })

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
      }

      return updated
    })

    return NextResponse.json({ claim: updatedClaim, message: "Claim updated successfully" })
  } catch (error) {
    if (error instanceof ClaimUpdateError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Update claim error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
