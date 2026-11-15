"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Activity,
  Lock,
  Fingerprint,
  Eye,
  ShieldCheck,
  BookOpen,
  Package,
  FileText,
  Settings,
  Gift,
  MapPin,
  Users,
  Calendar,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usersApi, auditLogsApi, ApiError, type UserListItem } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { VaultBackground } from "@/components/vault-background"
import { cn } from "@/lib/utils"

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserListItem[]>([])
  const [auditCount, setAuditCount] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    Promise.all([usersApi.getAll(), auditLogsApi.getAll({ limit: 1 })])
      .then(([usersRes, logsRes]) => {
        setUsers(usersRes.users)
        setAuditCount(logsRes.pagination?.total ?? 0)
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load stats"
        toast({ title: "Error", description: message, variant: "destructive" })
      })
      .finally(() => setIsLoaded(true))
  }, [toast])

  const activeUsers = users.length
  const totalUploads = users.reduce((sum, u) => sum + (u.itemsUploaded || 0), 0)
  const totalClaims = users.reduce((sum, u) => sum + (u.claimsSubmitted || 0), 0)

  // Protect route - require authentication and admin role
  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      router.push("/login")
      return
    }
    if (isLoaded && user?.role !== "admin") {
      router.push("/dashboard")
      return
    }
  }, [isLoaded, isAuthenticated, user, router])

  // Show loading while checking auth or fetching data
  if (!isLoaded || !isAuthenticated || user?.role !== "admin") {
    return (
      <VaultBackground intensity="cinematic">
        <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
          <div className="mb-6 sm:mb-8 space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded-xl" />
            <div className="h-4 w-80 bg-muted animate-pulse rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 w-full bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </main>
      </VaultBackground>
    )
  }

  return (
    <VaultBackground intensity="cinematic" className="text-foreground font-sans selection:bg-primary/30">
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-7xl animate-in fade-in duration-700 pb-24 sm:pb-10">
        <div className="mb-8 sm:mb-12 border-b border-border/50 pb-6 sm:pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 animate-slide-up">
          <div>
            <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-primary/10 p-2 sm:p-3 rounded-xl border border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.15)]">
                <ShieldCheck className="w-7 h-7 sm:w-10 sm:h-10 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tighter uppercase italic">Security Command Center</h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl font-medium">
              Vault Church high-security asset management. Authorization level:{" "}
              <span className="text-primary font-bold">SUPERUSER</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 animate-slide-up delay-1">
            <Link href="/admin/audit-logs">
              <Button
                variant="outline"
                className="border-border hover:bg-muted font-bold tracking-tight bg-transparent glass"
              >
                <Eye className="mr-2 w-4 h-4" />
                Audit Logs
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button className="font-black tracking-tight hover:scale-105 transition-transform gradient">
                <Users className="mr-2 w-4 h-4" />
                Manage Users
              </Button>
            </Link>
          </div>
        </div>

        {/* Security Matrix Overview */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8 sm:mb-12">
          {[
            { label: "Active Nodes", value: activeUsers, icon: Activity, color: "text-blue-500" },
            { label: "Secure Vaults", value: totalUploads, icon: Lock, color: "text-amber-500" },
            { label: "Verified Claims", value: totalClaims, icon: Fingerprint, color: "text-emerald-500" },
            { label: "Audit Logs", value: auditCount >= 1000 ? `${(auditCount / 1000).toFixed(1)}k` : auditCount, icon: Eye, color: "text-purple-500" },
          ].map((stat, i) => (
            <Card
              key={i}
              className={cn(
                "bg-card border-border hover:border-primary/50 transition-all p-4 sm:p-6 relative overflow-hidden group glass-card",
              )}
            >
              <div
                className="absolute top-0 right-0 p-2 sm:p-4 opacity-10 group-hover:opacity-20 transition-opacity animate-float-gentle"
                style={{
                  animationDelay: `${i * 200}ms`,
                  animationDuration: "4s",
                }}
              >
                <stat.icon className={`w-8 h-8 sm:w-12 sm:h-12 ${stat.color}`} />
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl sm:text-3xl font-black">{stat.value}</h3>
            </Card>
          ))}
        </div>

        {/* Quick Navigation */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/users">
            <Card className="group cursor-pointer p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 glass-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">User Management</h3>
                  <p className="text-sm text-muted-foreground">Manage users & permissions</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/items">
            <Card className="group cursor-pointer p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 glass-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 transition-all duration-300 group-hover:bg-blue-500/20 group-hover:scale-110">
                  <Package className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Items</h3>
                  <p className="text-sm text-muted-foreground">Manage all items</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/claims">
            <Card className="group cursor-pointer p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 glass-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 transition-all duration-300 group-hover:bg-emerald-500/20 group-hover:scale-110">
                  <FileText className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Claims</h3>
                  <p className="text-sm text-muted-foreground">Review & manage claims</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/locations">
            <Card className="group cursor-pointer p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 glass-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 transition-all duration-300 group-hover:bg-purple-500/20 group-hover:scale-110">
                  <MapPin className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Locations</h3>
                  <p className="text-sm text-muted-foreground">Manage locations</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/releases">
            <Card className="group cursor-pointer p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 glass-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 transition-all duration-300 group-hover:bg-amber-500/20 group-hover:scale-110">
                  <ShieldCheck className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Release Logs</h3>
                  <p className="text-sm text-muted-foreground">View release history</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/donations">
            <Card className="group cursor-pointer p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 glass-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 transition-all duration-300 group-hover:bg-red-500/20 group-hover:scale-110">
                  <Gift className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Donations</h3>
                  <p className="text-sm text-muted-foreground">Manage donation queue</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/audit-logs">
            <Card className="group cursor-pointer p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 glass-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 transition-all duration-300 group-hover:bg-indigo-500/20 group-hover:scale-110">
                  <Eye className="h-6 w-6 text-indigo-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Audit Logs</h3>
                  <p className="text-sm text-muted-foreground">View system activity</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/playbooks">
            <Card className="group cursor-pointer p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 glass-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 transition-all duration-300 group-hover:bg-orange-500/20 group-hover:scale-110">
                  <BookOpen className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Playbooks</h3>
                  <p className="text-sm text-muted-foreground">Manage security protocols</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/missions">
            <Card className="group cursor-pointer p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 glass-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 transition-all duration-300 group-hover:bg-cyan-500/20 group-hover:scale-110">
                  <Activity className="h-6 w-6 text-cyan-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Missions</h3>
                  <p className="text-sm text-muted-foreground">Assign & track missions</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/meeting-minutes">
            <Card className="group cursor-pointer p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 glass-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 transition-all duration-300 group-hover:bg-teal-500/20 group-hover:scale-110">
                  <Calendar className="h-6 w-6 text-teal-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Meeting Minutes</h3>
                  <p className="text-sm text-muted-foreground">Record & manage minutes</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/occurrence-book">
            <Card className="group cursor-pointer p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 glass-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 transition-all duration-300 group-hover:bg-pink-500/20 group-hover:scale-110">
                  <FileText className="h-6 w-6 text-pink-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Occurrence Book</h3>
                  <p className="text-sm text-muted-foreground">Security occurrence log</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/settings">
            <Card className="group cursor-pointer p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 glass-card">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-500/10 transition-all duration-300 group-hover:bg-slate-500/20 group-hover:scale-110">
                  <Settings className="h-6 w-6 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Settings</h3>
                  <p className="text-sm text-muted-foreground">System configuration</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </main>
    </VaultBackground>
  )
}