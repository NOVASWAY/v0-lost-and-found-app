import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { validateRouteId } from "@/lib/security"
import { requireAdminOrVolunteer, requireAuth } from "@/lib/auth-middleware"
import { updateClaimSchema, validateAndSanitize } from "@/lib/validation"

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

    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        item: true,
        claimant: true,
      },
    })

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 })
    }

    const updateData: any = {}

    if (status) {
      updateData.status = status
    }

    if (releaseNotes) {
      updateData.releaseNotes = releaseNotes
    }
    // For auditability, always record the acting admin/volunteer.
    updateData.releasedBy = actorId

    if (status === "released") {
      updateData.releasedAt = new Date()
    }

    const updatedClaim = await prisma.claim.update({
      where: { id },
      data: updateData,
      include: {
        item: true,
        claimant: true,
      },
    })

    // If released, update item status and create release log
    if (status === "released") {
      await prisma.item.update({
        where: { id: claim.itemId },
        data: { status: "released" },
      })

      const volunteer = await prisma.user.findUnique({ where: { id: actorId } })

      if (volunteer) {
        await prisma.releaseLog.create({
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

        // Award points to claimant
        await prisma.user.update({
          where: { id: claim.claimantId },
          data: {
            vaultPoints: { increment: 100 },
          },
        })

        // Add audit log
        await prisma.auditLog.create({
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

    return NextResponse.json({ claim: updatedClaim, message: "Claim updated successfully" })
  } catch (error) {
    console.error("Update claim error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
