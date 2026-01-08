"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CountdownTimer } from "@/components/countdown-timer"
import { Clock, AlertCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { getItems, initializeStorage } from "@/lib/storage"
import { useState } from "react"

export default function AdminDonationsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState(getItems())

  useEffect(() => {
    initializeStorage()
    setItems(getItems())
  }, [])

  // Protect route - require authentication and admin role
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    if (user?.role !== "admin") {
      router.push("/dashboard")
      return
    }
  }, [isAuthenticated, user, router])

  // Show nothing while checking authentication
  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  const expiringItems = items
    .filter((item) => {
      if (item.status !== "available" || !item.donationDeadline) return false
      const daysUntilDonation = Math.floor(
        (new Date(item.donationDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
      return daysUntilDonation <= 7 && daysUntilDonation >= 0
    })
    .sort((a, b) => new Date(a.donationDeadline!).getTime() - new Date(b.donationDeadline!).getTime())

  const expiring48Hours = expiringItems.filter((item) => {
    const hoursUntil = (new Date(item.donationDeadline!).getTime() - Date.now()) / (1000 * 60 * 60)
    return hoursUntil <= 48
  }).length

  const donatedItems = items.filter((item) => item.status === "donated")

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Donation Queue</h1>
          <p className="text-muted-foreground">Monitor items approaching their donation deadline</p>
        </div>

        {/* Alert */}
        <Card className="mb-6 border-chart-4/50 bg-chart-4/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-chart-4" />
            <div>
              <h3 className="font-semibold text-card-foreground">Donation Policy</h3>
              <p className="text-sm text-muted-foreground">
                Items unclaimed after 30 days are automatically marked for donation. This page shows items expiring
                within the next 7 days.
              </p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{donatedItems.length}</p>
            <p className="text-sm text-muted-foreground">Items Donated (Total)</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{expiringItems.length}</p>
            <p className="text-sm text-muted-foreground">Expiring This Week</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{expiring48Hours}</p>
            <p className="text-sm text-muted-foreground">Expiring in 48 Hours</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">
              {items.filter((item) => item.status === "available").length}
            </p>
            <p className="text-sm text-muted-foreground">Available Items</p>
          </Card>
        </div>

        {/* Expiring Items */}
        <Card>
          <div className="border-b border-border bg-muted/50 p-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-card-foreground">
              <Clock className="h-5 w-5" />
              Items Approaching Donation Deadline
            </h2>
          </div>
          {expiringItems.length > 0 ? (
            <div className="divide-y divide-border">
              {expiringItems.map((item) => {
                const daysAgo = Math.floor((Date.now() - new Date(item.dateFounded).getTime()) / (1000 * 60 * 60 * 24))

                return (
                  <div key={item.id} className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border">
                        <Image
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.category}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground">{item.category}</h3>
                        <p className="text-sm text-muted-foreground">{item.color}</p>
                        <p className="text-sm text-muted-foreground">Found at {item.location}</p>
                        <p className="text-xs text-muted-foreground">Uploaded by {item.uploadedBy}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <CountdownTimer targetDate={new Date(item.donationDeadline!)} />
                        <p className="mt-1 text-xs text-muted-foreground">Found {daysAgo} days ago</p>
                      </div>
                      <Link href={`/items/${item.id}`}>
                        <Button variant="outline" size="sm">
                          View Item
                        </Button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No items expiring in the next 7 days</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
