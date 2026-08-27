"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/status-badge"
import { Search, Check, X, ImageIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { claimsApi, ApiError } from "@/lib/api-client"
import { BackButton } from "@/components/back-button"
import { useToast } from "@/hooks/use-toast"

type ClaimTab = "all" | "pending" | "approved" | "released" | "rejected"

export default function AdminClaimsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [claims, setClaims] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSubmittingId, setIsSubmittingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ClaimTab>("all")
  const [proofViewer, setProofViewer] = useState<any>(null)

  const loadClaims = () => {
    claimsApi
      .getAll({ limit: 100 })
      .then((res) => setClaims(res.claims))
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load claims"
        toast({ title: "Error", description: message, variant: "destructive" })
      })
      .finally(() => setIsLoaded(true))
  }

  useEffect(() => {
    loadClaims()
  }, [])

  const handleAction = async (claim: any, status: string) => {
    setIsSubmittingId(claim.id)
    try {
      await claimsApi.update(claim.id, {
        status,
        releaseNotes: status === "rejected" ? "Rejected by administrator" : undefined,
      })
      const labels: Record<string, string> = {
        approved: "Claim Approved",
        released: "Item Released",
        rejected: "Claim Rejected",
      }
      const descriptions: Record<string, string> = {
        approved: "The claim is approved and the item is locked until release or rejection.",
        released: `The item has been released to ${claim.claimantName}.`,
        rejected: "The claim has been rejected and the item is available again.",
      }
      toast({
        title: labels[status] || "Updated",
        description: descriptions[status] || "Claim updated",
        variant: status === "rejected" ? "destructive" : "default",
      })
      loadClaims()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Action failed"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsSubmittingId(null)
    }
  }

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
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
          <div className="mb-6 sm:mb-8 space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-80 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 w-full bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  const tabClaims = claims.filter((claim) => (activeTab === "all" ? true : claim.status === activeTab))

  const filteredClaims = tabClaims.filter((claim) => {
    const searchLower = searchQuery.toLowerCase()
    return claim.itemName.toLowerCase().includes(searchLower) || claim.claimantName.toLowerCase().includes(searchLower)
  })

  const pendingCount = claims.filter((c) => c.status === "pending").length
  const approvedCount = claims.filter((c) => c.status === "approved").length
  const releasedCount = claims.filter((c) => c.status === "released").length
  const rejectedCount = claims.filter((c) => c.status === "rejected").length

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
            <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{approvedCount}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Approved</p>
          </Card>
          <Card className="p-4 sm:p-6">
            <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{releasedCount}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Released</p>
          </Card>
          <Card className="p-4 sm:p-6">
            <p className="text-2xl sm:text-3xl font-bold text-card-foreground">{rejectedCount}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Rejected</p>
          </Card>
        </div>

        {/* Status Tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "pending", "approved", "released", "rejected"] as ClaimTab[]).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>

        {/* Claims Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Item</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Claimant</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground hidden md:table-cell">Proof</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground hidden sm:table-cell">Claim Date</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Status</th>
                  <th className="p-3 sm:p-4 text-left text-xs sm:text-sm font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {!isLoaded && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                      Loading claims...
                    </td>
                  </tr>
                )}
                {isLoaded && filteredClaims.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                      No claims to display.
                    </td>
                  </tr>
                )}
                {isLoaded && filteredClaims.map((claim) => (
                  <tr key={claim.id} className="border-b border-border last:border-0">
                    <td className="p-3 sm:p-4 font-medium text-sm sm:text-base text-card-foreground">{claim.itemName}</td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground">{claim.claimantName}</td>
                    <td className="p-3 sm:p-4 hidden md:table-cell">
                      <button
                        type="button"
                        onClick={() => setProofViewer(claim)}
                        className="relative block h-12 w-12 overflow-hidden rounded-lg border border-border"
                        aria-label={`View proof for ${claim.itemName}`}
                      >
                        {claim.proofImage ? (
                          <Image src={claim.proofImage} alt="Proof" fill className="object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">
                      {new Date(claim.claimedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 sm:p-4">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/items/${claim.itemId}`}>
                          <Button size="sm" variant="ghost" className="min-h-[36px] min-w-[60px]">
                            View
                          </Button>
                        </Link>
                        {claim.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="min-h-[36px]"
                              onClick={() => handleAction(claim, "approved")}
                              disabled={isSubmittingId === claim.id}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="min-h-[36px]"
                              onClick={() => handleAction(claim, "rejected")}
                              disabled={isSubmittingId === claim.id}
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        {claim.status === "approved" && (
                          <>
                            <Button
                              size="sm"
                              className="min-h-[36px]"
                              onClick={() => handleAction(claim, "released")}
                              disabled={isSubmittingId === claim.id}
                            >
                              Release
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="min-h-[36px]"
                              onClick={() => handleAction(claim, "rejected")}
                              disabled={isSubmittingId === claim.id}
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      {/* Proof photo viewer */}
      {proofViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setProofViewer(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-background p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-card-foreground">{proofViewer.itemName}</p>
                <p className="text-sm text-muted-foreground">Claimed by {proofViewer.claimantName}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setProofViewer(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {proofViewer.proofImage ? (
              <div className="relative h-[60vh] w-full overflow-hidden rounded-lg bg-muted">
                <Image src={proofViewer.proofImage} alt="Claim proof" fill className="object-contain" />
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">No proof photo was submitted.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
