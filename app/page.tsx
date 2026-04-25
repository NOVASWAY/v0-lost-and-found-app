"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Shield, Lock, Eye, BookOpen } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { ItemCard } from "@/components/item-card"
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
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-card/50 backdrop-blur-xl glass-effect">
        <div className="container mx-auto flex items-center justify-between px-4 py-4 animate-fade-in">
          <div className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
              <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill sizes="(max-width: 640px) 32px, 40px" className="object-contain" priority />
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
            <div className="relative h-32 w-32 sm:h-40 sm:w-40 group">
              <div className="absolute inset-0 animate-glow-pulse rounded-full" />
              <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill sizes="160px" className="object-contain drop-shadow-lg group-hover:drop-shadow-2xl transition-all duration-300" priority />
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

      {/* Features Section */}
      <section className="border-y border-border/50 py-20 md:py-28 glass-effect">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-slide-in-down">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              System Capabilities
            </h2>
            <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent mx-auto rounded-full" />
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, title: "Asset Management", desc: "Comprehensive tracking with verification and secure protocols" },
              { icon: Lock, title: "Access Control", desc: "Role-based auth with admin user management" },
              { icon: BookOpen, title: "Security Playbooks", desc: "Operational protocols for response procedures" },
              { icon: Eye, title: "Audit Logging", desc: "Complete activity tracking for transparency" }
            ].map((feature, i) => (
              <Card 
                key={i}
                className="p-6 group transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 border-border/50 hover:border-primary/30 glass-effect cursor-default animate-slide-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300 group-hover:scale-110">
                  <feature.icon className="h-7 w-7 text-primary group-hover:text-accent transition-colors duration-300" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
                  {feature.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Items Section */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="mb-12 space-y-4 animate-slide-in-down">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold text-foreground">Asset Registry</h2>
              <p className="text-muted-foreground mt-2">Recently recovered items in the system</p>
            </div>
            <Link href="/browse">
              <Button variant="outline" className="font-semibold hover:border-primary transition-all duration-300">
                View All →
              </Button>
            </Link>
          </div>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-accent rounded-full" />
        </div>
        
        {recentItems.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentItems.map((item, i) => (
              <div key={item.id} className="animate-slide-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <ItemCard
                  id={item.id}
                  imageUrl={item.imageUrl}
                  category={item.category}
                  dateFound={new Date(item.dateFounded)}
                  location={item.location}
                  status={item.status as any}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card className="p-16 text-center glass-effect animate-scale-in border-dashed">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">No assets available at the moment.</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later or upload an item.</p>
          </Card>
        )}
      </section>

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
            <p>&copy; 2025 Vault Church. Shielded in Silence. Fortified for Eternity.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
