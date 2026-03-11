import { NextRequest, NextResponse } from "next/server"
import { prisma } from "./db"
import { comparePassword } from "./db"

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    username: string
    name: string
    role: string
  }
}

// Get user from session/token (simplified - in production use JWT or sessions)
export async function getAuthenticatedUser(request: NextRequest): Promise<{
  id: string
  username: string
  name: string
  role: string
} | null> {
  try {
    // For now, we'll use a simple header-based auth
    // In production, use proper JWT tokens or sessions
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)
    // In production, verify JWT token here
    // For now, we'll use a simple approach with user ID
    
    // Check if it's a user ID (temporary solution)
    const user = await prisma.user.findUnique({
      where: { id: token },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      },
    })

    return user
  } catch (error) {
    return null
  }
}

// Middleware to require authentication
export async function requireAuth(
  request: NextRequest
): Promise<NextResponse | { user: { id: string; username: string; name: string; role: string } }> {
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
