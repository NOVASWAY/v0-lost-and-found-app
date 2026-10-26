/**
 * Security utilities to prevent path traversal and other injection attacks
 */
import type { NextRequest } from "next/server"

/**
 * CSRF protection for state-changing browser requests. A missing Origin and
 * Referer is rejected; authenticated APIs must not treat headless requests as
 * same-origin just because the browser headers are absent.
 */
export function assertSameOrigin(request: NextRequest): boolean {
  const sourceHeaders = [request.headers.get("origin"), request.headers.get("referer")].filter(
    (value): value is string => Boolean(value),
  )

  if (sourceHeaders.length === 0) return false

  try {
    const allowedOrigins = new Set<string>()
    const requestUrl = new URL(request.url)
    if (requestUrl.protocol === "http:" || requestUrl.protocol === "https:") {
      allowedOrigins.add(requestUrl.origin)
    }

    for (const configured of [
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.VERCEL_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    ]) {
      if (!configured) continue
      const value = configured.includes("://") ? configured : `https://${configured}`
      const configuredUrl = new URL(value)
      if (configuredUrl.protocol === "http:" || configuredUrl.protocol === "https:") {
        allowedOrigins.add(configuredUrl.origin)
      }
    }

    return sourceHeaders.every((source) => {
      const sourceUrl = new URL(source)
      return (
        (sourceUrl.protocol === "http:" || sourceUrl.protocol === "https:") &&
        !sourceUrl.username &&
        !sourceUrl.password &&
        allowedOrigins.has(sourceUrl.origin)
      )
    })
  } catch {
    return false
  }
}


  try {
    const originUrl = new URL(origin)
    if (originUrl.protocol !== "http:" && originUrl.protocol !== "https:") {
      return false
    }

    const configured = process.env.NEXT_PUBLIC_SITE_URL
    let allowedHost: string | null
    if (configured) {
      try {
        allowedHost = new URL(configured).host
      } catch {
        // Misconfigured value — fall back to the request host rather than
        // rejecting every state-changing request.
        allowedHost = request.headers.get("host") ?? new URL(request.url).host
      }
    } else {
      // Prefer the Host header; fall back to the request URL host for
      // manually-constructed requests (e.g. tests) where no Host is set.
      allowedHost = request.headers.get("host") ?? new URL(request.url).host
    }

    return !!allowedHost && originUrl.host === allowedHost
  } catch {
    return false
  }
}


/**
 * Validates that a string doesn't contain path traversal patterns
 */
export function isPathTraversalSafe(input: string): boolean {
  if (!input || typeof input !== "string") {
    return false
  }

  // Check for path traversal patterns
  const dangerousPatterns = [
    /\.\./, // Parent directory
    /\.\.\//, // Parent directory with slash
    /\.\.\\/, // Parent directory with backslash (Windows)
    /\/\.\./, // Leading parent directory
    /\\\.\./, // Leading parent directory (Windows)
    /\.\.%2F/i, // URL encoded
    /\.\.%5C/i, // URL encoded backslash
    /%2E%2E%2F/i, // Double URL encoded
    /%2E%2E%5C/i, // Double URL encoded backslash
    /\.\.%252F/i, // Triple URL encoded
    /\.\.%255C/i, // Triple URL encoded backslash
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      return false
    }
  }

  // Check for absolute paths (Unix and Windows)
  if (/^\/|^[A-Za-z]:\\/.test(input)) {
    return false
  }

  // Check for file:// protocol
  if (/^file:\/\//i.test(input)) {
    return false
  }

  return true
}

/**
 * Validates a CUID (Collision-resistant Unique Identifier)
 * CUIDs are typically 25 characters long and start with 'c'
 */
export function isValidCUID(id: string): boolean {
  if (!id || typeof id !== "string") {
    return false
  }

  // CUID format: starts with 'c' followed by timestamp and random characters
  // Length is typically 25 characters
  // Pattern: c + 8 chars timestamp + 12 chars random
  const cuidPattern = /^c[a-z0-9]{24}$/i

  // Also check for standard UUID format (if used)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  return cuidPattern.test(id) || uuidPattern.test(id)
}

/**
 * Sanitizes a string to prevent path traversal
 */
export function sanitizePath(input: string): string {
  if (!input || typeof input !== "string") {
    return ""
  }

  // Remove path traversal patterns
  let sanitized = input
    .replace(/\.\./g, "")
    .replace(/\.\.\//g, "")
    .replace(/\.\.\\/g, "")
    .replace(/\/\.\./g, "")
    .replace(/\\\.\./g, "")

  // Remove absolute path indicators (all leading slashes, not just the first)
  sanitized = sanitized.replace(/^\/+/, "").replace(/^[A-Za-z]:\\/, "")

  // Remove file:// protocol
  sanitized = sanitized.replace(/^file:\/\//i, "")

  return sanitized.trim()
}

/**
 * Validates and sanitizes a URL to prevent path traversal
 */
export function validateUrl(url: string): { valid: boolean; sanitized?: string; error?: string } {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "URL is required" }
  }

  // Check length
  if (url.length > 5000) {
    return { valid: false, error: "URL too long" }
  }

  // Check for path traversal in URL
  if (!isPathTraversalSafe(url)) {
    return { valid: false, error: "URL contains invalid characters" }
  }

  // Only HTTP/HTTPS URLs are accepted — data URLs (base64 images) are not.
  try {
    const urlObj = new URL(url)
    // Only allow http, https protocols
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return { valid: false, error: "Only HTTP and HTTPS URLs are allowed" }
    }
    // Check hostname is not localhost or private IP (unless in development)
    if (process.env.NODE_ENV === "production") {
      const hostname = urlObj.hostname
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        hostname.startsWith("172.16.") ||
        hostname.startsWith("172.17.") ||
        hostname.startsWith("172.18.") ||
        hostname.startsWith("172.19.") ||
        hostname.startsWith("172.20.") ||
        hostname.startsWith("172.21.") ||
        hostname.startsWith("172.22.") ||
        hostname.startsWith("172.23.") ||
        hostname.startsWith("172.24.") ||
        hostname.startsWith("172.25.") ||
        hostname.startsWith("172.26.") ||
        hostname.startsWith("172.27.") ||
        hostname.startsWith("172.28.") ||
        hostname.startsWith("172.29.") ||
        hostname.startsWith("172.30.") ||
        hostname.startsWith("172.31.")
      ) {
        return { valid: false, error: "Private IP addresses not allowed in production" }
      }
    }
    return { valid: true, sanitized: url }
  } catch {
    return { valid: false, error: "Invalid URL format" }
  }
}

/**
 * Validates search query parameters to prevent injection
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== "string") {
    return ""
  }

  // Remove potentially dangerous characters but keep alphanumeric, spaces, and common punctuation
  let sanitized = query
    .replace(/[<>'"\\]/g, "") // Remove HTML/script injection characters
    .replace(/[;{}]/g, "") // Remove SQL/NoSQL injection characters
    .trim()

  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200)
  }

  return sanitized
}

/**
 * Parses page/limit query parameters safely.
 *
 * Reviewing every list endpoint showed the same bug: `parseInt` + `Math.min`
 * accepted `?limit=abc`, `?limit=-1`, and `?page=0`, which produced NaN or
 * negative values in Prisma's `take`/`skip` and returned a 500. Malformed
 * values now fall back to the defaults; valid values are clamped to the cap.
 */
export function parsePagination(
  searchParams: { get(name: string): string | null },
  options: { defaultLimit?: number; maxLimit?: number } = {}
): { page: number; limit: number; skip: number } {
  const defaultLimit = options.defaultLimit ?? 20
  const maxLimit = options.maxLimit ?? 100

  const toPositiveInt = (raw: string | null, fallback: number, max?: number): number => {
    if (raw === null) return fallback
    const trimmed = raw.trim()
    if (!/^\d+$/.test(trimmed)) return fallback
    const value = Number(trimmed)
    if (!Number.isSafeInteger(value) || value < 1) return fallback
    return max === undefined ? value : Math.min(value, max)
  }

  const page = toPositiveInt(searchParams.get("page"), 1, 1_000_000)
  const limit = toPositiveInt(searchParams.get("limit"), defaultLimit, maxLimit)
  return { page, limit, skip: (page - 1) * limit }
}

/**
 * Reads a JSON request body without throwing, so malformed JSON is answered
 * with 400 instead of bubbling up as an unhandled 500.
 */
export async function readJsonBody(
  request: Request
): Promise<{ ok: true; data: unknown } | { ok: false }> {
  try {
    return { ok: true, data: await request.json() }
  } catch {
    return { ok: false }
  }
}

/**
 * Validates ID parameter from route
 */
export function validateRouteId(id: string): { valid: boolean; error?: string } {
  if (!id || typeof id !== "string") {
    return { valid: false, error: "ID is required" }
  }

  // Check for path traversal
  if (!isPathTraversalSafe(id)) {
    return { valid: false, error: "Invalid ID format" }
  }

  // Validate CUID format
  if (!isValidCUID(id)) {
    return { valid: false, error: "Invalid ID format" }
  }

  return { valid: true }
}
