import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { validateRouteId } from "@/lib/security"
import { requireAdmin } from "@/lib/auth-middleware"
import { updateMeetingMinutesSchema, validateAndSanitize } from "@/lib/validation"

// PATCH update meeting minutes (admin only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const existing = await prisma.meetingMinutes.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Meeting minutes not found" }, { status: 404 })
    }

    const body = await request.json()
    const validation = validateAndSanitize(updateMeetingMinutesSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const updateData: any = {}
    if (validation.data.title !== undefined) updateData.title = validation.data.title
    if (validation.data.meetingDate !== undefined) updateData.meetingDate = validation.data.meetingDate
    if (validation.data.location !== undefined) updateData.location = validation.data.location || null
    if (validation.data.attendees !== undefined) updateData.attendees = validation.data.attendees as unknown as Prisma.InputJsonValue
    if (validation.data.agenda !== undefined) updateData.agenda = validation.data.agenda as unknown as Prisma.InputJsonValue
    if (validation.data.discussion !== undefined) updateData.discussion = validation.data.discussion
    if (validation.data.actionItems !== undefined) updateData.actionItems = validation.data.actionItems as unknown as Prisma.InputJsonValue
    if (validation.data.decisions !== undefined) updateData.decisions = validation.data.decisions as unknown as Prisma.InputJsonValue
    if (validation.data.nextMeetingDate !== undefined) updateData.nextMeetingDate = validation.data.nextMeetingDate || null

    const minutes = await prisma.meetingMinutes.update({
      where: { id },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        type: "meeting_minutes_updated",
        action: "Meeting minutes updated",
        details: `Meeting minutes '${minutes.title}' updated`,
        severity: "info",
        userId: authResult.user.id,
      },
    })

    return NextResponse.json({ minutes, message: "Meeting minutes updated successfully" })
  } catch (error) {
    console.error("Update meeting minutes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE meeting minutes (admin only)
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

    const existing = await prisma.meetingMinutes.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Meeting minutes not found" }, { status: 404 })
    }

    await prisma.meetingMinutes.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        type: "meeting_minutes_deleted",
        action: "Meeting minutes deleted",
        details: `Meeting minutes '${existing.title}' deleted`,
        severity: "warning",
        userId: authResult.user.id,
      },
    })

    return NextResponse.json({ message: "Meeting minutes deleted successfully" })
  } catch (error) {
    console.error("Delete meeting minutes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
