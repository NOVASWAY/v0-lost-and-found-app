import { NextRequest, NextResponse } from "next/server"
import { getClientIdentifier, rateLimit } from "@/lib/rate-limit"
import { requireAuth } from "@/lib/auth-middleware"
import { signAccessToken } from "@/lib/jwt"
import { getSessionCookieOptions } from "@/lib/session-cookie"
import { SESSION_TTL_SECONDS } from "@/lib/session"

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  const limit = await rateLimit(getClientIdentifier(request), { windowMs: 60_000, maxRequests: 12 })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many session refresh requests" },
      { status: 429, headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
  }

  const token = signAccessToken({
    sub: authResult.user.id,
    role: authResult.user.role,
    username: authResult.user.username,
    name: authResult.user.name,
    tokenVersion: authResult.user.tokenVersion,
  })

  const { id, username, name, role, vaultPoints, rank, itemsUploaded, claimsSubmitted, attendanceCount, serviceCount } =
    authResult.user
  const response = NextResponse.json(
    {
      expiresIn: SESSION_TTL_SECONDS,
      user: { id, username, name, role, vaultPoints, rank, itemsUploaded, claimsSubmitted, attendanceCount, serviceCount },
    },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  )
  response.cookies.set("auth_token", token, getSessionCookieOptions(request))
  return response
}
