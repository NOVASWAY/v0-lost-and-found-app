#!/bin/bash
set -e

export DATABASE_PROVIDER=postgresql

# Builds must be read-only with respect to the database. Schema changes are
# applied by `prisma migrate deploy` in the deploy workflow; a schema push
# bypasses migration history and `--accept-data-loss` can drop production data.
pnpm exec prisma generate

# Reference data (occurrence categories, locations) is seeded by the deploy
# workflow after migrations, not during the build.

# Build Next.js
next build --webpack
