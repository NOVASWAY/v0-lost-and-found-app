import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth, requireAdmin } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { assertSameOrigin } from "@/lib/security"
import { createOccurrenceCategorySchema, validateAndSanitize } from "@/lib/validation"

// GET all active occurrence categories (all authenticated users)
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

    const categories = await prisma.occurrenceCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Get occurrence categories error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create occurrence category (admin only)
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
    const validation = validateAndSanitize(createOccurrenceCategorySchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { name, color } = validation.data

    const existing = await prisma.occurrenceCategory.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 })
    }

    const category = await prisma.occurrenceCategory.create({
      data: { name, color },
    })

    await prisma.auditLog.create({
      data: {
        type: "occurrence_category_created",
        action: "Occurrence category created",
        details: `Occurrence category '${name}' created`,
        severity: "info",
        userId: authResult.user.id,
      },
    })

    return NextResponse.json({ category, message: "Category created successfully" })
  } catch (error) {
    console.error("Create occurrence category error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
