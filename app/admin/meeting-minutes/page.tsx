"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Plus, Edit, Trash2, Search, Calendar, Users, CheckCircle, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getMeetingMinutes, addMeetingMinutes, updateMeetingMinutes, deleteMeetingMinutes, getUsers, initializeStorage } from "@/lib/storage"
import { addAuditLog } from "@/lib/audit-logger"
import { useToast } from "@/hooks/use-toast"
import { BackButton } from "@/components/back-button"
import type { MeetingMinutes } from "@/lib/mock-data"

export default function AdminMeetingMinutesPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [minutes, setMinutes] = useState<MeetingMinutes[]>(getMeetingMinutes())
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMinutes, setEditingMinutes] = useState<MeetingMinutes | null>(null)
  const [users, setUsers] = useState(getUsers())
  const [newMinutes, setNewMinutes] = useState<Partial<MeetingMinutes>>({
    title: "",
    meetingDate: new Date().toISOString().split("T")[0],
    location: "",
    attendees: [],
    agenda: [],
    discussion: "",
    actionItems: [],
    decisions: [],
    nextMeetingDate: "",
  })
  const [newAttendee, setNewAttendee] = useState("")
  const [newAgendaItem, setNewAgendaItem] = useState("")
  const [newDecision, setNewDecision] = useState("")
  const [newActionItem, setNewActionItem] = useState({ item: "", assignedTo: "", dueDate: "" })

  useEffect(() => {
    initializeStorage()
    setMinutes(getMeetingMinutes())
    setUsers(getUsers())
  }, [])

  // Refresh minutes when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setMinutes(getMeetingMinutes())
    }
  }, [isDialogOpen])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  const filteredMinutes = minutes.filter((m) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      m.title.toLowerCase().includes(searchLower) ||
      m.location?.toLowerCase().includes(searchLower) ||
      m.attendees.some((a) => a.toLowerCase().includes(searchLower)) ||
      m.discussion.toLowerCase().includes(searchLower)
    )
  })

  const handleAddAttendee = () => {
    if (newAttendee.trim() && !newMinutes.attendees?.includes(newAttendee.trim())) {
      setNewMinutes({
        ...newMinutes,
        attendees: [...(newMinutes.attendees || []), newAttendee.trim()],
      })
      setNewAttendee("")
    }
  }

  const handleRemoveAttendee = (attendee: string) => {
    setNewMinutes({
      ...newMinutes,
      attendees: newMinutes.attendees?.filter((a) => a !== attendee) || [],
    })
  }

  const handleAddAgendaItem = () => {
    if (newAgendaItem.trim()) {
      setNewMinutes({
        ...newMinutes,
        agenda: [...(newMinutes.agenda || []), newAgendaItem.trim()],
      })
      setNewAgendaItem("")
    }
  }

  const handleRemoveAgendaItem = (index: number) => {
    const newAgenda = [...(newMinutes.agenda || [])]
    newAgenda.splice(index, 1)
    setNewMinutes({ ...newMinutes, agenda: newAgenda })
  }

  const handleAddDecision = () => {
    if (newDecision.trim()) {
      setNewMinutes({
        ...newMinutes,
        decisions: [...(newMinutes.decisions || []), newDecision.trim()],
      })
      setNewDecision("")
    }
  }

  const handleRemoveDecision = (index: number) => {
    const newDecisions = [...(newMinutes.decisions || [])]
    newDecisions.splice(index, 1)
    setNewMinutes({ ...newMinutes, decisions: newDecisions })
  }

  const handleAddActionItem = () => {
    if (newActionItem.item.trim() && newActionItem.assignedTo.trim()) {
      setNewMinutes({
        ...newMinutes,
        actionItems: [
          ...(newMinutes.actionItems || []),
          {
            item: newActionItem.item.trim(),
            assignedTo: newActionItem.assignedTo.trim(),
            dueDate: newActionItem.dueDate || undefined,
            status: "pending",
          },
        ],
      })
      setNewActionItem({ item: "", assignedTo: "", dueDate: "" })
    } else {
      toast({
        title: "Error",
        description: "Action item and assigned to are required",
        variant: "destructive",
      })
    }
  }

  const handleUpdateActionItemStatus = (minuteId: string, actionIndex: number, newStatus: "pending" | "in_progress" | "completed") => {
    const minute = minutes.find((m) => m.id === minuteId)
    if (!minute) return

    const updatedActionItems = [...minute.actionItems]
    updatedActionItems[actionIndex] = {
      ...updatedActionItems[actionIndex],
      status: newStatus,
    }

    updateMeetingMinutes(minuteId, {
      actionItems: updatedActionItems,
    } as Partial<MeetingMinutes>)
    
    addAuditLog(
      "meeting_minutes_updated",
      "Action item status updated",
      user.id,
      user.name,
      `Action item status updated to ${newStatus}`,
      "info"
    )
    
    toast({
      title: "Success",
      description: "Action item status updated",
    })
    
    setMinutes(getMeetingMinutes())
  }

  const handleRemoveActionItem = (index: number) => {
    const newActionItems = [...(newMinutes.actionItems || [])]
    newActionItems.splice(index, 1)
    setNewMinutes({ ...newMinutes, actionItems: newActionItems })
  }

  const handleSaveMinutes = () => {
    if (!newMinutes.title || !newMinutes.meetingDate) {
      toast({
        title: "Error",
        description: "Title and meeting date are required",
        variant: "destructive",
      })
      return
    }

    if (editingMinutes) {
      updateMeetingMinutes(editingMinutes.id, {
        ...newMinutes,
        updatedAt: new Date().toISOString(),
      } as Partial<MeetingMinutes>)
      addAuditLog("meeting_minutes_updated", "Meeting minutes updated", user.id, user.name, `Meeting minutes '${editingMinutes.title}' updated`, "info")
      toast({
        title: "Success",
        description: "Meeting minutes updated successfully",
      })
      setMinutes(getMeetingMinutes())
      setIsDialogOpen(false)
      setTimeout(() => {
        setEditingMinutes(null)
        resetForm()
      }, 100)
    } else {
      const meetingMinutes: MeetingMinutes = {
        id: `mm${Date.now()}`,
        title: newMinutes.title!,
        meetingDate: newMinutes.meetingDate!,
        location: newMinutes.location || undefined,
        attendees: newMinutes.attendees || [],
        agenda: newMinutes.agenda || [],
        discussion: newMinutes.discussion || "",
        actionItems: newMinutes.actionItems || [],
        decisions: newMinutes.decisions || [],
        nextMeetingDate: newMinutes.nextMeetingDate || undefined,
        recordedBy: user.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      addMeetingMinutes(meetingMinutes)
      addAuditLog("meeting_minutes_created", "Meeting minutes created", user.id, user.name, `Meeting minutes '${meetingMinutes.title}' created`, "info")
      toast({
        title: "Success",
        description: "Meeting minutes created successfully",
      })
      setMinutes(getMeetingMinutes())
      setIsDialogOpen(false)
      setTimeout(() => {
        resetForm()
      }, 100)
    }
  }

  const handleEdit = (minute: MeetingMinutes) => {
    setEditingMinutes(minute)
    setNewMinutes({
      title: minute.title,
      meetingDate: minute.meetingDate,
      location: minute.location || "",
      attendees: [...minute.attendees],
      agenda: [...minute.agenda],
      discussion: minute.discussion,
      actionItems: [...minute.actionItems],
      decisions: [...minute.decisions],
      nextMeetingDate: minute.nextMeetingDate || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the meeting minutes "${title}"?`)) {
      deleteMeetingMinutes(id)
      addAuditLog("meeting_minutes_deleted", "Meeting minutes deleted", user.id, user.name, `Meeting minutes '${title}' deleted`, "warning")
      toast({
        title: "Success",
        description: "Meeting minutes deleted successfully",
      })
      setMinutes(getMeetingMinutes())
    }
  }

  const resetForm = () => {
    setNewMinutes({
      title: "",
      meetingDate: new Date().toISOString().split("T")[0],
      location: "",
      attendees: [],
      agenda: [],
      discussion: "",
      actionItems: [],
      decisions: [],
      nextMeetingDate: "",
    })
    setNewAttendee("")
    setNewAgendaItem("")
    setNewDecision("")
    setNewActionItem({ item: "", assignedTo: "", dueDate: "" })
    setEditingMinutes(null)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallbackHref="/admin" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">Meeting Minutes</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Record and manage meeting minutes</p>
            </div>
            <Button onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Minutes
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) {
                handleDialogClose()
              }
            }}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingMinutes ? "Edit Meeting Minutes" : "Create Meeting Minutes"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newMinutes.title || ""}
                      onChange={(e) => setNewMinutes({ ...newMinutes, title: e.target.value })}
                      placeholder="Meeting title"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="meetingDate">Meeting Date *</Label>
                      <Input
                        id="meetingDate"
                        type="date"
                        value={newMinutes.meetingDate || ""}
                        onChange={(e) => setNewMinutes({ ...newMinutes, meetingDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newMinutes.location || ""}
                        onChange={(e) => setNewMinutes({ ...newMinutes, location: e.target.value })}
                        placeholder="Meeting location"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Attendees</Label>
                    <div className="flex gap-2 mb-2">
                      <Select value={newAttendee} onValueChange={setNewAttendee}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select attendee" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((u) => (
                            <SelectItem key={u.id} value={u.name}>
                              {u.name} ({u.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" onClick={handleAddAttendee} variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newMinutes.attendees?.map((attendee, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                          {attendee}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveAttendee(attendee)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Agenda Items</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newAgendaItem}
                        onChange={(e) => setNewAgendaItem(e.target.value)}
                        placeholder="Add agenda item"
                        onKeyPress={(e) => e.key === "Enter" && handleAddAgendaItem()}
                      />
                      <Button type="button" onClick={handleAddAgendaItem} variant="outline">
                        Add
                      </Button>
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {newMinutes.agenda?.map((item, idx) => (
                        <li key={idx} className="flex items-center justify-between text-sm">
                          <span>{item}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAgendaItem(idx)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <Label htmlFor="discussion">Discussion/Notes</Label>
                    <Textarea
                      id="discussion"
                      value={newMinutes.discussion || ""}
                      onChange={(e) => setNewMinutes({ ...newMinutes, discussion: e.target.value })}
                      placeholder="Main discussion points and notes"
                      rows={6}
                    />
                  </div>
                  <div>
                    <Label>Decisions Made</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={newDecision}
                        onChange={(e) => setNewDecision(e.target.value)}
                        placeholder="Add decision"
                        onKeyPress={(e) => e.key === "Enter" && handleAddDecision()}
                      />
                      <Button type="button" onClick={handleAddDecision} variant="outline">
                        Add
                      </Button>
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {newMinutes.decisions?.map((decision, idx) => (
                        <li key={idx} className="flex items-center justify-between text-sm">
                          <span>{decision}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDecision(idx)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <Label>Action Items</Label>
                    <div className="space-y-2 mb-2">
                      <Input
                        placeholder="Action item"
                        value={newActionItem.item}
                        onChange={(e) => setNewActionItem({ ...newActionItem, item: e.target.value })}
                        onKeyPress={(e) => e.key === "Enter" && e.preventDefault()}
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Select value={newActionItem.assignedTo} onValueChange={(value) => setNewActionItem({ ...newActionItem, assignedTo: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Assigned to" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((u) => (
                              <SelectItem key={u.id} value={u.name}>
                                {u.name} ({u.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          placeholder="Due date"
                          value={newActionItem.dueDate}
                          onChange={(e) => setNewActionItem({ ...newActionItem, dueDate: e.target.value })}
                        />
                      </div>
                      <Button type="button" onClick={handleAddActionItem} variant="outline" className="w-full">
                        Add Action Item
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {newMinutes.actionItems?.map((actionItem, idx) => (
                        <Card key={idx} className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{actionItem.item}</p>
                              <p className="text-xs text-muted-foreground">Assigned to: {actionItem.assignedTo}</p>
                              {actionItem.dueDate && (
                                <p className="text-xs text-muted-foreground">Due: {new Date(actionItem.dueDate).toLocaleDateString()}</p>
                              )}
                              <Badge variant={actionItem.status === "completed" ? "default" : "secondary"} className="mt-1">
                                {actionItem.status}
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveActionItem(idx)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="nextMeetingDate">Next Meeting Date</Label>
                    <Input
                      id="nextMeetingDate"
                      type="date"
                      value={newMinutes.nextMeetingDate || ""}
                      onChange={(e) => setNewMinutes({ ...newMinutes, nextMeetingDate: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveMinutes}>{editingMinutes ? "Update" : "Create"}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search meeting minutes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </Card>

        {/* Meeting Minutes List */}
        {filteredMinutes.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No meeting minutes found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredMinutes
              .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime())
              .map((minute) => (
                <Card key={minute.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-card-foreground mb-2">{minute.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(minute.meetingDate).toLocaleDateString()}
                        </div>
                        {minute.location && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {minute.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {minute.attendees.length} attendees
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(minute)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(minute.id, minute.title)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {minute.agenda.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Agenda:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {minute.agenda.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {minute.discussion && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Discussion:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{minute.discussion}</p>
                    </div>
                  )}
                  {minute.decisions.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Decisions:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {minute.decisions.map((decision, idx) => (
                          <li key={idx}>{decision}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {minute.actionItems.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Action Items:</h4>
                      <div className="space-y-2">
                        {minute.actionItems.map((actionItem, idx) => (
                          <Card key={idx} className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1">
                                <CheckCircle className={`h-4 w-4 mt-0.5 ${actionItem.status === "completed" ? "text-green-500" : "text-muted-foreground"}`} />
                                <div className="flex-1">
                                  <p className={`text-sm ${actionItem.status === "completed" ? "line-through text-muted-foreground" : "text-card-foreground"}`}>
                                    {actionItem.item}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Assigned to: {actionItem.assignedTo}
                                    {actionItem.dueDate && ` • Due: ${new Date(actionItem.dueDate).toLocaleDateString()}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={actionItem.status}
                                  onValueChange={(value: "pending" | "in_progress" | "completed") =>
                                    handleUpdateActionItemStatus(minute.id, idx, value)
                                  }
                                >
                                  <SelectTrigger className="w-[120px] h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  {minute.nextMeetingDate && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Next Meeting:</strong> {new Date(minute.nextMeetingDate).toLocaleDateString()}
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    Recorded by {minute.recordedBy} on {new Date(minute.createdAt).toLocaleDateString()}
                  </div>
                </Card>
              ))}
          </div>
        )}
      </main>
    </div>
  )
}

