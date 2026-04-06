import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { comparePassword } from "@/lib/db"
import { loginSchema, validateAndSanitize } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { signAccessToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - stricter for login (5 attempts per minute)
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 5 })
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }

    const body = await request.json()
    const validation = validateAndSanitize(loginSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { username, password } = validation.data

    // Production-only: Use database for authentication
    if (!prisma) {
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      )
    }

    try {
      const user = await prisma.user.findUnique({
        where: { username },
      })

      if (!user) {
        console.log("[v0] Login failed: User not found -", username)
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      // Verify password with bcrypt
      const isValidPassword = await comparePassword(password, user.password)

      if (!isValidPassword) {
        console.log("[v0] Login failed: Invalid password for user -", username)
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      // Add audit log for successful login
      await prisma.auditLog.create({
        data: {
          type: "login",
          action: "User logged in",
          details: `User '${user.username}' (${user.role}) logged in successfully`,
          severity: "info",
          userId: user.id,
        },
      })

      console.log("[v0] Login successful for user:", username, "role:", user.role)

      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = user
      const accessToken = signAccessToken({
        sub: user.id,
        role: user.role,
        username: user.username,
        name: user.name,
      })

      return NextResponse.json(
        {
          user: userWithoutPassword,
          accessToken,
          message: "Login successful",
        },
        {
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      )
    } catch (dbError) {
      console.error("[v0] Database error during login:", dbError)
      return NextResponse.json(
        { error: "Database error during authentication" },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
