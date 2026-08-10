"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, CheckCircle } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { itemsApi, locationsApi, ApiError, type Location } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { sanitizeInput, sanitizeUrl, sanitizeTextContent } from "@/lib/client-security"

export default function UploadPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [itemImage, setItemImage] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [category, setCategory] = useState("")
  const [color, setColor] = useState("")
  const [location, setLocation] = useState("")
  const [dateFound, setDateFound] = useState(new Date().toISOString().split("T")[0])
  const [description, setDescription] = useState("")
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    locationsApi
      .getAll()
      .then((res) => setLocations(res.locations))
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load locations"
        toast({ title: "Error", description: message, variant: "destructive" })
      })
      .finally(() => setIsLoaded(true))
  }, [toast])

  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoaded, isAuthenticated, router])

  if (!isLoaded || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-muted animate-pulse rounded" />
              <div className="h-4 w-80 bg-muted animate-pulse rounded" />
            </div>
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: "Please upload an image file.",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Image must be less than 5MB.",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        // Validate and sanitize the data URL
        const sanitized = sanitizeUrl(result)
        if (sanitized) {
          setItemImage(sanitized)
        } else {
          toast({
            title: "Invalid Image",
            description: "Please upload a valid image.",
            variant: "destructive",
          })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!itemImage || !category || !location || !dateFound || !user) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    // Sanitize all inputs before sending (server re-validates)
    const sanitizedImageUrl = sanitizeUrl(itemImage)
    if (!sanitizedImageUrl) {
      toast({
        title: "Invalid Image",
        description: "Please upload a valid image.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await itemsApi.create({
        imageUrl: sanitizedImageUrl,
        category: sanitizeInput(category.charAt(0).toUpperCase() + category.slice(1)),
        color: sanitizeInput(color || "Unknown"),
        location: sanitizeInput(location),
        dateFounded: new Date(dateFound).toISOString(),
        description: sanitizeTextContent(description || ""),
      })

      // Stats, donation deadline and audit logging are handled server-side.
      toast({
        title: "Item Uploaded",
        description: "Your item has been successfully added to the system.",
      })

      setIsSubmitted(true)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to upload item. Please try again."
      toast({ title: "Upload Failed", description: message, variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
          <Card className="max-w-md p-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-accent" />
            <h1 className="mb-2 text-2xl font-bold text-card-foreground">Item Uploaded!</h1>
            <p className="mb-6 text-muted-foreground">
              Thank you for helping reunite items with their owners. Your upload has been added to our database.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setIsSubmitted(false)}>
                Upload Another
              </Button>
              <Button className="flex-1" onClick={() => (window.location.href = "/browse")}>
                Browse Items
              </Button>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 sm:mb-8">
            <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">Upload Found Item</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Help someone recover their lost item by uploading a photo and details
            </p>
          </div>

          <Card className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label htmlFor="item-photo">Item Photo *</Label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 bg-transparent"
                      onClick={() => document.getElementById("item-upload")?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      {itemImage ? "Change Photo" : "Upload Photo"}
                    </Button>
                    <input
                      id="item-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                      required
                    />
                    {itemImage && <span className="text-sm text-muted-foreground">Photo uploaded</span>}
                  </div>
                  {itemImage && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                      <Image src={itemImage || "/placeholder.svg"} alt="Item" fill className="object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wallet">Wallet</SelectItem>
                    <SelectItem value="Keys">Keys</SelectItem>
                    <SelectItem value="Phone">Phone</SelectItem>
                    <SelectItem value="Clothing">Clothing</SelectItem>
                    <SelectItem value="Jewelry">Jewelry</SelectItem>
                    <SelectItem value="Backpack">Bag/Backpack</SelectItem>
                    <SelectItem value="Water Bottle">Water Bottle</SelectItem>
                    <SelectItem value="Umbrella">Umbrella</SelectItem>
                    <SelectItem value="Eyeglasses">Eyeglasses</SelectItem>
                    <SelectItem value="Watch">Watch</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Book">Book</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label htmlFor="color">Primary Color</Label>
                <Input
                  id="color"
                  type="text"
                  placeholder="e.g., Black, Blue, Red"
                  value={color}
                  onChange={(e) => setColor(sanitizeInput(e.target.value))}
                  maxLength={50}
                />
              </div>

              {/* Location Found */}
              <div className="space-y-2">
                <Label htmlFor="location">Location Found *</Label>
                <Select value={location} onValueChange={setLocation} required>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.name}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Found */}
              <div className="space-y-2">
                <Label htmlFor="date">Date Found *</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={dateFound}
                  onChange={(e) => setDateFound(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description / Unique Markings</Label>
                <Textarea
                  id="description"
                  placeholder="Any unique features, brands, or identifying marks..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(sanitizeTextContent(e.target.value))}
                  maxLength={1000}
                />
              </div>

              <Button type="submit" className="w-full" disabled={!itemImage || isSaving}>
                {isSaving ? "Uploading..." : "Submit Found Item"}
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  )
}
