import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET claim by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const claim = await prisma.claim.findUnique({
      where: { id: params.id },
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

    return NextResponse.json({ claim })
  } catch (error) {
    console.error("Get claim error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH update claim (for releasing)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status, releaseNotes, releasedBy, volunteerId } = await request.json()

    const claim = await prisma.claim.findUnique({
      where: { id: params.id },
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

    if (releasedBy) {
      updateData.releasedBy = releasedBy
    }

    if (status === "released") {
      updateData.releasedAt = new Date()
    }

    const updatedClaim = await prisma.claim.update({
      where: { id: params.id },
      data: updateData,
      include: {
        item: true,
        claimant: true,
      },
    })

    // If released, update item status and create release log
    if (status === "released" && volunteerId) {
      await prisma.item.update({
        where: { id: claim.itemId },
        data: { status: "released" },
      })

      const volunteer = await prisma.user.findUnique({
        where: { id: volunteerId },
      })

      if (volunteer) {
        await prisma.releaseLog.create({
          data: {
            itemId: claim.itemId,
            itemName: claim.itemName,
            claimantName: claim.claimantName,
            volunteerName: volunteer.name,
            notes: releaseNotes || "Item released to claimant",
            claimId: claim.id,
            volunteerId,
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
            userId: volunteerId,
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

