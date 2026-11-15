"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import Image from "next/image"
import { NavbarDropdown } from "@/components/navbar-dropdown"
import { cn } from "@/lib/utils"

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

  const volunteerLinks = [
    { href: "/volunteer/dashboard", label: "Release Dashboard" },
    { href: "/browse", label: "Browse Items" },
    { href: "/upload", label: "Upload Item" },
    { href: "/my-claims", label: "My Claims" },
  ]

  const adminTopLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/items", label: "Items" },
    { href: "/admin/claims", label: "Claims" },
  ]

  const adminDropdowns = [
    {
      label: "Management",
      items: [
        { href: "/admin/locations", label: "Locations" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/orders", label: "Orders" },
        { href: "/admin/donations", label: "Donations" },
      ],
    },
    {
      label: "Operations",
      items: [
        { href: "/admin/missions", label: "Missions" },
        { href: "/admin/releases", label: "Release Logs" },
        { href: "/admin/meeting-minutes", label: "Meeting Minutes" },
      ],
    },
    {
      label: "Security",
      items: [
        { href: "/admin/playbooks", label: "Playbooks" },
        { href: "/admin/occurrence-book", label: "Occurrence Book" },
        { href: "/admin/occurrence-categories", label: "OB Categories" },
      ],
    },
    {
      label: "System",
      items: [
        { href: "/admin/audit-logs", label: "Audit Logs" },
        { href: "/admin/settings", label: "Settings" },
      ],
    },
  ]

  const isVolunteer = role === "volunteer"
  const isAdmin = role === "admin"
  const links = isAdmin ? adminTopLinks : isVolunteer ? volunteerLinks : userLinks

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 bg-background/90 backdrop-blur-xl glass hidden md:block animate-slide-in-down">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="relative h-10 w-7 sm:h-12 sm:w-8 transition-all duration-500 border border-primary/30 group-hover:border-primary/60 rounded-xl p-1 bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg group-hover:shadow-xl group-hover:shadow-primary/20">
            <Image src="/vault-church-logo.jpeg" alt="Vault Church" fill sizes="(max-width: 640px) 28px, 32px" className="object-contain object-top group-hover:drop-shadow-lg transition-all duration-300" priority />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-tighter text-foreground group-hover:gradient-text transition-all duration-300 leading-none">THE VAULT</span>
            <span className="text-[9px] sm:text-[10px] font-bold text-primary/70 group-hover:text-primary tracking-[0.15em] sm:tracking-[0.2em] uppercase transition-colors duration-300">Security Operations</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-all duration-300 rounded-lg",
                "before:absolute before:bottom-0 before:left-1/2 before:w-0 before:h-0.5 before:bg-gradient-to-r before:from-primary before:to-accent before:transition-all before:duration-300 before:-translate-x-1/2 hover:before:w-[calc(100%-0.75rem)]"
              )}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && adminDropdowns.map((dropdown) => (
            <NavbarDropdown key={dropdown.label} label={dropdown.label} items={dropdown.items} />
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
                  className="rounded-xl font-semibold hover:text-primary transition-all duration-300 hover:bg-primary/5"
                >
                  {user.name}
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="rounded-xl font-semibold transition-all duration-300 hover:border-primary hover:text-primary hover:bg-primary/5"
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