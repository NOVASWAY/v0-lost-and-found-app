## Neon PostgreSQL Database Setup Guide

This document provides complete instructions for setting up the Vault Church Lost & Found database on Neon PostgreSQL.

### Prerequisites

- Node.js 16+ installed
- Neon account created at https://neon.tech
- Vercel project connected to Neon
- git configured

### Step 1: Get Your Neon Database URL

1. Log in to your Neon Console at https://console.neon.tech
2. Select your project
3. Go to the "Connection string" section
4. Copy the PostgreSQL connection string
5. It should look like: `postgresql://user:password@host/database?sslmode=require`

### Step 2: Configure Environment Variables

1. Create a `.env.local` file in the project root (if it doesn't exist):
   ```bash
   cp .env.example .env.local
   ```

2. Add your Neon database URL:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
   
   # Prisma
   PRISMA_DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
   ```

3. For Vercel deployment, add environment variable in Vercel settings:
   - Go to Project Settings → Environment Variables
   - Add `DATABASE_URL` with your Neon connection string

### Step 3: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

### Step 5: Run Database Migrations

#### Option A: Automated Setup (Recommended)

```bash
npx ts-node scripts/setup-neon-database.ts
```

This script will:
- Generate Prisma Client
- Create all database tables
- Apply security indexes
- Seed test data
- Verify the database connection

#### Option B: Manual Migration

```bash
# Create/update database schema
npx prisma migrate deploy

# Seed test data
npx prisma db seed

# Verify database
npx ts-node scripts/verify-database.ts
```

### Step 6: Verify Setup

Run the verification script:
```bash
npx ts-node scripts/verify-database.ts
```

Expected output:
```
✅ Connection successful
📊 Users: 4
📊 Items: 0
📊 Claims: 0
📊 Locations: 6
📊 Playbooks: 2
✅ Database verification complete
```

### Test Credentials

After successful setup, you can login with:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin@vaultchurch.org | AdminVault123!@# |
| Volunteer | volunteer@vaultchurch.org | Volunteer@2024#Secure |
| User | john.doe@vaultchurch.org | SecureUser123!@# |
| User | sarah.johnson@vaultchurch.org | SecureUser123!@# |

### Database Schema Overview

The system uses 8 core tables:

1. **User** - User accounts with roles (admin, volunteer, user)
2. **Item** - Lost & found items with status tracking
3. **Claim** - Claims submitted on items
4. **ReleaseLog** - History of released items
5. **Location** - Physical locations in the church
6. **Playbook** - Operational procedures
7. **ServiceRecord** - Volunteer service tracking
8. **AuditLog** - Activity audit trail
9. **Order** - System notifications

### Running the Application

After setup, start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at http://localhost:3000

### Troubleshooting

#### Connection Refused
- Check your Neon connection string is correct
- Verify you're using the PostgreSQL connection string (not pooled)
- Check your firewall allows connections to Neon

#### Migration Failed
```bash
# Reset and retry
npx prisma migrate reset
npx ts-node scripts/setup-neon-database.ts
```

#### Missing Tables
```bash
# Reapply migrations
npx prisma migrate deploy

# Reseed data
npx prisma db seed
```

#### Connection Pool Issues
If using serverless functions, add to your Prisma schema:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Then add both URLs to your environment variables.

### Deployment to Vercel

1. Push your code to GitHub
2. In Vercel dashboard, add environment variables:
   - `DATABASE_URL` - Your Neon connection string
3. Vercel will automatically run migrations on deployment
4. Verify deployment by checking application logs

### Backing Up Your Data

To backup your Neon database:

1. In Neon Console, select your branch
2. Click "Backups" tab
3. Click "Create backup"
4. To restore, go to "Restore from backup"

Or using CLI:
```bash
# Export data
npx prisma db pull

# Create a local backup
pg_dump $DATABASE_URL > backup.sql
```

### Monitoring

Monitor your database performance:

1. **Neon Console** - Check connection limits and storage
2. **Vercel Dashboard** - Monitor function execution times
3. **Application Logs** - Check for query errors
4. **Audit Logs** - Review system activity in the admin dashboard

### Support

For issues with:
- **Neon Database**: https://neon.tech/docs
- **Prisma ORM**: https://www.prisma.io/docs
- **Application**: Check SYSTEM_VALIDATION_REPORT.md for troubleshooting

---

**Setup Complete!** Your Neon PostgreSQL database is now ready for production use.
