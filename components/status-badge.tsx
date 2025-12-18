interface StatusBadgeProps {
  status: "available" | "claimed" | "released" | "donated" | "pending" | "expired"
  className?: string
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const styles = {
    available: "bg-accent/10 text-accent",
    claimed: "bg-chart-2/10 text-chart-2",
    released: "bg-primary/10 text-primary",
    donated: "bg-muted text-muted-foreground",
    pending: "bg-chart-4/10 text-chart-4",
    expired: "bg-destructive/10 text-destructive",
  }

  const labels = {
    available: "Available",
    claimed: "Claimed",
    released: "Released",
    donated: "Donated",
    pending: "Pending",
    expired: "Expired",
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]} ${className}`}
    >
      {labels[status]}
    </span>
  )
}
