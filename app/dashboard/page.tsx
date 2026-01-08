"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Upload,
  Search,
  Package,
  Clock,
  MessageSquare,
  BookOpen,
  Trophy,
  Star,
  TrendingUp,
  Activity,
  CheckCircle,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getItems, getClaims, initializeStorage } from "@/lib/storage"

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState(getItems())
  const [claims, setClaims] = useState(getClaims())

  useEffect(() => {
    initializeStorage()
    setItems(getItems())
    setClaims(getClaims())
  }, [])

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
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">Welcome Back, {user?.name || "User"}!</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Here's your Lost & Found activity summary</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 sm:mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

          <Link href="/my-uploads">
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
                  <Package className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">My Uploads</h3>
                  <p className="text-sm text-muted-foreground">View items you've uploaded</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/my-claims">
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10 transition-colors group-hover:bg-green-500/20">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">My Claims</h3>
                  <p className="text-sm text-muted-foreground">Track your item claims</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/missions">
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10 transition-colors group-hover:bg-purple-500/20">
                  <Activity className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Missions</h3>
                  <p className="text-sm text-muted-foreground">View and manage assignments</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/playbooks">
            <Card className="group cursor-pointer p-6 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 transition-colors group-hover:bg-amber-500/20">
                  <BookOpen className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Playbooks</h3>
                  <p className="text-sm text-muted-foreground">Security protocols & procedures</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/orders">
            <Card className={`group cursor-pointer p-6 transition-shadow hover:shadow-md ${unreadOrders.length > 0 ? "border-primary/50 bg-primary/5" : ""}`}>
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${unreadOrders.length > 0 ? "bg-primary/20 group-hover:bg-primary/30" : "bg-slate-500/10 group-hover:bg-slate-500/20"}`}>
                  <MessageSquare className={`h-6 w-6 ${unreadOrders.length > 0 ? "text-primary" : "text-slate-500"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-card-foreground">Security Orders</h3>
                    {unreadOrders.length > 0 && (
                      <Badge className="bg-primary text-primary-foreground">{unreadOrders.length} New</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">View important directives</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Stats Widgets */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
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
              <CheckCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-card-foreground">{releasedItems.length}</p>
            <p className="text-sm text-muted-foreground">Items Received</p>
          </Card>
        </div>

        {/* Progress Widgets */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                <span>{Math.max(0, 1000 - (user?.vaultPoints || 0))} pts to Gold</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-1000"
                  style={{ width: `${Math.min(100, ((user?.vaultPoints || 0) / 1000) * 100)}%` }}
                />
              </div>
            </div>
          </Card>

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
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full w-full bg-primary" />
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
