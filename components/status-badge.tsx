interface StatusBadgeProps {
  status: "available" | "claimed" | "released" | "donated" | "pending" | "expired" | "rejected" | "approved"
  className?: string
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const styles = {
    available: "bg-accent/15 text-accent shadow-lg shadow-accent/20 ring-1 ring-accent/30",
    claimed: "bg-chart-2/15 text-chart-2 shadow-lg shadow-chart-2/20 ring-1 ring-chart-2/30",
    released: "bg-primary/15 text-primary shadow-lg shadow-primary/20 ring-1 ring-primary/30",
    donated: "bg-muted/50 text-muted-foreground ring-1 ring-border",
    pending: "bg-chart-4/15 text-chart-4 shadow-lg shadow-chart-4/20 ring-1 ring-chart-4/30 animate-glow-pulse",
    expired: "bg-destructive/15 text-destructive shadow-lg shadow-destructive/20 ring-1 ring-destructive/30",
    rejected: "bg-destructive/15 text-destructive shadow-lg shadow-destructive/20 ring-1 ring-destructive/30",
    approved: "bg-green-500/15 text-green-600 shadow-lg shadow-green-500/20 ring-1 ring-green-500/30",
  }

  const labels = {
    available: "Available",
    claimed: "Claimed",
    released: "Released",
    donated: "Donated",
    pending: "Pending",
    expired: "Expired",
    rejected: "Rejected",
    approved: "Approved",
  }

  const dotColors = {
    available: "bg-accent",
    claimed: "bg-chart-2",
    released: "bg-primary",
    donated: "bg-muted-foreground",
    pending: "bg-chart-4 animate-pulse",
    expired: "bg-destructive",
    rejected: "bg-destructive",
    approved: "bg-green-600",
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${styles[status]} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status]}`} />
      {labels[status]}
    </span>
  )
}
