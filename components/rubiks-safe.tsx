"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface RubiksSafeProps {
  isActive: boolean
  passwordLength: number
  isUnlocking?: boolean
  className?: string
}

export function RubiksSafe({ isActive, passwordLength, isUnlocking = false, className }: RubiksSafeProps) {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [doorOpen, setDoorOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme } = useTheme()
  const audioContextRef = useRef<AudioContext | null>(null)
  const lastSoundTimeRef = useRef(0)

  // Handle mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined" && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }, [])

  // Play realistic vault lock sound effect (metallic ticking/clicking)
  const playSafeSound = () => {
    if (!audioContextRef.current) return

    const now = Date.now()
    // Throttle sounds to avoid overwhelming the audio context
    if (now - lastSoundTimeRef.current < 120) return
    lastSoundTimeRef.current = now

    const audioContext = audioContextRef.current
    
    // Create a realistic vault lock ticking sound
    // This simulates the mechanical clicking of a combination lock dial
    const baseFreq = 200 + Math.random() * 100 // Lower frequency for metallic tick
    const duration = 0.08 // Short, sharp tick
    
    // Main tick sound - metallic and sharp
    const tickOsc = audioContext.createOscillator()
    const tickGain = audioContext.createGain()
    const tickFilter = audioContext.createBiquadFilter()
    
    tickFilter.type = "bandpass"
    tickFilter.frequency.value = baseFreq
    tickFilter.Q.value = 10
    
    tickOsc.connect(tickFilter)
    tickFilter.connect(tickGain)
    tickGain.connect(audioContext.destination)
    
    // Sharp metallic tick
    tickOsc.type = "square"
    tickOsc.frequency.setValueAtTime(baseFreq, audioContext.currentTime)
    tickOsc.frequency.exponentialRampToValueAtTime(
      baseFreq * 0.5, 
      audioContext.currentTime + duration
    )
    
    // Quick attack, quick decay for sharp tick
    tickGain.gain.setValueAtTime(0, audioContext.currentTime)
    tickGain.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.005)
    tickGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
    
    tickOsc.start(audioContext.currentTime)
    tickOsc.stop(audioContext.currentTime + duration)
    
    // Add a subtle mechanical resonance
    setTimeout(() => {
      const resonanceOsc = audioContext.createOscillator()
      const resonanceGain = audioContext.createGain()
      const resonanceFilter = audioContext.createBiquadFilter()
      
      resonanceFilter.type = "lowpass"
      resonanceFilter.frequency.value = 150
      
      resonanceOsc.connect(resonanceFilter)
      resonanceFilter.connect(resonanceGain)
      resonanceGain.connect(audioContext.destination)
      
      resonanceOsc.type = "sine"
      resonanceOsc.frequency.setValueAtTime(150, audioContext.currentTime)
      
      resonanceGain.gain.setValueAtTime(0.02, audioContext.currentTime)
      resonanceGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15)
      
      resonanceOsc.start(audioContext.currentTime)
      resonanceOsc.stop(audioContext.currentTime + 0.15)
    }, 10)
  }

  // Play vault unlocking sound (mechanical release)
  const playUnlockSound = () => {
    if (!audioContextRef.current) return
    
    const audioContext = audioContextRef.current
    
    // Sequence of sounds: click, mechanical release, door opening
    const sounds = [
      { freq: 300, duration: 0.1, delay: 0 },      // Initial click
      { freq: 200, duration: 0.15, delay: 0.1 },    // Mechanism release
      { freq: 150, duration: 0.2, delay: 0.25 },   // Door mechanism
      { freq: 100, duration: 0.3, delay: 0.45 },     // Deep rumble
    ]
    
    sounds.forEach(({ freq, duration, delay }) => {
      setTimeout(() => {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()
        const filter = audioContext.createBiquadFilter()
        
        filter.type = "lowpass"
        filter.frequency.value = freq * 2
        
        osc.connect(filter)
        filter.connect(gain)
        gain.connect(audioContext.destination)
        
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(freq, audioContext.currentTime)
        osc.frequency.exponentialRampToValueAtTime(freq * 0.3, audioContext.currentTime + duration)
        
        gain.gain.setValueAtTime(0.15, audioContext.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
        
        osc.start(audioContext.currentTime)
        osc.stop(audioContext.currentTime + duration)
      }, delay * 1000)
    })
  }

  // Animate when password is being typed
  useEffect(() => {
    if (isActive && passwordLength > 0) {
      setIsSpinning(true)
      playSafeSound()
      
      // Rotate dial based on password length (like a combination lock)
      // Each character adds rotation, with variation for realism
      const baseRotation = passwordLength * 30 // 30 degrees per character
      const variation = (passwordLength % 4) * 7.5 // Add slight variation
      const newRotation = baseRotation + variation
      setRotation(newRotation)

      const timer = setTimeout(() => {
        setIsSpinning(false)
      }, 400)

      return () => clearTimeout(timer)
    } else {
      // Reset rotation when password is cleared
      setRotation(0)
    }
  }, [passwordLength, isActive])

  // Handle vault unlocking animation
  useEffect(() => {
    if (isUnlocking) {
      playUnlockSound()
      setDoorOpen(true)
    } else {
      setDoorOpen(false)
    }
  }, [isUnlocking])

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* 3D Vault Safe Container */}
      <div className="relative" style={{ perspective: '1000px' }}>
        {/* Vault Safe Door - Static (no rotation when typing) */}
        <div 
          className="relative w-36 h-44 sm:w-40 sm:h-48 md:w-48 md:h-56"
          style={{
            transformStyle: 'preserve-3d',
            transform: doorOpen ? 'rotateY(-90deg) translateX(-20%)' : 'rotateY(0deg)',
            transition: doorOpen ? 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
          }}
        >
          {/* Main Safe Door */}
          <div className={cn(
            "relative w-full h-full rounded-lg border-4 shadow-2xl transition-all duration-1000",
            // Light mode: metallic silver/steel appearance
            "dark:bg-gradient-to-br dark:from-slate-800 dark:via-slate-700 dark:to-slate-900 dark:border-slate-950",
            "bg-gradient-to-br from-zinc-300 via-zinc-200 to-zinc-400 border-zinc-600",
            doorOpen && "brightness-150"
          )}>
            {/* Metallic Texture Overlay - Theme aware */}
            <div className={cn(
              "absolute inset-0 rounded-lg opacity-60",
              "dark:bg-gradient-to-br dark:from-slate-600/50 dark:to-slate-800/50",
              "bg-gradient-to-br from-zinc-400/40 to-zinc-500/40"
            )} />
            
            {/* Brushed Metal Texture Pattern */}
            <div className="absolute inset-0 rounded-lg opacity-30" 
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
              }}
            />
            
            {/* Corner Rivets/Decorative Elements - Theme aware */}
            <div className={cn(
              "absolute top-2 left-2 w-2.5 h-2.5 rounded-full shadow-lg",
              "dark:bg-slate-400 dark:ring-2 dark:ring-slate-300",
              "bg-zinc-500 ring-2 ring-zinc-400"
            )} />
            <div className={cn(
              "absolute top-2 right-2 w-2.5 h-2.5 rounded-full shadow-lg",
              "dark:bg-slate-400 dark:ring-2 dark:ring-slate-300",
              "bg-zinc-500 ring-2 ring-zinc-400"
            )} />
            <div className={cn(
              "absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full shadow-lg",
              "dark:bg-slate-400 dark:ring-2 dark:ring-slate-300",
              "bg-zinc-500 ring-2 ring-zinc-400"
            )} />
            <div className={cn(
              "absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full shadow-lg",
              "dark:bg-slate-400 dark:ring-2 dark:ring-slate-300",
              "bg-zinc-500 ring-2 ring-zinc-400"
            )} />
            
            {/* Additional decorative rivets for realism */}
            <div className={cn(
              "absolute top-1/2 left-3 w-1.5 h-1.5 rounded-full",
              "dark:bg-slate-500",
              "bg-zinc-600"
            )} />
            <div className={cn(
              "absolute top-1/2 right-3 w-1.5 h-1.5 rounded-full",
              "dark:bg-slate-500",
              "bg-zinc-600"
            )} />
            
            {/* Combination Dial Container */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {/* Dial Outer Ring - Theme aware */}
              <div className={cn(
                "relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-2 sm:border-4 shadow-inner",
                "dark:bg-gradient-to-br dark:from-slate-600 dark:to-slate-800 dark:border-slate-950",
                "bg-gradient-to-br from-zinc-400 to-zinc-600 border-zinc-700"
              )}>
                {/* Dial Numbers Ring */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'transform 0.2s ease-out'
                  }}
                >
                  {/* Numbers around the dial - Responsive positioning */}
                  {[...Array(12)].map((_, i) => {
                    const angle = (i * 30) - 90 // Start at top
                    // Base radius scales with dial size (smaller on mobile)
                    const baseRadius = 32 // Base for mobile
                    const x = Math.cos((angle * Math.PI) / 180) * baseRadius
                    const y = Math.sin((angle * Math.PI) / 180) * baseRadius
                    return (
                      <div
                        key={i}
                        className={cn(
                          "absolute text-[10px] sm:text-xs md:text-sm font-bold drop-shadow-lg",
                          "dark:text-slate-100",
                          "text-zinc-800"
                        )}
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                          transform: 'translate(-50%, -50%) scale(0.9) sm:scale-100',
                        }}
                      >
                        {i === 0 ? '0' : i * 5}
                      </div>
                    )
                  })}
                </div>
                
                {/* Fixed Indicator Mark (doesn't rotate) - Theme aware */}
                <div className={cn(
                  "absolute top-2 left-1/2 -translate-x-1/2 w-1 h-4 rounded-full shadow-lg z-10",
                  "dark:bg-slate-100",
                  "bg-zinc-200"
                )} />
                
                {/* Dial Center - Theme aware */}
                <div className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 shadow-lg",
                  "dark:bg-gradient-to-br dark:from-slate-700 dark:to-slate-900 dark:border-slate-950",
                  "bg-gradient-to-br from-zinc-500 to-zinc-700 border-zinc-800"
                )}>
                  {/* Center Indicator Line (rotates with dial) - Theme aware */}
                  <div className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-5 sm:h-6 md:h-7 rounded-full shadow-md",
                    "dark:bg-slate-200",
                    "bg-zinc-300"
                  )} />
                  
                  {/* Center Dot - Theme aware */}
                  <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full shadow-inner",
                    "dark:bg-slate-300",
                    "bg-zinc-400"
                  )} />
                </div>
              </div>
            </div>

            {/* Handle/Lever - Theme aware */}
            <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2">
              <div className={cn(
                "w-10 h-1.5 sm:w-12 sm:h-2 md:w-16 md:h-3 rounded-full border-2 transition-all duration-300",
                // Default state
                "dark:bg-gradient-to-br dark:from-slate-600 dark:to-slate-800 dark:border-slate-950",
                "bg-gradient-to-br from-zinc-500 to-zinc-700 border-zinc-800",
                // Active state
                isActive && passwordLength >= 6 && "dark:bg-gradient-to-br dark:from-green-600 dark:to-green-800 dark:border-green-950",
                isActive && passwordLength >= 6 && "bg-gradient-to-br from-green-500 to-green-700 border-green-800"
              )}>
                <div className={cn(
                  "absolute -top-0.5 sm:-top-1 left-1/2 -translate-x-1/2 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full border-2 transition-all duration-300",
                  // Default state
                  "dark:bg-gradient-to-br dark:from-slate-500 dark:to-slate-700 dark:border-slate-950",
                  "bg-gradient-to-br from-zinc-400 to-zinc-600 border-zinc-700",
                  // Active state
                  isActive && passwordLength >= 6 && "dark:bg-gradient-to-br dark:from-green-500 dark:to-green-700 dark:border-green-950",
                  isActive && passwordLength >= 6 && "bg-gradient-to-br from-green-400 to-green-600 border-green-700"
                )} />
              </div>
            </div>

            {/* Lock Mechanism Indicator - Theme aware */}
            <div className={cn(
              "absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full",
              "dark:bg-slate-950",
              "bg-zinc-800"
            )}>
              <div 
                className={cn(
                  "h-full bg-gradient-to-r rounded-full transition-all duration-300",
                  "dark:from-green-400 dark:to-green-600",
                  "from-green-500 to-green-700",
                  isActive && passwordLength > 0 ? "w-full" : "w-0"
                )}
              />
            </div>

            {/* Glowing Effect When Active - Theme aware */}
            {isActive && passwordLength > 0 && (
              <div className={cn(
                "absolute inset-0 rounded-lg animate-pulse",
                "dark:bg-green-500/20",
                "bg-green-400/15"
              )} />
            )}
            
            {/* Realistic highlight on top edge */}
            <div className={cn(
              "absolute top-0 left-0 right-0 h-1 rounded-t-lg opacity-40",
              "dark:bg-gradient-to-r dark:from-transparent dark:via-slate-300 dark:to-transparent",
              "bg-gradient-to-r from-transparent via-zinc-100 to-transparent"
            )} />
            
            {/* Realistic shadow on bottom edge */}
            <div className={cn(
              "absolute bottom-0 left-0 right-0 h-1 rounded-b-lg opacity-30",
              "dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-800 dark:to-slate-950",
              "bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800"
            )} />
          </div>

          {/* 3D Depth Effect - Side of Safe - Theme aware */}
          <div 
            className={cn(
              "absolute top-0 left-full w-4 h-full rounded-r-lg",
              "dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950",
              "bg-gradient-to-br from-zinc-600 to-zinc-800"
            )}
            style={{
              transform: 'rotateY(90deg)',
              transformOrigin: 'left center'
            }}
          />
        </div>

        {/* Cracking Lines Effect */}
        {isActive && passwordLength > 3 && (
          <div className="absolute inset-0 pointer-events-none" style={{ perspective: '1000px' }}>
            <div className="absolute top-1/4 left-1/4 w-8 h-0.5 bg-amber-400/50 rotate-45" />
            <div className="absolute top-3/4 right-1/4 w-6 h-0.5 bg-amber-400/50 -rotate-45" />
            <div className="absolute bottom-1/4 left-1/3 w-4 h-0.5 bg-amber-400/50 rotate-12" />
          </div>
        )}

        {/* Success Glow When Password is Long Enough - Theme aware */}
        {isActive && passwordLength >= 6 && !doorOpen && (
          <div className={cn(
            "absolute -inset-4 rounded-lg blur-xl animate-pulse",
            "dark:bg-green-500/30",
            "bg-green-400/25"
          )} />
        )}

        {/* Entrance Portal Effect When Unlocking - Theme aware */}
        {doorOpen && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80">
              {/* Portal Ring - Theme aware */}
              <div className={cn(
                "absolute inset-0 rounded-full border-8 animate-spin-slow",
                "dark:border-green-400/50",
                "border-green-500/60"
              )} 
                style={{ animationDuration: '3s' }} />
              <div className={cn(
                "absolute inset-4 rounded-full border-4 animate-spin",
                "dark:border-blue-400/50",
                "border-blue-500/60"
              )} 
                style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
              
              {/* Portal Center - Theme aware */}
              <div className={cn(
                "absolute inset-8 rounded-full animate-pulse",
                "dark:bg-gradient-to-br dark:from-green-500/20 dark:via-blue-500/20 dark:to-purple-500/20",
                "bg-gradient-to-br from-green-400/25 via-blue-400/25 to-purple-400/25"
              )} />
              
              {/* Light Rays - Theme aware */}
              {[...Array(8)].map((_, i) => {
                const angle = (i * 45) * (Math.PI / 180)
                return (
                  <div
                    key={i}
                    className={cn(
                      "absolute top-1/2 left-1/2 w-0.5 sm:w-1 h-12 sm:h-16 md:h-20 bg-gradient-to-b origin-top",
                      "dark:from-green-400/50 dark:to-transparent",
                      "from-green-500/60 to-transparent"
                    )}
                    style={{
                      transform: `translate(-50%, -50%) rotate(${angle * (180 / Math.PI)}deg)`,
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Vault Door Shadow - Theme aware */}
        {!doorOpen && (
          <div className={cn(
            "absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-4 blur-xl rounded-full",
            "dark:bg-black/30",
            "bg-black/20"
          )} />
        )}
      </div>
    </div>
  )
}

