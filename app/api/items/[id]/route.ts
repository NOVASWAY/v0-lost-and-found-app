import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { validateRouteId } from "@/lib/security"
import { requireAuth } from "@/lib/auth-middleware"
import { requireAdmin } from "@/lib/auth-middleware"
import { updateItemSchema, validateAndSanitize } from "@/lib/validation"

// GET item by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Validate ID to prevent path traversal
    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        claims: {
          include: {
            claimant: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: { claimedAt: "desc" },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Get item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH update item
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
    
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { id: true, uploadedById: true },
    })

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Non-admin users can only update their own items (and only description).
    if (authResult.user.role !== "admin" && existingItem.uploadedById !== authResult.user.id) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    const data = await request.json()
    const validation = validateAndSanitize(updateItemSchema, data)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const updateData: any = {}
    if (validation.data.description !== undefined) {
      updateData.description = validation.data.description
    }
    if (authResult.user.role === "admin" && validation.data.status !== undefined) {
      updateData.status = validation.data.status
    }

    const item = await prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json({ item, message: "Item updated successfully" })
  } catch (error) {
    console.error("Update item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE item
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
    await prisma.item.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Item deleted successfully" })
  } catch (error) {
    console.error("Delete item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
