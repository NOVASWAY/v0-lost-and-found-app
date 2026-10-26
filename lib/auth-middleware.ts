import { NextRequest, NextResponse } from "next/server"
import { prisma, withDbRetry } from "./db"
import { verifyAccessToken } from "./jwt"
import { assertSameOrigin } from "./security"
import { isUserRole, type UserRole } from "./domain"

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

export interface AuthenticatedUser {
  id: string
  username: string
  name: string
  role: UserRole
  tokenVersion: number
  vaultPoints: number
  rank: number
  itemsUploaded: number
  claimsSubmitted: number
  attendanceCount: number
  serviceCount: number
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser
}

export async function getAuthenticatedUserFromToken(token?: string | null): Promise<AuthenticatedUser | null> {
  try {
    if (!token) return null

    const payload = verifyAccessToken(token)
    if (!payload || !prisma) return null

    const user = await withDbRetry(() =>
      prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          tokenVersion: true,
          vaultPoints: true,
          rank: true,
          itemsUploaded: true,
          claimsSubmitted: true,
          attendanceCount: true,
          serviceCount: true,
        },
      })
    )

    if (!user || !isUserRole(user.role) || user.tokenVersion !== payload.tokenVersion) return null
    return { ...user, role: user.role }
  } catch {
    return null
  }
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  return getAuthenticatedUserFromToken(request.cookies?.get("auth_token")?.value)
}

export async function requireAuth(
  request: NextRequest,
): Promise<NextResponse | { user: AuthenticatedUser }> {
  const user = await getAuthenticatedUser(request)

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const method = request.method?.toUpperCase() ?? "GET"
  if (MUTATING_METHODS.has(method) && !assertSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden - Cross-site request rejected" }, { status: 403 })
  }

  return { user }
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: readonly UserRole[],
): Promise<NextResponse | { user: AuthenticatedUser }> {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  if (!allowedRoles.includes(authResult.user.role)) {
    return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
  }

  return authResult
}

export async function requireAdmin(request: NextRequest): Promise<NextResponse | { user: AuthenticatedUser }> {
  return requireRole(request, ["admin"])
}

export async function requireAdminOrVolunteer(
  request: NextRequest,
): Promise<NextResponse | { user: AuthenticatedUser }> {
  return requireRole(request, ["admin", "volunteer"])
}
