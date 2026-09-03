"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { useState, useEffect } from "react"
import { ItemCard } from "@/components/item-card"
import { itemsApi, type Item } from "@/lib/api-client"

export default function HomePage() {
  const [recentItems, setRecentItems] = useState<Item[]>([])

  useEffect(() => {
    itemsApi
      .getAll({ limit: 8 })
      .then((res) => setRecentItems(res.items))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-card/50 backdrop-blur-xl glass-effect">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 animate-fade-in">
          <div className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative h-8 w-6 sm:h-10 sm:w-8 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
              <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill sizes="(max-width: 640px) 24px, 32px" className="object-contain object-top" priority />
            </div>
            <span className="text-base sm:text-xl font-bold text-foreground truncate group-hover:text-primary transition-colors duration-300">Vault Church</span>
          </div>
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="default" size="sm" className="font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                Login
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 relative">
        <div className="mx-auto max-w-3xl text-center space-y-8">
          <div className="mb-8 flex justify-center animate-bounce-subtle">
            <div className="relative w-36 h-52 sm:w-44 sm:h-64 group">
              <div className="absolute inset-0 animate-glow-pulse rounded-2xl" />
              <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill sizes="(max-width: 640px) 144px, 176px" className="object-contain drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-300" priority />
            </div>
          </div>
          
          <div className="space-y-4 animate-slide-in-up">
            <h1 className="text-balance text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-foreground">
              Vault Church
              <span className="gradient-text block mt-2">Security System</span>
            </h1>
            
            <p className="text-pretty text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Enterprise-grade asset management, access control, and protocol enforcement for community safety.
              <span className="block text-foreground font-semibold mt-3">Shielded in Silence. Fortified for Eternity.</span>
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4 animate-scale-in">
            <Link href="/login">
              <Button size="lg" className="font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8">
                <Shield className="mr-2 h-5 w-5" />
                Access System
              </Button>
            </Link>
            <Link href="/browse">
              <Button variant="outline" size="lg" className="font-semibold hover:border-primary transition-all duration-300 px-8">
                Browse Assets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Items Feed */}
      {recentItems.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Recently Found Items</h2>
            <p className="text-muted-foreground mt-2">Browse items that have been turned in</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentItems.map((item) => (
              <ItemCard
                key={item.id}
                id={item.id}
                imageUrl={item.imageUrl}
                category={item.category}
                color={item.color}
                dateFound={new Date(item.dateFounded)}
                location={item.location}
                status={item.status}
                donationDeadline={item.donationDeadline ? new Date(item.donationDeadline) : undefined}
              />
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link href="/browse">
              <Button variant="outline" size="lg" className="font-semibold">
                View All Items
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 glass-effect py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3 mb-8">
            <div>
              <h3 className="font-bold text-foreground mb-3">The Vault</h3>
              <p className="text-sm text-muted-foreground">Enterprise security operations for community safety.</p>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">Login</Link></li>
                <li><Link href="/browse" className="text-muted-foreground hover:text-primary transition-colors">Browse</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-3">Contact</h3>
              <p className="text-sm text-muted-foreground">security@vaultchurch.org</p>
            </div>
          </div>
          <div className="border-t border-border/50 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 Vault Church. Shielded in Silence. Fortified for Eternity.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
