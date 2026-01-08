"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Zap, ShieldAlert, FileCheck } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getSystemSettings, getAuditLogs, updateSystemSettings, initializeStorage } from "@/lib/storage"
import { addAuditLog } from "@/lib/audit-logger"
import { useToast } from "@/hooks/use-toast"
import { BackButton } from "@/components/back-button"
import type { SystemSettings } from "@/lib/mock-data"

export default function AdminSettingsPage() {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null)
  const [expirationDays, setExpirationDays] = useState(30)
  const [auditLogs, setAuditLogs] = useState(getAuditLogs())

  useEffect(() => {
    initializeStorage()
    const settings = getSystemSettings()
    setSystemSettings(settings)
    setExpirationDays(settings?.itemExpirationDays || 30)
    setAuditLogs(getAuditLogs())
  }, [])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  const handleSaveSettings = () => {
    if (expirationDays < 1 || expirationDays > 365) {
      toast({
        title: "Error",
        description: "Expiration days must be between 1 and 365",
        variant: "destructive",
      })
      return
    }

    updateSystemSettings({ itemExpirationDays: expirationDays }, user.id)
    const updated = getSystemSettings()
    setSystemSettings(updated)
    addAuditLog("system_settings_updated", "System settings updated", user.id, user.name, `Item expiration period changed to ${expirationDays} days`, "info")
    toast({
      title: "Settings Updated",
      description: `Item expiration period set to ${expirationDays} days.`,
    })
  }

  const getTimeAgo = (timestamp: string) => {
    const now = Date.now()
    const logTime = new Date(timestamp).getTime()
    const diff = now - logTime
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallbackHref="/admin" />
          </div>
          <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-foreground">System Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Configure system-wide settings and preferences</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* System Settings */}
            <Card className="bg-card border-border shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between bg-primary/5">
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase italic flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    System Settings
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium">
                    Configure system-wide settings and preferences
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold">Item Expiration Period (Days)</Label>
                    <p className="text-xs text-muted-foreground">
                      Set how many days items remain available before automatic expiration. Current: {systemSettings?.itemExpirationDays || 30} days
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={expirationDays}
                        onChange={(e) => setExpirationDays(parseInt(e.target.value) || 30)}
                        className="w-32 bg-muted/50"
                      />
                      <Button onClick={handleSaveSettings} className="bg-primary font-black uppercase italic">
                        Save Settings
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* System Health & Recent Events */}
          <div className="space-y-6">
            <Card className="bg-card border-border p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" /> System Health
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vault Integrity</span>
                  <span className="text-emerald-500 font-bold font-mono">100.0%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-full animate-pulse" />
                </div>
                <div className="flex justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Audit Stream</span>
                  <span className="text-primary font-bold font-mono">ACTIVE</span>
                </div>
              </div>
            </Card>

            <Card className="bg-card border-border p-6 h-fit">
              <h3 className="text-lg font-bold mb-6">Recent Security Events</h3>
              <div className="space-y-6">
                {auditLogs.slice(0, 5).map((log) => {
                  const getIcon = () => {
                    if (log.type.includes("claim")) return FileCheck
                    if (log.severity === "error" || log.severity === "critical") return ShieldAlert
                    return Zap
                  }
                  const Icon = getIcon()
                  const isAlert = log.severity === "error" || log.severity === "critical"
                  return (
                    <div key={log.id} className="flex gap-4 items-start">
                      <div
                        className={`p-2 rounded-md ${isAlert ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{log.userName || "System"}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">{log.action}</p>
                        <p className="text-[10px] text-primary/60 font-mono mt-1">{getTimeAgo(log.timestamp)}</p>
                      </div>
                    </div>
                  )
                })}
                {auditLogs.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No recent events</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

