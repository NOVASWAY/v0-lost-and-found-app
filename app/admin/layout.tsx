import type React from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyAccessToken } from "@/lib/jwt"

export const metadata = {
  title: "Admin - Vault Church Security System",
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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

  if (!payload || payload.role !== "admin") {
    redirect("/login")
  }

  return <>{children}</>
}
