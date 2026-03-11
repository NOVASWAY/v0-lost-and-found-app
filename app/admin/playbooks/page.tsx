"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BookOpen, Plus, Edit, Trash2, Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getPlaybooks, addPlaybook, updatePlaybook, deletePlaybook, initializeStorage } from "@/lib/storage"
import { addAuditLog } from "@/lib/audit-logger"
import { useToast } from "@/hooks/use-toast"
import { BackButton } from "@/components/back-button"
import type { Playbook } from "@/lib/mock-data"

export default function AdminPlaybooksPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [playbooks, setPlaybooks] = useState<Playbook[]>(getPlaybooks())
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null)
  const [newPlaybook, setNewPlaybook] = useState<Partial<Playbook>>({
    title: "",
    scenario: "",
    protocol: "",
    priority: "medium",
  })

  useEffect(() => {
    initializeStorage()
    setPlaybooks(getPlaybooks())
  }, [])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== "admin") {
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

  const handleSavePlaybook = () => {
    if (!newPlaybook.title || !newPlaybook.protocol) {
      toast({
        title: "Error",
        description: "Title and protocol are required",
        variant: "destructive",
      })
      return
    }

    if (editingPlaybook) {
      updatePlaybook(editingPlaybook.id, {
        ...newPlaybook,
        updatedAt: new Date().toISOString(),
      } as Partial<Playbook>)
      addAuditLog("playbook_updated", "Playbook updated", user.id, user.name, `Playbook '${editingPlaybook.title}' updated`, "info")
      toast({
        title: "Success",
        description: "Playbook updated successfully",
      })
      setPlaybooks(getPlaybooks())
      setIsDialogOpen(false)
      setEditingPlaybook(null)
      setNewPlaybook({ title: "", scenario: "", protocol: "", priority: "medium" })
    } else {
      const playbook: Playbook = {
        id: `pb${Date.now()}`,
        title: newPlaybook.title,
        scenario: newPlaybook.scenario || "",
        protocol: newPlaybook.protocol,
        priority: (newPlaybook.priority as any) || "medium",
        updatedAt: new Date().toISOString(),
      }
      addPlaybook(playbook)
      addAuditLog("playbook_created", "Playbook created", user.id, user.name, `Playbook '${playbook.title}' created`, "info")
      toast({
        title: "Success",
        description: "Playbook created successfully",
      })
      setPlaybooks(getPlaybooks())
      setIsDialogOpen(false)
      setNewPlaybook({ title: "", scenario: "", protocol: "", priority: "medium" })
    }
  }

  const handleDeletePlaybook = (id: string) => {
    if (!confirm("Are you sure you want to delete this playbook?")) return

    const playbook = playbooks.find((pb) => pb.id === id)
    if (playbook) {
      deletePlaybook(id)
      addAuditLog("playbook_deleted", "Playbook deleted", user.id, user.name, `Playbook '${playbook.title}' deleted`, "warning")
      toast({
        title: "Success",
        description: "Playbook deleted successfully",
      })
      setPlaybooks(getPlaybooks())
    }
  }

  const openEditDialog = (pb: Playbook) => {
    setEditingPlaybook(pb)
    setNewPlaybook(pb)
    setIsDialogOpen(true)
  }

  const openNewDialog = () => {
    setEditingPlaybook(null)
    setNewPlaybook({ title: "", scenario: "", protocol: "", priority: "medium" })
    setIsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallbackHref="/admin" />
          </div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Operational Playbooks</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog}>
                  <Plus className="mr-2 w-4 h-4" />
                  New Protocol
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingPlaybook ? "Update Protocol" : "New Protocol"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newPlaybook.title || ""}
                      onChange={(e) => setNewPlaybook({ ...newPlaybook, title: e.target.value })}
                      placeholder="e.g., High-Value Asset Recovery"
                    />
                  </div>
                  <div>
                    <Label htmlFor="scenario">Scenario</Label>
                    <Input
                      id="scenario"
                      value={newPlaybook.scenario || ""}
                      onChange={(e) => setNewPlaybook({ ...newPlaybook, scenario: e.target.value })}
                      placeholder="What triggers this playbook?"
                    />
                  </div>
                  <div>
                    <Label htmlFor="protocol">Protocol *</Label>
                    <textarea
                      id="protocol"
                      value={newPlaybook.protocol || ""}
                      onChange={(e) => setNewPlaybook({ ...newPlaybook, protocol: e.target.value })}
                      placeholder="Detailed instructions..."
                      className="w-full min-h-[150px] bg-background border border-border rounded-md px-3 py-2 text-sm font-mono focus:ring-primary focus:border-primary"
                      rows={8}
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      id="priority"
                      value={newPlaybook.priority || "medium"}
                      onChange={(e) => setNewPlaybook({ ...newPlaybook, priority: e.target.value as any })}
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSavePlaybook}>
                      {editingPlaybook ? "Update" : "Deploy"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">Standard operating procedures for security scenarios</p>
        </div>

        {/* Search */}
        <Card className="mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search playbooks..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* Playbooks List */}
        <Card className="bg-card border-border shadow-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {filteredPlaybooks.map((pb) => (
              <div key={pb.id} className="p-6 hover:bg-muted/30 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded bg-primary/10">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
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
                        <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                          REV: {new Date(pb.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {pb.scenario && (
                        <p className="text-sm text-muted-foreground italic mb-3">Scenario: {pb.scenario}</p>
                      )}
                      <div className="bg-background/50 border border-border/50 p-4 rounded text-sm font-mono leading-relaxed whitespace-pre-wrap">
                        {pb.protocol}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openEditDialog(pb)}
                    >
                      <Edit className="w-4 h-4 text-primary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeletePlaybook(pb.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {filteredPlaybooks.length === 0 && (
              <div className="p-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No playbooks found</p>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}
