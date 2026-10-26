import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { requireAdminOrVolunteer, requireAdmin } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { assertSameOrigin, parsePagination, readJsonBody, sanitizeSearchQuery, validateRouteId } from "@/lib/security"
import { createOccurrenceBookSchema, validateAndSanitize } from "@/lib/validation"

const OCCURRENCE_SEVERITIES = ["low", "medium", "high", "critical"] as const
const OCCURRENCE_STATUSES = ["open", "investigating", "resolved", "closed"] as const

// Occurrence reports contain sensitive security details; restrict reads to staff.
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdminOrVolunteer(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 100 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = sanitizeSearchQuery(searchParams.get("search") || "")
    const categoryId = searchParams.get("categoryId") || ""
    const severity = searchParams.get("severity") || ""
    const status = searchParams.get("status") || ""
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 200, maxLimit: 500 })

    if (categoryId) {
      const idValidation = validateRouteId(categoryId)
      if (!idValidation.valid) {
        return NextResponse.json({ error: "Invalid category ID format" }, { status: 400 })
      }
    }
    if (severity && !OCCURRENCE_SEVERITIES.includes(severity as (typeof OCCURRENCE_SEVERITIES)[number])) {
      return NextResponse.json({ error: "Invalid severity filter" }, { status: 400 })
    }
    if (status && !OCCURRENCE_STATUSES.includes(status as (typeof OCCURRENCE_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status filter" }, { status: 400 })
    }

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ]
    }
    if (categoryId) where.categoryId = categoryId
    if (severity) where.severity = severity
    if (status) where.status = status

    const occurrences = await prisma.occurrenceBook.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, color: true } },
        reportedBy: { select: { id: true, name: true } },
      },
      orderBy: [
        { entryNumber: "desc" },
      ],
      skip,
      take: limit,
    })

    return NextResponse.json({ occurrences, pagination: { page, limit } })
  } catch (error) {
    console.error("Get occurrence book error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create occurrence (admin only)
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
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const jsonBody = await readJsonBody(request)
    if (!jsonBody.ok) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const body = jsonBody.data
    const validation = validateAndSanitize(createOccurrenceBookSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const data = validation.data

    // Verify category exists
    const category = await prisma.occurrenceCategory.findUnique({ where: { id: data.categoryId } })
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // Verify linked items/claims if provided
    if (data.linkedItemId) {
      const item = await prisma.item.findUnique({ where: { id: data.linkedItemId } })
      if (!item) return NextResponse.json({ error: "Linked item not found" }, { status: 404 })
    }
    if (data.linkedClaimId) {
      const claim = await prisma.claim.findUnique({ where: { id: data.linkedClaimId } })
      if (!claim) return NextResponse.json({ error: "Linked claim not found" }, { status: 404 })
    }

    // Generate next entry number
    const lastEntry = await prisma.occurrenceBook.findFirst({
      orderBy: { entryNumber: "desc" },
      select: { entryNumber: true },
    })
    const nextEntryNumber = (lastEntry?.entryNumber ?? 0) + 1

    const occurrence = await prisma.occurrenceBook.create({
      data: {
        entryNumber: nextEntryNumber,
        title: data.title,
        description: data.description,
        location: data.location || null,
        severity: data.severity,
        status: data.status,
        occurrenceDate: data.occurrenceDate,
        occurrenceTime: data.occurrenceTime || null,
        attachments: data.attachments as unknown as Prisma.InputJsonValue,
        notes: data.notes || null,
        followUpRequired: data.followUpRequired,
        followUpNotes: data.followUpNotes || null,
        categoryId: data.categoryId,
        reportedById: authResult.user.id,
        linkedItemId: data.linkedItemId || null,
        linkedClaimId: data.linkedClaimId || null,
      },
      include: {
        category: { select: { id: true, name: true, color: true } },
        reportedBy: { select: { id: true, name: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        type: "occurrence_book_created",
        action: "Occurrence created",
        details: `Occurrence OB-${String(nextEntryNumber).padStart(4, "0")} '${data.title}' created`,
        severity: "info",
        userId: authResult.user.id,
      },
    })

    return NextResponse.json({ occurrence, message: "Occurrence created successfully" })
  } catch (error) {
    console.error("Create occurrence error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
