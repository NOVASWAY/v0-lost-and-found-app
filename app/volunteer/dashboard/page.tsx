"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { claimsApi, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { VaultBackground } from "@/components/vault-background"

export default function VolunteerDashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [pendingClaims, setPendingClaims] = useState<any[]>([])
  const [approvedClaims, setApprovedClaims] = useState<any[]>([])
  const [releasedClaims, setReleasedClaims] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      claimsApi.getAll({ status: "pending", limit: 100 }),
      claimsApi.getAll({ status: "approved", limit: 100 }),
      claimsApi.getAll({ status: "released", limit: 100 }),
    ])
      .then(([pendingRes, approvedRes, releasedRes]) => {
        setPendingClaims(pendingRes.claims)
        setApprovedClaims(approvedRes.claims)
        setReleasedClaims(releasedRes.claims)
      })
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load claims"
        toast({ title: "Error", description: message, variant: "destructive" })
      })
      .finally(() => setIsLoaded(true))
  }, [toast])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "volunteer") {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== "volunteer") {
    return null
  }

  const visibleClaims = activeTab === "pending" ? pendingClaims : approvedClaims

  const filteredClaims = visibleClaims.filter((claim) => {
    const searchLower = searchQuery.toLowerCase()
    return claim.itemName.toLowerCase().includes(searchLower) || claim.claimantName.toLowerCase().includes(searchLower)
  })

  const releasedToday = releasedClaims.filter((claim) => {
    if (!claim.releasedAt) return false
    const today = new Date().toDateString()
    return new Date(claim.releasedAt).toDateString() === today
  }).length

  const releasedThisWeek = releasedClaims.filter((claim) => {
    if (!claim.releasedAt) return false
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return new Date(claim.releasedAt).getTime() > weekAgo
  }).length

  return (
    <VaultBackground>
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">Release Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Review claims and release items to verified claimants</p>
        </div>

        {/* Search */}
        <Card className="mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by item or claimant name..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{pendingClaims.length}</p>
            <p className="text-sm text-muted-foreground">Pending Claims</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{approvedClaims.length}</p>
            <p className="text-sm text-muted-foreground">Approved</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{releasedToday}</p>
            <p className="text-sm text-muted-foreground">Released Today</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{releasedThisWeek}</p>
            <p className="text-sm text-muted-foreground">Total This Week</p>
          </Card>
        </div>

        {/* Status Tabs */}
        <div className="mb-4 flex gap-2">
          <Button
            variant={activeTab === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("pending")}
          >
            Pending ({pendingClaims.length})
          </Button>
          <Button
            variant={activeTab === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("approved")}
          >
            Approved ({approvedClaims.length})
          </Button>
        </div>

        {/* Releases Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Found Item</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground hidden sm:table-cell">Proof Photo</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Claimant</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground hidden sm:table-cell">Claim Date</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => {
                  const daysAgo = Math.floor((Date.now() - new Date(claim.claimedAt).getTime()) / (1000 * 60 * 60 * 24))

                  return (
                    <tr key={claim.id} className="border-b border-border last:border-0">
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="relative h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-lg border border-border">
                            <Image
                              src={claim.item?.imageUrl || claim.itemImage || "/placeholder.svg"}
                              alt={claim.itemName}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-sm sm:text-base text-card-foreground">{claim.itemName}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">ID: {claim.itemId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 hidden sm:table-cell">
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                          <Image
                            src={claim.proofImage || "/placeholder.svg"}
                            alt="Proof"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <p className="font-medium text-sm sm:text-base text-card-foreground">{claim.claimantName}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                          {claim.claimant?.username ? `@${claim.claimant.username}` : "Username unavailable"}
                        </p>
                      </td>
                      <td className="p-3 sm:p-4 hidden sm:table-cell">
                        <p className="text-xs sm:text-sm text-muted-foreground">{daysAgo} days ago</p>
                      </td>
                      <td className="p-3 sm:p-4">
                        <Link href={`/volunteer/release/${claim.id}`}>
                          <Button size="sm" className="min-h-[36px] min-w-[100px] text-xs sm:text-sm">
                            {activeTab === "approved" ? "Review & Release" : "Review & Release"}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

                  {filteredClaims.length === 0 && (
                    <div className="p-12 text-center">
                      <p className="text-muted-foreground">
                        {isLoaded
                          ? activeTab === "pending"
                            ? "No pending claims to review"
                            : "No approved claims awaiting release"
                          : "Loading claims..."}
                      </p>
                    </div>
                  )}
        </Card>
      </main>
    </VaultBackground>
  )
}
