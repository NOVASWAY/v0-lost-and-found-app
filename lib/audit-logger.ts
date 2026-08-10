export type AuditLogType =
  | "user_created"
  | "user_deleted"
  | "user_password_changed"
  | "item_uploaded"
  | "item_claimed"
  | "item_released"
  | "item_donated"
  | "attendance_marked"
  | "service_marked"
  | "location_created"
  | "location_updated"
  | "location_deleted"
  | "playbook_created"
  | "playbook_updated"
  | "playbook_deleted"
  | "mission_created"
  | "mission_assigned"
  | "mission_completed"
  | "mission_cancelled"
  | "system_settings_updated"
  | "login"
  | "logout"
  | "order_sent"
  | "meeting_minutes_created"
  | "meeting_minutes_updated"
  | "meeting_minutes_deleted"

interface AuditLog {
  id: string
  type: AuditLogType
  userId?: string
  userName?: string
  action: string
  details?: string
  timestamp: string
  ipAddress?: string
  severity: "info" | "warning" | "error" | "critical"
}

const AUDIT_LOGS_STORAGE_KEY = "vault_audit_logs"

function addAuditLogToStorage(log: AuditLog) {
  if (typeof window === "undefined") return
  const existing = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY)
  const logs: AuditLog[] = existing ? (JSON.parse(existing) as AuditLog[]) : []
  logs.push(log)
  localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs))
}

// Writes an audit entry. When an authenticated session exists this is recorded
// server-side via the API (identity derived from the session, so the trail is
// tamper-evident). localStorage is only used as a fallback for anonymous users
// or when the server is unreachable. Fire-and-forget: never breaks the UI.
export function addAuditLog(
  type: AuditLogType,
  action: string,
  userId?: string,
  userName?: string,
  details?: string,
  severity: "info" | "warning" | "error" | "critical" = "info",
) {
  try {
    // Server-side recording requires the httpOnly session cookie.
    if (typeof window === "undefined") {
      return null
    }

    fetch("/api/audit-logs", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, action, details, severity }),
    })
      .catch(() => {
        // Fallback: record locally so the entry is not lost entirely.
        const log: AuditLog = {
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          action,
          details: details || undefined,
          severity,
          userId: userId || undefined,
          userName: userName || undefined,
          timestamp: new Date().toISOString(),
        }
        addAuditLogToStorage(log)
      })

    return null
  } catch (error) {
    console.error("Failed to create audit log:", error)
    // Don't throw - audit logging should not break the application
    return null
  }
}
