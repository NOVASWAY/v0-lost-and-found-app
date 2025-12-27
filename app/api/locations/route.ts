import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// GET all locations
export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ locations })
  } catch (error) {
    console.error("Get locations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create location
export async function POST(request: NextRequest) {
  try {
    const { name, description, userId } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Location name is required" }, { status: 400 })
    }

    const location = await prisma.location.create({
      data: {
        name,
        description: description || null,
      },
    })

    // Add audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          type: "location_created",
          action: "Location created",
          details: `Location '${name}' created`,
          severity: "info",
          userId,
        },
      })
    }

    return NextResponse.json({ location, message: "Location created successfully" })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Location name already exists" }, { status: 400 })
    }
    console.error("Create location error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

