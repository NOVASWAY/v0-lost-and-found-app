"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, ArrowRight } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { useState, useEffect } from "react"
import { ItemCard } from "@/components/item-card"
import { itemsApi, type Item } from "@/lib/api-client"
import { VaultBackground } from "@/components/vault-background"

export default function HomePage() {
  const [recentItems, setRecentItems] = useState<Item[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    itemsApi
      .getAll({ limit: 8 })
      .then((res) => setRecentItems(res.items))
      .catch(() => {})
  }, [])

  if (!mounted) {
    return (
      <VaultBackground showParticles intensity="cinematic">
        <div className="min-h-screen bg-background overflow-hidden">
          <header className="sticky top-0 z-40 border-b border-border/30 bg-background/90 backdrop-blur-xl glass hidden md:block animate-slide-in-down">
            <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-4 group">
                <div className="relative h-10 w-7 sm:h-12 sm:w-8 transition-all duration-500 border border-primary/30 group-hover:border-primary/60 rounded-xl p-1 bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg group-hover:shadow-xl group-hover:shadow-primary/20">
                  <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill sizes="(max-width: 640px) 28px, 32px" className="object-contain object-top group-hover:drop-shadow-lg transition-all duration-300" priority />
                </div>
                <div className="flex flex-col">
                  <span className="text-base sm:text-lg font-black tracking-tighter text-foreground group-hover:gradient-text transition-all duration-300 leading-none">THE VAULT</span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-primary/70 group-hover:text-primary tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-colors duration-300">Security Operations</span>
                </div>
              </div>
              <nav className="hidden items-center gap-4 md:flex">
                <ThemeToggle />
                <Link href="/login">
                  <Button variant="default" size="sm" className="font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                    Access System
                  </Button>
                </Link>
              </nav>
            </div>
          </header>
          <main className="container mx-auto px-4 py-20 md:py-32 relative">
            <div className="mx-auto max-w-3xl text-center space-y-8 animate-pulse">
              <div className="h-56 sm:h-72 bg-muted/50 rounded-2xl animate-pulse" />
              <div className="h-8 w-64 bg-muted/50 animate-pulse rounded mx-auto" />
              <div className="h-4 w-80 bg-muted/50 animate-pulse rounded mx-auto" />
            </div>
          </main>
        </div>
      </VaultBackground>
    )
  }

  return (
    <VaultBackground showParticles intensity="cinematic" className="text-foreground font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/30 bg-background/90 backdrop-blur-xl glass hidden md:block animate-slide-in-down">
        <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-4 group">
            <div className="relative h-10 w-7 sm:h-12 sm:w-8 transition-all duration-500 border border-primary/30 group-hover:border-primary/60 rounded-xl p-1 bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg group-hover:shadow-xl group-hover:shadow-primary/20">
              <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill sizes="(max-width: 640px) 28px, 32px" className="object-contain object-top group-hover:drop-shadow-lg transition-all duration-300" priority />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tighter text-foreground group-hover:gradient-text transition-all duration-300 leading-none">THE VAULT</span>
              <span className="text-[9px] sm:text-[10px] font-bold text-primary/70 group-hover:text-primary tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-colors duration-300">Security Operations</span>
            </div>
          </div>
          <nav className="hidden items-center gap-4 md:flex">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="default" size="sm" className="font-semibold shadow-lg hover:shadow-xl transition-all duration-300 gradient">
                Access System
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16 md:py-28 relative">
        <div className="mx-auto max-w-3xl text-center space-y-8">
          <div className="mb-8 flex justify-center animate-float-gentle">
            <div className="relative w-40 h-64 sm:w-52 sm:h-80 group">
              <div className="absolute inset-0 animate-glow rounded-2xl" />
              <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill sizes="(max-width: 640px) 160px, 208px" className="object-contain drop-shadow-2xl group-hover:drop-shadow-[0_0_40px_rgba(var(--primary)/0.6)] transition-all duration-500" priority />
            </div>
          </div>
          
          <div className="space-y-5 animate-slide-up delay-1">
            <h1 className="text-balance text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter text-foreground leading-[1.05]">
              Vault Church
              <span className="gradient-text block mt-2">Security System</span>
            </h1>
            
            <p className="text-pretty text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Enterprise-grade asset management, access control, and protocol enforcement for community safety.
              <span className="block text-foreground font-semibold mt-4">Shielded in Silence. Fortified for Eternity.</span>
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4 animate-slide-up delay-2">
            <Link href="/login">
              <Button size="lg" className="font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 px-8 gradient">
                <Shield className="mr-2 h-5 w-5" />
                Access System
              </Button>
            </Link>
            <Link href="/browse">
              <Button variant="outline" size="lg" className="font-semibold hover:border-primary transition-all duration-300 px-8 glass">
                Browse Assets
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Recent Items Feed */}
      {recentItems.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="mb-10 text-center animate-slide-up">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground">Recently Found Items</h2>
            <p className="text-muted-foreground mt-2">Browse items that have been turned in</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentItems.map((item, index) => (
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
          <div className="mt-10 text-center animate-slide-up delay-3">
            <Link href="/browse">
              <Button variant="outline" size="lg" className="font-semibold glass">
                View All Items
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/30 bg-background/90 backdrop-blur-xl glass py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3 mb-10">
            <div className="animate-slide-up">
              <h3 className="font-black text-foreground mb-3">THE VAULT</h3>
              <p className="text-sm text-muted-foreground">Enterprise security operations for community safety.</p>
            </div>
            <div className="animate-slide-up delay-1">
              <h3 className="font-black text-foreground mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">Access System</Link></li>
                <li><Link href="/browse" className="text-muted-foreground hover:text-primary transition-colors">Browse Assets</Link></li>
              </ul>
            </div>
            <div className="animate-slide-up delay-2">
              <h3 className="font-black text-foreground mb-3">Contact</h3>
              <p className="text-sm text-muted-foreground">security@vaultchurch.org</p>
            </div>
          </div>
          <div className="border-t border-border/30 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 Vault Church. Shielded in Silence. Fortified for Eternity.</p>
          </div>
        </div>
      </footer>
    </VaultBackground>
  )
}