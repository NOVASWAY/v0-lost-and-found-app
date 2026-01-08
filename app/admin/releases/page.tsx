"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, FileText } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getReleaseLogs, initializeStorage } from "@/lib/storage"
import { BackButton } from "@/components/back-button"

export default function AdminReleasesPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [releaseLogs, setReleaseLogs] = useState(getReleaseLogs())

  useEffect(() => {
    initializeStorage()
    setReleaseLogs(getReleaseLogs())
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

  const filteredReleases = releaseLogs.filter((release) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      release.itemName.toLowerCase().includes(searchLower) ||
      release.volunteerName.toLowerCase().includes(searchLower) ||
      release.claimantName.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-8 pb-24 sm:pb-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallbackHref="/admin" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-foreground">Release Logs</h1>
          <p className="text-muted-foreground">
            Immutable record of all item releases for transparency and accountability
          </p>
        </div>

        {/* Search */}
        <Card className="mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by volunteer or claimant..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{releaseLogs.length}</p>
            <p className="text-sm text-muted-foreground">Total Releases</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">
              {
                releaseLogs.filter((r) => {
                  const daysDiff = Math.floor((Date.now() - new Date(r.timestamp).getTime()) / (1000 * 60 * 60 * 24))
                  return daysDiff <= 7
                }).length
              }
            </p>
            <p className="text-sm text-muted-foreground">This Week</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">
              {
                releaseLogs.filter((r) => {
                  const daysDiff = Math.floor((Date.now() - new Date(r.timestamp).getTime()) / (1000 * 60 * 60 * 24))
                  return daysDiff <= 30
                }).length
              }
            </p>
            <p className="text-sm text-muted-foreground">This Month</p>
          </Card>
        </div>

        {/* Release Logs Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Item</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Claimant</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Volunteer</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Release Date</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredReleases.map((release) => (
                  <tr key={release.id} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium text-card-foreground">{release.itemName}</td>
                    <td className="p-4 text-sm text-muted-foreground">{release.claimantName}</td>
                    <td className="p-4 text-sm text-muted-foreground">{release.volunteerName}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(release.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <span className="line-clamp-1">{release.notes}</span>
                      </div>
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
