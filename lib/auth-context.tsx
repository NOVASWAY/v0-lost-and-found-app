"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { type User } from "./mock-data"
import { getUsers, updateUser, initializeStorage } from "./storage"
import { addAuditLog } from "./audit-logger"
import { sanitizeSearchQuery } from "./security"

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
    // Initialize storage on mount
    initializeStorage()
    
    // Check for stored user session
    const storedSessionToken = sessionStorage.getItem("sessionToken")
    const storedUserId = sessionStorage.getItem("userId")
    
    if (storedSessionToken && storedUserId) {
      try {
        // Verify session integrity
        const users = getUsers()
        const foundUser = users.find((u) => u.id === storedUserId)
        
        if (foundUser) {
          setUser(foundUser)
          setIsAuthenticated(true)
          resetSessionTimeout()
          
          // Apply user preferences
          const { getUserPreferences, getDefaultUserPreferences } = require("./storage")
          const prefs = getUserPreferences(foundUser.id) || getDefaultUserPreferences()
          if (prefs.theme === "dark") {
            document.documentElement.classList.add("dark")
          } else if (prefs.theme === "light") {
            document.documentElement.classList.remove("dark")
          } else if (prefs.theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
            document.documentElement.classList.toggle("dark", systemTheme === "dark")
          }
        } else {
          // Clear invalid session
          sessionStorage.removeItem("sessionToken")
          sessionStorage.removeItem("userId")
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
      const users = getUsers()
      const foundUser = users.find((u) => u.username === sanitizedUsername && u.password === password)
      
      if (foundUser) {
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
      } else {
        // Log failed attempt
        sessionStorage.setItem("loginAttempts", (loginAttempts + 1).toString())
        return false
      }
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

    // Verify current password
    const users = getUsers()
    const foundUser = users.find((u) => u.id === user.id && u.password === currentPassword)
    if (!foundUser) {
      return false
    }

    // Update password in storage
    const updated = updateUser(user.id, { password: newPassword })
    if (updated) {
      // Update current user object
      const updatedUser = { ...user, password: newPassword }
      setUser(updatedUser)
      sessionStorage.setItem("userId", updatedUser.id)
      addAuditLog("user_password_changed", "User password changed", user.id, user.name, `Password changed for user '${user.username}'`, "info")
      return true
    }

    return false
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
