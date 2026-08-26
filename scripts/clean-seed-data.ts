/**
 * Production data cleanup script.
 * Removes all seed-generated fake data: extra users, orders, missions,
 * meeting minutes, playbooks, and resets stats on the 3 essential accounts.
 *
 * Run: DATABASE_PROVIDER=postgresql DATABASE_URL="..." npx tsx scripts/clean-seed-data.ts
 */
import "dotenv/config"
import { prisma } from "../lib/prisma"

const ESSENTIAL_USERS = ["admin", "tomanderson", "johndoe"]

async function main() {
  console.log("Cleaning seed data from database...\n")

  // Delete dependent records first (foreign key constraints)

  // 1. Delete fake orders
  const deletedOrders = await prisma.order.deleteMany()
  console.log(`Deleted ${deletedOrders.count} orders`)

  // 2. Delete fake missions
  const deletedMissions = await prisma.mission.deleteMany()
  console.log(`Deleted ${deletedMissions.count} missions`)

  // 3. Delete fake meeting minutes
  const deletedMinutes = await prisma.meetingMinutes.deleteMany()
  console.log(`Deleted ${deletedMinutes.count} meeting minutes`)

  // 4. Delete fake playbooks
  const deletedPlaybooks = await prisma.playbook.deleteMany()
  console.log(`Deleted ${deletedPlaybooks.count} playbooks`)

  // 5. Delete fake release logs
  const deletedReleases = await prisma.releaseLog.deleteMany()
  console.log(`Deleted ${deletedReleases.count} release logs`)

  // 6. Delete fake claims
  const deletedClaims = await prisma.claim.deleteMany()
  console.log(`Deleted ${deletedClaims.count} claims`)

  // 7. Delete fake items
  const deletedItems = await prisma.item.deleteMany()
  console.log(`Deleted ${deletedItems.count} items`)

  // 8. Delete fake service records
  const deletedServices = await prisma.serviceRecord.deleteMany()
  console.log(`Deleted ${deletedServices.count} service records`)

  // 9. Delete fake audit logs
  const deletedAudit = await prisma.auditLog.deleteMany()
  console.log(`Deleted ${deletedAudit.count} audit logs`)

  // 10. Delete fake users (keep only admin, tomanderson, johndoe)
  const deletedUsers = await prisma.user.deleteMany({
    where: { username: { notIn: ESSENTIAL_USERS } },
  })
  console.log(`Deleted ${deletedUsers.count} fake users`)

  // 11. Reset stats on essential users to zero
  const resetUsers = await prisma.user.updateMany({
    where: { username: { in: ESSENTIAL_USERS } },
    data: {
      vaultPoints: 0,
      rank: 0,
      attendanceCount: 0,
      serviceCount: 0,
      itemsUploaded: 0,
      claimsSubmitted: 0,
    },
  })
  console.log(`Reset stats on ${resetUsers.count} essential users`)

  console.log("\nCleanup complete. Database has only essential data.")
}

main()
  .catch((e) => {
    console.error("Cleanup failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
