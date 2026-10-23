const FALLBACK_SITE_URL = "http://localhost:3000"

/**
 * Resolve the canonical site URL.
 *
 * A malformed or placeholder NEXT_PUBLIC_SITE_URL must not break the build —
 * `new URL()` on it throws while Next.js collects page data. Unset or invalid
 * values fall back to the local development origin.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!configured) {
    return FALLBACK_SITE_URL
  }

  try {
    const parsed = new URL(configured)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return FALLBACK_SITE_URL
    }
    return parsed.toString().replace(/\/$/, "")
  } catch {
    return FALLBACK_SITE_URL
  }
}
