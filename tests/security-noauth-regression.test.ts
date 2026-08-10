import { afterAll, describe, expect, it } from "vitest"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { prisma } from "../lib/db"
import * as itemsRoute from "../app/api/items/route"
import * as itemByIdRoute from "../app/api/items/[id]/route"
import * as claimsRoute from "../app/api/claims/route"
import * as claimByIdRoute from "../app/api/claims/[id]/route"
import * as locationsRoute from "../app/api/locations/route"
import * as locationByIdRoute from "../app/api/locations/[id]/route"
import * as usersByIdRoute from "../app/api/users/[id]/route"
import * as serviceRecordsRoute from "../app/api/service-records/route"
import * as ordersRoute from "../app/api/orders/route"
import * as orderByIdRoute from "../app/api/orders/[id]/route"
import * as missionsRoute from "../app/api/missions/route"
import * as missionByIdRoute from "../app/api/missions/[id]/route"
import * as meetingMinutesRoute from "../app/api/meeting-minutes/route"
import * as meetingMinuteByIdRoute from "../app/api/meeting-minutes/[id]/route"

function mockRequest(): NextRequest {
  const headers = new Headers()
  return {
    headers,
    nextUrl: { searchParams: new URLSearchParams() },
    json: async () => ({}),
  } as unknown as NextRequest
}

// Every protected mutation must return 401 without a session cookie. If any
// route handler forgets its requireAuth/requireAdmin guard, this suite fails.
describe("no-auth regression: protected routes require a session", () => {
  const req = mockRequest()

  it("rejects POST /api/items without auth", async () => {
    const res = (await itemsRoute.POST(req)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects PATCH /api/items/:id without auth", async () => {
    const ctx = { params: Promise.resolve({ id: "c0000000000000000000000000" }) } as unknown as { params: Promise<{ id: string }> }
    const res = (await itemByIdRoute.PATCH(req, ctx)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects DELETE /api/items/:id without auth", async () => {
    const ctx = { params: Promise.resolve({ id: "c0000000000000000000000000" }) } as unknown as { params: Promise<{ id: string }> }
    const res = (await itemByIdRoute.DELETE(req, ctx)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects POST /api/claims without auth", async () => {
    const res = (await claimsRoute.POST(req)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects PATCH /api/claims/:id without auth", async () => {
    const ctx = { params: Promise.resolve({ id: "c0000000000000000000000000" }) } as unknown as { params: Promise<{ id: string }> }
    const res = (await claimByIdRoute.PATCH(req, ctx)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects POST /api/locations without auth", async () => {
    const res = (await locationsRoute.POST(req)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects PATCH /api/locations/:id without auth", async () => {
    const ctx = { params: Promise.resolve({ id: "c0000000000000000000000000" }) } as unknown as { params: Promise<{ id: string }> }
    const res = (await locationByIdRoute.PATCH(req, ctx)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects DELETE /api/users/:id without auth", async () => {
    const ctx = { params: Promise.resolve({ id: "c0000000000000000000000000" }) } as unknown as { params: Promise<{ id: string }> }
    const res = (await usersByIdRoute.DELETE(req, ctx)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects POST /api/service-records without auth", async () => {
    const res = (await serviceRecordsRoute.POST(req)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects GET /api/orders without auth", async () => {
    const res = (await ordersRoute.GET(req)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects PATCH /api/orders/:id without auth", async () => {
    const ctx = { params: Promise.resolve({ id: "c0000000000000000000000000" }) } as unknown as { params: Promise<{ id: string }> }
    const res = (await orderByIdRoute.PATCH(req, ctx)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects GET /api/missions without auth", async () => {
    const res = (await missionsRoute.GET(req)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects POST /api/missions without auth", async () => {
    const res = (await missionsRoute.POST(req)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects PATCH /api/missions/:id without auth", async () => {
    const ctx = { params: Promise.resolve({ id: "c0000000000000000000000000" }) } as unknown as { params: Promise<{ id: string }> }
    const res = (await missionByIdRoute.PATCH(req, ctx)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects DELETE /api/missions/:id without auth", async () => {
    const ctx = { params: Promise.resolve({ id: "c0000000000000000000000000" }) } as unknown as { params: Promise<{ id: string }> }
    const res = (await missionByIdRoute.DELETE(req, ctx)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects GET /api/meeting-minutes without auth", async () => {
    const res = (await meetingMinutesRoute.GET(req)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects POST /api/meeting-minutes without auth", async () => {
    const res = (await meetingMinutesRoute.POST(req)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects PATCH /api/meeting-minutes/:id without auth", async () => {
    const ctx = { params: Promise.resolve({ id: "c0000000000000000000000000" }) } as unknown as { params: Promise<{ id: string }> }
    const res = (await meetingMinuteByIdRoute.PATCH(req, ctx)) as NextResponse
    expect(res.status).toBe(401)
  })

  it("rejects DELETE /api/meeting-minutes/:id without auth", async () => {
    const ctx = { params: Promise.resolve({ id: "c0000000000000000000000000" }) } as unknown as { params: Promise<{ id: string }> }
    const res = (await meetingMinuteByIdRoute.DELETE(req, ctx)) as NextResponse
    expect(res.status).toBe(401)
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})
