"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Error Boundary]", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-card-foreground">Something went wrong</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          An unexpected error occurred. Please try again or contact an administrator if the problem persists.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} className="w-full sm:w-auto">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")} className="w-full sm:w-auto">
            Go Home
          </Button>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
        )}
      </Card>
    </div>
  )
}
