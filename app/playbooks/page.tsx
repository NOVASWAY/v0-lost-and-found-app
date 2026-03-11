"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getPlaybooks, initializeStorage } from "@/lib/storage"
import { BackButton } from "@/components/back-button"
import type { Playbook } from "@/lib/mock-data"

export default function PlaybooksPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [playbooks, setPlaybooks] = useState<Playbook[]>(getPlaybooks())
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    initializeStorage()
    setPlaybooks(getPlaybooks())
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const filteredPlaybooks = playbooks.filter((pb) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      pb.title.toLowerCase().includes(searchLower) ||
      pb.scenario.toLowerCase().includes(searchLower) ||
      pb.protocol.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallbackHref="/dashboard" />
          </div>
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">Situational Playbooks</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Read-only access to operational procedures and security protocols
          </p>
        </div>

        {/* Search */}
        <Card className="mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search playbooks by title, scenario, or protocol..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* Playbooks Grid */}
        <div className="grid gap-4">
          {filteredPlaybooks.map((pb) => (
            <Card key={pb.id} className="p-6 hover:border-primary/50 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-primary/10">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={`uppercase text-[10px] font-black ${
                          pb.priority === "critical"
                            ? "bg-destructive"
                            : pb.priority === "high"
                              ? "bg-amber-600"
                              : pb.priority === "medium"
                                ? "bg-primary"
                                : "bg-muted"
                        }`}
                      >
                        {pb.priority}
                      </Badge>
                      <h3 className="font-bold text-lg">{pb.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground italic">Scenario: {pb.scenario}</p>
                  </div>
                </div>
              </div>
              <div className="bg-background/50 border border-border/50 p-4 rounded text-sm font-mono leading-relaxed whitespace-pre-wrap">
                {pb.protocol}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Last updated: {new Date(pb.updatedAt).toLocaleDateString()}
              </p>
            </Card>
          ))}
          {filteredPlaybooks.length === 0 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">No playbooks found</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
