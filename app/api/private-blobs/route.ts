import { get } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth-middleware"
import { isStaffRole } from "@/lib/domain"
import { isAllowedPrivateBlobPathname, privateBlobUrl } from "@/lib/private-blob"

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  Vary: "Cookie",
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  const pathname = request.nextUrl.searchParams.get("pathname")
  if (!pathname || !isAllowedPrivateBlobPathname(pathname)) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400, headers: PRIVATE_HEADERS })
  }
  if (!prisma || !process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Private storage is unavailable" }, { status: 503, headers: PRIVATE_HEADERS })
  }

  const url = privateBlobUrl(pathname)
  const [item, claim] = await Promise.all([
    prisma.item.findFirst({ where: { imageUrl: url }, select: { id: true } }),
    prisma.claim.findFirst({
      where: { proofImage: url },
      select: { claimantId: true },
    }),
  ])
  const canReadItemPhoto = Boolean(item)
  const canReadProof = Boolean(
    claim && (isStaffRole(authResult.user.role) || claim.claimantId === authResult.user.id),
  )
  if (!canReadItemPhoto && !canReadProof) {
    return NextResponse.json({ error: "File not found" }, { status: 404, headers: PRIVATE_HEADERS })
  }

  try {
    const result = await get(pathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    if (!result) {
      return NextResponse.json({ error: "File not found" }, { status: 404, headers: PRIVATE_HEADERS })
    }

    const headers = new Headers(PRIVATE_HEADERS)
    headers.set("ETag", result.blob.etag)
    if (result.statusCode === 304) {
      return new NextResponse(null, { status: 304, headers })
    }

    headers.set("Content-Type", result.blob.contentType)
    return new NextResponse(result.stream, { headers })
  } catch (error) {
    console.error("Private blob read failed:", error)
    return NextResponse.json({ error: "Unable to read file" }, { status: 503, headers: PRIVATE_HEADERS })
  }
}
