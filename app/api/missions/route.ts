import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAdmin, requireAuth } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createMissionSchema, validateAndSanitize } from "@/lib/validation"

// GET all missions
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 100 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const isStaff = authResult.user.role === "admin" || authResult.user.role === "volunteer"

    const missions = await prisma.mission.findMany({
      // Regular users only ever see missions assigned to them.
      where: isStaff ? {} : { assignedTo: authResult.user.id },
      include: {
        assignedToUser: { select: { id: true, name: true, username: true } },
        assignedByUser: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ missions })
  } catch (error) {
    console.error("Get missions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create a mission (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 20 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const validation = validateAndSanitize(createMissionSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { title, description, instructions, priority, status, dueDate, location, assignedTo } = validation.data

    // The assignee must exist.
    const assignee = await prisma.user.findUnique({ where: { id: assignedTo } })
    if (!assignee) {
      return NextResponse.json({ error: "Assigned user not found" }, { status: 400 })
    }

    const mission = await prisma.mission.create({
      data: {
        title,
        description,
        instructions,
        priority,
        status,
        dueDate: dueDate || null,
        location: location || null,
        assignedTo,
        assignedBy: authResult.user.id,
      },
      include: {
        assignedToUser: { select: { id: true, name: true, username: true } },
        assignedByUser: { select: { id: true, name: true, username: true } },
      },
    })

    // Add audit log
    await prisma.auditLog.create({
      data: {
        type: "mission_created",
        action: "Mission created",
        details: `Mission '${mission.title}' created`,
        severity: "info",
        userId: authResult.user.id,
      },
    })

    return NextResponse.json({ mission, message: "Mission created successfully" })
  } catch (error) {
    console.error("Create mission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
