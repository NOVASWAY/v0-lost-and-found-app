import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { comparePassword, hashPassword } from "@/lib/db"
import { changePasswordSchema, validateAndSanitize } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { requireAuth } from "@/lib/auth-middleware"
import { signAccessToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Rate limiting - stricter for password changes
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 300000, maxRequests: 5 }) // 5 attempts per 5 minutes
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many password change attempts. Please try again later." }, { status: 429 })
    }

    const body = await request.json()
    const validation = validateAndSanitize(changePasswordSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { currentPassword, newPassword } = validation.data
    const userId = authResult.user.id

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

    // Bump tokenVersion to revoke every existing session (other devices/browsers).
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, tokenVersion: { increment: 1 } },
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

    // Issue a fresh cookie carrying the new tokenVersion so the current session
    // stays active while all previously issued tokens are now invalid.
    const newToken = signAccessToken({
      sub: user.id,
      role: user.role,
      username: user.username,
      name: user.name,
      tokenVersion: updatedUser.tokenVersion,
    })

    const response = NextResponse.json({ message: "Password changed successfully" })
    response.cookies.set("auth_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    })

    return response
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
