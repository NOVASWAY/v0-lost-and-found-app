import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET all items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const location = searchParams.get("location")

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

    const items = await prisma.item.findMany({
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
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Get items error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create new item
export async function POST(request: NextRequest) {
  try {
    const {
      imageUrl,
      category,
      color,
      location,
      dateFounded,
      description,
      uniqueMarkings,
      uploadedById,
    } = await request.json()

    if (!imageUrl || !category || !location || !dateFounded || !uploadedById) {
      return NextResponse.json({ error: "Required fields are missing" }, { status: 400 })
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

