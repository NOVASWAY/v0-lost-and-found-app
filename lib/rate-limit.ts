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
    // Single shared table used only for rate limiting counters.
    // Works on both Postgres and SQLite (epoch ms stored as BIGINT/INTEGER affinity).
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS rate_limit_counters (
        rate_key TEXT PRIMARY KEY,
        count INTEGER NOT NULL,
        reset_time BIGINT NOT NULL
      );
    `
    ensuredTable = true
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

  // Fall back to IP address
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"
  return `ip:${ip}`
}
