import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { requireAuth, requireAdmin } from "@/lib/auth-middleware"
import { assertSameOrigin, validateRouteId } from "@/lib/security"
import { updateOccurrenceBookSchema, validateAndSanitize } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

// GET single occurrence (all authenticated users)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 100 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const { id } = await params

    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }

    const occurrence = await prisma.occurrenceBook.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, color: true } },
        reportedBy: { select: { id: true, name: true } },
      },
    })

    if (!occurrence) {
      return NextResponse.json({ error: "Occurrence not found" }, { status: 404 })
    }

    return NextResponse.json({ occurrence })
  } catch (error) {
    console.error("Get occurrence error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH update occurrence (admin only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const { id } = await params

    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }

    const existing = await prisma.occurrenceBook.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Occurrence not found" }, { status: 404 })
    }

    const body = await request.json()
    const validation = validateAndSanitize(updateOccurrenceBookSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const updateData: any = {}
    if (validation.data.title !== undefined) updateData.title = validation.data.title
    if (validation.data.description !== undefined) updateData.description = validation.data.description
    if (validation.data.location !== undefined) updateData.location = validation.data.location || null
    if (validation.data.severity !== undefined) updateData.severity = validation.data.severity
    if (validation.data.status !== undefined) updateData.status = validation.data.status
    if (validation.data.occurrenceDate !== undefined) updateData.occurrenceDate = validation.data.occurrenceDate
    if (validation.data.occurrenceTime !== undefined) updateData.occurrenceTime = validation.data.occurrenceTime || null
    if (validation.data.attachments !== undefined) updateData.attachments = validation.data.attachments as unknown as Prisma.InputJsonValue
    if (validation.data.notes !== undefined) updateData.notes = validation.data.notes || null
    if (validation.data.followUpRequired !== undefined) updateData.followUpRequired = validation.data.followUpRequired
    if (validation.data.followUpNotes !== undefined) updateData.followUpNotes = validation.data.followUpNotes || null
    if (validation.data.linkedItemId !== undefined) updateData.linkedItemId = validation.data.linkedItemId || null
    if (validation.data.linkedClaimId !== undefined) updateData.linkedClaimId = validation.data.linkedClaimId || null

    if (validation.data.categoryId !== undefined) {
      const category = await prisma.occurrenceCategory.findUnique({ where: { id: validation.data.categoryId } })
      if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 })
      updateData.categoryId = validation.data.categoryId
    }

    const occurrence = await prisma.occurrenceBook.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, color: true } },
        reportedBy: { select: { id: true, name: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        type: "occurrence_book_updated",
        action: "Occurrence updated",
        details: `Occurrence OB-${String(occurrence.entryNumber).padStart(4, "0")} updated`,
        severity: "info",
        userId: authResult.user.id,
      },
    })

    return NextResponse.json({ occurrence, message: "Occurrence updated successfully" })
  } catch (error) {
    console.error("Update occurrence error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE occurrence (admin only)
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
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const { id } = await params

    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }

    const existing = await prisma.occurrenceBook.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Occurrence not found" }, { status: 404 })
    }

    await prisma.occurrenceBook.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        type: "occurrence_book_deleted",
        action: "Occurrence deleted",
        details: `Occurrence OB-${String(existing.entryNumber).padStart(4, "0")} '${existing.title}' deleted`,
        severity: "warning",
        userId: authResult.user.id,
      },
    })

    return NextResponse.json({ message: "Occurrence deleted successfully" })
  } catch (error) {
    console.error("Delete occurrence error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
