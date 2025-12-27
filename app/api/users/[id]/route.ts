import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET user by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        itemsUploaded: true,
        claimsSubmitted: true,
        joinedAt: true,
        vaultPoints: true,
        rank: true,
        attendanceCount: true,
        serviceCount: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE user (admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Add audit log before deletion
    await prisma.auditLog.create({
      data: {
        type: "user_deleted",
        action: "User account deactivated",
        details: `User '${user.username}' deactivated`,
        severity: "warning",
        userId: user.id,
      },
    })

    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH update user
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.role && { role: data.role }),
      },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        itemsUploaded: true,
        claimsSubmitted: true,
        joinedAt: true,
        vaultPoints: true,
        rank: true,
        attendanceCount: true,
        serviceCount: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ user, message: "User updated successfully" })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

