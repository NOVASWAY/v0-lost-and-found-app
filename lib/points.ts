import { prisma } from "@/lib/db"
import { refreshUserRanks } from "@/lib/ranking"

export const DEFAULT_POINT_RULES = {
  item_uploaded: 15,
  claim_submitted: 10,
  item_released: 20,
  mission_completed: 50,
  service_attended: 10,
  service_served: 25,
} as const

export async function awardPoints({
  userId,
  action,
  referenceId,
  fallbackPoints,
}: {
  userId: string
  action: string
  referenceId: string
  fallbackPoints: number
}) {
  const rule = await prisma.pointRule.findUnique({ where: { action } })
  const points = rule?.isActive ? rule.points : fallbackPoints
  if (points <= 0) return { awarded: false, points: 0 }

  try {
    await prisma.pointEvent.create({
      data: { userId, action, referenceId, points },
    })
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { awarded: false, points: 0 }
    }
    throw error
  }

  await prisma.user.update({ where: { id: userId }, data: { vaultPoints: { increment: points } } })
  await refreshUserRanks()
  return { awarded: true, points }
}
