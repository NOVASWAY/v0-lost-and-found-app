"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, Search, Clock, Users, MapPin } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { missionsApi, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export default function MissionsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [missions, setMissions] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    missionsApi
      .getAll()
      .then((res) => setMissions(res.missions))
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load missions"
        toast({ title: "Error", description: message, variant: "destructive" })
      })
  }, [toast])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const isStaff = user?.role === "admin" || user?.role === "volunteer"

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/50",
    in_progress: "bg-blue-500/20 text-blue-600 border-blue-500/50",
    completed: "bg-green-500/20 text-green-600 border-green-500/50",
    cancelled: "bg-gray-500/20 text-gray-600 border-gray-500/50",
  }

  const priorityColors: Record<string, string> = {
    critical: "bg-destructive",
    high: "bg-amber-600",
    medium: "bg-primary",
    low: "bg-muted",
  }

  // Staff see all missions; regular users only ever get missions assigned to them.
  const missionsToShow = isStaff ? missions : missions

  const filteredMissions = missionsToShow.filter((mission) => {
    const matchesSearch =
      mission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mission.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || mission.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStartMission = async (mission: any) => {
    try {
      await missionsApi.update(mission.id, { status: "in_progress" })
      setMissions((prev) => prev.map((m) => (m.id === mission.id ? { ...m, status: "in_progress" } : m)))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update mission"
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

  const handleCompleteMission = async (mission: any) => {
    try {
      await missionsApi.update(mission.id, { status: "completed" })
      setMissions((prev) => prev.map((m) => (m.id === mission.id ? { ...m, status: "completed" } : m)))
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update mission"
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">Mission Assignments</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View and manage your assigned missions
          </p>
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

        {/* Missions Grid */}
        <div className="grid gap-4">
          {filteredMissions.map((mission) => (
            <Card key={mission.id} className="p-6 hover:border-primary/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge className={`uppercase text-[10px] font-black ${priorityColors[mission.priority]}`}>
                      {mission.priority}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[mission.status]}`}>
                      {mission.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <h3 className="font-bold text-lg">{mission.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{mission.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                    {isStaff && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Assigned to: {mission.assignedToUser?.name || "Unknown"}
                      </span>
                    )}
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
                  {mission.status !== "completed" && mission.status !== "cancelled" && (
                    <div className="flex gap-2 mt-3">
                      {mission.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => handleStartMission(mission)}>
                          Start Mission
                        </Button>
                      )}
                      {mission.status === "in_progress" && (
                        <Button size="sm" onClick={() => handleCompleteMission(mission)}>
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-background/50 border border-border/50 p-4 rounded text-sm font-mono leading-relaxed whitespace-pre-wrap">
                {mission.instructions}
              </div>
            </Card>
          ))}
          {filteredMissions.length === 0 && (
            <Card className="p-12 text-center">
              <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No missions found</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
