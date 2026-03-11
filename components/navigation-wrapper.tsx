"use client"

import { MobileBottomNav } from "./mobile-bottom-nav"
import { MobileHeader } from "./mobile-header"
import { Navbar } from "./navbar"
import { useAuth } from "@/lib/auth-context"
import { usePathname } from "next/navigation"

export function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()

  // Show navbar on public pages or desktop
  const isPublicPage = !user || pathname === "/" || pathname === "/login" || pathname === "/signup"
  const showNavbar = isPublicPage && pathname !== "/" // Don't show navbar on landing page (it has its own header)
  const showMobileHeader = user && !isPublicPage

  return (
    <>
      {showNavbar && <Navbar role={user?.role || "user"} />}
      {showMobileHeader && <MobileHeader />}
      <div className={user && !isPublicPage ? "pb-20 md:pb-0 min-h-screen" : "min-h-screen"}>
        {children}
      </div>
      {user && !isPublicPage && <MobileBottomNav />}
    </>
  )
}
