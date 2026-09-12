import "dotenv/config"
import { prisma } from "../lib/prisma"

async function main() {
  const locations = [
    { name: "Main Sanctuary", description: "Main worship area", category: "Main Campus" },
    { name: "Fellowship Hall", description: "Community gathering space", category: "Fellowship Hall" },
    { name: "Parking Lot", description: "Parking area", category: "Parking Lot" },
    { name: "Entrance Lobby", description: "Main entrance area", category: "Main Campus" },
    { name: "Children's Ministry Room", description: "Children's activities area", category: "Children's Area" },
    { name: "Youth Room", description: "Youth group meeting space", category: "Youth Wing" },
    { name: "Office Wing", description: "Church offices", category: "Office" },
    { name: "Nursery", description: "Infant/toddler care room", category: "Children's Area" },
  ]

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { name: loc.name },
      update: { category: loc.category },
      create: loc,
    })
  }
  console.log(`Seeded ${locations.length} locations with categories`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
