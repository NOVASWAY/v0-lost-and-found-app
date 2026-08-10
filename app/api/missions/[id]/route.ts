import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { validateRouteId } from "@/lib/security"
import { requireAdmin, requireAuth } from "@/lib/auth-middleware"
import { updateMissionSchema, validateAndSanitize } from "@/lib/validation"

// PATCH update mission
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const mission = await prisma.mission.findUnique({ where: { id } })
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 })
    }

    const isStaff = authResult.user.role === "admin" || authResult.user.role === "volunteer"

    const data = await request.json()
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
      // Restrict non-staff to status + completionNotes only.
      if (title || description || instructions || priority || dueDate || location || assignedTo) {
        return NextResponse.json({ error: "Forbidden - Only status updates are allowed" }, { status: 403 })
      }
    }

    if (assignedTo) {
      const assignee = await prisma.user.findUnique({ where: { id: assignedTo } })
      if (!assignee) {
        return NextResponse.json({ error: "Assigned user not found" }, { status: 400 })
      }
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (instructions !== undefined) updateData.instructions = instructions
    if (priority !== undefined) updateData.priority = priority
    if (dueDate !== undefined) updateData.dueDate = dueDate || null
    if (location !== undefined) updateData.location = location || null
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (completionNotes !== undefined) updateData.completionNotes = completionNotes

    // Manage completedAt lifecycle server-side.
    if (status === "completed" && mission.status !== "completed") {
      updateData.completedAt = new Date()
    } else if (status && status !== "completed") {
      updateData.completedAt = null
    }
    if (status !== undefined) updateData.status = status

    const updatedMission = await prisma.mission.update({
      where: { id },
      data: updateData,
      include: {
        assignedToUser: { select: { id: true, name: true, username: true } },
        assignedByUser: { select: { id: true, name: true, username: true } },
      },
    })

    // Add audit log
    await prisma.auditLog.create({
      data: {
        type: "mission_updated",
        action: "Mission updated",
        details: `Mission '${updatedMission.title}' updated`,
        severity: "info",
        userId: authResult.user.id,
      },
    })

    return NextResponse.json({ mission: updatedMission, message: "Mission updated successfully" })
  } catch (error) {
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
