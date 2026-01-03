import type { AuditLogType, AuditLog } from "./mock-data"
import { addAuditLog as addAuditLogToStorage } from "./storage"

export function addAuditLog(
  type: AuditLogType,
  action: string,
  userId?: string,
  userName?: string,
  details?: string,
  severity: "info" | "warning" | "error" | "critical" = "info",
) {
  try {
    // Use localStorage for frontend-only system
    if (typeof window === "undefined") {
      return null
    }

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

    return addAuditLogToStorage(log)
  } catch (error) {
    console.error("Failed to create audit log:", error)
    // Don't throw - audit logging should not break the application
    return null
  }
}

