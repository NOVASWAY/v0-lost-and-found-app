import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { userId, username } = await request.json()

    if (userId && prisma) {
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
        console.log("[v0] Logout audit log created for user:", username)
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
