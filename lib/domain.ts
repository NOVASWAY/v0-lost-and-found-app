export const USER_ROLES = ["user", "volunteer", "admin"] as const
export type UserRole = (typeof USER_ROLES)[number]

export const STAFF_ROLES = ["admin", "volunteer"] as const satisfies readonly UserRole[]
export type StaffRole = (typeof STAFF_ROLES)[number]

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole)
}

export function isStaffRole(value: unknown): value is StaffRole {
  return typeof value === "string" && STAFF_ROLES.includes(value as StaffRole)
}

export const ITEM_STATUSES = ["available", "claimed", "released", "donated", "expired"] as const
export type ItemStatus = (typeof ITEM_STATUSES)[number]

export const CLAIM_STATUSES = ["pending", "approved", "released", "rejected"] as const
export type ClaimStatus = (typeof CLAIM_STATUSES)[number]

export const CLAIM_STATUS_TRANSITIONS: Record<ClaimStatus, readonly ClaimStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["released", "rejected"],
  released: [],
  rejected: [],
}

export function isClaimStatus(value: unknown): value is ClaimStatus {
  return typeof value === "string" && CLAIM_STATUSES.includes(value as ClaimStatus)
}

export function canTransitionClaimStatus(from: ClaimStatus, to: ClaimStatus): boolean {
  return CLAIM_STATUS_TRANSITIONS[from].includes(to)
}
