import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
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
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'; img-src 'self' data: https: blob:; font-src 'self' data:; audio-src 'self' https://assets.mixkit.co; connect-src 'self'; media-src 'self' https://assets.mixkit.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;"
  )
  
  // Permissions Policy - Deny dangerous features
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()")
  
  // Additional security headers
  response.headers.set("Cross-Origin-Embedder-Policy", "require-corp")
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin")
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin")

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
