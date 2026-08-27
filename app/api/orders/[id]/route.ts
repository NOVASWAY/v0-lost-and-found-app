import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { assertSameOrigin, validateRouteId } from "@/lib/security"
import { requireAuth } from "@/lib/auth-middleware"
import { updateOrderSchema, validateAndSanitize } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

// PATCH update order (mark as read)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!assertSameOrigin(request)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
    }

    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 20 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    const { id } = await params

    // Validate ID to prevent path traversal
    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }

    const data = await request.json()
    const validation = validateAndSanitize(updateOrderSchema, data)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Only the recipient or staff may mark an order as read.
    const isStaff = authResult.user.role === "admin" || authResult.user.role === "volunteer"
    if (order.userId !== authResult.user.id && !isStaff) {
      return NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 })
    }

    const { status } = validation.data

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ order: updatedOrder, message: "Order updated successfully" })
  } catch (error) {
    console.error("Update order error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
