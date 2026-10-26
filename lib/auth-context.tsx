"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { isUserRole, type UserRole } from "@/lib/domain"
import { SESSION_IDLE_TIMEOUT_MS, SESSION_REFRESH_INTERVAL_MS } from "@/lib/session"

// Production user type
interface User {
  id: string
  name: string
  username: string
  role: UserRole
  vaultPoints: number
  rank: number
  itemsUploaded: number
  claimsSubmitted: number
  attendanceCount: number
  serviceCount: number
  // Optional client-side fields used by some UI components.
  orders?: Array<{ status: string }>
  claimedItems?: Array<any>
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string, opts?: { redirect?: boolean }) => Promise<boolean>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  isAuthenticated: boolean
  isLoaded: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode
  initialUser?: User | null
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialUser))
  const isLoaded = true
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const refreshRequestRef = useRef<Promise<void> | null>(null)
  const lastRefreshRef = useRef(initialUser ? Date.now() : 0)
  const isAuthenticatedRef = useRef(Boolean(initialUser))
  const router = useRouter()

  const updateSessionUser = useCallback((nextUser: User | null) => {
    isAuthenticatedRef.current = Boolean(nextUser)
    setUser(nextUser)
    setIsAuthenticated(Boolean(nextUser))
  }, [])

  const clearSession = useCallback((destination: string) => {
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current)
    updateSessionUser(null)
    router.replace(destination)
  }, [router, updateSessionUser])

  const expireSession = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
      })
    } catch {
      // The server-side session may already have expired.
    }
    clearSession("/login?reason=session-expired")
  }, [clearSession])

  const resetSessionTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current)
    if (!isAuthenticatedRef.current) return

    sessionTimeoutRef.current = setTimeout(() => {
      void expireSession()
    }, SESSION_IDLE_TIMEOUT_MS)
  }, [expireSession])

  const refreshSession = useCallback(async () => {
    if (!isAuthenticatedRef.current) return
    if (Date.now() - lastRefreshRef.current < SESSION_REFRESH_INTERVAL_MS) return
    if (refreshRequestRef.current) return refreshRequestRef.current

    const refreshRequest = (async () => {
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
        })
        if (response.status === 401) {
          await expireSession()
          return
        }
        if (response.ok) {
          const data = await response.json()
          if (!data?.user || !isUserRole(data.user.role)) {
            await expireSession()
            return
          }
          updateSessionUser(data.user as User)
          lastRefreshRef.current = Date.now()
          resetSessionTimeout()
        }
      } catch {
        // A later user interaction retries the refresh if the network is unavailable.
      } finally {
        refreshRequestRef.current = null
      }
    })()

    refreshRequestRef.current = refreshRequest
    return refreshRequest
  }, [expireSession, resetSessionTimeout, updateSessionUser])

  useEffect(() => {
    const theme = localStorage.getItem("theme") || "system"
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark")
    } else if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      document.documentElement.classList.toggle("dark", systemTheme === "dark")
    }
  }, [])

  useEffect(() => {
    const handleUserActivity = () => {
      if (!isAuthenticatedRef.current) return
      resetSessionTimeout()
      void refreshSession()
    }

    if (isAuthenticatedRef.current) resetSessionTimeout()
    window.addEventListener("pointerdown", handleUserActivity)
    window.addEventListener("keydown", handleUserActivity)
    window.addEventListener("touchstart", handleUserActivity)

    return () => {
      window.removeEventListener("pointerdown", handleUserActivity)
      window.removeEventListener("keydown", handleUserActivity)
      window.removeEventListener("touchstart", handleUserActivity)
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current)
    }
  }, [refreshSession, resetSessionTimeout])

  const login = async (username: string, password: string, opts?: { redirect?: boolean }): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      })

      if (!response.ok) return false

      const data = await response.json()
      const foundUser = data.user as User | undefined
      if (!foundUser || !isUserRole(foundUser.role)) return false

      updateSessionUser(foundUser)
      lastRefreshRef.current = Date.now()
      resetSessionTimeout()

      if (opts?.redirect !== false) {
        if (foundUser.role === "admin") {
          router.push("/admin")
        } else if (foundUser.role === "volunteer") {
          router.push("/volunteer/dashboard")
        } else {
          router.push("/dashboard")
        }
      }
      return true
    } catch {
      return false
    }
  }

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        keepalive: true,
      })
    } catch {
      // Clear the local view even if the logout request cannot reach the server.
    }
    clearSession("/")
  }, [clearSession])

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (!response.ok) return false
      lastRefreshRef.current = Date.now()
      resetSessionTimeout()
      return true
    } catch {
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, isAuthenticated, isLoaded }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
