"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
  BookOpen,
  MessageSquare,
  MapPin,
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
  { href: "/playbooks", label: "Playbooks", icon: BookOpen, roles: ["user"] },
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

  if (!user) return null

  // Don't show on login/signup/home pages
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

  // Limit to 5 items max for mobile
  const displayItems = navItems.slice(0, 5)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {displayItems.map((item) => {
          const Icon = item.icon
          // Handle active state: exact match or starts with (but not for root paths like /admin matching /admin/items)
          const isActive = pathname === item.href || 
            (pathname.startsWith(item.href + "/") && item.href !== "/")
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full min-w-0 px-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
              <span className={cn(
                "text-[10px] font-medium truncate w-full text-center",
                isActive && "text-primary"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

