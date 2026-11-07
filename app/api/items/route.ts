import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createItemSchema, validateAndSanitize } from "@/lib/validation"
import {
  assertSameOrigin,
  parsePagination,
  readJsonBody,
  redactItemSecrets,
  sanitizeSearchQuery,
  toPublicItem,
  validateRouteId,
  validateUploadUrl,
} from "@/lib/security"
import { getAuthenticatedUser, requireAuth } from "@/lib/auth-middleware"
import { awardPoints } from "@/lib/points"
import { withProxiedMedia, withProxiedMediaList } from "@/lib/media"

// GET all items
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 100 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const viewer = await getAuthenticatedUser(request)

    const searchParams = request.nextUrl.searchParams
    const search = sanitizeSearchQuery(searchParams.get("search") || "")
    const status = searchParams.get("status")
    const category = sanitizeSearchQuery(searchParams.get("category") || "")
    const location = sanitizeSearchQuery(searchParams.get("location") || "")
    const uploadedById = searchParams.get("uploadedById")
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 20, maxLimit: 100 })

    // Validate status enum
    const validStatuses = ["available", "claimed", "released", "donated", "pending", "expired"]
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { category: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status && validStatuses.includes(status)) {
      where.status = status
    }

    if (category) {
      where.category = { contains: category, mode: "insensitive" }
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" }
    }

    // Uploader filter is only for the signed-in owner (my-uploads) or staff.
    // Anonymous callers must not enumerate another member's uploads by id.
    if (uploadedById) {
      const idValidation = validateRouteId(uploadedById)
      if (!idValidation.valid) {
        return NextResponse.json({ error: "Invalid uploader ID format" }, { status: 400 })
      }
      if (!viewer) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      const isStaff = viewer.role === "admin" || viewer.role === "volunteer"
      if (!isStaff && uploadedById !== viewer.id) {
        return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
      }
      where.uploadedById = uploadedById
    }

    const [rows, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          // Public list endpoint: do not expose uploader identity or claimant PII.
          uploadedBy: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.item.count({ where }),
    ])

    // Unauthenticated catalog: landing-page teaser only — no uniqueMarkings /
    // description that would leak claim-proof details. Media URLs are rewritten
    // to /api/media so browsers never hit private Blob storage directly.
    const projected = viewer
      ? rows.map((item) => redactItemSecrets(item, viewer))
      : rows.map((item) => toPublicItem(item as unknown as Record<string, unknown>))
    const items = withProxiedMediaList(projected as Array<{ imageUrl?: string | null }>)

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
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

    // Validate image URL — production requires a Vercel Blob upload URL.
    const urlValidation = validateUploadUrl(imageUrl)
    if (!urlValidation.valid) {
      return NextResponse.json({ error: urlValidation.error || "Invalid image URL" }, { status: 400 })
    }

    // Calculate donation deadline (30 days from found date)
    const foundDate = new Date(dateFounded)
    const donationDeadline = new Date(foundDate)
    donationDeadline.setDate(donationDeadline.getDate() + 30)

    const item = await prisma.item.create({
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

    await prisma.user.update({
      where: { id: uploadedById },
      data: { itemsUploaded: { increment: 1 } },
    })

    await awardPoints({
      userId: uploadedById,
      action: "item_uploaded",
      referenceId: item.id,
      fallbackPoints: 15,
    })

    await prisma.auditLog.create({
      data: {
        type: "item_uploaded",
        action: "Item uploaded",
        details: `${category} uploaded from ${location}`,
        severity: "info",
        userId: uploadedById,
      },
    })

    return NextResponse.json({ item: withProxiedMedia(item), message: "Item created successfully" })
  } catch (error) {
    console.error("Create item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
