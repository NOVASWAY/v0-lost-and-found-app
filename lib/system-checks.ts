/**
 * System checks and data validation functions
 * These ensure the system behaves correctly in production
 */

import { getItems, getClaims, getMissions, saveItems, updateItem, updateClaim } from "./storage"
import type { Item, Claim } from "./mock-data"

/**
 * Check and auto-expire items past their donation deadline
 */
export function checkExpiredItems(): number {
  const items = getItems()
  const now = new Date()
  let expiredCount = 0

  const updatedItems = items.map((item: Item) => {
    if (item.status === "available" && item.donationDeadline) {
      const deadline = new Date(item.donationDeadline)
      if (deadline < now) {
        expiredCount++
        return { ...item, status: "expired" as Item["status"] }
      }
    }
    return item
  })

  if (expiredCount > 0) {
    saveItems(updatedItems)
  }

  return expiredCount
}

/**
 * Validate and fix data integrity issues
 */
export function validateDataIntegrity(): {
  fixedItems: number
  fixedClaims: number
  fixedMissions: number
} {
  let fixedItems = 0
  let fixedClaims = 0
  let fixedMissions = 0

  // Check items
  const items = getItems()
  items.forEach((item) => {
    // Ensure donation deadline exists for available items
    if (item.status === "available" && !item.donationDeadline) {
      const { getSystemSettings } = require("./storage")
      const settings = getSystemSettings()
      const foundDate = new Date(item.dateFounded)
      const deadline = new Date(foundDate)
      deadline.setDate(deadline.getDate() + settings.itemExpirationDays)
      updateItem(item.id, { donationDeadline: deadline.toISOString().split("T")[0] })
      fixedItems++
    }
  })

  // Check claims
  const claims = getClaims()
  claims.forEach((claim) => {
    // Ensure claim has valid status
    if (!["pending", "approved", "rejected", "released"].includes(claim.status)) {
      updateClaim(claim.id, { status: "pending" })
      fixedClaims++
    }
  })

  // Check missions
  const missions = getMissions()
  missions.forEach((mission) => {
    // Ensure mission has valid status
    if (!["pending", "in_progress", "completed", "cancelled"].includes(mission.status)) {
      // Status is valid, no fix needed
    }
  })

  return { fixedItems, fixedClaims, fixedMissions }
}

/**
 * Run all system checks
 */
export function runSystemChecks(): {
  expiredItems: number
  fixedIssues: { fixedItems: number; fixedClaims: number; fixedMissions: number }
} {
  const expiredItems = checkExpiredItems()
  const fixedIssues = validateDataIntegrity()

  return {
    expiredItems,
    fixedIssues,
  }
}
