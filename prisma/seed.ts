import * as bcrypt from "bcryptjs"
import "dotenv/config"
import { prisma } from "../lib/prisma"

async function main() {
  console.log("Seeding database...")

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Admin User",
      username: "admin",
      password: adminPassword,
      role: "admin",
      vaultPoints: 1000,
      rank: 1,
    },
  })

  // Create volunteer user
  const volunteerPassword = await bcrypt.hash("volunteer123", 10)
  const volunteer = await prisma.user.upsert({
    where: { username: "volunteer" },
    update: {},
    create: {
      name: "Tom Anderson",
      username: "volunteer",
      password: volunteerPassword,
      role: "volunteer",
      attendanceCount: 18,
      serviceCount: 12,
      vaultPoints: 500,
      rank: 2,
    },
  })

  // Create regular users
  const userPassword = await bcrypt.hash("user123", 10)
  const defaultPassword = await bcrypt.hash("password123", 10)

  const user1 = await prisma.user.upsert({
    where: { username: "johndoe" },
    update: {},
    create: {
      name: "John Doe",
      username: "johndoe",
      password: userPassword,
      role: "user",
      itemsUploaded: 3,
      claimsSubmitted: 1,
      vaultPoints: 450,
      rank: 4,
      attendanceCount: 8,
      serviceCount: 3,
    },
  })

  const user2 = await prisma.user.upsert({
    where: { username: "sarahjohnson" },
    update: {},
    create: {
      name: "Sarah Johnson",
      username: "sarahjohnson",
      password: defaultPassword,
      role: "user",
      itemsUploaded: 5,
      claimsSubmitted: 2,
      vaultPoints: 850,
      rank: 1,
      attendanceCount: 15,
      serviceCount: 8,
    },
  })

  const user3 = await prisma.user.upsert({
    where: { username: "michaelchen" },
    update: {},
    create: {
      name: "Michael Chen",
      username: "michaelchen",
      password: defaultPassword,
      role: "user",
      itemsUploaded: 2,
      claimsSubmitted: 3,
      vaultPoints: 620,
      rank: 2,
      attendanceCount: 6,
      serviceCount: 2,
    },
  })

  const user4 = await prisma.user.upsert({
    where: { username: "davidpark" },
    update: {},
    create: {
      name: "David Park",
      username: "davidpark",
      password: defaultPassword,
      role: "user",
      itemsUploaded: 1,
      claimsSubmitted: 1,
      vaultPoints: 150,
      rank: 8,
      attendanceCount: 3,
      serviceCount: 0,
    },
  })

  // Create locations
  const locations = [
    { name: "Main Sanctuary - Pew 12", description: "Main worship area" },
    { name: "Fellowship Hall", description: "Community gathering space" },
    { name: "Parking Lot B", description: "Secondary parking area" },
    { name: "Entrance Lobby", description: "Main entrance area" },
    { name: "Children's Ministry Room", description: "Children's activities area" },
    { name: "Youth Room", description: "Youth group meeting space" },
  ]

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { name: loc.name },
      update: {},
      create: loc,
    })
  }

  // Create playbooks
  const playbooks = [
    {
      title: "High-Value Asset Discovery",
      scenario: "Recovery of electronics or jewelry exceeding $500 in value",
      protocol: "Immediate lockdown in Secure Vault B. Require two-person verification for release.",
      priority: "high",
    },
    {
      title: "Suspicious Claim Pattern",
      scenario: "Multiple claims from same entity within 48-hour window",
      protocol: "Flag for Superuser review. Freeze all active claims for the entity.",
      priority: "critical",
    },
  ]

  for (const pb of playbooks) {
    await prisma.playbook.createMany({
      data: pb,
      skipDuplicates: true,
    })
  }

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

