"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"

export function BackgroundMusic() {
  const { isAuthenticated } = useAuth()
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    // Create audio element only once
    if (!audio) {
      const audioElement = new Audio()
      audioElement.crossOrigin = "anonymous"
      // Using a free royalty-free phonk track from a CDN
      // This is a Door Light Phonk inspired track
      audioElement.src = "https://assets.mixkit.co/active_storage/sfx/2761/2761-preview.mp3"
      audioElement.loop = true
      audioElement.volume = 0.2 // 20% volume to not be intrusive
      setAudio(audioElement)
    }
  }, [audio])

  useEffect(() => {
    if (!audio) return

    if (isAuthenticated && !isPlaying) {
      // Start playing when user is authenticated
      audio.play().catch((error) => {
        // Autoplay might be blocked by browser
        console.log("[Music] Autoplay blocked:", error.message)
      })
      setIsPlaying(true)
    } else if (!isAuthenticated && isPlaying) {
      // Stop playing when user logs out
      audio.pause()
      audio.currentTime = 0
      setIsPlaying(false)
    }
  }, [isAuthenticated, audio, isPlaying])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    }
  }, [audio])

  return null
}
