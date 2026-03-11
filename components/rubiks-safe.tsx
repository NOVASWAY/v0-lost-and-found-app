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

  // Play realistic bank vault combination lock sound (deep mechanical clicking)
  const playSafeSound = () => {
    if (!audioContextRef.current) return

    const now = Date.now()
    // Throttle sounds to avoid overwhelming the audio context
    if (now - lastSoundTimeRef.current < 150) return
    lastSoundTimeRef.current = now

    const audioContext = audioContextRef.current
    
    // Real bank vault combination lock has a deep, resonant mechanical click
    // Lower frequencies for heavy metal mechanism
    const baseFreq = 80 + Math.random() * 40 // Deep metallic click (80-120Hz)
    const duration = 0.12 // Slightly longer for more presence
    
    // Main click - deep and resonant (like a real bank vault dial)
    const clickOsc = audioContext.createOscillator()
    const clickGain = audioContext.createGain()
    const clickFilter = audioContext.createBiquadFilter()
    
    // Bandpass filter for metallic resonance
    clickFilter.type = "bandpass"
    clickFilter.frequency.value = baseFreq
    clickFilter.Q.value = 8 // Moderate resonance
    
    clickOsc.connect(clickFilter)
    clickFilter.connect(clickGain)
    clickGain.connect(audioContext.destination)
    
    // Deep metallic click with slight frequency drop
    clickOsc.type = "square"
    clickOsc.frequency.setValueAtTime(baseFreq, audioContext.currentTime)
    clickOsc.frequency.exponentialRampToValueAtTime(
      baseFreq * 0.4, 
      audioContext.currentTime + duration
    )
    
    // Realistic attack and decay for heavy mechanism
    clickGain.gain.setValueAtTime(0, audioContext.currentTime)
    clickGain.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + 0.008)
    clickGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
    
    clickOsc.start(audioContext.currentTime)
    clickOsc.stop(audioContext.currentTime + duration)
    
    // Add deep mechanical resonance (like heavy metal parts)
    setTimeout(() => {
      const resonanceOsc = audioContext.createOscillator()
      const resonanceGain = audioContext.createGain()
      const resonanceFilter = audioContext.createBiquadFilter()
      
      resonanceFilter.type = "lowpass"
      resonanceFilter.frequency.value = 60 // Very low for heavy mechanism
      
      resonanceOsc.connect(resonanceFilter)
      resonanceFilter.connect(resonanceGain)
      resonanceGain.connect(audioContext.destination)
      
      resonanceOsc.type = "sine"
      resonanceOsc.frequency.setValueAtTime(60, audioContext.currentTime)
      
      resonanceGain.gain.setValueAtTime(0.03, audioContext.currentTime)
      resonanceGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2)
      
      resonanceOsc.start(audioContext.currentTime)
      resonanceOsc.stop(audioContext.currentTime + 0.2)
    }, 15)
    
    // Add subtle high-frequency metallic "ping" (like metal on metal)
    setTimeout(() => {
      const pingOsc = audioContext.createOscillator()
      const pingGain = audioContext.createGain()
      const pingFilter = audioContext.createBiquadFilter()
      
      pingFilter.type = "bandpass"
      pingFilter.frequency.value = 800 + Math.random() * 200
      pingFilter.Q.value = 15
      
      pingOsc.connect(pingFilter)
      pingFilter.connect(pingGain)
      pingGain.connect(audioContext.destination)
      
      pingOsc.type = "sine"
      pingOsc.frequency.setValueAtTime(800 + Math.random() * 200, audioContext.currentTime)
      
      pingGain.gain.setValueAtTime(0.04, audioContext.currentTime)
      pingGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.06)
      
      pingOsc.start(audioContext.currentTime)
      pingOsc.stop(audioContext.currentTime + 0.06)
    }, 5)
  }

  // Play realistic bank vault unlocking sequence
  const playUnlockSound = () => {
    if (!audioContextRef.current) return
    
    const audioContext = audioContextRef.current
    
    // Real bank vault unlock sequence:
    // 1. Final combination click (deep, satisfying)
    // 2. Lock mechanism disengagement (heavy metal clunk)
    // 3. Bolt retraction (mechanical sliding)
    // 4. Door release (deep rumble)
    // 5. Door opening (heavy metal movement)
    
    const sounds = [
      // Final combination click - deep and satisfying
      { 
        freq: 70, 
        duration: 0.15, 
        delay: 0,
        type: "square",
        filterFreq: 70,
        gain: 0.2
      },
      // Lock mechanism disengagement - heavy clunk
      { 
        freq: 50, 
        duration: 0.2, 
        delay: 0.15,
        type: "sawtooth",
        filterFreq: 100,
        gain: 0.25
      },
      // Bolt retraction - mechanical sliding sound
      { 
        freq: 40, 
        duration: 0.4, 
        delay: 0.35,
        type: "sawtooth",
        filterFreq: 80,
        gain: 0.18
      },
      // Door mechanism release - deep rumble
      { 
        freq: 30, 
        duration: 0.5, 
        delay: 0.75,
        type: "sawtooth",
        filterFreq: 60,
        gain: 0.22
      },
      // Heavy door opening - low frequency rumble
      { 
        freq: 25, 
        duration: 0.6, 
        delay: 1.25,
        type: "sawtooth",
        filterFreq: 50,
        gain: 0.2
      },
    ]
    
    sounds.forEach(({ freq, duration, delay, type, filterFreq, gain }) => {
      setTimeout(() => {
        const osc = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        const filter = audioContext.createBiquadFilter()
        
        filter.type = "lowpass"
        filter.frequency.value = filterFreq
        
        osc.connect(filter)
        filter.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        osc.type = type as OscillatorType
        osc.frequency.setValueAtTime(freq, audioContext.currentTime)
        osc.frequency.exponentialRampToValueAtTime(freq * 0.2, audioContext.currentTime + duration)
        
        gainNode.gain.setValueAtTime(gain, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
        
        osc.start(audioContext.currentTime)
        osc.stop(audioContext.currentTime + duration)
      }, delay * 1000)
    })
    
    // Add metallic scraping sound during bolt retraction
    setTimeout(() => {
      const scrapeOsc = audioContext.createOscillator()
      const scrapeGain = audioContext.createGain()
      const scrapeFilter = audioContext.createBiquadFilter()
      
      scrapeFilter.type = "bandpass"
      scrapeFilter.frequency.value = 200 + Math.random() * 100
      scrapeFilter.Q.value = 5
      
      scrapeOsc.connect(scrapeFilter)
      scrapeFilter.connect(scrapeGain)
      scrapeGain.connect(audioContext.destination)
      
      scrapeOsc.type = "sawtooth"
      scrapeOsc.frequency.setValueAtTime(200 + Math.random() * 100, audioContext.currentTime)
      scrapeOsc.frequency.linearRampToValueAtTime(150, audioContext.currentTime + 0.4)
      
      scrapeGain.gain.setValueAtTime(0.08, audioContext.currentTime)
      scrapeGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4)
      
      scrapeOsc.start(audioContext.currentTime)
      scrapeOsc.stop(audioContext.currentTime + 0.4)
    }, 350)
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
        {/* Bank Vault Door - Larger, more imposing, circular design */}
        <div 
          className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64"
          style={{
            transformStyle: 'preserve-3d',
            transform: doorOpen ? 'rotateY(-90deg) translateX(-20%)' : 'rotateY(0deg)',
            transition: doorOpen ? 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
          }}
        >
          {/* Main Bank Vault Door - Circular, thick, industrial */}
          <div className={cn(
            "relative w-full h-full rounded-full border-8 shadow-2xl transition-all duration-1000",
            // Light mode: heavy steel/gunmetal appearance
            "dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 dark:border-slate-950",
            "bg-gradient-to-br from-zinc-600 via-zinc-500 to-zinc-700 border-zinc-800",
            doorOpen && "brightness-150"
          )}>
            {/* Heavy Steel Texture Overlay - Theme aware */}
            <div className={cn(
              "absolute inset-0 rounded-full opacity-70",
              "dark:bg-gradient-to-br dark:from-slate-700/60 dark:via-slate-800/60 dark:to-slate-900/60",
              "bg-gradient-to-br from-zinc-500/50 via-zinc-600/50 to-zinc-700/50"
            )} />
            
            {/* Industrial Brushed Steel Texture Pattern */}
            <div className="absolute inset-0 rounded-full opacity-40" 
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 6px), repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 6px)',
              }}
            />
            
            {/* Heavy Industrial Rivet Pattern - Bank vault style */}
            <div className="absolute inset-0 rounded-full">
              {/* Outer ring of large rivets */}
              {[...Array(12)].map((_, i) => {
                const angle = (i * 30) * (Math.PI / 180)
                const radius = 42 // Percentage from center
                const x = Math.round((50 + Math.cos(angle) * radius) * 100) / 100
                const y = Math.round((50 + Math.sin(angle) * radius) * 100) / 100
                return (
                  <div
                    key={`outer-${i}`}
                    className={cn(
                      "absolute w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 rounded-full shadow-xl",
                      "dark:bg-slate-500 dark:ring-2 dark:ring-slate-400",
                      "bg-zinc-600 ring-2 ring-zinc-500"
                    )}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                )
              })}
              
              {/* Inner decorative rivets */}
              {[...Array(8)].map((_, i) => {
                const angle = (i * 45) * (Math.PI / 180)
                const radius = 28
                const x = Math.round((50 + Math.cos(angle) * radius) * 100) / 100
                const y = Math.round((50 + Math.sin(angle) * radius) * 100) / 100
                return (
                  <div
                    key={`inner-${i}`}
                    className={cn(
                      "absolute w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full",
                      "dark:bg-slate-600",
                      "bg-zinc-700"
                    )}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                )
              })}
            </div>
            
            
            {/* Large Bank Vault Combination Dial Container */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              {/* Dial Outer Ring - Larger, more prominent - Theme aware */}
              <div className={cn(
                "relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full border-4 sm:border-6 shadow-inner",
                "dark:bg-gradient-to-br dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 dark:border-slate-950",
                "bg-gradient-to-br from-zinc-500 via-zinc-600 to-zinc-700 border-zinc-800"
              )}>
                {/* Dial Numbers Ring */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'transform 0.2s ease-out'
                  }}
                >
                  {/* Numbers around the dial - Bank vault style (0-100) */}
                  {[...Array(20)].map((_, i) => {
                    const angle = (i * 18) - 90 // 20 numbers = 18 degrees each
                    const baseRadius = 42 // Larger radius for bigger dial
                    const x = Math.round(Math.cos((angle * Math.PI) / 180) * baseRadius * 100) / 100
                    const y = Math.round(Math.sin((angle * Math.PI) / 180) * baseRadius * 100) / 100
                    // Show every 5th number prominently, others smaller
                    const isMajor = i % 5 === 0
                    return (
                      <div
                        key={i}
                        className={cn(
                          "absolute font-bold drop-shadow-lg",
                          isMajor ? "text-xs sm:text-sm md:text-base" : "text-[8px] sm:text-[9px] md:text-[10px]",
                          "dark:text-slate-100",
                          "text-zinc-800"
                        )}
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        {i * 5}
                      </div>
                    )
                  })}
                </div>
                
                {/* Fixed Indicator Mark (doesn't rotate) - Larger for bank vault - Theme aware */}
                <div className={cn(
                  "absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-6 sm:h-7 md:h-8 rounded-full shadow-xl z-10",
                  "dark:bg-slate-100 dark:ring-1 dark:ring-slate-300",
                  "bg-zinc-200 ring-1 ring-zinc-400"
                )} />
                
                {/* Dial Center - Larger, more prominent - Theme aware */}
                <div className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-3 sm:border-4 shadow-xl",
                  "dark:bg-gradient-to-br dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 dark:border-slate-950",
                  "bg-gradient-to-br from-zinc-600 via-zinc-700 to-zinc-800 border-zinc-900"
                )}>
                  {/* Center Indicator Line (rotates with dial) - Thicker - Theme aware */}
                  <div className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 w-1 h-6 sm:h-7 md:h-8 rounded-full shadow-lg",
                    "dark:bg-slate-200",
                    "bg-zinc-300"
                  )} />
                  
                  {/* Center Dot - Larger - Theme aware */}
                  <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 rounded-full shadow-inner",
                    "dark:bg-slate-300",
                    "bg-zinc-400"
                  )} />
                </div>
              </div>
            </div>

            {/* Large Bank Vault Handle/Wheel - Theme aware */}
            <div className="absolute bottom-8 sm:bottom-10 md:bottom-12 left-1/2 -translate-x-1/2">
              <div className={cn(
                "w-16 h-3 sm:w-20 sm:h-4 md:w-24 md:h-5 rounded-full border-3 sm:border-4 transition-all duration-300",
                // Default state - Heavy steel
                "dark:bg-gradient-to-br dark:from-slate-700 dark:to-slate-900 dark:border-slate-950",
                "bg-gradient-to-br from-zinc-600 to-zinc-800 border-zinc-900",
                // Active state
                isActive && passwordLength >= 6 && "dark:bg-gradient-to-br dark:from-green-600 dark:to-green-800 dark:border-green-950",
                isActive && passwordLength >= 6 && "bg-gradient-to-br from-green-500 to-green-700 border-green-800"
              )}>
                {/* Handle grip ridges */}
                <div className="absolute inset-0 flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-0.5 h-full rounded-full",
                        "dark:bg-slate-600",
                        "bg-zinc-700"
                      )}
                    />
                  ))}
                </div>
                <div className={cn(
                  "absolute -top-1 sm:-top-1.5 md:-top-2 left-1/2 -translate-x-1/2 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full border-3 sm:border-4 transition-all duration-300 shadow-xl",
                  // Default state
                  "dark:bg-gradient-to-br dark:from-slate-600 dark:to-slate-800 dark:border-slate-950",
                  "bg-gradient-to-br from-zinc-500 to-zinc-700 border-zinc-800",
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
            
            {/* Realistic highlight on top edge - Circular */}
            <div className={cn(
              "absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 rounded-t-full opacity-50",
              "dark:bg-gradient-to-r dark:from-transparent dark:via-slate-300 dark:to-transparent",
              "bg-gradient-to-r from-transparent via-zinc-100 to-transparent"
            )} />
            
            {/* Realistic shadow on bottom edge - Circular */}
            <div className={cn(
              "absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-2 rounded-b-full opacity-40",
              "dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-800 dark:to-slate-950",
              "bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800"
            )} />
            
            {/* Heavy steel rim effect */}
            <div className={cn(
              "absolute inset-0 rounded-full border-2",
              "dark:border-slate-700/50",
              "border-zinc-600/50"
            )} />
          </div>

          {/* 3D Depth Effect - Thick Bank Vault Door Side - Theme aware */}
          <div 
            className={cn(
              "absolute top-0 left-full w-6 sm:w-8 md:w-10 h-full rounded-r-full",
              "dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950",
              "bg-gradient-to-br from-zinc-700 to-zinc-900"
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
