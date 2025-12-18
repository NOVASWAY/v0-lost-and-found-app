import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { CountdownTimer } from "@/components/countdown-timer"

interface ItemCardProps {
  id: string
  imageUrl: string
  category: string
  color?: string
  dateFound: Date
  location: string
  status: "available" | "claimed" | "released" | "donated"
  donationDeadline?: Date
}

export function ItemCard({
  id,
  imageUrl,
  category,
  color,
  dateFound,
  location,
  status,
  donationDeadline,
}: ItemCardProps) {
  const daysAgo = Math.floor((new Date().getTime() - dateFound.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={category}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-card-foreground">{category}</h3>
            {color && <p className="text-sm text-muted-foreground">{color}</p>}
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="mb-3 space-y-1 text-sm text-muted-foreground">
          <p>
            Found {daysAgo} {daysAgo === 1 ? "day" : "days"} ago
          </p>
          <p className="text-xs">{location}</p>
        </div>
        {status === "available" && donationDeadline && (
          <div className="mb-3">
            <CountdownTimer targetDate={donationDeadline} />
          </div>
        )}
        <Link href={`/items/${id}`}>
          <Button className="w-full" variant={status === "available" ? "default" : "outline"}>
            {status === "available" ? "View & Claim" : "View Details"}
          </Button>
        </Link>
      </div>
    </Card>
  )
}
