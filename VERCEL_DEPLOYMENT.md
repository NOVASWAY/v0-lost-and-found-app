# Vercel Deployment Guide

Your application is deployed at: **https://v0-lost-and-found-app-sepia-eight.vercel.app/**

## Important: Database Configuration for Vercel

⚠️ **SQLite will NOT work on Vercel** - Vercel uses serverless functions with no persistent file system.

You need to use a cloud database. Here are your options:

### Option 1: Vercel Postgres (Recommended)

1. **Add Vercel Postgres to your project:**
   - Go to your Vercel project dashboard
   - Navigate to Storage → Create Database → Postgres
   - Create a new Postgres database

2. **Update Prisma Schema:**
   - Change the provider in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```

3. **Environment Variables:**
   - Vercel will automatically add `POSTGRES_URL` to your environment variables
   - Update `prisma.config.ts` to use it:
   ```typescript
   datasource: {
     url: process.env["POSTGRES_URL"] || process.env["DATABASE_URL"],
   },
   ```

4. **Run Migrations:**
   - Add a build script to run migrations:
   ```json
   "scripts": {
     "postinstall": "prisma generate",
     "vercel-build": "prisma migrate deploy && prisma generate && next build"
   }
   ```

### Option 2: External PostgreSQL Database

Use services like:
- **Neon** (https://neon.tech) - Serverless Postgres
- **Supabase** (https://supabase.com) - Open source Firebase alternative
- **Railway** (https://railway.app) - Simple database hosting
- **PlanetScale** (https://planetscale.com) - MySQL (requires schema changes)

1. **Get connection string** from your database provider
2. **Add to Vercel Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add `DATABASE_URL` with your PostgreSQL connection string
   - Format: `postgresql://user:password@host:5432/database?sslmode=require`

3. **Update Prisma Schema:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

### Option 3: Turso (libSQL Cloud) - Best for Current Setup

Since you're already using libSQL adapter, Turso is perfect:

1. **Sign up at https://turso.tech**
2. **Create a database**
3. **Get connection string** (libSQL URL format)
4. **Add to Vercel Environment Variables:**
   - Add `DATABASE_URL` with your Turso connection string
   - Format: `libsql://your-db-name-your-org.turso.io?authToken=your-token`

5. **No schema changes needed** - works with current SQLite schema!

## Vercel Build Configuration

### Update package.json scripts:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate",
    "vercel-build": "prisma migrate deploy && prisma generate && next build"
  }
}
```

### Add vercel.json (optional):

```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

## Environment Variables in Vercel

Add these in Vercel Dashboard → Project Settings → Environment Variables:

### Required:
- `DATABASE_URL` - Your database connection string
- `NODE_ENV` - Set to `production`

### Optional:
- `NEXT_PUBLIC_APP_URL` - Your Vercel deployment URL

## Running Migrations on Vercel

### Option 1: During Build (Recommended)
Add to `package.json`:
```json
"vercel-build": "prisma migrate deploy && prisma generate && next build"
```

### Option 2: Manual Migration
After deployment, run migrations manually:
```bash
npx prisma migrate deploy
```

Or use Vercel CLI:
```bash
vercel env pull
npx prisma migrate deploy
```

## Seeding Database on Vercel

After first deployment, seed the database:

1. **Pull environment variables:**
   ```bash
   vercel env pull
   ```

2. **Run seed script:**
   ```bash
   npm run db:seed
   ```

Or create a one-time API route for seeding (admin-only):
```typescript
// app/api/seed/route.ts
export async function POST(request: NextRequest) {
  // Add admin authentication check
  // Run seed script
}
```

## Current Deployment Status

✅ **Frontend**: Deployed and working
⚠️ **Database**: Needs cloud database configuration
⚠️ **API Routes**: Will work once database is configured

## Quick Setup Checklist

- [ ] Choose database provider (Vercel Postgres, Turso, or external PostgreSQL)
- [ ] Update `prisma/schema.prisma` if switching to PostgreSQL
- [ ] Add `DATABASE_URL` to Vercel environment variables
- [ ] Update build scripts in `package.json`
- [ ] Run migrations: `prisma migrate deploy`
- [ ] Seed database with initial data
- [ ] Test API routes on deployed site

## Testing Your Deployment

1. **Check API Routes:**
   - Visit: `https://v0-lost-and-found-app-sepia-eight.vercel.app/api/users`
   - Should return JSON (may be empty until seeded)

2. **Test Login:**
   - Visit: `https://v0-lost-and-found-app-sepia-eight.vercel.app/login`
   - Try logging in (will work once database is seeded)

3. **Check Logs:**
   - Go to Vercel Dashboard → Deployments → View Function Logs
   - Check for any database connection errors

## Troubleshooting

### Error: "Prisma Client has not been initialized"
- Make sure `prisma generate` runs during build
- Check that `postinstall` script includes `prisma generate`

### Error: "Can't reach database server"
- Verify `DATABASE_URL` is set correctly in Vercel
- Check database provider allows connections from Vercel IPs
- For Turso, ensure auth token is included in connection string

### Error: "Migration failed"
- Run `prisma migrate deploy` manually
- Check migration files are committed to git
- Verify database connection is working

## Recommended: Turso Setup (Easiest)

Since you're already using libSQL adapter, Turso is the easiest option:

1. **Sign up**: https://turso.tech
2. **Create database**: `turso db create vault-church-db`
3. **Get connection string**: `turso db show vault-church-db --url`
4. **Add to Vercel**: Set `DATABASE_URL` environment variable
5. **No code changes needed!** Your current setup will work.

---

**Your app is live at**: https://v0-lost-and-found-app-sepia-eight.vercel.app/

Once the database is configured, all features will work on the deployed version! 🚀

