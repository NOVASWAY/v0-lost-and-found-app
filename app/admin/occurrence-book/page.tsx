"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShieldAlert, Plus, Edit, Trash2, Search, Calendar, MapPin, Clock, X, Printer, Upload, Link as LinkIcon, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { occurrenceBookApi, occurrenceCategoriesApi, itemsApi, claimsApi, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { BackButton } from "@/components/back-button"
import { sanitizeInput, sanitizeTextContent, sanitizeSearchQuery, sanitizeDate, escapeHtml } from "@/lib/client-security"

const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]
const MAX_FILE_SIZE = 5 * 1024 * 1024

export default function AdminOccurrenceBookPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [occurrences, setOccurrences] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [claims, setClaims] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterSeverity, setFilterSeverity] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOccurrence, setEditingOccurrence] = useState<any | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string; title: string } | null>(null)
  const [newOccurrence, setNewOccurrence] = useState<Partial<any>>({
    title: "",
    categoryId: "",
    description: "",
    location: "",
    severity: "medium",
    status: "open",
    occurrenceDate: new Date().toISOString().split("T")[0],
    occurrenceTime: "",
    notes: "",
    followUpRequired: false,
    followUpNotes: "",
    linkedItemId: "",
    linkedClaimId: "",
    attachments: [],
  })
  const [isLoaded, setIsLoaded] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [occRes, catRes] = await Promise.all([
          occurrenceBookApi.getAll(),
          occurrenceCategoriesApi.getAll(),
        ])
        setOccurrences(occRes.occurrences)
        setCategories(catRes.categories)

        try {
          const itemRes = await itemsApi.getAll()
          setItems(itemRes.items)
        } catch {
          setItems([])
        }

        try {
          const claimRes = await claimsApi.getAll()
          setClaims(claimRes.claims)
        } catch {
          setClaims([])
        }
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to load occurrence book data"
        toast({ title: "Error", description: message, variant: "destructive" })
      } finally {
        setIsLoaded(true)
      }
    }
    fetchData()
  }, [toast])

  useEffect(() => {
    if (isLoaded && !isAuthenticated) {
      router.push("/login")
      return
    }
    if (isLoaded && user?.role !== "admin") {
      router.push("/dashboard")
      return
    }
  }, [isLoaded, isAuthenticated, user, router])

  if (!isLoaded || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
          <div className="mb-6 sm:mb-8 space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-80 bg-muted animate-pulse rounded" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 w-full bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    )
  }

  const filteredOccurrences = occurrences.filter((o: any) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      o.title.toLowerCase().includes(searchLower) ||
      o.description?.toLowerCase().includes(searchLower) ||
      o.location?.toLowerCase().includes(searchLower) ||
      o.notes?.toLowerCase().includes(searchLower)
    const matchesCategory = !filterCategory || o.categoryId === filterCategory
    const matchesSeverity = !filterSeverity || o.severity === filterSeverity
    const matchesStatus = !filterStatus || o.status === filterStatus
    return matchesSearch && matchesCategory && matchesSeverity && matchesStatus
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast({ title: "Error", description: "Invalid file type. Allowed: PNG, JPG, GIF, WebP", variant: "destructive" })
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "Error", description: "File too large. Maximum size is 5MB", variant: "destructive" })
      return
    }

    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Upload failed")
      }

      const data = await response.json()
      const attachment = { url: data.url, name: file.name, type: file.type }

      setNewOccurrence({
        ...newOccurrence,
        attachments: [...(newOccurrence.attachments || []), attachment],
      })

      toast({ title: "Success", description: "File uploaded successfully" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload file"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setUploadingFile(false)
      e.target.value = ""
    }
  }

  const handleRemoveAttachment = (index: number) => {
    const attachments = [...(newOccurrence.attachments || [])]
    attachments.splice(index, 1)
    setNewOccurrence({ ...newOccurrence, attachments })
  }

  const handleSaveOccurrence = async () => {
    const sanitizedTitle = sanitizeInput(newOccurrence.title || "")
    const sanitizedDescription = sanitizeTextContent(newOccurrence.description || "")
    const sanitizedLocation = newOccurrence.location ? sanitizeInput(newOccurrence.location) : undefined
    const sanitizedNotes = newOccurrence.notes ? sanitizeTextContent(newOccurrence.notes) : undefined
    const sanitizedFollowUpNotes = newOccurrence.followUpNotes ? sanitizeTextContent(newOccurrence.followUpNotes) : undefined
    const sanitizedDate = newOccurrence.occurrenceDate ? sanitizeDate(newOccurrence.occurrenceDate) : ""

    if (!sanitizedTitle || !sanitizedDescription || !sanitizedDate || !newOccurrence.categoryId) {
      toast({
        title: "Error",
        description: "Title, description, category, and occurrence date are required",
        variant: "destructive",
      })
      return
    }

    const payload: Record<string, unknown> = {
      title: sanitizedTitle,
      categoryId: newOccurrence.categoryId,
      description: sanitizedDescription,
      location: sanitizedLocation,
      severity: newOccurrence.severity || "medium",
      status: newOccurrence.status || "open",
      occurrenceDate: sanitizedDate,
      occurrenceTime: newOccurrence.occurrenceTime || undefined,
      notes: sanitizedNotes,
      followUpRequired: newOccurrence.followUpRequired || false,
      followUpNotes: newOccurrence.followUpRequired ? sanitizedFollowUpNotes : undefined,
      linkedItemId: newOccurrence.linkedItemId || undefined,
      linkedClaimId: newOccurrence.linkedClaimId || undefined,
      attachments: newOccurrence.attachments || [],
    }

    try {
      if (editingOccurrence) {
        await occurrenceBookApi.update(editingOccurrence.id, payload)
        toast({
          title: "Success",
          description: "Occurrence updated successfully",
        })
      } else {
        await occurrenceBookApi.create(payload)
        toast({
          title: "Success",
          description: "Occurrence created successfully",
        })
      }
      const res = await occurrenceBookApi.getAll()
      setOccurrences(res.occurrences)
      setIsDialogOpen(false)
      setTimeout(() => {
        setEditingOccurrence(null)
        resetForm()
      }, 100)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to save occurrence"
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

  const handleEdit = (occurrence: any) => {
    setEditingOccurrence(occurrence)
    setNewOccurrence({
      title: occurrence.title,
      categoryId: occurrence.categoryId || "",
      description: occurrence.description,
      location: occurrence.location || "",
      severity: occurrence.severity,
      status: occurrence.status,
      occurrenceDate: occurrence.occurrenceDate,
      occurrenceTime: occurrence.occurrenceTime || "",
      notes: occurrence.notes || "",
      followUpRequired: occurrence.followUpRequired || false,
      followUpNotes: occurrence.followUpNotes || "",
      linkedItemId: occurrence.linkedItemId || "",
      linkedClaimId: occurrence.linkedClaimId || "",
      attachments: occurrence.attachments || [],
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string, title: string) => {
    setItemToDelete({ id, title })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    try {
      await occurrenceBookApi.delete(itemToDelete.id)
      toast({
        title: "Success",
        description: "Occurrence deleted successfully",
      })
      const res = await occurrenceBookApi.getAll()
      setOccurrences(res.occurrences)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to delete occurrence"
      toast({ title: "Error", description: message, variant: "destructive" })
    }
    setDeleteDialogOpen(false)
    setItemToDelete(null)
  }

  const handlePrint = (occurrence: any) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Please allow popups to print this document",
        variant: "destructive",
      })
      return
    }

    const categoryName = categories.find((c: any) => c.id === occurrence.categoryId)?.name || "Unknown"
    const linkedItem = occurrence.linkedItemId ? items.find((i: any) => i.id === occurrence.linkedItemId) : null
    const linkedClaim = occurrence.linkedClaimId ? claims.find((c: any) => c.id === occurrence.linkedClaimId) : null

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Occurrence Book Entry - ${escapeHtml(occurrence.title)}</title>
  <style>
    @page {
      margin: 1in;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
      padding: 20px;
    }
    .header {
      border-bottom: 3px solid #000;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .header h1 {
      font-size: 22pt;
      font-weight: bold;
      margin-bottom: 5px;
      color: #000;
    }
    .entry-number {
      font-size: 12pt;
      color: #555;
      margin-bottom: 10px;
    }
    .meta-info {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      font-size: 10pt;
      color: #333;
      margin-top: 10px;
    }
    .meta-info div {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #ccc;
      color: #000;
    }
    .section-content {
      font-size: 11pt;
      line-height: 1.8;
      color: #333;
    }
    .description {
      white-space: pre-wrap;
    }
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 3px;
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    .severity-low { background: #d1fae5; color: #065f46; }
    .severity-medium { background: #fef3c7; color: #92400e; }
    .severity-high { background: #fed7aa; color: #9a3412; }
    .severity-critical { background: #fecaca; color: #991b1b; }
    .status-open { background: #dbeafe; color: #1e40af; }
    .status-investigating { background: #fef3c7; color: #92400e; }
    .status-resolved { background: #d1fae5; color: #065f46; }
    .status-closed { background: #e5e7eb; color: #374151; }
    .notes {
      white-space: pre-wrap;
      font-size: 11pt;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ccc;
      font-size: 10pt;
      color: #666;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="entry-number">Entry #${String(occurrence.entryNumber).padStart(4, "0")}</div>
    <h1>${escapeHtml(occurrence.title)}</h1>
    <div style="margin-top: 8px;">
      <span class="badge severity-${occurrence.severity}">${escapeHtml(occurrence.severity)}</span>
      <span class="badge status-${occurrence.status}" style="margin-left: 8px;">${escapeHtml(occurrence.status)}</span>
      <span class="badge" style="background: #e0e7ff; color: #3730a3; margin-left: 8px;">${escapeHtml(categoryName)}</span>
    </div>
    <div class="meta-info">
      <div><strong>Date:</strong> ${new Date(occurrence.occurrenceDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      ${occurrence.occurrenceTime ? `<div><strong>Time:</strong> ${escapeHtml(occurrence.occurrenceTime)}</div>` : ''}
      ${occurrence.location ? `<div><strong>Location:</strong> ${escapeHtml(occurrence.location)}</div>` : ''}
      <div><strong>Reported by:</strong> ${escapeHtml(occurrence.reportedByName || occurrence.reportedBy || "Unknown")}</div>
      <div><strong>Created:</strong> ${new Date(occurrence.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Description</div>
    <div class="section-content description">${escapeHtml(occurrence.description)}</div>
  </div>

  ${occurrence.notes ? `
  <div class="section">
    <div class="section-title">Staff Notes</div>
    <div class="section-content notes">${escapeHtml(occurrence.notes)}</div>
  </div>
  ` : ''}

  ${occurrence.followUpRequired ? `
  <div class="section">
    <div class="section-title">Follow-up Required</div>
    <div class="section-content">
      <p style="color: #92400e; font-weight: bold;">This occurrence requires follow-up.</p>
      ${occurrence.followUpNotes ? `<p style="margin-top: 8px;" class="notes">${escapeHtml(occurrence.followUpNotes)}</p>` : ''}
    </div>
  </div>
  ` : ''}

  ${linkedItem ? `
  <div class="section">
    <div class="section-title">Linked Item</div>
    <div class="section-content">
      <p><strong>Item:</strong> ${escapeHtml(linkedItem.description || linkedItem.category || "Unknown item")}</p>
      <p><strong>Category:</strong> ${escapeHtml(linkedItem.category || "N/A")}</p>
      <p><strong>Location:</strong> ${escapeHtml(linkedItem.location || "N/A")}</p>
      <p><strong>Status:</strong> ${escapeHtml(linkedItem.status || "N/A")}</p>
    </div>
  </div>
  ` : ''}

  ${linkedClaim ? `
  <div class="section">
    <div class="section-title">Linked Claim</div>
    <div class="section-content">
      <p><strong>Claimant:</strong> ${escapeHtml(linkedClaim.claimantName || "Unknown")}</p>
      <p><strong>Status:</strong> ${escapeHtml(linkedClaim.status || "N/A")}</p>
      ${linkedClaim.notes ? `<p><strong>Notes:</strong> ${escapeHtml(linkedClaim.notes)}</p>` : ''}
    </div>
  </div>
  ` : ''}

  ${occurrence.attachments && occurrence.attachments.length > 0 ? `
  <div class="section">
    <div class="section-title">Attachments</div>
    <div class="section-content">
      <ul>
        ${occurrence.attachments.map((att: any) => `<li>${escapeHtml(att.name)}</li>`).join('')}
      </ul>
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Document generated on:</strong> ${new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    <p><em>This is a printed copy of the occurrence book entry. For the most up-to-date version, please refer to the system.</em></p>
  </div>

  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() {
        window.close();
      };
    };
  </script>
</body>
</html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  const resetForm = () => {
    setNewOccurrence({
      title: "",
      categoryId: "",
      description: "",
      location: "",
      severity: "medium",
      status: "open",
      occurrenceDate: new Date().toISOString().split("T")[0],
      occurrenceTime: "",
      notes: "",
      followUpRequired: false,
      followUpNotes: "",
      linkedItemId: "",
      linkedClaimId: "",
      attachments: [],
    })
    setEditingOccurrence(null)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low": return "bg-green-100 text-green-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "high": return "bg-orange-100 text-orange-800"
      case "critical": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-800"
      case "investigating": return "bg-yellow-100 text-yellow-800"
      case "resolved": return "bg-green-100 text-green-800"
      case "closed": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c: any) => c.id === categoryId)
    return category?.name || "Unknown"
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c: any) => c.id === categoryId)
    return category?.color || "#6b7280"
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
              <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">Occurrence Book</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Track and manage security occurrences and incidents</p>
            </div>
            <Button onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) {
                handleDialogClose()
              }
            }}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingOccurrence ? "Edit Occurrence" : "New Occurrence Entry"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newOccurrence.title || ""}
                      onChange={(e) => setNewOccurrence({ ...newOccurrence, title: e.target.value })}
                      placeholder="Brief title of the occurrence"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={newOccurrence.categoryId || ""}
                        onValueChange={(value) => setNewOccurrence({ ...newOccurrence, categoryId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat: any) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="severity">Severity *</Label>
                      <Select
                        value={newOccurrence.severity || "medium"}
                        onValueChange={(value) => setNewOccurrence({ ...newOccurrence, severity: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={newOccurrence.description || ""}
                      onChange={(e) => setNewOccurrence({ ...newOccurrence, description: e.target.value })}
                      placeholder="Detailed description of the occurrence"
                      rows={4}
                      maxLength={10000}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newOccurrence.location || ""}
                        onChange={(e) => setNewOccurrence({ ...newOccurrence, location: e.target.value })}
                        placeholder="Where the occurrence happened"
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status *</Label>
                      <Select
                        value={newOccurrence.status || "open"}
                        onValueChange={(value) => setNewOccurrence({ ...newOccurrence, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="investigating">Investigating</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="occurrenceDate">Occurrence Date *</Label>
                      <Input
                        id="occurrenceDate"
                        type="date"
                        value={newOccurrence.occurrenceDate || ""}
                        onChange={(e) => setNewOccurrence({ ...newOccurrence, occurrenceDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="occurrenceTime">Occurrence Time</Label>
                      <Input
                        id="occurrenceTime"
                        type="time"
                        value={newOccurrence.occurrenceTime || ""}
                        onChange={(e) => setNewOccurrence({ ...newOccurrence, occurrenceTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Staff Notes</Label>
                    <Textarea
                      id="notes"
                      value={newOccurrence.notes || ""}
                      onChange={(e) => setNewOccurrence({ ...newOccurrence, notes: e.target.value })}
                      placeholder="Internal staff notes (not visible to public)"
                      rows={3}
                      maxLength={10000}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="followUpRequired"
                        checked={newOccurrence.followUpRequired || false}
                        onCheckedChange={(checked) => setNewOccurrence({ ...newOccurrence, followUpRequired: !!checked, followUpNotes: checked ? newOccurrence.followUpNotes : "" })}
                      />
                      <Label htmlFor="followUpRequired" className="cursor-pointer">Follow-up Required</Label>
                    </div>
                    {newOccurrence.followUpRequired && (
                      <div>
                        <Label htmlFor="followUpNotes">Follow-up Notes</Label>
                        <Textarea
                          id="followUpNotes"
                          value={newOccurrence.followUpNotes || ""}
                          onChange={(e) => setNewOccurrence({ ...newOccurrence, followUpNotes: e.target.value })}
                          placeholder="Describe what follow-up is needed"
                          rows={2}
                          maxLength={5000}
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="linkedItem">Linked Item</Label>
                      <Select
                        value={newOccurrence.linkedItemId || ""}
                        onValueChange={(value) => setNewOccurrence({ ...newOccurrence, linkedItemId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((item: any) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.description || item.category} ({item.category})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="linkedClaim">Linked Claim</Label>
                      <Select
                        value={newOccurrence.linkedClaimId || ""}
                        onValueChange={(value) => setNewOccurrence({ ...newOccurrence, linkedClaimId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          {claims.map((claim: any) => (
                            <SelectItem key={claim.id} value={claim.id}>
                              {claim.itemName || "Item"} - {claim.claimantName || "Claimant"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>File Attachments</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        id="fileUpload"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("fileUpload")?.click()}
                        disabled={uploadingFile}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {uploadingFile ? "Uploading..." : "Upload Image"}
                      </Button>
                    </div>
                    {newOccurrence.attachments && newOccurrence.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {newOccurrence.attachments.map((att: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between rounded-md border p-2">
                            <div className="flex items-center gap-2 text-sm">
                              <LinkIcon className="h-4 w-4 text-muted-foreground" />
                              <span>{att.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAttachment(idx)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveOccurrence}>{editingOccurrence ? "Update" : "Create"}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search occurrences..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(sanitizeSearchQuery(e.target.value))}
                maxLength={200}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Occurrences List */}
        {filteredOccurrences.length === 0 ? (
          <Card className="p-12 text-center">
            <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No occurrences found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOccurrences
              .sort((a, b) => new Date(b.occurrenceDate).getTime() - new Date(a.occurrenceDate).getTime())
              .map((occurrence: any) => (
                <Card key={occurrence.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          OB-{String(occurrence.entryNumber).padStart(4, "0")}
                        </Badge>
                        <h3 className="text-lg font-semibold text-card-foreground">{occurrence.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className={getSeverityColor(occurrence.severity)}>
                          {occurrence.severity}
                        </Badge>
                        <Badge className={getStatusColor(occurrence.status)}>
                          {occurrence.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          style={{ borderColor: getCategoryColor(occurrence.categoryId), color: getCategoryColor(occurrence.categoryId) }}
                        >
                          {getCategoryName(occurrence.categoryId)}
                        </Badge>
                        {occurrence.followUpRequired && (
                          <Badge className="bg-amber-100 text-amber-800">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Follow-up
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handlePrint(occurrence)} title="Print">
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(occurrence)} title="Edit">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(occurrence.id, occurrence.title)} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {occurrence.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{occurrence.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(occurrence.occurrenceDate).toLocaleDateString()}
                    </div>
                    {occurrence.occurrenceTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {occurrence.occurrenceTime}
                      </div>
                    )}
                    {occurrence.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {occurrence.location}
                      </div>
                    )}
                  </div>
                  {occurrence.linkedItemId && (
                    <div className="text-sm text-muted-foreground mb-1">
                      <LinkIcon className="inline h-3 w-3 mr-1" />
                      Linked to item: {items.find((i: any) => i.id === occurrence.linkedItemId)?.description || items.find((i: any) => i.id === occurrence.linkedItemId)?.category || "Unknown item"}
                    </div>
                  )}
                  {occurrence.linkedClaimId && (
                    <div className="text-sm text-muted-foreground mb-1">
                      <LinkIcon className="inline h-3 w-3 mr-1" />
                      Linked to claim: {claims.find((c: any) => c.id === occurrence.linkedClaimId)?.claimantName || "Unknown claimant"}
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    Reported by {occurrence.reportedByName || occurrence.reportedBy || "Unknown"} on {new Date(occurrence.createdAt).toLocaleDateString()}
                  </div>
                </Card>
              ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Occurrence</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the occurrence &quot;{itemToDelete?.title}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteDialogOpen(false)
                setItemToDelete(null)
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
