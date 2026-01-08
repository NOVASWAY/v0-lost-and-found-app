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
import { type User } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { getUsers, initializeStorage } from "@/lib/storage"

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [users] = useState<User[]>(getUsers())

  useEffect(() => {
    initializeStorage()
  }, [])

  const activeUsers = users.filter((u) => u.id !== "deactivated").length
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

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
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
            <Link href="/admin/audit-logs">
              <Button
                variant="outline"
                className="border-border hover:bg-muted font-bold tracking-tight bg-transparent"
              >
                <Eye className="mr-2 w-4 h-4" />
                Audit Logs
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button className="bg-primary text-primary-foreground font-black tracking-tight hover:scale-105 transition-transform">
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

        {/* Quick Navigation */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/users">
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
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
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
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
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 transition-colors group-hover:bg-green-500/20">
                  <FileText className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Claims</h3>
                  <p className="text-sm text-muted-foreground">Review & manage claims</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/locations">
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 transition-colors group-hover:bg-purple-500/20">
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
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 transition-colors group-hover:bg-amber-500/20">
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
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-500/10 transition-colors group-hover:bg-red-500/20">
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
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 transition-colors group-hover:bg-indigo-500/20">
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
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 transition-colors group-hover:bg-orange-500/20">
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
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 transition-colors group-hover:bg-cyan-500/20">
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
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-500/10 transition-colors group-hover:bg-teal-500/20">
                  <Calendar className="h-6 w-6 text-teal-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Meeting Minutes</h3>
                  <p className="text-sm text-muted-foreground">Record & manage minutes</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/admin/settings">
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-500/10 transition-colors group-hover:bg-slate-500/20">
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
    </div>
  )
}
