import { NextRequest, NextResponse } from "next/server"
import { prisma } from "./db"
import { verifyAccessToken } from "./jwt"
import { assertSameOrigin } from "./security"

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    username: string
    name: string
    role: string
  }
}

// Get user from the httpOnly session cookie (auth_token).
export async function getAuthenticatedUser(request: NextRequest): Promise<{
  id: string
  username: string
  name: string
  role: string
} | null> {
  try {
    const token = request.cookies?.get("auth_token")?.value

    if (!token) return null

    const payload = verifyAccessToken(token)
    if (!payload) return null

    // Verify the user still exists and return server-side role.
    // (We could rely on token.role, but refreshing from DB prevents stale/removed accounts.)
    if (!prisma) return null

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        tokenVersion: true,
      },
    })

    if (!user) return null

    // Reject tokens issued before the user's last password change (revoked sessions).
    if (user.tokenVersion !== payload.tokenVersion) return null

    return user
  } catch (error) {
    return null
  }
}

// Middleware to require authentication
export async function requireAuth(
  request: NextRequest
): Promise<NextResponse | { user: { id: string; username: string; name: string; role: string } }> {
  // CSRF defense-in-depth: reject cross-site requests. Browsers attach an Origin
  // header to cross-site POST/PATCH/DELETE requests; if it doesn't match this
  // host the request was forged. (No-Origin requests, e.g. curl, are allowed.)
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden - Cross-site request rejected" }, { status: 403 })
  }

  const user = await getAuthenticatedUser(request)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return { user }
}

// Middleware to require specific role
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<NextResponse | { user: { id: string; username: string; name: string; role: string } }> {
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!allowedRoles.includes(authResult.user.role)) {
    return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
  }

  return authResult
}

// Middleware to require admin
export async function requireAdmin(
  request: NextRequest
): Promise<NextResponse | { user: { id: string; username: string; name: string; role: string } }> {
  return requireRole(request, ["admin"])
}

// Middleware to require admin or volunteer
export async function requireAdminOrVolunteer(
  request: NextRequest
): Promise<NextResponse | { user: { id: string; username: string; name: string; role: string } }> {
  return requireRole(request, ["admin", "volunteer"])
}
