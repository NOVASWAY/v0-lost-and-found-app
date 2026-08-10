import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const enc = new TextEncoder()

function base64UrlDecodeBytes(input: string): Uint8Array {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/")
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4)
  let bin: string
  try {
    bin = atob(padded)
  } catch {
    return new Uint8Array(0)
  }
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function base64UrlDecodeString(input: string): string {
  return new TextDecoder().decode(base64UrlDecodeBytes(input))
}

async function verifyJwt(token: string, secret: string): Promise<{ sub: string; role: string; exp: number } | null> {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [header, payload, signature] = parts

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    )
    const expectedSig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${payload}`)))
    const actualSig = base64UrlDecodeBytes(signature)

    if (actualSig.length !== expectedSig.length) return null
    let diff = 0
    for (let i = 0; i < expectedSig.length; i++) {
      diff |= expectedSig[i] ^ actualSig[i]
    }
    if (diff !== 0) return null

    const decoded = JSON.parse(base64UrlDecodeString(payload)) as Partial<{ sub: string; role: string; exp: number }>
    if (!decoded.sub || !decoded.role || typeof decoded.exp !== "number") return null
    if (decoded.exp <= Math.floor(Date.now() / 1000)) return null
    return { sub: decoded.sub, role: decoded.role, exp: decoded.exp }
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()

  // Security Headers
  response.headers.set("X-DNS-Prefetch-Control", "off")
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "no-referrer")
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none")

  // Enhanced CSP - Allow audio for background music
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; audio-src 'self' https:; connect-src 'self'; frame-ancestors 'none'"
  )

  // Permissions Policy - Deny dangerous features
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  )

  // Additional security headers
  response.headers.set("Cross-Origin-Embedder-Policy", "require-corp")
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
    const secret = process.env.JWT_SECRET
    const payload = token && secret ? await verifyJwt(token, secret) : null

    const isAdmin = payload?.role === "admin"
    const isStaff = payload && (payload.role === "admin" || payload.role === "volunteer")

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
