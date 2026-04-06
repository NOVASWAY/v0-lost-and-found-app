import crypto from "crypto"

type JwtPayload = {
  sub: string
  role: string
  username: string
  name: string
  iat: number
  exp: number
}

const base64UrlEncode = (input: Buffer | string): string => {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8")
  // base64url = base64 with +/ replaced and = stripped
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

const base64UrlDecode = (input: string): Buffer => {
  // Convert base64url -> base64
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4)
  return Buffer.from(base64, "base64")
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET
  if (!secret || typeof secret !== "string" || secret.length < 16) {
    throw new Error("Missing/invalid JWT_SECRET (must be at least 16 characters)")
  }
  return secret
}

export function signAccessToken(payload: Omit<JwtPayload, "iat" | "exp">, opts?: { ttlSeconds?: number }): string {
  const ttlSeconds = opts?.ttlSeconds ?? 15 * 60 // 15 minutes
  const now = Math.floor(Date.now() / 1000)

  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
  }

  const header = { alg: "HS256", typ: "JWT" }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))

  const secret = getJwtSecret()
  const data = `${encodedHeader}.${encodedPayload}`
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest()

  const encodedSignature = base64UrlEncode(signature)
  return `${data}.${encodedSignature}`
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const [encodedHeader, encodedPayload, encodedSignature] = parts
    const secret = getJwtSecret()

    const data = `${encodedHeader}.${encodedPayload}`
    const expectedSig = crypto.createHmac("sha256", secret).update(data).digest()
    const actualSig = base64UrlDecode(encodedSignature)

    if (actualSig.length !== expectedSig.length) return null
    const equal = crypto.timingSafeEqual(actualSig, expectedSig)
    if (!equal) return null

    const payloadStr = base64UrlDecode(encodedPayload).toString("utf8")
    const payload = JSON.parse(payloadStr) as Partial<JwtPayload>

    if (!payload?.sub || !payload?.role || !payload?.username || !payload?.name) return null
    if (typeof payload.exp !== "number") return null

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp <= now) return null

    return payload as JwtPayload
  } catch {
    return null
  }
}

