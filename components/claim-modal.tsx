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
import { claimsApi, uploadImage, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface ClaimModalProps {
  itemId: string
  itemName: string
}

const MAX_PROOF_SIZE = 5 * 1024 * 1024 // 5MB (matches server-side limit)

export function ClaimModal({ itemId, itemName }: ClaimModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [proofImage, setProofImage] = useState<string | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notes, setNotes] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file.",
        variant: "destructive",
      })
      return
    }

    if (file.size > MAX_PROOF_SIZE) {
      toast({
        title: "File Too Large",
        description: "Proof photo must be less than 5MB.",
        variant: "destructive",
      })
      return
    }

    // Keep the real file for upload, and a local preview URL for display only.
    setProofFile(file)
    setProofImage(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!proofFile || !user) {
      toast({
        title: "Missing Information",
        description: "Please upload a proof photo.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Upload the proof to Blob storage first (magic-byte verified server-side),
      // then submit the claim with the public URL — avoids large base64 payloads
      // in the database and the previous 5000-char proof limit.
      const proofUrl = await uploadImage(proofFile)

      await claimsApi.create({
        itemId,
        proofImage: proofUrl,
        notes: notes.trim() || undefined,
      })

      toast({
        title: "Claim Submitted",
        description: "Your claim has been submitted and will be reviewed by a volunteer.",
      })

      setIsSubmitted(true)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to submit claim"
      toast({
        title: "Claim Failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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

              <Button onClick={handleSubmit} disabled={!proofImage || isSubmitting} className="w-full">
                {isSubmitting ? "Submitting..." : "Submit Claim"}
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
