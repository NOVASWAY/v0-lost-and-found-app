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

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined" && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }, [])

  const playSafeSound = () => {
    if (!audioContextRef.current) return

    const now = Date.now()
    if (now - lastSoundTimeRef.current < 150) return
    lastSoundTimeRef.current = now

    const audioContext = audioContextRef.current
    
    const baseFreq = 80 + Math.random() * 40
    const duration = 0.12
    
    const clickOsc = audioContext.createOscillator()
    const clickGain = audioContext.createGain()
    const clickFilter = audioContext.createBiquadFilter()
    
    clickFilter.type = "bandpass"
    clickFilter.frequency.value = baseFreq
    clickFilter.Q.value = 8
    
    clickOsc.connect(clickFilter)
    clickFilter.connect(clickGain)
    clickGain.connect(audioContext.destination)
    
    clickOsc.type = "square"
    clickOsc.frequency.setValueAtTime(baseFreq, audioContext.currentTime)
    clickOsc.frequency.exponentialRampToValueAtTime(
      baseFreq * 0.4, 
      audioContext.currentTime + duration
    )
    
    clickGain.gain.setValueAtTime(0, audioContext.currentTime)
    clickGain.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + 0.008)
    clickGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
    
    clickOsc.start(audioContext.currentTime)
    clickOsc.stop(audioContext.currentTime + duration)
    
    setTimeout(() => {
      const resonanceOsc = audioContext.createOscillator()
      const resonanceGain = audioContext.createGain()
      const resonanceFilter = audioContext.createBiquadFilter()
      
      resonanceFilter.type = "lowpass"
      resonanceFilter.frequency.value = 60
      
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

  const playUnlockSound = () => {
    if (!audioContextRef.current) return
    
    const audioContext = audioContextRef.current
    
    const sounds = [
      { freq: 70, duration: 0.15, delay: 0, type: "square", filterFreq: 70, gain: 0.2 },
      { freq: 50, duration: 0.2, delay: 0.15, type: "sawtooth", filterFreq: 100, gain: 0.25 },
      { freq: 40, duration: 0.4, delay: 0.35, type: "sawtooth", filterFreq: 80, gain: 0.18 },
      { freq: 30, duration: 0.5, delay: 0.75, type: "sawtooth", filterFreq: 60, gain: 0.22 },
      { freq: 25, duration: 0.6, delay: 1.25, type: "sawtooth", filterFreq: 50, gain: 0.2 },
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

  useEffect(() => {
    if (isActive && passwordLength > 0) {
      setIsSpinning(true)
      playSafeSound()
      
      const baseRotation = passwordLength * 30
      const variation = (passwordLength % 4) * 7.5
      const newRotation = baseRotation + variation
      setRotation(newRotation)

      const timer = setTimeout(() => {
        setIsSpinning(false)
      }, 400)

      return () => clearTimeout(timer)
    } else {
      setRotation(0)
    }
  }, [passwordLength, isActive])

  useEffect(() => {
    if (isUnlocking) {
      playUnlockSound()
      setDoorOpen(true)
    } else {
      setDoorOpen(false)
    }
  }, [isUnlocking])

  const strengthPercent = Math.min((passwordLength / 12) * 100, 100)
  const isStrong = passwordLength >= 6
  const circumference = 2 * Math.PI * 88

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Ambient glow behind vault */}
      <div
        className={cn(
          "absolute rounded-full transition-all duration-700",
          isActive
            ? isStrong
              ? "w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 bg-green-500/20 dark:bg-green-400/15 blur-3xl"
              : "w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 bg-amber-500/15 dark:bg-amber-400/10 blur-3xl"
            : "w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 bg-slate-500/10 dark:bg-slate-400/5 blur-2xl"
        )}
        style={{ animation: isActive ? "vault-glow-breathe 3s ease-in-out infinite" : undefined }}
      />

      {/* Floating particles when typing */}
      {isActive && passwordLength > 0 && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30) * (Math.PI / 180)
            const dist = 90 + (i % 3) * 20
            const x = Math.cos(angle) * dist
            const y = Math.sin(angle) * dist
            return (
              <div
                key={`particle-${i}`}
                className={cn(
                  "absolute left-1/2 top-1/2 w-1 h-1 rounded-full",
                  isStrong ? "bg-green-400/60" : "bg-amber-400/50"
                )}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  animation: `particle-float ${2 + (i % 3) * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            )
          })}
        </div>
      )}

      {/* 3D Vault Safe Container */}
      <div className="relative" style={{ perspective: '1000px' }}>
        {/* Progress ring around vault */}
        {isActive && passwordLength > 0 && (
          <svg
            className="absolute -inset-3 sm:-inset-4 md:-inset-5 w-[calc(100%+1.5rem)] h-[calc(100%+1.5rem)] sm:w-[calc(100%+2rem)] sm:h-[calc(100%+2rem)] md:w-[calc(100%+2.5rem)] md:h-[calc(100%+2.5rem)]"
            viewBox="0 0 200 200"
          >
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-slate-700/30 dark:text-slate-600/20"
            />
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * strengthPercent) / 100}
              className={cn(
                "transition-all duration-500",
                isStrong ? "text-green-400" : "text-amber-400"
              )}
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "100px 100px",
                filter: isStrong ? "drop-shadow(0 0 6px rgba(74,222,128,0.5))" : "drop-shadow(0 0 4px rgba(251,191,36,0.4))",
              }}
            />
          </svg>
        )}

        {/* Cinematic glow ring when strong */}
        {isActive && isStrong && (
          <div className="absolute -inset-4 sm:-inset-5 md:-inset-6 rounded-full border border-green-500/20 dark:border-green-400/15 animate-cinematic-ring pointer-events-none" />
        )}

        {/* Bank Vault Door */}
        <div 
          className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64"
          style={{
            transformStyle: 'preserve-3d',
            transform: doorOpen ? 'rotateY(-90deg) translateX(-20%)' : 'rotateY(0deg)',
            transition: doorOpen ? 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
          }}
        >
          {/* Main vault door */}
          <div className={cn(
            "relative w-full h-full rounded-full border-[6px] sm:border-8 shadow-2xl transition-all duration-1000 overflow-hidden",
            "dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 dark:border-slate-950",
            "bg-gradient-to-br from-zinc-600 via-zinc-500 to-zinc-700 border-zinc-800",
            doorOpen && "brightness-150"
          )}>
            {/* Brushed steel texture */}
            <div className="absolute inset-0 rounded-full opacity-40" 
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 6px), repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 6px)',
              }}
            />

            {/* Light sweep across vault surface */}
            <div
              className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
            >
              <div
                className="absolute -top-1/2 -left-full w-1/2 h-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5"
                style={{
                  animation: isActive ? "vault-light-sweep 3s ease-in-out infinite" : undefined,
                  transform: "rotate(25deg)",
                }}
              />
            </div>

            {/* Heavy Industrial Rivets */}
            <div className="absolute inset-0 rounded-full">
              {[...Array(12)].map((_, i) => {
                const angle = (i * 30) * (Math.PI / 180)
                const radius = 42
                const x = Math.round((50 + Math.cos(angle) * radius) * 100) / 100
                const y = Math.round((50 + Math.sin(angle) * radius) * 100) / 100
                return (
                  <div
                    key={`outer-${i}`}
                    className={cn(
                      "absolute w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 rounded-full shadow-xl",
                      "dark:bg-slate-500 dark:ring-1 dark:ring-slate-400",
                      "bg-zinc-600 ring-1 ring-zinc-500"
                    )}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                )
              })}
              {[...Array(8)].map((_, i) => {
                const angle = (i * 45) * (Math.PI / 180)
                const radius = 28
                const x = Math.round((50 + Math.cos(angle) * radius) * 100) / 100
                const y = Math.round((50 + Math.sin(angle) * radius) * 100) / 100
                return (
                  <div
                    key={`inner-${i}`}
                    className={cn(
                      "absolute w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full",
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

            {/* Combination Dial */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className={cn(
                "relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full border-[3px] sm:border-4 shadow-inner",
                "dark:bg-gradient-to-br dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 dark:border-slate-950",
                "bg-gradient-to-br from-zinc-500 via-zinc-600 to-zinc-700 border-zinc-800"
              )}>
                {/* Dial numbers ring */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'transform 0.2s ease-out'
                  }}
                >
                  {[...Array(20)].map((_, i) => {
                    const angle = (i * 18) - 90
                    const baseRadius = 40
                    const x = Math.round(Math.cos((angle * Math.PI) / 180) * baseRadius * 100) / 100
                    const y = Math.round(Math.sin((angle * Math.PI) / 180) * baseRadius * 100) / 100
                    const isMajor = i % 5 === 0
                    return (
                      <div
                        key={i}
                        className={cn(
                          "absolute font-bold drop-shadow-lg",
                          isMajor ? "text-[10px] sm:text-xs md:text-sm" : "text-[7px] sm:text-[8px] md:text-[9px]",
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
                
                {/* Fixed indicator */}
                <div className={cn(
                  "absolute top-1.5 sm:top-2 left-1/2 -translate-x-1/2 w-1 h-5 sm:h-6 md:h-7 rounded-full shadow-xl z-10",
                  "dark:bg-slate-100 dark:ring-1 dark:ring-slate-300",
                  "bg-zinc-200 ring-1 ring-zinc-400"
                )} />
                
                {/* Dial center */}
                <div className={cn(
                  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-[2px] sm:border-3 shadow-xl",
                  "dark:bg-gradient-to-br dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 dark:border-slate-950",
                  "bg-gradient-to-br from-zinc-600 via-zinc-700 to-zinc-800 border-zinc-900"
                )}>
                  <div className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-5 sm:h-6 md:h-7 rounded-full shadow-lg",
                    "dark:bg-slate-200",
                    "bg-zinc-300"
                  )} />
                  <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-inner",
                    "dark:bg-slate-300",
                    "bg-zinc-400"
                  )} />
                </div>
              </div>
            </div>

            {/* Vault handle */}
            <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 lg:bottom-12 left-1/2 -translate-x-1/2">
              <div className={cn(
                "w-14 h-2.5 sm:w-16 sm:h-3 md:w-20 md:h-3.5 lg:w-24 lg:h-4 rounded-full border-[2px] sm:border-3 transition-all duration-300",
                "dark:bg-gradient-to-br dark:from-slate-700 dark:to-slate-900 dark:border-slate-950",
                "bg-gradient-to-br from-zinc-600 to-zinc-800 border-zinc-900",
                isActive && isStrong && "dark:bg-gradient-to-br dark:from-green-600 dark:to-green-800 dark:border-green-950",
                isActive && isStrong && "bg-gradient-to-br from-green-500 to-green-700 border-green-800"
              )}>
                <div className="absolute inset-0 flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={cn("w-0.5 h-full rounded-full", "dark:bg-slate-600", "bg-zinc-700")}
                    />
                  ))}
                </div>
                <div className={cn(
                  "absolute -top-1 sm:-top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full border-[2px] sm:border-3 transition-all duration-300 shadow-xl",
                  "dark:bg-gradient-to-br dark:from-slate-600 dark:to-slate-800 dark:border-slate-950",
                  "bg-gradient-to-br from-zinc-500 to-zinc-700 border-zinc-800",
                  isActive && isStrong && "dark:bg-gradient-to-br dark:from-green-500 dark:to-green-700 dark:border-green-950",
                  isActive && isStrong && "bg-gradient-to-br from-green-400 to-green-600 border-green-700"
                )} />
              </div>
            </div>

            {/* Lock mechanism indicator bar */}
            <div className={cn(
              "absolute bottom-1.5 left-1/2 -translate-x-1/2 w-14 sm:w-16 md:w-20 h-1 rounded-full",
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

            {/* Active glow overlay */}
            {isActive && passwordLength > 0 && (
              <div className={cn(
                "absolute inset-0 rounded-full animate-pulse",
                isStrong
                  ? "dark:bg-green-500/20 bg-green-400/15"
                  : "dark:bg-amber-500/10 bg-amber-400/8"
              )} />
            )}
            
            {/* Top highlight */}
            <div className={cn(
              "absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1.5 rounded-t-full opacity-50",
              "dark:bg-gradient-to-r dark:from-transparent dark:via-slate-300 dark:to-transparent",
              "bg-gradient-to-r from-transparent via-zinc-100 to-transparent"
            )} />
          </div>

          {/* 3D depth effect - side of door */}
          <div 
            className={cn(
              "absolute top-0 left-full w-5 sm:w-6 md:w-8 lg:w-10 h-full rounded-r-full",
              "dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-950",
              "bg-gradient-to-br from-zinc-700 to-zinc-900"
            )}
            style={{
              transform: 'rotateY(90deg)',
              transformOrigin: 'left center'
            }}
          />
        </div>

        {/* Dramatic light rays when unlocking */}
        {doorOpen && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80">
              {[...Array(16)].map((_, i) => {
                const angle = (i * 22.5) * (Math.PI / 180)
                return (
                  <div
                    key={`ray-${i}`}
                    className={cn(
                      "absolute top-1/2 left-1/2 w-[1px] sm:w-0.5 h-16 sm:h-20 md:h-24 lg:h-28 bg-gradient-to-b origin-top",
                      "dark:from-green-400/60 dark:via-green-500/30 dark:to-transparent",
                      "from-green-500/70 via-green-400/30 to-transparent"
                    )}
                    style={{
                      transform: `translate(-50%, -50%) rotate(${angle * (180 / Math.PI)}deg)`,
                      animation: `pulse 1.5s ease-in-out infinite`,
                      animationDelay: `${i * 0.08}s`,
                      filter: "blur(1px)",
                    }}
                  />
                )
              })}
              {/* Center burst */}
              <div className="absolute inset-[30%] rounded-full bg-gradient-to-br from-green-400/25 via-blue-500/15 to-purple-500/10 animate-pulse blur-xl" />
              {/* Spinning rings */}
              <div className="absolute inset-2 rounded-full border-2 border-green-400/30 animate-spin-slow" style={{ animationDuration: '4s' }} />
              <div className="absolute inset-6 rounded-full border border-blue-400/20 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
            </div>
          </div>
        )}

        {/* Vault door shadow */}
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
