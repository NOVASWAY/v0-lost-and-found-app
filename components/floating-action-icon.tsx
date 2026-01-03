"use client"

import Link from "next/link"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingActionIconProps {
  href: string
  icon: LucideIcon
  label: string
  color?: "primary" | "accent" | "success" | "warning" | "info"
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  delay?: number
}

export function FloatingActionIcon({
  href,
  icon: Icon,
  label,
  color = "primary",
  position = "bottom-right",
  delay = 0,
}: FloatingActionIconProps) {
  const colorClasses = {
    primary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20",
    accent: "bg-accent hover:bg-accent/90 text-accent-foreground shadow-accent/20",
    success: "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20",
    warning: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20",
    info: "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20",
  }

  const positionClasses = {
    "bottom-right": "bottom-16 right-4 sm:bottom-6 sm:right-6",
    "bottom-left": "bottom-16 left-4 sm:bottom-6 sm:left-6",
    "top-right": "top-20 right-4 sm:top-6 sm:right-6",
    "top-left": "top-20 left-4 sm:top-6 sm:left-6",
  }

  return (
    <Link
      href={href}
      className={cn(
        "fixed z-40 flex items-center gap-2 sm:gap-3 rounded-full px-3 py-2.5 sm:px-4 sm:py-3 shadow-2xl transition-all duration-300",
        "hover:scale-110 hover:shadow-3xl animate-float text-sm sm:text-base min-h-[44px] min-w-[44px]",
        colorClasses[color],
        positionClasses[position]
      )}
      style={{
        animationDelay: `${delay}ms`,
      }}
      title={label}
    >
      <Icon className="h-5 w-5" />
      <span className="hidden sm:inline-block font-semibold text-sm">{label}</span>
    </Link>
  )
}

