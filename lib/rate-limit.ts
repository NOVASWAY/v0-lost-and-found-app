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
    await prisma.$executeRaw`
      INSERT INTO rate_limit_counters (rate_key, count, reset_time)
      VALUES (${identifier}, 1, ${resetTime})
      ON CONFLICT(rate_key) DO UPDATE SET
        count = 1,
        reset_time = ${resetTime}
    `
    return { allowed: true, remaining: options.maxRequests - 1, resetTime }
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

  const count = updated?.[0]?.count ?? 1
  const sharedResetTime = updated?.[0]?.resetTime ?? resetTime

  const allowed = count <= options.maxRequests
  return {
    allowed,
    remaining: Math.max(options.maxRequests - count, 0),
    resetTime: sharedResetTime,
  }
}

// Get client identifier from request
export function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from auth header first
  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    const token = authHeader.substring(7).trim()
    const payload = verifyAccessToken(token)
    if (payload?.sub) return `user:${payload.sub}`
    return `user:${token}`
  }

  // Fall back to IP address
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"
  return `ip:${ip}`
}
