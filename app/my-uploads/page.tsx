"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { CountdownTimer } from "@/components/countdown-timer"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { getItems, initializeStorage } from "@/lib/storage"
import { BackButton } from "@/components/back-button"
import { useState } from "react"

export default function MyUploadsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState(getItems())

  useEffect(() => {
    initializeStorage()
    setItems(getItems())
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const userUploads = items.filter((item) => item.uploadedBy === user?.name)

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallbackHref="/dashboard" />
          </div>
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">My Uploads</h1>
          <p className="text-muted-foreground">Items you've found and uploaded to the system</p>
        </div>

        <div className="space-y-4">
          {userUploads.map((upload) => {
            const daysAgo = Math.floor((Date.now() - new Date(upload.dateFounded).getTime()) / (1000 * 60 * 60 * 24))

            return (
              <Card key={upload.id} className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border">
                      <Image
                        src={upload.imageUrl || "/placeholder.svg"}
                        alt={upload.category}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-card-foreground">{upload.category}</h3>
                        <StatusBadge status={upload.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">Uploaded {daysAgo} days ago</p>
                      <p className="text-sm text-muted-foreground">Location: {upload.location}</p>
                      {upload.status === "available" && upload.donationDeadline && (
                        <div className="mt-2">
                          <CountdownTimer targetDate={new Date(upload.donationDeadline)} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/items/${upload.id}`}>
                      <Button variant="outline" size="sm">
                        View Item
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}

          {userUploads.length === 0 && (
            <Card className="p-12 text-center">
              <p className="mb-4 text-muted-foreground">You haven't uploaded any items yet</p>
              <Link href="/upload">
                <Button>Upload Found Item</Button>
              </Link>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
