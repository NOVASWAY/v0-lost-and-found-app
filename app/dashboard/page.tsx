"use client"

import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { mockItems, mockClaims, mockPlaybooks } from "@/lib/mock-data"

export default function DashboardPage() {
  const { user } = useAuth()

  const userUploads = mockItems.filter((item) => item.uploadedBy === user?.name)
  const userClaims = mockClaims.filter((claim) => claim.claimantName === user?.name)
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
            {/* Security Orders */}
            {/* ... existing orders code ... */}

            <div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Situational Playbooks
              </h2>
              <div className="grid gap-4">
                {mockPlaybooks.map((pb) => (
                  <Card key={pb.id} className="p-4 hover:border-primary/50 transition-all group cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded bg-muted group-hover:bg-primary/10 transition-colors`}>
                          <ShieldAlert
                            className={`w-4 h-4 ${pb.priority === "critical" ? "text-destructive" : "text-primary"}`}
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{pb.title}</h4>
                          <p className="text-xs text-muted-foreground">{pb.scenario}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </Card>
                ))}
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
