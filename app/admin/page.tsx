"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import { mockUsers, type User } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"

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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      <Navbar role="admin" />

      <main className="container mx-auto px-6 py-10 max-w-7xl animate-in fade-in duration-700">
        <div className="mb-12 border-b border-border/50 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.1)]">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic">Security Command Center</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl font-medium">
              Vault Church high-security asset management. Authorization level:{" "}
              <span className="text-primary font-bold">SUPERUSER</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-border hover:bg-muted font-bold tracking-tight bg-transparent">
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {[
            { label: "Active Nodes", value: activeUsers, icon: Activity, color: "text-blue-500" },
            { label: "Secure Vaults", value: totalUploads, icon: Lock, color: "text-amber-500" },
            { label: "Verified Claims", value: totalClaims, icon: Fingerprint, color: "text-emerald-500" },
            { label: "Audit Logs", value: "2.4k", icon: Eye, color: "text-purple-500" },
          ].map((stat, i) => (
            <Card
              key={i}
              className="bg-card border-border hover:border-primary/50 transition-all p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <stat.icon className="w-12 h-12" />
              </div>
              <p className="text-sm text-muted-foreground font-medium mb-1 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-3xl font-bold">{stat.value}</h3>
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
                              <p className="text-xs text-muted-foreground">{u.email}</p>
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
                          <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                            <span className="flex items-center gap-1">
                              <Upload className="w-3 h-3" /> {u.itemsUploaded}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileCheck className="w-3 h-3" /> {u.claimsSubmitted}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                {[
                  { user: "Sarah J.", event: "Asset Claim Filed", time: "4m ago", icon: FileCheck },
                  {
                    user: "Michael C.",
                    event: "Failed Release Attempt",
                    time: "12m ago",
                    icon: ShieldAlert,
                    alert: true,
                  },
                  { user: "Admin", event: "Node Initialized", time: "1h ago", icon: Zap },
                ].map((log, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div
                      className={`p-2 rounded-md ${log.alert ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}`}
                    >
                      <log.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{log.user}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight">{log.event}</p>
                      <p className="text-[10px] text-primary/60 font-mono mt-1">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Existing dialogs updated with security theme */}
      {/* ... existing dialogs ... */}
    </div>
  )
}
