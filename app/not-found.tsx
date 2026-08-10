import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileQuestion } from "lucide-react"

export const metadata: Metadata = {
  title: "Page Not Found | Vault Church",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-card-foreground">Page Not Found</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button className="w-full sm:w-auto">Go Home</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="w-full sm:w-auto">
              Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
