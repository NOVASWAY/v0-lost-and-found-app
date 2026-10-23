// Audit types a client is allowed to record. Every other event is written
// server-side by the route handler that owns it, so the trail cannot be forged
// from the browser.
export type AuditLogType = "login" | "logout" | "user_password_changed"

// Writes an audit entry server-side via the API. Identity is derived from the
// session on the server, so the entry is tamper-evident. Fire-and-forget:
// never breaks the UI. If the server call fails the entry is dropped rather
// than faked locally — the audit trail must only ever contain server-recorded
// events.
export function addAuditLog(type: AuditLogType, action: string, details?: string) {
  try {
    // Server-side recording requires the httpOnly session cookie.
    if (typeof window === "undefined") {
      return null
    }

    fetch("/api/audit-logs", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, action, details }),
    }).catch(() => {
      console.warn("Failed to record audit log:", action)
    })

    return null
  } catch (error) {
    console.error("Failed to create audit log:", error)
    // Don't throw - audit logging should not break the application
    return null
  }
}
