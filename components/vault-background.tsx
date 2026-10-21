import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type VaultBackgroundProps = {
  children: ReactNode
  className?: string
  intensity?: "soft" | "cinematic"
}

export function VaultBackground({ children, className, intensity = "soft" }: VaultBackgroundProps) {
  return (
    <div className={cn("vault-background relative isolate min-h-screen overflow-hidden bg-background", className)}>
      <div className={cn("vault-background__wash", intensity === "cinematic" && "vault-background__wash--cinematic")} aria-hidden="true" />
      <div className="vault-background__grid" aria-hidden="true" />
      <div className="vault-background__orb vault-background__orb--green" aria-hidden="true" />
      <div className="vault-background__orb vault-background__orb--gold" aria-hidden="true" />
      <div className="vault-background__orb vault-background__orb--blue" aria-hidden="true" />
      <div className="vault-background__ring vault-background__ring--one" aria-hidden="true" />
      <div className="vault-background__ring vault-background__ring--two" aria-hidden="true" />
      <div className="vault-background__grain" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
