import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 20 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
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
        console.error("Error creating logout audit log:", error)
        // Continue with logout even if audit log fails
      }
    }

    const response = NextResponse.json({ message: "Logout successful" })
    response.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })
    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
