/**
 * Server-only secret comparison.
 *
 * Kept out of lib/security.ts because that module is imported by client code
 * (lib/auth-context.tsx), and the node:crypto import cannot be bundled for the
 * browser.
 */
import { timingSafeEqual } from "node:crypto"

/**
 * Constant-time string comparison for secrets. A plain `!` comparison leaks
 * how many leading characters matched, which lets an attacker recover a secret
 * byte by byte. Used for the cron bearer token.
 */
export function safeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false
  }

  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) {
    // Length is not secret for a fixed-length header, and timingSafeEqual
    // requires equal lengths — compare against itself to keep the cost flat.
    timingSafeEqual(aBuf, aBuf)
    return false
  }

  return timingSafeEqual(aBuf, bBuf)
}
