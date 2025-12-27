import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createItemSchema, validateAndSanitize } from "@/lib/validation"

// GET all items
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = rateLimit(clientId, { windowMs: 60000, maxRequests: 100 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const location = searchParams.get("location")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100) // Max 100 per page
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { category: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = { contains: category, mode: "insensitive" }
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" }
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          claims: {
            select: {
              id: true,
              status: true,
              claimantName: true,
              claimedAt: true,
            },
            take: 5, // Limit claims per item
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.item.count({ where }),
    ])

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
    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = rateLimit(clientId, { windowMs: 60000, maxRequests: 20 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
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
      uploadedById,
    } = validation.data

    // Validate image URL format and size (basic check)
    if (imageUrl.length > 5000) {
      return NextResponse.json({ error: "Image URL too long" }, { status: 400 })
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

    // Update user stats
    await prisma.user.update({
      where: { id: uploadedById },
      data: {
        itemsUploaded: { increment: 1 },
        vaultPoints: { increment: 50 },
      },
    })

    // Add audit log
    const user = await prisma.user.findUnique({ where: { id: uploadedById } })
    await prisma.auditLog.create({
      data: {
        type: "item_uploaded",
        action: "Item uploaded",
        details: `${category} uploaded from ${location}`,
        severity: "info",
        userId: uploadedById,
      },
    })

    return NextResponse.json({ item, message: "Item created successfully" })
  } catch (error) {
    console.error("Create item error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

