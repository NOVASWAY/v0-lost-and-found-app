import { NextRequest, NextResponse } from "next/server"
import { prisma } from "./db"

export type UserRole = "admin" | "volunteer" | "user"

/**
 * Role-Based Access Control (RBAC) Permissions Matrix
 * Defines which roles can perform which actions
 */
export const PERMISSIONS: Record<UserRole, Set<string>> = {
  admin: new Set([
    // User Management
    "users:read",
    "users:create",
    "users:update",
    "users:delete",
    // System
    "system:settings",
    "system:view-logs",
    "audit:view-all",
    // Items & Claims
    "items:read",
    "items:create",
    "items:update",
    "items:delete",
    "claims:read",
    "claims:approve",
    "claims:reject",
    // Volunteer Management
    "volunteers:manage",
    "missions:create",
    "missions:assign",
    // Locations & Playbooks
    "locations:manage",
    "playbooks:manage",
    "service-records:manage",
    // All volunteer permissions
    "items:upload",
    "claims:submit",
    "items:release",
    "claims:view-own",
  ]),
  volunteer: new Set([
    // Read-only items & claims
    "items:read",
    "claims:read",
    // Approval & Release
    "claims:approve",
    "claims:reject",
    "items:release",
    // Own Profile
    "profile:read",
    "profile:update",
    // Service Records
    "service-records:view",
    "service-records:create",
    // Volunteer Specific
    "volunteers:view",
    "missions:view",
    // Audit
    "audit:view-own",
    // All user permissions
    "items:upload",
    "claims:submit",
    "items:view",
    "claims:view-own",
  ]),
  user: new Set([
    // Items
    "items:read",
    "items:upload",
    "items:view",
    // Claims
    "claims:submit",
    "claims:view-own",
    // Profile
    "profile:read",
    "profile:update",
    // Audit
    "audit:view-own",
  ]),
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  return PERMISSIONS[userRole]?.has(permission) || false
}

/**
 * Check if a user has any of the required permissions
 */
export function hasAnyPermission(userRole: UserRole, permissions: string[]): boolean {
  return permissions.some((permission) => hasPermission(userRole, permission))
}

/**
 * Check if a user has all required permissions
 */
export function hasAllPermissions(userRole: UserRole, permissions: string[]): boolean {
  return permissions.every((permission) => hasPermission(userRole, permission))
}

/**
 * Get user from session and verify role access
 */
export async function verifyUserRole(request: NextRequest, requiredRoles: UserRole[]): Promise<{ user: any; error?: never } | { error: string; user?: never }> {
  try {
    // Get user ID from session or auth header
    const userId = request.headers.get("X-User-ID")
    if (!userId) {
      return { error: "Unauthorized: No user session" }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return { error: "Unauthorized: User not found" }
    }

    if (!requiredRoles.includes(user.role as UserRole)) {
      return { error: "Forbidden: Insufficient permissions" }
    }

    return { user }
  } catch (error) {
    console.error("[RBAC] Error verifying user role:", error)
    return { error: "Internal server error" }
  }
}

/**
 * Middleware to check permissions before API execution
 */
export function createPermissionMiddleware(requiredPermissions: string | string[]) {
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]

  return async (request: NextRequest) => {
    try {
      const userId = request.headers.get("X-User-ID")
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Check if user has required permission
      const userRole = user.role as UserRole
      const hasAccess = hasAnyPermission(userRole, permissions)

      if (!hasAccess) {
        return NextResponse.json({ error: "Forbidden: Insufficient permissions" }, { status: 403 })
      }

      return null // Continue to handler
    } catch (error) {
      console.error("[RBAC] Permission check error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}

/**
 * Enforce single role access (stricter than permission-based)
 */
export async function enforceRole(request: NextRequest, allowedRoles: UserRole[]): Promise<NextResponse | null> {
  try {
    const userId = request.headers.get("X-User-ID")
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: No user session" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden: This action requires specific role access" }, { status: 403 })
    }

    return null // Continue to handler
  } catch (error) {
    console.error("[RBAC] Role enforcement error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Get access level as a number for comparison (higher = more privileged)
 */
export function getRoleLevel(role: UserRole): number {
  const levels: Record<UserRole, number> = {
    user: 1,
    volunteer: 2,
    admin: 3,
  }
  return levels[role] || 0
}

/**
 * Check if user has equal or higher privilege than another user
 */
export function canManageUser(managerRole: UserRole, targetUserRole: UserRole): boolean {
  return getRoleLevel(managerRole) > getRoleLevel(targetUserRole)
}
