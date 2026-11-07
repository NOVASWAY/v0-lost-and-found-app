import { NextRequest, NextResponse } from "next/server"
import { get } from "@vercel/blob"
import { prisma } from "@/lib/db"
import { getAuthenticatedUser } from "@/lib/auth-middleware"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { isOurBlobUrl } from "@/lib/media"

/**
 * Stream a private blob through the app so browsers never hit the storage URL.
 *
 * Authz:
 * - Item photos (Item.imageUrl): public — landing/catalog can show them.
 * - Claim proof photos (Claim.proofImage): staff or the claimant only.
 * - Orphan uploads still under items/{userId}/: the owning uploader only.
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 120 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "Image storage is not configured" }, { status: 503 })
    }

    const raw = request.nextUrl.searchParams.get("u") || ""
    let blobUrl: string
    try {
      blobUrl = decodeURIComponent(raw)
    } catch {
      return NextResponse.json({ error: "Invalid media URL" }, { status: 400 })
    }

    if (!isOurBlobUrl(blobUrl)) {
      return NextResponse.json({ error: "Invalid media URL" }, { status: 400 })
    }

    const viewer = await getAuthenticatedUser(request)
    const isStaff = viewer?.role === "admin" || viewer?.role === "volunteer"

    const [itemHit, proofHit] = await Promise.all([
      prisma.item.findFirst({
        where: { imageUrl: blobUrl },
        select: { id: true, uploadedById: true },
      }),
      prisma.claim.findFirst({
        where: { proofImage: blobUrl },
        select: { id: true, claimantId: true },
      }),
    ])

    if (proofHit) {
      if (!viewer || (!isStaff && proofHit.claimantId !== viewer.id)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    } else if (!itemHit) {
      // Orphan upload, occurrence attachment, or other private object.
      // Staff may fetch any of our blobs; everyone else only their own namespace.
      if (!viewer) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      if (!isStaff) {
        let pathname: string
        try {
          pathname = decodeURIComponent(new URL(blobUrl).pathname).replace(/^\/+/, "")
        } catch {
          return NextResponse.json({ error: "Invalid media URL" }, { status: 400 })
        }
        const prefix = `items/${viewer.id}/`
        if (!pathname.startsWith(prefix) || pathname.slice(prefix.length).includes("/")) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }
      }
    }
    // else: catalog item photo — intentionally public for the landing teaser.

    const isPrivateHost = new URL(blobUrl).hostname.includes(".private.blob.")
    if (isPrivateHost) {
      const result = await get(blobUrl, {
        access: "private",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
      if (!result || result.statusCode !== 200 || !result.stream) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }
      return new NextResponse(result.stream, {
        headers: {
          "Content-Type": result.blob.contentType || "application/octet-stream",
          "Cache-Control": "private, max-age=300",
          "X-Content-Type-Options": "nosniff",
        },
      })
    }

    // Legacy public blobs uploaded before the private-media cutover.
    const upstream = await fetch(blobUrl)
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": "private, max-age=300",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("Media proxy error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
