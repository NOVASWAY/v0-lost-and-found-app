import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { assertSameOrigin, readJsonBody, validateRouteId } from "@/lib/security"
import { createServiceRecordSchema, validateAndSanitize } from "@/lib/validation"
import { requireAdmin, requireAuth } from "@/lib/auth-middleware"
import { refreshUserRanks } from "@/lib/ranking"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { awardPoints } from "@/lib/points"

// GET service records for a user
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Validate userId to prevent path traversal
    const idValidation = validateRouteId(userId)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid user ID format" }, { status: 400 })
    }

    // Regular users and volunteers can only view their own service records.
    // Only admins may query another user's records.
    if (authResult.user.role !== "admin" && userId !== authResult.user.id) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    const records = await prisma.serviceRecord.findMany({
      where: { userId },
      orderBy: { serviceDate: "desc" },
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error("Get service records error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create service record
export async function POST(request: NextRequest) {
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

    const jsonBody = await readJsonBody(request)
    if (!jsonBody.ok) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const body = jsonBody.data
    const validation = validateAndSanitize(createServiceRecordSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { userId, serviceDate, attended, served, notes } = validation.data
    const recordedBy = authResult.user.username

    // Validate userId to prevent path traversal
    const idValidation = validateRouteId(userId)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid user ID format" }, { status: 400 })
    }

    // Verify the target exists up front; otherwise the foreign key violation
    // surfaces as a 500 and lets a caller probe for valid user IDs.
    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { record, pointsAwarded } = await prisma.$transaction(async (tx) => {
      const record = await tx.serviceRecord.create({
        data: {
          userId,
          serviceDate: new Date(serviceDate),
          attended: attended || false,
          served: served || false,
          notes: notes || null,
          recordedBy: authResult.user.username,
        },
      })

      const stats: Record<string, unknown> = {}
      if (attended) stats.attendanceCount = { increment: 1 }
      if (served) stats.serviceCount = { increment: 1 }
      if (Object.keys(stats).length > 0) {
        await tx.user.update({ where: { id: userId }, data: stats })
      }

      const awards = []
      if (attended) {
        awards.push(await awardPoints({
          tx,
          userId,
          action: "service_attended",
          referenceId: record.id,
        }))
      }
      if (served) {
        awards.push(await awardPoints({
          tx,
          userId,
          action: "service_served",
          referenceId: record.id,
        }))
      }

      const user = await tx.user.findUnique({ where: { id: userId }, select: { username: true } })
      if (user && attended) {
        await tx.auditLog.create({
          data: {
            type: "attendance_marked",
            action: "Attendance marked",
            details: `Marked attendance for '${user.username}' on ${serviceDate}`,
            severity: "info",
            userId: authResult.user.id,
          },
        })
      }
      if (user && served) {
        await tx.auditLog.create({
          data: {
            type: "service_marked",
            action: "Service marked",
            details: `Marked service participation for '${user.username}' on ${serviceDate}`,
            severity: "info",
            userId: authResult.user.id,
          },
        })
      }

      return { record, pointsAwarded: awards.some((award) => award.awarded) }
    })

    if (pointsAwarded) await refreshUserRanks()

    return NextResponse.json(
      { record, message: "Service record created successfully" },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
  } catch (error) {
    console.error("Create service record error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
