"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/status-badge"
import { Search } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { getClaims, initializeStorage } from "@/lib/storage"
import { BackButton } from "@/components/back-button"

export default function AdminClaimsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [claims, setClaims] = useState(getClaims())

  useEffect(() => {
    initializeStorage()
    setClaims(getClaims())
  }, [])

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

  const filteredClaims = claims.filter((claim) => {
    const searchLower = searchQuery.toLowerCase()
    return claim.itemName.toLowerCase().includes(searchLower) || claim.claimantName.toLowerCase().includes(searchLower)
  })

  const pendingCount = claims.filter((c) => c.status === "pending").length
  const releasedCount = claims.filter((c) => c.status === "released").length

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallbackHref="/admin" />
          </div>
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">Claims Overview</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Monitor all claims submitted by users</p>
        </div>

        {/* Search */}
        <Card className="mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by item or claimant..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* Stats */}
        <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
          <Card className="p-4 sm:p-6">
            <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{claims.length}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Total Claims</p>
          </Card>
          <Card className="p-4 sm:p-6">
            <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{pendingCount}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
          </Card>
          <Card className="p-4 sm:p-6">
            <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{releasedCount}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Released</p>
          </Card>
          <Card className="p-4 sm:p-6">
            <p className="text-2xl sm:text-3xl font-bold text-card-foreground">0</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Rejected</p>
          </Card>
        </div>

        {/* Claims Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Item</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Claimant</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground hidden sm:table-cell">Claim Date</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Status</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="border-b border-border last:border-0">
                    <td className="p-3 sm:p-4 font-medium text-sm sm:text-base text-card-foreground">{claim.itemName}</td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground">{claim.claimantName}</td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">
                      {new Date(claim.claimedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 sm:p-4">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="p-3 sm:p-4">
                      <Link href={`/items/${claim.itemId}`}>
                        <Button size="sm" variant="ghost" className="min-h-[36px] min-w-[60px]">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  )
}
