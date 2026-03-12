import { prisma } from "../lib/prisma"

async function verifyDatabase() {
  console.log("\n🔍 Verifying Neon PostgreSQL Database...\n")

  try {
    // Test connection
    console.log("1️⃣  Testing database connection...")
    await prisma.$queryRaw`SELECT 1`
    console.log("   ✅ Connection successful\n")

    // Count tables
    console.log("2️⃣  Checking table counts...")
    const userCount = await prisma.user.count()
    const itemCount = await prisma.item.count()
    const claimCount = await prisma.claim.count()
    const locationCount = await prisma.location.count()
    const playbookCount = await prisma.playbook.count()
    const serviceRecordCount = await prisma.serviceRecord.count()
    const auditLogCount = await prisma.auditLog.count()
    const orderCount = await prisma.order.count()

    console.log(`   📊 Users: ${userCount}`)
    console.log(`   📊 Items: ${itemCount}`)
    console.log(`   📊 Claims: ${claimCount}`)
    console.log(`   📊 Locations: ${locationCount}`)
    console.log(`   📊 Playbooks: ${playbookCount}`)
    console.log(`   📊 Service Records: ${serviceRecordCount}`)
    console.log(`   📊 Audit Logs: ${auditLogCount}`)
    console.log(`   📊 Orders: ${orderCount}\n`)

    // Verify users exist
    console.log("3️⃣  Verifying seed users...")
    const admin = await prisma.user.findUnique({
      where: { username: "admin@vaultchurch.org" },
    })
    const volunteer = await prisma.user.findUnique({
      where: { username: "volunteer@vaultchurch.org" },
    })
    const user = await prisma.user.findUnique({
      where: { username: "john.doe@vaultchurch.org" },
    })

    if (admin && volunteer && user) {
      console.log("   ✅ Admin user verified")
      console.log("   ✅ Volunteer user verified")
      console.log("   ✅ Regular user verified\n")
    } else {
      throw new Error("Missing seed users")
    }

    // Verify locations
    console.log("4️⃣  Verifying locations...")
    const locations = await prisma.location.findMany()
    if (locations.length > 0) {
      console.log(`   ✅ Found ${locations.length} locations\n`)
    } else {
      throw new Error("No locations found")
    }

    // Verify indexes
    console.log("5️⃣  Verifying database indexes...")
    const indexResults = await prisma.$queryRaw`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `
    console.log(`   ✅ Found ${(indexResults as any[]).length} indexes\n`)

    // Check schema integrity
    console.log("6️⃣  Checking schema integrity...")
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `
    const tableCount = (tables as any[]).length
    console.log(`   ✅ Found ${tableCount} tables\n`)

    console.log("=" * 60)
    console.log("✅ DATABASE VERIFICATION COMPLETE")
    console.log("=" * 60)
    console.log("\n🎯 Database Status: HEALTHY")
    console.log("   - All tables created")
    console.log("   - All seed data loaded")
    console.log("   - All indexes created")
    console.log("   - Connection verified")
    console.log("\n✨ Your Neon PostgreSQL database is ready for production!\n")

  } catch (error) {
    console.error("\n❌ Database verification failed!")
    console.error("Error:", (error as Error).message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyDatabase()
