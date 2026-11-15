"use client"

import { useEffect, useState } from "react"
import { Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CountdownTimerProps {
  targetDate: Date
  className?: string
  size?: "sm" | "default" | "lg"
  showIcon?: boolean
  urgentThresholdHours?: number
}

export function CountdownTimer({
  targetDate,
  className = "",
  size = "default",
  showIcon = true,
  urgentThresholdHours = 24,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    expired: boolean
    urgent: boolean
  }>({ days: 0, hours: 0, minutes: 0, expired: false, urgent: false })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime()

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, expired: true, urgent: false }
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((difference / 1000 / 60) % 60)
      const totalHours = days * 24 + hours

      return {
        days,
        hours,
        minutes,
        expired: false,
        urgent: totalHours <= urgentThresholdHours,
      }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 60000)

    return () => clearInterval(timer)
  }, [targetDate, urgentThresholdHours])

  const sizeClasses = {
    sm: "text-xs gap-1",
    default: "text-sm gap-2",
    lg: "text-base gap-2.5",
  }

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5",
  }

  if (timeLeft.expired) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-bold uppercase tracking-wider text-xs", className)}>
        <AlertTriangle className="h-3 w-3" />
        <span>Expired</span>
      </div>
    )
  }

  const formatTime = () => {
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h`
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m`
    } else {
      return `${timeLeft.minutes}m`
    }
  }

  return (
    <div
      className={cn(
        "inline-flex items-center font-mono tabular-nums",
        sizeClasses[size],
        timeLeft.urgent && "animate-glow",
        className,
      )}
    >
      {showIcon && (
        <span className={cn(iconSizes[size], timeLeft.urgent ? "text-destructive" : "text-muted-foreground")}>
          {timeLeft.urgent ? <AlertTriangle /> : <Clock />}
        </span>
      )}
      <span className={cn("font-semibold", timeLeft.urgent ? "text-destructive" : "text-card-foreground")}>
        {formatTime()}
      </span>
      <span className="text-muted-foreground">remaining</span>
    </div>
  )
}