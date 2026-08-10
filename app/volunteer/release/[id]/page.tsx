"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { BackButton } from "@/components/back-button"
import { claimsApi, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export default function ReleaseItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [notes, setNotes] = useState("")
  const [isReleased, setIsReleased] = useState(false)
  const [claim, setClaim] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { id } = use(params)

  useEffect(() => {
    claimsApi
      .getById(id)
      .then((res) => setClaim(res.claim))
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load claim"
        toast({ title: "Error", description: message, variant: "destructive" })
      })
      .finally(() => setIsLoaded(true))
  }, [id, toast])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "volunteer") {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== "volunteer") {
    return null
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 pb-24 sm:pb-8">
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Loading claim...</p>
            <BackButton fallbackHref="/volunteer/dashboard" />
          </Card>
        </main>
      </div>
    )
  }

  if (!claim) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Claim not found</p>
            <BackButton fallbackHref="/volunteer/dashboard" />
          </Card>
        </main>
      </div>
    )
  }

  const item = claim.item

  const handleRelease = async () => {
    if (!user || !item || !claim) return

    setIsSubmitting(true)
    try {
      await claimsApi.update(claim.id, {
        status: "released",
        releaseNotes: notes || undefined,
      })
      setClaim({ ...claim, status: "released" })
      toast({
        title: "Item Released",
        description: `The item has been successfully released to ${claim.claimantName}.`,
      })
      setIsReleased(true)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to release item"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!user || !item || !claim) return

    setIsSubmitting(true)
    try {
      await claimsApi.update(claim.id, {
        status: "rejected",
        releaseNotes: notes || "Claim rejected",
      })
      setClaim({ ...claim, status: "rejected" })
      toast({
        title: "Claim Rejected",
        description: `The claim has been rejected and the item is now available again.`,
        variant: "destructive",
      })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to reject claim"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isReleased) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
          <Card className="max-w-md p-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-accent" />
            <h1 className="mb-2 text-2xl font-bold text-card-foreground">Item Released!</h1>
            <p className="mb-6 text-muted-foreground">
              The item has been successfully released to {claim.claimantName}. The release has been logged in the
              system.
            </p>
            <BackButton fallbackHref="/volunteer/dashboard" className="w-full" />
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-8 pb-24 sm:pb-8">
        <div className="mb-6">
          <BackButton fallbackHref="/volunteer/dashboard" />
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">Review & Release</h1>
            <Badge variant="outline" className="font-mono">
              {claim.id}
            </Badge>
          </div>
          <p className="text-muted-foreground">Verify the claimant&apos;s identity and proof before releasing the item</p>
        </div>

        {/* Photo Comparison */}
        <Card className="mb-6 p-6">
          <h2 className="mb-4 text-xl font-semibold text-card-foreground">Photo Comparison</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label className="mb-2 block text-sm font-medium">Found Item Photo</Label>
              <div className="relative aspect-square overflow-hidden rounded-lg border border-border">
                <Image src={item?.imageUrl || claim.itemImage || "/placeholder.svg"} alt="Found item" fill className="object-cover" />
              </div>
            </div>
            <div>
              <Label className="mb-2 block text-sm font-medium">Claimant&apos;s Proof Photo</Label>
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
            {claim.status === "pending" ? "Review Claim" : "Claim Status"}
          </h2>
          <div className="space-y-4">
            {claim.status === "pending" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="review-notes">Release / Review Notes (Optional)</Label>
                  <Textarea
                    id="review-notes"
                    placeholder="Add any notes about your review or the release..."
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleRelease} size="lg" className="flex-1" disabled={isSubmitting}>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Release Item
                  </Button>
                  <Button onClick={handleReject} size="lg" variant="destructive" className="flex-1" disabled={isSubmitting}>
                    Reject Claim
                  </Button>
                </div>
              </>
            )}
            {(claim.status === "rejected" || claim.status === "released") && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">
                  {claim.status === "rejected" ? "This claim has been rejected." : "This item has been released."}
                </p>
                <div className="mt-4">
                  <BackButton fallbackHref="/volunteer/dashboard" variant="outline" className="w-full" />
                </div>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
