"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { type ReleaseLog } from "@/lib/mock-data"
import { getClaims, getItems, getUsers, addReleaseLog, updateClaim, updateItem, updateUser, initializeStorage } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { addAuditLog } from "@/lib/audit-logger"

export default function ReleaseItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [notes, setNotes] = useState("")
  const [isReleased, setIsReleased] = useState(false)
  const [claims, setClaims] = useState(getClaims())
  const [items, setItems] = useState(getItems())
  const { id } = use(params)

  useEffect(() => {
    initializeStorage()
    setClaims(getClaims())
    setItems(getItems())
  }, [])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "volunteer") {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  const claim = claims.find((c) => c.id === id)

  if (!isAuthenticated || user?.role !== "volunteer") {
    return null
  }

  if (!claim) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar role="volunteer" />
        <main className="container mx-auto px-4 py-8">
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Claim not found</p>
            <Link href="/volunteer/dashboard">
              <Button className="mt-4">Back to Dashboard</Button>
            </Link>
          </Card>
        </main>
      </div>
    )
  }

  const item = items.find((i) => i.id === claim.itemId)

  const handleApprove = () => {
    if (!user || !item || !claim) return

    // Update claim status to approved
    updateClaim(claim.id, {
      status: "approved",
      releasedBy: `Volunteer: ${user.name}`,
      releasedAt: new Date().toISOString(),
      releaseNotes: notes || undefined,
    })

    // Add audit log
    addAuditLog("item_claimed", "Claim approved", user.id, user.name, `Claim for ${claim.itemName} approved by ${user.name}`, "info")

    toast({
      title: "Claim Approved",
      description: `The claim has been approved. You can now release the item.`,
    })

    // Refresh data
    setClaims(getClaims())
    setItems(getItems())
  }

  const handleReject = () => {
    if (!user || !item || !claim) return

    // Update claim status to rejected
    updateClaim(claim.id, {
      status: "rejected",
      releasedBy: `Volunteer: ${user.name}`,
      releasedAt: new Date().toISOString(),
      releaseNotes: notes || "Claim rejected",
    })

    // Update item status back to available
    updateItem(claim.itemId, { status: "available" })

    // Update user stats (claimant) - remove points
    const users = getUsers()
    const claimant = users.find((u) => u.name === claim.claimantName)
    if (claimant) {
      const currentClaimedItems = claimant.claimedItems || []
      const claimItem = currentClaimedItems.find((ci) => ci.itemId === claim.itemId)
      if (claimItem) {
        claimItem.claimStatus = "rejected"
      }
      updateUser(claimant.id, {
        claimedItems: currentClaimedItems,
      })
    }

    // Add audit log
    addAuditLog("item_claimed", "Claim rejected", user.id, user.name, `Claim for ${claim.itemName} rejected by ${user.name}`, "warning")

    toast({
      title: "Claim Rejected",
      description: `The claim has been rejected and the item is now available again.`,
      variant: "destructive",
    })

    setIsReleased(true)
  }

  const handleRelease = () => {
    if (!user || !item || !claim) return

    // Only allow release if claim is approved
    if (claim.status !== "approved") {
      toast({
        title: "Claim Not Approved",
        description: "Please approve the claim before releasing the item.",
        variant: "destructive",
      })
      return
    }

    // Update claim status
    updateClaim(claim.id, {
      status: "released",
      releasedBy: `Volunteer: ${user.name}`,
      releasedAt: new Date().toISOString(),
      releaseNotes: notes || undefined,
    })

    // Update item status
    updateItem(claim.itemId, { status: "released" })

    // Create release log
    const releaseLog: ReleaseLog = {
      id: `r${Date.now()}`,
      itemId: claim.itemId,
      itemName: claim.itemName,
      claimantName: claim.claimantName,
      volunteerName: user.name,
      timestamp: new Date().toISOString(),
      notes: notes || "Item released to claimant",
    }
    addReleaseLog(releaseLog)

    // Update user stats (claimant) - find by name
    const users = getUsers()
    const claimant = users.find((u) => u.name === claim.claimantName)
    if (claimant) {
      const currentClaimedItems = claimant.claimedItems || []
      const claimItem = currentClaimedItems.find((ci) => ci.itemId === claim.itemId)
      if (claimItem) {
        claimItem.claimStatus = "released"
      }
      updateUser(claimant.id, {
        vaultPoints: claimant.vaultPoints + 100, // Award points for successful claim
        claimedItems: currentClaimedItems,
      })
    }

    // Add audit log
    addAuditLog("item_released", "Item released", user.id, user.name, `${claim.itemName} released to ${claim.claimantName}`, "info")

    toast({
      title: "Item Released",
      description: `The item has been successfully released to ${claim.claimantName}.`,
    })

    setIsReleased(true)
  }

  if (isReleased) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar role="volunteer" />
        <main className="container mx-auto flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
          <Card className="max-w-md p-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-accent" />
            <h1 className="mb-2 text-2xl font-bold text-card-foreground">Item Released!</h1>
            <p className="mb-6 text-muted-foreground">
              The item has been successfully released to {claim.claimantName}. The release has been logged in the
              system.
            </p>
            <Link href="/volunteer/dashboard">
              <Button className="w-full">Back to Dashboard</Button>
            </Link>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role="volunteer" />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/volunteer/dashboard">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Review & Release</h1>
            <Badge variant="outline" className="font-mono">
              {claim.id}
            </Badge>
          </div>
          <p className="text-muted-foreground">Verify the claimant's identity and proof before releasing the item</p>
        </div>

        {/* Photo Comparison */}
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-xl font-semibold text-card-foreground">Photo Comparison</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label className="mb-2 block text-sm font-medium">Found Item Photo</Label>
              <div className="relative aspect-square overflow-hidden rounded-lg border border-border">
                <Image src={claim.itemImage || "/placeholder.svg"} alt="Found item" fill className="object-cover" />
              </div>
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium">Claimant's Proof Photo</Label>
              <div className="relative aspect-square overflow-hidden rounded-lg border border-border">
                <Image src={claim.proofImage || "/placeholder.svg"} alt="Proof photo" fill className="object-cover" />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Item Details */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-card-foreground">Item Details</h2>
            <div className="space-y-3">
              {item && (
                <>
                  <div>
                    <Label className="text-muted-foreground">Category</Label>
                    <p className="text-card-foreground">{item.category}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Color/Description</Label>
                    <p className="text-card-foreground">{item.color}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Location Found</Label>
                    <p className="text-card-foreground">{item.location}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Date Found</Label>
                    <p className="text-card-foreground">
                      {new Date(item.dateFounded).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Claimant Information */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold text-card-foreground">Claimant Information</h2>
            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="text-card-foreground">{claim.claimantName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-card-foreground">{claim.claimantEmail}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Claim Date</Label>
                <p className="text-card-foreground">
                  {new Date(claim.claimedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Release Form */}
        <Card className="mt-6 p-6">
          <h2 className="mb-4 text-xl font-semibold text-card-foreground">
            {claim.status === "pending" ? "Review Claim" : claim.status === "approved" ? "Release Item" : "Claim Status"}
          </h2>
          <div className="space-y-4">
            {claim.status === "pending" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="review-notes">Review Notes (Optional)</Label>
                  <Textarea
                    id="review-notes"
                    placeholder="Add any notes about your review..."
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleApprove} size="lg" className="flex-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Approve Claim
                  </Button>
                  <Button onClick={handleReject} size="lg" variant="destructive" className="flex-1">
                    Reject Claim
                  </Button>
                </div>
              </>
            )}
            {claim.status === "approved" && (
              <>
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 mb-4">
                  <p className="text-sm text-green-600 font-medium">✓ Claim has been approved. You can now release the item.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="release-notes">Release Notes (Optional)</Label>
                  <Textarea
                    id="release-notes"
                    placeholder="Add any notes about the release..."
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleRelease} size="lg" className="flex-1">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Release Item to Claimant
                  </Button>
                  <Link href="/volunteer/dashboard">
                    <Button variant="outline" size="lg">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </>
            )}
            {(claim.status === "rejected" || claim.status === "released") && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  {claim.status === "rejected" ? "This claim has been rejected." : "This item has been released."}
                </p>
                <Link href="/volunteer/dashboard" className="mt-4 block">
                  <Button variant="outline" size="lg" className="w-full">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
