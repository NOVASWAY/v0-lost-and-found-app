"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ReleaseItemPage({ params }: { params: { id: string } }) {
  const [notes, setNotes] = useState("")
  const [isReleased, setIsReleased] = useState(false)

  const claim = {
    id: params.id,
    itemImage: "/black-leather-wallet.jpg",
    proofImage: "/wallet-purchase-receipt.jpg",
    itemName: "Wallet",
    category: "Wallet",
    color: "Black Leather",
    location: "Main Sanctuary",
    dateFound: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    claimantName: "Sarah Johnson",
    claimantEmail: "sarah.j@example.com",
    ticketCode: "CLM-2024-001",
    claimDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    claimNotes:
      "This is my wallet. I lost it after Sunday service. The receipt shows I purchased it from a local store.",
  }

  const handleRelease = () => {
    // Handle release action
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
              {claim.ticketCode}
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
              <div>
                <Label className="text-muted-foreground">Category</Label>
                <p className="text-card-foreground">{claim.category}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Color/Description</Label>
                <p className="text-card-foreground">{claim.color}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Location Found</Label>
                <p className="text-card-foreground">{claim.location}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date Found</Label>
                <p className="text-card-foreground">
                  {claim.dateFound.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
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
                  {claim.claimDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Claimant's Notes</Label>
                <p className="text-card-foreground">{claim.claimNotes}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Release Form */}
        <Card className="mt-6 p-6">
          <h2 className="mb-4 text-xl font-semibold text-card-foreground">Release Item</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="release-notes">Release Notes (Optional)</Label>
              <Textarea
                id="release-notes"
                placeholder="Add any notes about the release process, ID verification, etc..."
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
          </div>
        </Card>
      </main>
    </div>
  )
}
