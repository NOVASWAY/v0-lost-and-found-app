import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { userId, username } = await request.json()

    if (userId) {
      // Add audit log
      await prisma.auditLog.create({
        data: {
          type: "logout",
          action: "User logged out",
          details: `User '${username}' logged out`,
          severity: "info",
          userId: userId,
        },
      })
    }

    return NextResponse.json({ message: "Logout successful" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
