"use client"

import { MobileBottomNav } from "./mobile-bottom-nav"
import { MobileHeader } from "./mobile-header"
import { Navbar } from "./navbar"
import { useAuth } from "@/lib/auth-context"
import { usePathname } from "next/navigation"

export function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()

  // Never show navigation on the landing page (it has its own header)
  // or on login/signup (they are self-contained).
  const hideNav = pathname === "/" || pathname === "/login" || pathname === "/signup"

  // Desktop navbar: show on all pages except landing/login/signup
  const showNavbar = !hideNav

  // Mobile header: only when logged in (outside of landing/login/signup)
  const showMobileHeader = !!user && !hideNav

  return (
    <>
      {showNavbar && <Navbar role={user?.role || "user"} />}
      {showMobileHeader && <MobileHeader />}
      <div className={user && !hideNav ? "pb-20 md:pb-0 min-h-screen" : "min-h-screen"}>
        {children}
      </div>
      {user && !hideNav && <MobileBottomNav />}
    </>
  )
}
