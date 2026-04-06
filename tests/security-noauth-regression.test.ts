import assert from "node:assert/strict"
import { NextResponse } from "next/server"

import * as itemsRoute from "../app/api/items/route"
import * as itemByIdRoute from "../app/api/items/[id]/route"
import * as claimsRoute from "../app/api/claims/route"
import * as claimByIdRoute from "../app/api/claims/[id]/route"
import * as locationsRoute from "../app/api/locations/route"
import * as locationByIdRoute from "../app/api/locations/[id]/route"
import * as usersByIdRoute from "../app/api/users/[id]/route"
import * as serviceRecordsRoute from "../app/api/service-records/route"

function mockRequest() {
  const headers = new Headers()
  return {
    headers,
    nextUrl: { searchParams: new URLSearchParams() },
    json: async () => ({}),
  } as any
}

async function assertStatus(fn: () => Promise<any>, expectedStatus: number) {
  const res = await fn()
  // NextResponse.json returns a NextResponse with `.status`.
  const status = (res as NextResponse).status
  assert.equal(status, expectedStatus)
}

async function run() {
  const req = mockRequest()

  // Items (POST /items)
  await assertStatus(() => itemsRoute.POST(req), 401)

  // Items (PATCH /items/:id, DELETE /items/:id)
  await assertStatus(() => itemByIdRoute.PATCH(req, { params: Promise.resolve({ id: "c0000000000000000000000000" }) } as any), 401)
  await assertStatus(() => itemByIdRoute.DELETE(req, { params: Promise.resolve({ id: "c0000000000000000000000000" }) } as any), 401)

  // Claims (POST /claims, PATCH /claims/:id)
  await assertStatus(() => claimsRoute.POST(req), 401)
  await assertStatus(() => claimByIdRoute.PATCH(req, { params: Promise.resolve({ id: "c0000000000000000000000000" }) } as any), 401)

  // Locations (POST /locations, PATCH /locations/:id)
  await assertStatus(() => locationsRoute.POST(req), 401)
  await assertStatus(() => locationByIdRoute.PATCH(req, { params: Promise.resolve({ id: "c0000000000000000000000000" }) } as any), 401)

  // Users (DELETE /users/:id)
  await assertStatus(() => usersByIdRoute.DELETE(req, { params: Promise.resolve({ id: "c0000000000000000000000000" }) } as any), 401)

  // Service records (POST /service-records)
  await assertStatus(() => serviceRecordsRoute.POST(req), 401)

  // If we got here, all assertions passed.
  // eslint-disable-next-line no-console
  console.log("security-noauth-regression: PASS")
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("security-noauth-regression: FAIL", err)
  process.exit(1)
})

