"use client"

import type React from "react"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, CheckCircle } from "lucide-react"
import Image from "next/image"

export default function UploadPage() {
  const [itemImage, setItemImage] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setItemImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitted(true)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar role="user" />
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
      <Navbar role="user" />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-foreground">Upload Found Item</h1>
            <p className="text-muted-foreground">
              Help someone recover their lost item by uploading a photo and details
            </p>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <Select required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="keys">Keys</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="jewelry">Jewelry</SelectItem>
                    <SelectItem value="bag">Bag/Backpack</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="book">Book</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label htmlFor="color">Primary Color</Label>
                <Input id="color" type="text" placeholder="e.g., Black, Blue, Red" />
              </div>

              {/* Location Found */}
              <div className="space-y-2">
                <Label htmlFor="location">Location Found *</Label>
                <Select required>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sanctuary">Main Sanctuary</SelectItem>
                    <SelectItem value="fellowship">Fellowship Hall</SelectItem>
                    <SelectItem value="parking">Parking Lot</SelectItem>
                    <SelectItem value="youth">Youth Room</SelectItem>
                    <SelectItem value="office">Church Office</SelectItem>
                    <SelectItem value="entrance">Main Entrance</SelectItem>
                    <SelectItem value="restroom">Restroom</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Found */}
              <div className="space-y-2">
                <Label htmlFor="date">Date Found *</Label>
                <Input id="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description / Unique Markings</Label>
                <Textarea
                  id="description"
                  placeholder="Any unique features, brands, or identifying marks..."
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={!itemImage}>
                Submit Found Item
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  )
}
