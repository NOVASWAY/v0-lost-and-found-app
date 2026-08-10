"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Shield, Lock, Eye, BookOpen } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { itemsApi } from "@/lib/api-client"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function HomePage() {
  const [recentItems, setRecentItems] = useState<any[]>([])

  useEffect(() => {
    itemsApi
      .getAll({ status: "available", limit: 4 })
      .then((res) => setRecentItems(res.items))
      .catch(() => setRecentItems([]))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-zinc-900 to-slate-950">
      {/* Hero Section - Cinematic */}
      <header className="relative border-b border-white/10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-emerald-500/5 blur-[128px]" />
        </div>
        <div className="container relative mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
              <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill sizes="(max-width: 640px) 32px, 40px" className="object-contain" priority />
            </div>
            <span className="text-base sm:text-xl font-semibold text-white truncate">Vault Church Security System</span>
          </div>
          <nav className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:bg-white/10">Login</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[200px]" />
        </div>
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-8 flex justify-center animate-cinematic-scale-in">
              <div className="relative h-32 w-32 sm:h-40 sm:w-40">
                <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill sizes="(max-width: 640px) 128px, 160px" className="object-contain" priority />
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-cinematic-glow" />
              </div>
            </div>
            <h1 className="mb-6 text-balance text-4xl font-bold tracking-wider text-white md:text-6xl animate-cinematic-text-reveal">
              VAULT CHURCH
            </h1>
            <p className="mb-4 text-lg tracking-[0.3em] text-primary animate-cinematic-text-reveal delay-200">
              SECURITY OPERATIONS CENTER
            </p>
            <p className="mb-10 text-pretty text-lg text-zinc-400 md:text-xl animate-cinematic-text-reveal delay-300">
              A unified security system for asset management, access control, protocol enforcement, and community safety.
              Shielded in silence. Fortified for eternity.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-cinematic-slide-up delay-400">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  <Shield className="mr-2 h-5 w-5" />
                  ACCESS SYSTEM
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative border-t border-white/10 bg-white/[0.02] py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-wider text-white animate-cinematic-text-reveal">CAPABILITIES</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Shield, title: "Lost & Found", desc: "Comprehensive asset tracking with photo verification, claim processing, and secure release protocols.", delay: "100" },
              { icon: Lock, title: "Access Control", desc: "Role-based authentication with admin-controlled user management and security clearance levels.", delay: "200" },
              { icon: BookOpen, title: "Playbooks", desc: "Operational protocols for security scenarios with priority-based response procedures.", delay: "300" },
              { icon: Eye, title: "Audit Logging", desc: "Complete activity tracking with transparent logging of all security events and user actions.", delay: "400" },
            ].map(({ icon: Icon, title, desc, delay }) => (
              <Card key={title} className={`p-6 bg-white/[0.03] border-white/10 hover:bg-white/[0.06] transition-all animate-cinematic-slide-up delay-${delay}`}>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm text-zinc-400">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Items */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-wider text-white">ASSET REGISTRY</h2>
            <p className="text-sm text-zinc-400 mt-1">Recently recovered items in the security system</p>
          </div>
          <Link href="/browse">
            <Button variant="ghost" className="text-white hover:bg-white/10">View All</Button>
          </Link>
        </div>
        {recentItems.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentItems.map((item, i) => (
              <Link key={item.id} href={`/items/${item.id}`}>
                <Card className={`overflow-hidden bg-white/[0.03] border-white/10 transition-all hover:shadow-lg hover:bg-white/[0.06] animate-cinematic-slide-up delay-${(i + 1) * 100}`}>
                  <div className="relative aspect-square bg-zinc-800/50">
                    <Image src={item.imageUrl || "/placeholder.svg"} alt={`${item.category} found item`} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 25vw, 320px" className="object-cover" />
                  </div>
                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{item.category}</span>
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{item.status}</span>
                    </div>
                    <p className="text-sm text-zinc-400">Found {new Date(item.dateFounded).toLocaleDateString()}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center bg-white/[0.03] border-white/10">
            <p className="text-zinc-400">No items available at the moment. Check back later!</p>
          </Card>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/[0.02] py-8">
        <div className="container mx-auto px-4 text-center text-sm text-zinc-500">
          <p>&copy; 2025 Vault Church Security System. Shielded in Silence. Fortified for Eternity.</p>
        </div>
      </footer>
    </div>
  )
}
