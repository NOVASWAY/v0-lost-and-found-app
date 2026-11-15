"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  Search,
  Upload,
  Package,
  FileCheck,
  ShieldCheck,
  Settings,
  Home,
  Users,
  FileText,
  Calendar,
  Gift,
  Eye,
  Activity,
  MessageSquare,
  MapPin,
  MoreHorizontal,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  roles?: ("user" | "volunteer" | "admin")[]
}

const userNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["user"] },
  { href: "/browse", label: "Browse", icon: Search, roles: ["user"] },
  { href: "/upload", label: "Upload", icon: Upload, roles: ["user"] },
  { href: "/missions", label: "Missions", icon: Activity, roles: ["user"] },
  { href: "/my-uploads", label: "My Items", icon: Package, roles: ["user"] },
  { href: "/my-claims", label: "Claims", icon: FileCheck, roles: ["user"] },
  { href: "/orders", label: "Orders", icon: MessageSquare, roles: ["user"] },
  { href: "/profile", label: "Profile", icon: Settings, roles: ["user", "volunteer", "admin"] },
]

const volunteerNavItems: NavItem[] = [
  { href: "/volunteer/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["volunteer"] },
  { href: "/browse", label: "Browse", icon: Search, roles: ["volunteer"] },
  { href: "/profile", label: "Profile", icon: Settings, roles: ["volunteer"] },
]

const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["admin"] },
  { href: "/admin/items", label: "Items", icon: Package, roles: ["admin"] },
  { href: "/admin/claims", label: "Claims", icon: FileCheck, roles: ["admin"] },
  { href: "/admin/locations", label: "Locations", icon: MapPin, roles: ["admin"] },
  { href: "/profile", label: "Profile", icon: Settings, roles: ["admin"] },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [moreOpen, setMoreOpen] = useState(false)

  if (!user) return null

  // Don't show on landing/login/signup pages
  if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return null
  }

  // Determine which nav items to show based on role
  let navItems: NavItem[] = []
  if (user.role === "admin") {
    navItems = adminNavItems
  } else if (user.role === "volunteer") {
    navItems = volunteerNavItems
  } else {
    navItems = userNavItems.filter((item) => !item.roles || item.roles.includes("user"))
  }

  // Limit to 5 items max for mobile, show overflow indicator if truncated
  const MAX_ITEMS = 5
  const hasMore = navItems.length > MAX_ITEMS
  const displayItems = navItems.slice(0, MAX_ITEMS - (hasMore ? 1 : 0))
  const overflowItems = hasMore ? navItems.slice(MAX_ITEMS - 1) : []

  return (
    <>
      {moreOpen && overflowItems.length > 0 && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-slide-up">
        {moreOpen && overflowItems.length > 0 && (
          <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl animate-slide-down">
            <div className="mx-auto max-w-md px-4 py-2">
              {overflowItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/")
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                      isActive ? "text-primary bg-primary/5" : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
        <nav className="border-t border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl glass-strong">
          <div className="flex h-16 items-center justify-around px-2">
            {displayItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (pathname.startsWith(item.href + "/") && item.href !== "/")
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 px-2 transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center rounded-lg p-1.5 transition-all duration-200",
                    isActive ? "bg-primary/10" : "hover:bg-accent/10"
                  )}>
                    <Icon className={cn("h-5 w-5 shrink-0 transition-colors duration-200", isActive && "text-primary")} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold truncate w-full text-center transition-colors duration-200",
                    isActive && "text-primary"
                  )}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
            {hasMore && (
              <button
                type="button"
                onClick={() => setMoreOpen((open) => !open)}
                aria-label="Toggle more navigation items"
                aria-expanded={moreOpen}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 px-2 transition-all duration-200 text-muted-foreground hover:text-foreground"
              >
                <div className="flex items-center justify-center rounded-lg p-1.5 hover:bg-accent/10 transition-all duration-200">
                  {moreOpen ? (
                    <X className="h-5 w-5 shrink-0" />
                  ) : (
                    <MoreHorizontal className="h-5 w-5 shrink-0" />
                  )}
                </div>
                <span className="text-[10px] font-semibold truncate w-full text-center">
                  {moreOpen ? "Close" : "More"}
                </span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </>
  )
}