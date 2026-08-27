import type React from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyAccessToken } from "@/lib/jwt"
import { prisma, withDbRetry } from "@/lib/db"

export const metadata = {
  title: "Volunteer - Vault Church Security System",
  robots: { index: false, follow: false },
}

export default async function VolunteerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    redirect("/login")
  }

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch {
    payload = null
  }

  if (!payload) {
    redirect("/login")
  }

  // Re-validate against DB: reject revoked sessions and reflect current role
  try {
    const user = await withDbRetry(() =>
      prisma.user.findUnique({
        where: { id: payload!.sub },
        select: { role: true, tokenVersion: true },
      })
    )
    if (!user || user.tokenVersion !== payload!.tokenVersion || (user.role !== "volunteer" && user.role !== "admin")) {
      redirect("/login")
    }
  } catch {
    redirect("/login")
  }

  return <>{children}</>
}
