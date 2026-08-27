import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"
import { requireAuth } from "@/lib/auth-middleware"
import { assertSameOrigin } from "@/lib/security"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

// Verify a file's magic bytes match its declared MIME type. The multipart
// Content-Type is client-supplied and can be forged, so we inspect the actual
// bytes to prevent storing arbitrary content (polyglots, malformed images,
// HTML/script disguised as an image) that could be weaponized against viewers.
function detectImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
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
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const formData = await request.formData()
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
    const filename = `items/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const blob = await put(filename, file, {
      access: "public",
      contentType: detectedType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}