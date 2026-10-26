import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import crypto from "crypto"
import { verifyAccessToken } from "@/lib/jwt"
import { prisma, withDbRetry } from "@/lib/db"
import { isStaffRole, isUserRole } from "@/lib/domain"

export async function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production"
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")

  const cspHeader = `default-src 'self'; script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'`

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

  // Enforce page access on the server before rendering; client-side redirects
  // remain a UX fallback, not an authorization boundary.
  const { pathname } = request.nextUrl
  const matchesPath = (path: string) => pathname === path || pathname.startsWith(`${path}/`)
  const isAdminPath = matchesPath("/admin")
  const isVolunteerPath = matchesPath("/volunteer")
  const isVolunteerDashboard = pathname === "/volunteer/dashboard"
  const requiresStaff = ["/playbooks"].some(matchesPath)
  const requiresUser = [
    "/dashboard",
    "/browse",
    "/items",
    "/missions",
    "/my-claims",
    "/my-uploads",
    "/orders",
    "/profile",
    "/upload",
  ].some(matchesPath)
  const requiresAuth = isAdminPath || isVolunteerPath || requiresStaff || requiresUser

  if (requiresAuth) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0")
    const token = request.cookies.get("auth_token")?.value
    const payload = token ? verifyAccessToken(token) : null

    let currentRole: string | null = null
    if (payload && prisma) {
      try {
        const user = await withDbRetry(() =>
          prisma.user.findUnique({
            where: { id: payload.sub },
            select: { role: true, tokenVersion: true },
          }),
        )
        if (user && user.tokenVersion === payload.tokenVersion && isUserRole(user.role)) {
          currentRole = user.role
        }
      } catch {
        currentRole = null
      }
    }

    const hasSession = currentRole !== null
    const allowed = isAdminPath
      ? currentRole === "admin"
      : isVolunteerDashboard
        ? currentRole === "volunteer"
        : isVolunteerPath || requiresStaff
          ? isStaffRole(currentRole)
          : hasSession

    if (!allowed) {
      const url = request.nextUrl.clone()
      url.pathname = hasSession ? (currentRole === "admin" ? "/admin" : "/dashboard") : "/login"
      url.search = ""
      const redirect = NextResponse.redirect(url)
      redirect.headers.set("Cache-Control", "private, no-store, max-age=0")
      return redirect
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
