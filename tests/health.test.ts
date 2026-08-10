import { afterAll, describe, expect, it } from "vitest"
import { NextResponse } from "next/server"

import { prisma } from "../lib/db"
import { GET as healthGet } from "../app/api/health/route"

describe("GET /api/health", () => {
  it("reports ok when the database responds", async () => {
    const res = (await healthGet()) as NextResponse
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe("ok")
    expect(body.db).toBe("up")
  })
})

afterAll(async () => {
  await prisma.$disconnect()
})
