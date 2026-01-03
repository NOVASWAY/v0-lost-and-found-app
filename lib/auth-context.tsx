"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { type User } from "./mock-data"
import { getUsers, updateUser, initializeStorage } from "./storage"
import { addAuditLog } from "./audit-logger"

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Initialize storage on mount
    initializeStorage()
    
    // Check for stored user session
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      // Verify user still exists in storage
      const users = getUsers()
      const foundUser = users.find((u) => u.id === parsedUser.id)
      if (foundUser) {
        setUser(foundUser)
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem("currentUser")
      }
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    // Get users from storage
    const users = getUsers()
    const foundUser = users.find((u) => u.username === username && u.password === password)
    if (foundUser) {
      setUser(foundUser)
      setIsAuthenticated(true)
      localStorage.setItem("currentUser", JSON.stringify(foundUser))

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
    }
    return false
  }

  const logout = () => {
    if (user) {
      addAuditLog("logout", "User logged out", user.id, user.name, `User '${user.username}' logged out`, "info")
    }
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("currentUser")
    router.push("/")
  }

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
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      addAuditLog("user_password_changed", "User password changed", user.id, user.name, `Password changed for user '${user.username}'`, "info")
      return true
    }

    return false
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, isAuthenticated }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
