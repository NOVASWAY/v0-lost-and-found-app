import type { NextRequest } from "next/server"
import { SESSION_TTL_SECONDS } from "@/lib/session"

export function getSessionCookieOptions(
  request: NextRequest,
  maxAge = SESSION_TTL_SECONDS,
) {
  const secure = new URL(request.url).protocol === "https:"

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    path: "/",
    maxAge,
    ...(maxAge === 0 ? { expires: new Date(0) } : {}),
  }
}
