import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth, requireAdmin } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { createOrderSchema, validateAndSanitize } from "@/lib/validation"
import { assertSameOrigin } from "@/lib/security"

// GET all orders
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Rate limiting
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 100 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const isStaff = authResult.user.role === "admin" || authResult.user.role === "volunteer"

    const orders = await prisma.order.findMany({
      where: isStaff ? {} : { userId: authResult.user.id },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Get orders error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create an order (security directive) for a user — admin only
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
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

    const body = await request.json()
    const validation = validateAndSanitize(createOrderSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { title, message, priority, userId } = validation.data

    // The recipient must exist.
    const recipient = await prisma.user.findUnique({ where: { id: userId } })
    if (!recipient) {
      return NextResponse.json({ error: "Recipient user not found" }, { status: 400 })
    }

    const order = await prisma.order.create({
      data: {
        title,
        message,
        priority,
        userId,
      },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
    })

    // Add audit log
    await prisma.auditLog.create({
      data: {
        type: "order_sent",
        action: "Security order sent",
        details: `Order '${order.title}' sent to ${recipient.name || recipient.username}`,
        severity: "info",
        userId: authResult.user.id,
      },
    })

    return NextResponse.json({ order, message: "Order created successfully" })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
