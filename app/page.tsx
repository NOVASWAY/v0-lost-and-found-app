import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Search, Shield, Clock } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { mockItems } from "@/lib/mock-data"
import Image from "next/image"

export default function HomePage() {
  const recentItems = mockItems.filter((item) => item.status === "available").slice(0, 4)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill className="object-contain" priority />
            </div>
            <span className="text-xl font-semibold text-foreground">Vault Church Lost & Found</span>
          </div>
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative h-32 w-32">
              <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill className="object-contain" priority />
            </div>
          </div>
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Reuniting You With What Matters
          </h1>
          <p className="mb-10 text-pretty text-lg text-muted-foreground md:text-xl">
            A transparent, photo-based system to help the Vault Church community recover lost items with integrity and
            trust.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/upload">
              <Button size="lg" className="w-full sm:w-auto">
                <Upload className="mr-2 h-5 w-5" />
                Upload Found Item
              </Button>
            </Link>
            <Link href="/browse">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                <Search className="mr-2 h-5 w-5" />
                Browse Items
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">Upload Photos</h3>
              <p className="text-sm text-muted-foreground">
                Found something? Take a photo and upload it with details about where and when you found it.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">Search & Claim</h3>
              <p className="text-sm text-muted-foreground">
                Lost something? Browse items and submit a claim with proof photos to verify ownership.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">Verified Release</h3>
              <p className="text-sm text-muted-foreground">
                Volunteers verify identity and release items. Every action is logged for transparency.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">Donation Timer</h3>
              <p className="text-sm text-muted-foreground">
                Unclaimed items are donated after 30 days, ensuring they benefit those in need.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Items Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Recently Found Items</h2>
          <Link href="/browse">
            <Button variant="ghost">View All</Button>
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {recentItems.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`}>
              <Card className="overflow-hidden transition-all hover:shadow-lg">
                <div className="aspect-square bg-muted">
                  <img
                    src={item.imageUrl || "/placeholder.svg"}
                    alt={item.category}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-card-foreground">{item.category}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Found {new Date(item.dateFounded).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Vault Church Lost & Found. Shielded in Silence. Fortified for Eternity.</p>
        </div>
      </footer>
    </div>
  )
}
