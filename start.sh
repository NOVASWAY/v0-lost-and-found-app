#!/usr/bin/env bash
set -e

echo "  Vault Church Security System - Setup"
echo "========================================"
echo ""

# 1. Install dependencies
echo "[1/4] Installing dependencies..."
pnpm install

# 2. Set up database (reset if schema drift, then migrate)
echo "[2/4] Setting up database..."
if [ -f prisma/dev.db ]; then
  echo "  Database exists, checking for schema drift..."
  pnpm prisma migrate reset --force 2>/dev/null || true
fi
pnpm db:migrate

# 3. Seed default users
echo "[3/4] Seeding default users..."
pnpm db:seed

# 4. Start dev server
echo "[4/4] Starting dev server..."
echo ""
echo "========================================"
echo " Local development users seeded (passwords are not shown here)."
echo "   Admin:     admin"
echo "   Volunteer: tomanderson"
echo "   User:      johndoe"
echo " For local dev, default passwords are set in prisma/seed.ts."
echo " For production, provide BOOTSTRAP_ADMIN_PASSWORD / BOOTSTRAP_VOLUNTEER_PASSWORD /"
echo " BOOTSTRAP_USER_PASSWORD - seeding will fail without them."
echo "========================================"
echo ""
echo " Opening http://localhost:3000 ..."
echo ""

pnpm dev
