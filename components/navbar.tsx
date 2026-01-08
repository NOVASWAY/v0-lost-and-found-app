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
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl hidden md:block">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 grayscale group-hover:grayscale-0 transition-all duration-500 border border-primary/20 rounded-lg p-1 bg-white/5 shadow-[0_0_15px_rgba(180,140,40,0.1)]">
            <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill className="object-contain" priority />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-tighter text-foreground leading-none">THE VAULT</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-primary tracking-[0.15em] sm:tracking-[0.2em] uppercase">Security Operations</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  {user.name}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
