import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAdmin, requireAuth } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { sanitizeSearchQuery } from "@/lib/security"
import { z } from "zod"

// GET all audit logs (admin only)
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authResult = await requireAdmin(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 100 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = sanitizeSearchQuery(searchParams.get("search") || "")
    const type = searchParams.get("type")
    const severity = searchParams.get("severity")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200) // Max 200 per page
    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    // Validate type and severity to prevent injection
    const validSeverities = ["info", "warning", "error", "critical"]
    if (type && typeof type === "string" && !type.includes("..")) {
      where.type = type
    }

    if (severity && validSeverities.includes(severity)) {
      where.severity = severity
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get audit logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Whitelist of audit log types the client may record. Anything not listed here
// is rejected so callers cannot forge arbitrary audit entries.
const ALLOWED_TYPES = [
  "user_created",
  "user_deleted",
  "user_password_changed",
  "item_uploaded",
  "item_claimed",
  "item_released",
  "item_donated",
  "attendance_marked",
  "service_marked",
  "location_created",
  "location_updated",
  "location_deleted",
  "playbook_created",
  "playbook_updated",
  "playbook_deleted",
  "mission_created",
  "mission_assigned",
  "mission_completed",
  "mission_cancelled",
  "system_settings_updated",
  "login",
  "logout",
  "order_sent",
] as const

const createAuditLogSchema = z.object({
  type: z.enum(ALLOWED_TYPES),
  action: z.string().min(1).max(200).trim(),
  details: z.string().max(500).trim().optional(),
  severity: z.enum(["info", "warning", "error", "critical"]).default("info"),
})

// POST record an audit log entry. The acting user is always derived from the
// authenticated session — never trusted from the client — so the trail cannot
// be forged by spoofing userId/userName in the request body.
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 30 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const parsed = createAuditLogSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const log = await prisma.auditLog.create({
      data: {
        type: parsed.data.type,
        action: parsed.data.action,
        details: parsed.data.details || null,
        severity: parsed.data.severity,
        userId: authResult.user.id,
      },
    })

    return NextResponse.json({ log, message: "Audit log created" }, { status: 201 })
  } catch (error) {
    console.error("Create audit log error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
