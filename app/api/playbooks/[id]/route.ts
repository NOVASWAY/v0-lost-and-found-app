import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { validateRouteId } from "@/lib/security"

// PATCH update playbook (admin only)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params
    
    // Validate ID to prevent path traversal
    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }
    
    const { title, scenario, protocol, priority, userId } = await request.json()

    const playbook = await prisma.playbook.findUnique({
      where: { id },
    })

    if (!playbook) {
      return NextResponse.json({ error: "Playbook not found" }, { status: 404 })
    }

    const updatedPlaybook = await prisma.playbook.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(scenario && { scenario }),
        ...(protocol && { protocol }),
        ...(priority && { priority }),
      },
    })

    // Add audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          type: "playbook_updated",
          action: "Playbook updated",
          details: `Playbook '${playbook.title}' updated`,
          severity: "info",
          userId,
        },
      })
    }

    return NextResponse.json({ playbook: updatedPlaybook, message: "Playbook updated successfully" })
  } catch (error) {
    console.error("Update playbook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE playbook (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params
    
    // Validate ID to prevent path traversal
    const idValidation = validateRouteId(id)
    if (!idValidation.valid) {
      return NextResponse.json({ error: idValidation.error || "Invalid ID format" }, { status: 400 })
    }
    
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    const playbook = await prisma.playbook.findUnique({
      where: { id },
    })

    if (!playbook) {
      return NextResponse.json({ error: "Playbook not found" }, { status: 404 })
    }

    await prisma.playbook.delete({
      where: { id },
    })

    // Add audit log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          type: "playbook_deleted",
          action: "Playbook deleted",
          details: `Playbook '${playbook.title}' deleted`,
          severity: "warning",
          userId,
        },
      })
    }

    return NextResponse.json({ message: "Playbook deleted successfully" })
  } catch (error) {
    console.error("Delete playbook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
