import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { requireAuth, requireAdmin } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { assertSameOrigin, sanitizeSearchQuery } from "@/lib/security"
import { createOccurrenceBookSchema, validateAndSanitize } from "@/lib/validation"

// GET all occurrences (all authenticated users)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 100 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const search = sanitizeSearchQuery(request.nextUrl.searchParams.get("search") || "")
    const categoryId = request.nextUrl.searchParams.get("categoryId") || ""
    const severity = request.nextUrl.searchParams.get("severity") || ""
    const status = request.nextUrl.searchParams.get("status") || ""

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
    })

    return NextResponse.json({ occurrences })
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

    const body = await request.json()
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
