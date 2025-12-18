"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  UserPlus,
  UserX,
  UserCheck,
  Activity,
  Users,
  Shield,
  Upload,
  FileCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { mockUsers, type User } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { StatusBadge } from "@/components/status-badge"

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "user" as "user" | "volunteer" | "admin",
  })

  const filteredUsers = users.filter((u) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      u.name.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      u.role.toLowerCase().includes(searchLower)
    )
  })

  const activeUsers = users.filter((u) => u.id !== "deactivated").length
  const regularUsers = users.filter((u) => u.role === "user").length
  const volunteers = users.filter((u) => u.role === "volunteer").length
  const admins = users.filter((u) => u.role === "admin").length
  const totalUploads = users.reduce((sum, u) => sum + u.itemsUploaded, 0)
  const totalClaims = users.reduce((sum, u) => sum + u.claimsSubmitted, 0)

  const handleCreateUser = () => {
    const user: User = {
      id: `u${users.length + 1}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      itemsUploaded: 0,
      claimsSubmitted: 0,
      joinedAt: new Date().toISOString().split("T")[0],
      claimedItems: [],
    }
    setUsers([...users, user])
    setNewUser({ name: "", email: "", role: "user" })
    setCreateDialogOpen(false)
  }

  const handleDeactivateUser = () => {
    if (selectedUser) {
      setUsers(users.filter((u) => u.id !== selectedUser.id))
      setDeactivateDialogOpen(false)
      setSelectedUser(null)
    }
  }

  const toggleRowExpansion = (userId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedRows(newExpanded)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role={user?.role || "admin"} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users and monitor system activity</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Create User Account
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{activeUsers}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-500/10 p-3">
                <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{regularUsers}</p>
                <p className="text-xs text-muted-foreground">Regular Users</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-500/10 p-3">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{volunteers}</p>
                <p className="text-xs text-muted-foreground">Volunteers</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-500/10 p-3">
                <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{admins}</p>
                <p className="text-xs text-muted-foreground">Admins</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-orange-500/10 p-3">
                <Upload className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{totalUploads}</p>
                <p className="text-xs text-muted-foreground">Total Uploads</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-teal-500/10 p-3">
                <FileCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{totalClaims}</p>
                <p className="text-xs text-muted-foreground">Total Claims</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* User Management Table */}
        <Card>
          <div className="border-b border-border bg-muted/30 p-4">
            <h2 className="text-lg font-semibold text-card-foreground">User Account Management</h2>
            <p className="text-sm text-muted-foreground">
              Create, view, and deactivate user accounts. Click any row to see claimed items.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="w-10 p-4"></th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Role</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Uploads</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Claims</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Join Date</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isExpanded = expandedRows.has(u.id)
                  const hasClaims = u.claimedItems && u.claimedItems.length > 0

                  return (
                    <>
                      <tr
                        key={u.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer"
                        onClick={() => hasClaims && toggleRowExpansion(u.id)}
                      >
                        <td className="p-4">
                          {hasClaims &&
                            (isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            ))}
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-card-foreground">{u.name}</div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                        <td className="p-4">
                          <Badge
                            variant={u.role === "admin" ? "default" : u.role === "volunteer" ? "secondary" : "outline"}
                            className="capitalize"
                          >
                            {u.role}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {u.itemsUploaded}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {u.claimsSubmitted}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(u.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedUser(u)
                              setDeactivateDialogOpen(true)
                            }}
                          >
                            <UserX className="h-4 w-4" />
                            Deactivate
                          </Button>
                        </td>
                      </tr>
                      {isExpanded && hasClaims && (
                        <tr key={`${u.id}-details`} className="border-b border-border bg-muted/20">
                          <td colSpan={8} className="p-6">
                            <div className="ml-10">
                              <h4 className="mb-4 text-sm font-semibold text-card-foreground">
                                Claimed Items ({u.claimedItems?.length || 0})
                              </h4>
                              <div className="grid gap-3">
                                {u.claimedItems?.map((claim, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-card-foreground">{claim.itemName}</p>
                                      <p className="text-sm text-muted-foreground">
                                        Claimed on {new Date(claim.claimedAt).toLocaleDateString()} at{" "}
                                        {new Date(claim.claimedAt).toLocaleTimeString()}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <StatusBadge status={claim.claimStatus} type="claim" />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          window.location.href = `/items/${claim.itemId}`
                                        }}
                                      >
                                        View Item
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New User Account</DialogTitle>
            <DialogDescription>
              Add a new user to the Lost & Found system. Assign the appropriate role.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User - Can upload and claim items</SelectItem>
                  <SelectItem value="volunteer">Volunteer - Can release items to claimants</SelectItem>
                  <SelectItem value="admin">Admin - Full system access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={!newUser.name || !newUser.email}>
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate User Dialog */}
      <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Deactivate User Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate this user? This action will remove their access to the system.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="grid gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-card-foreground">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-card-foreground">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivateUser} className="gap-2">
              <UserX className="h-4 w-4" />
              Deactivate Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
