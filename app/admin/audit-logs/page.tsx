"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Eye, Download } from "lucide-react"
import { type AuditLog } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { getAuditLogs, initializeStorage } from "@/lib/storage"
import { BackButton } from "@/components/back-button"

export default function AuditLogsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [auditLogs, setAuditLogs] = useState(getAuditLogs())

  useEffect(() => {
    initializeStorage()
    setAuditLogs(getAuditLogs())
  }, [])

  // Protect route - require authentication and admin role
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    if (user?.role !== "admin") {
      router.push("/dashboard")
      return
    }
  }, [isAuthenticated, user, router])

  // Show nothing while checking authentication
  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || log.type === typeFilter
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter

    return matchesSearch && matchesType && matchesSeverity
  })

  const getSeverityColor = (severity: AuditLog["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-destructive text-destructive-foreground"
      case "error":
        return "bg-red-500/20 text-red-500 border-red-500/50"
      case "warning":
        return "bg-amber-500/20 text-amber-500 border-amber-500/50"
      default:
        return "bg-blue-500/20 text-blue-500 border-blue-500/50"
    }
  }

  const getTypeLabel = (type: AuditLog["type"]) => {
    return type
      .split("_")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-8 pb-24 sm:pb-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallbackHref="/admin" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-foreground">Audit Logs</h1>
              <p className="text-muted-foreground">
                Complete immutable record of all system events and security activities
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Logs
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by user, action, or details..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user_created">User Created</SelectItem>
                <SelectItem value="user_deleted">User Deleted</SelectItem>
                <SelectItem value="user_password_changed">Password Changed</SelectItem>
                <SelectItem value="item_uploaded">Item Uploaded</SelectItem>
                <SelectItem value="item_claimed">Item Claimed</SelectItem>
                <SelectItem value="item_released">Item Released</SelectItem>
                <SelectItem value="attendance_marked">Attendance Marked</SelectItem>
                <SelectItem value="service_marked">Service Marked</SelectItem>
                <SelectItem value="location_created">Location Created</SelectItem>
                <SelectItem value="location_updated">Location Updated</SelectItem>
                <SelectItem value="location_deleted">Location Deleted</SelectItem>
                <SelectItem value="playbook_created">Playbook Created</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-4">
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">{auditLogs.length}</p>
            <p className="text-sm text-muted-foreground">Total Logs</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">
              {auditLogs.filter((l) => l.severity === "critical" || l.severity === "error").length}
            </p>
            <p className="text-sm text-muted-foreground">Critical/Errors</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">
              {auditLogs.filter((l) => {
                const today = new Date().toDateString()
                return new Date(l.timestamp).toDateString() === today
              }).length}
            </p>
            <p className="text-sm text-muted-foreground">Today</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-bold text-card-foreground">
              {auditLogs.filter((l) => {
                const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
                return new Date(l.timestamp).getTime() > weekAgo
              }).length}
            </p>
            <p className="text-sm text-muted-foreground">This Week</p>
          </Card>
        </div>

        {/* Audit Logs Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Timestamp</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">User</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Event Type</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Action</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Details</th>
                  <th className="p-4 text-left text-sm font-medium text-muted-foreground">Severity</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0 hover:bg-accent/5 transition-colors">
                    <td className="p-4">
                      <div className="text-sm font-mono text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-card-foreground">{log.userName || "System"}</div>
                      {log.userId && (
                        <div className="text-xs text-muted-foreground font-mono">{log.userId}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(log.type)}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-card-foreground">{log.action}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-muted-foreground max-w-md truncate">{log.details || "-"}</div>
                    </td>
                    <td className="p-4">
                      <Badge className={`${getSeverityColor(log.severity)} border`}>{log.severity.toUpperCase()}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center">
              <Eye className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No audit logs found matching your filters</p>
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}

