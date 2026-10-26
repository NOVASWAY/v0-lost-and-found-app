import { randomUUID } from "node:crypto"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"

export const POINT_ACTIONS = [
  "item_uploaded",
  "claim_submitted",
  "item_released",
  "mission_completed",
  "service_attended",
  "service_served",
] as const

export type PointAction = (typeof POINT_ACTIONS)[number]

export const DEFAULT_POINT_RULES: Record<PointAction, number> = {
  item_uploaded: 15,
  claim_submitted: 10,
  item_released: 20,
  mission_completed: 50,
  service_attended: 10,
  service_served: 25,
}

export async function awardPoints({
  tx,
  userId,
  action,
  referenceId,
}: {
  tx?: Prisma.TransactionClient
  userId: string
  action: PointAction
  referenceId: string
}) {
  const applyAward = async (client: Prisma.TransactionClient) => {
    const rule = await client.pointRule.findUnique({ where: { action } })
    const points = rule ? (rule.isActive ? rule.points : 0) : DEFAULT_POINT_RULES[action]

    if (!Number.isSafeInteger(points) || points < 0 || points > 10000) {
      throw new Error(`Invalid points configuration for ${action}`)
    }

    // This conflict-safe insert and the balance increment share one transaction,
    // so concurrent retries cannot double-award a completed action.
    const inserted = await client.$executeRaw`
      INSERT INTO "PointEvent" ("id", "action", "referenceId", "points", "userId", "createdAt")
      VALUES (${randomUUID()}, ${action}, ${referenceId}, ${points}, ${userId}, ${new Date()})
      ON CONFLICT ("action", "referenceId", "userId") DO NOTHING
    `

    if (inserted === 0) return { awarded: false, recorded: false, points: 0 }

    if (points > 0) {
      await client.user.update({ where: { id: userId }, data: { vaultPoints: { increment: points } } })
    }

    return { awarded: points > 0, recorded: true, points }
  }

  return tx ? applyAward(tx) : prisma.$transaction((client) => applyAward(client))
}
