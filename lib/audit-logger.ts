// Audit logging is server-side only. Login, logout, and password-change events
// are written by their respective API route handlers from the session. This
// module used to POST client-chosen action/details to /api/audit-logs; that
// surface was removed so the trail cannot be forged from the browser.

export type AuditLogType = "login" | "logout" | "user_password_changed"

/** @deprecated No-op — retained so call sites compile until removed. */
export function addAuditLog(..._args: unknown[]) {
  return null
}
