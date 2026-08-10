"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"
import { RubiksSafe } from "@/components/rubiks-safe"
import { cn } from "@/lib/utils"

type Phase = "idle" | "running" | "unlocking"

// Timing (ms) for the cinematic "granting access" pause after login.
const UNLOCK_DELAY = 3050 // vault door swings open
const NAVIGATE_DELAY = 4800 // then route to the user's dashboard

// Fixed starfield computed once at module load so positions never reshuffle.
const STARFIELD = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: Math.random() * 2 + 1,
  duration: 9 + Math.random() * 16,
  delay: -Math.random() * 24,
  opacity: 0.15 + Math.random() * 0.45,
  driftX: (Math.random() - 0.5) * 60,
  driftY: -30 - Math.random() * 80,
}))

const KEY_STATUS = (len: number): { label: string; tone: string } => {
  if (len === 0) return { label: "IDLE — AWAITING INPUT", tone: "text-slate-400 dark:text-slate-500" }
  if (len < 6) return { label: "KEY — WEAK", tone: "text-amber-400" }
  if (len < 10) return { label: "KEY — STABLE", tone: "text-blue-400" }
  return { label: "KEY — SECURE", tone: "text-green-400" }
}

// Subtle futuristic safe housing around the login panel: a thin ring with
// corner brackets and rivets. Kept restrained on purpose.
const FRAME_CORNERS = [
  "-top-2 -left-2 border-l-2 border-t-2 rounded-tl-lg",
  "-top-2 -right-2 border-r-2 border-t-2 rounded-tr-lg",
  "-bottom-2 -left-2 border-l-2 border-b-2 rounded-bl-lg",
  "-bottom-2 -right-2 border-r-2 border-b-2 rounded-br-lg",
] as const

function SafeFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute -inset-2 rounded-[2.5rem] border border-slate-300/40 dark:border-white/10" aria-hidden />
      <div
        className="absolute -inset-2 rounded-[2.5rem] border border-green-500/10 dark:border-green-400/10"
        style={{ animation: "cinematic-glow-pulse 7s ease-in-out infinite" }}
        aria-hidden
      />
      <div
        className="absolute inset-0 rounded-[2.25rem] bg-gradient-to-b from-slate-200/30 to-transparent dark:from-white/[0.03] dark:to-transparent"
        aria-hidden
      />
      {FRAME_CORNERS.map((corner, i) => (
        <div key={i} className={cn("absolute h-6 w-6 border-green-500/40 dark:border-green-400/40", corner)} aria-hidden />
      ))}
      <div className="absolute -top-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-400/50 dark:bg-slate-500/60" aria-hidden />
      <div className="absolute -bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-slate-400/50 dark:bg-slate-500/60" aria-hidden />
      <div className="relative">{children}</div>
    </div>
  )
}

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [phase, setPhase] = useState<Phase>("idle")
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [shake, setShake] = useState(false)
  const { user, login } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const userRef = useRef(user)

  useEffect(() => {
    userRef.current = user
  }, [user])

  const navigateByRole = useCallback(() => {
    const role = userRef.current?.role
    if (role === "admin") router.push("/admin")
    else if (role === "volunteer") router.push("/volunteer/dashboard")
    else router.push("/dashboard")
  }, [router])

  // Plays the sequence once when login succeeds, then navigates.
  useEffect(() => {
    if (phase !== "running") return

    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(
      setTimeout(() => {
        setIsUnlocking(true)
        setPhase("unlocking")
      }, UNLOCK_DELAY)
    )
    timers.push(setTimeout(() => navigateByRole(), NAVIGATE_DELAY))
    return () => timers.forEach(clearTimeout)
  }, [phase, navigateByRole])

  const triggerError = () => {
    setShake(true)
    window.setTimeout(() => setShake(false), 600)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phase !== "idle") return

    try {
      const success = await login(username, password, { redirect: false })
      if (success) {
        setIsUnlocking(false)
        setPhase("running")
      } else {
        triggerError()
        toast({
          title: "Access Denied",
          description: "Invalid username or password. Please try again.",
          variant: "destructive",
        })
      }
    } catch {
      triggerError()
      toast({
        title: "System Error",
        description: "An error occurred during login. Please try again.",
        variant: "destructive",
      })
    }
  }

  const status =
    phase === "running"
      ? { label: "AUTHENTICATING", tone: "text-amber-400" }
      : phase === "unlocking"
        ? { label: "ACCESS GRANTED", tone: "text-green-400" }
        : KEY_STATUS(password.length)

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 px-4 py-12 dark:from-slate-950 dark:via-zinc-900 dark:to-slate-950">
      {/* Living starfield */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {STARFIELD.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full bg-slate-400/60 dark:bg-white"
            style={
              {
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                "--star-opacity": s.opacity,
                "--drift-x": `${s.driftX}px`,
                "--drift-y": `${s.driftY}vh`,
                animation: `cinematic-star-drift ${s.duration}s linear ${s.delay}s infinite`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Drifting aurora blobs */}
      <div
        className="absolute -top-1/4 left-1/2 h-[600px] w-[600px] rounded-full bg-green-500/5 blur-3xl dark:bg-green-400/8"
        style={{ animation: "cinematic-aurora 22s ease-in-out infinite" }}
      />
      <div
        className="absolute -bottom-1/3 left-1/3 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-3xl dark:bg-blue-400/8"
        style={{ animation: "cinematic-aurora 26s ease-in-out infinite reverse" }}
      />
      <div
        className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-3xl dark:bg-purple-400/6"
        style={{ animation: "cinematic-aurora 30s ease-in-out infinite" }}
      />

      {/* Sweeping scan line */}
      <div className="animate-cinematic-scan-sweep absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent dark:via-green-400/20 pointer-events-none" />

      {/* Film grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/></svg>")`,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)" }}
      />

      {/* Theme toggle */}
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      {/* HUD — bottom */}
      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 font-mono text-[10px] tracking-[0.3em] text-slate-400 select-none dark:text-slate-600">
        {"SECURITY OPERATIONS // CLEARANCE REQUIRED"}
      </div>

      <div className="relative z-10 w-full max-w-md">
        <SafeFrame>
        {/* Vault safe */}
        <div className="mb-8 flex justify-center animate-cinematic-scale-in">
          <RubiksSafe
            isActive={password.length > 0 || isUnlocking}
            passwordLength={password.length}
            isUnlocking={isUnlocking}
            className={cn(shake && "animate-cinematic-shake")}
          />
        </div>

        {/* Title */}
        <div className="mb-8 text-center">
          <h1 className="animate-cinematic-text-reveal delay-200 mb-2 fill-mode-forwards text-2xl font-bold tracking-[0.15em] text-slate-900 opacity-0 dark:text-white sm:text-3xl">
            THE VAULT
          </h1>
          <p className="animate-cinematic-text-reveal delay-300 fill-mode-forwards text-xs font-medium uppercase tracking-[0.3em] text-slate-500 opacity-0 dark:text-slate-400 sm:text-sm">
            SECURITY OPERATIONS
          </p>
        </div>

        {/* Login form card */}
        <div
          className={cn(
            "animate-cinematic-slide-up delay-400 rounded-2xl border border-slate-200/50 bg-white/60 p-6 opacity-0 shadow-2xl backdrop-blur-xl fill-mode-forwards dark:border-white/10 dark:bg-white/5 sm:p-8",
            shake && "animate-cinematic-shake"
          )}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700 dark:text-slate-300">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={phase !== "idle"}
                className="bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-green-400 dark:focus:ring-green-400/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={phase !== "idle"}
                className="bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-green-400 dark:focus:ring-green-400/20"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-green-600 font-semibold tracking-wide text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
              disabled={phase !== "idle"}
            >
              {phase === "running" ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating
                </span>
              ) : phase === "unlocking" ? (
                "Opening Vault..."
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Status line */}
          <div className="mt-5 flex items-center justify-between font-mono text-[10px] tracking-wider">
            <span className="text-slate-500 dark:text-slate-500">status</span>
            <span className={cn("transition-colors duration-300", status.tone)}>{status.label}</span>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">
              Contact an administrator to create an account
            </span>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Back to home
          </Link>
        </div>
        </SafeFrame>
      </div>
    </div>
  )
}
