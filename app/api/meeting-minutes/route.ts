import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { sanitizeSearchQuery } from "@/lib/security"
import { createMeetingMinutesSchema, validateAndSanitize } from "@/lib/validation"

// GET all meeting minutes (admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 100 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const search = sanitizeSearchQuery(request.nextUrl.searchParams.get("search") || "")

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { discussion: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ]
    }

    const minutes = await prisma.meetingMinutes.findMany({
      where,
      orderBy: { meetingDate: "desc" },
    })

    return NextResponse.json({ minutes })
  } catch (error) {
    console.error("Get meeting minutes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create meeting minutes (admin only)
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
    const validation = validateAndSanitize(createMeetingMinutesSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { title, meetingDate, location, attendees, agenda, discussion, actionItems, decisions, nextMeetingDate } = validation.data

    const minutes = await prisma.meetingMinutes.create({
      data: {
        title,
        meetingDate,
        location: location || null,
        attendees: attendees as unknown as Prisma.InputJsonValue,
        agenda: agenda as unknown as Prisma.InputJsonValue,
        discussion,
        actionItems: actionItems as unknown as Prisma.InputJsonValue,
        decisions: decisions as unknown as Prisma.InputJsonValue,
        nextMeetingDate: nextMeetingDate || null,
        // Identity comes from the session, never the request body.
        recordedBy: authResult.user.name,
      },
    })

    await prisma.auditLog.create({
      data: {
        type: "meeting_minutes_created",
        action: "Meeting minutes created",
        details: `Meeting minutes '${minutes.title}' created`,
        severity: "info",
        userId: authResult.user.id,
      },
    })

    return NextResponse.json({ minutes, message: "Meeting minutes created successfully" })
  } catch (error) {
    console.error("Create meeting minutes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
