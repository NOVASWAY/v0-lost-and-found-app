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
  status: "available" | "claimed" | "released" | "donated" | "expired"
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
    <Link href={`/items/${id}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 border-border/50 hover:border-primary/30 backdrop-blur-sm bg-card/50 hover:bg-card/80 cursor-pointer">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          {/* Shimmer overlay on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className="absolute inset-0 animate-shimmer" />
          </div>
          
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={category}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-card-foreground group-hover:text-primary transition-colors duration-300 truncate">
                {category}
              </h3>
              {color && (
                <p className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300 truncate">
                  {color}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              <StatusBadge status={status} />
            </div>
          </div>
          
          <div className="space-y-1.5 text-sm">
            <p className="text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
              <span className="font-medium">Found:</span> {daysAgo} {daysAgo === 1 ? "day" : "days"} ago
            </p>
            <p className="text-xs text-muted-foreground group-hover:text-foreground/60 transition-colors duration-300 truncate">
              📍 {location}
            </p>
          </div>
          
          {status === "available" && donationDeadline && (
            <div className="mb-2">
              <CountdownTimer targetDate={donationDeadline} />
            </div>
          )}
          
          <Button 
            className="w-full font-semibold shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105 origin-bottom" 
            variant={status === "available" ? "default" : "outline"}
          >
            {status === "available" ? "View & Claim" : "View Details"}
          </Button>
        </div>
      </Card>
    </Link>
  )
}
