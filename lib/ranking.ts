import { prisma } from "@/lib/db"

/** Rebuilds dense competition ranks from the current points leaderboard. */
export async function refreshUserRanks() {
  const users = await prisma.user.findMany({
    select: { id: true, vaultPoints: true },
    orderBy: [{ vaultPoints: "desc" }, { createdAt: "asc" }, { id: "asc" }],
  })

  let previousPoints: number | null = null
  let currentRank = 0

  await prisma.$transaction(
    users.map((user, index) => {
      if (user.vaultPoints !== previousPoints) {
        currentRank = index + 1
        previousPoints = user.vaultPoints
      }

      return prisma.user.update({
        where: { id: user.id },
        data: { rank: currentRank },
      })
    }),
  )

  return currentRank
}
