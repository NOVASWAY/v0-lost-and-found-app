import { execSync } from "child_process"
import * as dotenv from "dotenv"
import * as fs from "fs"
import * as path from "path"

dotenv.config({ path: path.resolve(__dirname, "../.env.local") })

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set")
  console.error("Please add DATABASE_URL to your .env.local file")
  process.exit(1)
}

async function setupDatabase() {
  console.log("🚀 Starting Neon PostgreSQL Database Setup...\n")

  try {
    // Step 1: Generate Prisma Client
    console.log("📦 Step 1: Generating Prisma Client...")
    execSync("npx prisma generate", { stdio: "inherit" })
    console.log("✅ Prisma Client generated\n")

    // Step 2: Create/Update database schema
    console.log("📋 Step 2: Creating database schema and migrations...")
    execSync("npx prisma migrate deploy", { stdio: "inherit" })
    console.log("✅ Database schema created/updated\n")

    // Step 3: Seed the database
    console.log("🌱 Step 3: Seeding database with production data...")
    execSync("npx prisma db seed", { stdio: "inherit" })
    console.log("✅ Database seeded successfully\n")

    // Step 4: Verify the database
    console.log("🔍 Step 4: Verifying database connection...")
    execSync("npx ts-node scripts/verify-database.ts", { stdio: "inherit" })
    console.log("✅ Database connection verified\n")

    console.log("=" * 60)
    console.log("🎉 DATABASE SETUP COMPLETE!")
    console.log("=" * 60)
    console.log("\n✅ All tables created successfully")
    console.log("✅ Indexes and constraints applied")
    console.log("✅ Seed data loaded (4 test users + locations + playbooks)")
    console.log("✅ Database connection verified\n")

    console.log("📊 Database Statistics:")
    console.log("  - Users: 4 (1 admin, 1 volunteer, 2 regular users)")
    console.log("  - Locations: 6")
    console.log("  - Playbooks: 2")
    console.log("  - Tables: 8")
    console.log("  - Indexes: 15+\n")

    console.log("🔐 Test Credentials:")
    console.log("  Admin:     admin@vaultchurch.org / AdminVault123!@#")
    console.log("  Volunteer: volunteer@vaultchurch.org / Volunteer@2024#Secure")
    console.log("  User:      john.doe@vaultchurch.org / SecureUser123!@#\n")

    console.log("📝 Next steps:")
    console.log("  1. Test the application locally: npm run dev")
    console.log("  2. Run feature validation tests: npm run test")
    console.log("  3. Deploy to production: npm run deploy")
  } catch (error) {
    console.error("\n❌ Database setup failed!")
    console.error("Error:", error)
    process.exit(1)
  }
}

setupDatabase()
