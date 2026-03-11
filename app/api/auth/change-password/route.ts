import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { comparePassword, hashPassword } from "@/lib/db"
import { changePasswordSchema, validateAndSanitize } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - stricter for password changes
    const clientId = getClientIdentifier(request)
    const rateLimitResult = rateLimit(clientId, { windowMs: 300000, maxRequests: 5 }) // 5 attempts per 5 minutes
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many password change attempts. Please try again later." }, { status: 429 })
    }

    const body = await request.json()
    const validation = validateAndSanitize(changePasswordSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { userId, currentPassword, newPassword } = validation.data

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password)

    if (!isValidPassword) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    // Add audit log
    await prisma.auditLog.create({
      data: {
        type: "user_password_changed",
        action: "Password changed",
        details: "User password updated",
        severity: "info",
        userId: user.id,
      },
    })

    return NextResponse.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
