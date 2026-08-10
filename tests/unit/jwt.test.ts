import crypto from "node:crypto"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { signAccessToken, verifyAccessToken } from "../../lib/jwt"

const GOOD_SECRET = "unit-test-secret-4f6a91d2c3e5b7a8d0f1e2b3c4d5e6f7"
const ORIGINAL_SECRET = process.env.JWT_SECRET

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

// Forge a token with arbitrary payload signed with a known secret. Used to test
// structural checks (missing tokenVersion) that valid tokens would always pass.
function forgeToken(payload: Record<string, unknown>, secret: string): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = base64UrlEncode(JSON.stringify(payload))
  const data = `${header}.${body}`
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
  return `${data}.${sig}`
}

const now = Math.floor(Date.now() / 1000)
const payload = {
  sub: "c123456789012345678901234",
  role: "admin",
  username: "tester",
  name: "Test User",
  tokenVersion: 3,
}

describe("jwt", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = GOOD_SECRET
  })
  afterAll(() => {
    if (ORIGINAL_SECRET === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = ORIGINAL_SECRET
  })

  it("signs and verifies a token, returning all claims", () => {
    const token = signAccessToken(payload)
    const verified = verifyAccessToken(token)
    expect(verified).not.toBeNull()
    expect(verified!.sub).toBe(payload.sub)
    expect(verified!.role).toBe(payload.role)
    expect(verified!.username).toBe(payload.username)
    expect(verified!.tokenVersion).toBe(3)
    expect(verified!.iat).toBeGreaterThan(0)
    expect(verified!.exp - verified!.iat).toBe(8 * 60 * 60)
  })

  it("default TTL is 8 hours and matches opts when provided", () => {
    const token = signAccessToken(payload, { ttlSeconds: 60 })
    const verified = verifyAccessToken(token)!
    expect(verified.exp - verified.iat).toBe(60)
  })

  it("rejects a token with a tampered payload", () => {
    const token = signAccessToken(payload)
    const [h, p, s] = token.split(".")
    const tamperedBody = Buffer.from(p, "base64url").toString("utf8").replace('"admin"', '"user"')
    const forged = `${h}.${base64UrlEncode(tamperedBody)}.${s}`
    expect(verifyAccessToken(forged)).toBeNull()
  })

  it("rejects a token signed with a different secret", () => {
    const token = signAccessToken(payload)
    process.env.JWT_SECRET = "another-strong-secret-0f8e7d6c5b4a"
    expect(verifyAccessToken(token)).toBeNull()
  })

  it("rejects an expired token", () => {
    const token = signAccessToken(payload, { ttlSeconds: -60 })
    expect(verifyAccessToken(token)).toBeNull()
  })

  it("rejects malformed tokens", () => {
    expect(verifyAccessToken("garbage")).toBeNull()
    expect(verifyAccessToken("a.b")).toBeNull()
    expect(verifyAccessToken("a.b.c.d")).toBeNull()
  })

  it("rejects a structurally valid token missing tokenVersion", () => {
    const missingTokenVersion = forgeToken(
      { ...payload, exp: now + 3600, iat: now } as Record<string, unknown>,
      GOOD_SECRET
    )
    expect(verifyAccessToken(missingTokenVersion)).toBeNull()
  })

  it("rejects a validly signed token with a non-numeric exp", () => {
    const bad = forgeToken({ ...payload, exp: "soon", iat: now, tokenVersion: 3 }, GOOD_SECRET)
    expect(verifyAccessToken(bad)).toBeNull()
  })

  it("throws when JWT_SECRET is missing", () => {
    delete process.env.JWT_SECRET
    expect(() => signAccessToken(payload)).toThrow(/JWT_SECRET/)
  })

  it("throws when JWT_SECRET is a known placeholder", () => {
    process.env.JWT_SECRET = "dev-jwt-secret-12345678"
    expect(() => signAccessToken(payload)).toThrow(/placeholder/)
    process.env.JWT_SECRET = "change-in-production-1234"
    expect(() => signAccessToken(payload)).toThrow(/placeholder/)
  })
})
