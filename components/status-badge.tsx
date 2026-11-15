"use client"

interface StatusBadgeProps {
  status:
    | "available"
    | "claimed"
    | "released"
    | "donated"
    | "pending"
    | "expired"
    | "rejected"
    | "approved"
  className?: string
  size?: "sm" | "default" | "lg"
  showDot?: boolean
}

export function StatusBadge({
  status,
  className = "",
  size = "default",
  showDot = true,
}: StatusBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    default: "px-3 py-1 text-xs gap-1.5",
    lg: "px-4 py-1.5 text-sm gap-2",
  }

  const dotSizes = {
    sm: "w-1 h-1",
    default: "w-1.5 h-1.5",
    lg: "w-2 h-2",
  }

  const styles = {
    available:
      "bg-accent/10 text-accent border-accent/20 ring-1 ring-accent/20 hover:bg-accent/15",
    claimed:
      "bg-chart-2/10 text-chart-2 border-chart-2/20 ring-1 ring-chart-2/20 hover:bg-chart-2/15",
    released:
      "bg-primary/10 text-primary border-primary/20 ring-1 ring-primary/20 hover:bg-primary/15",
    donated:
      "bg-muted/50 text-muted-foreground border-border/50 ring-1 ring-border/30 hover:bg-muted",
    pending:
      "bg-chart-4/10 text-chart-4 border-chart-4/20 ring-1 ring-chart-4/20 hover:bg-chart-4/15 animate-glow",
    expired:
      "bg-destructive/10 text-destructive border-destructive/20 ring-1 ring-destructive/20 hover:bg-destructive/15",
    rejected:
      "bg-destructive/10 text-destructive border-destructive/20 ring-1 ring-destructive/20 hover:bg-destructive/15",
    approved:
      "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 ring-1 ring-emerald-500/20 hover:bg-emerald-500/15",
  }

  const dotColors = {
    available: "bg-accent",
    claimed: "bg-chart-2",
    released: "bg-primary",
    donated: "bg-muted-foreground",
    pending: "bg-chart-4 animate-pulse",
    expired: "bg-destructive",
    rejected: "bg-destructive",
    approved: "bg-emerald-600",
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

  return (
    <span
      className={`
        inline-flex items-center font-bold uppercase tracking-wider rounded-full border
        backdrop-blur-sm transition-all duration-200 hover:shadow-lg
        ${sizeClasses[size]}
        ${styles[status]}
        ${className}
      `}
    >
      {showDot && (
        <span className={`rounded-full ${dotSizes[size]} ${dotColors[status]}`} />
      )}
      {labels[status]}
    </span>
  )
}