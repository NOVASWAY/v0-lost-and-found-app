"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export function MobileHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()

  if (!user) return null

  return (
    <header className="sticky top-0 z-40 border-b border-border/30 bg-background/95 backdrop-blur-xl glass-strong md:hidden animate-slide-in-down">
      <div className="flex h-14 items-center justify-between px-4">
        <Link
          href={user.role === "admin" ? "/admin" : user.role === "volunteer" ? "/volunteer/dashboard" : "/dashboard"}
          className="flex items-center gap-2"
        >
          <div className="relative h-8 w-6 transition-all duration-500 border border-primary/30 rounded-lg p-0.5 bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg">
            <Image src="/vault-church-logo.jpeg" alt="Vault Church" width={24} height={36} className="object-contain object-top" priority />
          </div>
          <span className="text-sm font-black tracking-tighter text-foreground">THE VAULT</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl glass">
                <User className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-4 pt-8">
                <div className="px-2 pb-4 border-b border-border/50">
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-xl gap-3"
                    onClick={() => {
                      router.push("/profile")
                    }}
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-xl gap-3 text-destructive hover:bg-destructive/5"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}