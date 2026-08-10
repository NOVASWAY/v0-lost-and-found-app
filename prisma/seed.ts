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
  console.log("Seeding database with production users...")

  // Production user accounts with strong passwords
  
  // Create admin user - full system access
  const adminPassword = await bcrypt.hash(
    getBootstrapPassword("BOOTSTRAP_ADMIN_PASSWORD", "SecureAdmin123!"),
    10,
  )
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: { password: adminPassword },
    create: {
      name: "System Administrator",
      username: "admin",
      password: adminPassword,
      role: "admin",
      vaultPoints: 1000,
      rank: 1,
      attendanceCount: 0,
      serviceCount: 0,
      itemsUploaded: 0,
      claimsSubmitted: 0,
    },
  })
  console.log("✓ Admin user created: admin@vaultchurch.org")

  // Create volunteer user - claims approval and release authority
  const volunteerPassword = await bcrypt.hash(
    getBootstrapPassword("BOOTSTRAP_VOLUNTEER_PASSWORD", "VolunteerPass123!"),
    10,
  )
  const volunteer = await prisma.user.upsert({
    where: { username: "tomanderson" },
    update: { password: volunteerPassword },
    create: {
      name: "Tom Anderson - Volunteer Coordinator",
      username: "tomanderson",
      password: volunteerPassword,
      role: "volunteer",
      attendanceCount: 18,
      serviceCount: 12,
      vaultPoints: 500,
      rank: 2,
      itemsUploaded: 0,
      claimsSubmitted: 0,
    },
  })
  console.log("✓ Volunteer user created: tomanderson (Coordinator)")

  // Create regular users - can upload items and claim
  const userPassword = await bcrypt.hash(
    getBootstrapPassword("BOOTSTRAP_USER_PASSWORD", "UserPass123!"),
    10,
  )

  const user1 = await prisma.user.upsert({
    where: { username: "johndoe" },
    update: { password: userPassword },
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
    update: { password: userPassword },
    create: {
      name: "Sarah Johnson",
      username: "sarahjohnson",
      password: userPassword,
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
    update: { password: userPassword },
    create: {
      name: "Michael Chen",
      username: "michaelchen",
      password: userPassword,
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
    update: { password: userPassword },
    create: {
      name: "David Park",
      username: "davidpark",
      password: userPassword,
      role: "user",
      itemsUploaded: 1,
      claimsSubmitted: 1,
      vaultPoints: 150,
      rank: 8,
      attendanceCount: 3,
      serviceCount: 0,
    },
  })

  // Create additional volunteers
  const volunteerPassword2 = await bcrypt.hash(
    getBootstrapPassword("BOOTSTRAP_VOLUNTEER_PASSWORD", "VolunteerPass123!"),
    10,
  )
  
  const volunteer2 = await prisma.user.upsert({
    where: { username: "emilyrodriguez" },
    update: { password: volunteerPassword2 },
    create: {
      name: "Emily Rodriguez",
      username: "emilyrodriguez",
      password: volunteerPassword2,
      role: "volunteer",
      attendanceCount: 20,
      serviceCount: 15,
      vaultPoints: 520,
      rank: 2,
      itemsUploaded: 0,
      claimsSubmitted: 0,
    },
  })

  const volunteer3 = await prisma.user.upsert({
    where: { username: "jenniferwilliams" },
    update: { password: volunteerPassword2 },
    create: {
      name: "Jennifer Williams",
      username: "jenniferwilliams",
      password: volunteerPassword2,
      role: "volunteer",
      attendanceCount: 15,
      serviceCount: 10,
      vaultPoints: 480,
      rank: 2,
      itemsUploaded: 0,
      claimsSubmitted: 0,
    },
  })

  console.log("✓ Regular users created (4 users)")
  console.log("✓ Additional volunteers created (2 volunteers)")

  // Create orders (security directives) for a few users
  const seededUserIds = [user1.id, user2.id]
  const existingOrders = await prisma.order.count({ where: { userId: { in: seededUserIds } } })

  if (existingOrders === 0) {
    const orders = [
      {
        userId: user1.id,
        title: "Security Protocol Update",
        message: "Please ensure all found items are photographed from at least three angles before logging them.",
        status: "unread",
        priority: "high",
      },
      {
        userId: user1.id,
        title: "Vault Access Reminder",
        message: "Reminder: all vault access must be logged with the duty officer before entering the storage area.",
        status: "read",
        priority: "medium",
      },
      {
        userId: user2.id,
        title: "Weekend Coverage Notice",
        message: "Additional coverage requested for the Sunday morning service. Coordinate with the volunteer team.",
        status: "unread",
        priority: "medium",
      },
    ]

    await prisma.order.createMany({ data: orders })
    console.log("✓ Orders created (3 security directives)")
  } else {
    console.log("✓ Orders already present, skipping")
  }

  // Create missions assigned to volunteers and users
  const existingMissions = await prisma.mission.count()
  if (existingMissions === 0) {
    await prisma.mission.createMany({
      data: [
        {
          title: "Count lost & found inventory",
          description: "Perform a full inventory count of the lost & found storage room.",
          instructions: "Use the vault checklist and log any discrepancies with the duty officer.",
          priority: "high",
          status: "in_progress",
          dueDate: "2026-08-15",
          location: "Vault storage room",
          assignedTo: volunteer.id,
          assignedBy: admin.id,
        },
        {
          title: "Audit volunteer release log",
          description: "Cross-check the item release log against approved claims.",
          instructions: "Reconcile the last 30 days of releases and report any unmatched entries.",
          priority: "medium",
          status: "pending",
          dueDate: "2026-08-20",
          location: "Volunteer office",
          assignedTo: user1.id,
          assignedBy: admin.id,
        },
      ],
    })
    console.log("✓ Missions created (2)")
  } else {
    console.log("✓ Missions already present, skipping")
  }

  // Create meeting minutes
  const existingMinutes = await prisma.meetingMinutes.count()
  if (existingMinutes === 0) {
    await prisma.meetingMinutes.createMany({
      data: [
        {
          title: "Volunteer Safety Briefing",
          meetingDate: "2026-08-02",
          location: "Main sanctuary",
          attendees: ["Tom Anderson", "Emily Rodriguez", "John Doe"],
          agenda: ["Review vault access rules", "Update incident response contacts"],
          discussion: "Reminder that all found items must be logged with a photo within 24 hours.",
          actionItems: [
            { item: "Post updated contact list", assignedTo: "Tom Anderson", dueDate: "2026-08-09", status: "pending" },
          ],
          decisions: ["Adopt the two-person rule for vault access."],
          nextMeetingDate: "2026-09-06",
          recordedBy: "System Administrator",
        },
      ],
    })
    console.log("✓ Meeting minutes created (1)")
  } else {
    console.log("✓ Meeting minutes already present, skipping")
  }

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
    const existing = await prisma.playbook.findFirst({ where: { title: pb.title } })
    if (!existing) {
      await prisma.playbook.create({ data: pb })
    }
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
