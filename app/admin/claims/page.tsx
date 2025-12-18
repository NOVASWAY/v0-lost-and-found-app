"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/status-badge"
import { Search } from "lucide-react"
import Link from "next/link"
import { mockClaims } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"

export default function AdminClaimsPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredClaims = mockClaims.filter((claim) => {
    const searchLower = searchQuery.toLowerCase()
    return claim.itemName.toLowerCase().includes(searchLower) || claim.claimantName.toLowerCase().includes(searchLower)
  })

  const pendingCount = mockClaims.filter((c) => c.status === "pending").length
  const releasedCount = mockClaims.filter((c) => c.status === "released").length

  return (
    <div className="min-h-screen bg-background">
      <Navbar role={user?.role || "admin"} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Claims Overview</h1>
          <p className="text-muted-foreground">Monitor all claims submitted by users</p>
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
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{mockClaims.length}</p>
            <p className="text-sm text-muted-foreground">Total Claims</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{releasedCount}</p>
            <p className="text-sm text-muted-foreground">Released</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">0</p>
            <p className="text-sm text-muted-foreground">Rejected</p>
          </Card>
        </div>

        {/* Claims Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Item</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Claimant</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Claim Date</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium text-card-foreground">{claim.itemName}</td>
                    <td className="p-4 text-sm text-muted-foreground">{claim.claimantName}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(claim.claimedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="p-4">
                      <Link href={`/items/${claim.itemId}`}>
                        <Button size="sm" variant="ghost">
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
