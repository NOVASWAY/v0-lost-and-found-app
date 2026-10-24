import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAdmin } from "@/lib/auth-middleware"
import { assertSameOrigin, readJsonBody } from "@/lib/security"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { z } from "zod"
import { DEFAULT_POINT_RULES } from "@/lib/points"

const ruleSchema = z.object({
  action: z.string().regex(/^[a-z][a-z0-9_]*$/).max(60),
  label: z.string().trim().min(1).max(120),
  points: z.number().int().min(0).max(10000),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth
  const result = await rateLimit(getClientIdentifier(request), { windowMs: 60000, maxRequests: 60 })
  if (!result.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  await Promise.all(
    Object.entries(DEFAULT_POINT_RULES).map(([action, points]) =>
      prisma.pointRule.upsert({
        where: { action },
        update: {},
        create: { action, label: action.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), points },
      }),
    ),
  )
  const rules = await prisma.pointRule.findMany({ orderBy: { label: "asc" } })
  return NextResponse.json({ rules })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (auth instanceof NextResponse) return auth
  if (!assertSameOrigin(request)) return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
  const body = await readJsonBody(request)
  if (!body.ok) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  const parsed = ruleSchema.safeParse(body.data)
  if (!parsed.success) return NextResponse.json({ error: "Invalid point rule" }, { status: 400 })
  try {
    const rule = await prisma.pointRule.upsert({
      where: { action: parsed.data.action },
      update: parsed.data,
      create: parsed.data,
    })
    return NextResponse.json({ rule })
  } catch (error) {
    console.error("Save point rule error:", error)
    return NextResponse.json({ error: "Unable to save point rule" }, { status: 500 })
  }
}
