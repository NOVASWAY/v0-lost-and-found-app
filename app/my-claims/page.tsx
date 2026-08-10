"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { claimsApi, ApiError } from "@/lib/api-client"
import { BackButton } from "@/components/back-button"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export default function MyClaimsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [claims, setClaims] = useState<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    claimsApi
      .getAll({ claimantId: user.id })
      .then((res) => setClaims(res.claims))
      .catch((err) => {
        const message = err instanceof ApiError ? err.message : "Failed to load claims"
        toast({ title: "Error", description: message, variant: "destructive" })
      })
      .finally(() => setIsLoaded(true))
  }, [user, toast])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated || !user) {
    return null
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
          <div className="mb-8 space-y-2">
            <div className="h-8 w-40 bg-muted animate-pulse rounded" />
            <div className="h-4 w-72 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 w-full bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallbackHref="/dashboard" />
          </div>
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">My Claims</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track the status of your submitted claims</p>
        </div>

        <div className="space-y-4">
          {claims.map((claim) => (
            <Card key={claim.id} className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3 sm:gap-4">
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={claim.itemImage || "/placeholder.svg"}
                      alt={claim.itemName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                      <h3 className="text-base sm:text-lg font-semibold text-card-foreground break-words">{claim.itemName}</h3>
                      <StatusBadge status={claim.status} />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Claimed on {new Date(claim.claimedAt).toLocaleDateString()}
                    </p>
                    {claim.releasedAt && (
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Released on {new Date(claim.releasedAt).toLocaleDateString()}
                      </p>
                    )}
                    {claim.releaseNotes && (
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground break-words">Notes: {claim.releaseNotes}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col">
                  <Link href={`/items/${claim.itemId}`}>
                    <Button variant="outline" size="sm" className="w-full bg-transparent min-h-[36px]">
                      View Item
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}

          {claims.length === 0 && (
            <Card className="p-12 text-center">
              <p className="mb-4 text-muted-foreground">You haven&apos;t submitted any claims yet</p>
              <Link href="/browse">
                <Button>Browse Items</Button>
              </Link>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
