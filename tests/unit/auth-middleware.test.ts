import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { NextRequest } from "next/server"

vi.mock("../../lib/db", () => ({
  prisma: { user: { findUnique: vi.fn() } },
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}))

import { prisma } from "../../lib/db"
import { requireAuth, requireAdmin, requireAdminOrVolunteer, getAuthenticatedUser } from "../../lib/auth-middleware"
import { signAccessToken } from "../../lib/jwt"

const GOOD_SECRET = "unit-test-secret-4f6a91d2c3e5b7a8d0f1e2b3c4d5e6f7"
const ORIGINAL_SECRET = process.env.JWT_SECRET

const findUnique = prisma.user.findUnique as ReturnType<typeof vi.fn>

type UserRecord = {
  id: string
  username: string
  name: string
  role: string
  tokenVersion: number
}

function makeRequest(opts: { token?: string; origin?: string; host?: string }): NextRequest {
  const headers = new Headers()
  if (opts.origin) headers.set("origin", opts.origin)
  if (opts.host) headers.set("host", opts.host)
  return {
    headers,
    cookies: {
      get: (name: string) => {
        if (name === "auth_token" && opts.token) return { value: opts.token }
        return undefined
      },
    },
  } as unknown as NextRequest
}

function tokenFor(user: UserRecord) {
  return signAccessToken({
    sub: user.id,
    role: user.role,
    username: user.username,
    name: user.name,
    tokenVersion: user.tokenVersion,
  })
}

const admin: UserRecord = { id: "c0000000000000000000000001", username: "boss", name: "Boss", role: "admin", tokenVersion: 1 }
const volunteer: UserRecord = { id: "c0000000000000000000000002", username: "vol", name: "Vol", role: "volunteer", tokenVersion: 1 }
const normal: UserRecord = { id: "c0000000000000000000000003", username: "usr", name: "Usr", role: "user", tokenVersion: 1 }

beforeEach(() => {
  process.env.JWT_SECRET = GOOD_SECRET
  findUnique.mockReset()
})
afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.JWT_SECRET
  else process.env.JWT_SECRET = ORIGINAL_SECRET
})

describe("getAuthenticatedUser", () => {
  it("returns null without a token", async () => {
    expect(await getAuthenticatedUser(makeRequest({}))).toBeNull()
  })

  it("returns null for a user that no longer exists", async () => {
    findUnique.mockResolvedValue(null)
    expect(await getAuthenticatedUser(makeRequest({ token: tokenFor(normal) }))).toBeNull()
  })

  it("returns null when the tokenVersion is stale (revoked session)", async () => {
    findUnique.mockResolvedValue({ ...normal, tokenVersion: 2 })
    expect(await getAuthenticatedUser(makeRequest({ token: tokenFor(normal) }))).toBeNull()
  })

  it("returns the server-side user on success", async () => {
    findUnique.mockResolvedValue(normal)
    const user = await getAuthenticatedUser(makeRequest({ token: tokenFor(normal) }))
    expect(user?.id).toBe(normal.id)
    expect(user?.role).toBe("user")
  })
})

describe("requireAuth", () => {
  it("returns 401 with no token", async () => {
    const res = (await requireAuth(makeRequest({}))) as Response
    expect(res.status).toBe(401)
  })

  it("returns 401 with an invalid token", async () => {
    const res = (await requireAuth(makeRequest({ token: "not.a.jwt" }))) as Response
    expect(res.status).toBe(401)
  })

  it("returns 403 for a cross-site origin even with a valid token", async () => {
    findUnique.mockResolvedValue(normal)
    const res = (await requireAuth(
      makeRequest({ token: tokenFor(normal), origin: "https://evil.example.com", host: "vault.example.com" })
    )) as Response
    expect(res.status).toBe(403)
  })

  it("returns the user on success", async () => {
    findUnique.mockResolvedValue(normal)
    const result = await requireAuth(makeRequest({ token: tokenFor(normal) }))
    expect("user" in result).toBe(true)
    if ("user" in result) expect(result.user.role).toBe("user")
  })
})

describe("role authorization matrix", () => {
  it("requireAdmin: admin allowed, volunteer and user rejected (403)", async () => {
    findUnique.mockResolvedValue(admin)
    expect(await requireAdmin(makeRequest({ token: tokenFor(admin) }))).toMatchObject({ user: { role: "admin" } })

    findUnique.mockResolvedValue(volunteer)
    expect(((await requireAdmin(makeRequest({ token: tokenFor(volunteer) }))) as Response).status).toBe(403)

    findUnique.mockResolvedValue(normal)
    expect(((await requireAdmin(makeRequest({ token: tokenFor(normal) }))) as Response).status).toBe(403)
  })

  it("requireAdminOrVolunteer: admin and volunteer allowed, user rejected (403)", async () => {
    findUnique.mockResolvedValue(admin)
    expect(await requireAdminOrVolunteer(makeRequest({ token: tokenFor(admin) }))).toMatchObject({ user: { role: "admin" } })

    findUnique.mockResolvedValue(volunteer)
    expect(await requireAdminOrVolunteer(makeRequest({ token: tokenFor(volunteer) }))).toMatchObject({ user: { role: "volunteer" } })

    findUnique.mockResolvedValue(normal)
    expect(((await requireAdminOrVolunteer(makeRequest({ token: tokenFor(normal) }))) as Response).status).toBe(403)
  })

  it("requireAuth with a revoked (tokenVersion mismatch) session returns 401", async () => {
    findUnique.mockResolvedValue({ ...normal, tokenVersion: 5 })
    expect(((await requireAuth(makeRequest({ token: tokenFor(normal) }))) as Response).status).toBe(401)
  })
})
