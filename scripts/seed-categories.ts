import "dotenv/config"
import { prisma } from "../lib/prisma"

async function main() {
  const categories = [
    { name: "Visitor", color: "#6366f1" },
    { name: "Maintenance", color: "#f59e0b" },
    { name: "Medical", color: "#ef4444" },
    { name: "Security", color: "#8b5cf6" },
    { name: "Safety Check", color: "#10b981" },
    { name: "Other", color: "#6b7280" },
  ]
  for (const cat of categories) {
    await prisma.occurrenceCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }
  console.log(`Seeded ${categories.length} occurrence categories`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
