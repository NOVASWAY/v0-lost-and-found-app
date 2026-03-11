"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Shield, Lock, Eye, BookOpen } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { getItems, initializeStorage } from "@/lib/storage"
import { type Item } from "@/lib/mock-data"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [recentItems, setRecentItems] = useState<Item[]>([])

  useEffect(() => {
    initializeStorage()
    const items = getItems().filter((item) => item.status === "available").slice(0, 4)
    setRecentItems(items)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
              <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill sizes="(max-width: 640px) 32px, 40px" className="object-contain" priority />
            </div>
            <span className="text-base sm:text-xl font-semibold text-foreground truncate">Vault Church Security System</span>
          </div>
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="relative h-32 w-32">
              <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill sizes="128px" className="object-contain" priority />
            </div>
          </div>
          <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Vault Church Security System
          </h1>
          <p className="mb-10 text-pretty text-lg text-muted-foreground md:text-xl">
            A unified security system for asset management, access control, protocol enforcement, and community safety.
            Shielded in silence. Fortified for eternity.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                <Shield className="mr-2 h-5 w-5" />
                Access System
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">Security System Capabilities</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">Lost & Found Management</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive asset tracking with photo verification, claim processing, and secure release protocols.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">Access Control</h3>
              <p className="text-sm text-muted-foreground">
                Role-based authentication with admin-controlled user management and security clearance levels.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">Security Playbooks</h3>
              <p className="text-sm text-muted-foreground">
                Operational protocols for security scenarios with priority-based response procedures.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-card-foreground">Audit Logging</h3>
              <p className="text-sm text-muted-foreground">
                Complete activity tracking with transparent logging of all security events and user actions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Items Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Asset Registry</h2>
            <p className="text-sm text-muted-foreground mt-1">Recently recovered items in the security system</p>
          </div>
          <Link href="/browse">
            <Button variant="ghost">View All</Button>
          </Link>
        </div>
        {recentItems.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentItems.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`}>
                <Card className="overflow-hidden transition-all hover:shadow-lg">
                  <div className="relative aspect-square bg-muted">
                    <Image
                      src={item.imageUrl || "/placeholder.svg"}
                      alt={item.category}
                      fill
                      className="object-cover"
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
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No items available at the moment. Check back later!</p>
          </Card>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Vault Church Security System. Shielded in Silence. Fortified for Eternity.</p>
        </div>
      </footer>
    </div>
  )
}
