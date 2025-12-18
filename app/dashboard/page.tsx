"use client"

import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Upload, Search, Package, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { mockItems, mockClaims } from "@/lib/mock-data"

export default function DashboardPage() {
  const { user } = useAuth()

  const userUploads = mockItems.filter((item) => item.uploadedBy === user?.name)
  const userClaims = mockClaims.filter((claim) => claim.claimantName === user?.name)
  const pendingClaims = userClaims.filter((claim) => claim.status === "pending")
  const releasedItems = userClaims.filter((claim) => claim.status === "released")

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
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3">
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
              {userUploads.length === 0 && <p className="text-center text-sm text-muted-foreground">No uploads yet</p>}
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
                <div key={claim.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-medium text-card-foreground">{claim.itemName}</p>
                    <p className="text-sm text-muted-foreground capitalize">{claim.status}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              ))}
              {userClaims.length === 0 && <p className="text-center text-sm text-muted-foreground">No active claims</p>}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
