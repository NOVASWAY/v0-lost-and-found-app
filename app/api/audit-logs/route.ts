import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { parsePagination, sanitizeSearchQuery } from "@/lib/security"

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
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 50, maxLimit: 200 })

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
    if (type && AUDIT_LOG_TYPES.includes(type as (typeof AUDIT_LOG_TYPES)[number])) {
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

// Every audit type the system can record. The GET filter and the POST
// allowlist are both derived from this list so they cannot drift apart.
const AUDIT_LOG_TYPES = [
  "user_created",
  "user_deleted",
  "user_updated",
  "user_role_changed",
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
  "mission_deleted",
  "meeting_minutes_created",
  "meeting_minutes_updated",
  "meeting_minutes_deleted",
  "donation_expired",
  "system_settings_updated",
  "login",
  "logout",
  "order_sent",
  "occurrence_book_created",
  "occurrence_book_updated",
  "occurrence_book_deleted",
  "occurrence_category_created",
  "occurrence_category_updated",
  "occurrence_category_deleted",
] as const

// Audit writes are server-only (route handlers that own the event). Clients
// cannot append rows — login/logout/password-change are recorded by those
// auth routes themselves.
export async function POST() {
  return NextResponse.json(
    { error: "Audit logs are recorded server-side only" },
    { status: 405 },
  )
}
