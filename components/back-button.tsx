"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface BackButtonProps {
  fallbackHref?: string
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function BackButton({ 
  fallbackHref, 
  className = "",
  variant = "ghost",
  size = "default"
}: BackButtonProps) {
  const router = useRouter()
  const { user } = useAuth()

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      // Fallback to dashboard or provided href
      const defaultHref = fallbackHref || 
        (user?.role === "admin" ? "/admin" : 
         user?.role === "volunteer" ? "/volunteer/dashboard" : 
         "/dashboard")
      router.push(defaultHref)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={`gap-2 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">Back</span>
    </Button>
  )
}

