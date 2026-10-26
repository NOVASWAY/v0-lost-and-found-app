import { NextRequest, NextResponse } from "next/server"
import { del, put } from "@vercel/blob"
import { prisma } from "@/lib/db"
import { privateBlobPathname, privateBlobUrl, type PrivateBlobPurpose } from "@/lib/private-blob"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { requireAuth } from "@/lib/auth-middleware"
import { assertSameOrigin, readJsonBody } from "@/lib/security"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const BLOB_HOST_SUFFIX = ".blob.vercel-storage.com"

// Verify a file's magic bytes match its declared MIME type. The multipart
// Content-Type is client-supplied and can be forged, so we inspect the actual
// bytes to prevent storing arbitrary content (polyglots, malformed images,
// HTML/script disguised as an image) that could be weaponized against viewers.
function detectImageType(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png"
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg"
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return "image/gif"
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp"
  }
  return null
}

// Every upload is namespaced under the uploader's id so a user can only ever
// address — and delete — their own blobs.
function uploadPathname(userId: string, purpose: PrivateBlobPurpose, ext: string): string {
  const prefix = purpose === "item" ? "items" : "claim-proofs"
  return `${prefix}/${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`
}

// Resolve a blob URL to its pathname, but only when it points at a blob in the
// caller's own namespace. Anything else is rejected.
function ownedBlobPathname(value: string, userId: string): string | null {
  let pathname = privateBlobPathname(value)

  if (!pathname) {
    let parsed: URL
    try {
      parsed = new URL(value)
    } catch {
      return null
    }

    if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(BLOB_HOST_SUFFIX)) return null
    try {
      pathname = decodeURIComponent(parsed.pathname).replace(/^\/+/, "")
    } catch {
      return null
    }
  }

  if (!pathname) return null
  const ownedPrefixes = [`items/${userId}/`, `claim-proofs/${userId}/`]
  const prefix = ownedPrefixes.find((candidate) => pathname.startsWith(candidate))
  if (!prefix || pathname.slice(prefix.length).includes("/")) return null
  return pathname
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!assertSameOrigin(request)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
    }

    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 20 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "Image storage is not configured" }, { status: 503 })
    }

    // formData() buffers the whole multipart body in memory, so reject an
    // oversized request from its declared length before parsing it. Chunked
    // uploads have no Content-Length and still hit the file.size check below.
    const declaredLength = Number(request.headers.get("content-length") ?? "")
    const MAX_REQUEST_SIZE = MAX_SIZE + 1024 * 1024 // allow multipart overhead
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 413 })
    }

    const formData = await request.formData()
    const purposeValue = formData.get("purpose")
    if (purposeValue !== "item" && purposeValue !== "claim-proof") {
      return NextResponse.json({ error: "Invalid upload purpose" }, { status: 400 })
    }
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }

    // Inspect the file's magic bytes to confirm it really is the image it claims
    // to be. Reject mismatches rather than trusting the declared Content-Type.
    const header = new Uint8Array(await file.slice(0, 16).arrayBuffer())
    const detectedType = detectImageType(header)
    if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
      return NextResponse.json({ error: "File is not a valid image" }, { status: 400 })
    }

    const ext = detectedType.split("/")[1]
    const pathname = uploadPathname(authResult.user.id, purposeValue, ext)

    const blob = await put(pathname, file, {
      access: "private",
      contentType: detectedType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json(
      { url: privateBlobUrl(blob.pathname) },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } },
    )
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

// DELETE removes an upload that was stored but never attached to a record
// (e.g. the upload succeeded but creating the item or claim failed). Only the
// caller's own uploads can be deleted.
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!assertSameOrigin(request)) {
      return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 })
    }

    const clientId = getClientIdentifier(request)
    const rateLimitResult = await rateLimit(clientId, { windowMs: 60000, maxRequests: 20 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json({ error: "Image storage is not configured" }, { status: 503 })
    }

    const jsonBody = await readJsonBody(request)
    if (!jsonBody.ok) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }
    const body = jsonBody.data as { url?: unknown } | null
    const url = typeof body?.url === "string" ? body.url : ""
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const pathname = ownedBlobPathname(url, authResult.user.id)
    if (!pathname) {
      return NextResponse.json({ error: "Invalid upload URL" }, { status: 400 })
    }
    if (!prisma) {
      return NextResponse.json({ error: "Database is not configured" }, { status: 503 })
    }

    const [attachedItem, attachedClaim] = await Promise.all([
      prisma.item.findFirst({ where: { imageUrl: url }, select: { id: true } }),
      prisma.claim.findFirst({
        where: { OR: [{ proofImage: url }, { itemImage: url }] },
        select: { id: true },
      }),
    ])
    if (attachedItem || attachedClaim) {
      return NextResponse.json({ error: "Uploads attached to a record cannot be deleted here" }, { status: 409 })
    }

    await del(pathname, { token: process.env.BLOB_READ_WRITE_TOKEN })

    return NextResponse.json({ message: "Upload deleted successfully" })
  } catch (error) {
    console.error("Delete upload error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
