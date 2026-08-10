"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, UserPlus, Upload, FileCheck, Users, Calendar, ShieldAlert, Trash2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usersApi, serviceRecordsApi, ApiError, type UserListItem } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { BackButton } from "@/components/back-button"

export default function AdminUsersPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<UserListItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null)
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false)
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0])
  const [markAttended, setMarkAttended] = useState(true)
  const [markServed, setMarkServed] = useState(false)
  const [serviceNotes, setServiceNotes] = useState("")
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
    role: "user" as "user" | "volunteer" | "admin",
  })

  const loadUsers = () => {
    usersApi
      .getAll()
      .then((res) => setUsers(res.users))
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load users"
        toast({ title: "Error", description: message, variant: "destructive" })
      })
      .finally(() => setIsLoaded(true))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  const filteredUsers = users.filter((u) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      u.name.toLowerCase().includes(searchLower) ||
      u.username.toLowerCase().includes(searchLower) ||
      u.role.toLowerCase().includes(searchLower)
    )
  })

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await usersApi.create({
        name: newUser.name,
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
      })
      loadUsers()
      toast({
        title: "Success",
        description: "User created successfully",
      })
      setNewUser({ name: "", username: "", password: "", role: "user" })
      setCreateDialogOpen(false)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to create user"
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

  const handleMarkAttendance = async () => {
    if (!selectedUser || !user) return

    try {
      await serviceRecordsApi.create({
        userId: selectedUser.id,
        serviceDate,
        attended: markAttended,
        served: markServed,
        notes: serviceNotes || undefined,
        recordedBy: user.name,
      })
      loadUsers()
      setAttendanceDialogOpen(false)
      setSelectedUser(null)
      setServiceDate(new Date().toISOString().split("T")[0])
      setMarkAttended(true)
      setMarkServed(false)
      setServiceNotes("")
      toast({
        title: "Success",
        description: "Attendance/service recorded successfully",
      })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to record attendance"
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

  const handleDeactivateUser = async () => {
    if (!selectedUser) return

    try {
      await usersApi.delete(selectedUser.id)
      loadUsers()
      setDeactivateDialogOpen(false)
      setSelectedUser(null)
      toast({
        title: "Success",
        description: "User deactivated successfully",
      })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to deactivate user"
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallbackHref="/admin" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Asset Personnel Registry</h1>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <UserPlus className="mr-2 w-4 h-4" />
                  Grant Clearance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Initialize Node</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Entity Name *</Label>
                    <Input
                      id="name"
                      required
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Full Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      required
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      required
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Enter password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Clearance Level</Label>
                    <select
                      id="role"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    >
                      <option value="user">Standard (User)</option>
                      <option value="volunteer">Release Agent (Volunteer)</option>
                      <option value="admin">Superuser (Admin)</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create User</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">Modify credentials and security clearances</p>
        </div>

        {/* Search */}
        <Card className="mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by ID, Name or Clearance Level..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* Users Table */}
        <Card className="bg-card border-border shadow-2xl">
          <div className="overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-widest text-muted-foreground font-bold">
                <tr>
                  <th className="p-4">Entity</th>
                  <th className="p-4">Clearance</th>
                  <th className="p-4">Standing</th>
                  <th className="p-4">Activity</th>
                  <th className="p-4 text-right">Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!isLoaded && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                      Loading personnel...
                    </td>
                  </tr>
                )}
                {isLoaded && filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-accent/10 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold border border-border">
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={`
                          px-2 py-0.5 text-[10px] uppercase font-bold tracking-tighter
                          ${
                            u.role === "admin"
                              ? "border-primary text-primary bg-primary/5"
                              : u.role === "volunteer"
                                ? "border-blue-500 text-blue-500 bg-blue-500/5"
                                : "border-muted text-muted-foreground"
                          }
                        `}
                      >
                        {u.role === "admin" ? "Superuser" : u.role === "volunteer" ? "Release Agent" : "Standard"}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black italic text-accent">{u.vaultPoints} VP</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                          Rank #{u.rank}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                          <span className="flex items-center gap-1">
                            <Upload className="w-3 h-3" /> {u.itemsUploaded}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileCheck className="w-3 h-3" /> {u.claimsSubmitted}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> Att: {u.attendanceCount || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Svc: {u.serviceCount || 0}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-500 hover:bg-blue-500/10 p-2 h-auto"
                          onClick={() => {
                            setSelectedUser(u)
                            setAttendanceDialogOpen(true)
                          }}
                          title="Mark Attendance/Service"
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive p-2 h-auto"
                          onClick={() => {
                            setSelectedUser(u)
                            setDeactivateDialogOpen(true)
                          }}
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Attendance Dialog */}
        <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Service Attendance</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm font-semibold text-card-foreground">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                </div>
                <div>
                  <Label htmlFor="serviceDate">Service Date *</Label>
                  <Input
                    id="serviceDate"
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="attended"
                      checked={markAttended}
                      onCheckedChange={(checked) => setMarkAttended(checked === true)}
                    />
                    <Label htmlFor="attended" className="text-sm font-medium cursor-pointer">
                      Attended Service (+10 Vault Points)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="served"
                      checked={markServed}
                      onCheckedChange={(checked) => setMarkServed(checked === true)}
                    />
                    <Label htmlFor="served" className="text-sm font-medium cursor-pointer">
                      Served at Service (+25 Vault Points)
                    </Label>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={serviceNotes}
                    onChange={(e) => setServiceNotes(e.target.value)}
                    placeholder="Service notes..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAttendanceDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleMarkAttendance}>Record</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Deactivate Dialog */}
        <Dialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate User</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to deactivate <strong>{selectedUser.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDeactivateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeactivateUser}>
                    Deactivate
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
