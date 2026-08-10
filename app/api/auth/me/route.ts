import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-middleware"

// GET current user - restores the client session from the httpOnly cookie.
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!prisma) {
      return NextResponse.json({ error: "Database connection unavailable" }, { status: 503 })
    }

    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
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
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Get current user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
