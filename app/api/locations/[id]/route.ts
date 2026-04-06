import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { validateRouteId } from "@/lib/security"
import { requireAdmin } from "@/lib/auth-middleware"
import { updateLocationSchema, validateAndSanitize } from "@/lib/validation"

// PATCH update location
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id } = await params
    
    // Validate ID to prevent path traversal
    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }
    const body = await request.json()
    const validation = validateAndSanitize(updateLocationSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { name, description } = validation.data
    const actorId = authResult.user.id

    const location = await prisma.location.findUnique({
      where: { id },
    })

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    const updatedLocation = await prisma.location.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description: description || null }),
      },
    })

    // Add audit log
    await prisma.auditLog.create({
      data: {
        type: "location_updated",
        action: "Location updated",
        details: `Location '${location.name}' updated`,
        severity: "info",
        userId: actorId,
      },
    })

    return NextResponse.json({ location: updatedLocation, message: "Location updated successfully" })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Location name already exists" }, { status: 400 })
    }
    console.error("Update location error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE location
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id } = await params
    
    // Validate ID to prevent path traversal
    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }
    const actorId = authResult.user.id

    const location = await prisma.location.findUnique({
      where: { id },
    })

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    await prisma.location.delete({
      where: { id },
    })

    // Add audit log
    await prisma.auditLog.create({
      data: {
        type: "location_deleted",
        action: "Location deleted",
        details: `Location '${location.name}' deleted`,
        severity: "warning",
        userId: actorId,
      },
    })

    return NextResponse.json({ message: "Location deleted successfully" })
  } catch (error) {
    console.error("Delete location error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
