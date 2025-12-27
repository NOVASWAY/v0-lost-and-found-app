import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET item by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.item.findUnique({
      where: { id: params.id },
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
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()

    const item = await prisma.item.update({
      where: { id: params.id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.description && { description: data.description }),
      },
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
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.item.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Item deleted successfully" })
  } catch (error) {
    console.error("Delete item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

