"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Activity, Plus, Edit, Trash2, Search, Users, MapPin, Calendar, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getMissions, getUsers, getLocations, addMission, updateMission, deleteMission, initializeStorage } from "@/lib/storage"
import { addAuditLog } from "@/lib/audit-logger"
import { useToast } from "@/hooks/use-toast"
import { BackButton } from "@/components/back-button"
import type { Mission } from "@/lib/mock-data"

export default function AdminMissionsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [missions, setMissions] = useState<Mission[]>(getMissions())
  const [users, setUsers] = useState(getUsers())
  const [locations, setLocations] = useState(getLocations())
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMission, setEditingMission] = useState<Mission | null>(null)
  const [newMission, setNewMission] = useState<Partial<Mission>>({
    title: "",
    description: "",
    instructions: "",
    priority: "medium",
    status: "pending",
    assignedTo: "",
    dueDate: "",
    location: "",
  })

  useEffect(() => {
    initializeStorage()
    setMissions(getMissions())
    setUsers(getUsers())
    setLocations(getLocations())
  }, [])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  const filteredMissions = missions.filter((mission) => {
    const matchesSearch =
      mission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || mission.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSaveMission = () => {
    if (!newMission.title || !newMission.instructions || !newMission.assignedTo) {
      toast({
        title: "Error",
        description: "Title, instructions, and assigned user are required",
        variant: "destructive",
      })
      return
    }

    const assignedUser = users.find((u) => u.id === newMission.assignedTo)
    if (!assignedUser) {
      toast({
        title: "Error",
        description: "Invalid user selected",
        variant: "destructive",
      })
      return
    }

    if (editingMission) {
      updateMission(editingMission.id, {
        ...newMission,
        assignedToName: assignedUser.name,
        updatedAt: new Date().toISOString(),
      } as Partial<Mission>)
      addAuditLog("mission_assigned", "Mission updated", user.id, user.name, `Mission '${editingMission.title}' updated`, "info")
      toast({
        title: "Success",
        description: "Mission updated successfully",
      })
      setMissions(getMissions())
      setIsDialogOpen(false)
      setEditingMission(null)
      setNewMission({ title: "", description: "", instructions: "", priority: "medium", status: "pending", assignedTo: "", dueDate: "", location: "" })
    } else {
      const mission: Mission = {
        id: `m${Date.now()}`,
        title: newMission.title!,
        description: newMission.description || "",
        instructions: newMission.instructions!,
        assignedTo: newMission.assignedTo!,
        assignedToName: assignedUser.name,
        assignedBy: user.id,
        assignedByName: user.name,
        priority: (newMission.priority as any) || "medium",
        status: (newMission.status as any) || "pending",
        dueDate: newMission.dueDate || undefined,
        location: newMission.location || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addMission(mission)
      addAuditLog("mission_created", "Mission created", user.id, user.name, `Mission '${mission.title}' created`, "info")
      toast({
        title: "Success",
        description: "Mission created successfully",
      })
      setMissions(getMissions())
      setIsDialogOpen(false)
      setNewMission({ title: "", description: "", instructions: "", priority: "medium", status: "pending", assignedTo: "", dueDate: "", location: "" })
    }
  }

  const handleDeleteMission = (id: string) => {
    if (!confirm("Are you sure you want to delete this mission?")) return

    const mission = missions.find((m) => m.id === id)
    if (mission) {
      deleteMission(id)
      addAuditLog("mission_cancelled", "Mission deleted", user.id, user.name, `Mission '${mission.title}' deleted`, "warning")
      toast({
        title: "Success",
        description: "Mission deleted successfully",
      })
      setMissions(getMissions())
    }
  }

  const openEditDialog = (mission: Mission) => {
    setEditingMission(mission)
    setNewMission({
      title: mission.title,
      description: mission.description,
      instructions: mission.instructions,
      priority: mission.priority,
      status: mission.status,
      assignedTo: mission.assignedTo,
      dueDate: mission.dueDate || "",
      location: mission.location || "",
    })
    setIsDialogOpen(true)
  }

  const openNewDialog = () => {
    setEditingMission(null)
    setNewMission({ title: "", description: "", instructions: "", priority: "medium", status: "pending", assignedTo: "", dueDate: "", location: "" })
    setIsDialogOpen(true)
  }

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
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallbackHref="/admin" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mission Assignments</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog}>
                  <Plus className="mr-2 w-4 h-4" />
                  New Mission
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingMission ? "Update Mission" : "New Mission"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newMission.title || ""}
                      onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                      placeholder="Mission title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={newMission.description || ""}
                      onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
                      placeholder="Brief description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instructions">Instructions *</Label>
                    <textarea
                      id="instructions"
                      value={newMission.instructions || ""}
                      onChange={(e) => setNewMission({ ...newMission, instructions: e.target.value })}
                      placeholder="Detailed instructions..."
                      className="w-full min-h-[150px] bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:ring-primary focus:border-primary"
                      rows={8}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="assignedTo">Assign To *</Label>
                      <Select value={newMission.assignedTo || ""} onValueChange={(value) => setNewMission({ ...newMission, assignedTo: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name} ({u.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={newMission.priority || "medium"} onValueChange={(value) => setNewMission({ ...newMission, priority: value as any })}>
                        <SelectTrigger>
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
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={newMission.status || "pending"} onValueChange={(value) => setNewMission({ ...newMission, status: value as any })}>
                        <SelectTrigger>
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
                    <div>
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newMission.dueDate || ""}
                        onChange={(e) => setNewMission({ ...newMission, dueDate: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="location">Location</Label>
                      <Select value={newMission.location || ""} onValueChange={(value) => setNewMission({ ...newMission, location: value })}>
                        <SelectTrigger>
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
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveMission}>
                      {editingMission ? "Update" : "Create"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">Assign and track security missions and tasks</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search missions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Missions List */}
        <Card className="bg-card border-border shadow-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {filteredMissions.map((mission) => (
              <div key={mission.id} className="p-6 hover:bg-muted/30 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`uppercase text-[10px] font-black ${priorityColors[mission.priority]}`}>
                        {mission.priority}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[mission.status]}`}>
                        {mission.status.replace("_", " ").toUpperCase()}
                      </Badge>
                      <h3 className="font-bold text-lg">{mission.title}</h3>
                    </div>
                    {mission.description && (
                      <p className="text-sm text-muted-foreground mb-3">{mission.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
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
                          <Clock className="w-3 h-3" />
                          Due: {new Date(mission.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="bg-background/50 border border-border/50 p-4 rounded text-sm font-mono leading-relaxed whitespace-pre-wrap">
                      {mission.instructions}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openEditDialog(mission)}
                    >
                      <Edit className="w-4 h-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteMission(mission.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredMissions.length === 0 && (
              <div className="p-12 text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No missions found</p>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
