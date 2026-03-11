import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createLocationSchema, validateAndSanitize } from "@/lib/validation"

// GET all locations
export async function GET() {
  try {
    // Rate limiting
    const locations = await prisma.location.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ locations })
  } catch (error) {
    console.error("Get locations error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create location (admin only)
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = rateLimit(clientId, { windowMs: 60000, maxRequests: 20 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const validation = validateAndSanitize(createLocationSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { name, description, userId } = validation.data

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
