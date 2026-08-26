import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { comparePassword } from "@/lib/db"
import { loginSchema, validateAndSanitize } from "@/lib/validation"
import { rateLimit, resetRateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { signAccessToken } from "@/lib/jwt"
import { assertSameOrigin } from "@/lib/security"

// A valid bcrypt hash of a throwaway string. Used to equalize the bcrypt timing
// for unknown usernames so an attacker cannot enumerate accounts via response time.
const DUMMY_PASSWORD_HASH =
  "$2b$10$JtcNr0iq/uWvfuMZPhaA5.joby.YGJAM5gDRs6Yr/oTKwTUwmLgtO"

const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_LOGIN_FAILURES = 5

export async function POST(request: NextRequest) {
  try {
    // CSRF: only accept login attempts originating from this site.
    if (!assertSameOrigin(request)) {
      return NextResponse.json({ error: "Forbidden - Cross-site request rejected" }, { status: 403 })
    }

    // Rate limiting - stricter for login (5 attempts per minute per client).
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

    // Account lockout: after MAX_LOGIN_FAILURES failed attempts within the
    // window, the account is locked until the window elapses. Keyed on the
    // username (not IP) so distributed brute-force from many IPs is throttled.
    const lockoutKey = `login-fail:${username}`
    const lockoutCheck = await rateLimit(lockoutKey, {
      windowMs: LOGIN_WINDOW_MS,
      maxRequests: MAX_LOGIN_FAILURES,
    })
    if (!lockoutCheck.allowed) {
      await prisma.auditLog.create({
        data: {
          type: "login",
          action: "Login blocked",
          details: `Login for '${username}' blocked by lockout until ${new Date(lockoutCheck.resetTime).toISOString()}`,
          severity: "warning",
        },
      })
      return NextResponse.json(
        {
          error: `Account temporarily locked. Try again after ${new Date(lockoutCheck.resetTime).toLocaleTimeString()}.`,
        },
        { status: 429 }
      )
    }

    const recordFailure = async (reason: string) => {
      await prisma.auditLog.create({
        data: {
          type: "login",
          action: "Login failed",
          details: `Failed login for '${username}': ${reason}`,
          severity: "warning",
        },
      })
    }

    try {
      const user = await prisma.user.findUnique({
        where: { username },
      })

      // Always run a bcrypt compare (real user's hash or a dummy hash) so the
      // response time does not reveal whether the username exists.
      const passwordHash = user?.password ?? DUMMY_PASSWORD_HASH
      const isValidPassword = await comparePassword(password, passwordHash)

      if (!user || !isValidPassword) {
        await recordFailure(user ? "Invalid password" : "Unknown username")
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
      }

      // Clear the failed-attempt counter on success.
      await resetRateLimit(lockoutKey)

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

      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = user
      const accessToken = signAccessToken({
        sub: user.id,
        role: user.role,
        username: user.username,
        name: user.name,
        tokenVersion: user.tokenVersion,
      })

      // The access token is delivered ONLY via an httpOnly cookie so it can never be
      // read or stored by client-side JavaScript (mitigates token theft via XSS).
      const response = NextResponse.json(
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

      response.cookies.set("auth_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8, // 8 hours
      })

      return response
    } catch (dbError) {
      console.error("Database error during login:", dbError)
      return NextResponse.json(
        { error: "Database error during authentication" },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
