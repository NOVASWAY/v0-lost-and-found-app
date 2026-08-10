#!/usr/bin/env node
// Generates prisma/schema.postgresql.prisma from prisma/schema.prisma so the
// two provider variants never drift. Run after editing the SQLite schema, then
// commit both files. CI fails if the generated file is out of date.
import { readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const src = readFileSync(join(root, "prisma/schema.prisma"), "utf8")

const postgres = src.replace(
  /^\s*provider\s*=\s*"sqlite"\s*$/m,
  '  provider = "postgresql"',
)

if (!postgres.includes('provider = "postgresql"')) {
  console.error("Failed to rewrite provider in postgres schema")
  process.exit(1)
}

writeFileSync(join(root, "prisma/schema.postgresql.prisma"), postgres)
console.log("Wrote prisma/schema.postgresql.prisma")
