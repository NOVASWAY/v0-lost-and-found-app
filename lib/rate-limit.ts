import type { NextRequest } from "next/server"
import { prisma } from "./db"
import { verifyAccessToken } from "./jwt"

// Simple in-memory rate limiter
// For production, use Redis or a dedicated rate limiting service

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  }
}, 60000) // Clean up every minute

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60000, maxRequests: 100 }
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // Prefer shared limiter via DB when available.
  // If the DB isn't available (mock mode / local dev), fall back to in-memory.
  if (!prisma) {
    return Promise.resolve(rateLimitInMemory(identifier, options))
  }

  // A DB hiccup must not turn every request into a 500. Fall back to the
  // per-instance limiter, which is weaker but still throttles the caller.
  return rateLimitShared(identifier, options).catch(() => rateLimitInMemory(identifier, options))
}

function rateLimitInMemory(
  identifier: string,
  options: RateLimitOptions,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier

  if (!store[key] || store[key].resetTime < now) {
    // Create new window
    store[key] = {
      count: 1,
      resetTime: now + options.windowMs,
    }
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime: store[key].resetTime,
    }
  }

  // Increment count
  store[key].count++

  if (store[key].count > options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: store[key].resetTime,
    }
  }

  return {
    allowed: true,
    remaining: options.maxRequests - store[key].count,
    resetTime: store[key].resetTime,
  }
}

async function rateLimitShared(
  identifier: string,
  options: RateLimitOptions,
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // The table is created by migrations (see the RateLimitCounter model), so no
  // runtime DDL is needed and the app role can stay DML-only.
  const now = Date.now()
  const resetTime = now + options.windowMs

  // Read current counter
  const row = (await prisma.$queryRaw<
    Array<{ count: number; resetTime: number }>
  >`
    SELECT count, reset_time as "resetTime"
    FROM rate_limit_counters
    WHERE rate_key = ${identifier}
    LIMIT 1
  `) as Array<{ count: number; resetTime: number }>

  if (!row || row.length === 0 || row[0].resetTime < now) {
    // New window
    const newResetTime = now + options.windowMs
    await prisma.$executeRaw`
      INSERT INTO rate_limit_counters (rate_key, count, reset_time)
      VALUES (${identifier}, 1, ${newResetTime})
      ON CONFLICT(rate_key) DO UPDATE SET
        count = 1,
        reset_time = ${newResetTime}
    `
    return { allowed: true, remaining: options.maxRequests - 1, resetTime: newResetTime }
  }

  // Existing window: increment
  await prisma.$executeRaw`
    UPDATE rate_limit_counters
    SET count = count + 1
    WHERE rate_key = ${identifier}
  `

  const updated = (await prisma.$queryRaw<
    Array<{ count: number; resetTime: number }>
  >`
    SELECT count, reset_time as "resetTime"
    FROM rate_limit_counters
    WHERE rate_key = ${identifier}
    LIMIT 1
  `) as Array<{ count: number; resetTime: number }>

  const count = Number(updated?.[0]?.count ?? 1)
  // reset_time is stored as BIGINT and may come back as a BigInt value;
  // normalize to a plain number so callers can use it in `new Date(...)`.
  const sharedResetTime = Number(updated?.[0]?.resetTime ?? resetTime)

  const allowed = count <= options.maxRequests
  return {
    allowed,
    remaining: Math.max(options.maxRequests - count, 0),
    resetTime: sharedResetTime,
  }
}

// Clear the counter for an identifier (e.g. reset failed-login attempts after a
// successful login). Best-effort: failures are swallowed so a stale counter can
// never break the happy path.
export async function resetRateLimit(identifier: string): Promise<void> {
  if (!prisma) {
    delete store[identifier]
    return
  }
  try {
    await prisma.$executeRaw`
      DELETE FROM rate_limit_counters
      WHERE rate_key = ${identifier}
    `
  } catch {
    // Ignore — the limiter is defense-in-depth, not a hard dependency.
  }
}

// Get client identifier from request.
// Keys on the session user id when a valid auth_token cookie is present so a
// shared IP (e.g. the whole church office behind NAT) isn't throttled as one
// actor; otherwise falls back to the client IP.
export function getClientIdentifier(request: NextRequest): string {
  const token = request.cookies?.get("auth_token")?.value
  if (token) {
    const payload = verifyAccessToken(token)
    if (payload?.sub) return `user:${payload.sub}`
  }

  // Fall back to IP address. Never trust the client-supplied first X-Forwarded-For
  // entry — on Vercel/proxies the real client IP is the LAST entry of the chain
  // (or x-vercel-forwarded-for / x-real-ip). Using the first entry lets an
  // attacker rotate spoofed IPs to defeat per-IP rate limits entirely.
  const realIp =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ||
    "unknown"
  return `ip:${realIp}`
}
