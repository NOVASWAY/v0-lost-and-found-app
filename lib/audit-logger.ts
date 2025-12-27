import { prisma } from "./db"
import type { AuditLogType } from "./mock-data"

export async function addAuditLog(
  type: AuditLogType,
  action: string,
  userId?: string,
  userName?: string,
  details?: string,
  severity: "info" | "warning" | "error" | "critical" = "info",
) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        type,
        action,
        details: details || null,
        severity,
        userId: userId || null,
      },
    })
    return log
  } catch (error) {
    console.error("Failed to create audit log:", error)
    // Don't throw - audit logging should not break the application
    return null
  }
}

