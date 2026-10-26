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
let ensuredTable = false
let ensurePromise: Promise<void> | null = null

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

  return rateLimitShared(identifier, options)
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

async function ensureRateLimitTable() {
  if (ensuredTable) return
  if (ensurePromise) return ensurePromise

  ensurePromise = (async () => {
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS rate_limit_counters (
          rate_key TEXT PRIMARY KEY,
          count INTEGER NOT NULL,
          reset_time BIGINT NOT NULL
        );
      `
      ensuredTable = true
    } catch (error) {
      ensurePromise = null
      throw error
    }
  })()

  return ensurePromise
}

async function rateLimitShared(
  identifier: string,
  options: RateLimitOptions,
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  await ensureRateLimitTable()

  const now = Date.now()
  const resetTime = now + options.windowMs
  const rows = await prisma.$queryRaw<Array<{ count: number | bigint; resetTime: number | bigint }>>`
    INSERT INTO rate_limit_counters (rate_key, count, reset_time)
    VALUES (${identifier}, 1, ${resetTime})
    ON CONFLICT (rate_key) DO UPDATE SET
      count = CASE
        WHEN rate_limit_counters.reset_time <= ${now} THEN 1
        ELSE rate_limit_counters.count + 1
      END,
      reset_time = CASE
        WHEN rate_limit_counters.reset_time <= ${now} THEN ${resetTime}
        ELSE rate_limit_counters.reset_time
      END
    RETURNING count, reset_time AS "resetTime"
  `

  const count = Number(rows[0]?.count ?? 0)
  const sharedResetTime = Number(rows[0]?.resetTime ?? resetTime)

  return {
    allowed: count <= options.maxRequests,
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
    await ensureRateLimitTable()
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
