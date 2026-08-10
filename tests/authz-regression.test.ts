import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { NextRequest, NextResponse } from "next/server"

import { prisma, hashPassword } from "../lib/db"
import { signAccessToken } from "../lib/jwt"
import * as usersRoute from "../app/api/users/route"
import * as itemsRoute from "../app/api/items/route"
import * as ordersRoute from "../app/api/orders/route"
import * as orderByIdRoute from "../app/api/orders/[id]/route"
import * as missionsRoute from "../app/api/missions/route"
import * as missionByIdRoute from "../app/api/missions/[id]/route"
import * as meetingMinutesRoute from "../app/api/meeting-minutes/route"
import * as meetingMinuteByIdRoute from "../app/api/meeting-minutes/[id]/route"

// Endpoint-level role authorization tests against the real dev database. Users
// are created for the test and removed afterwards, so the suite is self-contained.

const GOOD_SECRET = "authz-test-secret-4f6a91d2c3e5b7a8d0f1e2b3c4d5e6f7"
const ORIGINAL_SECRET = process.env.JWT_SECRET
const SUFFIX = Date.now().toString(36)

const names = {
  admin: `authz_admin_${SUFFIX}`,
  volunteer: `authz_volunteer_${SUFFIX}`,
  user: `authz_user_${SUFFIX}`,
  apiCreated: `authz_api_${SUFFIX}`,
}

interface TestUser {
  id: string
  username: string
  name: string
  role: string
  tokenVersion: number
}

const users: Record<string, TestUser> = {}
let createdByApi: TestUser | null = null

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

function tokenFor(user: TestUser, tokenVersionOverride?: number) {
  return signAccessToken({
    sub: user.id,
    role: user.role,
    username: user.username,
    name: user.name,
    tokenVersion: tokenVersionOverride ?? user.tokenVersion,
  })
}

describe("endpoint role authorization (real DB)", () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = GOOD_SECRET
    users.admin = await createUser(names.admin, "admin")
    users.volunteer = await createUser(names.volunteer, "volunteer")
    users.user = await createUser(names.user, "user")
  })

  it("GET /api/items is public (no session required)", async () => {
    const res = (await itemsRoute.GET(cookieRequest("http://localhost/api/items", {}))) as NextResponse
    expect(res.status).toBe(200)
  })

  it("GET /api/users requires a session (401 without)", async () => {
    const res = (await usersRoute.GET(cookieRequest("http://localhost/api/users", {}))) as NextResponse
    expect(res.status).toBe(401)
  })

  it("GET /api/users rejects a plain user (403)", async () => {
    const res = (await usersRoute.GET(
      cookieRequest("http://localhost/api/users", { token: tokenFor(users.user) })
    )) as NextResponse
    expect(res.status).toBe(403)
  })

  it("GET /api/users rejects a volunteer (403)", async () => {
    const res = (await usersRoute.GET(
      cookieRequest("http://localhost/api/users", { token: tokenFor(users.volunteer) })
    )) as NextResponse
    expect(res.status).toBe(403)
  })

  it("GET /api/users allows an admin (200)", async () => {
    const res = (await usersRoute.GET(
      cookieRequest("http://localhost/api/users", { token: tokenFor(users.admin) })
    )) as NextResponse
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.users)).toBe(true)
  })

  it("POST /api/users rejects a non-admin before touching the DB", async () => {
    const res = (await usersRoute.POST(
      cookieRequest("http://localhost/api/users", {
        token: tokenFor(users.user),
        method: "POST",
        body: { name: "X", username: "x_never_created", password: "Str0ng!Passw0rd", role: "user" },
      })
    )) as NextResponse
    expect(res.status).toBe(403)
    const created = await prisma.user.findUnique({ where: { username: "x_never_created" } })
    expect(created).toBeNull()
  })

  it("POST /api/users allows an admin to create a user", async () => {
    const res = (await usersRoute.POST(
      cookieRequest("http://localhost/api/users", {
        token: tokenFor(users.admin),
        method: "POST",
        body: { name: "Api Created", username: names.apiCreated, password: "Str0ng!Passw0rd", role: "user" },
      })
    )) as NextResponse
    expect(res.status).toBe(200)
    const body = await res.json()
    createdByApi = {
      id: body.user.id,
      username: body.user.username,
      name: body.user.name,
      role: body.user.role,
      tokenVersion: 0,
    }
  })

  it("rejects a session with a stale tokenVersion (revoked)", async () => {
    const res = (await usersRoute.GET(
      cookieRequest("http://localhost/api/users", {
        token: tokenFor(users.admin, users.admin.tokenVersion + 1),
      })
    )) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects a forged cross-site origin even for an admin", async () => {
    const res = (await usersRoute.GET(
      cookieRequest("http://localhost/api/users", {
        token: tokenFor(users.admin),
        origin: "https://evil.example.com",
      })
    )) as NextResponse
    expect(res.status).toBe(403)
  })

  it("GET /api/orders requires a session (401 without)", async () => {
    const res = (await ordersRoute.GET(cookieRequest("http://localhost/api/orders", {}))) as NextResponse
    expect(res.status).toBe(401)
  })

  it("GET /api/orders returns only the caller's orders for a regular user", async () => {
    const orderA = await prisma.order.create({ data: { title: "For user", message: "m", userId: users.user.id } })
    await prisma.order.create({ data: { title: "For admin", message: "m", userId: users.admin.id } })

    const res = (await ordersRoute.GET(
      cookieRequest("http://localhost/api/orders", { token: tokenFor(users.user) })
    )) as NextResponse
    expect(res.status).toBe(200)
    const body = await res.json()
    const titles = body.orders.map((o: { title: string }) => o.title)
    expect(titles).toContain("For user")
    expect(titles).not.toContain("For admin")

    await prisma.order.delete({ where: { id: orderA.id } })
    await prisma.order.deleteMany({ where: { title: { in: ["For admin", "For user"] } } })
  })

  it("PATCH /api/orders/:id lets the owner mark their order read", async () => {
    const order = await prisma.order.create({ data: { title: "Owned", message: "m", userId: users.user.id, status: "unread" } })

    const res = (await orderByIdRoute.PATCH(
      cookieRequest(`http://localhost/api/orders/${order.id}`, {
        token: tokenFor(users.user),
        method: "PATCH",
        body: { status: "read" },
      }),
      { params: Promise.resolve({ id: order.id }) },
    )) as NextResponse
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.order.status).toBe("read")

    await prisma.order.delete({ where: { id: order.id } })
  })

  it("PATCH /api/orders/:id rejects a non-owner regular user (403)", async () => {
    const order = await prisma.order.create({ data: { title: "Admin's", message: "m", userId: users.admin.id } })

    const res = (await orderByIdRoute.PATCH(
      cookieRequest(`http://localhost/api/orders/${order.id}`, {
        token: tokenFor(users.user),
        method: "PATCH",
        body: { status: "read" },
      }),
      { params: Promise.resolve({ id: order.id }) },
    )) as NextResponse
    expect(res.status).toBe(403)

    await prisma.order.delete({ where: { id: order.id } })
  })

  it("GET /api/missions requires a session (401 without)", async () => {
    const res = (await missionsRoute.GET(cookieRequest("http://localhost/api/missions", {}))) as NextResponse
    expect(res.status).toBe(401)
  })

  it("GET /api/missions returns only the caller's missions for a regular user", async () => {
    const mine = await prisma.mission.create({
      data: { title: "Mine", description: "", instructions: "", assignedTo: users.user.id, assignedBy: users.admin.id },
    })
    await prisma.mission.create({
      data: { title: "Not mine", description: "", instructions: "", assignedTo: users.admin.id, assignedBy: users.admin.id },
    })

    const res = (await missionsRoute.GET(
      cookieRequest("http://localhost/api/missions", { token: tokenFor(users.user) })
    )) as NextResponse
    expect(res.status).toBe(200)
    const body = await res.json()
    const titles = body.missions.map((m: { title: string }) => m.title)
    expect(titles).toContain("Mine")
    expect(titles).not.toContain("Not mine")

    await prisma.mission.deleteMany({ where: { title: { in: ["Mine", "Not mine"] } } })
  })

  it("GET /api/missions returns all missions for staff", async () => {
    const res = (await missionsRoute.GET(
      cookieRequest("http://localhost/api/missions", { token: tokenFor(users.admin) })
    )) as NextResponse
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.missions)).toBe(true)
  })

  it("POST /api/missions rejects a regular user (403)", async () => {
    const res = (await missionsRoute.POST(
      cookieRequest("http://localhost/api/missions", {
        token: tokenFor(users.user),
        method: "POST",
        body: { title: "Never created", assignedTo: users.user.id },
      })
    )) as NextResponse
    expect(res.status).toBe(403)
    const created = await prisma.mission.findFirst({ where: { title: "Never created" } })
    expect(created).toBeNull()
  })

  it("POST /api/missions allows an admin to create a mission", async () => {
    const res = (await missionsRoute.POST(
      cookieRequest("http://localhost/api/missions", {
        token: tokenFor(users.admin),
        method: "POST",
        body: { title: "Admin mission", priority: "high", status: "pending", assignedTo: users.user.id },
      })
    )) as NextResponse
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.mission.assignedTo).toBe(users.user.id)

    await prisma.mission.deleteMany({ where: { title: "Admin mission" } })
  })

  it("PATCH /api/missions/:id lets an assignee complete their mission", async () => {
    const mission = await prisma.mission.create({
      data: { title: "Complete me", assignedTo: users.user.id, assignedBy: users.admin.id, status: "in_progress" },
    })

    const res = (await missionByIdRoute.PATCH(
      cookieRequest(`http://localhost/api/missions/${mission.id}`, {
        token: tokenFor(users.user),
        method: "PATCH",
        body: { status: "completed", completionNotes: "Done" },
      }),
      { params: Promise.resolve({ id: mission.id }) },
    )) as NextResponse
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.mission.status).toBe("completed")
    expect(body.mission.completedAt).toBeTruthy()

    await prisma.mission.delete({ where: { id: mission.id } })
  })

  it("PATCH /api/missions/:id blocks an assignee from staff-only fields (403)", async () => {
    const mission = await prisma.mission.create({
      data: { title: "Locked", assignedTo: users.user.id, assignedBy: users.admin.id },
    })

    const res = (await missionByIdRoute.PATCH(
      cookieRequest(`http://localhost/api/missions/${mission.id}`, {
        token: tokenFor(users.user),
        method: "PATCH",
        body: { title: "Hijacked" },
      }),
      { params: Promise.resolve({ id: mission.id }) },
    )) as NextResponse
    expect(res.status).toBe(403)

    await prisma.mission.delete({ where: { id: mission.id } })
  })

  it("PATCH /api/missions/:id rejects a non-assignee regular user (403)", async () => {
    const mission = await prisma.mission.create({
      data: { title: "Assigned to admin", assignedTo: users.admin.id, assignedBy: users.admin.id },
    })

    const res = (await missionByIdRoute.PATCH(
      cookieRequest(`http://localhost/api/missions/${mission.id}`, {
        token: tokenFor(users.user),
        method: "PATCH",
        body: { status: "completed" },
      }),
      { params: Promise.resolve({ id: mission.id }) },
    )) as NextResponse
    expect(res.status).toBe(403)

    await prisma.mission.delete({ where: { id: mission.id } })
  })

  it("PATCH /api/missions/:id lets a volunteer reassign a mission (staff)", async () => {
    const mission = await prisma.mission.create({
      data: { title: "Reassign me", assignedTo: users.user.id, assignedBy: users.admin.id },
    })

    const res = (await missionByIdRoute.PATCH(
      cookieRequest(`http://localhost/api/missions/${mission.id}`, {
        token: tokenFor(users.volunteer),
        method: "PATCH",
        body: { assignedTo: users.admin.id, priority: "critical" },
      }),
      { params: Promise.resolve({ id: mission.id }) },
    )) as NextResponse
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.mission.assignedTo).toBe(users.admin.id)
    expect(body.mission.priority).toBe("critical")

    await prisma.mission.delete({ where: { id: mission.id } })
  })

  it("DELETE /api/missions/:id rejects a volunteer (403)", async () => {
    const mission = await prisma.mission.create({
      data: { title: "Keep me", assignedTo: users.user.id, assignedBy: users.admin.id },
    })

    const res = (await missionByIdRoute.DELETE(
      cookieRequest(`http://localhost/api/missions/${mission.id}`, { token: tokenFor(users.volunteer) }),
      { params: Promise.resolve({ id: mission.id }) },
    )) as NextResponse
    expect(res.status).toBe(403)

    await prisma.mission.delete({ where: { id: mission.id } })
  })

  it("DELETE /api/missions/:id allows an admin", async () => {
    const mission = await prisma.mission.create({
      data: { title: "Remove me", assignedTo: users.user.id, assignedBy: users.admin.id },
    })

    const res = (await missionByIdRoute.DELETE(
      cookieRequest(`http://localhost/api/missions/${mission.id}`, { token: tokenFor(users.admin) }),
      { params: Promise.resolve({ id: mission.id }) },
    )) as NextResponse
    expect(res.status).toBe(200)

    const gone = await prisma.mission.findUnique({ where: { id: mission.id } })
    expect(gone).toBeNull()
  })

  it("GET /api/meeting-minutes rejects a regular user (403)", async () => {
    const res = (await meetingMinutesRoute.GET(
      cookieRequest("http://localhost/api/meeting-minutes", { token: tokenFor(users.user) })
    )) as NextResponse
    expect(res.status).toBe(403)
  })

  it("POST /api/meeting-minutes rejects a volunteer (403)", async () => {
    const res = (await meetingMinutesRoute.POST(
      cookieRequest("http://localhost/api/meeting-minutes", {
        token: tokenFor(users.volunteer),
        method: "POST",
        body: { title: "Should not exist", meetingDate: "2026-08-01" },
      })
    )) as NextResponse
    expect(res.status).toBe(403)
    const created = await prisma.meetingMinutes.findFirst({ where: { title: "Should not exist" } })
    expect(created).toBeNull()
  })

  it("POST /api/meeting-minutes allows an admin and derives recordedBy from the session", async () => {
    const res = (await meetingMinutesRoute.POST(
      cookieRequest("http://localhost/api/meeting-minutes", {
        token: tokenFor(users.admin),
        method: "POST",
        body: {
          title: "Admin minutes",
          meetingDate: "2026-08-05",
          attendees: ["Ada Lovelace"],
          agenda: ["Item 1"],
          actionItems: [{ item: "Action", assignedTo: "Ada Lovelace", status: "pending" }],
          decisions: [],
        },
      })
    )) as NextResponse
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.minutes.title).toBe("Admin minutes")
    expect(body.minutes.attendees).toEqual(["Ada Lovelace"])
    expect(body.minutes.recordedBy).toBe(users.admin.name)

    await prisma.meetingMinutes.deleteMany({ where: { title: "Admin minutes" } })
  })

  it("PATCH /api/meeting-minutes/:id allows an admin and rejects a user", async () => {
    const minutes = await prisma.meetingMinutes.create({
      data: { title: "Patch me", meetingDate: "2026-08-05", attendees: [], agenda: [], actionItems: [], decisions: [] },
    })

    const denied = (await meetingMinuteByIdRoute.PATCH(
      cookieRequest(`http://localhost/api/meeting-minutes/${minutes.id}`, {
        token: tokenFor(users.user),
        method: "PATCH",
        body: { title: "Hijacked" },
      }),
      { params: Promise.resolve({ id: minutes.id }) },
    )) as NextResponse
    expect(denied.status).toBe(403)

    const allowed = (await meetingMinuteByIdRoute.PATCH(
      cookieRequest(`http://localhost/api/meeting-minutes/${minutes.id}`, {
        token: tokenFor(users.admin),
        method: "PATCH",
        body: { title: "Patched" },
      }),
      { params: Promise.resolve({ id: minutes.id }) },
    )) as NextResponse
    expect(allowed.status).toBe(200)
    const body = await allowed.json()
    expect(body.minutes.title).toBe("Patched")

    await prisma.meetingMinutes.delete({ where: { id: minutes.id } })
  })

  it("DELETE /api/meeting-minutes/:id rejects a volunteer and allows an admin", async () => {
    const minutes = await prisma.meetingMinutes.create({
      data: { title: "Delete me", meetingDate: "2026-08-05", attendees: [], agenda: [], actionItems: [], decisions: [] },
    })

    const denied = (await meetingMinuteByIdRoute.DELETE(
      cookieRequest(`http://localhost/api/meeting-minutes/${minutes.id}`, { token: tokenFor(users.volunteer) }),
      { params: Promise.resolve({ id: minutes.id }) },
    )) as NextResponse
    expect(denied.status).toBe(403)

    const allowed = (await meetingMinuteByIdRoute.DELETE(
      cookieRequest(`http://localhost/api/meeting-minutes/${minutes.id}`, { token: tokenFor(users.admin) }),
      { params: Promise.resolve({ id: minutes.id }) },
    )) as NextResponse
    expect(allowed.status).toBe(200)

    const gone = await prisma.meetingMinutes.findUnique({ where: { id: minutes.id } })
    expect(gone).toBeNull()
  })
})

afterAll(async () => {
  const ids = [...Object.values(users).map((u) => u.id), ...(createdByApi ? [createdByApi.id] : [])]
  await prisma.auditLog.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
  await prisma.$disconnect()
  if (ORIGINAL_SECRET === undefined) delete process.env.JWT_SECRET
  else process.env.JWT_SECRET = ORIGINAL_SECRET
})
