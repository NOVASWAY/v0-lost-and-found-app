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
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Session security: clear session after 30 minutes of inactivity
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Secure session management - use useCallback with empty deps to avoid circular dependency
  const resetSessionTimeout = useCallback(() => {
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current)
    
    sessionTimeoutRef.current = setTimeout(() => {
      setUser(null)
      setIsAuthenticated(false)
      sessionStorage.removeItem("sessionToken")
      sessionStorage.removeItem("userId")
      router.push("/")
      console.log("[Security] Session expired due to inactivity")
    }, SESSION_TIMEOUT)
  }, [router])

  // Single useEffect for initialization - runs only on mount
  useEffect(() => {
    // Check for stored user session from database-backed API
    const storedSessionToken = sessionStorage.getItem("sessionToken")
    const storedUserId = sessionStorage.getItem("userId")
    
    if (storedSessionToken && storedUserId) {
      try {
        // Session exists from previous login via database auth API
        // The session token is just a marker; actual auth is via API
        setIsAuthenticated(true)
        resetSessionTimeout()
        
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
      } catch (error) {
        console.error("[Security] Session validation failed:", error)
        sessionStorage.removeItem("sessionToken")
        sessionStorage.removeItem("userId")
      }
    }

    // Activity listener for session timeout reset
    const handleUserActivity = () => resetSessionTimeout()
    window.addEventListener("mousedown", handleUserActivity)
    window.addEventListener("keydown", handleUserActivity)
    
    return () => {
      window.removeEventListener("mousedown", handleUserActivity)
      window.removeEventListener("keydown", handleUserActivity)
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current)
    }
  }, [resetSessionTimeout])

  const login = async (username: string, password: string): Promise<boolean> => {
    // Sanitize inputs
    const sanitizedUsername = sanitizeSearchQuery(username)
    
    // Rate limit check (simple implementation)
    const loginAttempts = parseInt(sessionStorage.getItem("loginAttempts") || "0")
    if (loginAttempts > 5) {
      console.log("[Security] Too many login attempts")
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

      // Generate session token (secure random string)
      const sessionToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
      
      setUser(foundUser)
      setIsAuthenticated(true)
      
      // Use sessionStorage instead of localStorage for sensitive data
      sessionStorage.setItem("sessionToken", sessionToken)
      sessionStorage.setItem("userId", foundUser.id)
      sessionStorage.removeItem("loginAttempts")
      
      resetSessionTimeout()

      // Add audit log
      addAuditLog("login", "User logged in", foundUser.id, foundUser.name, `User '${foundUser.username}' logged in`, "info")

      // Route based on role
      if (foundUser.role === "admin") {
        router.push("/admin")
      } else if (foundUser.role === "volunteer") {
        router.push("/volunteer/dashboard")
      } else {
        router.push("/dashboard")
      }
      return true
    } catch (error) {
      console.error("[Security] Login error:", error)
      return false
    }
  }

  const logout = useCallback(() => {
    if (user) {
      addAuditLog("logout", "User logged out", user.id, user.name, `User '${user.username}' logged out`, "info")
    }
    setUser(null)
    setIsAuthenticated(false)
    sessionStorage.removeItem("sessionToken")
    sessionStorage.removeItem("userId")
    sessionStorage.removeItem("loginAttempts")
    if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current)
    router.push("/")
  }, [user, router])

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
        }),
      })

      if (!response.ok) {
        console.error("Password change failed")
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
    } catch (error) {
      console.error("Password change error:", error)
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
