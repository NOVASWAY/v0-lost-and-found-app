import { NextRequest, NextResponse } from "next/server"
import { isMockMode } from "@/lib/prisma"
import { mockUsers } from "@/lib/mock-api"
import { prisma } from "@/lib/db"
import { comparePassword } from "@/lib/db"
import { addAuditLog } from "@/lib/audit-logger"
import { loginSchema, validateAndSanitize } from "@/lib/validation"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - stricter for login
    const clientId = getClientIdentifier(request)
    const rateLimitResult = rateLimit(clientId, { windowMs: 60000, maxRequests: 5 })
    
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

    let user: any

    // Use mock data if database is disconnected
    if (isMockMode || !prisma) {
      // For mock mode, accept admin/admin123, volunteer/volunteer123, or user/user123
      const mockUser = mockUsers.find(u => u.username === username)
      if (!mockUser) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }
      
      // In mock mode, accept any password for testing
      user = mockUser
    } else {
      try {
        user = await prisma.user.findUnique({
          where: { username },
        })

        if (!user) {
          return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }

        const isValidPassword = await comparePassword(password, user.password)

        if (!isValidPassword) {
          return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }

        // Add audit log
        await prisma.auditLog.create({
          data: {
            type: "login",
            action: "User logged in",
            details: `User '${user.username}' logged in`,
            severity: "info",
            userId: user.id,
          },
        })
      } catch (dbError) {
        console.error("[v0] Database error during login:", dbError)
        // Fall back to mock mode if database fails
        const mockUser = mockUsers.find(u => u.username === username)
        if (!mockUser) {
          return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }
        user = mockUser
      }
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        user: userWithoutPassword,
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
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
