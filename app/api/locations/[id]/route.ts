import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// PATCH update location
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, description, userId } = await request.json()

    const location = await prisma.location.findUnique({
      where: { id: params.id },
    })

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    const updatedLocation = await prisma.location.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description: description || null }),
      },
    })

    // Add audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          type: "location_updated",
          action: "Location updated",
          details: `Location '${location.name}' updated`,
          severity: "info",
          userId,
        },
      })
    }

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
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    const location = await prisma.location.findUnique({
      where: { id: params.id },
    })

    if (!location) {
      return NextResponse.json({ error: "Location not found" }, { status: 404 })
    }

    await prisma.location.delete({
      where: { id: params.id },
    })

    // Add audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          type: "location_deleted",
          action: "Location deleted",
          details: `Location '${location.name}' deleted`,
          severity: "warning",
          userId,
        },
      })
    }

    return NextResponse.json({ message: "Location deleted successfully" })
  } catch (error) {
    console.error("Delete location error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

