import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { NextRequest, NextResponse } from "next/server"

import { prisma, hashPassword } from "../lib/db"
import { signAccessToken } from "../lib/jwt"
import * as claimsRoute from "../app/api/claims/route"
import * as claimByIdRoute from "../app/api/claims/[id]/route"
import * as usersByIdRoute from "../app/api/users/[id]/route"
import * as itemsRoute from "../app/api/items/route"

// Integration tests for race-condition fixes and user deletion safety.
// Uses real DB; users/items/claims are created and cleaned up per test.

const GOOD_SECRET = "claims-test-secret-9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d"
const SUFFIX = Date.now().toString(36)

const names = {
  admin: `rc_admin_${SUFFIX}`,
  user1: `rc_user1_${SUFFIX}`,
  user2: `rc_user2_${SUFFIX}`,
}

interface TestUser {
  id: string
  username: string
  name: string
  role: string
  tokenVersion: number
}

const users: Record<string, TestUser> = {}
let testItemId: string

async function createUser(username: string, role: string): Promise<TestUser> {
  const password = await hashPassword("Str0ng!Passw0rd")
  const row = await prisma.user.upsert({
    where: { username },
    update: { role },
    create: { name: username, username, password, role },
  })
  return { id: row.id, username: row.username, name: row.name, role: row.role, tokenVersion: row.tokenVersion }
}

function cookieRequest(url: string, opts: { token?: string; origin?: string; method?: string; body?: unknown }) {
  const headers = new Headers()
  if (opts.token) headers.set("cookie", `auth_token=${opts.token}`)
  if (opts.origin) headers.set("origin", opts.origin)
  if (opts.body !== undefined) headers.set("content-type", "application/json")
  return new NextRequest(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
}

function tokenFor(user: TestUser) {
  return signAccessToken({
    sub: user.id,
    role: user.role,
    username: user.username,
    name: user.name,
    tokenVersion: user.tokenVersion,
  })
}

beforeAll(async () => {
  process.env.JWT_SECRET = GOOD_SECRET
  users.admin = await createUser(names.admin, "admin")
  users.user1 = await createUser(names.user1, "user")
  users.user2 = await createUser(names.user2, "user")

  // Create a test item for claim tests
  const item = await prisma.item.create({
    data: {
      category: "Test Wallet",
      color: "brown",
      description: "A test wallet for race condition tests",
      location: "Main Sanctuary",
      imageUrl: "https://example.com/wallet.jpg",
      dateFounded: new Date(),
      status: "available",
      uploadedById: users.admin.id,
    },
  })
  testItemId = item.id
})

afterAll(async () => {
  // Clean up test data (order matters for FK constraints)
  await prisma.auditLog.deleteMany({ where: { userId: { in: Object.values(users).map((u) => u.id) } } })
  await prisma.claim.deleteMany({ where: { claimantId: { in: [users.user1.id, users.user2.id] } } })
  await prisma.item.deleteMany({ where: { id: testItemId } })
  await prisma.user.deleteMany({ where: { username: { in: Object.values(names) } } })
  await prisma.$disconnect()
})

describe("claim creation race condition fixes", () => {
  it("rejects duplicate claim from same user on same item (409)", async () => {
    const req1 = cookieRequest("http://localhost/api/claims", {
      token: tokenFor(users.user1),
      origin: "http://localhost",
      method: "POST",
      body: { itemId: testItemId, proofImage: "https://example.com/proof1.jpg", claimantId: users.user1.id },
    })
    const res1 = await claimsRoute.POST(req1)
    expect(res1.status).toBe(200)

    // Second claim on same item by same user should fail
    const req2 = cookieRequest("http://localhost/api/claims", {
      token: tokenFor(users.user1),
      origin: "http://localhost",
      method: "POST",
      body: { itemId: testItemId, proofImage: "https://example.com/proof2.jpg", claimantId: users.user1.id },
    })
    const res2 = await claimsRoute.POST(req2)
    expect(res2.status).toBe(409)
    const body2 = await res2.json()
    expect(body2.error).toMatch(/already submitted a claim/i)
  })

  it("allows different users to claim the same item", async () => {
    const req = cookieRequest("http://localhost/api/claims", {
      token: tokenFor(users.user2),
      origin: "http://localhost",
      method: "POST",
      body: { itemId: testItemId, proofImage: "https://example.com/proof3.jpg", claimantId: users.user2.id },
    })
    const res = await claimsRoute.POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.claim.itemId).toBe(testItemId)
    expect(body.claim.claimantId).toBe(users.user2.id)
  })

  it("rejects claim on unavailable item", async () => {
    // Mark item as claimed
    await prisma.item.update({ where: { id: testItemId }, data: { status: "claimed" } })

    // Create a third user to attempt a claim
    const user3 = await createUser(`rc_user3_${SUFFIX}`, "user")
    try {
      const req = cookieRequest("http://localhost/api/claims", {
        token: tokenFor(user3),
        origin: "http://localhost",
        method: "POST",
        body: { itemId: testItemId, proofImage: "https://example.com/proof4.jpg", claimantId: user3.id },
      })
      const res = await claimsRoute.POST(req)
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toMatch(/not available/i)
    } finally {
      // Restore item for other tests
      await prisma.item.update({ where: { id: testItemId }, data: { status: "available" } })
      await prisma.user.delete({ where: { id: user3.id } })
    }
  })
})

describe("claim status transition validation", () => {
  let claimId: string

  it("creates a claim for transition tests", async () => {
    // First clean any existing claims on the test item
    await prisma.claim.deleteMany({ where: { itemId: testItemId } })

    const req = cookieRequest("http://localhost/api/claims", {
      token: tokenFor(users.user1),
      origin: "http://localhost",
      method: "POST",
      body: { itemId: testItemId, proofImage: "https://example.com/proof5.jpg", claimantId: users.user1.id },
    })
    const res = await claimsRoute.POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    claimId = body.claim.id
  })

  it("approves a pending claim", async () => {
    const req = cookieRequest(`http://localhost/api/claims/${claimId}`, {
      token: tokenFor(users.admin),
      method: "PATCH",
      body: { status: "approved" },
    })
    const res = await claimByIdRoute.PATCH(req, { params: Promise.resolve({ id: claimId }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.claim.status).toBe("approved")
  })

  it("rejects transitioning from approved to pending", async () => {
    const req = cookieRequest(`http://localhost/api/claims/${claimId}`, {
      token: tokenFor(users.admin),
      method: "PATCH",
      body: { status: "pending" },
    })
    const res = await claimByIdRoute.PATCH(req, { params: Promise.resolve({ id: claimId }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/cannot transition/i)
  })

  it("allows rejecting a previously approved claim", async () => {
    const req = cookieRequest(`http://localhost/api/claims/${claimId}`, {
      token: tokenFor(users.admin),
      method: "PATCH",
      body: { status: "rejected" },
    })
    const res = await claimByIdRoute.PATCH(req, { params: Promise.resolve({ id: claimId }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.claim.status).toBe("rejected")
  })

  it("rejects transitioning from rejected to released", async () => {
    const req = cookieRequest(`http://localhost/api/claims/${claimId}`, {
      token: tokenFor(users.admin),
      method: "PATCH",
      body: { status: "released" },
    })
    const res = await claimByIdRoute.PATCH(req, { params: Promise.resolve({ id: claimId }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/cannot transition/i)
  })
})

describe("user deletion with dependency check", () => {
  it("blocks deletion when user has uploaded items", async () => {
    // user1 has no items uploaded (admin uploaded the test item), so this should work
    // Create a throwaway user with an item
    const throwaway = await createUser(`rc_throwaway_${SUFFIX}`, "user")
    const item = await prisma.item.create({
      data: {
        category: "Throwaway Item",
        color: "black",
        description: "test",
        location: "Main Sanctuary",
        imageUrl: "https://example.com/test.jpg",
        dateFounded: new Date(),
        status: "available",
        uploadedById: throwaway.id,
      },
    })

    try {
      const req = cookieRequest(`http://localhost/api/users/${throwaway.id}`, {
        token: tokenFor(users.admin),
        method: "DELETE",
      })
      const res = await usersByIdRoute.DELETE(req, { params: Promise.resolve({ id: throwaway.id }) })
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.error).toMatch(/cannot delete user/i)
      expect(body.error).toMatch(/uploaded item/i)
    } finally {
      await prisma.item.delete({ where: { id: item.id } })
      await prisma.user.delete({ where: { id: throwaway.id } })
    }
  })

  it("blocks admin from deleting themselves", async () => {
    const req = cookieRequest(`http://localhost/api/users/${users.admin.id}`, {
      token: tokenFor(users.admin),
      method: "DELETE",
    })
    const res = await usersByIdRoute.DELETE(req, { params: Promise.resolve({ id: users.admin.id }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/cannot delete your own account/i)
  })

  it("succeeds when user has no dependencies", async () => {
    const clean = await createUser(`rc_clean_${SUFFIX}`, "user")
    const req = cookieRequest(`http://localhost/api/users/${clean.id}`, {
      token: tokenFor(users.admin),
      method: "DELETE",
    })
    const res = await usersByIdRoute.DELETE(req, { params: Promise.resolve({ id: clean.id }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toMatch(/deleted successfully/i)

    // Verify user is gone
    const gone = await prisma.user.findUnique({ where: { id: clean.id } })
    expect(gone).toBeNull()
  })
})
