"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"

interface NavbarProps {
  role?: "user" | "volunteer" | "admin"
}

export function Navbar({ role = "user" }: NavbarProps) {
  const { user, logout } = useAuth()

  const userLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/browse", label: "Browse Items" },
    { href: "/upload", label: "Upload Item" },
    { href: "/my-claims", label: "My Claims" },
    { href: "/my-uploads", label: "My Uploads" },
  ]

  const volunteerLinks = [{ href: "/volunteer/dashboard", label: "Release Dashboard" }]

  const adminLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/items", label: "Items" },
    { href: "/admin/claims", label: "Claims" },
    { href: "/admin/releases", label: "Release Logs" },
    { href: "/admin/users", label: "User Activity" },
    { href: "/admin/donations", label: "Donation Queue" },
  ]

  let links = userLinks
  if (role === "volunteer") links = volunteerLinks
  if (role === "admin") links = adminLinks

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 glass-effect hidden md:block animate-slide-in-down">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 transition-all duration-500 border border-primary/30 group-hover:border-primary/60 rounded-lg p-1 bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg group-hover:shadow-xl group-hover:shadow-primary/20">
            <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill sizes="(max-width: 640px) 40px, 48px" className="object-contain group-hover:drop-shadow-lg transition-all duration-300" priority />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-tighter text-foreground group-hover:gradient-text transition-all duration-300 leading-none">THE VAULT</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-primary/70 group-hover:text-primary tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-colors duration-300">Security Operations</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-muted-foreground hover:text-primary transition-all duration-300 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300 rounded-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && (
            <>
              <Link href="/profile">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="font-semibold hover:text-primary transition-all duration-300 hover:bg-primary/10"
                >
                  {user.name}
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="font-semibold transition-all duration-300 hover:border-primary hover:text-primary hover:bg-primary/10"
              >
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
