"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { addAuditLog } from "./audit-logger"
import { sanitizeSearchQuery } from "./security"

// Production user type
interface User {
  id: string
  name: string
  username: string
  role: "admin" | "volunteer" | "user"
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
  logout: () => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Session security: clear session after 30 minutes of inactivity
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

function readCachedUser(): User | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem("user")
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    sessionStorage.removeItem("user")
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readCachedUser())
  const [isAuthenticated, setIsAuthenticated] = useState(() => readCachedUser() !== null)
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Secure session management - use useCallback with empty deps to avoid circular dependency
  const resetSessionTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current)
    
    sessionTimeoutRef.current = setTimeout(() => {
      setUser(null)
      setIsAuthenticated(false)
      sessionStorage.removeItem("userId")
      sessionStorage.removeItem("user")
      router.push("/")
    }, SESSION_TIMEOUT)
  }, [router])

  // Single useEffect for initialization - runs only on mount
  useEffect(() => {
    // Apply theme preference
    const theme = localStorage.getItem("theme") || "system"
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark")
    } else if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      document.documentElement.classList.toggle("dark", systemTheme === "dark")
    }

    // Optimistically restore the cached user object for instant UI, then validate
    // the session server-side against the httpOnly cookie (no token in storage).
    const cachedUser = sessionStorage.getItem("user")
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser) as User)
        setIsAuthenticated(true)
      } catch {
        sessionStorage.removeItem("user")
      }
    }

    let cancelled = false
    fetch("/api/auth/me", {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("unauthorized"))))
      .then((data) => {
        if (cancelled) return
        if (data?.user) {
          setUser(data.user)
          sessionStorage.setItem("user", JSON.stringify(data.user))
          sessionStorage.setItem("userId", data.user.id)
          setIsAuthenticated(true)
          resetSessionTimeout()
        } else {
          throw new Error("no user in response")
        }
      })
      .catch(() => {
        if (cancelled) return
        setUser(null)
        setIsAuthenticated(false)
        sessionStorage.removeItem("user")
        sessionStorage.removeItem("userId")
      })

    // Activity listener for session timeout reset
    const handleUserActivity = () => resetSessionTimeout()
    window.addEventListener("mousedown", handleUserActivity)
    window.addEventListener("keydown", handleUserActivity)

    return () => {
      cancelled = true
      window.removeEventListener("mousedown", handleUserActivity)
      window.removeEventListener("keydown", handleUserActivity)
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current)
    }
  }, [resetSessionTimeout])

  const login = async (username: string, password: string, opts?: { redirect?: boolean }): Promise<boolean> => {
    // Sanitize inputs
    const sanitizedUsername = sanitizeSearchQuery(username)
    
    // Rate limit check (simple implementation)
    const loginAttempts = parseInt(sessionStorage.getItem("loginAttempts") || "0")
    if (loginAttempts > 5) {
      return false
    }

    try {
      // Make API call to secure backend endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: sanitizedUsername, password }),
      })

      if (!response.ok) {
        // Log failed attempt
        sessionStorage.setItem("loginAttempts", (loginAttempts + 1).toString())
        return false
      }

      const data = await response.json()
      const foundUser = data.user

      if (!foundUser) {
        return false
      }
      
      setUser(foundUser)
      setIsAuthenticated(true)
      
      // Session is carried by the httpOnly `auth_token` cookie set by the server.
      // Only the (non-secret) user profile is cached for instant UI.
      sessionStorage.setItem("userId", foundUser.id)
      sessionStorage.setItem("user", JSON.stringify(foundUser))
      sessionStorage.removeItem("loginAttempts")
      
      resetSessionTimeout()

      // Add audit log
      addAuditLog("login", "User logged in", foundUser.id, foundUser.name, `User '${foundUser.username}' logged in`, "info")

      // Route based on role. Set `opts.redirect: false` to let the caller play
      // its own cinematic transition before navigating (used by the login page).
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

  const logout = useCallback(() => {
    if (user) {
      addAuditLog("logout", "User logged out", user.id, user.name, `User '${user.username}' logged out`, "info")
    }
    // Clear the httpOnly session cookie server-side.
    try {
      fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {})
    } catch {
      /* ignore network errors during logout */
    }
    setUser(null)
    setIsAuthenticated(false)
    sessionStorage.removeItem("userId")
    sessionStorage.removeItem("user")
    sessionStorage.removeItem("loginAttempts")
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current)
    router.push("/")
  }, [user, router])

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false

    try {
      // Auth comes from the httpOnly session cookie.
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (!response.ok) {
        return false
      }

      addAuditLog(
        "user_password_changed",
        "User password changed",
        user.id,
        user.name,
        `Password changed for user '${user.username}'`,
        "info"
      )
      return true
    } catch {
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, isAuthenticated }}>
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
