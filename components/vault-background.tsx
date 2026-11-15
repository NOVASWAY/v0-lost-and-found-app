"use client"

import type { ReactNode, CSSProperties } from "react"
import { cn } from "@/lib/utils"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

type VaultBackgroundProps = {
  children: ReactNode
  className?: string
  intensity?: "soft" | "cinematic"
  showParticles?: boolean
}

export function VaultBackground({
  children,
  className,
  intensity = "soft",
  showParticles = false,
}: VaultBackgroundProps) {
  const prefersReduced = useReducedMotion()

  const particleStyles = Array.from({ length: 12 }).map(() => ({
    left: `${5 + Math.random() * 90}%`,
    top: `${5 + Math.random() * 90}%`,
    width: `${3 + Math.random() * 5}px`,
    height: `${3 + Math.random() * 5}px`,
    "--dx": `${-30 + Math.random() * 60}vw`,
    "--dy": `${-40 + Math.random() * 80}vh`,
    "--dur": `${12 + Math.random() * 10}s`,
  }))

  return (
    <div className={cn("vault-bg", className)}>
      {/* Ambient color wash */}
      <div className="vault-bg__wash" aria-hidden="true" />
      {/* Subtle grid */}
      <div className="vault-bg__grid" aria-hidden="true" />
      {/* Floating orbs */}
      {!prefersReduced && (
        <>
          <div className="vault-bg__orb vault-bg__orb--1" aria-hidden="true" />
          <div className="vault-bg__orb vault-bg__orb--2" aria-hidden="true" />
          <div className="vault-bg__orb vault-bg__orb--3" aria-hidden="true" />
        </>
      )}
      {/* Rotating rings */}
      {!prefersReduced && (
        <>
          <div className="vault-bg__ring vault-bg__ring--1" aria-hidden="true" />
          <div className="vault-bg__ring vault-bg__ring--2" aria-hidden="true" />
        </>
      )}
      {/* Film grain */}
      <div className="vault-bg__grain" aria-hidden="true" />
      {/* Optional particle field */}
      {showParticles && !prefersReduced && (
        <div className="vault-bg__particles" aria-hidden="true">
          {particleStyles.map((style, i) => (
            <div
              key={i}
              className="vault-bg__particle"
              style={style as CSSProperties}
              aria-hidden="true"
            />
          ))}
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}