#!/bin/bash
set -e

export DATABASE_PROVIDER=postgresql

# Push schema changes to production DB (creates new tables if missing)
npx prisma db push --schema=prisma/schema.postgresql.prisma --accept-data-loss

# Seed default categories (idempotent upserts)
DATABASE_PROVIDER=postgresql npx tsx scripts/seed-categories.ts

# Generate Prisma client for PostgreSQL
npx prisma generate --schema=prisma/schema.postgresql.prisma

# Build Next.js
next build --webpack
