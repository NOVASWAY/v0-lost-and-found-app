import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { assertSameOrigin, validateRouteId } from "@/lib/security"
import { requireAdmin } from "@/lib/auth-middleware"
import { updateOccurrenceCategorySchema, validateAndSanitize } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

// PATCH update occurrence category (admin only)
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

    const existing = await prisma.occurrenceCategory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const body = await request.json()
    const validation = validateAndSanitize(updateOccurrenceCategorySchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const updateData: any = {}
    if (validation.data.name !== undefined) updateData.name = validation.data.name
    if (validation.data.color !== undefined) updateData.color = validation.data.color
    if (validation.data.isActive !== undefined) updateData.isActive = validation.data.isActive

    const category = await prisma.occurrenceCategory.update({
      where: { id },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        type: "occurrence_category_updated",
        action: "Occurrence category updated",
        details: `Occurrence category '${category.name}' updated`,
        severity: "info",
        userId: authResult.user.id,
      },
    })

    return NextResponse.json({ category, message: "Category updated successfully" })
  } catch (error) {
    console.error("Update occurrence category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE (deactivate) occurrence category (admin only)
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

    const existing = await prisma.occurrenceCategory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const linkedCount = await prisma.occurrenceBook.count({ where: { categoryId: id } })
    if (linkedCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category: ${linkedCount} occurrence(s) use it. Deactivate instead.` },
        { status: 409 }
      )
    }

    await prisma.occurrenceCategory.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        type: "occurrence_category_deleted",
        action: "Occurrence category deleted",
        details: `Occurrence category '${existing.name}' deleted`,
        severity: "warning",
        userId: authResult.user.id,
      },
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error) {
    console.error("Delete occurrence category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
