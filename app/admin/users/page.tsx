"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUsers, initializeStorage } from "@/lib/storage"

export default function AdminUsersPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState(getUsers())

  useEffect(() => {
    initializeStorage()
    setUsers(getUsers())
  }, [])

  // Protect route - require authentication and admin role
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    if (user?.role !== "admin") {
      router.push("/dashboard")
      return
    }
  }, [isAuthenticated, user, router])

  // Show nothing while checking authentication
  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  const filteredUsers = users.filter((u) => {
    const searchLower = searchQuery.toLowerCase()
    return u.name.toLowerCase().includes(searchLower) || u.username.toLowerCase().includes(searchLower)
  })

  const regularUsers = users.filter((u) => u.role === "user").length
  const volunteers = users.filter((u) => u.role === "volunteer").length
  const admins = users.filter((u) => u.role === "admin").length

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">User Activity</h1>
          <p className="text-muted-foreground">Monitor user contributions and engagement</p>
        </div>

        {/* Search */}
        <Card className="mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or username..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{users.length}</p>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{regularUsers}</p>
            <p className="text-sm text-muted-foreground">Regular Users</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{volunteers}</p>
            <p className="text-sm text-muted-foreground">Volunteers</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{admins}</p>
            <p className="text-sm text-muted-foreground">Admins</p>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Username</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Role</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Uploads</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Claims</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Join Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium text-card-foreground">{u.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{u.username}</td>
                    <td className="p-4">
                      <Badge variant={u.role === "volunteer" ? "default" : "outline"} className="capitalize">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-4 text-center text-sm text-muted-foreground">{u.itemsUploaded}</td>
                    <td className="p-4 text-center text-sm text-muted-foreground">{u.claimsSubmitted}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(u.joinedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}
