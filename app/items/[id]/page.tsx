"use client"

import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { CountdownTimer } from "@/components/countdown-timer"
import { ClaimModal } from "@/components/claim-modal"
import { MapPin, Calendar, Tag, Info } from "lucide-react"
import Image from "next/image"
import { mockItems } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()

  const item = mockItems.find((i) => i.id === params.id)

  if (!item) {
    return <div>Item not found</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar role={user?.role || "user"} />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image Section */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="relative aspect-square bg-muted">
                <Image src={item.imageUrl || "/placeholder.svg"} alt={item.category} fill className="object-cover" />
              </div>
            </Card>
            <p className="text-sm text-muted-foreground">Uploaded by {item.uploadedBy}</p>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <div className="mb-4 flex items-start justify-between">
                <h1 className="text-3xl font-bold text-foreground">{item.category}</h1>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-lg text-muted-foreground">{item.color}</p>
            </div>

            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-card-foreground">Item Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Date Found</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.dateFounded).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Location Found</p>
                    <p className="text-sm text-muted-foreground">{item.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Tag className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Category</p>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                </div>
                {item.description && (
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">Description</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                )}
                {item.uniqueMarkings && (
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-card-foreground">Unique Markings</p>
                      <p className="text-sm text-muted-foreground">{item.uniqueMarkings}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {item.status === "available" && item.donationDeadline && (
              <Card className="border-accent/50 bg-accent/5 p-6">
                <h3 className="mb-2 font-semibold text-card-foreground">Donation Countdown</h3>
                <CountdownTimer targetDate={new Date(item.donationDeadline)} className="text-base" />
                <p className="mt-2 text-sm text-muted-foreground">
                  This item will be donated if not claimed before the deadline.
                </p>
              </Card>
            )}

            {item.status === "available" && <ClaimModal itemId={item.id} itemName={item.category} />}
          </div>
        </div>
      </main>
    </div>
  )
}
