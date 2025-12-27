"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, CheckCircle } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { mockClaims, mockItems, mockUsers, type Claim } from "@/lib/mock-data"
import { useToast } from "@/hooks/use-toast"

interface ClaimModalProps {
  itemId: string
  itemName: string
}

export function ClaimModal({ itemId, itemName }: ClaimModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [proofImage, setProofImage] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [notes, setNotes] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProofImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = () => {
    if (!proofImage || !user) {
      toast({
        title: "Missing Information",
        description: "Please upload a proof photo.",
        variant: "destructive",
      })
      return
    }

    // Check if item exists and is available
    const item = mockItems.find((i) => i.id === itemId)
    if (!item) {
      toast({
        title: "Item Not Found",
        description: "The item you're trying to claim doesn't exist.",
        variant: "destructive",
      })
      return
    }

    if (item.status !== "available") {
      toast({
        title: "Item Not Available",
        description: "This item is no longer available for claiming.",
        variant: "destructive",
      })
      return
    }

    // Create new claim
    const newClaim: Claim = {
      id: `c${Date.now()}`,
      itemId: itemId,
      itemName: itemName,
      itemImage: item.imageUrl,
      proofImage: proofImage,
      claimantName: user.name,
      claimantEmail: user.username + "@vault.church", // Using username as email base
      status: "pending",
      claimedAt: new Date().toISOString(),
    }

    // Add to mockClaims
    mockClaims.push(newClaim)

    // Update item status
    item.status = "claimed"

    // Update user stats
    const userIndex = mockUsers.findIndex((u) => u.id === user.id)
    if (userIndex !== -1) {
      mockUsers[userIndex].claimsSubmitted += 1
      mockUsers[userIndex].vaultPoints += 25 // Award points for claiming
      if (!mockUsers[userIndex].claimedItems) {
        mockUsers[userIndex].claimedItems = []
      }
      mockUsers[userIndex].claimedItems.push({
        itemId: itemId,
        itemName: itemName,
        claimStatus: "pending",
        claimedAt: newClaim.claimedAt,
      })
    }

    toast({
      title: "Claim Submitted",
      description: "Your claim has been submitted and will be reviewed by a volunteer.",
    })

    setIsSubmitted(true)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">
          Claim This Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        {!isSubmitted ? (
          <>
            <DialogHeader>
              <DialogTitle>Claim Item: {itemName}</DialogTitle>
              <DialogDescription>
                Upload a photo proving ownership to submit your claim. This will be reviewed by our release volunteers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Proof Photo Upload */}
              <div className="space-y-2">
                <Label htmlFor="proof-photo">Upload Proof Photo *</Label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 bg-transparent"
                      onClick={() => document.getElementById("proof-upload")?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {proofImage ? "Change Photo" : "Upload Photo"}
                    </Button>
                    <input
                      id="proof-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {proofImage && <span className="text-sm text-muted-foreground">Photo uploaded</span>}
                  </div>
                  {proofImage && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                      <Image src={proofImage || "/placeholder.svg"} alt="Proof" fill className="object-cover" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload a photo that proves this item belongs to you (purchase receipt, similar angle, identifying
                  marks, etc.)
                </p>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Provide any additional details that help verify ownership..."
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button onClick={handleSubmit} disabled={!proofImage} className="w-full">
                Submit Claim
              </Button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-accent" />
            <DialogTitle className="mb-2 text-2xl">Claim Submitted!</DialogTitle>
            <DialogDescription className="mb-6">
              Your claim has been submitted successfully. A release volunteer will review your proof photo and contact
              you for pickup.
            </DialogDescription>
            <Button onClick={() => setIsSubmitted(false)}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
