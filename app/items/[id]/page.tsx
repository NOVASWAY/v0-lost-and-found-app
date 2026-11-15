"use client"

import { useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { CountdownTimer } from "@/components/countdown-timer"
import { ClaimModal } from "@/components/claim-modal"
import { MapPin, Calendar, Tag, Info, ArrowLeft } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { itemsApi, ApiError, type Item } from "@/lib/api-client"
import { BackButton } from "@/components/back-button"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { VaultBackground } from "@/components/vault-background"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { id } = use(params)
  const [item, setItem] = useState<Item | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    itemsApi
      .getById(id)
      .then((res) => setItem(res.item))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          const message = err instanceof ApiError ? err.message : "Failed to load item"
          toast({ title: "Error", description: message, variant: "destructive" })
        }
      })
      .finally(() => setIsLoaded(true))
  }, [id, toast])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  if (!isLoaded) {
    return (
      <VaultBackground>
        <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
          <div className="mb-6 h-10 w-32 bg-muted animate-pulse rounded-xl" />
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="aspect-square rounded-2xl bg-muted animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 w-48 bg-muted animate-pulse rounded-xl" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded-xl" />
              <div className="h-40 w-full bg-muted animate-pulse rounded-xl" />
            </div>
          </div>
        </main>
      </VaultBackground>
    )
  }

  if (notFound || !item) {
    return (
      <VaultBackground>
        <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
          <div className="mb-6 animate-slide-up">
            <BackButton fallbackHref="/browse" />
          </div>
          <Card className="p-12 text-center glass-card animate-scale-in">
            <p className="mb-4 text-muted-foreground">Item not found</p>
            <BackButton fallbackHref="/browse" />
          </Card>
        </main>
      </VaultBackground>
    )
  }

  return (
    <VaultBackground>
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 animate-slide-up">
          <BackButton fallbackHref="/browse" />
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image Section */}
          <div className="space-y-4">
            <Card className="overflow-hidden glass-card">
              <div className="relative aspect-square bg-muted">
                <Image src={item.imageUrl || "/placeholder.svg"} alt={`${item.category} lost item photo`} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              </div>
            </Card>
            <p className="text-sm text-muted-foreground">Reported by a Vault Church member</p>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <div className="mb-4 flex items-start justify-between gap-3">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground break-words">{item.category}</h1>
                <StatusBadge status={item.status} size="lg" />
              </div>
              <p className="text-base sm:text-lg text-muted-foreground">{item.color}</p>
            </div>

            <Card className="p-4 sm:p-6 glass-card">
              <h2 className="mb-4 text-base sm:text-lg font-semibold text-card-foreground">Item Details</h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10", "text-primary")}>
                    <Calendar className="h-5 w-5" />
                  </div>
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
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10", "text-primary")}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Location Found</p>
                    <p className="text-sm text-muted-foreground">{item.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10", "text-primary")}>
                    <Tag className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Category</p>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                </div>
                {item.description && (
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10", "text-primary")}>
                      <Info className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">Description</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                )}
                {item.uniqueMarkings && (
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10", "text-accent")}>
                      <Info className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">Unique Markings</p>
                      <p className="text-sm text-muted-foreground">{item.uniqueMarkings}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {item.status === "available" && item.donationDeadline && (
              <Card className="border-accent/30 bg-accent/5 p-6 glass-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-card-foreground">Donation Countdown</h3>
                </div>
                <CountdownTimer targetDate={new Date(item.donationDeadline)} size="lg" className="text-lg" />
                <p className="mt-3 text-sm text-muted-foreground">
                  This item will be donated if not claimed before the deadline.
                </p>
              </Card>
            )}

            {item.status === "available" && <ClaimModal itemId={item.id} itemName={item.category} />}
          </div>
        </div>
      </main>
    </VaultBackground>
  )
}