import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createPlaybookSchema, validateAndSanitize } from "@/lib/validation"

// GET all playbooks
export async function GET() {
  try {
    const playbooks = await prisma.playbook.findMany({
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ playbooks })
  } catch (error) {
    console.error("Get playbooks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create playbook (admin only)
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
    const validation = validateAndSanitize(createPlaybookSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { title, scenario, protocol, priority, userId } = validation.data

    const playbook = await prisma.playbook.create({
      data: {
        title,
        scenario,
        protocol,
        priority: priority || "medium",
      },
    })

    // Add audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          type: "playbook_created",
          action: "Playbook created",
          details: `Playbook '${title}' created`,
          severity: "info",
          userId,
        },
      })
    }

    return NextResponse.json({ playbook, message: "Playbook created successfully" })
  } catch (error) {
    console.error("Create playbook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
