"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  UserPlus,
  Activity,
  Upload,
  FileCheck,
  ShieldAlert,
  Lock,
  Fingerprint,
  Eye,
  Zap,
  ShieldCheck,
  MessageSquare,
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Users,
  Calendar,
  MapPin,
  Package,
  FileText,
  Settings,
} from "lucide-react"
import { type User, type Order, type Playbook, type Location, type Mission, type SystemSettings } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { addAuditLog } from "@/lib/audit-logger"
import { useToast } from "@/hooks/use-toast"
import { FloatingActionIcon } from "@/components/floating-action-icon"
import { getUsers, getPlaybooks, getLocations, getAuditLogs, getMissions, getSystemSettings, updateSystemSettings, addUser, updateUser, deleteUser, addPlaybook, updatePlaybook, deletePlaybook, addLocation, updateLocation, deleteLocation, initializeStorage, addServiceRecord, addMission, updateMission, deleteMission } from "@/lib/storage"

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>(getUsers())
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [orderMessage, setOrderMessage] = useState("") // State for order message
  const [orderTitle, setOrderTitle] = useState("")
  const [orderPriority, setOrderPriority] = useState<"low" | "medium" | "high">("medium")
  const [playbooks, setPlaybooks] = useState<Playbook[]>(getPlaybooks())
  const [isPlaybookDialogOpen, setIsPlaybookDialogOpen] = useState(false)
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null)
  const [newPlaybook, setNewPlaybook] = useState<Partial<Playbook>>({
    title: "",
    scenario: "",
    protocol: "",
    priority: "medium",
  })
  const [locations, setLocations] = useState<Location[]>(getLocations())
  const [auditLogs, setAuditLogs] = useState(getAuditLogs())
  const [missions, setMissions] = useState<Mission[]>(getMissions())
  const [isMissionDialogOpen, setIsMissionDialogOpen] = useState(false)
  const [editingMission, setEditingMission] = useState<Mission | null>(null)
  const [newMission, setNewMission] = useState<Partial<Mission>>({
    title: "",
    description: "",
    instructions: "",
    priority: "medium",
    status: "pending",
  })
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [newLocation, setNewLocation] = useState<Partial<Location>>({
    name: "",
    description: "",
  })
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    password: "",
    role: "user" as "user" | "volunteer" | "admin",
  })
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false)
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0])
  const [markAttended, setMarkAttended] = useState(true)
  const [markServed, setMarkServed] = useState(false)
  const [serviceNotes, setServiceNotes] = useState("")
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [expirationDays, setExpirationDays] = useState(30)

  useEffect(() => {
    initializeStorage()
    setUsers(getUsers())
    setPlaybooks(getPlaybooks())
    setLocations(getLocations())
    setAuditLogs(getAuditLogs())
    setMissions(getMissions())
    setSystemSettings(getSystemSettings())
    setExpirationDays(getSystemSettings().itemExpirationDays)
  }, [])

  const filteredUsers = users.filter((u) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      u.name.toLowerCase().includes(searchLower) ||
      u.username.toLowerCase().includes(searchLower) ||
      u.role.toLowerCase().includes(searchLower)
    )
  })

  const activeUsers = users.filter((u) => u.id !== "deactivated").length
  const regularUsers = users.filter((u) => u.role === "user").length
  const volunteers = users.filter((u) => u.role === "volunteer").length
  const admins = users.filter((u) => u.role === "admin").length
  const totalUploads = users.reduce((sum, u) => sum + u.itemsUploaded, 0)
  const totalClaims = users.reduce((sum, u) => sum + u.claimsSubmitted, 0)

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

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault()
    const id = `u${Math.random().toString(36).substr(2, 9)}`
    const newUserData: User = {
      id,
      name: newUser.name,
      username: newUser.username,
      password: newUser.password,
      role: newUser.role,
      itemsUploaded: 0,
      claimsSubmitted: 0,
      joinedAt: new Date().toISOString().split("T")[0],
      vaultPoints: 0,
      rank: users.length + 1,
      attendanceCount: 0,
      serviceCount: 0,
      orders: [],
    }
    addUser(newUserData)
    setUsers(getUsers())
    addAuditLog("user_created", "User account created", newUserData.id, newUserData.name, `User '${newUserData.username}' created with role '${newUserData.role}'`, "info")
    setNewUser({ name: "", username: "", password: "", role: "user" })
    setCreateDialogOpen(false)
  }

  const handleMarkAttendance = () => {
    if (!selectedUser) return

    const pointsToAdd = (markAttended ? 10 : 0) + (markServed ? 25 : 0)
    const serviceRecordId = `sr${Date.now()}`
    const currentServiceRecords = selectedUser.serviceRecords || []
    
    // Update in storage
    updateUser(selectedUser.id, {
      attendanceCount: markAttended ? selectedUser.attendanceCount + 1 : selectedUser.attendanceCount,
      serviceCount: markServed ? selectedUser.serviceCount + 1 : selectedUser.serviceCount,
      vaultPoints: selectedUser.vaultPoints + pointsToAdd,
      serviceRecords: [
        ...currentServiceRecords,
        {
          id: serviceRecordId,
          serviceDate,
          attended: markAttended,
          served: markServed,
          notes: serviceNotes || undefined,
          recordedBy: user?.name || "Admin",
          recordedAt: new Date().toISOString(),
        },
      ],
    })

    // Add service record to storage
    addServiceRecord({
      id: serviceRecordId,
      serviceDate,
      attended: markAttended,
      served: markServed,
      notes: serviceNotes || undefined,
      recordedBy: user?.name || "Admin",
      recordedAt: new Date().toISOString(),
      userId: selectedUser.id,
    } as any)

    if (markAttended) {
      addAuditLog("attendance_marked", "Attendance marked", selectedUser.id, selectedUser.name, `Marked attendance for service on ${serviceDate}`, "info")
    }
    if (markServed) {
      addAuditLog("service_marked", "Service marked", selectedUser.id, selectedUser.name, `Marked service participation for ${serviceDate}`, "info")
    }

    setUsers(getUsers())
    setAttendanceDialogOpen(false)
    setSelectedUser(null)
    setServiceDate(new Date().toISOString().split("T")[0])
    setMarkAttended(true)
    setMarkServed(false)
    setServiceNotes("")
  }

  const handleDeactivateUser = () => {
    if (selectedUser) {
      addAuditLog("user_deleted", "User account deactivated", selectedUser.id, selectedUser.name, `User '${selectedUser.username}' deactivated`, "warning")
      deleteUser(selectedUser.id)
      setUsers(getUsers())
      setDeactivateDialogOpen(false)
      setSelectedUser(null)
    }
  }

  const handleSendOrder = (userId: string) => {
    if (!orderTitle || !orderMessage) return

    const newOrder: Order = {
      id: `o${Math.random().toString(36).substr(2, 9)}`,
      title: orderTitle,
      message: orderMessage,
      status: "unread",
      priority: orderPriority,
      createdAt: new Date().toISOString(),
    }

    const targetUser = users.find((u) => u.id === userId)
    if (targetUser) {
      updateUser(userId, {
        orders: [...(targetUser.orders || []), newOrder],
      })
      setUsers(getUsers())
    }

    setOrderTitle("")
    setOrderMessage("")
    setOrderPriority("medium")
    setSelectedUser(null)
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

  const handleSavePlaybook = () => {
    if (!newPlaybook.title || !newPlaybook.protocol) return

    if (editingPlaybook) {
      updatePlaybook(editingPlaybook.id, {
        ...newPlaybook,
        updatedAt: new Date().toISOString(),
      } as Partial<Playbook>)
      addAuditLog("playbook_updated", "Playbook updated", user?.id, user?.name, `Playbook '${editingPlaybook.title}' updated`, "info")
    } else {
      const playbook: Playbook = {
        id: `pb${Date.now()}`,
        title: newPlaybook.title,
        scenario: newPlaybook.scenario || "",
        protocol: newPlaybook.protocol,
        priority: (newPlaybook.priority as any) || "medium",
        updatedAt: new Date().toISOString(),
      }
      addPlaybook(playbook)
      addAuditLog("playbook_created", "Playbook created", user?.id, user?.name, `Playbook '${playbook.title}' created`, "info")
    }

    setPlaybooks(getPlaybooks())
    setIsPlaybookDialogOpen(false)
    setEditingPlaybook(null)
    setNewPlaybook({ title: "", scenario: "", protocol: "", priority: "medium" })
  }

  const handleDeletePlaybook = (id: string) => {
    const playbook = playbooks.find((pb) => pb.id === id)
    if (playbook) {
      addAuditLog("playbook_deleted", "Playbook deleted", user?.id, user?.name, `Playbook '${playbook.title}' deleted`, "warning")
    }
    deletePlaybook(id)
    setPlaybooks(getPlaybooks())
  }

  const openEditPlaybook = (pb: Playbook) => {
    setEditingPlaybook(pb)
    setNewPlaybook(pb)
    setIsPlaybookDialogOpen(true)
  }

  const handleSaveLocation = () => {
    if (!newLocation.name) return

    if (editingLocation) {
      updateLocation(editingLocation.id, newLocation as Partial<Location>)
      addAuditLog("location_updated", "Location updated", user?.id, user?.name, `Location '${editingLocation.name}' updated`, "info")
    } else {
      const location: Location = {
        id: `loc${Date.now()}`,
        name: newLocation.name,
        description: newLocation.description || undefined,
        createdAt: new Date().toISOString(),
      }
      addLocation(location)
      addAuditLog("location_created", "Location created", user?.id, user?.name, `Location '${location.name}' created`, "info")
    }

    setIsLocationDialogOpen(false)
    setEditingLocation(null)
    setNewLocation({ name: "", description: "" })
  }

  const handleDeleteLocation = (id: string) => {
    const location = locations.find((loc) => loc.id === id)
    if (location) {
      addAuditLog("location_deleted", "Location deleted", user?.id, user?.name, `Location '${location.name}' deleted`, "warning")
    }
    deleteLocation(id)
    setLocations(getLocations())
  }

  const openEditLocation = (loc: Location) => {
    setEditingLocation(loc)
    setNewLocation(loc)
    setIsLocationDialogOpen(true)
  }

  const handleSaveMission = () => {
    if (!newMission.title || !newMission.assignedTo || !newMission.instructions) return

    if (editingMission) {
      updateMission(editingMission.id, {
        ...newMission,
        updatedAt: new Date().toISOString(),
      } as Partial<Mission>)
      addAuditLog("mission_assigned", "Mission updated", user?.id, user?.name, `Mission '${editingMission.title}' updated`, "info")
    } else {
      const assignedUser = users.find((u) => u.id === newMission.assignedTo)
      const mission: Mission = {
        id: `m${Date.now()}`,
        title: newMission.title,
        description: newMission.description || "",
        assignedTo: newMission.assignedTo,
        assignedToName: assignedUser?.name || "Unknown",
        assignedBy: user?.id || "",
        assignedByName: user?.name || "Admin",
        priority: (newMission.priority as any) || "medium",
        status: (newMission.status as any) || "pending",
        dueDate: newMission.dueDate,
        location: newMission.location,
        instructions: newMission.instructions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addMission(mission)
      addAuditLog("mission_created", "Mission created", user?.id, user?.name, `Mission '${mission.title}' assigned to ${mission.assignedToName}`, "info")
    }

    setMissions(getMissions())
    setIsMissionDialogOpen(false)
    setEditingMission(null)
    setNewMission({ title: "", description: "", instructions: "", priority: "medium", status: "pending" })
  }

  const handleDeleteMission = (id: string) => {
    const mission = missions.find((m) => m.id === id)
    if (mission) {
      addAuditLog("mission_cancelled", "Mission cancelled", user?.id, user?.name, `Mission '${mission.title}' cancelled`, "warning")
    }
    deleteMission(id)
    setMissions(getMissions())
  }

  const openEditMission = (mission: Mission) => {
    setEditingMission(mission)
    setNewMission(mission)
    setIsMissionDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Navbar role="admin" />
      
      {/* Floating Action Icons */}
      <FloatingActionIcon
        href="/admin/users"
        icon={Users}
        label="Manage Users"
        color="primary"
        position="bottom-right"
        delay={0}
      />
      <FloatingActionIcon
        href="/admin/items"
        icon={Package}
        label="Manage Items"
        color="accent"
        position="bottom-right"
        delay={150}
      />
      <FloatingActionIcon
        href="/admin/claims"
        icon={FileText}
        label="Review Claims"
        color="warning"
        position="bottom-left"
        delay={300}
      />
      <FloatingActionIcon
        href="/admin"
        icon={Settings}
        label="System Settings"
        color="info"
        position="bottom-left"
        delay={450}
      />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-7xl animate-in fade-in duration-700 pb-24 sm:pb-10">
        <div className="mb-8 sm:mb-12 border-b border-border/50 pb-6 sm:pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div>
            <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
                <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase italic">Security Command Center</h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl font-medium">
              Vault Church high-security asset management. Authorization level:{" "}
              <span className="text-primary font-bold">SUPERUSER</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="border-border hover:bg-muted font-bold tracking-tight bg-transparent"
              onClick={() => (window.location.href = "/admin/audit-logs")}
            >
              <Eye className="mr-2 w-4 h-4" />
              Audit Logs
            </Button>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-primary text-primary-foreground font-black tracking-tight hover:scale-105 transition-transform"
            >
              <UserPlus className="mr-2 w-4 h-4" />
              Grant Access
            </Button>
          </div>
        </div>

        {/* Security Matrix Overview */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8 sm:mb-12">
          {[
            { label: "Active Nodes", value: activeUsers, icon: Activity, color: "text-blue-500" },
            { label: "Secure Vaults", value: totalUploads, icon: Lock, color: "text-amber-500" },
            { label: "Verified Claims", value: totalClaims, icon: Fingerprint, color: "text-emerald-500" },
            { label: "Audit Logs", value: "2.4k", icon: Eye, color: "text-purple-500" },
          ].map((stat, i) => (
            <Card
              key={i}
              className="bg-card border-border hover:border-primary/50 transition-all p-4 sm:p-6 relative overflow-hidden group"
            >
              <div 
                className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity animate-float-gentle"
                style={{
                  animationDelay: `${i * 200}ms`,
                  animationDuration: '4s',
                }}
              >
                <stat.icon className={`w-8 h-8 sm:w-12 sm:h-12 ${stat.color}`} />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl sm:text-3xl font-bold">{stat.value}</h3>
            </Card>
          ))}
        </div>

        {/* Access Control Console */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card border-border shadow-2xl">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Asset Personnel Registry</h2>
                  <p className="text-sm text-muted-foreground">Modify credentials and security clearances</p>
                </div>
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                >
                  <UserPlus className="mr-2 w-4 h-4" />
                  Grant Clearance
                </Button>
              </div>

              <div className="p-4 bg-muted/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter by ID, Name or Clearance Level..."
                    className="bg-background/50 border-border pl-10 focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Secure Table Rendering */}
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
                    {filteredUsers.map((u) => (
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
                              className="text-primary hover:bg-primary/10 p-2 h-auto"
                              onClick={() => {
                                setSelectedUser(u)
                                // Normally we'd open a dialog here
                                const title = prompt("Enter Order Title:")
                                const message = prompt("Enter Order Message:")
                                if (title && message) {
                                  const newOrder: Order = {
                                    id: `o${Math.random().toString(36).substr(2, 9)}`,
                                    title,
                                    message,
                                    status: "unread",
                                    priority: "medium",
                                    createdAt: new Date().toISOString(),
                                  }
                                  setUsers(
                                    users.map((user) =>
                                      user.id === u.id ? { ...user, orders: [...(user.orders || []), newOrder] } : user,
                                    ),
                                  )
                                }
                              }}
                            >
                              <MessageSquare className="w-4 h-4" />
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

            {/* Situational Playbooks Management Section */}
            <Card className="bg-card border-border shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between bg-primary/5">
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase italic flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Operational Playbooks
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    Standard operating procedures for security scenarios
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingPlaybook(null)
                    setNewPlaybook({ title: "", scenario: "", protocol: "", priority: "medium" })
                    setIsPlaybookDialogOpen(true)
                  }}
                  variant="outline"
                  size="sm"
                  className="border-primary/50 text-primary hover:bg-primary/10 font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" /> New Protocol
                </Button>
              </div>
              <div className="divide-y divide-border">
                {playbooks.map((pb) => (
                  <div key={pb.id} className="p-4 hover:bg-muted/30 transition-colors group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`uppercase text-[10px] font-black ${
                            pb.priority === "critical"
                              ? "bg-destructive"
                              : pb.priority === "high"
                                ? "bg-amber-600"
                                : "bg-primary"
                          }`}
                        >
                          {pb.priority}
                        </Badge>
                        <h4 className="font-bold tracking-tight">{pb.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-muted-foreground mr-2">
                          REV: {new Date(pb.updatedAt).toLocaleDateString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => openEditPlaybook(pb)}
                        >
                          <Edit className="w-3 h-3 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeletePlaybook(pb.id)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-2">Scenario: {pb.scenario}</p>
                    <div className="bg-background/50 border border-border/50 p-3 rounded text-xs font-mono leading-relaxed">
                      {pb.protocol}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Location Management Section */}
            <Card className="bg-card border-border shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between bg-primary/5">
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase italic flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Church Locations
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    Manage locations where items can be found
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingLocation(null)
                    setNewLocation({ name: "", description: "" })
                    setIsLocationDialogOpen(true)
                  }}
                  variant="outline"
                  size="sm"
                  className="border-primary/50 text-primary hover:bg-primary/10 font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" /> New Location
                </Button>
              </div>
              <div className="divide-y divide-border">
                {locations.map((loc) => (
                  <div key={loc.id} className="p-4 hover:bg-muted/30 transition-colors group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold tracking-tight">{loc.name}</h4>
                        {loc.description && (
                          <p className="text-xs text-muted-foreground mt-1">{loc.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => openEditLocation(loc)}
                        >
                          <Edit className="w-3 h-3 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteLocation(loc.id)}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {locations.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">No locations configured</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Mission Assignments Section */}
            <Card className="bg-card border-border shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between bg-primary/5">
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase italic flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Mission Assignments
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    Assign and track security missions and tasks
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingMission(null)
                    setNewMission({ title: "", description: "", instructions: "", priority: "medium", status: "pending" })
                    setIsMissionDialogOpen(true)
                  }}
                  variant="outline"
                  size="sm"
                  className="border-primary/50 text-primary hover:bg-primary/10 font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" /> New Mission
                </Button>
              </div>
              <div className="divide-y divide-border">
                {missions.map((mission) => {
                  const statusColors = {
                    pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/50",
                    in_progress: "bg-blue-500/20 text-blue-600 border-blue-500/50",
                    completed: "bg-green-500/20 text-green-600 border-green-500/50",
                    cancelled: "bg-gray-500/20 text-gray-600 border-gray-500/50",
                  }
                  const priorityColors = {
                    critical: "bg-destructive",
                    high: "bg-amber-600",
                    medium: "bg-primary",
                    low: "bg-muted",
                  }
                  return (
                    <div key={mission.id} className="p-4 hover:bg-muted/30 transition-colors group">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`uppercase text-[10px] font-black ${priorityColors[mission.priority]}`}>
                              {mission.priority}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] ${statusColors[mission.status]}`}>
                              {mission.status.replace("_", " ").toUpperCase()}
                            </Badge>
                            <h4 className="font-bold tracking-tight">{mission.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{mission.description}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {mission.assignedToName}
                            </span>
                            {mission.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {mission.location}
                              </span>
                            )}
                            {mission.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due: {new Date(mission.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => openEditMission(mission)}
                          >
                            <Edit className="w-3 h-3 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteMission(mission.id)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="bg-background/50 border border-border/50 p-3 rounded text-xs font-mono leading-relaxed mt-2">
                        {mission.instructions}
                      </div>
                    </div>
                  )
                })}
                {missions.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">No missions assigned</p>
                  </div>
                )}
              </div>
            </Card>

            {/* System Settings Section */}
            <Card className="bg-card border-border shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between bg-primary/5">
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase italic flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    System Settings
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    Configure system-wide settings and preferences
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Item Expiration Period (Days)</Label>
                    <p className="text-xs text-muted-foreground">
                      Set how many days items remain available before automatic expiration. Current: {systemSettings?.itemExpirationDays || 30} days
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={expirationDays}
                        onChange={(e) => setExpirationDays(parseInt(e.target.value) || 30)}
                        className="w-32 bg-muted/50"
                      />
                      <Button
                        onClick={() => {
                          updateSystemSettings({ itemExpirationDays: expirationDays }, user?.id || "admin")
                          const updated = getSystemSettings()
                          setSystemSettings(updated)
                          addAuditLog("system_settings_updated", "System settings updated", user?.id, user?.name, `Item expiration period changed to ${expirationDays} days`, "info")
                          toast({
                            title: "Settings Updated",
                            description: `Item expiration period set to ${expirationDays} days.`,
                          })
                        }}
                        className="bg-primary font-black uppercase italic"
                      >
                        Save Settings
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* System Integrity & Logs */}
          <div className="space-y-6">
            <Card className="bg-card border-border p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" /> System Health
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vault Integrity</span>
                  <span className="text-emerald-500 font-bold font-mono">100.0%</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-full animate-pulse" />
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Audit Stream</span>
                  <span className="text-primary font-bold font-mono">ACTIVE</span>
                </div>
              </div>
            </Card>

            <Card className="bg-card border-border p-6 h-fit">
              <h3 className="text-lg font-bold mb-6">Recent Security Events</h3>
              <div className="space-y-6">
                {auditLogs.slice(0, 5).map((log) => {
                  const getIcon = () => {
                    if (log.type.includes("claim")) return FileCheck
                    if (log.severity === "error" || log.severity === "critical") return ShieldAlert
                    return Zap
                  }
                  const getTimeAgo = (timestamp: string) => {
                    const now = Date.now()
                    const logTime = new Date(timestamp).getTime()
                    const diff = now - logTime
                    const minutes = Math.floor(diff / 60000)
                    const hours = Math.floor(minutes / 60)
                    const days = Math.floor(hours / 24)
                    if (minutes < 1) return "Just now"
                    if (minutes < 60) return `${minutes}m ago`
                    if (hours < 24) return `${hours}h ago`
                    return `${days}d ago`
                  }
                  const Icon = getIcon()
                  const isAlert = log.severity === "error" || log.severity === "critical"
                  return (
                    <div key={log.id} className="flex gap-4 items-start">
                      <div
                        className={`p-2 rounded-md ${isAlert ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{log.userName || "System"}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">{log.action}</p>
                        <p className="text-[10px] text-primary/60 font-mono mt-1">{getTimeAgo(log.timestamp)}</p>
                      </div>
                    </div>
                  )
                })}
                {auditLogs.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No recent events</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {isPlaybookDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md p-6 border-primary shadow-[0_0_50px_rgba(var(--primary),0.1)]">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">
              {editingPlaybook ? "Update Protocol" : "New Protocol"}
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</label>
                <Input
                  value={newPlaybook.title || ""}
                  onChange={(e) => setNewPlaybook({ ...newPlaybook, title: e.target.value })}
                  placeholder="e.g., High-Value Asset Recovery"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Scenario
                </label>
                <Input
                  value={newPlaybook.scenario || ""}
                  onChange={(e) => setNewPlaybook({ ...newPlaybook, scenario: e.target.value })}
                  placeholder="What triggers this playbook?"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Protocol
                </label>
                <textarea
                  value={newPlaybook.protocol || ""}
                  onChange={(e) => setNewPlaybook({ ...newPlaybook, protocol: e.target.value })}
                  placeholder="Detailed instructions..."
                  className="w-full min-h-[100px] bg-muted/50 border border-border rounded-md px-3 py-2 text-xs font-mono focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Priority
                </label>
                <select
                  value={newPlaybook.priority || "medium"}
                  onChange={(e) => setNewPlaybook({ ...newPlaybook, priority: e.target.value as any })}
                  className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-xs focus:ring-primary focus:border-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsPlaybookDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePlaybook} className="flex-1 bg-primary font-black uppercase italic">
                  {editingPlaybook ? "Update" : "Deploy"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {createDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md p-6 border-primary shadow-[0_0_50px_rgba(var(--primary),0.1)]">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">Initialize Node</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Entity Name
                </label>
                <Input
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Full Name"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Username
                </label>
                <Input
                  required
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="username"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Password
                </label>
                <Input
                  required
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Clearance Level
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                >
                  <option value="user">Standard (User)</option>
                  <option value="volunteer">Release Agent (Volunteer)</option>
                  <option value="admin">Superuser (Admin)</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-primary font-black uppercase italic">
                  Create User
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {attendanceDialogOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md p-6 border-primary shadow-[0_0_50px_rgba(var(--primary),0.1)]">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">Record Service Attendance</h2>
            <div className="mb-4 p-3 bg-muted/50 rounded-md">
              <p className="text-sm font-semibold text-card-foreground">{selectedUser.name}</p>
              <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Service Date
                </Label>
                <Input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="bg-muted/50"
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
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Notes (Optional)
                </Label>
                <Input
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="Service notes..."
                  className="bg-muted/50"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setAttendanceDialogOpen(false)
                    setSelectedUser(null)
                    setServiceDate(new Date().toISOString().split("T")[0])
                    setMarkAttended(true)
                    setMarkServed(false)
                    setServiceNotes("")
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleMarkAttendance} className="flex-1 bg-primary font-black uppercase italic">
                  Record
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {isLocationDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md p-6 border-primary shadow-[0_0_50px_rgba(var(--primary),0.1)]">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">
              {editingLocation ? "Update Location" : "New Location"}
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location Name</label>
                <Input
                  value={newLocation.name || ""}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  placeholder="e.g., Main Sanctuary - Pew 12"
                  className="bg-muted/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Description (Optional)
                </label>
                <Input
                  value={newLocation.description || ""}
                  onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                  placeholder="Brief description of the location"
                  className="bg-muted/50"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setIsLocationDialogOpen(false)
                    setEditingLocation(null)
                    setNewLocation({ name: "", description: "" })
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveLocation} className="flex-1 bg-primary font-black uppercase italic">
                  {editingLocation ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {isMissionDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border-primary/20 shadow-2xl">
            <div className="p-6 border-b border-border bg-primary/5">
              <h3 className="text-xl font-black uppercase italic tracking-tight">
                {editingMission ? "Edit Mission" : "Create New Mission"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Mission Title *
                </Label>
                <Input
                  value={newMission.title || ""}
                  onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                  placeholder="e.g., Security Patrol - Main Sanctuary"
                  className="bg-muted/50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Description
                </Label>
                <Input
                  value={newMission.description || ""}
                  onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
                  placeholder="Brief description of the mission"
                  className="bg-muted/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Assign To *
                  </Label>
                  <Select
                    value={newMission.assignedTo || ""}
                    onValueChange={(value) => setNewMission({ ...newMission, assignedTo: value })}
                  >
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter((u) => u.role !== "admin").map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Priority
                  </Label>
                  <Select
                    value={newMission.priority}
                    onValueChange={(value: any) => setNewMission({ ...newMission, priority: value })}
                  >
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Status
                  </Label>
                  <Select
                    value={newMission.status}
                    onValueChange={(value: any) => setNewMission({ ...newMission, status: value })}
                  >
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Due Date
                  </Label>
                  <Input
                    type="date"
                    value={newMission.dueDate || ""}
                    onChange={(e) => setNewMission({ ...newMission, dueDate: e.target.value })}
                    className="bg-muted/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Location
                </Label>
                <Select
                  value={newMission.location || undefined}
                  onValueChange={(value) => setNewMission({ ...newMission, location: value || undefined })}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Select location (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.name}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Instructions *
                </Label>
                <Textarea
                  value={newMission.instructions || ""}
                  onChange={(e) => setNewMission({ ...newMission, instructions: e.target.value })}
                  placeholder="Detailed instructions for the mission..."
                  rows={6}
                  className="bg-muted/50 font-mono text-xs"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setIsMissionDialogOpen(false)
                    setEditingMission(null)
                    setNewMission({ title: "", description: "", instructions: "", priority: "medium", status: "pending" })
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveMission} className="flex-1 bg-primary font-black uppercase italic">
                  {editingMission ? "Update" : "Assign Mission"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
