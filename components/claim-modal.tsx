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
import { Upload, CheckCircle, ImageIcon, XIcon } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { claimsApi, uploadImage, deleteUpload, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface ClaimModalProps {
  itemId: string
  itemName: string
}

const MAX_PROOF_SIZE = 5 * 1024 * 1024

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

    setProofFile(file)
    setProofImage(URL.createObjectURL(file))
  }

  const removeProof = () => {
    if (proofImage) {
      URL.revokeObjectURL(proofImage)
    }
    setProofImage(null)
    setProofFile(null)
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
    let proofUrl: string | null = null
    try {
      proofUrl = await uploadImage(proofFile)

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
      if (proofUrl) {
        await deleteUpload(proofUrl)
      }
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
        <Button size="lg" className="w-full gradient">
          Claim This Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl" size="lg">
        {!isSubmitted ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-4">
                Claim Item
                <span className="text-sm font-normal text-muted-foreground">{itemName}</span>
              </DialogTitle>
              <DialogDescription>
                Upload a photo proving ownership to submit your claim. This will be reviewed by our release volunteers.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-2">
              {/* Proof Photo Upload */}
              <div className="space-y-3">
                <Label htmlFor="proof-photo">Proof Photo <span className="text-destructive">*</span></Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
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
                    {proofImage && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Photo uploaded
                      </span>
                    )}
                  </div>
                  {proofImage && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/50 glass-card">
                      <Image src={proofImage} alt="Proof" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={removeProof}
                        className="absolute top-2 right-2 glass rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity"
                        aria-label="Remove proof photo"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
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

              <Button
                onClick={handleSubmit}
                disabled={!proofImage || isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? "Submitting..." : "Submit Claim"}
              </Button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center animate-scale-in">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center animate-scale-in">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogTitle className="mb-2 text-2xl">Claim Submitted!</DialogTitle>
            <DialogDescription className="mb-6 max-w-sm mx-auto">
              Your claim has been submitted successfully. A release volunteer will review your proof photo and contact
              you for pickup.
            </DialogDescription>
            <Button variant="outline" onClick={() => setIsSubmitted(false)} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}