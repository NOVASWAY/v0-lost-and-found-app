import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createItemSchema, validateAndSanitize } from "@/lib/validation"
import { ITEM_STATUSES } from "@/lib/domain"
import { assertSameOrigin, parsePagination, readJsonBody, sanitizeSearchQuery, validateRouteId } from "@/lib/security"
import { isOwnPrivateBlobUrl, safePrivateBlobDisplayUrl } from "@/lib/private-blob"
import { requireAuth } from "@/lib/auth-middleware"
import { refreshUserRanks } from "@/lib/ranking"
import { awardPoints } from "@/lib/points"

// GET all items
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult

    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 100 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = sanitizeSearchQuery(searchParams.get("search") || "")
    const status = searchParams.get("status")
    const category = sanitizeSearchQuery(searchParams.get("category") || "")
    const location = sanitizeSearchQuery(searchParams.get("location") || "")
    const uploadedById = searchParams.get("uploadedById")
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 20, maxLimit: 100 })
    const isStaff = authResult.user.role === "admin" || authResult.user.role === "volunteer"
    const where: Prisma.ItemWhereInput = {}

    if (status && !ITEM_STATUSES.includes(status as (typeof ITEM_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status filter" }, { status: 400 })
    }
    if (search) {
      where.OR = [
        { category: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }
    if (status) where.status = status
    if (category) where.category = { contains: category, mode: "insensitive" }
    if (location) where.location = { contains: location, mode: "insensitive" }

    if (uploadedById) {
      const idValidation = validateRouteId(uploadedById)
      if (!idValidation.valid) {
        return NextResponse.json({ error: "Invalid uploader ID format" }, { status: 400 })
      }
      if (!isStaff && uploadedById !== authResult.user.id) {
        return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
      }
      where.uploadedById = uploadedById
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          uploadedBy: { select: isStaff ? { id: true, name: true, username: true } : { id: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.item.count({ where }),
    ])

    const visibleItems = items.map((item) => {
      const visibleItem = isStaff ? item : { ...item, uniqueMarkings: undefined }
      return { ...visibleItem, imageUrl: safePrivateBlobDisplayUrl(item.imageUrl) }
    })

    return NextResponse.json(
      {
        items: visibleItems,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
  } catch (error) {
    console.error("Get items error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create new item
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!assertSameOrigin(request)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
    }

    // Rate limiting
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
    const validation = validateAndSanitize(createItemSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const {
      imageUrl,
      category,
      color,
      location,
      dateFounded,
      description,
      uniqueMarkings,
    } = validation.data
    const uploadedById = authResult.user.id

    if (!isOwnPrivateBlobUrl(imageUrl, uploadedById, "item")) {
      return NextResponse.json({ error: "Item photo must be an upload owned by the current user" }, { status: 400 })
    }

    // Calculate donation deadline (30 days from found date)
    const foundDate = new Date(dateFounded)
    const donationDeadline = new Date(foundDate)
    donationDeadline.setDate(donationDeadline.getDate() + 30)

    const { item, pointsAwarded } = await prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          imageUrl,
          category,
          color: color || "Unknown",
          location,
          dateFounded: foundDate,
          description: description || "",
          uniqueMarkings: uniqueMarkings || null,
          status: "available",
          donationDeadline,
          uploadedById,
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
      })

      await tx.user.update({
        where: { id: uploadedById },
        data: { itemsUploaded: { increment: 1 } },
      })

      const pointResult = await awardPoints({
        tx,
        userId: uploadedById,
        action: "item_uploaded",
        referenceId: item.id,
      })

      await tx.auditLog.create({
        data: {
          type: "item_uploaded",
          action: "Item uploaded",
          details: `${category} uploaded from ${location}`,
          severity: "info",
          userId: uploadedById,
        },
      })

      return { item, pointsAwarded: pointResult.awarded }
    })

    if (pointsAwarded) await refreshUserRanks()

    return NextResponse.json(
      { item, message: "Item created successfully" },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
  } catch (error) {
    console.error("Create item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
