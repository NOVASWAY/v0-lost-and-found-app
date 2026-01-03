"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Upload,
  Search,
  Package,
  Clock,
  MessageSquare,
  AlertCircle,
  BookOpen,
  ChevronRight,
  ShieldAlert,
  Trophy,
  Star,
  TrendingUp,
  Activity,
  CheckCircle,
  Users,
  MapPin,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { mockPlaybooks } from "@/lib/mock-data"
import { getItems, getClaims, getPlaybooks, getMissionsByUser, getMissions, initializeStorage, updateMission } from "@/lib/storage"
import { addAuditLog } from "@/lib/audit-logger"

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState(getItems())
  const [claims, setClaims] = useState(getClaims())
  const [playbooks, setPlaybooks] = useState(getPlaybooks())
  const [myMissions, setMyMissions] = useState(getMissionsByUser(user?.id || ""))
  const [allMissions, setAllMissions] = useState(getMissions())

  useEffect(() => {
    initializeStorage()
    setItems(getItems())
    setClaims(getClaims())
    setPlaybooks(getPlaybooks())
    setAllMissions(getMissions())
    if (user?.id) {
      setMyMissions(getMissionsByUser(user.id))
    }
  }, [user])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const userUploads = items.filter((item) => item.uploadedBy === user?.name)
  const userClaims = claims.filter((claim) => claim.claimantName === user?.name)
  const pendingClaims = userClaims.filter((claim) => claim.status === "pending")
  const releasedItems = userClaims.filter((claim) => claim.status === "released")

  const unreadOrders = user?.orders?.filter((o) => o.status === "unread") || []

  return (
    <div className="min-h-screen bg-background">
      <Navbar role={user?.role || "user"} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Welcome Back, {user?.name || "User"}!</h1>
          <p className="text-muted-foreground">Here's your Lost & Found activity summary</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Link href="/upload">
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Upload Found Item</h3>
                  <p className="text-sm text-muted-foreground">Help someone recover their belongings</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/browse">
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/20">
                  <Search className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Browse Lost Items</h3>
                  <p className="text-sm text-muted-foreground">Search for your lost belongings</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {user?.orders && user.orders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Security Orders
            </h2>
            <div className="grid gap-4">
              {user.orders.map((order) => (
                <Card
                  key={order.id}
                  className={`p-4 border-l-4 ${
                    order.priority === "high"
                      ? "border-l-destructive"
                      : order.priority === "medium"
                        ? "border-l-amber-500"
                        : "border-l-primary"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${order.status === "unread" ? "text-primary" : "text-muted-foreground"}`}>
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">{order.title}</h4>
                          {order.status === "unread" && (
                            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{order.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                          Issued: {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded bg-primary/20">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/70 italic">
                    Global Standing
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black italic tracking-tighter">#{user?.rank || "--"}</h3>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Vault Rank</span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-500">
                  <TrendingUp className="w-3 h-3" />
                  <span>Top 12% of community contributors</span>
                </div>
              </Card>

              <Card className="p-6 bg-card border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded bg-accent/10">
                    <Star className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
                    Contribution Value
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black italic tracking-tighter text-accent">{user?.vaultPoints || 0}</h3>
                  <span className="text-xs font-bold text-muted-foreground uppercase">Vault Credits</span>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                    <span>Next Reward Tier</span>
                    <span>{1000 - (user?.vaultPoints || 0)} pts to Gold</span>
                  </div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-1000"
                      style={{ width: `${((user?.vaultPoints || 0) / 1000) * 100}%` }}
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Security Orders */}
            {/* ... existing orders code ... */}

            <div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Situational Playbooks
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Read-only access to operational procedures and security protocols
              </p>
              <div className="grid gap-4">
                {playbooks.map((pb) => (
                  <Card key={pb.id} className="p-4 hover:border-primary/50 transition-all">
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
                        <h4 className="font-bold text-sm">{pb.title}</h4>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground italic mb-2">Scenario: {pb.scenario}</p>
                    <div className="bg-background/50 border border-border/50 p-3 rounded text-xs font-mono leading-relaxed">
                      {pb.protocol}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* My Missions */}
            {myMissions.length > 0 && (
              <div>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
                  <Activity className="w-5 h-5 text-primary" />
                  My Mission Assignments
                </h2>
                <div className="grid gap-4">
                  {myMissions.filter((m) => m.status !== "completed" && m.status !== "cancelled").slice(0, 3).map((mission) => {
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
                      <Card key={mission.id} className="p-4 hover:border-primary/50 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`uppercase text-[10px] font-black ${priorityColors[mission.priority]}`}>
                                {mission.priority}
                              </Badge>
                              <Badge variant="outline" className={`text-[10px] ${statusColors[mission.status]}`}>
                                {mission.status.replace("_", " ").toUpperCase()}
                              </Badge>
                              <h4 className="font-bold text-sm">{mission.title}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{mission.description}</p>
                            {mission.dueDate && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                <Clock className="w-3 h-3" />
                                Due: {new Date(mission.dueDate).toLocaleDateString()}
                              </div>
                            )}
                            <div className="flex gap-2 mt-2">
                              {mission.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    updateMission(mission.id, { status: "in_progress" })
                                    addAuditLog("mission_assigned", "Mission started", user?.id, user?.name, `Mission '${mission.title}' started`, "info")
                                    setMyMissions(getMissionsByUser(user?.id || ""))
                                    setAllMissions(getMissions())
                                  }}
                                  className="text-xs"
                                >
                                  Start Mission
                                </Button>
                              )}
                              {mission.status === "in_progress" && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    updateMission(mission.id, { 
                                      status: "completed",
                                      completedAt: new Date().toISOString()
                                    })
                                    addAuditLog("mission_completed", "Mission completed", user?.id, user?.name, `Mission '${mission.title}' completed`, "info")
                                    setMyMissions(getMissionsByUser(user?.id || ""))
                                    setAllMissions(getMissions())
                                  }}
                                  className="text-xs"
                                >
                                  Mark Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="bg-background/50 border border-border/50 p-2 rounded text-xs font-mono leading-relaxed">
                          {mission.instructions}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* All Mission Assignments - Read Only */}
            <div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Mission Assignments
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Read-only access to all active mission assignments and security tasks
              </p>
              <div className="grid gap-4">
                {allMissions.filter((m) => m.status !== "completed" && m.status !== "cancelled").map((mission) => {
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
                    <Card key={mission.id} className="p-4 hover:border-primary/50 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`uppercase text-[10px] font-black ${priorityColors[mission.priority]}`}>
                              {mission.priority}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] ${statusColors[mission.status]}`}>
                              {mission.status.replace("_", " ").toUpperCase()}
                            </Badge>
                            <h4 className="font-bold text-sm">{mission.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{mission.description}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Assigned to: {mission.assignedToName}
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
                        </div>
                      </div>
                      <div className="bg-background/50 border border-border/50 p-3 rounded text-xs font-mono leading-relaxed">
                        {mission.instructions}
                      </div>
                    </Card>
                  )
                })}
                {allMissions.filter((m) => m.status !== "completed" && m.status !== "cancelled").length === 0 && (
                  <Card className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">No active mission assignments</p>
                  </Card>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-card-foreground">Recent Uploads</h2>
                  <Link href="/my-uploads">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {userUploads.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="font-medium text-card-foreground">{item.category}</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded {new Date(item.dateFounded).toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/items/${item.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {userUploads.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">No uploads yet</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-card-foreground">My Claims</h2>
                  <Link href="/my-claims">
                    <Button variant="ghost" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {userClaims.slice(0, 2).map((claim) => (
                    <div
                      key={claim.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="font-medium text-card-foreground">{claim.itemName}</p>
                        <p className="text-sm text-muted-foreground capitalize">{claim.status}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  ))}
                  {userClaims.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">No active claims</p>
                  )}
                </div>
              </Card>
            </div>
          </div>

          <div className="space-y-8">
            {/* Stats */}
            <div className="mb-8 grid gap-4 sm:grid-cols-4">
              <Card className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold text-card-foreground">{userUploads.length}</p>
                <p className="text-sm text-muted-foreground">Items Uploaded</p>
              </Card>

              <Card className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold text-card-foreground">{userClaims.length}</p>
                <p className="text-sm text-muted-foreground">Total Claims</p>
              </Card>

              <Card className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold text-card-foreground">{pendingClaims.length}</p>
                <p className="text-sm text-muted-foreground">Pending Release</p>
              </Card>

              <Card className="p-6">
                <div className="mb-2 flex items-center justify-between">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold text-card-foreground">{releasedItems.length}</p>
                <p className="text-sm text-muted-foreground">Items Received</p>
              </Card>
            </div>

            <Card className="p-6 border-primary/20 bg-primary/5">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 italic">Security Identity</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded bg-primary flex items-center justify-center text-primary-foreground font-black text-xl italic">
                  {user?.name?.[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{user?.id}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                  <span>Clearance Status</span>
                  <span className="text-primary">Verified</span>
                </div>
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-full bg-primary" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
