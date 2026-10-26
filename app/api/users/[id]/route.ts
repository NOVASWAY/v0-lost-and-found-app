import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { assertSameOrigin, readJsonBody, validateRouteId } from "@/lib/security"
import { requireAdmin, requireAuth } from "@/lib/auth-middleware"
import { updateUserSchema, validateAndSanitize } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

class UserUpdateError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

// GET user by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { id } = await params
    
    // Validate ID to prevent path traversal
    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        itemsUploaded: true,
        claimsSubmitted: true,
        joinedAt: true,
        vaultPoints: true,
        rank: true,
        attendanceCount: true,
        serviceCount: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE user (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!assertSameOrigin(request)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
    }

    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 20 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    const { id } = await params

    // Validate ID to prevent path traversal
    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Prevent admins from deleting themselves
    if (id === authResult.user.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Check for dependent records that block deletion
    const [itemsCount, claimsCount, missionsAssignedCount, missionsCreatedCount, ordersCount, releasesCount, occurrencesCount] =
      await Promise.all([
        prisma.item.count({ where: { uploadedById: id } }),
        prisma.claim.count({ where: { claimantId: id } }),
        prisma.mission.count({ where: { assignedTo: id } }),
        prisma.mission.count({ where: { assignedBy: id } }),
        prisma.order.count({ where: { userId: id } }),
        prisma.releaseLog.count({ where: { volunteerId: id } }),
        prisma.occurrenceBook.count({ where: { reportedById: id } }),
      ])

    const blockers: string[] = []
    if (itemsCount > 0) blockers.push(`${itemsCount} uploaded item${itemsCount !== 1 ? "s" : ""}`)
    if (claimsCount > 0) blockers.push(`${claimsCount} submitted claim${claimsCount !== 1 ? "s" : ""}`)
    if (missionsAssignedCount > 0) blockers.push(`${missionsAssignedCount} assigned mission${missionsAssignedCount !== 1 ? "s" : ""}`)
    if (missionsCreatedCount > 0) blockers.push(`${missionsCreatedCount} created mission${missionsCreatedCount !== 1 ? "s" : ""}`)
    if (ordersCount > 0) blockers.push(`${ordersCount} order${ordersCount !== 1 ? "s" : ""}`)
    if (releasesCount > 0) blockers.push(`${releasesCount} release log${releasesCount !== 1 ? "s" : ""}`)
    if (occurrencesCount > 0) blockers.push(`${occurrencesCount} occurrence report${occurrencesCount !== 1 ? "s" : ""}`)

    if (blockers.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete user: ${blockers.join(", ")}. Please reassign or remove these records first.` },
        { status: 400 },
      )
    }

    // Delete audit logs and service records (safe to clean up), then the user
    await prisma.$transaction(async (tx) => {
      await tx.auditLog.deleteMany({ where: { userId: id } })
      await tx.serviceRecord.deleteMany({ where: { userId: id } })
      await tx.user.delete({ where: { id } })
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH update user
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Admins may edit any user (including role); regular users may only edit
    // their own name — role changes stay admin-only.
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!assertSameOrigin(request)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
    }

    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 20 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    const { id } = await params
    
    // Validate ID to prevent path traversal
    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }

    const isAdmin = authResult.user.role === "admin"
    if (authResult.user.id !== id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }
    
    const jsonBody = await readJsonBody(request)
    if (!jsonBody.ok) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const data = jsonBody.data
    const validation = validateAndSanitize(updateUserSchema, data)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { name, role } = validation.data

    const user = await prisma.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { id },
        select: { id: true, name: true, username: true, role: true },
      })
      if (!existingUser) throw new UserUpdateError("User not found", 404)

      const roleChanged = isAdmin && role !== undefined && role !== existingUser.role
      if (roleChanged && id === authResult.user.id) {
        throw new UserUpdateError("You cannot change your own role", 400)
      }

      const updatedUser = await tx.user.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(roleChanged ? { role, tokenVersion: { increment: 1 } } : {}),
        },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          itemsUploaded: true,
          claimsSubmitted: true,
          joinedAt: true,
          vaultPoints: true,
          rank: true,
          attendanceCount: true,
          serviceCount: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (roleChanged) {
        await tx.auditLog.create({
          data: {
            type: "user_role_changed",
            action: "User role changed",
            details: `Role changed from '${existingUser.role}' to '${updatedUser.role}' for user '${existingUser.username}'`,
            severity: "warning",
            userId: authResult.user.id,
          },
        })
      } else if (name !== undefined && updatedUser.name !== existingUser.name) {
        await tx.auditLog.create({
          data: {
            type: "user_updated",
            action: "User profile updated",
            details: `Name changed from '${existingUser.name}' to '${updatedUser.name}' for user '${existingUser.username}'`,
            severity: "info",
            userId: authResult.user.id,
          },
        })
      }

      return updatedUser
    })

    return NextResponse.json(
      { user, message: "User updated successfully" },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
  } catch (error) {
    if (error instanceof UserUpdateError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
