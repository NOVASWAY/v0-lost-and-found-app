import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"

// prisma is mocked to null so rateLimit exercises the in-memory path (no DB).
vi.mock("../../lib/db", () => ({
  prisma: null,
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}))

import { rateLimit, getClientIdentifier } from "../../lib/rate-limit"
import { signAccessToken } from "../../lib/jwt"

const GOOD_SECRET = "unit-test-secret-4f6a91d2c3e5b7a8d0f1e2b3c4d5e6f7"
const ORIGINAL_SECRET = process.env.JWT_SECRET

beforeEach(() => {
  process.env.JWT_SECRET = GOOD_SECRET
})
afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.JWT_SECRET
  else process.env.JWT_SECRET = ORIGINAL_SECRET
  vi.useRealTimers()
})

describe("rateLimit (in-memory path)", () => {
  it("allows the first request with max-1 remaining", async () => {
    const r = await rateLimit("test-user-1", { windowMs: 60000, maxRequests: 5 })
    expect(r.allowed).toBe(true)
    expect(r.remaining).toBe(4)
  })

  it("blocks once the limit is exceeded within the window", async () => {
    const id = "test-user-2"
    for (let i = 0; i < 3; i++) {
      const r = await rateLimit(id, { windowMs: 60000, maxRequests: 3 })
      expect(r.allowed).toBe(true)
    }
    const blocked = await rateLimit(id, { windowMs: 60000, maxRequests: 3 })
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it("resets the counter after the window elapses", async () => {
    vi.useFakeTimers()
    const id = "test-user-3"
    for (let i = 0; i < 3; i++) {
      await rateLimit(id, { windowMs: 60000, maxRequests: 3 })
    }
    expect((await rateLimit(id, { windowMs: 60000, maxRequests: 3 })).allowed).toBe(false)

    vi.advanceTimersByTime(60001)
    const fresh = await rateLimit(id, { windowMs: 60000, maxRequests: 3 })
    expect(fresh.allowed).toBe(true)
    expect(fresh.remaining).toBe(2)
  })

  it("treats distinct identifiers independently", async () => {
    await rateLimit("test-user-a", { windowMs: 60000, maxRequests: 1 })
    expect((await rateLimit("test-user-b", { windowMs: 60000, maxRequests: 1 })).allowed).toBe(true)
  })
})

describe("getClientIdentifier", () => {
  function makeRequest(headers: Record<string, string>, cookies?: Record<string, string>): NextRequest {
    return {
      headers: new Headers(headers),
      cookies: {
        get: (name: string) => (cookies && cookies[name] !== undefined ? { value: cookies[name] } : undefined),
      },
    } as unknown as NextRequest
  }

  it("keys on the user id from a valid session cookie", () => {
    const token = signAccessToken({ sub: "c123456789012345678901234", role: "user", username: "u", name: "U", tokenVersion: 0 })
    const id = getClientIdentifier(makeRequest({}, { auth_token: token }))
    expect(id).toBe("user:c123456789012345678901234")
  })

  it("ignores an invalid session cookie and falls back to IP", () => {
    const id = getClientIdentifier(makeRequest({ "x-forwarded-for": "203.0.113.9" }, { auth_token: "garbage" }))
    expect(id).toBe("ip:203.0.113.9")
  })

  it("keys on x-forwarded-for IP when no session is present", () => {
    const id = getClientIdentifier(makeRequest({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }))
    expect(id).toBe("ip:203.0.113.9")
  })

  it("falls back to x-real-ip", () => {
    const id = getClientIdentifier(makeRequest({ "x-real-ip": "203.0.113.10" }))
    expect(id).toBe("ip:203.0.113.10")
  })

  it("falls back to unknown when no IP headers exist", () => {
    const id = getClientIdentifier(makeRequest({}))
    expect(id).toBe("ip:unknown")
  })
})
