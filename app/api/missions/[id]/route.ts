import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { assertSameOrigin, readJsonBody, validateRouteId } from "@/lib/security"
import { requireAdmin, requireAuth } from "@/lib/auth-middleware"
import { updateMissionSchema, validateAndSanitize } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { awardPoints } from "@/lib/points"
import { refreshUserRanks } from "@/lib/ranking"

class MissionUpdateError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

// PATCH update mission
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request)
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

    const mission = await prisma.mission.findUnique({ where: { id } })
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 })
    }

    const isStaff = authResult.user.role === "admin" || authResult.user.role === "volunteer"

    const jsonBody = await readJsonBody(request)
    if (!jsonBody.ok) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const data = jsonBody.data
    const validation = validateAndSanitize(updateMissionSchema, data)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // A non-staff assignee may only update the status (start/complete/cancel)
    // and completion notes; everything else is staff-only.
    const isAssignee = mission.assignedTo === authResult.user.id
    if (!isStaff && !isAssignee) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    const { title, description, instructions, priority, status, dueDate, location, completionNotes, assignedTo } = validation.data

    if (!isStaff) {
      // Restrict non-staff to status + completionNotes only. Check for
      // presence (not truthiness): an empty string or null is still an
      // attempted write and would let an assignee clear staff-owned fields.
      const staffOnlyFields = { title, description, instructions, priority, dueDate, location, assignedTo }
      if (Object.values(staffOnlyFields).some((value) => value !== undefined)) {
        return NextResponse.json({ error: "Forbidden - Only status updates are allowed" }, { status: 403 })
      }
    }

    if (assignedTo) {
      const assignee = await prisma.user.findUnique({ where: { id: assignedTo } })
      if (!assignee) {
        return NextResponse.json({ error: "Assigned user not found" }, { status: 400 })
      }
    }

    const { updatedMission, pointsAwarded } = await prisma.$transaction(async (tx) => {
      const currentMission = await tx.mission.findUnique({ where: { id } })
      if (!currentMission) throw new MissionUpdateError("Mission not found", 404)

      if (!isStaff && currentMission.assignedTo !== authResult.user.id) {
        throw new MissionUpdateError("Forbidden - Insufficient permissions", 403)
      }

      if (!isStaff) {
        const staffOnlyFields = { title, description, instructions, priority, dueDate, location, assignedTo }
        if (Object.values(staffOnlyFields).some((value) => value !== undefined)) {
          throw new MissionUpdateError("Only status and completion notes may be updated", 403)
        }
      }

      if (assignedTo) {
        const assignee = await tx.user.findUnique({ where: { id: assignedTo }, select: { id: true } })
        if (!assignee) throw new MissionUpdateError("Assigned user not found", 400)
      }

      const updateData: Prisma.MissionUncheckedUpdateInput = {}
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
      if (instructions !== undefined) updateData.instructions = instructions
      if (priority !== undefined) updateData.priority = priority
      if (dueDate !== undefined) updateData.dueDate = dueDate || null
      if (location !== undefined) updateData.location = location || null
      if (assignedTo !== undefined) updateData.assignedTo = assignedTo
      if (completionNotes !== undefined) updateData.completionNotes = completionNotes

      const completedNow = status === "completed" && currentMission.status !== "completed"
      if (completedNow) updateData.completedAt = new Date()
      else if (status !== undefined && status !== "completed") updateData.completedAt = null
      if (status !== undefined) updateData.status = status

      let updatedMission
      try {
        updatedMission = await tx.mission.update({
          where: { id, status: currentMission.status, assignedTo: currentMission.assignedTo },
          data: updateData,
          include: {
            assignedToUser: { select: { id: true, name: true, username: true } },
            assignedByUser: { select: { id: true, name: true, username: true } },
          },
        })
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
          throw new MissionUpdateError("Mission changed before the update could be applied", 409)
        }
        throw error
      }

      let pointsAwarded = false
      if (completedNow && currentMission.assignedTo) {
        const pointResult = await awardPoints({
          tx,
          userId: currentMission.assignedTo,
          action: "mission_completed",
          referenceId: currentMission.id,
        })
        pointsAwarded = pointResult.awarded
      }

      let auditType = "mission_updated"
      let auditAction = "Mission updated"
      if (completedNow) {
        auditType = "mission_completed"
        auditAction = "Mission completed"
      } else if (status === "cancelled" && currentMission.status !== "cancelled") {
        auditType = "mission_cancelled"
        auditAction = "Mission cancelled"
      } else if (assignedTo !== undefined && assignedTo !== currentMission.assignedTo) {
        auditType = "mission_assigned"
        auditAction = "Mission reassigned"
      }

      await tx.auditLog.create({
        data: {
          type: auditType,
          action: auditAction,
          details: `Mission '${updatedMission.title}' ${auditAction.toLowerCase()}`,
          severity: "info",
          userId: authResult.user.id,
        },
      })

      return { updatedMission, pointsAwarded }
    })

    if (pointsAwarded) await refreshUserRanks()

    return NextResponse.json(
      { mission: updatedMission, message: "Mission updated successfully" },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
  } catch (error) {
    if (error instanceof MissionUpdateError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Update mission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE mission (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin(request)
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

    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }

    const mission = await prisma.mission.findUnique({ where: { id } })
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 })
    }

    await prisma.mission.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        type: "mission_deleted",
        action: "Mission deleted",
        details: `Mission '${mission.title}' deleted`,
        severity: "warning",
        userId: authResult.user.id,
      },
    })

    return NextResponse.json({ message: "Mission deleted successfully" })
  } catch (error) {
    console.error("Delete mission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
