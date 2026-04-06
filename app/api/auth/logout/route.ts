import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-middleware"

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const userId = authResult.user.id
    const username = authResult.user.username

    if (prisma) {
      try {
        // Add audit log for logout
        await prisma.auditLog.create({
          data: {
            type: "logout",
            action: "User logged out",
            details: `User '${username}' logged out`,
            severity: "info",
            userId: userId,
          },
        })
      } catch (error) {
        console.error("[v0] Error creating logout audit log:", error)
        // Continue with logout even if audit log fails
      }
    }

    return NextResponse.json({ message: "Logout successful" })
  } catch (error) {
    console.error("[v0] Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
