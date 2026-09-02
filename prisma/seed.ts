import * as bcrypt from "bcryptjs"
import "dotenv/config"
import { prisma } from "../lib/prisma"

function getBootstrapPassword(envVarName: string, fallback: string): string {
  const fromEnv = process.env[envVarName]
  if (typeof fromEnv === "string" && fromEnv.length > 0) return fromEnv

  if (process.env.NODE_ENV === "production") {
    throw new Error(`Missing ${envVarName} for production seeding.`)
  }

  return fallback
}

async function main() {
  console.log("Seeding database...")

  // --- Essential user accounts only ---

  const adminPassword = await bcrypt.hash(
    getBootstrapPassword("BOOTSTRAP_ADMIN_PASSWORD", "SecureAdmin123!"),
    10,
  )
  await prisma.user.upsert({
    where: { username: "admin" },
    update: { password: adminPassword },
    create: {
      name: "System Administrator",
      username: "admin",
      password: adminPassword,
      role: "admin",
    },
  })

  const volunteerPassword = await bcrypt.hash(
    getBootstrapPassword("BOOTSTRAP_VOLUNTEER_PASSWORD", "VolunteerPass123!"),
    10,
  )
  await prisma.user.upsert({
    where: { username: "tomanderson" },
    update: { password: volunteerPassword },
    create: {
      name: "Tom Anderson",
      username: "tomanderson",
      password: volunteerPassword,
      role: "volunteer",
    },
  })

  const userPassword = await bcrypt.hash(
    getBootstrapPassword("BOOTSTRAP_USER_PASSWORD", "UserPass123!"),
    10,
  )
  await prisma.user.upsert({
    where: { username: "johndoe" },
    update: { password: userPassword },
    create: {
      name: "John Doe",
      username: "johndoe",
      password: userPassword,
      role: "user",
    },
  })

  // --- Church locations (real spaces, not fake data) ---

  const locations = [
    { name: "Main Sanctuary", description: "Main worship area" },
    { name: "Fellowship Hall", description: "Community gathering space" },
    { name: "Parking Lot", description: "Parking area" },
    { name: "Entrance Lobby", description: "Main entrance area" },
    { name: "Children's Ministry Room", description: "Children's activities area" },
    { name: "Youth Room", description: "Youth group meeting space" },
    { name: "Office Wing", description: "Church offices" },
    { name: "Nursery", description: "Infant/toddler care room" },
  ]

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { name: loc.name },
      update: {},
      create: loc,
    })
  }

  // --- Default Occurrence Book categories ---

  const defaultCategories = [
    { name: "Visitor", color: "#6366f1" },
    { name: "Maintenance", color: "#f59e0b" },
    { name: "Medical", color: "#ef4444" },
    { name: "Security", color: "#8b5cf6" },
    { name: "Safety Check", color: "#10b981" },
    { name: "Other", color: "#6b7280" },
  ]

  for (const cat of defaultCategories) {
    await prisma.occurrenceCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
  }

  console.log("Seed complete: 3 users + 8 locations + 6 occurrence categories")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
