"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function MobileHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()

  if (!user) return null

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href={user.role === "admin" ? "/admin" : user.role === "volunteer" ? "/volunteer/dashboard" : "/dashboard"} className="flex items-center gap-2">
          <div className="relative h-8 w-8 grayscale transition-all duration-500 border border-primary/20 rounded-lg p-0.5 bg-white/5">
            <Image src="/vault-church-logo.jpeg" alt="Vault Church" width={32} height={32} className="object-contain" priority />
          </div>
          <span className="text-sm font-black tracking-tighter text-foreground">THE VAULT</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <User className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-4 pt-8">
                <div className="px-2">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
                <div className="border-t border-border pt-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      router.push("/profile")
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
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
