import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { validateRouteId } from "@/lib/security"
import { createServiceRecordSchema, validateAndSanitize } from "@/lib/validation"
import { requireAuth } from "@/lib/auth-middleware"

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

    // Regular users can only view their own service records.
    if (authResult.user.role === "user" && userId !== authResult.user.id) {
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
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await request.json()
    const validation = validateAndSanitize(createServiceRecordSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    if (authResult.user.role === "user") {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    const { serviceDate, attended, served, notes } = validation.data
    const userId = authResult.user.id
    const recordedBy = authResult.user.username

    // Validate userId to prevent path traversal
    const idValidation = validateRouteId(userId)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid user ID format" }, { status: 400 })
    }

    const record = await prisma.serviceRecord.create({
      data: {
        userId,
        serviceDate: new Date(serviceDate),
        attended: attended || false,
        served: served || false,
        notes: notes || null,
        recordedBy: recordedBy || "System",
      },
    })

    // Update user stats
    const updateData: any = {}
    if (attended) {
      updateData.attendanceCount = { increment: 1 }
      updateData.vaultPoints = { increment: 10 }
    }
    if (served) {
      updateData.serviceCount = { increment: 1 }
      updateData.vaultPoints = { increment: 25 }
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      })
    }

    // Add audit logs
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user) {
      if (attended) {
        await prisma.auditLog.create({
          data: {
            type: "attendance_marked",
            action: "Attendance marked",
            details: `Marked attendance for service on ${serviceDate}`,
            severity: "info",
            userId,
          },
        })
      }
      if (served) {
        await prisma.auditLog.create({
          data: {
            type: "service_marked",
            action: "Service marked",
            details: `Marked service participation for ${serviceDate}`,
            severity: "info",
            userId,
          },
        })
      }
    }

    return NextResponse.json({ record, message: "Service record created successfully" })
  } catch (error) {
    console.error("Create service record error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
