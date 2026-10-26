import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-middleware"
import { assertSameOrigin } from "@/lib/security"
import { getSessionCookieOptions } from "@/lib/session-cookie"

export async function POST(request: NextRequest) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
  }

  let user: { id: string; username: string } | null = null
  try {
    const authResult = await requireAuth(request)
    if (!(authResult instanceof NextResponse)) user = authResult.user
  } catch {
    // Logout must still clear an expired or unverifiable cookie.
  }

  if (user && prisma) {
    try {
      await prisma.auditLog.create({
        data: {
          type: "logout",
          action: "User logged out",
          details: `User '${user.username}' logged out`,
          severity: "info",
          userId: user.id,
        },
      })
    } catch (error) {
      console.error("Error creating logout audit log:", error)
    }
  }

  const response = NextResponse.json(
    { message: "Logout successful" },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  )
  response.cookies.set("auth_token", "", getSessionCookieOptions(request, 0))
  return response
}
