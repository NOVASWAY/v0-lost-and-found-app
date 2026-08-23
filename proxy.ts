import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import crypto from "crypto"
import { verifyAccessToken } from "@/lib/jwt"
import { prisma } from "@/lib/db"

export async function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production"
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")

  const cspHeader = `default-src 'self'; script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'`

  // Forward the nonce + CSP via request headers so Next.js can inject the nonce
  // into inline scripts during server rendering. Also set on the response so the
  // browser enforces the policy.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("Content-Security-Policy", cspHeader)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Security Headers
  response.headers.set("X-DNS-Prefetch-Control", "off")
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "no-referrer")
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none")
  response.headers.set("Content-Security-Policy", cspHeader)

  // Permissions Policy - Deny dangerous features
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  )

  // Additional security headers
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin")
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin")

  // ---- Server-side route protection ----
  // Enforce authentication/authorization for privileged area before the page renders,
  // so access is not left to client-side checks alone.
  const { pathname } = request.nextUrl

  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/")
  const isVolunteerPath = pathname === "/volunteer" || pathname.startsWith("/volunteer/")

  if (isAdminPath || isVolunteerPath) {
    const token = request.cookies.get("auth_token")?.value
    const payload = token ? verifyAccessToken(token) : null

    // Re-validate against the database: reject stale/revoked sessions (tokenVersion
    // bumped on password change) and reflect the user's CURRENT role, so a demoted
    // or deleted account loses privileged page access immediately rather than for
    // the remainder of the (up to 8h) token lifetime.
    let currentRole: string | null = null
    if (payload && prisma) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.sub },
          select: { role: true, tokenVersion: true },
        })
        if (user && user.tokenVersion === payload.tokenVersion) {
          currentRole = user.role
        }
      } catch {
        // DB unavailable — deny privileged access rather than granting by default.
        currentRole = null
      }
    }

    const isAdmin = currentRole === "admin"
    const isStaff = currentRole === "admin" || currentRole === "volunteer"

    if ((isAdminPath && !isAdmin) || (isVolunteerPath && !isStaff)) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.search = ""
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}